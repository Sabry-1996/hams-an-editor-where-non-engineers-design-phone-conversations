import type { Diagnostic, Edge, Flow, FlowNode, LocalizedText, NodeData, NodeKind } from '../types/flow';

export const findNode = (flow: Flow, id: string | null | undefined): FlowNode | undefined =>
  id ? flow.nodes.find(n => n.id === id) : undefined;

export const findStartNode = (flow: Flow): FlowNode | undefined =>
  flow.nodes.find(n => n.data.kind === 'start');

export const outgoing = (flow: Flow, id: string): Edge[] => flow.edges.filter(e => e.from === id);
export const incoming = (flow: Flow, id: string): Edge[] => flow.edges.filter(e => e.to === id);

const PLACEHOLDER = /\{\{\s*([A-Za-z_][\w]*)\s*\}\}/g;

export function placeholdersIn(text: string | undefined): string[] {
  if (!text) return [];
  return [...text.matchAll(PLACEHOLDER)].map(m => m[1]);
}

function textVars(text?: LocalizedText): string[] {
  if (!text) return [];
  return [...placeholdersIn(text.ar), ...placeholdersIn(text.en)];
}

export function variablesReadBy(node: FlowNode): string[] {
  const d = node.data;
  const found: string[] = [];
  if (d.kind === 'say' || d.kind === 'end') found.push(...textVars(d.kind === 'say' ? d.text : d.text));
  if (d.kind === 'ask') found.push(...textVars(d.prompt));
  if (d.kind === 'transfer') found.push(...textVars(d.whisper));
  if (d.kind === 'tool') Object.values(d.args).forEach(v => found.push(...placeholdersIn(v)));
  if (d.kind === 'condition') d.rules.forEach(r => found.push(r.variable));
  return [...new Set(found)];
}

function variablesWrittenBy(node: FlowNode): string[] {
  if (node.data.kind === 'ask' && node.data.saveAs) return [node.data.saveAs];
  if (node.data.kind === 'tool' && node.data.saveAs) return [node.data.saveAs];
  return [];
}

/** Every simple path from start to `targetId` (the target itself is not included). */
function pathsInto(flow: Flow, targetId: string): string[][] {
  const start = findStartNode(flow);
  if (!start) return [];
  const results: string[][] = [];
  const walk = (id: string, path: string[], seen: Set<string>) => {
    if (id === targetId) {
      results.push(path);
      return;
    }
    if (seen.has(id)) return;
    const nextSeen = new Set(seen);
    nextSeen.add(id);
    outgoing(flow, id).forEach(e => walk(e.to, [...path, id], nextSeen));
  };
  walk(start.id, [], new Set());
  return results;
}

function varsOnPath(flow: Flow, path: string[]): Set<string> {
  const vars = new Set<string>();
  path.forEach(id => {
    const node = findNode(flow, id);
    if (node) variablesWrittenBy(node).forEach(v => vars.add(v));
  });
  return vars;
}

/** Variables set on EVERY path that reaches this node. Those are the only safe {{suggestions}}. */
export function getUpstreamVariables(flow: Flow, targetId: string): string[] {
  const paths = pathsInto(flow, targetId);
  if (paths.length === 0) return [];
  let common = varsOnPath(flow, paths[0]);
  paths.slice(1).forEach(path => {
    const vars = varsOnPath(flow, path);
    common = new Set([...common].filter(v => vars.has(v)));
  });
  return [...common];
}

export function getReachableNodeIds(flow: Flow): Set<string> {
  const reachable = new Set<string>();
  const queue = flow.nodes.filter(n => n.data.kind === 'start').map(n => n.id);
  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (reachable.has(curr)) continue;
    reachable.add(curr);
    outgoing(flow, curr).forEach(e => queue.push(e.to));
  }
  return reachable;
}

function canReachTerminal(flow: Flow, startId: string, seen = new Set<string>()): boolean {
  if (seen.has(startId)) return false;
  const node = findNode(flow, startId);
  if (!node) return false;
  if (node.data.kind === 'end' || node.data.kind === 'transfer') return true;
  const next = new Set(seen);
  next.add(startId);
  return outgoing(flow, startId).some(e => canReachTerminal(flow, e.to, next));
}

function isInCycle(flow: Flow, startId: string): boolean {
  const seen = new Set<string>();
  const stack = new Set<string>();
  const dfs = (id: string): boolean => {
    if (stack.has(id)) return id === startId;
    if (seen.has(id)) return false;
    seen.add(id);
    stack.add(id);
    for (const edge of outgoing(flow, id)) {
      if (edge.to === startId && id !== startId) return true;
      if (dfs(edge.to)) return true;
    }
    stack.delete(id);
    return false;
  };
  return dfs(startId);
}

function missingLang(text: LocalizedText | undefined): boolean {
  return !text || !text.ar.trim() || !text.en.trim();
}

