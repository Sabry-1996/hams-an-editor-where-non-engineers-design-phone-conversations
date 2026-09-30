import type { ConditionRule, Flow, FlowNode } from '../types/flow';
import { findStartNode, getReachableNodeIds, outgoing } from './flowGraph';

/**
 * Turns the call graph into a script Reem can read top to bottom.
 *
 * Exits follow the same rules as the test call (useCallSimulator): say / ask / start take their
 * first connection, a tool takes its `ok` and `error` connections, and a decision takes its rules
 * in order, then "otherwise". A split whose paths meet again later is shown as side-by-side paths
 * that rejoin the timeline. A split that never meets again keeps its main path (tool `ok`, first
 * rule) on the timeline and folds the other paths away, so the story still reads in one line.
 */

export type BranchCondition =
  | { type: 'ok' }
  | { type: 'error' }
  | { type: 'rule'; rule: ConditionRule }
  | { type: 'else' };

export type BranchOutcome =
  | { type: 'end' }
  | { type: 'transfer'; queue: string }
  | { type: 'rejoin'; nodeId: string }
  | { type: 'goto'; nodeId: string }
  | { type: 'dead_end' };

export interface ScriptBranch {
  key: string;
  /** Every condition that leads here; several rules can share one target. */
  conditions: BranchCondition[];
  targetId: string | null;
  /** The happy path: tool `ok`, or the first rule of a decision. */
  primary: boolean;
  /** The branch carries on as the main timeline, right below this step, so `steps` is empty. */
  inline: boolean;
  steps: ScriptStep[];
  outcome: BranchOutcome;
}

export type ScriptStep =
  | {
      type: 'node';
      key: string;
      node: FlowNode;
      branches: ScriptBranch[];
      /** Set when the branches meet again at this step, which follows on the timeline. */
      rejoinsAt?: string;
    }
  | { type: 'goto'; key: string; targetId: string }
  | { type: 'dead_end'; key: string };

export interface CallScript {
  start: FlowNode | undefined;
  steps: ScriptStep[];
  /** Steps nothing on the board leads to (same rule as the Notes tab), in board order. */
  unreached: FlowNode[];
  /** Branch keys around each step, outermost first; open them to show that step. */
  trails: Map<string, string[]>;
  branchKeys: string[];
  stepCount: number;
  /** How many different ways the call can finish (end, transfer or a sudden stop). */
  endingCount: number;
}

interface Exit {
  condition: BranchCondition;
  targetId: string | null;
}

const EXIT = '__exit__';

function exitsOf(flow: Pick<Flow, 'nodes' | 'edges'>, node: FlowNode, ids: Set<string>): Exit[] {
  const edges = outgoing(flow as Flow, node.id);
  const known = (id: string | undefined) => (id && ids.has(id) ? id : null);
  switch (node.data.kind) {
    case 'end':
    case 'transfer':
      return [];
    case 'tool': {
      const via = (branch: 'ok' | 'error') => known(edges.find(e => e.branch === branch)?.to);
      return [
        { condition: { type: 'ok' }, targetId: via('ok') },
        { condition: { type: 'error' }, targetId: via('error') }
      ];
    }
    case 'condition': {
      const rules: Exit[] = node.data.rules
        .filter(rule => rule.branch)
        .map(rule => ({ condition: { type: 'rule', rule }, targetId: known(rule.branch) }));
      return [...rules, { condition: { type: 'else' }, targetId: known(node.data.elseBranch) }];
    }
    default: {
      const next = known(edges[0]?.to);
      return next ? [{ condition: { type: 'else' }, targetId: next }] : [];
    }
  }
}

/** Groups exits that land on the same step, keeping the first one's position. Missing targets stay apart. */
function groupExits(exits: Exit[]): Array<{ conditions: BranchCondition[]; targetId: string | null }> {
  const groups: Array<{ conditions: BranchCondition[]; targetId: string | null }> = [];
  exits.forEach(exit => {
    const same = exit.targetId ? groups.find(g => g.targetId === exit.targetId) : undefined;
    if (same) same.conditions.push(exit.condition);
    else groups.push({ conditions: [exit.condition], targetId: exit.targetId });
  });
  return groups;
}

/**
 * Immediate post-dominator of every step: the first step that every route out of it must pass
 * before the call finishes. That is where the paths of a split meet again.
 */
function mergePoints(ids: string[], successors: Map<string, string[]>): Map<string, string | null> {
  const all = new Set([...ids, EXIT]);
  const pdom = new Map<string, Set<string>>(ids.map(id => [id, new Set(all)]));
  pdom.set(EXIT, new Set([EXIT]));
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of ids) {
      const succ = successors.get(id) ?? [];
      const sets = succ.map(s => pdom.get(s)!);
      const next = new Set<string>(sets.length ? [...sets[0]].filter(x => sets.every(set => set.has(x))) : []);
      next.add(id);
      if (next.size !== pdom.get(id)!.size) {
        pdom.set(id, next);
        changed = true;
      }
    }
  }
  // A step caught in a loop that never finishes has no real meeting point; leave it out.
  const canFinish = new Set<string>([EXIT]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const id of ids) {
      if (!canFinish.has(id) && (successors.get(id) ?? []).some(s => canFinish.has(s))) {
        canFinish.add(id);
        grew = true;
      }
    }
  }

  const result = new Map<string, string | null>();
  for (const id of ids) {
    if (!canFinish.has(id)) {
      result.set(id, null);
      continue;
    }
    const strict = [...pdom.get(id)!].filter(x => x !== id);
    // The closest one is post-dominated by all the others.
    const closest = strict.find(candidate => strict.every(x => pdom.get(candidate)!.has(x)));
    result.set(id, closest && closest !== EXIT ? closest : null);
  }
  return result;
}

