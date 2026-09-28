import { useCallback, useMemo, useRef, useState } from 'react';
import type { MessageKey } from '../i18n/messages';
import type { Flow, SpeechLang } from '../types/flow';
import type { SimLogEntry, SimVariables, ToolBehavior } from '../types/simulator';
import { findNode, findStartNode, outgoing } from '../utils/flowGraph';
import { interpolateVariables, nowTime } from '../utils/template';
import type { MunsitTTSController } from './useMunsitTTS';
import { useLatest } from './useLatest';

interface UseCallSimulatorOptions {
  flow: Flow;
  speechLang: SpeechLang;
  tts: MunsitTTSController;
  voiceLabel: string;
  say: (key: MessageKey, params?: Record<string, string>) => string;
}

const SILENCE_MS = 10_000;

const digitsOf = (text: string) => (text.match(/[0-9٠-٩]+/g) ?? []).join('').replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

/** A yes/no answer, including the short forms callers actually say. `لا` is checked first so it does not hide inside another word. */
const yesNoOf = (text: string): 'yes' | 'no' | null => {
  if (/لا|لأ|لاء|\bno\b|nope/i.test(text)) return 'no';
  if (/نعم|أيوه|ايوه|ايه|إيه|اي|إي|تمام|حاضر|\byes\b|yeah|yep/i.test(text)) return 'yes';
  return null;
};

