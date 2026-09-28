import React from 'react';
import { Download, RotateCcw, RotateCw, Shield, Upload } from 'lucide-react';
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
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImportFile(file);
    e.target.value = '';
  };

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800 shadow-md z-30">
      <div className="flex items-center space-x-4 space-x-reverse">
        <div className="flex items-center space-x-2 space-x-reverse bg-teal-600/20 text-teal-400 px-3 py-1.5 rounded-lg border border-teal-500/30">
          <Shield className="w-5 h-5" />
          <span className="font-bold text-sm tracking-wide">شفاء كير | Shifa Care AI</span>
        </div>
        <div className="h-6 w-px bg-slate-800" />
        <div>
          <h1 className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <span>Hams.AI Voice Flow Editor</span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">v1.2 Live</span>
          </h1>
          <p className="text-xs text-slate-400">مهندسة النظام: ريم (Reem) • مصمم للمكالمات الطبية الذكية</p>
        </div>
      </div>
      <TabSwitcher activeTab={activeTab} onChange={onTabChange} diagnosticsCount={diagnosticsCount} />
      <div className="flex items-center space-x-3 space-x-reverse">
        <div className="flex items-center bg-slate-800 rounded-lg p-1">
          <button onClick={onUndo} disabled={!canUndo} className="p-1.5 rounded hover:bg-slate-700 disabled:opacity-40 text-slate-300" title="تراجع (Undo)"><RotateCcw className="w-4 h-4" /></button>
          <button onClick={onRedo} disabled={!canRedo} className="p-1.5 rounded hover:bg-slate-700 disabled:opacity-40 text-slate-300" title="إعادة (Redo)"><RotateCw className="w-4 h-4" /></button>
        </div>
        <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium cursor-pointer transition">
          <Upload className="w-4 h-4" /><span>استيراد</span>
          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
        </label>
        <button onClick={onExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-medium transition shadow-lg shadow-teal-900/30">
          <Download className="w-4 h-4" /><span>تصدير JSON</span>
        </button>
      </div>
    </header>
  );
}
