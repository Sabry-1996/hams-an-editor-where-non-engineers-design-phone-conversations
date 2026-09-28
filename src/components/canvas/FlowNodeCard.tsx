import React from 'react';
import type { NodeData } from '../../types/flow';
import { FALLBACK_NODE_STYLE, NODE_STYLES, NODE_WIDTH } from './nodeStyles';

interface FlowNodeCardProps {
  node: NodeData;
  isSelected: boolean;
  isConnecting: boolean;
  onSelect: (id: string) => void;
  onMouseDown: (id: string, e: React.MouseEvent) => void;
  onPortClick: (id: string, e: React.MouseEvent) => void;
}

export const FlowNodeCard = React.memo(function FlowNodeCard({
  node, isSelected, isConnecting, onSelect, onMouseDown, onPortClick
}: FlowNodeCardProps) {
  const style = NODE_STYLES[node.type] ?? FALLBACK_NODE_STYLE;

  return (
    <div
      onClick={e => { e.stopPropagation(); onSelect(node.id); }}
      onMouseDown={e => onMouseDown(node.id, e)}
      style={{ transform: `translate(${node.position.x}px, ${node.position.y}px)`, width: `${NODE_WIDTH}px` }}
      className={`absolute bg-slate-900 rounded-xl border shadow-xl cursor-pointer transition-shadow ${
        isSelected ? 'border-teal-400 ring-2 ring-teal-500/30 shadow-teal-900/50' : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className={`flex items-center justify-between px-3 py-2 rounded-t-xl border-b ${style.headerClass}`}>
        <div className="flex items-center space-x-2 space-x-reverse">
          {style.icon}
          <span className="text-xs font-bold uppercase tracking-wider">{node.type}</span>
        </div>
        <span className="text-[10px] font-mono opacity-60">{node.id}</span>
      </div>

      <div className="p-3 text-xs space-y-2">
        <div className="font-semibold text-slate-200 truncate">{node.label}</div>
        {node.config.speechAr && (
          <p className="text-[11px] text-slate-400 line-clamp-2 bg-slate-950/50 p-1.5 rounded border border-slate-800/80" dir="rtl">
            {node.config.speechAr}
          </p>
        )}
        {node.config.expectedVariable && (
          <div className="flex items-center gap-1 text-[10px] bg-blue-950/30 text-blue-300 px-2 py-0.5 rounded border border-blue-500/20">
            <span>متغير متوقع:</span>
            <span className="font-mono font-bold">{`{{${node.config.expectedVariable}}}`}</span>
          </div>
        )}
        {node.config.toolName && (
          <div className="flex items-center gap-1 text-[10px] bg-purple-950/30 text-purple-300 px-2 py-0.5 rounded border border-purple-500/20 truncate">
            <span>أداة:</span>
            <span className="font-mono">{node.config.toolName}</span>
          </div>
        )}
      </div>

      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-700 border-2 border-slate-950" />
      <div
        onClick={e => onPortClick(node.id, e)}
        className={`absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-slate-950 cursor-pointer transition-transform hover:scale-125 ${
          isConnecting ? 'bg-amber-400 animate-ping' : 'bg-teal-400'
        }`}
        title="اضغط للربط بعقدة أخرى"
      />
    </div>
  );
});
