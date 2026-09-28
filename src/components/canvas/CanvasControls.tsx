import React from 'react';

interface CanvasControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export const CanvasControls = React.memo(function CanvasControls({ zoom, onZoomIn, onZoomOut, onReset }: CanvasControlsProps) {
  return (
    <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-slate-900/90 backdrop-blur border border-slate-800 p-2 rounded-xl shadow-2xl z-20">
      <button onClick={onZoomIn} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold">+</button>
      <span className="text-xs font-mono text-slate-400 px-2">{Math.round(zoom * 100)}%</span>
      <button onClick={onZoomOut} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold">-</button>
      <div className="h-4 w-px bg-slate-800 mx-1" />
      <button onClick={onReset} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-300">إعادة تعيين</button>
    </div>
  );
});
