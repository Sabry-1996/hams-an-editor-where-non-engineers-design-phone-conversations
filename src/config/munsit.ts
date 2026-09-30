import type { MunsitVoice } from '../types/simulator';

export const MUNSIT_API_BASE: string =
  (import.meta.env.VITE_MUNSIT_API_BASE || '/api/munsit/api/v1').replace(/\/$/, '');

export const MUNSIT_MODEL = 'faseeh-v1-preview';
export const MUNSIT_TTS_ENDPOINT = `${MUNSIT_API_BASE}/text-to-speech/${MUNSIT_MODEL}`;
export const MUNSIT_VOICES_ENDPOINT = `${MUNSIT_API_BASE}/voices`;
export const MUNSIT_TRANSCRIBE_ENDPOINT = `${MUNSIT_API_BASE}/audio/transcribe`;
/** Callers switch between Arabic and English mid-sentence ("Is an MRI covered ولا لازم موافقة"). */
export const MUNSIT_STT_MODEL = 'munsit-en-ar';
/** The live socket only accepts 8000 or 16000 Hz. */
export const MUNSIT_STT_SAMPLE_RATE = 16000;

export function munsitListenUrl(apiKey: string): string {
  const base = MUNSIT_API_BASE.startsWith('/')
    ? `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}${MUNSIT_API_BASE}`
    : MUNSIT_API_BASE.replace(/^http/, 'ws');
  const params = new URLSearchParams({
    api_key: apiKey,
    encoding: 'linear16',
    sample_rate: String(MUNSIT_STT_SAMPLE_RATE),
    model: MUNSIT_STT_MODEL,
    interim_results: 'true'
  });
  return `${base}/listen?${params}`;
}

export const MUNSIT_DEFAULT_VOICE_ID = 'ybQaNl0nzt9TjN3Oh1zzyNgp';

export const MUNSIT_DEV_API_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlfaWQiOiJkNmI4Yzg3ZC04ZTcwLTQzOTgtOGI0Ni05OTExNDQwNGQ4OTQiLCJpYXQiOjE3OTA3NjgxNDAsImV4cCI6MjEwNjEyODE0MH0.sRjX2ig1wa3LUbt1hESydcuWu-tvVHRZpADUG_bPI7M';

export const MUNSIT_VOICE_SETTINGS = {
  stability: 0.75,
  speed: 1.0,
  sample_rate: 48000,
  dialect: 'auto',
  code_switching: true
} as const;

export const MUNSIT_CURATED_VOICES: MunsitVoice[] = [
  { id: MUNSIT_DEFAULT_VOICE_ID, label: 'ريم - نجدية (Reem · Najdi Female)', gender: 'female', languages: ['ar', 'en'], dialect: ['najdi'] },
  { id: '08XOzRjaaumxbHhcGOrWkJ7z', label: 'هالة - صوت سعودي نسائي طبيعي (Hala · Najdi Female)', gender: 'female', languages: ['ar', 'en'], dialect: ['najdi'] },
  { id: 'IPK8qQ3F5NMiQLWFz1a83TG3', label: 'مها - نجدية (Maha · Najdi Female)', gender: 'female', languages: ['ar', 'en'], dialect: ['najdi'] },
  { id: 'ar-najdi-male-10', label: 'عبدالله - نجدي (Abdullah · Najdi Male)', gender: 'male', languages: ['ar', 'en'], dialect: ['najdi'] },
  { id: 'jEF6Tjsxg3rJhJijqItKNNey', label: 'تركي - نجدي (Turki · Najdi Male)', gender: 'male', languages: ['ar', 'en'], dialect: ['najdi'] }
];
