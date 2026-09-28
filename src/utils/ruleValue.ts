import type { Flow, LocalizedText, UiLang } from '../types/flow';
import { findNode, outgoing } from './flowGraph';

export const asChoice = (value: string | LocalizedText | undefined): LocalizedText => {
  if (value && typeof value === 'object') return { ar: value.ar ?? '', en: value.en ?? '' };
  const text = (value ?? '').trim();
  if (!text) return { ar: '', en: '' };
  return /[ء-ي]/.test(text) ? { ar: text, en: '' } : { ar: '', en: text };
};

export const scalarValue = (value: string | LocalizedText | undefined): string => {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return value.en || value.ar || '';
};

export const ruleTexts = (value: string | LocalizedText | undefined): string[] => {
  if (value == null) return [];
  if (typeof value === 'string') return value.trim() ? [value.trim()] : [];
  return [value.ar, value.en].map(part => part.trim()).filter(Boolean);
};

export const equalsRule = (actual: string, value: string | LocalizedText | undefined): boolean => {
  const needle = actual.trim().toLowerCase();
  if (!needle) return false;
  return ruleTexts(value).some(part => part.toLowerCase() === needle);
};

export interface ChoiceButton {
  key: string;
  label: string;
}

export function matchesAskChoice(flow: Flow, nodeId: string, text: string): boolean {
  const node = findNode(flow, nodeId);
  if (!node || node.data.kind !== 'ask') return false;
  const saveAs = node.data.saveAs;
  const next = outgoing(flow, nodeId)[0];
  const target = next ? findNode(flow, next.to) : undefined;
  if (!target || target.data.kind !== 'condition') return false;
  return target.data.rules.some(
    rule => rule.op === 'eq' && rule.variable === saveAs && equalsRule(text, rule.value)
  );
}

/** Eq rules on the step right after this question, shown as tap targets in the call. */
export function askChoiceButtons(flow: Flow, nodeId: string, lang: UiLang): ChoiceButton[] {
  const node = findNode(flow, nodeId);
  if (!node || node.data.kind !== 'ask') return [];
  const next = outgoing(flow, nodeId)[0];
  if (!next) return [];
  const target = findNode(flow, next.to);
  if (!target || target.data.kind !== 'condition') return [];
  const saveAs = node.data.saveAs;
  return target.data.rules.flatMap((rule, index) => {
    if (rule.op !== 'eq' || rule.variable !== saveAs) return [];
    const text = asChoice(rule.value);
    const label = (lang === 'ar' ? text.ar : text.en).trim() || text.ar.trim() || text.en.trim();
    if (!label) return [];
    return [{ key: `${target.id}-${index}`, label }];
  });
}
