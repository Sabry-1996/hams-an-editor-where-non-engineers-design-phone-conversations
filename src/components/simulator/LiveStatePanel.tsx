import React from 'react';
import { Database } from 'lucide-react';
import type { SimVariables } from '../../types/simulator';

interface LiveStatePanelProps {
  variables: SimVariables;
}

export const LiveStatePanel = React.memo(function LiveStatePanel({ variables }: LiveStatePanelProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex-1">
      <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
        <Database className="w-4 h-4 text-purple-400" />
        <span>متغيرات المكالمة الحية (Live State)</span>
      </h3>
      <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 font-mono text-xs text-teal-300 max-h-60 overflow-y-auto">
        <pre>{JSON.stringify(variables, null, 2)}</pre>
      </div>
    </div>
  );
});
