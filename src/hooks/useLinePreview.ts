import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVoiceSettings } from '../context/VoiceSettingsContext';
import { synthesizeSpeech } from '../services/munsitApi';
import { useLatest } from './useLatest';

export type LinePreviewStatus = 'generating' | 'playing' | 'error';

export interface LinePreviewState {
  key: string;
  status: LinePreviewStatus;
  error?: string;
}

const CACHE_LIMIT = 40;

/** A placeholder has no value outside a call, so read its name instead of the braces. */
const readable = (text: string) => text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name: string) => name.replace(/_/g, ' '));

/**
 * Plays one script line at a time in Reem's Munsit voice. Starting a line cancels the one before,
 * and lines already heard are replayed from memory instead of being generated again.
 */
export function useLinePreview() {
  const { apiKey, selectedVoiceId } = useVoiceSettings();
  const [state, setState] = useState<LinePreviewState | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestRef = useRef(0);
  const cacheRef = useRef(new Map<string, Blob>());
  const apiKeyRef = useLatest(apiKey);
  const voiceIdRef = useLatest(selectedVoiceId);

  const release = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.onended = null;
    audio.onerror = null;
    audio.pause();
    URL.revokeObjectURL(audio.src);
    audioRef.current = null;
  }, []);

  const stop = useCallback(() => {
    requestRef.current += 1;
    release();
    setState(null);
  }, [release]);

  const play = useCallback(async (key: string, text: string) => {
    stop();
    const request = requestRef.current;
    const line = readable(text).trim();
    if (!line) return;
    const stale = () => requestRef.current !== request;
    setState({ key, status: 'generating' });
    try {
      const apiKeyValue = apiKeyRef.current.trim();
      if (!apiKeyValue) throw new Error('Munsit API key is missing.');
      const voiceId = voiceIdRef.current;
      const cacheKey = `${voiceId}\u0000${line}`;
      let blob = cacheRef.current.get(cacheKey);
      if (!blob) {
        blob = await synthesizeSpeech(apiKeyValue, voiceId, line);
        const cache = cacheRef.current;
        if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value!);
        cache.set(cacheKey, blob);
      }
      if (stale()) return;
      const audio = new Audio(URL.createObjectURL(blob));
      audioRef.current = audio;
      const finish = (error?: string) => {
        if (audioRef.current !== audio) return;
        release();
        setState(error ? { key, status: 'error', error } : null);
      };
      audio.onended = () => finish();
      audio.onerror = () => finish('The audio could not be played.');
      await audio.play();
      if (!stale()) setState({ key, status: 'playing' });
    } catch (err) {
      if (stale()) return;
      release();
      setState({ key, status: 'error', error: err instanceof Error ? err.message : String(err) });
    }
  }, [stop, release, apiKeyRef, voiceIdRef]);

  useEffect(() => () => {
    requestRef.current += 1;
    release();
  }, [release]);

  return useMemo(() => ({ state, play, stop }), [state, play, stop]);
}

export type LinePreviewController = ReturnType<typeof useLinePreview>;
