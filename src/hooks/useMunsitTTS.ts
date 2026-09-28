import { useCallback, useMemo, useRef, useState } from 'react';
import { synthesizeSpeech } from '../services/munsitApi';
import type { TtsStatus } from '../types/simulator';
import { useLatest } from './useLatest';

interface UseMunsitTTSOptions {
  apiKey: string;
  voiceId: string;
  onError?: (message: string) => void;
}

export function useMunsitTTS({ apiKey, voiceId, onError }: UseMunsitTTSOptions) {
  const [status, setStatus] = useState<TtsStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const apiKeyRef = useLatest(apiKey);
  const voiceIdRef = useLatest(voiceId);
  const onErrorRef = useLatest(onError);

  const stop = useCallback(() => {
    const current = audioRef.current;
    if (!current) return;
    current.onended = null;
    current.onerror = null;
    current.pause();
    if (current.src.startsWith('blob:')) URL.revokeObjectURL(current.src);
    audioRef.current = null;
  }, []);

  const reset = useCallback(() => {
    stop();
    setIsSpeaking(false);
    setStatus('idle');
    setError(null);
  }, [stop]);

  const playBlob = useCallback((blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioRef.current = audio;
    return new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        URL.revokeObjectURL(url);
        if (audioRef.current === audio) audioRef.current = null;
      };
      audio.onended = () => { cleanup(); resolve(); };
      audio.onerror = () => { cleanup(); reject(new Error('تعذر تشغيل الملف الصوتي المستلم من Munsit.')); };
      audio.play().then(() => setStatus('playing')).catch(err => { cleanup(); reject(err); });
    });
  }, []);

  const speak = useCallback(async (text: string): Promise<void> => {
    const trimmed = text.trim();
    if (!trimmed) return;
    stop();
    setIsSpeaking(true);
    setStatus('generating');
    setError(null);
    try {
      const key = apiKeyRef.current.trim();
      if (!key) throw new Error('مفتاح Munsit API غير موجود. أدخل المفتاح لتشغيل الصوت الطبيعي.');
      const blob = await synthesizeSpeech(key, voiceIdRef.current, trimmed);
      await playBlob(blob);
      setStatus('idle');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setStatus('error');
      setError(message);
      onErrorRef.current?.(message);
    } finally {
      setIsSpeaking(false);
    }
  }, [stop, playBlob, apiKeyRef, voiceIdRef, onErrorRef]);

  return useMemo(() => ({ status, error, isSpeaking, speak, stop, reset }), [status, error, isSpeaking, speak, stop, reset]);
}

export type MunsitTTSController = ReturnType<typeof useMunsitTTS>;
