import type { Flow, FlowNode, Position } from '../types/flow';
import { outgoing } from './flowGraph';

export type LayoutDirection = 'horizontal' | 'vertical';
export interface NodeSize { width: number; height: number }

export const DEFAULT_NODE_SIZE: NodeSize = { width: 240, height: 112 };
export const MAIN_GAP = 96;
const CROSS_GAP = 40;
const MARGIN = 40;

/**
 * Rank = longest path from a start node, ignoring edges that close a cycle.
 * Unreachable nodes end up in rank 0 next to the start so Reem sees they are disconnected.
 */
function computeRanks(flow: Flow): Map<string, number> {
  const state = new Map<string, 0 | 1 | 2>();
  const backEdges = new Set<string>();
  const finished: string[] = [];

  const visit = (id: string) => {
    state.set(id, 1);
    outgoing(flow, id).forEach(edge => {
      const s = state.get(edge.to) ?? 0;
      if (s === 1) backEdges.add(edge.id);
      else if (s === 0 && flow.nodes.some(n => n.id === edge.to)) visit(edge.to);
    });
    state.set(id, 2);
    finished.push(id);
  };

  flow.nodes.filter(n => n.data.kind === 'start').forEach(n => visit(n.id));
  flow.nodes.forEach(n => { if ((state.get(n.id) ?? 0) === 0) visit(n.id); });

  const ranks = new Map<string, number>();
  [...finished].reverse().forEach(id => {
    const rank = ranks.get(id) ?? 0;
    ranks.set(id, rank);
    outgoing(flow, id).forEach(edge => {
      if (backEdges.has(edge.id)) return;
      ranks.set(edge.to, Math.max(ranks.get(edge.to) ?? 0, rank + 1));
    });
  });
  return ranks;
}

/**
 * Layered layout. Inside a layer nodes keep their current order along the cross axis,
 * so a tidy-up never swaps branches Reem already arranged in her head.
 */
export function layoutFlow(flow: Flow, direction: LayoutDirection, sizes: Map<string, NodeSize> = new Map()): Flow {
  if (flow.nodes.length === 0) return flow;
  const horizontal = direction === 'horizontal';
  const ranks = computeRanks(flow);
  const layers = new Map<number, FlowNode[]>();
  flow.nodes.forEach(node => {
    const rank = ranks.get(node.id) ?? 0;
    const layer = layers.get(rank) ?? [];
    layer.push(node);
    layers.set(rank, layer);
  });

  const sizeOf = (node: FlowNode) => sizes.get(node.id) ?? DEFAULT_NODE_SIZE;
  const mainSize = (size: NodeSize) => (horizontal ? size.width : size.height);
  const crossSize = (size: NodeSize) => (horizontal ? size.height : size.width);
  const crossPos = (node: FlowNode) => (horizontal ? node.position.y : node.position.x);

  const keys = [...layers.keys()].sort((a, b) => a - b);
  const extents = keys.map(key => {
    const layer = layers.get(key)!;
    return layer.reduce((sum, node) => sum + crossSize(sizeOf(node)), 0) + CROSS_GAP * (layer.length - 1);
  });
  const widest = Math.max(...extents);

  const positions = new Map<string, Position>();
  let mainOffset = MARGIN;
  keys.forEach((key, index) => {
    const layer = [...layers.get(key)!].sort((a, b) => crossPos(a) - crossPos(b));
    let crossOffset = MARGIN + (widest - extents[index]) / 2;
    let thickest = 0;
    layer.forEach(node => {
      const size = sizeOf(node);
      positions.set(node.id, horizontal
        ? { x: Math.round(mainOffset), y: Math.round(crossOffset) }
        : { x: Math.round(crossOffset), y: Math.round(mainOffset) });
      crossOffset += crossSize(size) + CROSS_GAP;
      thickest = Math.max(thickest, mainSize(size));
    });
    mainOffset += thickest + MAIN_GAP;
  });

  return {
    ...flow,
    nodes: flow.nodes.map(node => {
      const next = positions.get(node.id)!;
      return next.x === node.position.x && next.y === node.position.y ? node : { ...node, position: next };
    })
  };
}