export function buildCallScript(flow: Pick<Flow, 'nodes' | 'edges'>): CallScript {
  const ids = new Set(flow.nodes.map(n => n.id));
  const byId = new Map(flow.nodes.map(n => [n.id, n]));
  const start = findStartNode(flow as Flow);

  const exits = new Map<string, Exit[]>();
  const successors = new Map<string, string[]>();
  flow.nodes.forEach(node => {
    const list = exitsOf(flow, node, ids);
    exits.set(node.id, list);
    const targets = list.map(e => e.targetId ?? EXIT);
    successors.set(node.id, [...new Set(targets.length ? targets : [EXIT])]);
  });
  const merges = mergePoints(flow.nodes.map(n => n.id), successors);

  const visited = new Set<string>();
  const trails = new Map<string, string[]>();
  const branchKeys: string[] = [];
  let stepCount = 0;
  let endingCount = 0;

  type Walk = { steps: ScriptStep[]; outcome: BranchOutcome };

  const walk = (from: string | null, stops: Set<string>, trail: string[], keyPrefix: string): Walk => {
    const steps: ScriptStep[] = [];
    let id = from;
    while (true) {
      if (!id || !byId.has(id)) {
        endingCount += 1;
        steps.push({ type: 'dead_end', key: `${keyPrefix}:dead` });
        return { steps, outcome: { type: 'dead_end' } };
      }
      if (stops.has(id)) return { steps, outcome: { type: 'rejoin', nodeId: id } };
      if (visited.has(id)) {
        steps.push({ type: 'goto', key: `${keyPrefix}:goto:${id}`, targetId: id });
        return { steps, outcome: { type: 'goto', nodeId: id } };
      }

      const node = byId.get(id)!;
      visited.add(id);
      trails.set(id, trail);
      if (node.data.kind !== 'start') stepCount += 1;

      const groups = groupExits(exits.get(id) ?? []);
      if (node.data.kind === 'end' || node.data.kind === 'transfer') {
        endingCount += 1;
        steps.push({ type: 'node', key: id, node, branches: [] });
        return {
          steps,
          outcome: node.data.kind === 'transfer' ? { type: 'transfer', queue: node.data.queue } : { type: 'end' }
        };
      }
      if (groups.length === 0) {
        steps.push({ type: 'node', key: id, node, branches: [] });
        id = null;
        continue;
      }
      if (groups.length === 1) {
        steps.push({ type: 'node', key: id, node, branches: [] });
        id = groups[0].targetId;
        continue;
      }

      const merge = merges.get(id) ?? null;
      const branchKey = (index: number) => `${id}:${index}`;
      const branchOf = (index: number, inline: boolean, result: Walk): ScriptBranch => {
        const key = branchKey(index);
        if (!inline) branchKeys.push(key);
        return {
          key,
          conditions: groups[index].conditions,
          targetId: groups[index].targetId,
          primary: index === 0,
          inline,
          steps: inline ? [] : result.steps,
          outcome: result.outcome
        };
      };

      if (merge) {
        // The paths meet again: show each one as its own path, then carry on from where they meet.
        const inner = new Set([...stops, merge]);
        const branches = groups.map((group, index) =>
          branchOf(index, false, walk(group.targetId, inner, [...trail, branchKey(index)], branchKey(index)))
        );
        steps.push({ type: 'node', key: id, node, branches, rejoinsAt: merge });
        id = merge;
        continue;
      }

      // No meeting point: the main path owns the timeline, so it is walked first and claims shared steps.
      const step: ScriptStep = { type: 'node', key: id, node, branches: [] };
      steps.push(step);
      const main = walk(groups[0].targetId, stops, trail, branchKey(0));
      const others = groups.slice(1).map((group, offset) => {
        const index = offset + 1;
        return branchOf(index, false, walk(group.targetId, stops, [...trail, branchKey(index)], branchKey(index)));
      });
      step.branches = [branchOf(0, true, main), ...others];
      steps.push(...main.steps);
      return { steps, outcome: main.outcome };
    }
  };

  const steps = start ? walk(start.id, new Set(), [], 'root').steps : [];
  const reachable = getReachableNodeIds(flow as Flow);
  const unreached = flow.nodes.filter(n => !reachable.has(n.id));

  return { start, steps, unreached, trails, branchKeys, stepCount, endingCount };
}

/** The line a step speaks aloud, if any, in both languages. */
export function spokenText(node: FlowNode) {
  const d = node.data;
  if (d.kind === 'say') return d.text;
  if (d.kind === 'ask') return d.prompt;
  if (d.kind === 'transfer') return d.whisper;
  if (d.kind === 'end') return d.text;
  return undefined;
}
