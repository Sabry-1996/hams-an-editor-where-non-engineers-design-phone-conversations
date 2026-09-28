import type { SimVariables } from '../types/simulator';

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function interpolateVariables(template: string, variables: SimVariables): string {
  let result = template;
  Object.keys(variables).forEach(key => {
    const raw = variables[key];
    const value = raw !== null && typeof raw === 'object' ? JSON.stringify(raw) : String(raw);
    result = result.replace(new RegExp(`\\{\\{${escapeRegExp(key)}\\}\\}`, 'g'), value);
  });
  return result;
}

export const toPlaceholder = (name: string) => `{{${name}}}`;
export const nowTime = () => new Date().toLocaleTimeString();
