import React from 'react';
import { AlertOctagon, Volume2 } from 'lucide-react';
import { MUNSIT_VOICE_SETTINGS } from '../../config/munsit';
import { useI18n } from '../../i18n/I18nContext';
import type { TtsStatus } from '../../types/simulator';
import { VoiceBars } from '../ui/VoiceBars';

interface TtsIndicatorBannerProps {
  status: TtsStatus;
  error: string | null;
  isSpeaking: boolean;
  voiceId: string;
}

export const TtsIndicatorBanner = React.memo(function TtsIndicatorBanner({ status, error, isSpeaking, voiceId }: TtsIndicatorBannerProps) {
  const { t } = useI18n();
  if (!isSpeaking && status !== 'error') return null;
  const isError = status === 'error';
  return (
    <div className={`mx-6 mt-4 flex items-center justify-between gap-4 rounded-xl border px-4 py-2.5 text-xs ${isError ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-brand-soft border-indigo-100 text-brand'}`}>
      <div className="flex items-center gap-3">
        {isError ? <AlertOctagon className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        <div>
          <p className="font-bold">{isError ? t('tts_error') : status === 'generating' ? t('tts_generating') : t('tts_playing')}</p>
          <p className="text-[10px] opacity-75 font-mono" dir="ltr">{isError ? error : `Munsit · ${voiceId} · stability ${MUNSIT_VOICE_SETTINGS.stability}`}</p>
        </div>
      </div>
      {!isError && <VoiceBars />}
    </div>
  );
});
