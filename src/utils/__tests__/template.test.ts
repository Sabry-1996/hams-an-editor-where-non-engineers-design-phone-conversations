import { describe, expect, it } from 'vitest';
import { interpolateVariables, toPlaceholder } from '../template';

describe('interpolateVariables', () => {
  it('replaces every occurrence of a placeholder', () => {
    expect(interpolateVariables('ID {{member_id}} / {{member_id}}', { member_id: '102938' })).toBe('ID 102938 / 102938');
  });

  it('serialises object values as JSON', () => {
    expect(interpolateVariables('{{api_result}}', { api_result: { status: 'active' } })).toBe('{"status":"active"}');
  });

  it('leaves unknown placeholders untouched', () => {
    expect(interpolateVariables('Hello {{name}}', {})).toBe('Hello {{name}}');
  });

  it('escapes regex metacharacters in variable names', () => {
    expect(interpolateVariables('{{a.b}}', { 'a.b': 'x', axb: 'wrong' })).toBe('x');
  });
});

describe('toPlaceholder', () => {
  it('wraps a name in double braces', () => {
    expect(toPlaceholder('member_id')).toBe('{{member_id}}');
  });
});
