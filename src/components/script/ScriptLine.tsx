import React from 'react';
import clsx from 'clsx';
import { LoaderCircle, OctagonAlert, Play, Square } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import type { LocalizedText } from '../../types/flow';
import { Tooltip } from '../ui/Tooltip';
import { VoiceBars } from '../ui/VoiceBars';
import { useScriptView } from './ScriptViewContext';

/** Shows {{placeholders}} as chips so Reem sees which words come from the call. */
export function WithPlaceholders({ text }: { text: string }) {
  const parts = text.split(/(\{\{\s*\w+\s*\}\})/g);
  return (
    <>
      {parts.map((part, i) =>
        /^\{\{\s*\w+\s*\}\}$/.test(part) ? (
          <span key={i} className="rounded bg-brand-soft px-1 font-mono text-[0.85em] text-brand" dir="ltr">
            {part}
          </span>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

interface ScriptLineProps {
  /** Unique per line, so only the line being played shows the player. */
  lineKey: string;
  text: LocalizedText | undefined;
  caption?: string;
}

/** A spoken line in the speech language, with the other language beneath and a Munsit preview. */
export function ScriptLine({ lineKey, text, caption }: ScriptLineProps) {
  const { t, lang } = useI18n();
  const { preview } = useScriptView();
  const main = (lang === 'ar' ? text?.ar : text?.en)?.trim() ?? '';
  const other = (lang === 'ar' ? text?.en : text?.ar)?.trim() ?? '';
  const mine = preview.state?.key === lineKey ? preview.state : null;
  const busy = mine?.status === 'generating' || mine?.status === 'playing';

  const label = mine?.status === 'error'
    ? `${t('tts_error')}: ${mine.error ?? ''}`
    : mine?.status === 'generating'
      ? t('script_loading')
      : busy
        ? t('script_stop')
        : t('script_play');

  const onClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (busy) preview.stop();
    else void preview.play(lineKey, main);
  };

  return (
    <div className={clsx('flex items-start gap-3 rounded-xl border p-3', busy ? 'border-indigo-200 bg-brand-soft/60' : 'border-line-soft bg-surface')}>
      <Tooltip label={label} side="top">
        <button
          type="button"
          onClick={onClick}
          disabled={!main}
          aria-label={label}
          className={clsx(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-40',
            mine?.status === 'error'
              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
              : busy
                ? 'bg-brand text-white hover:bg-brand-dark'
                : 'bg-white text-brand border border-line hover:border-brand'
          )}
        >
          {mine?.status === 'generating' ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : mine?.status === 'playing' ? (
            <Square className="h-3.5 w-3.5 fill-current" />
          ) : mine?.status === 'error' ? (
            <OctagonAlert className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 translate-x-px fill-current" />
          )}
        </button>
      </Tooltip>
      <div className="min-w-0 flex-1 space-y-1.5">
        {caption && <p className="text-[11px] font-semibold text-ink-3">{caption}</p>}
        {main ? (
          <p className="text-sm leading-relaxed text-ink" dir="auto">
            <WithPlaceholders text={main} />
          </p>
        ) : (
          <p className="text-sm italic text-rose-600">{t('script_no_text')}</p>
        )}
        {other && (
          <>
            <span className="sr-only">{t('script_other_lang')}:</span>
            <p className="text-xs leading-relaxed text-ink-3" dir="auto">
              <WithPlaceholders text={other} />
            </p>
          </>
        )}
      </div>
      {mine?.status === 'playing' && (
        <span className="self-center">
          <VoiceBars />
        </span>
      )}
    </div>
  );
}
