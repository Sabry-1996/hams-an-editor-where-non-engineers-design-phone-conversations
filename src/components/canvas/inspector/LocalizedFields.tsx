import { useRef, useState } from "react";
import { useI18n } from "../../../i18n/I18nContext";
import type { LocalizedText } from "../../../types/flow";
import { textareaClass } from "../../ui/Field";

interface SuggestTextProps {
  value: string;
  dir: "rtl" | "ltr";
  variables: string[];
  onChange: (value: string) => void;
}

export function SuggestText({
  value,
  dir,
  variables,
  onChange,
}: SuggestTextProps) {
  const { t } = useI18n();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = useState<string | null>(null);
  const matches =
    query == null ? [] : variables.filter((name) => name.startsWith(query));

  const syncQuery = (next: string, cursor: number) => {
    const match = next.slice(0, cursor).match(/\{\{\s*([A-Za-z_]\w*)?$/);
    setQuery(match ? (match[1] ?? "") : null);
  };

  const insert = (name: string) => {
    const cursor = ref.current?.selectionStart ?? value.length;
    const head = value.slice(0, cursor);
    const match = head.match(/\{\{\s*([A-Za-z_]\w*)?$/);
    const start = match ? cursor - match[0].length : cursor;
    onChange(`${value.slice(0, start)}{{${name}}}${value.slice(cursor)}`);
    setQuery(null);
  };

  return (
    <div className="relative">
      <textarea
        ref={ref}
        dir={dir}
        rows={3}
        value={value}
        className={textareaClass}
        onChange={(e) => {
          onChange(e.target.value);
          syncQuery(
            e.target.value,
            e.target.selectionStart ?? e.target.value.length,
          );
        }}
        onKeyUp={(e) =>
          syncQuery(e.currentTarget.value, e.currentTarget.selectionStart ?? 0)
        }
        onClick={(e) =>
          syncQuery(e.currentTarget.value, e.currentTarget.selectionStart ?? 0)
        }
        onBlur={() => setTimeout(() => setQuery(null), 150)}
      />
      {query != null && (
        <ul
          className="pop-in absolute z-30 mt-1 w-full bg-white border border-line rounded-lg shadow-card max-h-36 overflow-y-auto"
          role="listbox"
        >
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-[11px] text-ink-3">
              {t("upstream_empty")}
            </li>
          ) : (
            matches.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  className="w-full text-start px-3 py-1.5 text-xs font-mono text-brand hover:bg-brand-soft"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insert(name);
                  }}
                >
                  {`{{${name}}}`}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export function LocalizedFields({
  text,
  variables,
  onChange,
}: {
  text: LocalizedText;
  variables: string[];
  onChange: (text: LocalizedText) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">
        {t("side_by_side")}
      </p>
      <p className="text-[10px] text-ink-3">{t("upstream_hint")}</p>
      <div className="grid grid-cols-1 gap-2">
        <label className="text-xs font-medium text-ink-2 block space-y-1">
          <span>{t("speech_ar")}</span>
          <SuggestText
            dir="rtl"
            value={text.ar}
            variables={variables}
            onChange={(ar) => onChange({ ...text, ar })}
          />
        </label>
        <label className="text-xs font-medium text-ink-2 block space-y-1">
          <span>{t("speech_en")}</span>
          <SuggestText
            dir="ltr"
            value={text.en}
            variables={variables}
            onChange={(en) => onChange({ ...text, en })}
          />
        </label>
      </div>
    </div>
  );
}
