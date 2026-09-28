import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { DEFAULT_FLOW } from '../data/defaultFlow';
import { useFlowHistory } from '../hooks/useFlowHistory';
import type { Viewport } from '../hooks/useCanvasInteraction';
import type { Diagnostic, Flow, FlowNode, NodeData, NodeKind, Position } from '../types/flow';
import {
  computeDiagnostics, connectNodes, createNode, disconnectEdge, findNode,
  getUpstreamVariables, outgoing, removeNodes, updateNode
} from '../utils/flowGraph';

interface FlowContextValue {
  flow: Flow;
  diagnostics: Diagnostic[];
  selectedIds: string[];
  selectedNode: FlowNode | undefined;
  selectNode: (id: string, additive?: boolean) => void;
  clearSelection: () => void;
  viewport: Viewport;
  setPan: (pan: Position) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetViewport: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  loadFlow: (flow: Flow) => void;
  addNode: (kind: NodeKind) => void;
  deleteSelected: () => void;
  renameNode: (id: string, label: string) => void;
  setNodeData: (id: string, data: NodeData) => void;
  moveNodeBy: (id: string, delta: Position) => void;
  commitPositions: () => void;
  nudgeSelection: (delta: Position) => void;
  connect: (from: string, to: string, branch?: string) => void;
  disconnect: (edgeId: string) => void;
  upstreamVariablesOf: (nodeId: string) => string[];
}

const FlowContext = createContext<FlowContextValue | null>(null);
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;

export function FlowProvider({ children, initialFlow = DEFAULT_FLOW }: { children: React.ReactNode; initialFlow?: Flow }) {
  const { flow, commit, replace, undo, redo, canUndo, canRedo } = useFlowHistory(initialFlow);
  const [selectedIds, setSelectedIds] = useState<string[]>(['greet']);
  const [viewport, setViewport] = useState<Viewport>({ pan: { x: 0, y: 0 }, zoom: 1 });

  const diagnostics = useMemo(() => computeDiagnostics(flow), [flow]);
  const selectedNode = selectedIds.length === 1 ? findNode(flow, selectedIds[0]) : undefined;

  const setPan = useCallback((pan: Position) => setViewport(v => ({ ...v, pan })), []);
  const zoomIn = useCallback(() => setViewport(v => ({ ...v, zoom: Math.min(v.zoom + ZOOM_STEP, ZOOM_MAX) })), []);
  const zoomOut = useCallback(() => setViewport(v => ({ ...v, zoom: Math.max(v.zoom - ZOOM_STEP, ZOOM_MIN) })), []);
  const resetViewport = useCallback(() => setViewport(v => ({ ...v, pan: { x: 0, y: 0 } })), []);
  const loadFlow = useCallback((next: Flow) => {
    commit(next);
    setSelectedIds([]);
  }, [commit]);

  const selectNode = useCallback((id: string, additive = false) => {
    setSelectedIds(current => {
      if (!additive) return [id];
      return current.includes(id) ? current.filter(item => item !== id) : [...current, id];
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  const addNode = useCallback((kind: NodeKind) => {
    const node = createNode(kind, {
      x: -viewport.pan.x / viewport.zoom + 280,
      y: -viewport.pan.y / viewport.zoom + 180
    });
    commit({ ...flow, nodes: [...flow.nodes, node] });
    setSelectedIds([node.id]);
  }, [flow, commit, viewport]);

  const deleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    commit(removeNodes(flow, selectedIds));
    setSelectedIds([]);
  }, [flow, commit, selectedIds]);

  const renameNode = useCallback((id: string, label: string) => {
    commit(updateNode(flow, id, n => ({ ...n, label })));
  }, [flow, commit]);

  const setNodeData = useCallback((id: string, data: NodeData) => {
    commit(updateNode(flow, id, n => ({ ...n, data })));
  }, [flow, commit]);

  const moveNodeBy = useCallback((id: string, delta: Position) => {
    replace(updateNode(flow, id, n => ({ ...n, position: { x: n.position.x + delta.x, y: n.position.y + delta.y } })));
  }, [flow, replace]);

  const commitPositions = useCallback(() => commit(flow), [flow, commit]);

  const nudgeSelection = useCallback((delta: Position) => {
    if (selectedIds.length === 0) return;
    const ids = new Set(selectedIds);
    commit({
      ...flow,
      nodes: flow.nodes.map(n => ids.has(n.id) ? { ...n, position: { x: n.position.x + delta.x, y: n.position.y + delta.y } } : n)
    });
  }, [flow, commit, selectedIds]);

  const connect = useCallback((from: string, to: string, branch?: string) => {
    const source = findNode(flow, from);
    let named = branch;
    if (!named && source?.data.kind === 'tool') {
      const taken = new Set(outgoing(flow, from).map(edge => edge.branch));
      named = taken.has('ok') ? 'error' : 'ok';
    }
    const next = connectNodes(flow, from, to, named);
    if (next !== flow) commit(next);
  }, [flow, commit]);

  const disconnect = useCallback((edgeId: string) => commit(disconnectEdge(flow, edgeId)), [flow, commit]);
  const upstreamVariablesOf = useCallback((nodeId: string) => getUpstreamVariables(flow, nodeId), [flow]);

  const value = useMemo<FlowContextValue>(() => ({
    flow, diagnostics, selectedIds, selectedNode, selectNode, clearSelection,
    viewport, setPan, zoomIn, zoomOut, resetViewport, canUndo, canRedo, undo, redo,
    loadFlow, addNode, deleteSelected, renameNode, setNodeData, moveNodeBy, commitPositions, nudgeSelection,
    connect, disconnect, upstreamVariablesOf
  }), [
    flow, diagnostics, selectedIds, selectedNode, selectNode, clearSelection,
    viewport, setPan, zoomIn, zoomOut, resetViewport, canUndo, canRedo, undo, redo,
    loadFlow, addNode, deleteSelected, renameNode, setNodeData, moveNodeBy, commitPositions, nudgeSelection,
    connect, disconnect, upstreamVariablesOf
  ]);

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}

export function useFlow(): FlowContextValue {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error('useFlow must be used within <FlowProvider>');
  return ctx;
}
