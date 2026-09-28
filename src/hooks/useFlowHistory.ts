import { useCallback, useState } from 'react';
import type { Flow } from '../types/flow';

export type FlowUpdater = Flow | ((current: Flow) => Flow);

interface HistoryState {
  past: Flow[];
  present: Flow;
  future: Flow[];
  /** Uncommitted state shown while dragging. Undo restores `present`, never the draft. */
  draft: Flow | null;
}

const resolve = (updater: FlowUpdater, current: Flow): Flow =>
  typeof updater === 'function' ? updater(current) : updater;

export function useFlowHistory(initial: Flow) {
  const [state, setState] = useState<HistoryState>({ past: [], present: initial, future: [], draft: null });

  const commit = useCallback((updater: FlowUpdater) => {
    setState(s => {
      const current = s.draft ?? s.present;
      const next = resolve(updater, current);
      if (next === current && !s.draft) return s;
      return { past: [...s.past, s.present], present: next, future: [], draft: null };
    });
  }, []);

  const replace = useCallback((updater: FlowUpdater) => {
    setState(s => ({ ...s, draft: resolve(updater, s.draft ?? s.present) }));
  }, []);

  const undo = useCallback(() => {
    setState(s => {
      if (s.past.length === 0) return s;
      const previous = s.past[s.past.length - 1];
      return { past: s.past.slice(0, -1), present: previous, future: [s.present, ...s.future], draft: null };
    });
  }, []);

  const redo = useCallback(() => {
    setState(s => {
      if (s.future.length === 0) return s;
      const [next, ...rest] = s.future;
      return { past: [...s.past, s.present], present: next, future: rest, draft: null };
    });
  }, []);

  return {
    flow: state.draft ?? state.present,
    commit,
    replace,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0
  };
}
