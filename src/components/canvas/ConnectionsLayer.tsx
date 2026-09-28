import React from 'react';
import type { Edge, FlowNode } from '../../types/flow';
import { NODE_PORT_OFFSET_Y, NODE_WIDTH } from './nodeStyles';

interface ConnectionsLayerProps {
  nodes: FlowNode[];
  edges: Edge[];
  connectingSourceId: string | null;
}

export const ConnectionsLayer = React.memo(function ConnectionsLayer({ nodes, edges, connectingSourceId }: ConnectionsLayerProps) {
  const byId = React.useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

  return (
    <svg className="absolute inset-0 w-[5000px] h-[5000px] pointer-events-none" aria-hidden="true">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
        </marker>
      </defs>
      {edges.map(edge => {
        const source = byId.get(edge.from);
        const target = byId.get(edge.to);
        if (!source || !target) return null;
        const startX = source.position.x + NODE_WIDTH;
        const startY = source.position.y + NODE_PORT_OFFSET_Y;
        const endX = target.position.x;
        const endY = target.position.y + NODE_PORT_OFFSET_Y;
        const dx = Math.max(48, Math.abs(endX - startX) * 0.45);
        const d = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        return (
          <g key={edge.id}>
            <path
              d={d}
              fill="none"
              stroke={edge.branch === 'error' ? '#fb7185' : '#38bdf8'}
              strokeWidth="2.5"
              strokeDasharray={connectingSourceId === edge.from ? '5,5' : 'none'}
              markerEnd="url(#arrow)"
              className="opacity-80"
            />
            {edge.branch && (
              <text x={midX} y={midY - 6} fill="#94a3b8" fontSize="11" textAnchor="middle">{edge.branch}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
});
