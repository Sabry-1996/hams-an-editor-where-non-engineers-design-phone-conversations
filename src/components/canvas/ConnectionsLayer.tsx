import React, { useMemo } from 'react';
import type { NodeData } from '../../types/flow';
import { NODE_PORT_OFFSET_X, NODE_PORT_OFFSET_Y } from './nodeStyles';

interface ConnectionsLayerProps {
  nodes: NodeData[];
  connectingSourceId: string | null;
}

export const ConnectionsLayer = React.memo(function ConnectionsLayer({ nodes, connectingSourceId }: ConnectionsLayerProps) {
  const byId = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

  return (
    <svg className="absolute inset-0 w-[5000px] h-[5000px] pointer-events-none">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
        </marker>
      </defs>
      {nodes.map(node =>
        node.outputs.map(targetId => {
          const target = byId.get(targetId);
          if (!target) return null;

          const startX = node.position.x + NODE_PORT_OFFSET_X;
          const startY = node.position.y + NODE_PORT_OFFSET_Y;
          const endX = target.position.x;
          const endY = target.position.y + NODE_PORT_OFFSET_Y;
          const dx = Math.abs(endX - startX) * 0.5;
          const d = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;

          return (
            <path
              key={`${node.id}-${targetId}`}
              d={d}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeDasharray={connectingSourceId === node.id ? '5,5' : 'none'}
              markerEnd="url(#arrow)"
              className="transition-all duration-300 opacity-80 hover:opacity-100"
            />
          );
        })
      )}
    </svg>
  );
});
