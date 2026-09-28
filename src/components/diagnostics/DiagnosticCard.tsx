import React from 'react';
import { AlertTriangle, XCircle } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import type { MessageKey } from '../../i18n/messages';
import type { Diagnostic } from '../../types/flow';

interface DiagnosticCardProps {
  diagnostic: Diagnostic;
  onGoToNode: (nodeId: string) => void;
}

export const DiagnosticCard = React.memo(function DiagnosticCard({ diagnostic, onGoToNode }: DiagnosticCardProps) {
  const { t } = useI18n();
  const isError = diagnostic.level === 'error';
  const key = `diag_${diagnostic.code}` as MessageKey;
  return (
    <li className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-start gap-4">
      {isError ? <XCircle className="w-5 h-5 text-rose-400 mt-0.5" /> : <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1 gap-3">
          <span className={`text-xs font-bold ${isError ? 'text-rose-400' : 'text-amber-400'}`}>
            {isError ? t('level_error') : t('level_warning')}
          </span>
          {diagnostic.nodeId && (
            <button type="button" onClick={() => onGoToNode(diagnostic.nodeId!)} className="text-xs text-teal-400 hover:underline">
              {t('go_to_node')}
            </button>
          )}
        </div>
        <p className="text-sm text-slate-200">{t(key, diagnostic.params)}</p>
      </div>
    </li>
  );
});
