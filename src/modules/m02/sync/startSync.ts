// Trigger đồng bộ (tasks T090; research R-11): khi shell khởi động, khi trang hiện lại, khi có sự kiện `online` và ngay
// sau commit terminal (requestSync). Đăng ký một lần từ src/app/App.tsx; trước đó requestSync không làm gì.
import type { LockManagerLike } from '../../../app/pwa/updateCoordinator';
import { intakeClient } from '../api/intakeClient';
import { createSyncRunner, createSyncScheduler, type SyncScheduler } from './syncRunner';

let scheduler: SyncScheduler | null = null;

function browserLocks(): LockManagerLike | undefined {
  if (typeof navigator === 'undefined' || !navigator.locks) return undefined;
  const lockManager = navigator.locks;
  return {
    request: (name, options, callback) =>
      lockManager.request(name, options, (lock) => callback(lock ? { name: lock.name, mode: lock.mode } : null)),
  };
}

export function startSync(): void {
  if (scheduler || typeof document === 'undefined') return;
  const active = createSyncScheduler({ runner: createSyncRunner({ intake: intakeClient, locks: browserLocks() }) });
  scheduler = active;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') active.request();
  });
  window.addEventListener('online', () => active.request());
  active.request();
}

/** Gọi ngay sau khi một phiên chuyển terminal (Finish, thay phiên, tự đóng). */
export function requestSync(): void {
  scheduler?.request();
}
