import { describe, expect, it } from 'vitest';
import { DEFAULT_FLOW } from '../../data/defaultFlow';
import type { Flow } from '../../types/flow';
import { parseFlowJson } from '../flowIO';
import {
  computeDiagnostics,
  connectNodes,
  disconnectEdge,
  getReachableNodeIds,
  getUpstreamVariables,
  removeNodes
} from '../flowGraph';

describe('getUpstreamVariables', () => {
  it('keeps only variables set on every path into the node', () => {
    expect(getUpstreamVariables(DEFAULT_FLOW, 'cond')).toEqual(expect.arrayContaining(['member_id', 'procedure', 'coverage_status']));
  });

  it('returns nothing before any question is saved', () => {
    expect(getUpstreamVariables(DEFAULT_FLOW, 'ask_member')).toEqual([]);
  });

  it('drops a variable that is missing on one path', () => {
    const flow: Flow = {
      ...DEFAULT_FLOW,
      edges: [...DEFAULT_FLOW.edges, { id: 'shortcut', from: 'greet', to: 'cond' }]
    };
    expect(getUpstreamVariables(flow, 'cond')).toEqual([]);
  });
});

describe('computeDiagnostics', () => {
  it('reports a clean default flow', () => {
    expect(computeDiagnostics(DEFAULT_FLOW)).toEqual([]);
  });

  it('flags a missing start node', () => {
    const flow: Flow = { ...DEFAULT_FLOW, nodes: DEFAULT_FLOW.nodes.filter(n => n.data.kind !== 'start') };
    expect(computeDiagnostics(flow).some(d => d.code === 'missing_start')).toBe(true);
  });

  it('flags a dead end and an unreachable step after removing an edge', () => {
    const edge = DEFAULT_FLOW.edges.find(item => item.from === 'greet' && item.to === 'ask_member');
    const flow = disconnectEdge(DEFAULT_FLOW, edge!.id);
    const diags = computeDiagnostics(flow);
    expect(diags.find(d => d.nodeId === 'greet')?.code).toBe('dead_end');
    expect(diags.find(d => d.nodeId === 'ask_member')?.code).toBe('unreachable');
  });

  it('warns when Arabic or English is missing', () => {
    const flow: Flow = {
      ...DEFAULT_FLOW,
      nodes: DEFAULT_FLOW.nodes.map(n => (
        n.id === 'greet' && n.data.kind === 'say'
          ? { ...n, data: { ...n.data, text: { ...n.data.text, en: '' } } }
          : n
      ))
    };
    expect(computeDiagnostics(flow).some(d => d.nodeId === 'greet' && d.code === 'missing_text')).toBe(true);
  });
});

describe('graph mutations', () => {
  it('connectNodes ignores a second identical link and a self-link', () => {
    const once = connectNodes(DEFAULT_FLOW, 'end_ok', 'start');
    expect(once.edges.some(edge => edge.from === 'end_ok' && edge.to === 'start')).toBe(true);
    expect(connectNodes(once, 'end_ok', 'start')).toBe(once);
    expect(connectNodes(DEFAULT_FLOW, 'start', 'start')).toBe(DEFAULT_FLOW);
  });

  it('removeNodes drops the step and every edge that touched it', () => {
    const flow = removeNodes(DEFAULT_FLOW, ['ask_member']);
    expect(flow.nodes.some(n => n.id === 'ask_member')).toBe(false);
    expect(flow.edges.some(edge => edge.from === 'ask_member' || edge.to === 'ask_member')).toBe(false);
  });

  it('getReachableNodeIds walks every node of the default flow', () => {
    expect(getReachableNodeIds(DEFAULT_FLOW).size).toBe(DEFAULT_FLOW.nodes.length);
  });
});

describe('parseFlowJson', () => {
  it('rejects an unknown schemaVersion without throwing', () => {
    const result = parseFlowJson(JSON.stringify({ schemaVersion: 9, id: 'x', name: 'x', nodes: [], edges: [] }));
    expect(result).toEqual({ ok: false, reason: 'unknown_schema', schemaVersion: 9 });
  });

  it('rejects text that is not JSON', () => {
    expect(parseFlowJson('{')).toEqual({ ok: false, reason: 'invalid_json' });
  });
});
