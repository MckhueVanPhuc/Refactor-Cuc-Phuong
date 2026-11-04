// Đồng bộ phiên terminal (tasks T085; BR-M02-010, 011; FR-M02-018; SC-M02-006; research R-11).
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LockLike, LockManagerLike } from '../../../app/pwa/updateCoordinator';
import type { SessionSyncRecord } from '../../../shared/contracts/sessionSyncRecord';
import type { IntakeClient, IntakeOutcome } from '../api/intakeClient';
import { CHECKPOINTS, ROUTE_A } from '../api/fake/fixtures';
import { pendingSyncItemsTable, playSessionsTable } from '../storage/tables';
import { createSyncRunner, createSyncScheduler, SYNC_LOCK, type SyncRunner } from './syncRunner';

const uuid = (n: number) => `5b1e2d3c-4a5f-4e6d-8c7b-9a0f1e2d3c${String(n).padStart(2, '0')}`;

function record(n: number): SessionSyncRecord {
  return {
    sessionId: uuid(n),
    routeId: ROUTE_A,
    contentVersion: 3,
    startedAt: '2026-11-04T02:00:00.000Z',
    endedAt: `2026-11-04T0${3 + n}:00:00.000Z`,
    status: 'HOAN_TAT',
    visitedCheckpoints: [{ checkpointId: 'C3', checkpointName: 'Động Người Xưa', sequence: 5, checkedInAt: '2026-11-04T02:30:00.000Z' }],
  };
}

async function seed(n: number, syncStatus: 'PENDING' | 'SYNCED' | 'CONFLICT' = 'PENDING') {
  await pendingSyncItemsTable.add({ sessionId: uuid(n), record: record(n), syncStatus });
}

/** Intake giả: kết quả theo sessionId (mặc định SYNCED); ghi lại các bản ghi đã gửi. */
function fakeIntake(outcomes: Record<string, IntakeOutcome[]> = {}) {
  const sent: SessionSyncRecord[] = [];
  const intake: IntakeClient = {
    async send(r) {
      sent.push(structuredClone(r));
      return outcomes[r.sessionId]?.shift() ?? 'SYNCED';
    },
  };
  return { intake, sent };
}

/** LockManager giả cùng ngữ nghĩa exclusive + ifAvailable của Web Locks. */
function fakeLocks(): LockManagerLike & { requests: string[] } {
  const held = new Set<string>();
  return {
    requests: [],
    async request(name, options, callback) {
      this.requests.push(`${name}:${options.mode}:${options.ifAvailable ? 'ifAvailable' : 'wait'}`);
      if (held.has(name)) return callback(null);
      held.add(name);
      try {
        return await callback({ name, mode: options.mode } as LockLike);
      } finally {
        held.delete(name);
      }
    },
  };
}

const statuses = async () => Object.fromEntries((await pendingSyncItemsTable.toArray()).map((i) => [i.sessionId, i.syncStatus]));

afterEach(() => {
  vi.useRealTimers();
});

