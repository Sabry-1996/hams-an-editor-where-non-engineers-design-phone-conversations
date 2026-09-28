import { useEffect, useRef } from 'react';
import { PhoneCall } from 'lucide-react';
import { useFlow } from '../../context/FlowContext';
import { useSimulator } from '../../context/SimulatorContext';
import { useVoiceSettings } from '../../context/VoiceSettingsContext';
import { useI18n } from '../../i18n/I18nContext';
import { cardClass } from '../ui/Field';
import { VoiceBars } from '../ui/VoiceBars';
import { askChoiceButtons } from '../../utils/ruleValue';
import { ReplyComposer } from './ReplyComposer';
import { TranscriptMessage } from './TranscriptMessage';
import { TtsIndicatorBanner } from './TtsIndicatorBanner';

export function TranscriptPanel() {
  const { t, lang } = useI18n();
  const { flow } = useFlow();
  const { simulator, tts } = useSimulator();
  const { selectedVoiceId } = useVoiceSettings();
  const scroller = useRef<HTMLDivElement>(null);
  const dotClass = tts.isSpeaking ? 'bg-brand animate-ping' : tts.status === 'error' ? 'bg-rose-500' : simulator.active ? 'bg-emerald-500' : 'bg-line';

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [simulator.logs.length]);

  return (
    <div className={`${cardClass} flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden`}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-line">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${dotClass}`} />
          <div>
            <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
              <span>{t('agent')}</span>
              {tts.isSpeaking && (
                <span className="flex items-center gap-1.5 text-[10px] text-brand">
                  <VoiceBars heightClass="h-3.5" gapClass="gap-[2px]" />
                  <span>{tts.status === 'generating' ? t('tts_generating') : t('tts_playing')}</span>
                </span>
              )}
            </h2>
            <p className="text-xs text-ink-2">
              {t('current_node')}: <span className="text-brand font-mono">{simulator.currentNodeId}</span>
            </p>
          </div>
        </div>
      </div>
      <TtsIndicatorBanner status={tts.status} error={tts.error} isSpeaking={tts.isSpeaking} voiceId={selectedVoiceId} />
      <div ref={scroller} className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-surface/50 p-6" aria-live="polite">
        {simulator.logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-ink-3">
            <PhoneCall className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">{t('empty_log')}</p>
          </div>
        ) : simulator.logs.map((entry, index) => <TranscriptMessage key={index} entry={entry} />)}
      </div>
      <ReplyComposer
        disabled={!simulator.active}
        choices={simulator.active ? askChoiceButtons(flow, simulator.currentNodeId, lang).map(choice => choice.label) : []}
        onSend={simulator.sendUserReply}
      />
    </div>
  );
}
