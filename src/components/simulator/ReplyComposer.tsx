import React, { useState } from 'react';
import { SendHorizontal } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { Button } from '../ui/Button';

interface ReplyComposerProps {
  disabled: boolean;
  onSend: (text: string) => void;
}

export function ReplyComposer({ disabled, onSend }: ReplyComposerProps) {
  const { t } = useI18n();
  const [draft, setDraft] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onSend(draft);
    setDraft('');
  };

  return (
    <form onSubmit={submit} className="p-4 bg-white border-t border-line flex items-center gap-3">
      <label className="sr-only" htmlFor="caller-reply">{t('user')}</label>
      <input
        id="caller-reply"
        type="text"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        placeholder={disabled ? t('reply_disabled') : t('reply_placeholder')}
        disabled={disabled}
        className="flex-1 bg-surface border border-line rounded-xl px-4 h-11 text-sm text-ink placeholder:text-ink-3 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/15 disabled:opacity-50"
        dir="auto"
      />
      <Button type="submit" variant="primary" size="md" disabled={disabled} className="h-11 rounded-xl">
        <SendHorizontal className="w-4 h-4 rtl:-scale-x-100" />
        <span>{t('send')}</span>
      </Button>
    </form>
  );
}
