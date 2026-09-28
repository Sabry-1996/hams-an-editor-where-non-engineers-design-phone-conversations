import React from 'react';
import { useI18n } from '../../i18n/I18nContext';
import type { ToolBehavior } from '../../types/simulator';

interface ToolBehaviorSelectorProps {
  value: ToolBehavior;
  onChange: (value: ToolBehavior) => void;
}

const OPTIONS: Array<{ value: ToolBehavior; activeClass: string }> = [
  { value: 'ok', activeClass: 'bg-emerald-600 text-white border-emerald-600' },
  { value: 'slow', activeClass: 'bg-amber-500 text-white border-amber-500' },
  { value: 'error', activeClass: 'bg-rose-600 text-white border-rose-600' }
];

export const ToolBehaviorSelector = React.memo(function ToolBehaviorSelector({ value, onChange }: ToolBehaviorSelectorProps) {
  const { t } = useI18n();
  return (
    <div>
      <p className="text-xs font-medium text-ink-2 mb-1">{t('tool_behavior')}</p>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t('tool_behavior')}>
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={value === opt.value}
            onClick={() => onChange(opt.value)}
            className={`h-9 rounded-xl text-xs font-semibold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
              value === opt.value ? opt.activeClass : 'bg-white text-ink-2 border-line hover:bg-surface'
            }`}
          >
            {t(opt.value)}
          </button>
        ))}
      </div>
    </div>
  );
});
