import React from 'react';
import clsx from 'clsx';
import {
  ArrowDown,
  ChevronDown,
  CircleCheck,
  CornerDownRight,
  GitMerge,
  PhoneOff,
  Share2,
  TriangleAlert
} from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import type { MessageKey } from '../../i18n/messages';
import type { FlowNode, LocalizedText, NodeKind, UiLang } from '../../types/flow';
import type { BranchCondition, BranchOutcome, ScriptBranch, ScriptStep } from '../../utils/callScript';
import { NODE_STYLES } from '../canvas/nodeStyles';
import { ScriptLine, WithPlaceholders } from './ScriptLine';
import { isolate, stepElementId, useScriptView } from './ScriptViewContext';

type Translate = (key: MessageKey, params?: Record<string, string>) => string;

const TITLE: Record<NodeKind, { key: MessageKey; className: string }> = {
  start: { key: 'script_caller_dials', className: 'text-emerald-700' },
  say: { key: 'script_says', className: 'text-brand' },
  ask: { key: 'script_asks', className: 'text-sky-700' },
  tool: { key: 'script_checks', className: 'text-violet-700' },
  condition: { key: 'script_decides', className: 'text-amber-700' },
  transfer: { key: 'transfer', className: 'text-rose-700' },
  end: { key: 'script_ends', className: 'text-ink-2' }
};

const TONE: Record<BranchCondition['type'], { border: string; dot: string }> = {
  ok: { border: 'border-emerald-200', dot: 'bg-emerald-500' },
  error: { border: 'border-rose-200', dot: 'bg-rose-500' },
  rule: { border: 'border-amber-200', dot: 'bg-amber-500' },
  else: { border: 'border-line', dot: 'bg-ink-3' }
};

function ruleValueText(value: string | LocalizedText | undefined, lang: UiLang): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return lang === 'ar' ? value.ar || value.en : value.en || value.ar;
}

export function describeConditions(conditions: BranchCondition[], t: Translate, lang: UiLang): string {
  return conditions
    .map(condition => {
      if (condition.type === 'ok') return t('branch_ok');
      if (condition.type === 'error') return t('branch_error');
      if (condition.type === 'else') return t('branch_else');
      const { rule } = condition;
      return t(`rule_${rule.op}` as MessageKey, {
        variable: isolate(rule.variable || '?'),
        value: isolate(ruleValueText(rule.value, lang))
      });
    })
    .join(` ${t('branch_or')} `);
}

const Chip = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium', className)}>{children}</span>
);

const Variable = ({ name }: { name: string }) => (
  <code className="rounded bg-brand-soft px-1 font-mono text-[11px] text-brand" dir="ltr">{`{{${name}}}`}</code>
);

function OutcomeChip({ outcome }: { outcome: BranchOutcome }) {
  const { t } = useI18n();
  const { labelOf } = useScriptView();
  switch (outcome.type) {
    case 'end':
      return <Chip className="bg-surface text-ink-2 border border-line"><PhoneOff className="h-3 w-3" />{t('outcome_end')}</Chip>;
    case 'transfer':
      return <Chip className="bg-rose-50 text-rose-700"><Share2 className="h-3 w-3" />{t('outcome_transfer')}</Chip>;
    case 'rejoin':
      return <Chip className="bg-brand-soft text-brand"><GitMerge className="h-3 w-3" />{t('outcome_rejoin', { label: labelOf(outcome.nodeId) })}</Chip>;
    case 'goto':
      return <Chip className="bg-sky-50 text-sky-700"><CornerDownRight className="h-3 w-3 rtl:-scale-x-100" />{t('outcome_goto', { label: labelOf(outcome.nodeId) })}</Chip>;
    case 'dead_end':
      return <Chip className="bg-rose-100 text-rose-700"><TriangleAlert className="h-3 w-3" />{t('outcome_dead_end')}</Chip>;
  }
}

