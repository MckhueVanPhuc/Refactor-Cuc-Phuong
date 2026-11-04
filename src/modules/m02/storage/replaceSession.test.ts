// Thay phiên khi có handoff mới (tasks T065; quickstart V18; BR-M02-013; FR-M02-017) với cổng M01 giả.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sessionSyncRecordSchema } from '../../../shared/contracts/sessionSyncRecord';
import { contextV3 } from '../api/fake/fixtures';
import { fakeM01 } from '../testing/fakeM01Port';
import { createSession } from './createSession';
import { failNextCreateSession } from './faultInjection';
import { recordVisit } from './recordVisit';
import { pendingSyncItemsTable, playSessionsTable } from './tables';

vi.mock('../m01Port', () => import('../testing/fakeM01Port'));

const first = contextV3();
const second = contextV3({ handoffId: '2e1d0c9b-8a7f-4e6d-9c5b-4a3f2e1d0c9b' });
const START = new Date(Date.parse(first.authorizedAt) + 60_000);
const LATER = new Date(START.getTime() + 3_600_000);

async function startFirst() {
  fakeM01.setContext(first);
  const result = await createSession(START);
  if (result.kind !== 'CREATED') throw new Error('phải tạo phiên đầu');
  await recordVisit(result.session.sessionId, 'C1', 'Q1a', new Date(START.getTime() + 600_000));
  return result.session;
}

beforeEach(() => fakeM01.reset());

describe('thay phiên', () => {
  it('handoff mới khi có phiên → cũ BO_DO + endedAt + mục hàng đợi, mới DANG_DIEN_RA, trong một transaction', async () => {
    const old = await startFirst();
    fakeM01.setContext(second);
    const result = await createSession(LATER);
    expect(result).toMatchObject({ kind: 'CREATED', replaced: { sessionId: old.sessionId, status: 'BO_DO' } });

    const sessions = await playSessionsTable.toArray();
    expect(sessions.find((s) => s.sessionId === old.sessionId)).toMatchObject({ status: 'BO_DO', endedAt: LATER.toISOString() });
    expect(sessions.filter((s) => s.status === 'DANG_DIEN_RA').map((s) => s.sourceHandoffId)).toEqual([second.handoffId]);

    const [item] = await pendingSyncItemsTable.toArray();
    expect(item).toMatchObject({ sessionId: old.sessionId, syncStatus: 'PENDING', record: { status: 'BO_DO' } });
    expect(item!.record.visitedCheckpoints.map((v) => v.checkpointId)).toEqual(['C1']);
    expect(sessionSyncRecordSchema.safeParse(item!.record).success).toBe(true);
  });

  it('tiêm lỗi khi chèn phiên mới → phiên cũ vẫn chạy, không có mục hàng đợi (quickstart V18; BR-M02-013)', async () => {
    const old = await startFirst();
    fakeM01.setContext(second);
    failNextCreateSession();
    await expect(createSession(LATER)).rejects.toThrow('failNextCreateSession');
    expect(await playSessionsTable.toArray()).toEqual([expect.objectContaining({ sessionId: old.sessionId, status: 'DANG_DIEN_RA' })]);
    expect((await playSessionsTable.get(old.sessionId))!.endedAt).toBeUndefined();
    expect(await pendingSyncItemsTable.count()).toBe(0);

    // Lỗi chỉ tiêm một lần: thử lại thì thay phiên được
    expect(await createSession(LATER)).toMatchObject({ kind: 'CREATED' });
  });

  it('tiêm lỗi khi tạo phiên đầu (không có phiên cũ) → không ghi gì', async () => {
    fakeM01.setContext(first);
    failNextCreateSession();
    await expect(createSession(START)).rejects.toThrow();
    expect(await playSessionsTable.count()).toBe(0);
  });
});
