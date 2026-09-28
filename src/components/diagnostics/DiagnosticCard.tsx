import React from 'react';
import { AlertTriangle, ArrowUpRight, XCircle } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import type { MessageKey } from '../../i18n/messages';
import type { Diagnostic } from '../../types/flow';
import { Button } from '../ui/Button';
import { cardClass } from '../ui/Field';

interface DiagnosticCardProps {
  diagnostic: Diagnostic;
  onGoToNode: (nodeId: string) => void;
}

export const DiagnosticCard = React.memo(function DiagnosticCard({ diagnostic, onGoToNode }: DiagnosticCardProps) {
  const { t } = useI18n();
  const isError = diagnostic.level === 'error';
  const key = `diag_${diagnostic.code}` as MessageKey;
  return (
    <li className={`${cardClass} p-5 flex items-start gap-4`}>
      <span className={`p-2 rounded-xl border shrink-0 ${isError ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-amber-50 border-amber-200 text-amber-600'}`}>
        {isError ? <XCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1 gap-3">
          <span className={`text-xs font-semibold ${isError ? 'text-rose-600' : 'text-amber-600'}`}>
            {isError ? t('level_error') : t('level_warning')}
          </span>
          {diagnostic.nodeId && (
            <Button variant="ghost" size="sm" onClick={() => onGoToNode(diagnostic.nodeId!)} className="text-brand hover:bg-brand-soft">
              <span>{t('go_to_node')}</span>
              <ArrowUpRight className="w-3.5 h-3.5 rtl:-scale-x-100" />
            </Button>
          )}
        </div>
        <p className="text-sm text-ink leading-relaxed">{t(key, diagnostic.params)}</p>
      </div>
    </li>
  );
});
