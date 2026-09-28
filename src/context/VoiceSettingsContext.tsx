import React, { createContext, useContext, useMemo, useState } from 'react';
import { MUNSIT_DEFAULT_VOICE_ID, MUNSIT_DEV_API_KEY } from '../config/munsit';
import { useMunsitVoices } from '../hooks/useMunsitVoices';
import type { MunsitVoice, VoicesLoadState } from '../types/simulator';

interface VoiceSettingsContextValue {
  apiKey: string;
  setApiKey: (key: string) => void;
  selectedVoiceId: string;
  setSelectedVoiceId: (id: string) => void;
  selectedVoice: MunsitVoice | undefined;
  voices: MunsitVoice[];
  voicesLoadState: VoicesLoadState;
}

const VoiceSettingsContext = createContext<VoiceSettingsContextValue | null>(null);

export function VoiceSettingsProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKey] = useState(MUNSIT_DEV_API_KEY);
  const [selectedVoiceId, setSelectedVoiceId] = useState(MUNSIT_DEFAULT_VOICE_ID);
  const { voices, loadState } = useMunsitVoices(apiKey);
  const selectedVoice = useMemo(() => voices.find(v => v.id === selectedVoiceId), [voices, selectedVoiceId]);

  const value = useMemo<VoiceSettingsContextValue>(() => ({
    apiKey, setApiKey, selectedVoiceId, setSelectedVoiceId, selectedVoice,
    voices, voicesLoadState: loadState
  }), [apiKey, selectedVoiceId, selectedVoice, voices, loadState]);

  return <VoiceSettingsContext.Provider value={value}>{children}</VoiceSettingsContext.Provider>;
}

export function useVoiceSettings(): VoiceSettingsContextValue {
  const ctx = useContext(VoiceSettingsContext);
  if (!ctx) throw new Error('useVoiceSettings must be used within <VoiceSettingsProvider>');
  return ctx;
}
