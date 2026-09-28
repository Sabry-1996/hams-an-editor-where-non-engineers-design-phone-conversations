import React from 'react';
import { Cpu } from 'lucide-react';
import { MUNSIT_MODEL, MUNSIT_VOICE_SETTINGS } from '../../config/munsit';
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

const loadStateLabel: Record<VoicesLoadState, (count: number) => string> = {
  idle: () => '',
  loading: () => 'جاري تحميل الأصوات...',
  loaded: count => `${count} صوت من Munsit`,
  error: () => 'تعذر تحميل القائمة الكاملة'
};

const loadStateClass: Record<VoicesLoadState, string> = {
  idle: 'text-slate-500',
  loading: 'text-slate-500',
  loaded: 'text-emerald-400',
  error: 'text-rose-400'
};

export const VoiceSettingsCard = React.memo(function VoiceSettingsCard({
  apiKey, onApiKeyChange, voices, voicesLoadState, selectedVoiceId, onVoiceChange
}: VoiceSettingsCardProps) {
  return (
    <>
      <Field label="مفتاح Munsit API Key">
        <input type="password" value={apiKey} onChange={e => onApiKeyChange(e.target.value)} className={`${inputClass} font-mono text-slate-300`} />
      </Field>

      <Field
        label="اختر الصوت (Saudi / Bilingual Voice)"
        hint={<span className={loadStateClass[voicesLoadState]}>{loadStateLabel[voicesLoadState](voices.length)}</span>}
      >
        <select value={selectedVoiceId} onChange={e => onVoiceChange(e.target.value)} className={inputClass}>
          {voices.map(v => (
            <option key={v.id} value={v.id}>{v.label}</option>
          ))}
        </select>
        <p className="text-[10px] text-slate-500 mt-1 font-mono" dir="ltr">voice_id: {selectedVoiceId}</p>
      </Field>

      <div className="bg-slate-950/80 border border-teal-500/20 rounded-xl p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-teal-300 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" />
            <span>إعدادات النبرة البشرية (Munsit)</span>
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">Cloud Only</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono" dir="ltr">
          <div className="bg-slate-900 rounded px-2 py-1 text-slate-300">stability: <span className="text-teal-300">{MUNSIT_VOICE_SETTINGS.stability}</span></div>
          <div className="bg-slate-900 rounded px-2 py-1 text-slate-300">speed: <span className="text-teal-300">{MUNSIT_VOICE_SETTINGS.speed}</span></div>
          <div className="bg-slate-900 rounded px-2 py-1 text-slate-300">code_switching: <span className="text-teal-300">true</span></div>
          <div className="bg-slate-900 rounded px-2 py-1 text-slate-300">sample_rate: <span className="text-teal-300">{MUNSIT_VOICE_SETTINGS.sample_rate / 1000}kHz</span></div>
          <div className="bg-slate-900 rounded px-2 py-1 text-slate-300 col-span-2">model: <span className="text-teal-300">{MUNSIT_MODEL}</span> · format: <span className="text-teal-300">wav</span></div>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          لا يتم استخدام صوت المتصفح الآلي (speechSynthesis) إطلاقاً؛ كل جملة تُولَّد عبر خوادم Munsit السحابية.
        </p>
      </div>
    </>
  );
});
