import React from 'react';
import type { ToolBehavior } from '../../types/simulator';

interface ToolBehaviorSelectorProps {
  value: ToolBehavior;
  onChange: (value: ToolBehavior) => void;
}

const OPTIONS: Array<{ value: ToolBehavior; label: string; activeClass: string }> = [
  { value: 'ok', label: 'نجاح (OK)', activeClass: 'bg-emerald-600 text-white border-emerald-500' },
  { value: 'slow', label: 'بطيء (Slow)', activeClass: 'bg-amber-600 text-white border-amber-500' },
  { value: 'error', label: 'خطأ (Error)', activeClass: 'bg-rose-600 text-white border-rose-500' }
];

export const ToolBehaviorSelector = React.memo(function ToolBehaviorSelector({ value, onChange }: ToolBehaviorSelectorProps) {
  return (
    <div>
      <label className="text-xs text-slate-400 mb-1 block">محاكاة سلوك الأداة (Mock Tool Behavior)</label>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`py-2 rounded-xl text-xs font-semibold border transition ${
              value === opt.value ? opt.activeClass : 'bg-slate-950 text-slate-400 border-slate-800'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
});
