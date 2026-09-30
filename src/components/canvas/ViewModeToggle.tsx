import React from "react";
import clsx from "clsx";
import { Network, ScrollText } from "lucide-react";
import { useI18n } from "../../i18n/I18nContext";
import type { CanvasViewMode } from "../../types/flow";
import type { MessageKey } from "../../i18n/messages";

const OPTIONS: Array<{ value: CanvasViewMode; key: MessageKey; icon: React.ReactNode }> = [
  { value: "graph", key: "view_graph", icon: <Network className="w-4 h-4" /> },
  { value: "script", key: "view_script", icon: <ScrollText className="w-4 h-4" /> },
];

interface ViewModeToggleProps {
  value: CanvasViewMode;
  onChange: (mode: CanvasViewMode) => void;
  className?: string;
}

/** Switches the canvas between the node graph and the readable call script. */
export function ViewModeToggle({ value, onChange, className }: ViewModeToggleProps) {
  const { t } = useI18n();
  return (
    <div
      role="group"
      aria-label={t("view_mode")}
      className={clsx(
        "flex items-center gap-0.5 rounded-xl border border-line bg-white p-1 shadow-card",
        className,
      )}
    >
      {OPTIONS.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={clsx(
              "flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
              active
                ? "bg-brand text-white shadow-sm"
                : "text-ink-2 hover:bg-surface hover:text-ink",
            )}
          >
            {option.icon}
            <span>{t(option.key)}</span>
          </button>
        );
      })}
    </div>
  );
}
