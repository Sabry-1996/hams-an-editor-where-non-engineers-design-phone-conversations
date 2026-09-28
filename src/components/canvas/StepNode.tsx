import React from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { useI18n } from '../../i18n/I18nContext';
import type { FlowNode } from '../../types/flow';
import type { LayoutDirection } from '../../utils/autoLayout';
import { NODE_STYLES } from './nodeStyles';

export interface StepNodeData extends Record<string, unknown> {
  node: FlowNode;
  direction: LayoutDirection;
  active: boolean;
  hasIssue: boolean;
}

export type StepRFNode = Node<StepNodeData, 'step'>;

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

function savedAs(node: FlowNode): string {
  if ((node.data.kind === 'ask' || node.data.kind === 'tool') && node.data.saveAs) return `{{${node.data.saveAs}}}`;
  return '';
}

const HANDLE: React.CSSProperties = { width: 12, height: 12, background: '#2dd4bf', border: '2px solid #020617' };

export const StepNode = React.memo(function StepNode({ data, selected }: NodeProps<StepRFNode>) {
  const { t } = useI18n();
  const { node, direction, active, hasIssue } = data;
  const horizontal = direction === 'horizontal';
  const style = NODE_STYLES[node.data.kind];
  const kind = node.data.kind;
  const text = preview(node);
  const chip = savedAs(node);
  const ring = active
    ? 'border-amber-300 ring-2 ring-amber-400/50'
    : selected
      ? 'border-teal-400 ring-2 ring-teal-500/30'
      : hasIssue
        ? 'border-rose-500'
        : 'border-slate-800';
  const sourceSide = horizontal ? Position.Right : Position.Bottom;
  const offsetKey = horizontal ? 'top' : 'left';

  return (
    <div className={`w-[240px] bg-slate-900 rounded-xl border shadow-xl ${ring}`} aria-label={`${t(kind)} ${node.label}`}>
      {kind !== 'start' && (
        <Handle type="target" position={horizontal ? Position.Left : Position.Top} style={{ ...HANDLE, background: '#334155' }} />
      )}
      <div className={`flex items-center justify-between px-3 py-2 rounded-t-xl border-b ${style.headerClass}`}>
        <div className="flex items-center gap-2">
          {style.icon}
          <span className="text-xs font-bold">{t(kind)}</span>
        </div>
        {hasIssue && <span className="text-[10px] font-bold text-rose-300" aria-label={t('level_error')}>!</span>}
      </div>
      <div className="p-3 text-xs space-y-2">
        <div className="font-semibold text-slate-200 truncate">{node.label}</div>
        {text && (
          <p className="text-[11px] text-slate-400 line-clamp-2 bg-slate-950/50 p-1.5 rounded border border-slate-800/80" dir="auto">{text}</p>
        )}
        {chip && <div className="text-[10px] font-mono text-blue-300">{chip}</div>}
        {kind === 'tool' && (
          <div className={`flex text-[10px] font-mono ${horizontal ? 'flex-col items-end gap-1' : 'justify-around'}`}>
            <span className="text-teal-300">ok</span>
            <span className="text-rose-300">error</span>
          </div>
        )}
      </div>
      {kind === 'tool' ? (
        <>
          <Handle type="source" id="ok" position={sourceSide} style={{ ...HANDLE, [offsetKey]: '35%' }} />
          <Handle type="source" id="error" position={sourceSide} style={{ ...HANDLE, background: '#fb7185', [offsetKey]: '65%' }} />
        </>
      ) : kind !== 'end' ? (
        <Handle type="source" position={sourceSide} style={HANDLE} />
      ) : null}
    </div>
  );
});
