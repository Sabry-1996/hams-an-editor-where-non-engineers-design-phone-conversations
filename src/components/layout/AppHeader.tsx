import React from 'react';
import { Download, Languages, RotateCcw, RotateCw, Shield, Upload } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import type { EditorTab } from '../../types/flow';
import { TabSwitcher } from './TabSwitcher';

interface AppHeaderProps {
  activeTab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
  diagnosticsCount: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onImportFile: (file: File) => void;
}

export function AppHeader(props: AppHeaderProps) {
  const { activeTab, onTabChange, diagnosticsCount, canUndo, canRedo, onUndo, onRedo, onExport, onImportFile } = props;
  const { t, toggleLang } = useI18n();
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void onImportFile(file);
    e.target.value = '';
  };

  return (
    <header className="flex items-center justify-between gap-4 px-4 py-3 bg-slate-900 border-b border-slate-800 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 bg-teal-600/20 text-teal-400 px-3 py-1.5 rounded-lg border border-teal-500/30">
          <Shield className="w-5 h-5" />
          <span className="font-bold text-sm">{t('brand')}</span>
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-slate-200 truncate">{t('title')}</h1>
          <p className="text-xs text-slate-400 truncate">{t('subtitle')}</p>
        </div>
      </div>
      <TabSwitcher activeTab={activeTab} onChange={onTabChange} diagnosticsCount={diagnosticsCount} />
      <div className="flex items-center gap-2">
        <button type="button" onClick={toggleLang} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg text-xs font-semibold" aria-label={t('lang_switch')}>
          <Languages className="w-4 h-4" />
          <span>{t('lang_switch')}</span>
        </button>
        <div className="flex items-center bg-slate-800 rounded-lg p-1">
          <button type="button" onClick={onUndo} disabled={!canUndo} className="p-1.5 rounded hover:bg-slate-700 disabled:opacity-40" aria-label={t('undo')}><RotateCcw className="w-4 h-4" /></button>
          <button type="button" onClick={onRedo} disabled={!canRedo} className="p-1.5 rounded hover:bg-slate-700 disabled:opacity-40" aria-label={t('redo')}><RotateCw className="w-4 h-4" /></button>
        </div>
        <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs cursor-pointer">
          <Upload className="w-4 h-4" /><span>{t('import')}</span>
          <input type="file" accept=".json,application/json" onChange={handleImport} className="hidden" />
        </label>
        <button type="button" onClick={onExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs">
          <Download className="w-4 h-4" /><span>{t('export')}</span>
        </button>
      </div>
    </header>
  );
}
