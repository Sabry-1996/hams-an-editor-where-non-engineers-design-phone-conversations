import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { DEFAULT_FLOW } from '../data/defaultFlow';
import { useFlowHistory } from '../hooks/useFlowHistory';
import type { Diagnostic, Flow, FlowNode, NodeData, NodeKind, Position } from '../types/flow';
import { DEFAULT_NODE_SIZE, MAIN_GAP, layoutFlow, type LayoutDirection, type NodeSize } from '../utils/autoLayout';
import {
  computeDiagnostics, connectNodes, createNode, findNode,
  getUpstreamVariables, outgoing, removeNodes, updateNode
} from '../utils/flowGraph';

export interface NodeMove { id: string; position: Position }
export interface RevealRequest { id: string; version: number }

interface FlowContextValue {
  flow: Flow;
  diagnostics: Diagnostic[];
  selectedIds: string[];
  selectedNode: FlowNode | undefined;
  setSelection: (updater: (prev: string[]) => string[]) => void;
  selectNode: (id: string) => void;
  clearSelection: () => void;
  revealRequest: RevealRequest | null;
  revealNode: (id: string) => void;
  layoutDirection: LayoutDirection;
  layoutVersion: number;
  setLayoutDirection: (direction: LayoutDirection) => void;
  tidyUp: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  loadFlow: (flow: Flow) => void;
  /** Adds a step on a free exit of a step, or in the middle of an existing connection. */
  addNode: (kind: NodeKind, target: AddTarget) => void;
  deleteElements: (nodeIds: string[], edgeIds: string[]) => void;
  deleteSelected: () => void;
  renameNode: (id: string, label: string) => void;
  renameFlow: (name: string) => void;
  setNodeData: (id: string, data: NodeData) => void;
  moveNodes: (moves: NodeMove[], final: boolean) => void;
  connect: (from: string, to: string, branch?: string) => void;
  disconnect: (edgeId: string) => void;
  upstreamVariablesOf: (nodeId: string) => string[];
  reportNodeSize: (id: string, size: NodeSize) => void;
}

const FlowContext = createContext<FlowContextValue | null>(null);

/** Where a new step goes: after a given step, or free on the board when `afterId` is missing. */
export type AddTarget = { afterId?: string };

/** Condition rules point at node ids, so re-aim them when a step is inserted in front of a target. */
function retargetCondition(node: FlowNode, from: string, to: string): FlowNode {
  if (node.data.kind !== 'condition') return node;
  const data = node.data;
  return {
    ...node,
    data: {
      ...data,
      rules: data.rules.map(rule => (rule.branch === from ? { ...rule, branch: to } : rule)),
      elseBranch: data.elseBranch === from ? to : data.elseBranch
    }
  };
}

/** New step's single exit toward `targetId`; a new condition sends everything there until Reem adds rules. */
function continueTo(flow: Flow, node: FlowNode, targetId: string): Flow {
  if (node.data.kind === 'end') return flow;
  const branch = node.data.kind === 'tool' ? 'ok' : undefined;
  const next = connectNodes(flow, node.id, targetId, branch);
  if (node.data.kind !== 'condition') return next;
  return updateNode(next, node.id, n => (n.data.kind === 'condition' ? { ...n, data: { ...n.data, elseBranch: targetId } } : n));
}

function insertOnEdge(flow: Flow, edgeId: string, node: FlowNode): Flow {
  const edge = flow.edges.find(e => e.id === edgeId);
  if (!edge) return flow;
  let next: Flow = {
    ...flow,
    edges: flow.edges.map(e => (e.id === edgeId ? { ...e, to: node.id } : e)),
    nodes: flow.nodes.map(n => (n.id === edge.from ? retargetCondition(n, edge.to, node.id) : n))
  };
  next = continueTo(next, node, edge.to);
  return next;
}

/**
 * Puts `node` right after `anchor`: on a free exit when there is one, otherwise
 * between the anchor and whatever it already leads to, so nothing gets disconnected.
 */
function attachAfter(flow: Flow, anchor: FlowNode, node: FlowNode): Flow {
  const outs = outgoing(flow, anchor.id);
  switch (anchor.data.kind) {
    case 'end':
      return flow;
    case 'tool': {
      const taken = new Set(outs.map(e => e.branch));
      const free = (['ok', 'error'] as const).find(b => !taken.has(b));
      if (free) return connectNodes(flow, anchor.id, node.id, free);
      const okEdge = outs.find(e => e.branch === 'ok') ?? outs[0];
      return insertOnEdge(flow, okEdge.id, node);
    }
    case 'condition': {
      const elseId = anchor.data.elseBranch;
      const elseEdge = elseId ? outs.find(e => e.to === elseId) : undefined;
      if (elseEdge) return insertOnEdge(flow, elseEdge.id, node);
      const next = connectNodes(flow, anchor.id, node.id);
      return updateNode(next, anchor.id, n => (n.data.kind === 'condition' ? { ...n, data: { ...n.data, elseBranch: node.id } } : n));
    }
    default:
      return outs.length ? insertOnEdge(flow, outs[0].id, node) : connectNodes(flow, anchor.id, node.id);
  }
}

