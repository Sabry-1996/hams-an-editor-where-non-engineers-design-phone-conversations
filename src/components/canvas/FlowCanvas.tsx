import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Background, BackgroundVariant, MarkerType, ReactFlow, getNodesBounds, useReactFlow, useUpdateNodeInternals,
  type Connection, type Edge, type EdgeChange, type NodeChange, type OnDelete
} from '@xyflow/react';
import { useFlow } from '../../context/FlowContext';
import { useSimulator } from '../../context/SimulatorContext';
import { useAnimatedNodes } from '../../hooks/useAnimatedNodes';
import { useI18n } from '../../i18n/I18nContext';
import { BoardControls } from './BoardControls';
import { EDGE_COLORS } from './nodeStyles';
import { StepNode, type StepRFNode } from './StepNode';

const nodeTypes = { step: StepNode };

export function FlowCanvas({ onQuickCall }: { onQuickCall: () => void }) {
  const { t } = useI18n();
  const {
    flow, diagnostics, selectedIds, setSelection, clearSelection, revealRequest,
    layoutDirection, layoutVersion, moveNodes, connect, deleteElements, reportNodeSize
  } = useFlow();
  const { simulator } = useSimulator();
  const { fitView, fitBounds, getNodes } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([]);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const onPaneClick = useCallback(() => {
    clearSelection();
    setPaletteOpen(false);
  }, [clearSelection]);

  const hidePalette = useCallback(() => setPaletteOpen(false), []);

  const issues = useMemo(() => new Set(diagnostics.map(d => d.nodeId).filter(Boolean)), [diagnostics]);
  const activeId = simulator.active ? simulator.currentNodeId : null;

  const rfNodes = useMemo<StepRFNode[]>(() => flow.nodes.map(node => ({
    id: node.id,
    type: 'step',
    position: node.position,
    selected: selectedIds.includes(node.id),
    data: { node, direction: layoutDirection, active: node.id === activeId, hasIssue: issues.has(node.id) }
  })), [flow.nodes, selectedIds, layoutDirection, activeId, issues]);

  const rfEdges = useMemo<Edge[]>(() => flow.edges.map(edge => {
    const source = flow.nodes.find(n => n.id === edge.from);
    const color = edge.branch === 'error' ? EDGE_COLORS.error : EDGE_COLORS.default;
    return {
      id: edge.id,
      source: edge.from,
      target: edge.to,
      sourceHandle: source?.data.kind === 'tool' ? (edge.branch ?? 'ok') : undefined,
      type: 'smoothstep',
      label: edge.branch,
      labelStyle: { fill: color, fontSize: 10, fontFamily: 'ui-monospace, monospace', fontWeight: 600 },
      labelBgStyle: { fill: '#ffffff', stroke: '#e0e1e4' },
      labelBgPadding: [6, 3] as [number, number],
      labelBgBorderRadius: 6,
      selected: selectedEdgeIds.includes(edge.id),
      style: { stroke: color, strokeWidth: 1.75 },
      markerEnd: { type: MarkerType.ArrowClosed, color }
    };
  }), [flow.edges, flow.nodes, selectedEdgeIds]);

  const displayNodes = useAnimatedNodes(rfNodes, layoutVersion);

  useEffect(() => {
    updateNodeInternals(flow.nodes.map(n => n.id));
  }, [layoutDirection, flow.nodes, updateNodeInternals]);

  useEffect(() => {
    if (revealRequest) fitView({ nodes: [{ id: revealRequest.id }], duration: 400, maxZoom: 1.2, padding: 0.6 });
  }, [revealRequest, fitView]);

  // A layout switch rearranges every step; glide the camera so the whole flow ends centered.
  useEffect(() => {
    if (!layoutVersion) return;
    void fitBounds(getNodesBounds(getNodes()), { duration: 400, padding: 0.25 });
  }, [layoutVersion, fitBounds, getNodes]);

  const onNodesChange = useCallback((changes: NodeChange<StepRFNode>[]) => {
    const moves: Array<{ id: string; position: { x: number; y: number }; dragging?: boolean }> = [];
    const selects: Array<{ id: string; selected: boolean }> = [];
    changes.forEach(change => {
      if (change.type === 'position' && change.position) moves.push({ id: change.id, position: change.position, dragging: change.dragging });
      if (change.type === 'select') selects.push({ id: change.id, selected: change.selected });
      if (change.type === 'dimensions' && change.dimensions) reportNodeSize(change.id, change.dimensions);
    });
    if (moves.length) moveNodes(moves, moves.some(m => !m.dragging));
    if (selects.length) {
      setSelection(prev => {
        const next = new Set(prev);
        selects.forEach(s => (s.selected ? next.add(s.id) : next.delete(s.id)));
        return [...next];
      });
    }
  }, [moveNodes, setSelection, reportNodeSize]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setSelectedEdgeIds(prev => {
      const next = new Set(prev);
      changes.forEach(change => {
        if (change.type === 'select') change.selected ? next.add(change.id) : next.delete(change.id);
        if (change.type === 'remove') next.delete(change.id);
      });
      return [...next];
    });
  }, []);

  const onDelete: OnDelete = useCallback(({ nodes, edges }) => {
    deleteElements(nodes.map(n => n.id), edges.map(e => e.id));
  }, [deleteElements]);

  const onConnect = useCallback((connection: Connection) => {
    if (connection.source && connection.target) connect(connection.source, connection.target, connection.sourceHandle ?? undefined);
  }, [connect]);

  return (
    <div className="flex-1 relative" dir="ltr" role="application" aria-label={t('tab_canvas')}>
      <ReactFlow
        nodes={displayNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        onPaneClick={onPaneClick}
        onMoveStart={hidePalette}
        colorMode="light"
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
        minZoom={0.3}
        maxZoom={1.6}
        deleteKeyCode={['Delete', 'Backspace']}
        multiSelectionKeyCode={['Shift', 'Control', 'Meta']}
        className="bg-surface"
      >
        <Background variant={BackgroundVariant.Dots} gap={28} size={1.5} color="#d4d5da" />
        <BoardControls onQuickCall={onQuickCall} paletteOpen={paletteOpen} onPaletteOpenChange={setPaletteOpen} />
      </ReactFlow>
    </div>
  );
}
