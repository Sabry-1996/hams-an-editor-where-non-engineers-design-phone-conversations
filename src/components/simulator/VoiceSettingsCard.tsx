import React from 'react';
import { Cpu } from 'lucide-react';
import { MUNSIT_MODEL, MUNSIT_VOICE_SETTINGS } from '../../config/munsit';
import { useI18n } from '../../i18n/I18nContext';
import type { MunsitVoice, VoicesLoadState } from '../../types/simulator';
import { Field, inputClass } from '../ui/Field';

interface VoiceSettingsCardProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  voices: MunsitVoice[];
  voicesLoadState: VoicesLoadState;
  selectedVoiceId: string;
  onVoiceChange: (id: string) => void;
}

export const VoiceSettingsCard = React.memo(function VoiceSettingsCard({
  apiKey, onApiKeyChange, voices, voicesLoadState, selectedVoiceId, onVoiceChange
}: VoiceSettingsCardProps) {
  const { t } = useI18n();
  const hint = voicesLoadState === 'loading'
    ? t('voices_loading')
    : voicesLoadState === 'error'
      ? t('voices_error')
      : voicesLoadState === 'loaded'
        ? t('voices_loaded', { count: String(voices.length) })
        : '';

  return (
    <>
      <Field label={t('api_key')}>
        <input type="password" value={apiKey} onChange={e => onApiKeyChange(e.target.value)} className={`${inputClass} font-mono`} />
      </Field>
      <Field label={t('voice')} hint={<span className="text-slate-500">{hint}</span>}>
        <select value={selectedVoiceId} onChange={e => onVoiceChange(e.target.value)} className={inputClass}>
          {voices.map(voice => <option key={voice.id} value={voice.id}>{voice.label}</option>)}
        </select>
      </Field>
      <div className="bg-slate-950 border border-teal-500/20 rounded-xl p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-teal-300 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" />
            <span>{t('human_tone')}</span>
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300">{t('cloud_only')}</span>
        </div>
        <p className="text-[10px] text-slate-500 font-mono" dir="ltr">
          {MUNSIT_MODEL} · stability {MUNSIT_VOICE_SETTINGS.stability} · code_switching
        </p>
        <p className="text-[10px] text-slate-500">{t('no_cloud_voice')}</p>
      </div>
    </>
  );
});