/**
 * Puts the new step right below (or beside) its anchor and pushes only the steps
 * downstream of it out of the way, so the rest of Reem's map stays where it was.
 */
function placeAfterAnchor(
  flow: Flow, anchor: FlowNode, nodeId: string, direction: LayoutDirection, sizes: Map<string, NodeSize>
): Flow {
  const anchorSize = sizes.get(anchor.id) ?? DEFAULT_NODE_SIZE;
  const size = DEFAULT_NODE_SIZE;
  const branch = flow.edges.find(e => e.from === anchor.id && e.to === nodeId)?.branch;
  // A tool's ok/error exits sit at 35% / 65%, so a branch child leans to that side.
  const lean = branch === 'ok' ? -0.5 : branch === 'error' ? 0.5 : 0;
  const vertical = direction === 'vertical';
  const position: Position = vertical
    ? { x: anchor.position.x + (anchorSize.width - size.width) / 2 + lean * (size.width + 40), y: anchor.position.y + anchorSize.height + MAIN_GAP }
    : { x: anchor.position.x + anchorSize.width + MAIN_GAP, y: anchor.position.y + (anchorSize.height - size.height) / 2 + lean * (size.height + 40) };
  const mainOf = (p: Position) => (vertical ? p.y : p.x);

  // Everything reachable from the new step that lies past the anchor along the main axis moves down.
  const downstream = new Set<string>();
  const queue = flow.edges.filter(e => e.from === nodeId).map(e => e.to);
  while (queue.length) {
    const id = queue.pop()!;
    if (id === nodeId || downstream.has(id)) continue;
    downstream.add(id);
    flow.edges.filter(e => e.from === id).forEach(e => queue.push(e.to));
  }
  const moving = flow.nodes.filter(n => downstream.has(n.id) && mainOf(n.position) > mainOf(anchor.position));
  if (moving.length === 0) return { ...flow, nodes: flow.nodes.map(n => (n.id === nodeId ? { ...n, position } : n)) };

  // Push just enough that the nearest moved step keeps the usual gap below the new one.
  const nearest = Math.min(...moving.map(n => mainOf(n.position)));
  const needed = mainOf(position) + (vertical ? size.height : size.width) + MAIN_GAP;
  const shift = Math.max(0, needed - nearest);
  const movingIds = new Set(moving.map(n => n.id));
  return {
    ...flow,
    nodes: flow.nodes.map(n => {
      if (n.id === nodeId) return { ...n, position };
      if (!movingIds.has(n.id)) return n;
      return { ...n, position: vertical ? { x: n.position.x, y: n.position.y + shift } : { x: n.position.x + shift, y: n.position.y } };
    })
  };
}

function freeSpot(flow: Flow, direction: LayoutDirection): Position {
  if (flow.nodes.length === 0) return { x: 40, y: 40 };
  const maxX = Math.max(...flow.nodes.map(n => n.position.x));
  const maxY = Math.max(...flow.nodes.map(n => n.position.y));
  return direction === 'horizontal' ? { x: maxX + 320, y: 40 } : { x: 40, y: maxY + 200 };
}

