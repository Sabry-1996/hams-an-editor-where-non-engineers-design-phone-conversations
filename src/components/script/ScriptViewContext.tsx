import { createContext, useContext } from 'react';
import type { LinePreviewController } from '../../hooks/useLinePreview';
import type { ScriptBranch } from '../../utils/callScript';

/** Shared by every step on the script timeline, however deep inside a path it sits. */
export interface ScriptViewValue {
  isOpen: (branch: ScriptBranch) => boolean;
  toggle: (branch: ScriptBranch) => void;
  selectedId: string | null;
  highlightId: string | null;
  issues: Set<string>;
  select: (nodeId: string) => void;
  jumpTo: (nodeId: string) => void;
  labelOf: (nodeId: string) => string;
  preview: LinePreviewController;
}

export const ScriptViewContext = createContext<ScriptViewValue | null>(null);

export function useScriptView(): ScriptViewValue {
  const ctx = useContext(ScriptViewContext);
  if (!ctx) throw new Error('useScriptView must be used within <ScriptViewContext.Provider>');
  return ctx;
}

export const stepElementId = (nodeId: string) => `script-step-${nodeId}`;

/** Wraps text in a bidi isolate so an English name inside an Arabic sentence (or back) keeps its order. */
export const isolate = (text: string) => `⁨${text}⁩`;
