import React from 'react';
import { Panel, useReactFlow } from '@xyflow/react';
import {
  ArrowDownUp, ArrowLeftRight, Database, Maximize, MessageSquare, Mic, PhoneCall,
  Redo2, Share2, Square, Trash2, Undo2, Wand2, Zap
} from 'lucide-react';
import { useFlow } from '../../context/FlowContext';
import { useI18n } from '../../i18n/I18nContext';
import type { MessageKey } from '../../i18n/messages';
import type { NodeKind } from '../../types/flow';

const ICON = 'w-4 h-4';

const KINDS: Array<{ kind: NodeKind; icon: React.ReactNode }> = [
  { kind: 'say', icon: <MessageSquare className={`${ICON} text-teal-400`} /> },
  { kind: 'ask', icon: <Mic className={`${ICON} text-blue-400`} /> },
  { kind: 'condition', icon: <Zap className={`${ICON} text-amber-400`} /> },
  { kind: 'tool', icon: <Database className={`${ICON} text-purple-400`} /> },
  { kind: 'transfer', icon: <Share2 className={`${ICON} text-rose-400`} /> },
  { kind: 'end', icon: <Square className={`${ICON} text-slate-400`} /> }
];

function IconButton({ label, icon, onClick, disabled, active }: {
  label: string; icon: React.ReactNode; onClick: () => void; disabled?: boolean; active?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`p-2 rounded-lg disabled:opacity-30 ${active ? 'bg-teal-600 text-white' : 'hover:bg-slate-800 text-slate-200'}`}
    >
      {icon}
    </button>
  );
}

const Divider = () => <div className="h-px bg-slate-800 my-1" role="separator" />;

export function BoardControls({ onQuickCall }: { onQuickCall: () => void }) {
  const { t } = useI18n();
  const { fitView } = useReactFlow();
  const {
    addNode, selectedIds, deleteSelected, canUndo, canRedo, undo, redo,
    layoutDirection, setLayoutDirection, tidyUp
  } = useFlow();

  return (
    <Panel position="top-left" className="m-3!">
      <div role="toolbar" aria-orientation="vertical" aria-label={t('board_tools')} className="flex flex-col bg-slate-900/95 border border-slate-800 rounded-2xl p-1.5 shadow-xl">
        {KINDS.map(item => (
          <IconButton key={item.kind} label={`${t('add_node')}: ${t(item.kind as MessageKey)}`} icon={item.icon} onClick={() => addNode(item.kind)} />
        ))}
        <Divider />
        <IconButton label={t('undo')} icon={<Undo2 className={ICON} />} onClick={undo} disabled={!canUndo} />
        <IconButton label={t('redo')} icon={<Redo2 className={ICON} />} onClick={redo} disabled={!canRedo} />
        <Divider />
        <IconButton label={t('layout_horizontal')} icon={<ArrowLeftRight className={ICON} />} onClick={() => setLayoutDirection('horizontal')} active={layoutDirection === 'horizontal'} />
        <IconButton label={t('layout_vertical')} icon={<ArrowDownUp className={ICON} />} onClick={() => setLayoutDirection('vertical')} active={layoutDirection === 'vertical'} />
        <IconButton label={t('tidy_up')} icon={<Wand2 className={ICON} />} onClick={tidyUp} />
        <IconButton label={t('fit_view')} icon={<Maximize className={ICON} />} onClick={() => fitView({ duration: 300, padding: 0.2, maxZoom: 1 })} />
        <Divider />
        <IconButton label={t('delete_node')} icon={<Trash2 className={`${ICON} text-rose-400`} />} onClick={deleteSelected} disabled={selectedIds.length === 0} />
        <IconButton label={t('quick_call')} icon={<PhoneCall className={`${ICON} text-emerald-400`} />} onClick={onQuickCall} />
      </div>
    </Panel>
  );
}
