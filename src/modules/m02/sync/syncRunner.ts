// Đồng bộ phiên terminal (tasks T090; session-sync-record-contract §3; research R-11; FR-M02-018; BR-M02-010, 011).
// Runner: một lượt gửi tuần tự các mục `PENDING` dưới Web Lock `cpq:m02:sync` (exclusive, `ifAvailable`) — nên hai tab
// không bao giờ gửi cùng lúc. Scheduler: chạy ngay khi có trigger; còn mục chờ thì thử lại 30 s → 1 → 2 → 5 phút (giữ
// 5 phút), chỉ khi trang đang hiện. Không có background sync sau khi đóng trình duyệt (constitution VI).
import type { LockManagerLike } from '../../../app/pwa/updateCoordinator';
import type { IntakeClient } from '../api/intakeClient';
import { SYNC_RETRY_DELAYS_MS } from '../config/limits';
import { getPendingSyncItems, updateSyncStatus } from '../storage/updateSyncStatus';

export const SYNC_LOCK = 'cpq:m02:sync';

/** `DONE` = không còn mục chờ; `RETRY` = còn mục giữ `PENDING`; `BUSY` = tab khác đang giữ lock. */
export type SyncRunResult = 'DONE' | 'RETRY' | 'BUSY';

export type SyncRunner = { run(): Promise<SyncRunResult> };

export function createSyncRunner({ intake, locks }: { intake: IntakeClient; locks: LockManagerLike | undefined }): SyncRunner {
  let running: Promise<SyncRunResult> | null = null;

  async function sendAll(): Promise<SyncRunResult> {
    for (const item of await getPendingSyncItems()) {
      const outcome = await intake.send(item.record);
      // Mạng hay server lỗi: dừng lượt này, các mục còn lại gửi ở lượt thử lại
      if (outcome === 'KEEP_PENDING') return 'RETRY';
      await updateSyncStatus(item.sessionId, outcome);
    }
    return 'DONE';
  }

  return {
    run() {
      // Trong cùng tab: một lượt tại một thời điểm
      running ??= (
        locks
          ? locks.request(SYNC_LOCK, { mode: 'exclusive', ifAvailable: true }, (lock) => (lock ? sendAll() : ('BUSY' as const)))
          : sendAll()
      ).finally(() => {
        running = null;
      });
      return running;
    },
  };
}

export type SyncScheduler = { request(): void; stop(): void };

export function createSyncScheduler({
  runner,
  isVisible = () => typeof document === 'undefined' || document.visibilityState === 'visible',
  delays = SYNC_RETRY_DELAYS_MS,
}: {
  runner: SyncRunner;
  isVisible?: () => boolean;
  delays?: readonly number[];
}): SyncScheduler {
  let attempt = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;

  async function tick() {
    const result = await runner.run().catch((): SyncRunResult => 'RETRY');
    if (stopped) return;
    if (result === 'DONE') {
      attempt = 0;
      return;
    }
    // Chỉ thử lại khi trang đang hiện; trang hiện lại là một trigger riêng
    if (!isVisible()) return;
    const delay = delays[Math.min(attempt, delays.length - 1)]!;
    attempt += 1;
    timer = setTimeout(() => void tick(), delay);
  }

  return {
    /** Trigger (khởi động, trang hiện lại, `online`, sau commit terminal): chạy ngay, giãn cách bắt đầu lại từ 30 s. */
    request() {
      if (stopped) return;
      clearTimeout(timer);
      attempt = 0;
      void tick();
    },
    stop() {
      stopped = true;
      clearTimeout(timer);
    },
  };
}
