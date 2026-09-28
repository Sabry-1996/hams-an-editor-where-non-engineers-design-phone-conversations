import React from 'react';
import { AlertOctagon, Volume2 } from 'lucide-react';
import { MUNSIT_VOICE_SETTINGS } from '../../config/munsit';
import type { TtsStatus } from '../../types/simulator';
import { VoiceBars } from '../ui/VoiceBars';

interface TtsIndicatorBannerProps {
  status: TtsStatus;
  error: string | null;
  isSpeaking: boolean;
  voiceId: string;
}

export const TtsIndicatorBanner = React.memo(function TtsIndicatorBanner({ status, error, isSpeaking, voiceId }: TtsIndicatorBannerProps) {
  if (!isSpeaking && status !== 'error') return null;
  const isError = status === 'error';

  return (
    <div className={`mx-6 mt-4 flex items-center justify-between gap-4 rounded-xl border px-4 py-2.5 text-xs shadow-lg ${
      isError
        ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
        : 'bg-gradient-to-l from-teal-950/70 to-slate-900 border-teal-500/40 text-teal-100'
    }`}>
      <div className="flex items-center gap-3">
        {isError ? (
          <AlertOctagon className="w-4 h-4 text-rose-400 flex-shrink-0" />
        ) : (
          <Volume2 className={`w-4 h-4 text-teal-300 flex-shrink-0 ${status === 'playing' ? 'animate-pulse' : ''}`} />
        )}
        <div>
          <p className="font-bold">
            {isError
              ? 'تعذر توليد الصوت عبر Munsit'
              : status === 'generating'
                ? 'يتم توليد صوت ريم عبر Munsit API...'
                : 'ريم تتحدث الآن بصوت بشري طبيعي'}
          </p>
          <p className="text-[10px] opacity-75 font-mono" dir="ltr">
            {isError ? error : `Munsit Cloud TTS • voice ${voiceId} • stability ${MUNSIT_VOICE_SETTINGS.stability} • code_switching on`}
          </p>
        </div>
      </div>
      {!isError && (
        <div className="flex items-center gap-2">
          <VoiceBars />
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
            {status === 'generating' ? 'Generating' : 'Streaming'}
          </span>
        </div>
      )}
    </div>
  );
});
