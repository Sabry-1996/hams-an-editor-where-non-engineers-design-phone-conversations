export type LogSender = 'ai' | 'user' | 'system';

export interface SimLogEntry {
  sender: LogSender;
  text: string;
  time: string;
}

export type ToolBehavior = 'ok' | 'error' | 'slow';
export type SimVariables = Record<string, unknown>;
export type TtsStatus = 'idle' | 'generating' | 'playing' | 'error';
export type VoicesLoadState = 'idle' | 'loading' | 'loaded' | 'error';

export interface MunsitVoice {
  id: string;
  label: string;
  gender?: string | null;
  languages?: string[];
  dialect?: string[];
}
