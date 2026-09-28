import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface ReplyComposerProps {
  disabled: boolean;
  onSend: (text: string) => void;
}

export function ReplyComposer({ disabled, onSend }: ReplyComposerProps) {
  const [draft, setDraft] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onSend(draft);
    setDraft('');
  };

  return (
    <form onSubmit={submit} className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-3">
      <input
        type="text"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        placeholder={disabled ? 'ابدأ المكالمة أولاً لتفعيل التحدث...' : 'اكتب رد المريض هنا أو انحدث للمحاكاة (مثل: رقم بطاقتي 102938)...'}
        disabled={disabled}
        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 focus:border-teal-500 focus:outline-none disabled:opacity-50"
        dir="auto"
      />
      <button
        type="submit"
        disabled={disabled}
        className="px-5 py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-teal-900/30 flex items-center gap-2"
      >
        <span>إرسال رد</span>
        <ArrowRight className="w-4 h-4 rotate-180" />
      </button>
    </form>
  );
}
