import type { Diagnostic, FlowSchema, NodeData, NodeType } from '../types/flow';

export const findNode = (flow: FlowSchema, id: string | null | undefined): NodeData | undefined =>
  id ? flow.nodes.find(n => n.id === id) : undefined;

export const findStartNode = (flow: FlowSchema): NodeData | undefined =>
  flow.nodes.find(n => n.type === 'start');

export const SPEAKING_NODE_TYPES: ReadonlySet<NodeType> = new Set(['say', 'ask', 'transfer']);
export const isSpeakingNode = (node: NodeData): boolean => SPEAKING_NODE_TYPES.has(node.type);

export function getUpstreamVariables(flow: FlowSchema, targetNodeId: string): string[] {
  const vars = new Set<string>();
  const visited = new Set<string>();

  const traverse = (currId: string) => {
    if (visited.has(currId) || currId === targetNodeId) return;
    visited.add(currId);
    const node = findNode(flow, currId);
    if (node) {
      if (node.type === 'ask' && node.config.expectedVariable) vars.add(node.config.expectedVariable);
      if (node.type === 'tool') {
        vars.add('api_result');
        vars.add('api_status');
      }
    }
    flow.nodes.forEach(n => {
      if (n.outputs.includes(currId)) traverse(n.id);
    });
  };

  flow.nodes.forEach(n => {
    if (n.outputs.includes(targetNodeId)) traverse(n.id);
  });
  return Array.from(vars);
}

export function getReachableNodeIds(flow: FlowSchema): Set<string> {
  const nodeMap = new Map(flow.nodes.map(n => [n.id, n]));
  const reachable = new Set<string>();
  const queue = flow.nodes.filter(n => n.type === 'start').map(s => s.id);
  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (reachable.has(curr)) continue;
    reachable.add(curr);
    nodeMap.get(curr)?.outputs.forEach(out => queue.push(out));
  }
  return reachable;
}

export function computeDiagnostics(flow: FlowSchema): Diagnostic[] {
  const diags: Diagnostic[] = [];
  const starts = flow.nodes.filter(n => n.type === 'start');
  if (starts.length === 0) {
    diags.push({ level: 'error', messageAr: 'العقدة البدائية (Start) مفقودة في التدفق.', messageEn: 'Start node is missing in the flow.' });
  } else if (starts.length > 1) {
    diags.push({ level: 'warning', messageAr: 'يوجد أكثر من عقدة بداية واحدة.', messageEn: 'Multiple start nodes detected.' });
  }
  const reachable = getReachableNodeIds(flow);
  flow.nodes.forEach(node => {
    if (!reachable.has(node.id) && node.type !== 'start') {
      diags.push({
        nodeId: node.id,
        level: 'warning',
        messageAr: `العقدة "${node.label}" غير معزولة أو لا يمكن الوصول إليها (Unreachable).`,
        messageEn: `Node "${node.label}" is unreachable from start.`
      });
    }
    if (node.outputs.length === 0 && node.type !== 'end') {
      diags.push({
        nodeId: node.id,
        level: 'error',
        messageAr: `العقدة "${node.label}" منتهية بدون مخرج ولم يتم تحديدها كعقدة نهاية (Dead end).`,
        messageEn: `Node "${node.label}" has no outgoing paths and is not an End node.`
      });
    }
    if (isSpeakingNode(node) && (!node.config.speechAr || !node.config.speechEn)) {
      diags.push({
        nodeId: node.id,
        level: 'warning',
        messageAr: `العقدة "${node.label}" تفتقر إلى إحدى لغتي النص (عربي/إنجليزي).`,
        messageEn: `Node "${node.label}" is missing either Arabic or English speech text.`
      });
    }
  });
  return diags;
}

export const updateNode = (flow: FlowSchema, nodeId: string, patch: (node: NodeData) => NodeData): FlowSchema => ({
  ...flow,
  nodes: flow.nodes.map(n => (n.id === nodeId ? patch(n) : n))
});

export const removeNode = (flow: FlowSchema, nodeId: string): FlowSchema => ({
  ...flow,
  nodes: flow.nodes.filter(n => n.id !== nodeId).map(n => ({ ...n, outputs: n.outputs.filter(id => id !== nodeId) }))
});

export const connectNodes = (flow: FlowSchema, sourceId: string, targetId: string): FlowSchema => {
  if (sourceId === targetId) return flow;
  const source = findNode(flow, sourceId);
  if (!source || source.outputs.includes(targetId)) return flow;
  return updateNode(flow, sourceId, n => ({ ...n, outputs: [...n.outputs, targetId] }));
};

export const disconnectNodes = (flow: FlowSchema, sourceId: string, targetId: string): FlowSchema =>
  updateNode(flow, sourceId, n => ({ ...n, outputs: n.outputs.filter(id => id !== targetId) }));

export const createNode = (type: NodeType, position: { x: number; y: number }): NodeData => ({
  id: `node_${Date.now()}`,
  type,
  label: `عقدة جديدة (${type})`,
  position,
  config: { bilingualMode: true, speechAr: 'مرحباً...', speechEn: 'Hello...' },
  outputs: []
});