describe('syncRunner', () => {
  it('chỉ gửi mục PENDING, tuần tự theo thứ tự kết thúc; không gửi SYNCED, CONFLICT hay phiên đang chạy', async () => {
    await seed(2);
    await seed(1);
    await seed(3, 'SYNCED');
    await seed(4, 'CONFLICT');
    await playSessionsTable.add({
      sessionId: uuid(9),
      sourceHandoffId: uuid(19),
      routeId: ROUTE_A,
      contentVersion: 3,
      journeyCheckpoints: structuredClone([...CHECKPOINTS]),
      status: 'DANG_DIEN_RA',
      startedAt: '2026-11-04T02:00:00.000Z',
    });
    const { intake, sent } = fakeIntake();
    expect(await createSyncRunner({ intake, locks: fakeLocks() }).run()).toBe('DONE');
    expect(sent.map((r) => r.sessionId)).toEqual([uuid(1), uuid(2)]);
    expect(await statuses()).toEqual({ [uuid(1)]: 'SYNCED', [uuid(2)]: 'SYNCED', [uuid(3)]: 'SYNCED', [uuid(4)]: 'CONFLICT' });
  });

  it('CONFLICT → dừng tự gửi: lượt sau không gửi lại (BR-M02-011)', async () => {
    await seed(1);
    const { intake, sent } = fakeIntake({ [uuid(1)]: ['CONFLICT'] });
    const runner = createSyncRunner({ intake, locks: fakeLocks() });
    await runner.run();
    await runner.run();
    expect(sent).toHaveLength(1);
    expect(await statuses()).toEqual({ [uuid(1)]: 'CONFLICT' });
  });

  it('KEEP_PENDING → giữ PENDING, lượt sau gửi lại cùng bản ghi; IDENTICAL sau đó → SYNCED (SC-M02-006)', async () => {
    await seed(1);
    const { intake, sent } = fakeIntake({ [uuid(1)]: ['KEEP_PENDING', 'SYNCED'] });
    const runner = createSyncRunner({ intake, locks: fakeLocks() });
    expect(await runner.run()).toBe('RETRY');
    expect(await statuses()).toEqual({ [uuid(1)]: 'PENDING' });
    expect(await runner.run()).toBe('DONE');
    expect(sent).toEqual([record(1), record(1)]);
  });

  it('record giữ nguyên từng byte sau mọi lần đổi syncStatus (BR-M02-010)', async () => {
    await seed(1);
    const before = JSON.stringify((await pendingSyncItemsTable.get(uuid(1)))!.record);
    await createSyncRunner({ intake: fakeIntake({ [uuid(1)]: ['KEEP_PENDING'] }).intake, locks: fakeLocks() }).run();
    await createSyncRunner({ intake: fakeIntake().intake, locks: fakeLocks() }).run();
    expect(JSON.stringify((await pendingSyncItemsTable.get(uuid(1)))!.record)).toBe(before);
  });

  it('Web Lock cpq:m02:sync exclusive ifAvailable: hai runner (hai tab) cùng lúc → chỉ một gửi', async () => {
    await seed(1);
    await seed(2);
    const locks = fakeLocks();
    const { intake, sent } = fakeIntake();
    const results = await Promise.all([createSyncRunner({ intake, locks }).run(), createSyncRunner({ intake, locks }).run()]);
    expect(results.sort()).toEqual(['BUSY', 'DONE']);
    expect(sent.map((r) => r.sessionId)).toEqual([uuid(1), uuid(2)]);
    expect(locks.requests.every((r) => r === `${SYNC_LOCK}:exclusive:ifAvailable`)).toBe(true);
  });

  it('không có Web Locks (trình duyệt cũ) vẫn gửi; trong cùng tab chỉ một lượt tại một thời điểm', async () => {
    await seed(1);
    const { intake, sent } = fakeIntake();
    const runner = createSyncRunner({ intake, locks: undefined });
    await Promise.all([runner.run(), runner.run()]);
    expect(sent).toHaveLength(1);
  });
});

describe('syncScheduler', () => {
  function scriptedRunner(results: ('DONE' | 'RETRY' | 'BUSY')[]): SyncRunner & { runs: number } {
    return {
      runs: 0,
      async run() {
        this.runs += 1;
        return results.shift() ?? 'DONE';
      },
    };
  }

  it('còn mục chờ → thử lại 30 s → 1 → 2 → 5 phút rồi giữ 5 phút', async () => {
    vi.useFakeTimers();
    const runner = scriptedRunner(['RETRY', 'RETRY', 'RETRY', 'RETRY', 'RETRY', 'RETRY', 'DONE']);
    createSyncScheduler({ runner, isVisible: () => true }).request();
    await vi.advanceTimersByTimeAsync(0);
    expect(runner.runs).toBe(1);
    for (const [delay, runs] of [[30_000, 2], [60_000, 3], [120_000, 4], [300_000, 5], [300_000, 6]] as const) {
      await vi.advanceTimersByTimeAsync(delay - 1);
      expect(runner.runs).toBe(runs - 1);
      await vi.advanceTimersByTimeAsync(1);
      expect(runner.runs).toBe(runs);
    }
  });

  it('trang đang ẩn → không hẹn thử lại; trigger mới chạy ngay và bắt đầu lại từ 30 s', async () => {
    vi.useFakeTimers();
    let visible = false;
    const runner = scriptedRunner(['RETRY', 'RETRY', 'RETRY']);
    const scheduler = createSyncScheduler({ runner, isVisible: () => visible });
    scheduler.request();
    await vi.advanceTimersByTimeAsync(600_000);
    expect(runner.runs).toBe(1);

    visible = true;
    scheduler.request();
    await vi.advanceTimersByTimeAsync(0);
    expect(runner.runs).toBe(2);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(runner.runs).toBe(3);
  });

  it('DONE → không hẹn gì thêm', async () => {
    vi.useFakeTimers();
    const runner = scriptedRunner(['DONE']);
    createSyncScheduler({ runner, isVisible: () => true }).request();
    await vi.advanceTimersByTimeAsync(3_600_000);
    expect(runner.runs).toBe(1);
  });
});
