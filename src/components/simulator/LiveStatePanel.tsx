import React from 'react';
import { useI18n } from '../../i18n/I18nContext';
import type { SimVariables } from '../../types/simulator';
import { cardClass } from '../ui/Field';

export const LiveStatePanel = React.memo(function LiveStatePanel({ variables }: { variables: SimVariables }) {
  const { t } = useI18n();
  const entries = Object.entries(variables);
  return (
    <div className={`${cardClass} p-5 flex-1`}>
      <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-3 mb-3">{t('live_state')}</h2>
      {entries.length === 0 ? (
        <p className="text-xs text-ink-3">{t('upstream_empty')}</p>
      ) : (
        <dl className="space-y-2">
          {entries.map(([name, value]) => (
            <div key={name} className="flex items-center justify-between gap-3 text-xs bg-surface border border-line rounded-lg px-3 py-2">
              <dt className="font-mono text-brand">{name}</dt>
              <dd className="text-ink">{String(value)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
});
