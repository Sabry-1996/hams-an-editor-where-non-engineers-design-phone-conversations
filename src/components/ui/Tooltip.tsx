import React from 'react';
import { Tooltip as RadixTooltip } from 'radix-ui';

export const TooltipProvider = ({ children }: { children: React.ReactNode }) => (
  <RadixTooltip.Provider delayDuration={250} skipDelayDuration={400}>{children}</RadixTooltip.Provider>
);

interface TooltipProps {
  label: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  children: React.ReactElement;
}

export function Tooltip({ label, side = 'right', children }: TooltipProps) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={8}
          className="pop-in z-50 rounded-md bg-ink px-2.5 py-1.5 text-xs text-white shadow-lg"
        >
          {label}
          <RadixTooltip.Arrow className="fill-ink" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
