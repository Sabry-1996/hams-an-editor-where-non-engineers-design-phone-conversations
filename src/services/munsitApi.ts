import {
  MUNSIT_CURATED_VOICES,
  MUNSIT_TTS_ENDPOINT,
  MUNSIT_VOICES_ENDPOINT,
  MUNSIT_VOICE_SETTINGS
} from '../config/munsit';
import type { MunsitVoice } from '../types/simulator';

export class MunsitApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'MunsitApiError';
  }
}

const statusHint = (status: number): string => {
  switch (status) {
    case 401: return ' — مفتاح API غير صالح أو منتهي (تحقق من x-api-key).';
    case 403: return ' — المفتاح لا يملك صلاحية هذا الموديل/الصوت.';
    case 429: return ' — تم تجاوز حد الطلبات المتزامنة، انتظر لحظة.';
    default: return '';
  }
};

const readErrorDetail = async (response: Response): Promise<string> => {
  try {
    const raw = await response.text();
    try {
      const parsed = JSON.parse(raw);
      return parsed.errorMessage || parsed.message || raw;
    } catch {
      return raw;
    }
  } catch {
    return '';
  }
};

export async function synthesizeSpeech(apiKey: string, voiceId: string, text: string): Promise<Blob> {
  let response: Response;
  try {
    response = await fetch(MUNSIT_TTS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify({
        voice_id: voiceId,
        text,
        stability: MUNSIT_VOICE_SETTINGS.stability,
        speed: MUNSIT_VOICE_SETTINGS.speed,
        sample_rate: MUNSIT_VOICE_SETTINGS.sample_rate,
        dialect: MUNSIT_VOICE_SETTINGS.dialect,
        code_switching: MUNSIT_VOICE_SETTINGS.code_switching,
        streaming: false
      })
    });
  } catch (error) {
    if (error instanceof TypeError && /fetch/i.test(error.message)) {
      throw new MunsitApiError(
        `تعذر الوصول إلى Munsit API عبر ${MUNSIT_TTS_ENDPOINT}. تأكد أن خادم Vite يعمل مع إعداد الـ proxy.`
      );
    }
    throw error;
  }

  if (!response.ok) {
    const detail = await readErrorDetail(response);
    throw new MunsitApiError(
      `Munsit API HTTP ${response.status}${detail ? ` – ${detail.slice(0, 200)}` : ''}${statusHint(response.status)}`,
      response.status
    );
  }

  const blob = await response.blob();
  if (!blob.size) throw new MunsitApiError('Munsit API أعاد ملف صوتي فارغ.', response.status);
  return blob;
}

interface RawVoice {
  voice_id: string;
  name?: string;
  gender?: string | null;
  languages?: string[];
  dialect?: string[];
}

const toVoice = (v: RawVoice): MunsitVoice => ({
  id: v.voice_id,
  label: `${v.name || v.voice_id}${v.dialect?.length ? ` - ${v.dialect.join('/')}` : ''}${v.gender ? ` (${v.gender})` : ''}`,
  gender: v.gender ?? null,
  languages: v.languages ?? [],
  dialect: v.dialect ?? []
});

const isSaudi = (v: MunsitVoice) => ((v.dialect || []).some(d => /najdi|hijazi|saudi/i.test(d)) ? 0 : 1);
const isFemale = (v: MunsitVoice) => (v.gender === 'female' ? 0 : 1);

export async function listVoices(apiKey: string): Promise<MunsitVoice[]> {
  const response = await fetch(MUNSIT_VOICES_ENDPOINT, { headers: { 'x-api-key': apiKey } });
  if (!response.ok) throw new MunsitApiError(`Munsit voices HTTP ${response.status}`, response.status);
  const data = await response.json();
  const list: RawVoice[] = Array.isArray(data) ? data : (data?.voices ?? []);
  const fetched = list.filter(v => v && typeof v.voice_id === 'string').map(toVoice);
  const curatedIds = new Set(MUNSIT_CURATED_VOICES.map(v => v.id));
  const rest = fetched
    .filter(v => !curatedIds.has(v.id))
    .sort((a, b) => isSaudi(a) - isSaudi(b) || isFemale(a) - isFemale(b) || a.label.localeCompare(b.label));
  return [...MUNSIT_CURATED_VOICES, ...rest];
}
