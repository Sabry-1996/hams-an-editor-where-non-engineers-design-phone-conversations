import { PhoneCall, Square } from 'lucide-react';
import { useSimulator } from '../../context/SimulatorContext';
import { useVoiceSettings } from '../../context/VoiceSettingsContext';
import { useI18n } from '../../i18n/I18nContext';
import { ToolBehaviorSelector } from './ToolBehaviorSelector';
import { VoiceSettingsCard } from './VoiceSettingsCard';

export function CallControlPanel() {
  const { t } = useI18n();
  const { simulator } = useSimulator();
  const { apiKey, setApiKey, voices, voicesLoadState, selectedVoiceId, setSelectedVoiceId } = useVoiceSettings();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-slate-200">{t('sim_title')}</h2>
        <span className={`px-2.5 py-0.5 rounded-full text-xs ${simulator.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
          {simulator.active ? t('sim_on') : t('sim_off')}
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
        <ToolBehaviorSelector value={simulator.toolBehavior} onChange={simulator.setToolBehavior} />
        {!simulator.active ? (
          <button type="button" onClick={simulator.start} className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
            <PhoneCall className="w-4 h-4" /><span>{t('start_call')}</span>
          </button>
        ) : (
          <button type="button" onClick={simulator.stop} className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
            <Square className="w-4 h-4" /><span>{t('stop_call')}</span>
          </button>
        )}
      </div>
    </div>
  );
}
