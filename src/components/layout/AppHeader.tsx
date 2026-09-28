import React from "react";
import { Download, Languages, Upload } from "lucide-react";
import { useFlow } from "../../context/FlowContext";
import { useI18n } from "../../i18n/I18nContext";
import type { EditorTab } from "../../types/flow";
import { Button } from "../ui/Button";
import { Tooltip } from "../ui/Tooltip";
import { TabSwitcher } from "./TabSwitcher";

interface AppHeaderProps {
  activeTab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
  diagnosticsCount: number;
  onExport: () => void;
  onImportFile: (file: File) => void;
}

export function AppHeader({
  activeTab,
  onTabChange,
  diagnosticsCount,
  onExport,
  onImportFile,
}: AppHeaderProps) {
  const { t, lang, setLang } = useI18n();
  const { flow, renameFlow } = useFlow();
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void onImportFile(file);
    e.target.value = "";
  };

  return (
    <header className="flex items-center justify-between gap-4 px-4 h-14 bg-white border-b border-line z-30">
      <div className="flex items-center gap-3 min-w-0">
        <img
          src="/hams-logo.png"
          alt="Hams.AI"
          className="h-7 w-auto shrink-0 mt-3"
        />
        <div className="hidden md:flex items-center min-w-0 border-s border-line ps-3">
          <input
            type="text"
            value={flow.name}
            onChange={(e) => renameFlow(e.target.value)}
            aria-label={t("workflow_name")}
            title={t("workflow_name")}
            placeholder={t("workflow_name")}
            dir="auto"
            className="h-8 w-48 rounded-lg border border-transparent bg-transparent px-2 text-sm font-semibold text-ink placeholder:text-ink-3 hover:border-line hover:bg-surface focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/15"
          />
        </div>
      </div>
      <TabSwitcher
        activeTab={activeTab}
        onChange={onTabChange}
        diagnosticsCount={diagnosticsCount}
      />
      <div className="flex items-center gap-2">
        <div
          role="group"
          aria-label={t("lang_switch")}
          className="flex items-center rounded-lg border border-line bg-surface p-0.5"
        >
          <Languages className="mx-1.5 h-3.5 w-3.5 text-ink-3" />
          {(["ar", "en"] as const).map((code) => (
            <button
              key={code}
              type="button"
              aria-pressed={lang === code}
              onClick={() => setLang(code)}
              className={`h-7 rounded-md px-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                lang === code
                  ? "bg-brand text-white shadow-sm"
                  : "text-ink-2 hover:text-ink"
              }`}
            >
              {code === "ar" ? "ع" : "EN"}
            </button>
          ))}
        </div>
        <Tooltip label={t("import")} side="bottom">
          <label className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium bg-white text-ink border border-line hover:bg-surface cursor-pointer focus-within:ring-2 focus-within:ring-brand/40">
            <Upload className="w-4 h-4" />
            <span className="sr-only md:not-sr-only">{t("import")}</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleImport}
              className="sr-only"
              aria-label={t("import")}
            />
          </label>
        </Tooltip>
        <Button variant="primary" onClick={onExport} aria-label={t("export")}>
          <Download className="w-4 h-4" />
          <span className="sr-only md:not-sr-only">{t("export")}</span>
        </Button>
      </div>
    </header>
  );
}
