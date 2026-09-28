import type { FlowSchema } from '../types/flow';

export const isFlowSchema = (value: unknown): value is FlowSchema =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as FlowSchema).version === 'string' &&
  Array.isArray((value as FlowSchema).nodes);

export function parseFlowJson(json: string): FlowSchema | null {
  try {
    const parsed = JSON.parse(json);
    return isFlowSchema(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function downloadFlowJson(flow: FlowSchema, filename = `shifacare_voice_flow_${Date.now()}.json`) {
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
