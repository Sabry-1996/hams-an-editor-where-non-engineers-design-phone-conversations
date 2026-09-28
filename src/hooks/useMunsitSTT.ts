import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MUNSIT_STT_SAMPLE_RATE, munsitListenUrl } from '../config/munsit';
import { transcribeAudio } from '../services/munsitApi';
import { useLatest } from './useLatest';

export type SttMode = 'idle' | 'recording' | 'transcribing' | 'live';

interface UseMunsitSTTOptions {
  apiKey: string;
  onFinal: (text: string) => void;
  /** True while the caller is talking, so the 10-second silence timer waits. */
  onSpeaking?: (speaking: boolean) => void;
  onError?: (message: string, kind: 'mic' | 'empty' | 'api') => void;
  /** While this returns true (the agent is talking) the live socket gets silence instead of mic audio, so the agent does not hear itself. */
  isMuted?: () => boolean;
}

const MIC_CONSTRAINTS: MediaStreamConstraints = {
  audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 }
};

/** Mono float samples at any rate to 16-bit PCM at 16 kHz, averaging each window. */
function toPcm16(input: Float32Array, fromRate: number): ArrayBuffer {
  const ratio = fromRate / MUNSIT_STT_SAMPLE_RATE;
  const length = Math.floor(input.length / ratio);
  const out = new Int16Array(length);
  for (let i = 0; i < length; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.max(start + 1, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let j = start; j < end && j < input.length; j++) sum += input[j];
    const sample = sum / (end - start);
    out[i] = Math.max(-32768, Math.min(32767, Math.round(sample * 32767)));
  }
  return out.buffer;
}

const pickMime = () =>
  ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'].find(
    type => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)
  );

