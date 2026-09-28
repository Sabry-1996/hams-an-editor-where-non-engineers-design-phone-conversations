import { PhoneCall, Square } from "lucide-react";
import { useSimulator } from "../../context/SimulatorContext";
import { useVoiceSettings } from "../../context/VoiceSettingsContext";
import { useI18n } from "../../i18n/I18nContext";
import { Button } from "../ui/Button";
import { cardClass } from "../ui/Field";
import { ToolBehaviorSelector } from "./ToolBehaviorSelector";
import { VoiceSettingsCard } from "./VoiceSettingsCard";

export function CallControlPanel() {
  const { t } = useI18n();
  const { simulator } = useSimulator();
  const {
    apiKey,
    setApiKey,
    voices,
    voicesLoadState,
    selectedVoiceId,
    setSelectedVoiceId,
  } = useVoiceSettings();

  return (
    <div className={`${cardClass} p-5`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-ink">{t("sim_title")}</h2>
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${simulator.active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-surface text-ink-2 border-line"}`}
        >
          {simulator.active ? t("sim_on") : t("sim_off")}
        </span>
      </div>
      <div className="space-y-4">
        <VoiceSettingsCard
          apiKey={apiKey}
          onApiKeyChange={setApiKey}
          voices={voices}
          voicesLoadState={voicesLoadState}
          selectedVoiceId={selectedVoiceId}
          onVoiceChange={setSelectedVoiceId}
        />
        <ToolBehaviorSelector
          value={simulator.toolBehavior}
          onChange={simulator.setToolBehavior}
        />
        {!simulator.active ? (
          <Button
            variant="primary"
            size="md"
            onClick={simulator.start}
            className="w-full h-11 rounded-xl font-semibold"
          >
            <PhoneCall className="w-4 h-4" />
            <span>{t("start_call")}</span>
          </Button>
        ) : (
          <Button
            size="md"
            onClick={simulator.stop}
            className="w-full h-11 rounded-xl font-semibold bg-rose-600 text-white border-rose-600 hover:bg-rose-700"
          >
            <Square className="w-4 h-4" />
            <span>{t("stop_call")}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
