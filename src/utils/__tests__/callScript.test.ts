import { describe, expect, it } from 'vitest';
import { DEFAULT_FLOW } from '../../data/defaultFlow';
import type { Flow } from '../../types/flow';
import { buildCallScript, type ScriptStep } from '../callScript';

const nodeIds = (steps: ScriptStep[]) =>
  steps.map(step => (step.type === 'node' ? step.node.id : step.type === 'goto' ? `goto:${step.targetId}` : 'dead_end'));

const stepFor = (steps: ScriptStep[], id: string) => {
  const step = steps.find(s => s.type === 'node' && s.node.id === id);
  if (!step || step.type !== 'node') throw new Error(`no step ${id}`);
  return step;
};

describe('buildCallScript', () => {
  const script = buildCallScript(DEFAULT_FLOW);

  it('keeps the main story on one timeline, from the start to the end', () => {
    expect(nodeIds(script.steps)).toEqual([
      'start', 'greet', 'ask_member', 'ask_procedure', 'tool_coverage', 'cond', 'ask_book', 'cond_book', 'end_ok'
    ]);
  });

  it('keeps the tool ok path inline and folds the error path away', () => {
    const tool = stepFor(script.steps, 'tool_coverage');
    expect(tool.branches.map(b => [b.conditions[0].type, b.inline])).toEqual([['ok', true], ['error', false]]);
    // The human transfer is first told under "Covered?", so the error path jumps to it.
    expect(nodeIds(tool.branches[1].steps)).toEqual(['goto:transfer']);
  });

  it('tells the transfer path under the decision that leads to it', () => {
    const cond = stepFor(script.steps, 'cond');
    const other = cond.branches[1];
    expect(other.conditions).toEqual([{ type: 'else' }]);
    // A transfer hands the call over, exactly like the test call, so nothing after it is read out.
    expect(nodeIds(other.steps)).toEqual(['transfer']);
    expect(other.outcome).toEqual({ type: 'transfer', queue: 'coverage_specialist' });
  });

  it('shows paths that meet again side by side, then rejoins', () => {
    const book = stepFor(script.steps, 'cond_book');
    expect(book.rejoinsAt).toBe('end_ok');
    expect(book.branches.map(b => nodeIds(b.steps))).toEqual([['say_booked'], ['say_skip']]);
    // "no" and "otherwise" both lead to say_skip, so they are one path.
    expect(book.branches[1].conditions.map(c => c.type)).toEqual(['rule', 'else']);
    expect(book.branches.every(b => b.outcome.type === 'rejoin')).toBe(true);
  });

  it('records where each step sits so a jump can open its path', () => {
    expect(script.trails.get('transfer')).toEqual(['cond:1']);
    expect(script.trails.get('greet')).toEqual([]);
    expect(script.unreached).toEqual([]);
    expect(script.endingCount).toBe(2);
  });

  it('marks a missing tool exit as a dead end', () => {
    const flow: Flow = { ...DEFAULT_FLOW, edges: DEFAULT_FLOW.edges.filter(e => e.branch !== 'error') };
    const tool = stepFor(buildCallScript(flow).steps, 'tool_coverage');
    expect(tool.branches[1].outcome).toEqual({ type: 'dead_end' });
    expect(nodeIds(tool.branches[1].steps)).toEqual(['dead_end']);
  });

  it('lists steps nothing leads to, and survives loops', () => {
    const flow: Flow = {
      ...DEFAULT_FLOW,
      nodes: [...DEFAULT_FLOW.nodes, { id: 'lonely', position: { x: 0, y: 0 }, label: 'Lonely', data: { kind: 'say', text: { ar: '', en: '' } } }],
      edges: DEFAULT_FLOW.edges.map(e => (e.from === 'ask_procedure' ? { ...e, to: 'ask_member' } : e))
    };
    const looped = buildCallScript(flow);
    expect(nodeIds(looped.steps)).toEqual(['start', 'greet', 'ask_member', 'ask_procedure', 'goto:ask_member']);
    expect(looped.unreached.map(n => n.id)).toContain('lonely');
  });

  it('returns an empty script when there is no start', () => {
    const empty = buildCallScript({ nodes: DEFAULT_FLOW.nodes.filter(n => n.data.kind !== 'start'), edges: [] });
    expect(empty.start).toBeUndefined();
    expect(empty.steps).toEqual([]);
  });
});
