import { useEffect, useState } from 'react';
import { MUNSIT_CURATED_VOICES } from '../config/munsit';
import { listVoices } from '../services/munsitApi';
import type { MunsitVoice, VoicesLoadState } from '../types/simulator';

export function useMunsitVoices(apiKey: string) {
  const [voices, setVoices] = useState<MunsitVoice[]>(MUNSIT_CURATED_VOICES);
  const [loadState, setLoadState] = useState<VoicesLoadState>('idle');

  useEffect(() => {
    const key = apiKey.trim();
    if (!key) {
      setVoices(MUNSIT_CURATED_VOICES);
      setLoadState('idle');
      return;
    }
    let cancelled = false;
    setLoadState('loading');
    listVoices(key)
      .then(list => {
        if (cancelled) return;
        setVoices(list);
        setLoadState('loaded');
      })
      .catch(() => {
        if (cancelled) return;
        setVoices(MUNSIT_CURATED_VOICES);
        setLoadState('error');
      });
    return () => { cancelled = true; };
  }, [apiKey]);

  return { voices, loadState };
}
