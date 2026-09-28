import { ChevronDown } from 'lucide-react';
import { Select as RadixSelect } from 'radix-ui';
import { useI18n } from '../../i18n/I18nContext';

export interface SelectOption {
  value: string;
  label: string;
}

/** Radix rejects an empty item value, so a blank choice is stored under this sentinel. */
const NONE = '__none__';

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  ariaLabel?: string;
}

export function Select({ value, onValueChange, options, placeholder, ariaLabel }: SelectProps) {
  const { dir } = useI18n();
  const items = options.map(option => ({
    value: option.value === '' ? NONE : option.value,
    label: option.label || placeholder || '—'
  }));
  const known = new Set(items.map(item => item.value));
  const current = value === '' ? NONE : value;
  if (current !== NONE && !known.has(current)) items.unshift({ value: current, label: current });

  return (
    <RadixSelect.Root
      dir={dir}
      value={current === NONE && !known.has(NONE) ? undefined : current}
      onValueChange={next => onValueChange(next === NONE ? '' : next)}
    >
      <RadixSelect.Trigger
        aria-label={ariaLabel}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-line bg-white px-3 text-start text-xs text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 data-[placeholder]:text-ink-3"
      >
        <span className="min-w-0 truncate">
          <RadixSelect.Value placeholder={placeholder} />
        </span>
        <RadixSelect.Icon className="shrink-0 text-ink-3">
          <ChevronDown className="h-3.5 w-3.5" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={6}
          className="fade-in z-50 max-h-72 w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-line bg-white shadow-card"
        >
          <RadixSelect.Viewport className="p-1">
            {items.map(item => (
              <RadixSelect.Item
                key={item.value}
                value={item.value}
                className="flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm text-ink outline-none data-[highlighted]:bg-brand data-[highlighted]:text-white"
              >
                <RadixSelect.ItemText>{item.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
