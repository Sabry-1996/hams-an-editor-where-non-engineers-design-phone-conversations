import type { Edge, Flow, FlowNode, NodeKind } from '../types/flow';

const tx = (ar: string, en: string) => ({ ar, en });

const node = (id: string, x: number, y: number, label: string, data: FlowNode['data']): FlowNode => ({
  id, position: { x, y }, label, data
});

const edge = (from: string, to: string, branch?: string): Edge => ({
  id: `e_${from}_${to}${branch ? `_${branch}` : ''}`,
  from,
  to,
  branch
});

/** Coverage-check call Reem builds: greet, verify member ID, ask the procedure, call coverage, branch, transfer when it gets messy. */
export const DEFAULT_FLOW: Flow = {
  schemaVersion: 1,
  id: 'flow_coverage',
  name: 'شفاء كير',
  nodes: [
    node('start', 40, 80, 'Start', { kind: 'start' }),
    node('greet', 320, 80, 'Greeting', {
      kind: 'say',
      text: tx(
        'حياك الله في شفاء كير. أنا ريم، أساعدك تتأكد إذا الإجراء مغطى.',
        'Welcome to Shifa Care. I am Reem, and I can check whether a procedure is covered.'
      )
    }),
    node('ask_member', 620, 80, 'Member ID', {
      kind: 'ask',
      prompt: tx('ممكن رقم العضوية اللي على البطاقة، لو سمحت؟', 'What is the member ID printed on your card?'),
      saveAs: 'member_id',
      expect: 'digits',
      onNoInput: 'reprompt',
      maxRetries: 2
    }),
    node('ask_procedure', 920, 80, 'Procedure', {
      kind: 'ask',
      prompt: tx('وش الإجراء اللي تبي تتأكد منه؟ مثلاً أشعة رنين.', 'Which procedure should I check? For example, an MRI.'),
      saveAs: 'procedure',
      expect: 'free_text',
      onNoInput: 'reprompt',
      maxRetries: 1
    }),
    node('tool_coverage', 1220, 80, 'Coverage API', {
      kind: 'tool',
      name: 'check_coverage',
      args: { member_id: '{{member_id}}', procedure: '{{procedure}}' },
      saveAs: 'coverage_status'
    }),
    node('cond', 1520, 80, 'Covered?', {
      kind: 'condition',
      rules: [{ variable: 'coverage_status', op: 'eq', value: 'covered', branch: 'say_yes' }],
      elseBranch: 'transfer'
    }),
    node('say_yes', 1820, 0, 'Covered', {
      kind: 'say',
      text: tx(
        'الإجراء مغطى، وما يحتاج موافقة مسبقة. تبي أحجز لك موعد؟',
        'That procedure is covered, and no prior approval is needed. Shall I book a visit?'
      )
    }),
    node('transfer', 1820, 200, 'Human', {
      kind: 'transfer',
      queue: 'coverage_specialist',
      whisper: tx(
        'المريض يسأل عن تغطية إجراء والحالة غير واضحة.',
        'Member is asking about procedure coverage and the result is not a clear yes.'
      )
    }),
    node('end_ok', 2120, 0, 'End', {
      kind: 'end',
      text: tx('شكراً لاتصالك بشفاء كير.', 'Thank you for calling Shifa Care.')
    }),
    node('end_transfer', 2120, 200, 'End transfer', { kind: 'end' })
  ],
  edges: [
    edge('start', 'greet'),
    edge('greet', 'ask_member'),
    edge('ask_member', 'ask_procedure'),
    edge('ask_procedure', 'tool_coverage'),
    edge('tool_coverage', 'cond', 'ok'),
    edge('tool_coverage', 'transfer', 'error'),
    edge('cond', 'say_yes'),
    edge('cond', 'transfer'),
    edge('say_yes', 'end_ok'),
    edge('transfer', 'end_transfer')
  ]
};

export const NODE_KINDS: NodeKind[] = ['say', 'ask', 'condition', 'tool', 'transfer', 'end'];