export function FlowProvider({ children, initialFlow = DEFAULT_FLOW }: { children: React.ReactNode; initialFlow?: Flow }) {
  const [startFlow] = useState(() => layoutFlow(initialFlow, 'vertical'));
  const { flow, commit, replace, undo, redo, canUndo, canRedo } = useFlowHistory(startFlow);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [revealRequest, setRevealRequest] = useState<RevealRequest | null>(null);
  const [layoutDirection, setDirection] = useState<LayoutDirection>('vertical');
  const [layoutVersion, setLayoutVersion] = useState(0);
  const sizesRef = useRef<Map<string, NodeSize>>(new Map());

  const diagnostics = useMemo(() => computeDiagnostics(flow), [flow]);
  const selectedNode = selectedIds.length === 1 ? findNode(flow, selectedIds[0]) : undefined;

  const setSelection = useCallback((updater: (prev: string[]) => string[]) => setSelectedIds(updater), []);
  const selectNode = useCallback((id: string) => setSelectedIds([id]), []);
  const clearSelection = useCallback(() => setSelectedIds([]), []);
  const revealNode = useCallback((id: string) => {
    setSelectedIds([id]);
    setRevealRequest(prev => ({ id, version: (prev?.version ?? 0) + 1 }));
  }, []);

  const reportNodeSize = useCallback((id: string, size: NodeSize) => { sizesRef.current.set(id, size); }, []);

  const loadFlow = useCallback((next: Flow) => {
    commit(next);
    setSelectedIds([]);
  }, [commit]);

  const relayout = useCallback((direction: LayoutDirection) => {
    commit(current => layoutFlow(current, direction, sizesRef.current));
    setLayoutVersion(v => v + 1);
  }, [commit]);

  const setLayoutDirection = useCallback((direction: LayoutDirection) => {
    setDirection(direction);
    relayout(direction);
  }, [relayout]);

  const tidyUp = useCallback(() => relayout(layoutDirection), [relayout, layoutDirection]);

  const addNode = useCallback((kind: NodeKind, target: AddTarget) => {
    const id = `node_${Date.now().toString(36)}`;
    commit(current => {
      const anchor = target.afterId ? findNode(current, target.afterId) : undefined;
      const node = { ...createNode(kind, anchor?.position ?? freeSpot(current, layoutDirection)), id };
      let next: Flow = { ...current, nodes: [...current.nodes, node] };
      if (!anchor) return next;
      next = attachAfter(next, anchor, node);
      return placeAfterAnchor(next, anchor, id, layoutDirection, sizesRef.current);
    });
    setSelectedIds([id]);
    setLayoutVersion(v => v + 1);
  }, [commit, layoutDirection]);

  const deleteElements = useCallback((nodeIds: string[], edgeIds: string[]) => {
    if (nodeIds.length === 0 && edgeIds.length === 0) return;
    const dropNodes = new Set(nodeIds);
    const dropEdges = new Set(edgeIds);
    commit(current => {
      const next = removeNodes(current, nodeIds);
      return { ...next, edges: next.edges.filter(e => !dropEdges.has(e.id)) };
    });
    setSelectedIds(prev => prev.filter(id => !dropNodes.has(id)));
  }, [commit]);

  const deleteSelected = useCallback(() => deleteElements(selectedIds, []), [deleteElements, selectedIds]);

  const renameNode = useCallback((id: string, label: string) => {
    commit(current => updateNode(current, id, n => ({ ...n, label })));
  }, [commit]);

  const renameFlow = useCallback((name: string) => {
    commit(current => ({ ...current, name }));
  }, [commit]);

  const setNodeData = useCallback((id: string, data: NodeData) => {
    commit(current => updateNode(current, id, n => ({ ...n, data })));
  }, [commit]);

  const moveNodes = useCallback((moves: NodeMove[], final: boolean) => {
    const byId = new Map(moves.map(m => [m.id, m.position]));
    const apply = (current: Flow): Flow => ({
      ...current,
      nodes: current.nodes.map(n => {
        const position = byId.get(n.id);
        return position ? { ...n, position } : n;
      })
    });
    if (final) commit(apply);
    else replace(apply);
  }, [commit, replace]);

  const connect = useCallback((from: string, to: string, branch?: string) => {
    commit(current => {
      const source = findNode(current, from);
      let named = branch;
      if (!named && source?.data.kind === 'tool') {
        const taken = new Set(outgoing(current, from).map(edge => edge.branch));
        named = taken.has('ok') ? 'error' : 'ok';
      }
      return connectNodes(current, from, to, named);
    });
  }, [commit]);

  const disconnect = useCallback((edgeId: string) => {
    commit(current => ({ ...current, edges: current.edges.filter(e => e.id !== edgeId) }));
  }, [commit]);

  const upstreamVariablesOf = useCallback((nodeId: string) => getUpstreamVariables(flow, nodeId), [flow]);

  const value = useMemo<FlowContextValue>(() => ({
    flow, diagnostics, selectedIds, selectedNode, setSelection, selectNode, clearSelection,
    revealRequest, revealNode, layoutDirection, layoutVersion, setLayoutDirection, tidyUp,
    canUndo, canRedo, undo, redo, loadFlow, addNode, deleteElements, deleteSelected,
    renameNode, renameFlow, setNodeData, moveNodes, connect, disconnect, upstreamVariablesOf, reportNodeSize
  }), [
    flow, diagnostics, selectedIds, selectedNode, setSelection, selectNode, clearSelection,
    revealRequest, revealNode, layoutDirection, layoutVersion, setLayoutDirection, tidyUp,
    canUndo, canRedo, undo, redo, loadFlow, addNode, deleteElements, deleteSelected,
    renameNode, renameFlow, setNodeData, moveNodes, connect, disconnect, upstreamVariablesOf, reportNodeSize
  ]);

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}

export function useFlow(): FlowContextValue {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error('useFlow must be used within <FlowProvider>');
  return ctx;
}
