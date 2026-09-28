import React from 'react';
import { useI18n } from '../../i18n/I18nContext';

interface CanvasControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export const CanvasControls = React.memo(function CanvasControls({ zoom, onZoomIn, onZoomOut, onReset }: CanvasControlsProps) {
  const { t } = useI18n();
  return (
    <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-2 rounded-xl z-20">
      <button type="button" onClick={onZoomIn} aria-label="+" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold">+</button>
      <span className="text-xs font-mono text-slate-400 px-2">{Math.round(zoom * 100)}%</span>
      <button type="button" onClick={onZoomOut} aria-label="-" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold">-</button>
      <button type="button" onClick={onReset} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-300">{t('zoom_reset')}</button>
    </div>
  );
});
