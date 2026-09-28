import { useCallback, useMemo, useRef, useState } from 'react';
import type { FlowSchema, LanguageMode, NodeData } from '../types/flow';
import type { SimLogEntry, SimVariables, ToolBehavior } from '../types/simulator';
import { findNode, findStartNode } from '../utils/flowGraph';
import { interpolateVariables, nowTime } from '../utils/template';
import type { MunsitTTSController } from './useMunsitTTS';
import { useLatest } from './useLatest';

interface UseCallSimulatorOptions {
  flow: FlowSchema;
  languageMode: LanguageMode;
  tts: MunsitTTSController;
  voiceLabel: string;
}

export function useCallSimulator({ flow, languageMode, tts, voiceLabel }: UseCallSimulatorOptions) {
  const [active, setActive] = useState(false);
  const [currentNodeId, setCurrentNodeId] = useState('node_start');
  const [variables, setVariables] = useState<SimVariables>({});
  const [logs, setLogs] = useState<SimLogEntry[]>([]);
  const [toolBehavior, setToolBehavior] = useState<ToolBehavior>('ok');

  const flowRef = useLatest(flow);
  const languageRef = useLatest(languageMode);
  const toolBehaviorRef = useLatest(toolBehavior);
  const activeRef = useRef(false);
  const variablesRef = useRef<SimVariables>({});

  const log = useCallback((entry: Omit<SimLogEntry, 'time'>) => {
    setLogs(prev => [...prev, { ...entry, time: nowTime() }]);
  }, []);

  const setActiveSync = (value: boolean) => {
    activeRef.current = value;
    setActive(value);
  };

  const patchVariables = useCallback((updater: (prev: SimVariables) => SimVariables) => {
    variablesRef.current = updater(variablesRef.current);
    setVariables(variablesRef.current);
  }, []);

  const spokenTextFor = (node: NodeData) => {
    const raw = languageRef.current === 'en' ? node.config.speechEn : node.config.speechAr;
    return raw ? interpolateVariables(raw, variablesRef.current) : '';
  };

  const speakNode = async (node: NodeData) => {
    const text = spokenTextFor(node);
    if (!text) return;
    log({ sender: 'ai', text });
    await tts.speak(text);
  };

  const moveTo = useCallback(async (nodeId: string): Promise<void> => {
    setCurrentNodeId(nodeId);
    const node = findNode(flowRef.current, nodeId);
    if (!node) return;
    const next = (index = 0) => node.outputs[index];

    switch (node.type) {
      case 'say': {
        await speakNode(node);
        if (next()) setTimeout(() => { if (activeRef.current) moveTo(next()); }, 400);
        break;
      }
      case 'ask':
        await speakNode(node);
        break;
      case 'tool': {
        log({ sender: 'system', text: `جاري تشغيل الأداة: ${node.config.toolName}...` });
        const behavior = toolBehaviorRef.current;
        setTimeout(() => {
          if (!activeRef.current) return;
          if (behavior === 'error') {
            patchVariables(v => ({ ...v, api_result: { status: 'error', message: 'Connection timeout' }, api_status: 'error' }));
            log({ sender: 'system', text: 'خطأ في الاتصال بقاعدة بيانات التأمين.' });
          } else if (behavior === 'slow') {
            patchVariables(v => ({ ...v, api_result: { status: 'active', plan: 'VIP Gold' }, api_status: 'success' }));
            log({ sender: 'system', text: 'تم جلب بيانات التأمين بنجاح (استجابة بطيئة).' });
          } else {
            patchVariables(v => ({ ...v, api_result: { status: 'active', plan: 'Platinum Health' }, api_status: 'success' }));
            log({ sender: 'system', text: 'نتيجة الأداة: التأمين نشط (Platinum Health).' });
          }
          if (next()) moveTo(next());
        }, behavior === 'slow' ? 2500 : 800);
        break;
      }
      case 'condition': {
        const expr = node.config.conditionExpression || 'true';
        const apiResult = variablesRef.current.api_result as { status?: string } | undefined;
        const result = apiResult?.status === 'active';
        log({ sender: 'system', text: `تقييم الشرط [${expr}] النتيجة: ${result ? 'True (مسار 1)' : 'False (مسار 2)'}` });
        const target = next(result ? 0 : 1) || next(0);
        if (target) setTimeout(() => { if (activeRef.current) moveTo(target); }, 600);
        break;
      }
      case 'transfer': {
        await speakNode(node);
        log({ sender: 'system', text: `تم تحويل المكالمة بنجاح إلى القسم: ${node.config.transferTarget}` });
        setActiveSync(false);
        break;
      }
      case 'end':
        log({ sender: 'system', text: 'انتهت المكالمة بنجاح.' });
        setActiveSync(false);
        break;
      default:
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [log, patchVariables, tts]);

  const start = useCallback(() => {
    const startNode = findStartNode(flowRef.current);
    if (!startNode) return;
    tts.reset();
    setActiveSync(true);
    patchVariables(() => ({}));
    setLogs([{
      sender: 'system',
      text: `بدء الاتصال التجريبي مع نظام شفاء كير الصوتي — Munsit Cloud TTS نشط • الصوت: ${voiceLabel}`,
      time: nowTime()
    }]);
    if (startNode.outputs.length > 0) moveTo(startNode.outputs[0]);
  }, [tts, voiceLabel, patchVariables, moveTo, flowRef]);

  const stop = useCallback(() => {
    tts.reset();
    setActiveSync(false);
    log({ sender: 'system', text: 'تم إنهاء المكالمة يدوياً.' });
  }, [tts, log]);

  const sendUserReply = useCallback((text: string) => {
    const userText = text.trim();
    if (!userText || !activeRef.current) return;
    log({ sender: 'user', text: userText });
    const node = findNode(flowRef.current, currentNodeId);
    if (!node) return;
    if (node.type === 'ask') {
      const varName = node.config.expectedVariable || 'user_response';
      patchVariables(v => ({ ...v, [varName]: userText }));
      log({ sender: 'system', text: `تم حفظ المتغير [${varName}] = "${userText}"` });
      if (node.outputs.length > 0) setTimeout(() => moveTo(node.outputs[0]), 500);
    } else if (node.outputs.length > 0) {
      setTimeout(() => moveTo(node.outputs[0]), 800);
    }
  }, [currentNodeId, log, patchVariables, moveTo, flowRef]);

  const logSystem = useCallback((text: string) => log({ sender: 'system', text }), [log]);

  return useMemo(() => ({
    active, currentNodeId, variables, logs, toolBehavior, setToolBehavior, start, stop, sendUserReply, logSystem
  }), [active, currentNodeId, variables, logs, toolBehavior, start, stop, sendUserReply, logSystem]);
}

export type CallSimulatorController = ReturnType<typeof useCallSimulator>;
