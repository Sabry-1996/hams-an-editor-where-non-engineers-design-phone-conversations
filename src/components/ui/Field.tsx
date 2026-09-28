import React from 'react';

interface FieldProps {
  label: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <div>
      <label className="text-xs font-medium text-ink-2 mb-1 flex items-center justify-between">
        <span>{label}</span>
        {hint && <span className="text-[10px] font-normal">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

export const inputClass =
  'w-full bg-white border border-line rounded-lg px-3 py-2 text-xs text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15';

export const textareaClass =
  'w-full bg-white border border-line rounded-lg p-2.5 text-xs text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 leading-relaxed';

export const cardClass = 'bg-white border border-line rounded-2xl shadow-card';