export function useCallSimulator({ flow, speechLang, tts, voiceLabel, say }: UseCallSimulatorOptions) {
  const [active, setActive] = useState(false);
  const [currentNodeId, setCurrentNodeId] = useState('start');
  const [variables, setVariables] = useState<SimVariables>({});
  const [logs, setLogs] = useState<SimLogEntry[]>([]);
  const [toolBehavior, setToolBehavior] = useState<ToolBehavior>('ok');
  const [retries, setRetries] = useState<Record<string, number>>({});

  const flowRef = useLatest(flow);
  const speechRef = useLatest(speechLang);
  const toolRef = useLatest(toolBehavior);
  const sayRef = useLatest(say);
  const activeRef = useRef(false);
  const variablesRef = useRef<SimVariables>({});
  const retriesRef = useRef<Record<string, number>>({});
  const nodeIdRef = useRef('start');
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const armSilenceRef = useRef<(nodeId: string) => void>(() => {});
  const failAskRef = useRef<(nodeId: string, reason: 'silence' | 'unclear') => void>(() => {});

  const log = useCallback((entry: Omit<SimLogEntry, 'time'>) => {
    setLogs(prev => [...prev, { ...entry, time: nowTime() }]);
  }, []);

  const setActiveSync = (value: boolean) => {
    activeRef.current = value;
    setActive(value);
  };

  const clearSilence = useCallback(() => {
    if (silenceTimer.current != null) {
      clearTimeout(silenceTimer.current);
      silenceTimer.current = null;
    }
  }, []);

  const patchVariables = useCallback((updater: (prev: SimVariables) => SimVariables) => {
    variablesRef.current = updater(variablesRef.current);
    setVariables(variablesRef.current);
  }, []);

  const spoken = (text?: { ar: string; en: string }) => {
    if (!text) return '';
    const raw = speechRef.current === 'en' ? text.en : text.ar;
    return raw ? interpolateVariables(raw, variablesRef.current) : '';
  };

  const go = useCallback(async (nodeId: string): Promise<void> => {
    clearSilence();
    nodeIdRef.current = nodeId;
    setCurrentNodeId(nodeId);
    const node = findNode(flowRef.current, nodeId);
    if (!node) return;
    const edges = outgoing(flowRef.current, nodeId);
    const follow = (branch?: string) => edges.find(e => branch ? e.branch === branch : !e.branch)?.to ?? edges.find(e => !branch || e.branch === branch)?.to;

    const speakLine = async (text?: { ar: string; en: string }) => {
      const line = spoken(text);
      if (!line) return;
      log({ sender: 'ai', text: line });
      await tts.speak(line);
    };

    switch (node.data.kind) {
      case 'start':
        if (edges[0]) go(edges[0].to);
        break;
      case 'say':
        await speakLine(node.data.text);
        if (activeRef.current && edges[0]) setTimeout(() => { if (activeRef.current) go(edges[0].to); }, 300);
        break;
      case 'ask':
        await speakLine(node.data.prompt);
        if (activeRef.current && nodeIdRef.current === nodeId) armSilenceRef.current(nodeId);
        break;
      case 'tool': {
        const tool = node.data;
        log({ sender: 'system', text: sayRef.current('tool_running', { name: tool.name }) });
        const behavior = toolRef.current;
        setTimeout(() => {
          if (!activeRef.current) return;
          if (behavior === 'error') {
            log({ sender: 'system', text: sayRef.current('tool_error') });
            const next = follow('error');
            if (next) go(next);
          } else {
            patchVariables(v => ({ ...v, [tool.saveAs]: 'covered' }));
            log({ sender: 'system', text: sayRef.current(behavior === 'slow' ? 'tool_slow' : 'tool_ok') });
            const next = follow('ok');
            if (next) go(next);
          }
        }, behavior === 'slow' ? 1800 : 600);
        break;
      }
      case 'condition': {
        const vars = variablesRef.current;
        const matched = node.data.rules.find(rule => {
          const current = vars[rule.variable];
          const asText = current == null ? '' : String(current);
          if (rule.op === 'exists') return current != null && asText !== '';
          if (rule.op === 'eq') return asText === (rule.value ?? '');
          if (rule.op === 'neq') return asText !== (rule.value ?? '');
          const num = Number(asText);
          const target = Number(rule.value);
          if (rule.op === 'gt') return num > target;
          if (rule.op === 'lt') return num < target;
          return false;
        });
        log({ sender: 'system', text: sayRef.current(matched ? 'condition_true' : 'condition_false') });
        const nextId = matched?.branch || node.data.elseBranch;
        if (nextId) setTimeout(() => { if (activeRef.current) go(nextId); }, 400);
        break;
      }
      case 'transfer':
        await speakLine(node.data.whisper);
        log({ sender: 'system', text: sayRef.current('transferred', { queue: node.data.queue }) });
        setActiveSync(false);
        break;
      case 'end':
        await speakLine(node.data.text);
        log({ sender: 'system', text: sayRef.current('call_ended') });
        setActiveSync(false);
        break;
      default:
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [log, patchVariables, tts, clearSilence]);

  armSilenceRef.current = (nodeId: string) => {
    clearSilence();
    silenceTimer.current = setTimeout(() => {
      silenceTimer.current = null;
      if (!activeRef.current || nodeIdRef.current !== nodeId) return;
      failAskRef.current(nodeId, 'silence');
    }, SILENCE_MS);
  };

  failAskRef.current = (nodeId: string, reason: 'silence' | 'unclear') => {
    const node = findNode(flowRef.current, nodeId);
    if (!node || node.data.kind !== 'ask' || !activeRef.current) return;
    const ask = node.data;
    const used = (retriesRef.current[nodeId] ?? 0) + 1;
    retriesRef.current = { ...retriesRef.current, [nodeId]: used };
    setRetries(retriesRef.current);
    const limit = Math.max(1, ask.maxRetries);
    if (used >= limit) {
      clearSilence();
      log({ sender: 'system', text: sayRef.current('silence_end') });
      const end = flowRef.current.nodes.find(n => n.data.kind === 'end');
      if (end) setTimeout(() => { if (activeRef.current) go(end.id); }, 400);
      else setActiveSync(false);
      return;
    }
    log({
      sender: 'system',
      text: sayRef.current(reason === 'silence' ? 'silence_retry' : 'retry', { left: String(limit - used) })
    });
    const prompt = spoken(ask.prompt);
    if (!prompt) {
      armSilenceRef.current(nodeId);
      return;
    }
    log({ sender: 'ai', text: prompt });
    void tts.speak(prompt).then(() => {
      if (activeRef.current && nodeIdRef.current === nodeId) armSilenceRef.current(nodeId);
    });
  };

  const start = useCallback(() => {
    const startNode = findStartNode(flowRef.current);
    if (!startNode) return;
    clearSilence();
    tts.reset();
    setActiveSync(true);
    patchVariables(() => ({}));
    retriesRef.current = {};
    setRetries({});
    setLogs([{ sender: 'system', text: sayRef.current('call_started', { voice: voiceLabel }), time: nowTime() }]);
    const first = outgoing(flowRef.current, startNode.id)[0];
    if (first) go(first.to);
  }, [tts, voiceLabel, patchVariables, go, flowRef, sayRef, clearSilence]);

  const stop = useCallback(() => {
    clearSilence();
    tts.reset();
    setActiveSync(false);
    log({ sender: 'system', text: sayRef.current('call_stopped') });
  }, [tts, log, sayRef, clearSilence]);

  const sendUserReply = useCallback((text: string) => {
    const userText = text.trim();
    if (!userText || !activeRef.current) return;
    clearSilence();
    log({ sender: 'user', text: userText });
    const node = findNode(flowRef.current, currentNodeId);
    if (!node || node.data.kind !== 'ask') {
      const edges = node ? outgoing(flowRef.current, node.id) : [];
      if (edges[0]) setTimeout(() => go(edges[0].to), 300);
      return;
    }

    const ask = node.data;
    let accepted = userText;
    let ok = true;
    if (ask.expect === 'digits') {
      const digits = digitsOf(userText);
      ok = digits.length > 0;
      accepted = digits;
    } else if (ask.expect === 'yes_no') {
      const answer = yesNoOf(userText);
      ok = answer != null;
      if (answer) accepted = answer;
    } else if (ask.expect === 'date') {
      ok = /\d{1,4}/.test(userText);
    }

    if (!ok) {
      failAskRef.current(node.id, 'unclear');
      return;
    }

    patchVariables(v => ({ ...v, [ask.saveAs]: accepted }));
    log({ sender: 'system', text: sayRef.current('saved_var', { name: ask.saveAs, value: accepted }) });
    const next = outgoing(flowRef.current, node.id)[0];
    if (next) setTimeout(() => go(next.to), 400);
  }, [currentNodeId, log, patchVariables, go, flowRef, sayRef, clearSilence]);

  return useMemo(() => ({
    active, currentNodeId, variables, logs, toolBehavior, retries, setToolBehavior, start, stop, sendUserReply,
    logSystem: (text: string) => log({ sender: 'system', text })
  }), [active, currentNodeId, variables, logs, toolBehavior, retries, start, stop, sendUserReply, log]);
}

export type CallSimulatorController = ReturnType<typeof useCallSimulator>;
