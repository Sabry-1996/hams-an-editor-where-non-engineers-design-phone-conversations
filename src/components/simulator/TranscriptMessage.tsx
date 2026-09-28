import React from 'react';
import { useI18n } from '../../i18n/I18nContext';
import type { SimLogEntry } from '../../types/simulator';

export const TranscriptMessage = React.memo(function TranscriptMessage({ entry }: { entry: SimLogEntry }) {
  const { t } = useI18n();
  if (entry.sender === 'system') {
    return <p className="text-center text-[11px] text-ink-3">{entry.text}</p>;
  }
  const isUser = entry.sender === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-xl rounded-2xl px-4 py-3 text-sm ${isUser ? 'bg-brand text-white' : 'bg-white text-ink border border-line shadow-card'}`}>
        <div className="flex items-center justify-between gap-4 mb-1">
          <span className={`text-[10px] font-semibold ${isUser ? 'text-white/80' : 'text-ink-3'}`}>{isUser ? t('user') : t('agent')}</span>
          <span className={`text-[10px] ${isUser ? 'text-white/60' : 'text-ink-3'}`}>{entry.time}</span>
        </div>
        <p className="leading-relaxed" dir="auto">{entry.text}</p>
      </div>
    </div>
  );
});
