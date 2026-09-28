import React, { createContext, useCallback, useContext, useMemo, useRef } from 'react';
import { useCallSimulator, type CallSimulatorController } from '../hooks/useCallSimulator';
import { useMunsitTTS, type MunsitTTSController } from '../hooks/useMunsitTTS';
import { useFlow } from './FlowContext';
import { useVoiceSettings } from './VoiceSettingsContext';

interface SimulatorContextValue {
  simulator: CallSimulatorController;
  tts: MunsitTTSController;
}

const SimulatorContext = createContext<SimulatorContextValue | null>(null);

export function SimulatorProvider({ children }: { children: React.ReactNode }) {
  const { flow } = useFlow();
  const { apiKey, selectedVoiceId, selectedVoice, languageMode } = useVoiceSettings();
  const logSystemRef = useRef<(text: string) => void>(() => {});
  const onTtsError = useCallback((message: string) => {
    logSystemRef.current(`⚠️ فشل توليد الصوت عبر Munsit API: ${message} (لا يتم استخدام صوت المتصفح الآلي كبديل)`);
  }, []);
  const tts = useMunsitTTS({ apiKey, voiceId: selectedVoiceId, onError: onTtsError });
  const simulator = useCallSimulator({
    flow,
    languageMode,
    tts,
    voiceLabel: selectedVoice?.label || selectedVoiceId
  });
  logSystemRef.current = simulator.logSystem;
  const value = useMemo<SimulatorContextValue>(() => ({ simulator, tts }), [simulator, tts]);
  return <SimulatorContext.Provider value={value}>{children}</SimulatorContext.Provider>;
}

export function useSimulator(): SimulatorContextValue {
  const ctx = useContext(SimulatorContext);
  if (!ctx) throw new Error('useSimulator must be used within <SimulatorProvider>');
  return ctx;
}
