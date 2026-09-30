/** Spec model (schemaVersion 1), plus `label` on each node so Reem can name a step without putting that name in the spoken text. */

export type LocalizedText = { ar: string; en: string };

export type ExpectKind = 'digits' | 'yes_no' | 'date' | 'free_text';
export type NoInputAction = 'reprompt' | 'transfer';
export type CompareOp = 'eq' | 'neq' | 'gt' | 'lt' | 'exists';

export type ConditionRule = {
  variable: string;
  op: CompareOp;
  /** A single string, or Arabic and English when the caller picks this with a button (`eq`). */
  value?: string | LocalizedText;
  /** Target node id. */
  branch: string;
};

export type NodeData =
  | { kind: 'start' }
  | { kind: 'say'; text: LocalizedText }
  | {
      kind: 'ask';
      prompt: LocalizedText;
      saveAs: string;
      expect: ExpectKind;
      onNoInput: NoInputAction;
      maxRetries: number;
    }
  | { kind: 'condition'; rules: ConditionRule[]; elseBranch: string }
  | { kind: 'tool'; name: string; args: Record<string, string>; saveAs: string }
  | { kind: 'transfer'; queue: string; whisper?: LocalizedText }
  | { kind: 'end'; text?: LocalizedText };

export interface FlowNode {
  id: string;
  position: { x: number; y: number };
  /** Extension: a short name Reem sees on the canvas. Speech lives in `data`. */
  label: string;
  data: NodeData;
}

export interface Edge {
  id: string;
  from: string;
  to: string;
  /** Named exit: tool uses 'ok' | 'error'; condition uses the rule target; ask silence uses 'no_input'. */
  branch?: string;
}

export interface Flow {
  schemaVersion: 1;
  id: string;
  name: string;
  nodes: FlowNode[];
  edges: Edge[];
}

export type NodeKind = NodeData['kind'];
export type DiagnosticLevel = 'error' | 'warning';

export interface Diagnostic {
  nodeId?: string;
  level: DiagnosticLevel;
  code: string;
  params?: Record<string, string>;
}

export type Position = { x: number; y: number };
export type UiLang = 'ar' | 'en';
export type SpeechLang = 'ar' | 'en';
export type EditorTab = 'canvas' | 'simulator' | 'diagnostics';
/** How the canvas tab shows the call: the node map, or the script Reem reads top to bottom. */
export type CanvasViewMode = 'graph' | 'script';

export const emptyText = (): LocalizedText => ({ ar: '', en: '' });
