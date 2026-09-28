import { PhoneCall, Square } from 'lucide-react';
import { useSimulator } from '../../context/SimulatorContext';
import { useVoiceSettings } from '../../context/VoiceSettingsContext';
import { ToolBehaviorSelector } from './ToolBehaviorSelector';
import { VoiceSettingsCard } from './VoiceSettingsCard';

export function CallControlPanel() {
  const { simulator } = useSimulator();
  const { apiKey, setApiKey, voices, voicesLoadState, selectedVoiceId, setSelectedVoiceId } = useVoiceSettings();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PhoneCall className="w-5 h-5 text-teal-400" />
          <h2 className="text-sm font-bold text-slate-200">محاكي المكالمة الحية</h2>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          simulator.active ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
        }`}>
          {simulator.active ? 'المكالمة نشطة' : 'متوقف'}
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

        <div className="pt-2">
          {!simulator.active ? (
            <button
              onClick={simulator.start}
              className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-900/50 transition"
            >
              <PhoneCall className="w-4 h-4" />
              <span>بدء المكالمة التجريبية</span>
            </button>
          ) : (
            <button
              onClick={simulator.stop}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-900/50 transition"
            >
              <Square className="w-4 h-4" />
              <span>إنهاء المكالمة</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
