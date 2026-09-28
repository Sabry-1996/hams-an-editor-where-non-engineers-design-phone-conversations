import { useCallback, useState } from 'react';
import type { FlowSchema } from '../types/flow';

export function useFlowHistory(initial: FlowSchema) {
  const [flow, setFlow] = useState<FlowSchema>(initial);
  const [history, setHistory] = useState<FlowSchema[]>([initial]);
  const [index, setIndex] = useState(0);

  const commit = useCallback((next: FlowSchema) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, index + 1);
      trimmed.push(next);
      setIndex(trimmed.length - 1);
      return trimmed;
    });
    setFlow(next);
  }, [index]);

  const replace = useCallback((next: FlowSchema) => setFlow(next), []);

  const undo = useCallback(() => {
    if (index <= 0) return;
    const target = index - 1;
    setIndex(target);
    setFlow(history[target]);
  }, [history, index]);

  const redo = useCallback(() => {
    if (index >= history.length - 1) return;
    const target = index + 1;
    setIndex(target);
    setFlow(history[target]);
  }, [history, index]);

  return { flow, commit, replace, undo, redo, canUndo: index > 0, canRedo: index < history.length - 1 };
}
