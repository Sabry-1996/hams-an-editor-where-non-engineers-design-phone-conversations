import { useCallback } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useFlow } from '../../context/FlowContext';
import { useI18n } from '../../i18n/I18nContext';
import type { EditorTab } from '../../types/flow';
import { cardClass } from '../ui/Field';
import { DiagnosticCard } from './DiagnosticCard';

interface DiagnosticsViewProps {
  onNavigate: (tab: EditorTab) => void;
}

export default function DiagnosticsView({ onNavigate }: DiagnosticsViewProps) {
  const { t } = useI18n();
  const { diagnostics, revealNode } = useFlow();
  const goToNode = useCallback((nodeId: string) => {
    revealNode(nodeId);
    onNavigate('canvas');
  }, [revealNode, onNavigate]);

  return (
    <div className="flex-1 bg-surface p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className={`${cardClass} p-6 flex items-center justify-between gap-4`}>
          <div>
            <h2 className="text-base font-semibold text-ink">{t('diag_title')}</h2>
            <p className="text-xs text-ink-2 mt-1">{t('diag_sub')}</p>
          </div>
          <div className="text-center shrink-0">
            <span className={`block text-2xl font-bold ${diagnostics.length ? 'text-amber-500' : 'text-emerald-600'}`}>{diagnostics.length}</span>
            <span className="text-[10px] text-ink-3">{t('diag_count')}</span>
          </div>
        </div>
        {diagnostics.length === 0 ? (
          <div className={`${cardClass} border-emerald-200 p-8 text-center space-y-3`}>
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-semibold text-emerald-700">{t('diag_clear_title')}</h3>
            <p className="text-xs text-ink-2">{t('diag_clear_body')}</p>
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
