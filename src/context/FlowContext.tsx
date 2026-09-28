import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { DEFAULT_FLOW } from '../data/defaultFlow';
import { useFlowHistory } from '../hooks/useFlowHistory';
import type { Viewport } from '../hooks/useCanvasInteraction';
import type { Diagnostic, FlowSchema, NodeData, NodeType, Position } from '../types/flow';
import {
  computeDiagnostics, connectNodes, createNode, disconnectNodes, findNode,
  getUpstreamVariables, removeNode, updateNode
} from '../utils/flowGraph';

interface FlowContextValue {
  flow: FlowSchema;
  diagnostics: Diagnostic[];
  selectedNodeId: string | null;
  selectedNode: NodeData | undefined;
  selectNode: (id: string | null) => void;
  viewport: Viewport;
  setPan: (pan: Position) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetViewport: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  loadFlow: (flow: FlowSchema) => void;
  addNode: (type: NodeType) => void;
  deleteNode: (id: string) => void;
  patchNode: (id: string, patch: Partial<Omit<NodeData, 'id' | 'config'>> & { config?: Partial<NodeData['config']> }) => void;
  moveNodeBy: (id: string, delta: Position) => void;
  connect: (sourceId: string, targetId: string) => void;
  disconnect: (sourceId: string, targetId: string) => void;
  upstreamVariablesOf: (nodeId: string) => string[];
}

const FlowContext = createContext<FlowContextValue | null>(null);
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;

export function FlowProvider({ children, initialFlow = DEFAULT_FLOW }: { children: React.ReactNode; initialFlow?: FlowSchema }) {
  const { flow, commit, replace, undo, redo, canUndo, canRedo } = useFlowHistory(initialFlow);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node_greeting');
  const [viewport, setViewport] = useState<Viewport>({ pan: { x: 0, y: 0 }, zoom: 1 });
  const diagnostics = useMemo(() => computeDiagnostics(flow), [flow]);
  const selectedNode = useMemo(() => findNode(flow, selectedNodeId), [flow, selectedNodeId]);

  const setPan = useCallback((pan: Position) => setViewport(v => ({ ...v, pan })), []);
  const zoomIn = useCallback(() => setViewport(v => ({ ...v, zoom: Math.min(v.zoom + ZOOM_STEP, ZOOM_MAX) })), []);
  const zoomOut = useCallback(() => setViewport(v => ({ ...v, zoom: Math.max(v.zoom - ZOOM_STEP, ZOOM_MIN) })), []);
  const resetViewport = useCallback(() => setViewport(v => ({ ...v, pan: { x: 0, y: 0 } })), []);
  const loadFlow = useCallback((next: FlowSchema) => commit(next), [commit]);

  const addNode = useCallback((type: NodeType) => {
    const node = createNode(type, { x: -viewport.pan.x + 400 + Math.random() * 50, y: -viewport.pan.y + 300 + Math.random() * 50 });
    commit({ ...flow, nodes: [...flow.nodes, node] });
    setSelectedNodeId(node.id);
  }, [flow, commit, viewport.pan]);

  const deleteNode = useCallback((id: string) => {
    commit(removeNode(flow, id));
    setSelectedNodeId(current => (current === id ? null : current));
  }, [flow, commit]);

  const patchNode: FlowContextValue['patchNode'] = useCallback((id, patch) => {
    commit(updateNode(flow, id, n => ({ ...n, ...patch, config: patch.config ? { ...n.config, ...patch.config } : n.config })));
  }, [flow, commit]);

  const moveNodeBy = useCallback((id: string, delta: Position) => {
    replace(updateNode(flow, id, n => ({ ...n, position: { x: n.position.x + delta.x, y: n.position.y + delta.y } })));
  }, [flow, replace]);

  const connect = useCallback((sourceId: string, targetId: string) => {
    const next = connectNodes(flow, sourceId, targetId);
    if (next !== flow) commit(next);
  }, [flow, commit]);

  const disconnect = useCallback((sourceId: string, targetId: string) => {
    commit(disconnectNodes(flow, sourceId, targetId));
  }, [flow, commit]);

  const upstreamVariablesOf = useCallback((nodeId: string) => getUpstreamVariables(flow, nodeId), [flow]);

  const value = useMemo<FlowContextValue>(() => ({
    flow, diagnostics, selectedNodeId, selectedNode, selectNode: setSelectedNodeId,
    viewport, setPan, zoomIn, zoomOut, resetViewport, canUndo, canRedo, undo, redo,
    loadFlow, addNode, deleteNode, patchNode, moveNodeBy, connect, disconnect, upstreamVariablesOf
  }), [
    flow, diagnostics, selectedNodeId, selectedNode, viewport, setPan, zoomIn, zoomOut, resetViewport,
    canUndo, canRedo, undo, redo, loadFlow, addNode, deleteNode, patchNode, moveNodeBy, connect, disconnect, upstreamVariablesOf
  ]);

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}

export function useFlow(): FlowContextValue {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error('useFlow must be used within <FlowProvider>');
  return ctx;
}
