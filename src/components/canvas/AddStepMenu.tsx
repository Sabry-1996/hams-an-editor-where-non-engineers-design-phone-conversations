import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useI18n } from "../../i18n/I18nContext";
import type { MessageKey } from "../../i18n/messages";
import type { NodeKind } from "../../types/flow";
import { Button } from "../ui/Button";
import { NODE_STYLES } from "./nodeStyles";

export const ADDABLE_KINDS: NodeKind[] = [
  "say",
  "ask",
  "condition",
  "tool",
  "transfer",
  "end",
];

interface StepPaletteProps {
  /** Label of the step the new one will follow, if any. */
  anchorLabel?: string;
  onPick: (kind: NodeKind) => void;
  onClose: () => void;
}

/** Card listing every step kind (icon · name · description); opened and closed from the board controls. */
export function StepPalette({
  anchorLabel,
  onPick,
  onClose,
}: StepPaletteProps) {
  const { t, dir } = useI18n();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    ref.current
      ?.querySelector<HTMLButtonElement>("[role=menuitem]")
      ?.focus({ preventScroll: true });
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      ref={ref}
      dir={dir}
      className="w-72 bg-white border border-line rounded-2xl shadow-card p-2 text-start"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between gap-2 px-2 py-1.5">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-ink">{t("add_node")}</div>
          <div className="text-[10px] text-ink-3 truncate">
            {anchorLabel
              ? t("add_after", { label: anchorLabel })
              : t("add_free")}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          aria-label={t("close")}
          onClick={onClose}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
      <div
        role="menu"
        aria-label={t("add_node")}
        className="mt-1 flex max-h-[min(28rem,calc(100vh-8rem))] flex-col gap-0.5 overflow-y-auto"
      >
        {ADDABLE_KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            role="menuitem"
            onClick={() => onPick(kind)}
            className="w-full flex items-start gap-3 px-2 py-2 rounded-xl text-start hover:bg-surface focus:bg-brand-soft focus:outline-none"
          >
            <span
              className={`mt-0.5 p-1.5 rounded-lg border ${NODE_STYLES[kind].headerClass}`}
            >
              {NODE_STYLES[kind].icon}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold leading-tight text-ink">
                {t(kind)}
              </span>
              <span className="mt-0.5 block text-[11px] leading-snug text-ink-3">
                {t(`desc_${kind}` as MessageKey)}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default React.memo(StepPalette);