export function useMunsitSTT({ apiKey, onFinal, onSpeaking, onError, isMuted }: UseMunsitSTTOptions) {
  const [mode, setMode] = useState<SttMode>('idle');
  const [interim, setInterim] = useState('');
  const apiKeyRef = useLatest(apiKey);
  const onFinalRef = useLatest(onFinal);
  const onSpeakingRef = useLatest(onSpeaking);
  const onErrorRef = useLatest(onError);
  const isMutedRef = useLatest(isMuted);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const finalsRef = useRef<string[]>([]);
  const quietTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const liveRef = useRef(false);

  const releaseMic = useCallback(() => {
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    processorRef.current = null;
    sourceRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    const ctx = audioCtxRef.current;
    audioCtxRef.current = null;
    if (ctx && ctx.state !== 'closed') void ctx.close();
  }, []);

  const clearQuiet = () => {
    if (quietTimer.current != null) clearTimeout(quietTimer.current);
    quietTimer.current = null;
  };

  const openMic = async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(MIC_CONSTRAINTS);
      streamRef.current = stream;
      return stream;
    } catch (err) {
      onErrorRef.current?.(err instanceof Error ? err.message : String(err), 'mic');
      return null;
    }
  };

  const startRecording = useCallback(async () => {
    if (mode !== 'idle') return;
    const stream = await openMic();
    if (!stream) return;
    const mimeType = pickMime();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    recorder.ondataavailable = event => {
      if (event.data.size) chunks.push(event.data);
    };
    recorder.onstop = async () => {
      releaseMic();
      recorderRef.current = null;
      const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || 'audio/webm' });
      if (!blob.size) {
        setMode('idle');
        onSpeakingRef.current?.(false);
        onErrorRef.current?.('', 'empty');
        return;
      }
      setMode('transcribing');
      try {
        const text = await transcribeAudio(apiKeyRef.current.trim(), blob);
        if (text) onFinalRef.current(text);
        else {
          onSpeakingRef.current?.(false);
          onErrorRef.current?.('', 'empty');
        }
      } catch (err) {
        onSpeakingRef.current?.(false);
        onErrorRef.current?.(err instanceof Error ? err.message : String(err), 'api');
      } finally {
        setMode('idle');
      }
    };
    recorderRef.current = recorder;
    recorder.start();
    setMode('recording');
    onSpeakingRef.current?.(true);
  }, [mode, releaseMic, apiKeyRef, onFinalRef, onSpeakingRef, onErrorRef]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
  }, []);

  const stopLive = useCallback(() => {
    if (!liveRef.current) return;
    liveRef.current = false;
    clearQuiet();
    releaseMic();
    const socket = socketRef.current;
    socketRef.current = null;
    if (socket) {
      if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'CloseStream' }));
      setTimeout(() => {
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) socket.close();
      }, 3000);
    }
    finalsRef.current = [];
    setInterim('');
    setMode('idle');
  }, [releaseMic]);

  const startLive = useCallback(async () => {
    if (mode !== 'idle') return;
    const stream = await openMic();
    if (!stream) return;

    let ctx: AudioContext;
    try {
      ctx = new AudioContext({ sampleRate: MUNSIT_STT_SAMPLE_RATE });
    } catch {
      ctx = new AudioContext();
    }
    audioCtxRef.current = ctx;
    await ctx.resume();

    const socket = new WebSocket(munsitListenUrl(apiKeyRef.current.trim()));
    socket.binaryType = 'arraybuffer';
    socketRef.current = socket;
    liveRef.current = true;
    finalsRef.current = [];
    setMode('live');

    const deliver = () => {
      clearQuiet();
      const text = finalsRef.current.join(' ').trim();
      finalsRef.current = [];
      setInterim('');
      if (text) onFinalRef.current(text);
      else onSpeakingRef.current?.(false);
    };

    socket.onmessage = event => {
      if (typeof event.data !== 'string') return;
      let message: { type?: string; transcript?: string; is_final?: boolean; speech_final?: boolean; message?: string; recoverable?: boolean };
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }
      if (message.type === 'Results') {
        const text = (message.transcript ?? '').trim();
        clearQuiet();
        if (text) onSpeakingRef.current?.(true);
        if (message.is_final) {
          if (text) finalsRef.current.push(text);
          setInterim(finalsRef.current.join(' '));
          if (message.speech_final) deliver();
        } else {
          setInterim([...finalsRef.current, text].join(' ').trim());
        }
        quietTimer.current = setTimeout(deliver, 4000);
      } else if (message.type === 'UtteranceEnd') {
        if (finalsRef.current.length) deliver();
      } else if (message.type === 'Error') {
        onErrorRef.current?.(message.message ?? 'Munsit STT', 'api');
      }
    };
    socket.onclose = event => {
      if (socketRef.current === socket && liveRef.current) {
        if (event.code !== 1000) onErrorRef.current?.(`WebSocket ${event.code}${event.reason ? ` – ${event.reason}` : ''}`, 'api');
        stopLive();
      }
    };

    const source = ctx.createMediaStreamSource(stream);
    const processor = ctx.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = event => {
      if (socket.readyState !== WebSocket.OPEN) return;
      const samples = event.inputBuffer.getChannelData(0);
      const frame = isMutedRef.current?.() ? new Float32Array(samples.length) : samples;
      socket.send(toPcm16(frame, ctx.sampleRate));
    };
    source.connect(processor);
    processor.connect(ctx.destination);
    sourceRef.current = source;
    processorRef.current = processor;
  }, [mode, apiKeyRef, onFinalRef, onSpeakingRef, onErrorRef, isMutedRef, stopLive]);

  const stopAll = useCallback(() => {
    stopRecording();
    stopLive();
  }, [stopRecording, stopLive]);

  useEffect(() => () => {
    liveRef.current = false;
    recorderRef.current?.state === 'recording' && recorderRef.current.stop();
    socketRef.current?.close();
    releaseMic();
  }, [releaseMic]);

  return useMemo(
    () => ({ mode, interim, startRecording, stopRecording, startLive, stopLive, stopAll }),
    [mode, interim, startRecording, stopRecording, startLive, stopLive, stopAll]
  );
}
