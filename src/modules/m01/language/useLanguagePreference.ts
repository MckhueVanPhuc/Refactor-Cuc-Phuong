// Hook đọc LanguagePreference theo thời gian thực (research R-12): `liveQuery` của Dexie + `useSyncExternalStore`.
// Một subscription dùng chung cho mọi component; Dexie báo thay đổi cả giữa các tab cùng database.
import { liveQuery, type Subscription } from 'dexie';
import { useSyncExternalStore } from 'react';
import type { LanguageCode, LanguagePreference } from '../../../shared/contracts/languagePreference';
import { readLanguagePreference } from '../storage/readers';
import { deviceLanguage, resolveDisplayLanguage } from './resolveDisplayLanguage';

/** `loading` = chưa đọc xong lần đầu (tránh hiện panel chọn ngôn ngữ thoáng qua). */
export type LanguagePreferenceState = { status: 'loading' } | { status: 'ready'; value: LanguagePreference | null };

const LOADING: LanguagePreferenceState = { status: 'loading' };

let snapshot: LanguagePreferenceState = LOADING;
let subscription: Subscription | undefined;
const listeners = new Set<() => void>();

function emit(next: LanguagePreferenceState) {
  snapshot = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  subscription ??= liveQuery(readLanguagePreference).subscribe({
    next: (value) => emit({ status: 'ready', value }),
    // Không đọc được IndexedDB: coi như chưa chọn
    error: () => emit({ status: 'ready', value: null }),
  });
  return () => {
    listeners.delete(listener);
    if (listeners.size > 0) return;
    subscription?.unsubscribe();
    subscription = undefined;
    snapshot = LOADING;
  };
}

const getSnapshot = () => snapshot;

/** Trạng thái đọc (dùng cho LanguageGate). */
export function useLanguagePreferenceState(): LanguagePreferenceState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** LanguagePreference đã lưu; chưa có (hoặc đang đọc) → `null` (bề mặt công khai cho M02). */
export function useLanguagePreference(): LanguagePreference | null {
  const state = useLanguagePreferenceState();
  return state.status === 'ready' ? state.value : null;
}

/** Ngôn ngữ hiển thị hiện tại: đã lưu, ngược lại theo thiết bị. */
export function useDisplayLanguage(): LanguageCode {
  return resolveDisplayLanguage(useLanguagePreference(), deviceLanguage());
}
