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
      maxRetries: 2
    }),
    node('tool_coverage', 1220, 80, 'Coverage API', {
      kind: 'tool',
      name: 'check_coverage',
      args: { member_id: '{{member_id}}', procedure: '{{procedure}}' },
      saveAs: 'coverage_status'
    }),
    node('cond', 1520, 80, 'Covered?', {
      kind: 'condition',
      rules: [{ variable: 'coverage_status', op: 'eq', value: 'covered', branch: 'ask_book' }],
      elseBranch: 'transfer'
    }),
    node('ask_book', 1820, 0, 'Book a visit?', {
      kind: 'ask',
      prompt: tx(
        'الإجراء مغطى، وما يحتاج موافقة مسبقة. تبي أحجز لك موعد؟',
        'That procedure is covered, and no prior approval is needed. Shall I book a visit?'
      ),
      saveAs: 'book_visit',
      expect: 'yes_no',
      onNoInput: 'reprompt',
      maxRetries: 2
    }),
    node('cond_book', 2120, 0, 'Book?', {
      kind: 'condition',
      rules: [
        { variable: 'book_visit', op: 'eq', value: { ar: 'نعم', en: 'yes' }, branch: 'say_booked' },
        { variable: 'book_visit', op: 'eq', value: { ar: 'لا', en: 'no' }, branch: 'say_skip' }
      ],
      elseBranch: 'say_skip'
    }),
    node('say_booked', 2420, 0, 'Booked', {
      kind: 'say',
      text: tx('تمام، بحجز لك الموعد وبنرسل التأكيد.', 'Done. I will book the visit and send the confirmation.')
    }),
    node('say_skip', 2420, 280, 'No booking', {
      kind: 'say',
      text: tx('طيب، ما بنحجز الحين. إذا احتجت شي ثاني أنا هنا.', 'Alright, I will not book now. I am here if you need anything else.')
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
    edge('cond', 'ask_book'),
    edge('cond', 'transfer'),
    edge('ask_book', 'cond_book'),
    edge('cond_book', 'say_booked'),
    edge('cond_book', 'say_skip'),
    edge('say_booked', 'end_ok'),
    edge('say_skip', 'end_ok'),
    edge('transfer', 'end_transfer')
  ]
};

export const NODE_KINDS: NodeKind[] = ['say', 'ask', 'condition', 'tool', 'transfer', 'end'];
