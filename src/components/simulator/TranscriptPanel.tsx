import { PhoneCall } from 'lucide-react';
import { useSimulator } from '../../context/SimulatorContext';
import { useVoiceSettings } from '../../context/VoiceSettingsContext';
import { useI18n } from '../../i18n/I18nContext';
import { VoiceBars } from '../ui/VoiceBars';
import { ReplyComposer } from './ReplyComposer';
import { TranscriptMessage } from './TranscriptMessage';
import { TtsIndicatorBanner } from './TtsIndicatorBanner';

export function TranscriptPanel() {
  const { t } = useI18n();
  const { simulator, tts } = useSimulator();
  const { selectedVoiceId } = useVoiceSettings();
  const dotClass = tts.isSpeaking ? 'bg-teal-400 animate-ping' : tts.status === 'error' ? 'bg-rose-500' : 'bg-slate-600';

  return (
    <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${dotClass}`} />
          <div>
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <span>{t('agent')}</span>
              {tts.isSpeaking && (
                <span className="flex items-center gap-1.5 text-[10px] text-teal-300">
                  <VoiceBars heightClass="h-3.5" gapClass="gap-[2px]" />
                  <span>{tts.status === 'generating' ? t('tts_generating') : t('tts_playing')}</span>
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              {t('current_node')}: <span className="text-teal-400 font-mono">{simulator.currentNodeId}</span>
            </p>
          </div>
        </div>
      </div>
      <TtsIndicatorBanner status={tts.status} error={tts.error} isSpeaking={tts.isSpeaking} voiceId={selectedVoiceId} />
      <div className="flex-1 p-6 overflow-y-auto space-y-4" aria-live="polite">
        {simulator.logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <PhoneCall className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">{t('empty_log')}</p>
          </div>
        ) : simulator.logs.map((entry, index) => <TranscriptMessage key={index} entry={entry} />)}
      </div>
      <ReplyComposer disabled={!simulator.active} onSend={simulator.sendUserReply} />
    </div>
  );
}
