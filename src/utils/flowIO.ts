import type { Flow } from '../types/flow';

export type ImportFailure = 'invalid_json' | 'unknown_schema' | 'invalid_shape';

export type ImportResult =
  | { ok: true; flow: Flow }
  | { ok: false; reason: ImportFailure; schemaVersion?: unknown };

const isFlow = (value: unknown): value is Flow => {
  if (typeof value !== 'object' || value === null) return false;
  const flow = value as Flow;
  return flow.schemaVersion === 1 && typeof flow.id === 'string' && typeof flow.name === 'string' && Array.isArray(flow.nodes) && Array.isArray(flow.edges);
};

export function parseFlowJson(json: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, reason: 'invalid_json' };
  }
  if (typeof parsed !== 'object' || parsed === null) return { ok: false, reason: 'invalid_shape' };
  const version = (parsed as { schemaVersion?: unknown }).schemaVersion;
  if (version !== 1) return { ok: false, reason: 'unknown_schema', schemaVersion: version };
  if (!isFlow(parsed)) return { ok: false, reason: 'invalid_shape' };
  return { ok: true, flow: parsed };
}

export function downloadFlowJson(flow: Flow, filename = `shifacare_flow_${Date.now()}.json`) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(flow, null, 2));
  const anchor = document.createElement('a');
  anchor.setAttribute('href', dataStr);
  anchor.setAttribute('download', filename);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export const readFileAsText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(String(e.target?.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, 'UTF-8');
  });
