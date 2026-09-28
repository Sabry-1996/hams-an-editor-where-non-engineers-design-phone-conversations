import React from 'react';

interface FieldProps {
  label: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <div>
      <label className="text-xs text-slate-400 mb-1 flex items-center justify-between">
        <span>{label}</span>
        {hint && <span className="text-[10px]">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

export const inputClass =
  'w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-teal-500 focus:outline-none';

export const textareaClass =
  'w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:border-teal-500 focus:outline-none leading-relaxed';
