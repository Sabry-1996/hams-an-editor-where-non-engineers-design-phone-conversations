import React from 'react';
import type { SimLogEntry } from '../../types/simulator';

export const TranscriptMessage = React.memo(function TranscriptMessage({ entry }: { entry: SimLogEntry }) {
  const align = entry.sender === 'user' ? 'items-start' : entry.sender === 'ai' ? 'items-end' : 'items-center';

  if (entry.sender === 'system') {
    return (
      <div className={`flex flex-col ${align}`}>
        <div className="bg-slate-950 border border-slate-800 px-4 py-1.5 rounded-full text-[11px] text-slate-400 my-2">{entry.text}</div>
      </div>
    );
  }

  const isUser = entry.sender === 'user';
  return (
    <div className={`flex flex-col ${align}`}>
      <div className={`max-w-xl rounded-2xl px-4 py-3 text-sm shadow-md ${
        isUser ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
      }`}>
        <div className="flex items-center justify-between gap-4 mb-1">
          <span className="text-[10px] font-bold opacity-70">{isUser ? 'المريض (User)' : 'ريم - المساعد الذكي (Munsit Voice)'}</span>
          <span className="text-[10px] opacity-50">{entry.time}</span>
        </div>
        <p className="leading-relaxed" dir={isUser ? 'auto' : 'rtl'}>{entry.text}</p>
      </div>
    </div>
  );
});
