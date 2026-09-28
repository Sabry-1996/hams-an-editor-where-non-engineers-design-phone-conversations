import React from 'react';
import { useI18n } from '../../i18n/I18nContext';
import type { FlowNode, NodeKind } from '../../types/flow';
import { FALLBACK_NODE_STYLE, NODE_STYLES, NODE_WIDTH } from './nodeStyles';

interface FlowNodeCardProps {
  node: FlowNode;
  isSelected: boolean;
  isActive: boolean;
  hasIssue: boolean;
  isConnecting: boolean;
  onSelect: (id: string, additive?: boolean) => void;
  onMouseDown: (id: string, e: React.MouseEvent) => void;
  onPortClick: (id: string, e: React.MouseEvent) => void;
}

function preview(node: FlowNode): string {
  const data = node.data;
  if (data.kind === 'say') return data.text.ar || data.text.en;
  if (data.kind === 'ask') return data.prompt.ar || data.prompt.en;
  if (data.kind === 'tool') return data.name;
  if (data.kind === 'transfer') return data.queue;
  if (data.kind === 'end') return data.text?.ar || data.text?.en || '';
  if (data.kind === 'condition') return data.rules.map(rule => rule.variable).filter(Boolean).join(', ');
  return '';
}

function chip(node: FlowNode): string {
  if (node.data.kind === 'ask' && node.data.saveAs) return `{{${node.data.saveAs}}}`;
  if (node.data.kind === 'tool' && node.data.saveAs) return `{{${node.data.saveAs}}}`;
  return '';
}

export const FlowNodeCard = React.memo(function FlowNodeCard({
  node, isSelected, isActive, hasIssue, isConnecting, onSelect, onMouseDown, onPortClick
}: FlowNodeCardProps) {
  const { t } = useI18n();
  const style = NODE_STYLES[node.data.kind] ?? FALLBACK_NODE_STYLE;
  const kind = node.data.kind as NodeKind;
  const spoken = preview(node);
  const saved = chip(node);
  const ring = isActive
    ? 'border-amber-300 ring-2 ring-amber-400/50'
    : isSelected
      ? 'border-teal-400 ring-2 ring-teal-500/30'
      : hasIssue
        ? 'border-rose-500'
        : 'border-slate-800 hover:border-slate-700';

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`${t(kind)} ${node.label}`}
      onClick={e => e.stopPropagation()}
      onMouseDown={e => onMouseDown(node.id, e)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(node.id, e.shiftKey);
        }
      }}
      style={{ transform: `translate(${node.position.x}px, ${node.position.y}px)`, width: `${NODE_WIDTH}px` }}
      className={`absolute bg-slate-900 rounded-xl border shadow-xl cursor-pointer ${ring}`}
    >
      <div className={`flex items-center justify-between px-3 py-2 rounded-t-xl border-b ${style.headerClass}`}>
        <div className="flex items-center gap-2">
          {style.icon}
          <span className="text-xs font-bold">{t(kind)}</span>
        </div>
        {hasIssue && <span className="text-[10px] font-bold text-rose-300" aria-hidden="true">!</span>}
      </div>
      <div className="p-3 text-xs space-y-2">
        <div className="font-semibold text-slate-200 truncate">{node.label}</div>
        {spoken && (
          <p className="text-[11px] text-slate-400 line-clamp-2 bg-slate-950/50 p-1.5 rounded border border-slate-800/80" dir="auto">
            {spoken}
          </p>
        )}
        {saved && <div className="text-[10px] font-mono text-blue-300">{saved}</div>}
      </div>
      <div className="absolute -left-1.5 top-7 w-3 h-3 rounded-full bg-slate-700 border-2 border-slate-950" aria-hidden="true" />
      <button
        type="button"
        aria-label={t('connecting')}
        onClick={e => onPortClick(node.id, e)}
        onMouseDown={e => e.stopPropagation()}
        className={`absolute -right-2 top-6 w-4 h-4 rounded-full border-2 border-slate-950 ${isConnecting ? 'bg-amber-400' : 'bg-teal-400'}`}
      />
    </div>
  );
});
