import { PhoneCall } from 'lucide-react';
import { useSimulator } from '../../context/SimulatorContext';
import { useVoiceSettings } from '../../context/VoiceSettingsContext';
import type { LanguageMode } from '../../types/flow';
import { VoiceBars } from '../ui/VoiceBars';
import { ReplyComposer } from './ReplyComposer';
import { TranscriptMessage } from './TranscriptMessage';
import { TtsIndicatorBanner } from './TtsIndicatorBanner';

export function TranscriptPanel() {
  const { simulator, tts } = useSimulator();
  const { languageMode, setLanguageMode, selectedVoiceId } = useVoiceSettings();

  const dotClass = tts.isSpeaking ? 'bg-teal-400 animate-ping' : tts.status === 'error' ? 'bg-rose-500' : 'bg-slate-600';

  return (
    <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${dotClass}`} />
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <span>ريم - المساعد الصوتي لشفاء كير</span>
              {tts.isSpeaking && (
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-teal-300 bg-teal-500/10 border border-teal-500/30 px-2 py-0.5 rounded-full">
                  <VoiceBars heightClass="h-3.5" gapClass="gap-[2px]" />
                  <span>{tts.status === 'generating' ? 'جاري توليد الصوت...' : 'ريم تتحدث الآن'}</span>
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              العقدة الحالية: <span className="text-teal-400 font-mono">{simulator.currentNodeId}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">لغة المحادثة:</span>
          <select
            value={languageMode}
            onChange={e => setLanguageMode(e.target.value as LanguageMode)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200"
          >
            <option value="bilingual">عربي / إنجليزي (Bilingual)</option>
            <option value="ar">عربي فقط (Arabic)</option>
            <option value="en">English Only</option>
          </select>
        </div>
      </div>

      <TtsIndicatorBanner status={tts.status} error={tts.error} isSpeaking={tts.isSpeaking} voiceId={selectedVoiceId} />

      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {simulator.logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <PhoneCall className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">اضغط على "بدء المكالمة التجريبية" لبدء الاختبار الصوتي الفوري.</p>
          </div>
        ) : (
          simulator.logs.map((entry, index) => <TranscriptMessage key={index} entry={entry} />)
        )}
      </div>

      <ReplyComposer disabled={!simulator.active} onSend={simulator.sendUserReply} />
    </div>
  );
}
