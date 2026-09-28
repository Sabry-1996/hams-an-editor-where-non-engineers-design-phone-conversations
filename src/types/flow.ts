export type NodeType = 'start' | 'say' | 'ask' | 'condition' | 'tool' | 'transfer' | 'end';

export interface Position {
  x: number;
  y: number;
}

export interface NodeConfig {
  speechAr?: string;
  speechEn?: string;
  expectedVariable?: string;
  variableType?: 'string' | 'number' | 'boolean';
  conditionExpression?: string;
  toolName?: string;
  toolParams?: string;
  transferTarget?: string;
  timeoutSeconds?: number;
  bilingualMode?: boolean;
  voiceId?: string;
}

export interface NodeData {
  id: string;
  type: NodeType;
  label: string;
  position: Position;
  config: NodeConfig;
  outputs: string[];
}

export interface FlowSchema {
  version: string;
  name: string;
  nodes: NodeData[];
}

export type DiagnosticLevel = 'error' | 'warning' | 'info';

export interface Diagnostic {
  nodeId?: string;
  level: DiagnosticLevel;
  messageAr: string;
  messageEn: string;
}

export type LanguageMode = 'ar' | 'en' | 'bilingual';
export type EditorTab = 'canvas' | 'simulator' | 'diagnostics';
