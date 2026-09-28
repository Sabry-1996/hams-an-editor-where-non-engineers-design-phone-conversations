import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { DEFAULT_FLOW } from '../data/defaultFlow';
import { useFlowHistory } from '../hooks/useFlowHistory';
import type { Diagnostic, Flow, FlowNode, NodeData, NodeKind, Position } from '../types/flow';
import { layoutFlow, type LayoutDirection, type NodeSize } from '../utils/autoLayout';
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
  addNode: (kind: NodeKind) => void;
  deleteElements: (nodeIds: string[], edgeIds: string[]) => void;
  deleteSelected: () => void;
  renameNode: (id: string, label: string) => void;
  setNodeData: (id: string, data: NodeData) => void;
  moveNodes: (moves: NodeMove[], final: boolean) => void;
  connect: (from: string, to: string, branch?: string) => void;
  disconnect: (edgeId: string) => void;
  upstreamVariablesOf: (nodeId: string) => string[];
  reportNodeSize: (id: string, size: NodeSize) => void;
}

const FlowContext = createContext<FlowContextValue | null>(null);

/** Which exit a new step should hang off when Reem adds it after the selected step. */
function freeBranch(flow: Flow, source: FlowNode): string | undefined | false {
  const outs = outgoing(flow, source.id);
  if (source.data.kind === 'end') return false;
  if (source.data.kind === 'tool') {
    const taken = new Set(outs.map(e => e.branch));
    if (!taken.has('ok')) return 'ok';
    if (!taken.has('error')) return 'error';
    return false;
  }
  if (source.data.kind === 'condition') return undefined;
  return outs.length === 0 ? undefined : false;
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

  const addNode = useCallback((kind: NodeKind) => {
    const id = `node_${Date.now().toString(36)}`;
    commit(current => {
      const anchor = selectedIds.length === 1 ? findNode(current, selectedIds[0]) : current.nodes[current.nodes.length - 1];
      const base = anchor?.position ?? { x: 40, y: 40 };
      const offset = layoutDirection === 'horizontal' ? { x: 320, y: 0 } : { x: 0, y: 200 };
      const node = { ...createNode(kind, { x: base.x + offset.x, y: base.y + offset.y }), id };
      let next: Flow = { ...current, nodes: [...current.nodes, node] };
      if (anchor) {
        const branch = freeBranch(next, anchor);
        if (branch !== false) next = connectNodes(next, anchor.id, id, branch);
      }
      return layoutFlow(next, layoutDirection, sizesRef.current);
    });
    setSelectedIds([id]);
    setLayoutVersion(v => v + 1);
  }, [commit, selectedIds, layoutDirection]);

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
    renameNode, setNodeData, moveNodes, connect, disconnect, upstreamVariablesOf, reportNodeSize
  }), [
    flow, diagnostics, selectedIds, selectedNode, setSelection, selectNode, clearSelection,
    revealRequest, revealNode, layoutDirection, layoutVersion, setLayoutDirection, tidyUp,
    canUndo, canRedo, undo, redo, loadFlow, addNode, deleteElements, deleteSelected,
    renameNode, setNodeData, moveNodes, connect, disconnect, upstreamVariablesOf, reportNodeSize
  ]);

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}

export function useFlow(): FlowContextValue {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error('useFlow must be used within <FlowProvider>');
  return ctx;
}
