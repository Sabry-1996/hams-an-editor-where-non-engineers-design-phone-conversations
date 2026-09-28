import { describe, expect, it } from 'vitest';
import { DEFAULT_FLOW } from '../../data/defaultFlow';
import type { FlowSchema } from '../../types/flow';
import {
  computeDiagnostics,
  connectNodes,
  disconnectNodes,
  getReachableNodeIds,
  getUpstreamVariables,
  removeNode
} from '../flowGraph';

describe('getUpstreamVariables', () => {
  it('collects ask variables and tool outputs on paths into the node', () => {
    const vars = getUpstreamVariables(DEFAULT_FLOW, 'node_condition_coverage');
    expect(vars).toEqual(expect.arrayContaining(['member_id', 'api_result', 'api_status']));
  });

  it('returns nothing for the first node after start', () => {
    expect(getUpstreamVariables(DEFAULT_FLOW, 'node_greeting')).toEqual([]);
  });
});

describe('computeDiagnostics', () => {
  it('reports a clean default flow', () => {
    expect(computeDiagnostics(DEFAULT_FLOW)).toEqual([]);
  });

  it('flags a missing start node', () => {
    const flow: FlowSchema = { ...DEFAULT_FLOW, nodes: DEFAULT_FLOW.nodes.filter(n => n.type !== 'start') };
    const diags = computeDiagnostics(flow);
    expect(diags.some(d => d.level === 'error' && d.messageEn.includes('Start node is missing'))).toBe(true);
  });

  it('flags dead ends and unreachable nodes after removing an edge', () => {
    const flow = disconnectNodes(DEFAULT_FLOW, 'node_greeting', 'node_ask_member');
    const diags = computeDiagnostics(flow);
    expect(diags.find(d => d.nodeId === 'node_greeting')?.level).toBe('error');
    expect(diags.find(d => d.nodeId === 'node_ask_member')?.level).toBe('warning');
  });

  it('warns when a speaking node lacks one language', () => {
    const flow: FlowSchema = {
      ...DEFAULT_FLOW,
      nodes: DEFAULT_FLOW.nodes.map(n => (n.id === 'node_greeting' ? { ...n, config: { ...n.config, speechEn: '' } } : n))
    };
    expect(computeDiagnostics(flow).some(d => d.nodeId === 'node_greeting' && d.level === 'warning')).toBe(true);
  });
});

describe('graph mutations', () => {
  it('connectNodes is idempotent and ignores self-links', () => {
    const once = connectNodes(DEFAULT_FLOW, 'node_end_success', 'node_start');
    expect(once.nodes.find(n => n.id === 'node_end_success')?.outputs).toEqual(['node_start']);
    expect(connectNodes(once, 'node_end_success', 'node_start')).toBe(once);
    expect(connectNodes(DEFAULT_FLOW, 'node_start', 'node_start')).toBe(DEFAULT_FLOW);
  });

  it('removeNode also drops incoming edges', () => {
    const flow = removeNode(DEFAULT_FLOW, 'node_ask_member');
    expect(flow.nodes.some(n => n.id === 'node_ask_member')).toBe(false);
    expect(flow.nodes.find(n => n.id === 'node_greeting')?.outputs).toEqual([]);
  });

  it('getReachableNodeIds walks every node of the default flow', () => {
    expect(getReachableNodeIds(DEFAULT_FLOW).size).toBe(DEFAULT_FLOW.nodes.length);
  });
});
