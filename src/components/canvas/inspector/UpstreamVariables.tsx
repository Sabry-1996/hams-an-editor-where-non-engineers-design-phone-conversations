import React from 'react';
import { Wand2 } from 'lucide-react';
import { toPlaceholder } from '../../../utils/template';

interface UpstreamVariablesProps {
  variables: string[];
}

export const UpstreamVariables = React.memo(function UpstreamVariables({ variables }: UpstreamVariablesProps) {
  return (
    <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 mt-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-teal-400 flex items-center gap-1">
          <Wand2 className="w-3.5 h-3.5" />
          <span>المتغيرات المتاحة upstream</span>
        </span>
        <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-mono">{variables.length} متاح</span>
      </div>
      {variables.length === 0 ? (
        <p className="text-[11px] text-slate-500">لا توجد متغيرات معلنة في المسارات السابقة لهذه العقدة.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {variables.map(v => (
            <button
              key={v}
              onClick={() => navigator.clipboard.writeText(toPlaceholder(v))}
              className="text-[11px] font-mono bg-teal-950/50 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded hover:bg-teal-900/60 transition"
              title="اضغط للنسخ"
            >
              {toPlaceholder(v)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