function StepDetails({ node }: { node: FlowNode }) {
  const { t } = useI18n();
  const d = node.data;
  switch (d.kind) {
    case 'say':
      return <ScriptLine lineKey={node.id} text={d.text} />;
    case 'ask':
      return (
        <>
          <ScriptLine lineKey={node.id} text={d.prompt} />
          <div className="flex flex-wrap items-center gap-2">
            <Chip className="bg-sky-50 text-sky-700">{t('expect')}: {t(`expect_${d.expect}` as MessageKey)}</Chip>
            {d.saveAs && <Chip className="bg-surface text-ink-2 border border-line">{t('script_saves')} <Variable name={d.saveAs} /></Chip>}
            <Chip className="bg-surface text-ink-2 border border-line">
              {t('script_silence', {
                action: t(d.onNoInput === 'transfer' ? 'transfer_action' : 'reprompt'),
                count: String(d.maxRetries)
              })}
            </Chip>
          </div>
        </>
      );
    case 'tool': {
      const args = Object.entries(d.args);
      return (
        <>
          <div className="rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2 font-mono text-xs text-violet-800" dir="ltr">
            {d.name}({args.map(([name]) => name).join(', ')})
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {args.length > 0 && (
              <Chip className="bg-surface text-ink-2 border border-line">
                {t('script_sends')}
                {args.map(([name, value]) => (
                  <span key={name} className="font-mono text-[11px]" dir="ltr">
                    {name} ← <WithPlaceholders text={value} />
                  </span>
                ))}
              </Chip>
            )}
            {d.saveAs && <Chip className="bg-surface text-ink-2 border border-line">{t('script_saves_result')} <Variable name={d.saveAs} /></Chip>}
          </div>
        </>
      );
    }
    case 'transfer':
      return (
        <>
          <Chip className="bg-rose-50 text-rose-700"><Share2 className="h-3 w-3" />{t('script_transfers', { queue: d.queue })}</Chip>
          {d.whisper && (d.whisper.ar.trim() || d.whisper.en.trim()) && (
            <ScriptLine lineKey={node.id} text={d.whisper} caption={t('whisper')} />
          )}
        </>
      );
    case 'end':
      return d.text && (d.text.ar.trim() || d.text.en.trim()) ? <ScriptLine lineKey={node.id} text={d.text} /> : null;
    default:
      return null;
  }
}

function StepCard({ step }: { step: Extract<ScriptStep, { type: 'node' }> }) {
  const { t } = useI18n();
  const { selectedId, highlightId, issues, select } = useScriptView();
  const { node } = step;
  const kind = node.data.kind;
  const title = TITLE[kind];
  const selected = selectedId === node.id;
  const flash = highlightId === node.id;
  const details = <StepDetails node={node} />;
  const alwaysSame = kind === 'condition' && step.branches.length === 0;

  return (
    <div
      id={stepElementId(node.id)}
      onClick={() => select(node.id)}
      className={clsx(
        'scroll-mt-24 cursor-pointer rounded-2xl border bg-white shadow-card transition-[border-color,box-shadow]',
        flash
          ? 'border-amber-400 ring-4 ring-amber-200'
          : selected
            ? 'border-brand ring-4 ring-brand/15'
            : issues.has(node.id)
              ? 'border-rose-300 hover:border-rose-400'
              : 'border-line hover:border-ink-3'
      )}
    >
      <div className="flex items-start justify-between gap-3 px-4 pt-3">
        <div className="min-w-0">
          <p className={clsx('text-[11px] font-semibold uppercase tracking-wide', title.className)}>{t(title.key)}</p>
          <button
            type="button"
            onClick={event => {
              event.stopPropagation();
              select(node.id);
            }}
            aria-pressed={selected}
            className="max-w-full truncate rounded text-start text-sm font-semibold text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <bdi>{node.label}</bdi>
          </button>
        </div>
        {issues.has(node.id) && (
          <span
            className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 text-[11px] font-bold text-white"
            title={t('level_error')}
            aria-label={t('level_error')}
          >
            !
          </span>
        )}
      </div>
      <div className="space-y-3 px-4 pb-4 pt-2 empty:pb-2">
        {details}
        {alwaysSame && <p className="text-xs text-ink-3">{t('script_always')}</p>}
      </div>
    </div>
  );
}

