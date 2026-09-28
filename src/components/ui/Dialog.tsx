import React from 'react';
import { Dialog as RadixDialog } from 'radix-ui';
import { Button } from './Button';

interface MessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  closeLabel: string;
}

/** Small modal used for import errors instead of window.alert. */
export function MessageDialog({ open, onOpenChange, title, description, closeLabel }: MessageDialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-[2px]" />
        <RadixDialog.Content className="pop-in fixed left-1/2 top-1/2 z-50 w-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-card border border-line focus:outline-none">
          <RadixDialog.Title className="text-base font-semibold text-ink">{title}</RadixDialog.Title>
          <RadixDialog.Description className="mt-2 text-sm text-ink-2 leading-relaxed">{description}</RadixDialog.Description>
          <div className="mt-5 flex justify-end">
            <RadixDialog.Close asChild>
              <Button variant="primary">{closeLabel}</Button>
            </RadixDialog.Close>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

export const DialogRoot = RadixDialog.Root;
export type { MessageDialogProps };
export default React.memo(MessageDialog);
