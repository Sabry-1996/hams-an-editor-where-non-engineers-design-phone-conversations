import { Settings, Trash2 } from 'lucide-react';
import { useFlow } from '../../context/FlowContext';
import { useI18n } from '../../i18n/I18nContext';
import type { CompareOp, ConditionRule, ExpectKind, LocalizedText, NoInputAction } from '../../types/flow';
import type { MessageKey } from '../../i18n/messages';
import { Field, inputClass } from '../ui/Field';
import { LocalizedFields, SuggestText } from './inspector/LocalizedFields';

const OPS: CompareOp[] = ['eq', 'neq', 'gt', 'lt', 'exists'];
const EXPECTS: Array<{ value: ExpectKind; key: MessageKey }> = [
  { value: 'digits', key: 'expect_digits' },
  { value: 'yes_no', key: 'expect_yes_no' },
  { value: 'date', key: 'expect_date' },
  { value: 'free_text', key: 'expect_free_text' }
];

export function NodeInspector() {
  const { t } = useI18n();
  const { flow, selectedNode, renameNode, setNodeData, deleteSelected, disconnect, upstreamVariablesOf } = useFlow();
  if (!selectedNode) return null;
  const node = selectedNode;
  const data = node.data;
  const variables = upstreamVariablesOf(node.id);
  const edges = flow.edges.filter(edge => edge.from === node.id);
  const others = flow.nodes.filter(item => item.id !== node.id);

  const setText = (text: LocalizedText) => {
    if (data.kind === 'say') setNodeData(node.id, { ...data, text });
    if (data.kind === 'ask') setNodeData(node.id, { ...data, prompt: text });
    if (data.kind === 'transfer') setNodeData(node.id, { ...data, whisper: text });
    if (data.kind === 'end') setNodeData(node.id, { ...data, text });
  };

  const updateRule = (index: number, patch: Partial<ConditionRule>) => {
    if (data.kind !== 'condition') return;
    const rules = data.rules.map((rule, i) => (i === index ? { ...rule, ...patch } : rule));
    setNodeData(node.id, { ...data, rules });
  };

  return (
    <aside className="w-80 bg-slate-900 border-s border-slate-800 p-5 flex flex-col gap-4 z-20 overflow-y-auto" aria-label={t('inspector')}>
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-teal-400" />
          <h2 className="text-sm font-bold text-slate-200">{t('inspector')}</h2>
        </div>
        <button type="button" onClick={deleteSelected} className="p-1.5 text-rose-400 hover:bg-rose-950/40 rounded-lg" aria-label={t('delete_node')}>
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <Field label={t('node_label')}>
        <input className={inputClass} value={node.label} onChange={e => renameNode(node.id, e.target.value)} />
      </Field>
      <Field label={t('node_id')}>
        <input className={`${inputClass} font-mono text-slate-500`} readOnly value={node.id} />
      </Field>

      {(data.kind === 'say' || data.kind === 'ask') && (
        <LocalizedFields text={data.kind === 'say' ? data.text : data.prompt} variables={variables} onChange={setText} />
      )}
      {data.kind === 'end' && (
        <LocalizedFields text={data.text ?? { ar: '', en: '' }} variables={variables} onChange={setText} />
      )}
      {data.kind === 'transfer' && (
        <>
          <Field label={t('queue')}>
            <input className={inputClass} value={data.queue} onChange={e => setNodeData(node.id, { ...data, queue: e.target.value })} />
          </Field>
          <p className="text-xs text-slate-400">{t('whisper')}</p>
          <LocalizedFields text={data.whisper ?? { ar: '', en: '' }} variables={variables} onChange={setText} />
        </>
      )}

      {data.kind === 'ask' && (
        <>
          <Field label={t('save_as')}>
            <input className={`${inputClass} font-mono`} value={data.saveAs} onChange={e => setNodeData(node.id, { ...data, saveAs: e.target.value.trim() })} />
          </Field>
          <Field label={t('expect')}>
            <select className={inputClass} value={data.expect} onChange={e => setNodeData(node.id, { ...data, expect: e.target.value as ExpectKind })}>
              {EXPECTS.map(item => <option key={item.value} value={item.value}>{t(item.key)}</option>)}
            </select>
          </Field>
          <Field label={t('on_no_input')}>
            <select className={inputClass} value={data.onNoInput} onChange={e => setNodeData(node.id, { ...data, onNoInput: e.target.value as NoInputAction })}>
              <option value="reprompt">{t('reprompt')}</option>
              <option value="transfer">{t('transfer_action')}</option>
            </select>
          </Field>
          <Field label={t('max_retries')}>
            <input type="number" min={1} className={inputClass} value={data.maxRetries} onChange={e => setNodeData(node.id, { ...data, maxRetries: Number(e.target.value) })} />
          </Field>
        </>
      )}

      {data.kind === 'tool' && (
        <>
          <Field label={t('tool_name')}>
            <input className={inputClass} value={data.name} onChange={e => setNodeData(node.id, { ...data, name: e.target.value })} />
          </Field>
          <Field label={t('tool_save')}>
            <input className={`${inputClass} font-mono`} value={data.saveAs} onChange={e => setNodeData(node.id, { ...data, saveAs: e.target.value.trim() })} />
          </Field>
          <p className="text-xs text-slate-400">{t('tool_args')}</p>
          {Object.entries(data.args).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <div className="flex gap-2">
                <input className={`${inputClass} font-mono`} value={key} readOnly />
                <button type="button" className="text-xs text-rose-300" onClick={() => {
                  const args = { ...data.args };
                  delete args[key];
                  setNodeData(node.id, { ...data, args });
                }}>{t('remove')}</button>
              </div>
              <SuggestText dir="ltr" value={value} variables={variables} onChange={next => setNodeData(node.id, { ...data, args: { ...data.args, [key]: next } })} />
            </div>
          ))}
          <button type="button" className="text-xs text-teal-300" onClick={() => setNodeData(node.id, { ...data, args: { ...data.args, [`arg_${Object.keys(data.args).length + 1}`]: '' } })}>
            {t('add_rule')}
          </button>
        </>
      )}

      {data.kind === 'condition' && (
        <>
          <p className="text-xs text-slate-400">{t('rules')}</p>
          {data.rules.map((rule, index) => (
            <div key={index} className="space-y-2 border border-slate-800 rounded-lg p-2">
              <input className={`${inputClass} font-mono`} placeholder={t('variable')} value={rule.variable} onChange={e => updateRule(index, { variable: e.target.value.trim() })} list={`vars-${node.id}`} />
              <select className={inputClass} value={rule.op} onChange={e => updateRule(index, { op: e.target.value as CompareOp })}>
                {OPS.map(op => <option key={op} value={op}>{op}</option>)}
              </select>
              {rule.op !== 'exists' && (
                <input className={inputClass} placeholder={t('value')} value={rule.value ?? ''} onChange={e => updateRule(index, { value: e.target.value })} />
              )}
              <select className={inputClass} value={rule.branch} onChange={e => updateRule(index, { branch: e.target.value })}>
                <option value="">{t('else_branch')}</option>
                {others.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
              <button type="button" className="text-xs text-rose-300" onClick={() => setNodeData(node.id, { ...data, rules: data.rules.filter((_, i) => i !== index) })}>{t('remove')}</button>
            </div>
          ))}
          <button type="button" className="text-xs text-teal-300" onClick={() => setNodeData(node.id, { ...data, rules: [...data.rules, { variable: variables[0] ?? '', op: 'eq', value: '', branch: '' }] })}>
            {t('add_rule')}
          </button>
          <Field label={t('else_branch')}>
            <select className={inputClass} value={data.elseBranch} onChange={e => setNodeData(node.id, { ...data, elseBranch: e.target.value })}>
              <option value="" />
              {others.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </Field>
          <datalist id={`vars-${node.id}`}>
            {variables.map(name => <option key={name} value={name} />)}
          </datalist>
        </>
      )}

      <div>
        <p className="text-xs text-slate-400 mb-1">{t('upstream')}</p>
        {variables.length === 0 ? (
          <p className="text-[11px] text-slate-500">{t('upstream_empty')}</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {variables.map(name => <span key={name} className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 text-teal-300">{name}</span>)}
          </div>
        )}
      </div>

      <div>
        <p className="text-xs text-slate-400 mb-1">{t('outputs')}</p>
        {edges.length === 0 ? <p className="text-[11px] text-slate-500">{t('no_outputs')}</p> : (
          <ul className="space-y-1">
            {edges.map(edge => {
              const target = flow.nodes.find(item => item.id === edge.to);
              return (
                <li key={edge.id} className="flex items-center justify-between gap-2 text-xs bg-slate-950 rounded px-2 py-1">
                  <span>{edge.branch ? `${edge.branch} → ` : ''}{target?.label ?? edge.to}</span>
                  <button type="button" className="text-rose-300" onClick={() => disconnect(edge.id)}>{t('remove')}</button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
