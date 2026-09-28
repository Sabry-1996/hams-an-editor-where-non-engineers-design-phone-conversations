import { useCallback } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useFlow } from '../../context/FlowContext';
import { useI18n } from '../../i18n/I18nContext';
import type { EditorTab } from '../../types/flow';
import { DiagnosticCard } from './DiagnosticCard';

interface DiagnosticsViewProps {
  onNavigate: (tab: EditorTab) => void;
}

export default function DiagnosticsView({ onNavigate }: DiagnosticsViewProps) {
  const { t } = useI18n();
  const { diagnostics, selectNode } = useFlow();
  const goToNode = useCallback((nodeId: string) => {
    selectNode(nodeId);
    onNavigate('canvas');
  }, [selectNode, onNavigate]);

  return (
    <div className="flex-1 bg-slate-950 p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-100">{t('diag_title')}</h2>
            <p className="text-xs text-slate-400 mt-1">{t('diag_sub')}</p>
          </div>
          <div className="text-center">
            <span className="block text-lg font-bold text-amber-400">{diagnostics.length}</span>
            <span className="text-[10px] text-slate-400">{t('diag_count')}</span>
          </div>
        </div>
        {diagnostics.length === 0 ? (
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-emerald-300">{t('diag_clear_title')}</h3>
            <p className="text-xs text-slate-400">{t('diag_clear_body')}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {diagnostics.map((diag, index) => (
              <DiagnosticCard key={`${diag.code}-${diag.nodeId ?? 'flow'}-${index}`} diagnostic={diag} onGoToNode={goToNode} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
