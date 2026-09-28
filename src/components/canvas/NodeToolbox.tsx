import React from 'react';
import { Database, MessageSquare, Mic, PhoneCall, Share2, Square, Zap } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import type { NodeKind } from '../../types/flow';

interface NodeToolboxProps {
  onAddNode: (kind: NodeKind) => void;
  onQuickCall: () => void;
}

const TOOLS: Array<{ kind: NodeKind; icon: React.ReactNode }> = [
  { kind: 'say', icon: <MessageSquare className="w-5 h-5 text-teal-400" /> },
  { kind: 'ask', icon: <Mic className="w-5 h-5 text-blue-400" /> },
  { kind: 'condition', icon: <Zap className="w-5 h-5 text-amber-400" /> },
  { kind: 'tool', icon: <Database className="w-5 h-5 text-purple-400" /> },
  { kind: 'transfer', icon: <Share2 className="w-5 h-5 text-rose-400" /> },
  { kind: 'end', icon: <Square className="w-5 h-5 text-slate-400" /> }
];

export const NodeToolbox = React.memo(function NodeToolbox({ onAddNode, onQuickCall }: NodeToolboxProps) {
  const { t } = useI18n();
  return (
    <aside className="w-64 bg-slate-900 border-slate-800 p-4 flex flex-col gap-4 z-20 overflow-y-auto border-e">
      <div>
        <h2 className="text-xs font-semibold text-slate-400 mb-3">{t('add_node')}</h2>
        <div className="grid grid-cols-2 gap-2">
          {TOOLS.map(tool => (
            <button
              key={tool.kind}
              type="button"
              onClick={() => onAddNode(tool.kind)}
              className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-teal-500/50"
            >
              {tool.icon}
              <span className="text-xs text-slate-300">{t(tool.kind)}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="border-t border-slate-800 pt-4">
        <h2 className="text-xs font-semibold text-slate-400 mb-2">{t('tips_title')}</h2>
        <ul className="text-xs text-slate-400 space-y-1.5">
          <li>{t('tip_drag')}</li>
          <li>{t('tip_move')}</li>
          <li>{t('tip_multi')}</li>
          <li>{t('tip_keys')}</li>
        </ul>
      </div>
      <div className="mt-auto border border-teal-500/30 rounded-xl p-3">
        <h2 className="text-xs font-bold text-teal-300 mb-2">{t('quick_title')}</h2>
        <p className="text-[11px] text-slate-300 mb-3">{t('quick_body')}</p>
        <button type="button" onClick={onQuickCall} className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2">
          <PhoneCall className="w-4 h-4" />
          <span>{t('quick_call')}</span>
        </button>
      </div>
    </aside>
  );
});