function push(diags: Diagnostic[], level: Diagnostic['level'], code: string, node?: FlowNode, params?: Record<string, string>) {
  diags.push({ level, code, nodeId: node?.id, params: { label: node?.label ?? '', ...(params ?? {}) } });
}

export function computeDiagnostics(flow: Flow): Diagnostic[] {
  const diags: Diagnostic[] = [];
  const starts = flow.nodes.filter(n => n.data.kind === 'start');
  if (starts.length === 0) push(diags, 'error', 'missing_start');
  else if (starts.length > 1) push(diags, 'warning', 'many_starts');

  const reachable = getReachableNodeIds(flow);

  flow.nodes.forEach(node => {
    const outs = outgoing(flow, node.id);
    if (!reachable.has(node.id) && node.data.kind !== 'start') push(diags, 'warning', 'unreachable', node);

    if (outs.length === 0 && node.data.kind !== 'end' && node.data.kind !== 'transfer') {
      push(diags, 'error', 'dead_end', node);
    }

    if (
      reachable.has(node.id) &&
      node.data.kind !== 'end' &&
      node.data.kind !== 'transfer' &&
      outs.length > 0 &&
      !canReachTerminal(flow, node.id) &&
      isInCycle(flow, node.id)
    ) {
      push(diags, 'error', 'trap_loop', node);
    }

    if (node.data.kind === 'ask') {
      if (!node.data.onNoInput || node.data.maxRetries < 1) push(diags, 'error', 'no_silence_plan', node);
      if (!node.data.saveAs.trim()) push(diags, 'error', 'ask_no_variable', node);
      if (missingLang(node.data.prompt)) push(diags, 'warning', 'missing_text', node);
    }

    if (node.data.kind === 'say' && missingLang(node.data.text)) push(diags, 'warning', 'missing_text', node);
    if (node.data.kind === 'transfer' && node.data.whisper && missingLang(node.data.whisper)) push(diags, 'warning', 'missing_text', node);
    if (node.data.kind === 'end' && node.data.text && missingLang(node.data.text)) push(diags, 'warning', 'missing_text', node);

    if (node.data.kind === 'tool') {
      const branches = new Set(outs.map(e => e.branch));
      if (!branches.has('ok') || !branches.has('error')) push(diags, 'error', 'tool_branches', node);
    }

    const safe = new Set(getUpstreamVariables(flow, node.id));
    variablesReadBy(node).forEach(name => {
      if (!safe.has(name)) push(diags, 'error', 'var_not_ready', node, { variable: name });
    });
  });

  return diags;
}

export function updateNode(flow: Flow, id: string, patch: (node: FlowNode) => FlowNode): Flow {
  return { ...flow, nodes: flow.nodes.map(n => (n.id === id ? patch(n) : n)) };
}

export function removeNodes(flow: Flow, ids: string[]): Flow {
  const drop = new Set(ids);
  return {
    ...flow,
    nodes: flow.nodes.filter(n => !drop.has(n.id)),
    edges: flow.edges.filter(e => !drop.has(e.from) && !drop.has(e.to))
  };
}

export function connectNodes(flow: Flow, from: string, to: string, branch?: string): Flow {
  if (from === to) return flow;
  if (flow.edges.some(e => e.from === from && e.to === to && e.branch === branch)) return flow;
  const edge: Edge = { id: `e_${from}_${to}_${branch ?? 'next'}_${Date.now()}`, from, to, branch };
  return { ...flow, edges: [...flow.edges, edge] };
}

export function disconnectEdge(flow: Flow, edgeId: string): Flow {
  return { ...flow, edges: flow.edges.filter(e => e.id !== edgeId) };
}

const DEFAULT_DATA: Record<NodeKind, () => NodeData> = {
  start: () => ({ kind: 'start' }),
  say: () => ({ kind: 'say', text: { ar: 'مرحباً...', en: 'Hello...' } }),
  ask: () => ({
    kind: 'ask',
    prompt: { ar: 'ممكن توضح لي؟', en: 'Could you tell me more?' },
    saveAs: 'answer',
    expect: 'free_text',
    onNoInput: 'reprompt',
    maxRetries: 2
  }),
  condition: () => ({ kind: 'condition', rules: [], elseBranch: '' }),
  tool: () => ({ kind: 'tool', name: 'check_coverage', args: {}, saveAs: 'tool_result' }),
  transfer: () => ({ kind: 'transfer', queue: 'coverage_specialist', whisper: { ar: '', en: '' } }),
  end: () => ({ kind: 'end', text: { ar: 'شكراً لاتصالك.', en: 'Thank you for calling.' } })
};

export function createNode(kind: NodeKind, position: { x: number; y: number }): FlowNode {
  return {
    id: `node_${Date.now()}`,
    position,
    label: kind,
    data: DEFAULT_DATA[kind]()
  };
}

export function patchNodeData(node: FlowNode, data: Partial<NodeData>): FlowNode {
  return { ...node, data: { ...node.data, ...data } as NodeData };
}
