import React from "react";
import { Tabs } from "radix-ui";
import { Activity, Layers, PhoneCall } from "lucide-react";
import { useI18n } from "../../i18n/I18nContext";
import type { EditorTab } from "../../types/flow";

interface TabSwitcherProps {
  activeTab: EditorTab;
  onChange: (tab: EditorTab) => void;
  diagnosticsCount: number;
}

const triggerClass =
  "flex items-center gap-2 h-8 px-3 rounded-lg text-xs font-medium text-ink-2 transition-colors " +
  "hover:text-ink data-[state=active]:bg-white data-[state=active]:text-ink data-[state=active]:shadow-sm " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40";

export const TabSwitcher = React.memo(function TabSwitcher({
  activeTab,
  onChange,
  diagnosticsCount,
}: TabSwitcherProps) {
  const { t, dir } = useI18n();
  return (
    <Tabs.Root
      value={activeTab}
      onValueChange={(value) => onChange(value as EditorTab)}
      dir={dir}
    >
      <Tabs.List
        className="flex items-center bg-surface p-1 rounded-xl border border-line"
        aria-label={t("title")}
      >
        <Tabs.Trigger value="canvas" className={triggerClass}>
          <Layers className="w-4 h-4" />
          <span>{t("tab_canvas")}</span>
        </Tabs.Trigger>
        <Tabs.Trigger value="simulator" className={triggerClass}>
          <PhoneCall className="w-4 h-4" />
          <span>{t("tab_simulator")}</span>
        </Tabs.Trigger>
        <Tabs.Trigger value="diagnostics" className={triggerClass}>
          <Activity className="w-4 h-4" />
          <span>{t("tab_diagnostics")}</span>
          {diagnosticsCount > 0 && (
            <span className="min-w-[18px] px-1.5 rounded-full bg-amber-400 text-ink text-[10px] font-bold text-center">
              {diagnosticsCount}
            </span>
          )}
        </Tabs.Trigger>
      </Tabs.List>
    </Tabs.Root>
  );
});