function BranchRow({ branch }: { branch: ScriptBranch }) {
  const { t, lang } = useI18n();
  const { isOpen, toggle, labelOf, jumpTo } = useScriptView();
  const tone = TONE[branch.conditions[0].type];
  const text = describeConditions(branch.conditions, t, lang);
  const panelId = `script-branch-${branch.key}`;

  if (branch.inline) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-xs">
        <CircleCheck className="h-4 w-4 text-emerald-600" />
        <span className="font-semibold text-ink" dir="auto">{text}</span>
        <span className="ms-auto inline-flex items-center gap-1 font-medium text-emerald-700">
          {t('branch_main')}
          <ArrowDown className="h-3.5 w-3.5" />
        </span>
      </div>
    );
  }

  // A path with nothing of its own to read: say where it goes instead of opening an empty panel.
  const only = branch.steps.length === 1 ? branch.steps[0] : undefined;
  const directTo =
    branch.steps.length === 0 && branch.outcome.type === 'rejoin'
      ? { text: t('script_skip', { label: labelOf(branch.outcome.nodeId) }), id: branch.outcome.nodeId }
      : only?.type === 'goto'
        ? { text: t('script_goto', { label: labelOf(only.targetId) }), id: only.targetId }
        : undefined;
  if (directTo) {
    return (
      <div className={clsx('flex flex-wrap items-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs', tone.border)}>
        <span className={clsx('h-2 w-2 rounded-full', tone.dot)} />
        <span className="font-semibold text-ink" dir="auto">{text}</span>
        <span className="text-ink-2">{directTo.text}</span>
        <button
          type="button"
          onClick={() => jumpTo(directTo.id)}
          className="ms-auto rounded font-semibold text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          {t('script_goto_show')}
        </button>
      </div>
    );
  }

  const open = isOpen(branch);
  const count = branch.steps.filter(s => s.type === 'node').length;
  return (
    <div className={clsx('rounded-xl border bg-white', tone.border)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => toggle(branch)}
        className="flex w-full flex-wrap items-center gap-2 rounded-xl px-3 py-2.5 text-start text-xs hover:bg-surface/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <ChevronDown className={clsx('h-4 w-4 shrink-0 text-ink-3 transition-transform', !open && '-rotate-90 rtl:rotate-90')} />
        <span className={clsx('h-2 w-2 shrink-0 rounded-full', tone.dot)} />
        <span className="min-w-0 flex-1 font-semibold text-ink" dir="auto">{text}</span>
        {count > 0 && (
          <span className="text-ink-3">{count === 1 ? t('branch_step_one') : t('branch_steps', { count: String(count) })}</span>
        )}
        <OutcomeChip outcome={branch.outcome} />
      </button>
      {open && (
        <div id={panelId} className="content-in border-t border-line-soft px-3 pb-3 pt-4">
          <ScriptTimeline steps={branch.steps} />
        </div>
      )}
    </div>
  );
}

function Marker({ step }: { step: ScriptStep }) {
  if (step.type === 'node') {
    const style = NODE_STYLES[step.node.data.kind];
    return (
      <span className={clsx('absolute start-0 top-2 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white shadow-sm ring-1 ring-line', style.headerClass)}>
        {style.icon}
      </span>
    );
  }
  const danger = step.type === 'dead_end';
  return (
    <span
      className={clsx(
        'absolute start-2.5 top-2 flex h-5 w-5 items-center justify-center rounded-full border border-dashed bg-white',
        danger ? 'border-rose-400 text-rose-500' : 'border-ink-3 text-ink-3'
      )}
    >
      {danger ? <TriangleAlert className="h-3 w-3" /> : <CornerDownRight className="h-3 w-3 rtl:-scale-x-100" />}
    </span>
  );
}

function TimelineItem({ step, last }: { step: ScriptStep; last: boolean }) {
  const { t } = useI18n();
  const { labelOf, jumpTo } = useScriptView();

  let body: React.ReactNode;
  if (step.type === 'goto') {
    body = (
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-line bg-white px-3 py-2 text-xs text-ink-2">
        {t('script_goto', { label: labelOf(step.targetId) })}
        <button
          type="button"
          onClick={() => jumpTo(step.targetId)}
          className="rounded font-semibold text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          {t('script_goto_show')}
        </button>
      </div>
    );
  } else if (step.type === 'dead_end') {
    body = (
      <div className="rounded-xl border border-dashed border-rose-300 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
        {t('no_outputs')}
      </div>
    );
  } else if (step.node.data.kind === 'start') {
    body = (
      <div id={stepElementId(step.node.id)} className="flex min-h-14 items-center text-sm font-semibold text-emerald-700">
        {t('script_caller_dials')}
      </div>
    );
  } else {
    body = (
      <>
        <StepCard step={step} />
        {step.branches.length > 0 && (
          <div className="mt-3 space-y-2">
            {step.branches.map(branch => (
              <BranchRow key={branch.key} branch={branch} />
            ))}
          </div>
        )}
        {step.rejoinsAt && (
          <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-ink-3">
            <GitMerge className="h-3.5 w-3.5" />
            {t('script_rejoin')}
            <span className="h-px flex-1 bg-line" />
          </div>
        )}
      </>
    );
  }

  return (
    <li className={clsx('relative ps-14', !last && 'pb-6')}>
      {!last && <span aria-hidden="true" className="absolute start-5 top-4 bottom-0 w-px -translate-x-1/2 bg-line rtl:translate-x-1/2" />}
      <Marker step={step} />
      {body}
    </li>
  );
}

/** Vertical timeline of script steps; paths nest a timeline of their own. */
export function ScriptTimeline({ steps }: { steps: ScriptStep[] }) {
  return (
    <ol className="relative">
      {steps.map((step, index) => (
        <TimelineItem key={step.key} step={step} last={index === steps.length - 1} />
      ))}
    </ol>
  );
}
