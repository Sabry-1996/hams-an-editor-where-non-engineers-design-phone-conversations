import React from 'react';
import { Activity, Layers, PhoneCall } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import type { EditorTab } from '../../types/flow';

interface TabSwitcherProps {
  activeTab: EditorTab;
  onChange: (tab: EditorTab) => void;
  diagnosticsCount: number;
}

const tabClass = (active: boolean) =>
  `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${active ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'}`;

export const TabSwitcher = React.memo(function TabSwitcher({ activeTab, onChange, diagnosticsCount }: TabSwitcherProps) {
  const { t } = useI18n();
  return (
    <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800" role="tablist">
      <button type="button" role="tab" aria-selected={activeTab === 'canvas'} onClick={() => onChange('canvas')} className={tabClass(activeTab === 'canvas')}>
        <Layers className="w-4 h-4" /><span>{t('tab_canvas')}</span>
      </button>
      <button type="button" role="tab" aria-selected={activeTab === 'simulator'} onClick={() => onChange('simulator')} className={tabClass(activeTab === 'simulator')}>
        <PhoneCall className="w-4 h-4" /><span>{t('tab_simulator')}</span>
      </button>
      <button type="button" role="tab" aria-selected={activeTab === 'diagnostics'} onClick={() => onChange('diagnostics')} className={tabClass(activeTab === 'diagnostics')}>
        <Activity className="w-4 h-4" /><span>{t('tab_diagnostics')}</span>
        {diagnosticsCount > 0 && <span className="px-1.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold">{diagnosticsCount}</span>}
      </button>
    </div>
  );
});
