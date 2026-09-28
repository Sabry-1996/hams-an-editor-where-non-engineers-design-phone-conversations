import React from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  active?: boolean;
}

const VARIANT: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark shadow-[0_0_0_1px_rgba(49,50,169,0.4)]',
  secondary: 'bg-white text-ink border border-line hover:bg-surface',
  ghost: 'text-ink-2 hover:bg-surface hover:text-ink',
  danger: 'text-rose-600 hover:bg-rose-50'
};

const SIZE: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  icon: 'h-9 w-9'
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'sm', active, className, type = 'button', ...rest }, ref
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-pressed={active}
      className={clsx(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
        'disabled:opacity-40 disabled:pointer-events-none',
        active ? 'bg-brand text-white hover:bg-brand-dark' : VARIANT[variant],
        SIZE[size],
        className
      )}
      {...rest}
    />
  );
});
