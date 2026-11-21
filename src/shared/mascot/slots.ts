// Registry slot của Mila (specs/005 research R-07): màn khai báo chỗ Mila được hiện; host portal vào đó.
import { useSyncExternalStore } from 'react';
import type { CtaId } from './events';
import type { Mode } from './types';

export type SlotEntry = { id: string; modes: readonly Mode[]; element: HTMLElement; onCta?: ((cta: CtaId) => void) | undefined };

let entries: readonly SlotEntry[] = [];
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of [...listeners]) listener();
}

export function registerSlot(entry: SlotEntry): () => void {
  entries = [...entries.filter((e) => e.element !== entry.element), entry];
  notify();
  return () => {
    entries = entries.filter((e) => e !== entry);
    notify();
  };
}

export function getSlots(): readonly SlotEntry[] {
  return entries;
}

export function subscribeSlots(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSlots(): readonly SlotEntry[] {
  return useSyncExternalStore(subscribeSlots, getSlots, getSlots);
}
