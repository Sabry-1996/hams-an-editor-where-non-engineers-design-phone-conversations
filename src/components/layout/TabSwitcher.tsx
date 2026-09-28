import React from 'react';
import { Activity, Layers, PhoneCall } from 'lucide-react';
import type { EditorTab } from '../../types/flow';

interface TabSwitcherProps {
  activeTab: EditorTab;
  onChange: (tab: EditorTab) => void;
  diagnosticsCount: number;
}

const tabClass = (active: boolean) =>
  `flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${active ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`;

export const TabSwitcher = React.memo(function TabSwitcher({ activeTab, onChange, diagnosticsCount }: TabSwitcherProps) {
  return (
    <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
      <button onClick={() => onChange('canvas')} className={tabClass(activeTab === 'canvas')}>
        <Layers className="w-4 h-4" /><span>محرر التدفق (Canvas)</span>
      </button>
      <button onClick={() => onChange('simulator')} className={tabClass(activeTab === 'simulator')}>
        <PhoneCall className="w-4 h-4" /><span>محاكي المكالمات (Test Call)</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      </button>
      <button onClick={() => onChange('diagnostics')} className={tabClass(activeTab === 'diagnostics')}>
        <Activity className="w-4 h-4" /><span>التشخيص والمشاكل ({diagnosticsCount})</span>
        {diagnosticsCount > 0 && <span className="px-1.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold">{diagnosticsCount}</span>}
      </button>
    </div>
  );
});
