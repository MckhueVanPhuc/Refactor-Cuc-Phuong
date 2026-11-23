// Mila xác nhận lượt ghé thay toast (spec-Mascot v1.2 BR-MAS-24; specs/005 research R-26, contracts §4b).
// Host đánh dấu khi bong bóng xác nhận (050, 051, 055, 058) của một lượt ghé thật sự hiện trong slot; màn nội dung hỏi
// trạng thái để quyết định có hiện toast "Đã ghi nhận lượt quét." hay không. Không bao giờ cả hai, không bao giờ không có
// gì (SC-MAS-015). Chỉ trong bộ nhớ của lần tải trang, không lưu (BR-MAS-18).
import { useEffect, useState, useSyncExternalStore } from 'react';
import { MASCOT_CONFIRM_FALLBACK_MS } from './config';
import { isMascotEnabled } from './flag';

export type VisitConfirmation = 'pending' | 'mascot' | 'toast';

const confirmed = new Set<string>();
let failed = false;
let version = 0;
const listeners = new Set<() => void>();

function notify(): void {
  version += 1;
  for (const listener of listeners) listener();
}

/** Host: bong bóng xác nhận của lượt ghé `visitRef` đang hiện. */
export function markVisitConfirmed(visitRef: string): void {
  if (confirmed.has(visitRef)) return;
  confirmed.add(visitRef);
  notify();
}

/** Host: Mila ẩn vì lỗi (ảnh hỏng, lỗi render, lỗi engine) → màn quay về toast ngay. */
export function markMascotFailed(): void {
  if (failed) return;
  failed = true;
  notify();
}

/** Chỉ cho test. */
export function resetVisitConfirmForTest(): void {
  confirmed.clear();
  failed = false;
  notify();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getVersion = () => version;

/**
 * Ai xác nhận lượt ghé `visitRef` vừa ghi: `mascot` (bong bóng của Mila đã hiện, không toast), `toast` (cờ tắt, Mila
 * lỗi, hoặc quá `MASCOT_CONFIRM_FALLBACK_MS` chưa có bong bóng — giữ toast dù bong bóng tới muộn), `pending` (đang chờ).
 */
export function useMascotConfirms(visitRef: string | null): VisitConfirmation {
  const current = useSyncExternalStore(subscribe, getVersion, getVersion);
  const enabled = isMascotEnabled();
  const [late, setLate] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || visitRef === null || failed || confirmed.has(visitRef)) return undefined;
    const id = window.setTimeout(() => {
      if (!confirmed.has(visitRef)) setLate(visitRef);
    }, MASCOT_CONFIRM_FALLBACK_MS);
    return () => window.clearTimeout(id);
  }, [enabled, visitRef, current]);

  if (!enabled || visitRef === null) return 'toast';
  if (late === visitRef) return 'toast';
  if (confirmed.has(visitRef)) return 'mascot';
  if (failed) return 'toast';
  return 'pending';
}
