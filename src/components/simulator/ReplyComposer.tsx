import React, { useState } from "react";
import clsx from "clsx";
import { AudioLines, Loader2, Mic, MicOff, SendHorizontal, Square } from "lucide-react";
import { useI18n } from "../../i18n/I18nContext";
import type { SttMode } from "../../hooks/useMunsitSTT";
import { Button } from "../ui/Button";
import { Tooltip } from "../ui/Tooltip";

interface ReplyComposerProps {
  disabled: boolean;
  choices?: string[];
  sttMode: SttMode;
  interim: string;
  onSend: (text: string) => void;
  onMicToggle: () => void;
  onLiveToggle: () => void;
}

export function ReplyComposer({
  disabled,
  choices = [],
  sttMode,
  interim,
  onSend,
  onMicToggle,
  onLiveToggle,
}: ReplyComposerProps) {
  const { t } = useI18n();
  const [draft, setDraft] = useState("");
  const recording = sttMode === "recording";
  const transcribing = sttMode === "transcribing";
  const live = sttMode === "live";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onSend(draft);
    setDraft("");
  };

  const micLabel = recording ? t("mic_send") : transcribing ? t("mic_transcribing") : t("mic_talk");
  const liveLabel = live ? t("live_stop") : t("live_start");

  return (
    <form onSubmit={submit} className="bg-white border-t border-line">
      {choices.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pt-3">
          {choices.map((choice) => (
            <button
              key={choice}
              type="button"
              disabled={disabled}
              onClick={() => onSend(choice)}
              className="rounded-full border border-brand/30 bg-brand-soft px-4 py-2 text-sm font-medium text-brand hover:bg-brand hover:text-white disabled:opacity-50"
            >
              {choice}
            </button>
          ))}
        </div>
      )}
      {(live || recording || transcribing) && (
        <div className="flex items-center gap-2 px-4 pt-3 text-xs text-brand" aria-live="polite">
          <span className={clsx("h-2 w-2 rounded-full", transcribing ? "bg-amber-500" : "bg-rose-500 animate-pulse")} />
          <span className="truncate" dir="auto">
            {interim || (transcribing ? t("mic_transcribing") : live ? t("live_listening") : t("mic_send"))}
          </span>
        </div>
      )}
      <div className="p-4 flex items-center gap-3">
        <Tooltip label={liveLabel} side="top">
          <button
            type="button"
            aria-label={liveLabel}
            aria-pressed={live}
            disabled={disabled || recording || transcribing}
            onClick={onLiveToggle}
            className={clsx(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors disabled:opacity-50",
              live ? "border-rose-500 bg-rose-500 text-white" : "border-line bg-white text-ink-2 hover:border-brand hover:text-brand",
            )}
          >
            {live ? <MicOff className="h-4 w-4" /> : <AudioLines className="h-4 w-4" />}
          </button>
        </Tooltip>
        <Tooltip label={micLabel} side="top">
          <button
            type="button"
            aria-label={micLabel}
            aria-pressed={recording}
            disabled={disabled || live || transcribing}
            onClick={onMicToggle}
            className={clsx(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors disabled:opacity-50",
              recording ? "border-rose-500 bg-rose-50 text-rose-600" : "border-line bg-white text-ink-2 hover:border-brand hover:text-brand",
            )}
          >
            {transcribing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : recording ? (
              <Square className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </button>
        </Tooltip>
        <label className="sr-only" htmlFor="caller-reply">
          {t("user")}
        </label>
        <input
          id="caller-reply"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={disabled ? t("reply_disabled") : t("reply_placeholder")}
          disabled={disabled}
          className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-white px-4 text-sm text-ink placeholder:text-ink-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 disabled:bg-surface disabled:opacity-70"
          dir="auto"
        />
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={disabled}
          className="h-11 rounded-xl"
        >
          <SendHorizontal className="w-4 h-4 rtl:-scale-x-100" />
          <span>{t("send")}</span>
        </Button>
      </div>
    </form>
  );
}
