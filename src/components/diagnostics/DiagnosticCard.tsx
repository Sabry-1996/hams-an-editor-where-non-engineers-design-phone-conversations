import React from 'react';
import { AlertTriangle, ArrowUpRight, XCircle } from 'lucide-react';
import type { Diagnostic } from '../../types/flow';

interface DiagnosticCardProps {
  diagnostic: Diagnostic;
  onGoToNode: (nodeId: string) => void;
}

export const DiagnosticCard = React.memo(function DiagnosticCard({ diagnostic, onGoToNode }: DiagnosticCardProps) {
  const isError = diagnostic.level === 'error';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-start gap-4">
      {isError ? (
        <XCircle className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
      ) : (
        <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
      )}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-bold uppercase tracking-wider ${isError ? 'text-rose-400' : 'text-amber-400'}`}>
            {isError ? 'خطأ حرج (Error)' : 'تحذير (Warning)'}
          </span>
          {diagnostic.nodeId && (
            <button onClick={() => onGoToNode(diagnostic.nodeId!)} className="text-xs text-teal-400 hover:underline flex items-center gap-1 font-mono">
              <span>الانتقال للعقدة: {diagnostic.nodeId}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <p className="text-sm text-slate-200" dir="rtl">{diagnostic.messageAr}</p>
        <p className="text-xs text-slate-400 mt-1" dir="ltr">{diagnostic.messageEn}</p>
      </div>
    </div>
  );
});
