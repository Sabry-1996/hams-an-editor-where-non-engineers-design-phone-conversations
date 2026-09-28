import React from 'react';
import { useI18n } from '../../i18n/I18nContext';
import type { SimVariables } from '../../types/simulator';

export const LiveStatePanel = React.memo(function LiveStatePanel({ variables }: { variables: SimVariables }) {
  const { t } = useI18n();
  const entries = Object.entries(variables);
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex-1">
      <h2 className="text-xs font-bold text-slate-400 mb-3">{t('live_state')}</h2>
      {entries.length === 0 ? (
        <p className="text-xs text-slate-500">{t('upstream_empty')}</p>
      ) : (
        <dl className="space-y-2">
          {entries.map(([name, value]) => (
            <div key={name} className="flex items-center justify-between gap-3 text-xs bg-slate-950 rounded-lg px-3 py-2">
              <dt className="font-mono text-teal-300">{name}</dt>
              <dd className="text-slate-200">{String(value)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
});
