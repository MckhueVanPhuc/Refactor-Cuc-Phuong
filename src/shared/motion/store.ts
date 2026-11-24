// Công tắc "Hiệu ứng chuyển động" cho Mila và hiệu ứng trang trí (spec-Mascot v1.4 BR-MAS-17, 21; specs/006 R-02;
// chuyển từ src/shared/mascot/motion.ts). Trạng thái chỉ ở bộ
// nhớ của lần tải trang, không lưu (BR-MAS-18). Thiết bị yêu cầu giảm chuyển động → bắt đầu ở "tắt".
import { useSyncExternalStore } from 'react';
import { emitMascotEvent } from '../mascot/events';

let value: boolean | null = null;
const listeners = new Set<() => void>();

function initialMotion(): boolean {
  try {
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return true;
  }
}

export function getMotion(): boolean {
  if (value === null) value = initialMotion();
  return value;
}

/** Đổi trạng thái; báo cho engine qua bus để dừng / chạy lại lịch cử chỉ. */
export function setMotion(on: boolean): void {
  if (getMotion() === on) return;
  value = on;
  for (const listener of listeners) listener();
  emitMascotEvent({ type: 'mascot.motion.changed', on });
}

export function subscribeMotion(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useMotion(): boolean {
  return useSyncExternalStore(subscribeMotion, getMotion, getMotion);
}

/** Chỉ test dùng. */
export function resetMotionForTest(): void {
  value = null;
  listeners.clear();
}
