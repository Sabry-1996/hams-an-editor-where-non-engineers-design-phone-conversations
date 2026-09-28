import React from 'react';
import { Cpu } from 'lucide-react';
import { MUNSIT_MODEL, MUNSIT_VOICE_SETTINGS } from '../../config/munsit';
import { useI18n } from '../../i18n/I18nContext';
import type { MunsitVoice, VoicesLoadState } from '../../types/simulator';
import { Field, inputClass } from '../ui/Field';
import { Select } from '../ui/Select';

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
      <Field label={t('voice')} hint={<span className="text-ink-3">{hint}</span>}>
        <Select
          ariaLabel={t('voice')}
          value={selectedVoiceId}
          onValueChange={onVoiceChange}
          options={voices.map(voice => ({ value: voice.id, label: voice.label }))}
        />
      </Field>
      <div className="bg-brand-soft border border-indigo-100 rounded-xl p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-brand flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" />
            <span>{t('human_tone')}</span>
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">{t('cloud_only')}</span>
        </div>
        <p className="text-[10px] text-ink-2 font-mono" dir="ltr">
          {MUNSIT_MODEL} · stability {MUNSIT_VOICE_SETTINGS.stability} · code_switching
        </p>
        <p className="text-[10px] text-ink-2">{t('no_cloud_voice')}</p>
      </div>
    </>
  );
});
