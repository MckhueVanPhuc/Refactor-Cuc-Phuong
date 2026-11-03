// Ghi lượt ghé (tasks T035; BR-M02-004, 014; FR-M02-007, 009; SC-M02-002; research R-10).
import { describe, expect, it } from 'vitest';
import { CHECKPOINTS, ROUTE_A } from '../api/fake/fixtures';
import { recordVisit } from './recordVisit';
import type { PlaySessionRow } from './rows';
import { checkpointVisitsTable, playSessionsTable } from './tables';

const SESSION = '5b1e2d3c-4a5f-4e6d-8c7b-9a0f1e2d3c4b';
const STARTED_AT = '2026-11-04T02:00:00.000Z';

async function seedSession(change: Partial<PlaySessionRow> = {}) {
  await playSessionsTable.add({
    sessionId: SESSION,
    sourceHandoffId: '1d0c6a2e-7b4f-4c3a-9e8d-2f1a0b9c8d7e',
    routeId: ROUTE_A,
    contentVersion: 3,
    journeyCheckpoints: structuredClone([...CHECKPOINTS]),
    status: 'DANG_DIEN_RA',
    startedAt: STARTED_AT,
    ...change,
  });
}

const at = (iso: string) => new Date(iso);

describe('recordVisit', () => {
  it('chèn lượt ghé đầu tiên, trả { created: true, visit }', async () => {
    await seedSession();
    const result = await recordVisit(SESSION, 'C1', 'Q1a', at('2026-11-04T02:10:00.000Z'));
    expect(result).toEqual({
      created: true,
      visit: { sessionId: SESSION, checkpointId: 'C1', qrIdentifier: 'Q1a', checkedInAt: '2026-11-04T02:10:00.000Z' },
    });
    expect(await checkpointVisitsTable.count()).toBe(1);
  });

  it('mã thứ hai cùng điểm dừng: không bản ghi mới; giờ và mã đầu tiên bất biến (FR-M02-009; SC-M02-002)', async () => {
    await seedSession();
    await recordVisit(SESSION, 'C1', 'Q1a', at('2026-11-04T02:10:00.000Z'));
    const again = await recordVisit(SESSION, 'C1', 'Q1b', at('2026-11-04T02:30:00.000Z'));
    expect(again).toEqual({
      created: false,
      visit: { sessionId: SESSION, checkpointId: 'C1', qrIdentifier: 'Q1a', checkedInAt: '2026-11-04T02:10:00.000Z' },
    });
    expect(await checkpointVisitsTable.count()).toBe(1);
  });

  it('đồng hồ lùi trước startedAt → checkedInAt = startedAt (research R-10)', async () => {
    await seedSession();
    const result = await recordVisit(SESSION, 'C2', 'Q2', at('2026-11-04T01:00:00.000Z'));
    expect(result.visit?.checkedInAt).toBe(STARTED_AT);
  });

  it('phiên không còn DANG_DIEN_RA hoặc không tồn tại → không ghi (BR-M02-014)', async () => {
    await seedSession({ status: 'BO_DO', endedAt: '2026-11-04T03:00:00.000Z' });
    expect(await recordVisit(SESSION, 'C1', 'Q1a', at('2026-11-04T02:10:00.000Z'))).toEqual({ created: false, visit: null });
    expect(await recordVisit('00000000-0000-4000-8000-000000000000', 'C1', 'Q1a')).toEqual({ created: false, visit: null });
    expect(await checkpointVisitsTable.count()).toBe(0);
  });

  it('hai lần ghi đồng thời cùng điểm → đúng một lượt ghé', async () => {
    await seedSession();
    const results = await Promise.all([
      recordVisit(SESSION, 'C3', 'Q3', at('2026-11-04T02:40:00.000Z')),
      recordVisit(SESSION, 'C3', 'Q3', at('2026-11-04T02:40:01.000Z')),
    ]);
    expect(results.filter((r) => r.created)).toHaveLength(1);
    expect(await checkpointVisitsTable.count()).toBe(1);
  });
});
