import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { ChevronsDownUp, ChevronsUpDown, ScrollText } from 'lucide-react';
import { useFlow } from '../../context/FlowContext';
import { useLinePreview } from '../../hooks/useLinePreview';
import { useI18n } from '../../i18n/I18nContext';
import { buildCallScript, type ScriptBranch } from '../../utils/callScript';
import { NODE_STYLES } from '../canvas/nodeStyles';
import { Button } from '../ui/Button';
import { ScriptTimeline } from './ScriptTimeline';
import { ScriptViewContext, isolate, stepElementId, type ScriptViewValue } from './ScriptViewContext';

const FLASH_MS = 1600;

/**
 * The call as a script: every step Reem's bot says or does, in order, with other paths folded
 * away under the step that splits them. Reads the same flow as the graph, so edits show at once.
 */
export default function CallScriptView() {
  const { t } = useI18n();
  const { flow, diagnostics, selectedIds, selectedNode, selectNode } = useFlow();
  const script = useMemo(() => buildCallScript(flow), [flow]);
  const preview = useLinePreview();
  // Only paths Reem opened or closed herself; the rest follow their default (main path open).
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(flashTimer.current), []);

  const issues = useMemo(
    () => new Set(diagnostics.map(d => d.nodeId).filter((id): id is string => Boolean(id))),
    [diagnostics]
  );
  const labels = useMemo(() => new Map(flow.nodes.map(n => [n.id, n.label])), [flow.nodes]);

  const setAll = useCallback(
    (open: boolean) => setOverrides(Object.fromEntries(script.branchKeys.map(key => [key, open]))),
    [script.branchKeys]
  );

  const jumpTo = useCallback(
    (nodeId: string) => {
      const trail = script.trails.get(nodeId) ?? [];
      setOverrides(prev => ({ ...prev, ...Object.fromEntries(trail.map(key => [key, true])) }));
      setHighlightId(nodeId);
      clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setHighlightId(null), FLASH_MS);
      // Wait for the opened paths to render before scrolling to the step.
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          document.getElementById(stepElementId(nodeId))?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        )
      );
    },
    [script.trails]
  );

  const value = useMemo<ScriptViewValue>(
    () => ({
      isOpen: (branch: ScriptBranch) => overrides[branch.key] ?? branch.primary,
      toggle: (branch: ScriptBranch) =>
        setOverrides(prev => ({ ...prev, [branch.key]: !(prev[branch.key] ?? branch.primary) })),
      selectedId: selectedIds.length === 1 ? selectedIds[0] : null,
      highlightId,
      issues,
      select: selectNode,
      jumpTo,
      labelOf: (id: string) => isolate(labels.get(id) ?? id),
      preview
    }),
    [overrides, selectedIds, highlightId, issues, selectNode, jumpTo, labels, preview]
  );

  return (
    <ScriptViewContext.Provider value={value}>
      <div
        className={clsx('flex-1 overflow-y-auto bg-surface transition-[padding] duration-300', selectedNode && 'md:pe-80')}
        role="region"
        aria-label={t('script_title')}
      >
        <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-20 sm:px-6">
          <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0 max-w-xl">
              <h1 className="flex items-center gap-2 text-lg font-semibold text-ink">
                <ScrollText className="h-5 w-5 text-brand" />
                {t('script_title')}
                <span className="truncate font-normal text-ink-3" dir="auto">· {flow.name}</span>
              </h1>
              <p className="mt-1 text-sm text-ink-2">{t('script_sub')}</p>
              {script.start && (
                <p className="mt-2 text-xs text-ink-3">
                  {t('script_stats', { steps: String(script.stepCount), endings: String(script.endingCount) })}
                </p>
              )}
            </div>
            {script.branchKeys.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setAll(true)}>
                  <ChevronsUpDown className="h-4 w-4" />
                  {t('script_expand_all')}
                </Button>
                <Button onClick={() => setAll(false)}>
                  <ChevronsDownUp className="h-4 w-4" />
                  {t('script_collapse_all')}
                </Button>
              </div>
            )}
          </header>

          {script.start ? (
            <ScriptTimeline steps={script.steps} />
          ) : (
            <div className="rounded-2xl border border-dashed border-rose-300 bg-white p-6 text-sm text-rose-700">
              {t('script_no_start')}
            </div>
          )}

          {script.unreached.length > 0 && (
            <section className="mt-12 border-t border-line pt-6">
              <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">{t('script_unreached')}</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {script.unreached.map(node => {
                  const style = NODE_STYLES[node.data.kind];
                  return (
                    <li key={node.id}>
                      <button
                        type="button"
                        onClick={() => selectNode(node.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-medium text-ink-2 hover:border-ink-3 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                      >
                        <span className={clsx('rounded-md border p-0.5', style.headerClass)}>{style.icon}</span>
                        <bdi>{node.label}</bdi>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      </div>
    </ScriptViewContext.Provider>
  );
}
