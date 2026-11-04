// Chuyển terminal (tasks T064; BR-M02-007, 010; FR-M02-015, 016; SC-M02-005) trên fake-indexeddb.
import { describe, expect, it } from 'vitest';
import { sessionSyncRecordSchema } from '../../../shared/contracts/sessionSyncRecord';
import { CHECKPOINTS, ROUTE_A } from '../api/fake/fixtures';
import { recordVisit } from './recordVisit';
import { finishSession } from './terminalTransition';
import { checkpointVisitsTable, pendingSyncItemsTable, playSessionsTable } from './tables';

const SESSION = '5b1e2d3c-4a5f-4e6d-8c7b-9a0f1e2d3c4b';
const STARTED_AT = '2026-11-04T02:00:00.000Z';
const at = (iso: string) => new Date(iso);

async function seedSession() {
  await playSessionsTable.add({
    sessionId: SESSION,
    sourceHandoffId: '1d0c6a2e-7b4f-4c3a-9e8d-2f1a0b9c8d7e',
    routeId: ROUTE_A,
    contentVersion: 3,
    journeyCheckpoints: structuredClone([...CHECKPOINTS]),
    status: 'DANG_DIEN_RA',
    startedAt: STARTED_AT,
  });
}

describe('finishSession', () => {
  it('chưa có lượt ghé điểm cuối → không kết thúc (FR-M02-015)', async () => {
    await seedSession();
    await recordVisit(SESSION, 'C1', 'Q1a', at('2026-11-04T02:10:00.000Z'));
    expect(await finishSession(SESSION, at('2026-11-04T03:00:00.000Z'))).toEqual({ kind: 'FINAL_NOT_VISITED' });
    expect((await playSessionsTable.get(SESSION))!.status).toBe('DANG_DIEN_RA');
    expect(await pendingSyncItemsTable.count()).toBe(0);
  });

  it('điểm cuối đã ghé, bỏ qua C1, C2 → HOAN_TAT + endedAt + PendingSyncItem PENDING cùng lúc (BR-M02-007; SC-M02-005)', async () => {
    await seedSession();
    await recordVisit(SESSION, 'C3', 'Q3', at('2026-11-04T02:30:00.000Z'));
    const result = await finishSession(SESSION, at('2026-11-04T03:00:00.000Z'));
    expect(result.kind).toBe('FINISHED');
    expect(await playSessionsTable.get(SESSION)).toMatchObject({ status: 'HOAN_TAT', endedAt: '2026-11-04T03:00:00.000Z' });
    const [item] = await pendingSyncItemsTable.toArray();
    expect(item).toMatchObject({ sessionId: SESSION, syncStatus: 'PENDING', record: { status: 'HOAN_TAT', endedAt: '2026-11-04T03:00:00.000Z' } });
    expect(item!.record.visitedCheckpoints.map((v) => v.checkpointId)).toEqual(['C3']);
    expect(sessionSyncRecordSchema.safeParse(item!.record).success).toBe(true);
  });

  it('lỗi giữa chừng (ghi mục hàng đợi lỗi) → rollback: phiên vẫn DANG_DIEN_RA, không có mục hàng đợi mới', async () => {
    await seedSession();
    await recordVisit(SESSION, 'C3', 'Q3', at('2026-11-04T02:30:00.000Z'));
    // Một mục đã có cùng sessionId làm `add` của transaction terminal hỏng (ConstraintError)
    const stray = { sessionId: SESSION, syncStatus: 'SYNCED' as const, record: { sessionId: SESSION, routeId: ROUTE_A, contentVersion: 3, startedAt: STARTED_AT, endedAt: STARTED_AT, status: 'BO_DO' as const, visitedCheckpoints: [] } };
    await pendingSyncItemsTable.add(stray);
    await expect(finishSession(SESSION, at('2026-11-04T03:00:00.000Z'))).rejects.toThrow();
    expect(await playSessionsTable.get(SESSION)).toMatchObject({ status: 'DANG_DIEN_RA' });
    expect((await playSessionsTable.get(SESSION))!.endedAt).toBeUndefined();
    expect(await pendingSyncItemsTable.toArray()).toEqual([stray]);
  });

  it('phiên terminal không đổi được nữa: Finish lần hai, ghi lượt ghé mới đều không có tác dụng (BR-M02-010)', async () => {
    await seedSession();
    await recordVisit(SESSION, 'C3', 'Q3', at('2026-11-04T02:30:00.000Z'));
    await finishSession(SESSION, at('2026-11-04T03:00:00.000Z'));
    const before = { session: await playSessionsTable.get(SESSION), items: await pendingSyncItemsTable.toArray() };
    expect(await finishSession(SESSION, at('2026-11-04T04:00:00.000Z'))).toEqual({ kind: 'NOT_RUNNING' });
    expect(await recordVisit(SESSION, 'C1', 'Q1a', at('2026-11-04T04:00:00.000Z'))).toEqual({ created: false, visit: null });
    expect({ session: await playSessionsTable.get(SESSION), items: await pendingSyncItemsTable.toArray() }).toEqual(before);
    expect(await checkpointVisitsTable.count()).toBe(1);
  });

  it('đồng hồ lùi: endedAt kẹp về lượt ghé mới nhất (research R-10)', async () => {
    await seedSession();
    await recordVisit(SESSION, 'C3', 'Q3', at('2026-11-04T02:30:00.000Z'));
    await finishSession(SESSION, at('2026-11-04T02:20:00.000Z'));
    expect((await playSessionsTable.get(SESSION))!.endedAt).toBe('2026-11-04T02:30:00.000Z');
  });
});
