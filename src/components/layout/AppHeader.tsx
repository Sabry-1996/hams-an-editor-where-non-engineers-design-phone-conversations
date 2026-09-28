import React from 'react';
import { Download, Languages, Shield, Upload } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import type { EditorTab } from '../../types/flow';
import { TabSwitcher } from './TabSwitcher';

interface AppHeaderProps {
  activeTab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
  diagnosticsCount: number;
  onExport: () => void;
  onImportFile: (file: File) => void;
}

const iconButton = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 cursor-pointer';

export function AppHeader({ activeTab, onTabChange, diagnosticsCount, onExport, onImportFile }: AppHeaderProps) {
  const { t, toggleLang } = useI18n();
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void onImportFile(file);
    e.target.value = '';
  };

  return (
    <header className="flex items-center justify-between gap-4 px-4 py-2.5 bg-slate-900 border-b border-slate-800 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 text-teal-400">
          <Shield className="w-5 h-5" />
          <span className="font-bold text-sm">{t('brand')}</span>
        </div>
        <h1 className="text-sm text-slate-300 truncate hidden md:block">{t('title')}</h1>
      </div>
      <TabSwitcher activeTab={activeTab} onChange={onTabChange} diagnosticsCount={diagnosticsCount} />
      <div className="flex items-center gap-2">
        <button type="button" onClick={toggleLang} className={iconButton} aria-label={t('lang_switch')}>
          <Languages className="w-4 h-4" />
          <span>{t('lang_switch')}</span>
        </button>
        <label className={iconButton} title={t('import')}>
          <Upload className="w-4 h-4" /><span className="sr-only md:not-sr-only">{t('import')}</span>
          <input type="file" accept=".json,application/json" onChange={handleImport} className="hidden" />
        </label>
        <button type="button" onClick={onExport} className={`${iconButton} bg-teal-600 hover:bg-teal-500 text-white`} title={t('export')}>
          <Download className="w-4 h-4" /><span className="sr-only md:not-sr-only">{t('export')}</span>
        </button>
      </div>
    </header>
  );
}
