// Báo cáo RPT-01, RPT-02 — Q-12, Q-13 (tasks T157; admin-command §6; BR-M03-J05–J07; SC-M03-035). Ca cần nạp
// SessionRecord synthetic đánh dấu `fakeOnly` (intake thật ở giai đoạn B).
import { expect, it } from 'vitest';
import type { SessionSyncRecord } from '../../../../shared/contracts/sessionSyncRecord';
import { rpt01OutputSchema, rpt02OutputSchema } from '../../contracts/reportOutputs';
import { contractBuilders } from './builders';
import type { ContractSuite } from './harness';

type Seed = SessionSyncRecord & { ingestedAt: string };

let counter = 0;
const uuid = () => `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`;

/** Phiên synthetic kết thúc lúc `endedAt` (UTC), ghé các điểm dừng cho trước */
function session(routeId: string, endedAt: string, status: Seed['status'], visits: { checkpointId: string; checkpointName: string; sequence: number }[], ingestedAt = endedAt): Seed {
  const startedAt = new Date(Date.parse(endedAt) - 3_600_000).toISOString();
  return {
    sessionId: uuid(),
    routeId,
    contentVersion: 1,
    startedAt,
    endedAt,
    status,
    visitedCheckpoints: visits.map((visit) => ({ ...visit, checkedInAt: startedAt })),
    ingestedAt,
  };
}

export const reportsContract: ContractSuite = ({ subject, itFakeOnly }) => {
  const api = () => subject().api;
  const controls = () => subject().controls;
  const build = contractBuilders(api);

  async function twoRoutes() {
    await controls().signInAs('CONTENT_STAFF');
    const { checkpointId } = await build.publishedCheckpoint('Hang Con Moong');
    const routeA = await build.publishedRoute('Tuyến A', [checkpointId]);
    const routeB = await build.publishedRoute('Tuyến B', [checkpointId]);
    return { routeA, routeB };
  }

  const OCT = { fromDate: '2026-10-01', toDate: '2026-10-31' };

  it('chưa có chuyến đi nào: RPT-01 toàn 0, tỷ lệ 0, không có lastSuccessfulIngestionAt; RPT-02 rỗng; cả hai role xem được (BR-M03-J06)', async () => {
    await controls().signInAs('CONTENT_STAFF');
    const rpt01 = await api().reportRpt01({});
    expect(rpt01OutputSchema.parse(rpt01)).toEqual({ totalSessionCount: 0, completedCount: 0, completedRate: 0, abandonedCount: 0, abandonedRate: 0 });
    expect(rpt02OutputSchema.parse(await api().reportRpt02({}))).toEqual({ items: [] });
    await controls().signInAs('REVIEWER');
    expect((await api().reportRpt01({})).totalSessionCount).toBe(0);
  });

  itFakeOnly('RPT-01 đếm theo endedAt trong kỳ, tỷ lệ theo tổng; lastSuccessfulIngestionAt là lần nhận gần nhất (BR-M03-J05, J06)', async () => {
    const { routeA } = await twoRoutes();
    const visit = [{ checkpointId: 'cp-1', checkpointName: 'Hang Con Moong', sequence: 1 }];
    controls().seedSessionRecords!([
      session(routeA, '2026-10-05T03:00:00.000Z', 'HOAN_TAT', visit),
      session(routeA, '2026-10-06T03:00:00.000Z', 'HOAN_TAT', visit),
      session(routeA, '2026-10-07T03:00:00.000Z', 'BO_DO', [], '2026-10-20T08:00:00.000Z'),
      session(routeA, '2026-11-05T03:00:00.000Z', 'HOAN_TAT', visit, '2026-11-05T04:00:00.000Z'),
    ]);
    const rpt01 = rpt01OutputSchema.parse(await api().reportRpt01(OCT));
    expect(rpt01).toMatchObject({ totalSessionCount: 3, completedCount: 2, abandonedCount: 1 });
    expect(rpt01.completedRate).toBeCloseTo(2 / 3);
    expect(rpt01.abandonedRate).toBeCloseTo(1 / 3);
    expect(rpt01.lastSuccessfulIngestionAt).toBe('2026-11-05T04:00:00.000Z');
  });

  itFakeOnly('ngày tính theo giờ Việt Nam: 17:30 UTC ngày 31/10 là ngày 01/11 (BR-M03-J05)', async () => {
    const { routeA } = await twoRoutes();
    controls().seedSessionRecords!([session(routeA, '2026-10-31T17:30:00.000Z', 'HOAN_TAT', [])]);
    expect((await api().reportRpt01(OCT)).totalSessionCount).toBe(0);
    expect((await api().reportRpt01({ fromDate: '2026-11-01', toDate: '2026-11-01' })).totalSessionCount).toBe(1);
    expect((await api().reportRpt01({ fromDate: '2026-10-31', toDate: '2026-10-31' })).totalSessionCount).toBe(0);
  });

  itFakeOnly('RPT-02: số chuyến đi duy nhất theo (tuyến, điểm dừng); tên và thứ tự lấy từ chuyến kết thúc muộn nhất; tên tuyến hiện hành (BR-M03-J07)', async () => {
    const { routeA, routeB } = await twoRoutes();
    controls().seedSessionRecords!([
      session(routeA, '2026-10-05T03:00:00.000Z', 'HOAN_TAT', [
        { checkpointId: 'cp-1', checkpointName: 'Hang cũ', sequence: 1 },
        { checkpointId: 'cp-2', checkpointName: 'Động', sequence: 2 },
      ]),
      session(routeA, '2026-10-09T03:00:00.000Z', 'BO_DO', [{ checkpointId: 'cp-1', checkpointName: 'Hang Con Moong', sequence: 2 }]),
      session(routeB, '2026-10-06T03:00:00.000Z', 'HOAN_TAT', [{ checkpointId: 'cp-1', checkpointName: 'Hang Con Moong', sequence: 1 }]),
    ]);
    const report = rpt02OutputSchema.parse(await api().reportRpt02(OCT));
    const item = (routeId: string, checkpointId: string) => report.items.find((i) => i.routeId === routeId && i.checkpointId === checkpointId);
    expect(report.items).toHaveLength(3);
    expect(item(routeA, 'cp-1')).toMatchObject({ routeName: 'Tuyến A', checkpointName: 'Hang Con Moong', sequence: 2, uniqueSessionCount: 2 });
    expect(item(routeA, 'cp-2')).toMatchObject({ checkpointName: 'Động', sequence: 2, uniqueSessionCount: 1 });
    expect(item(routeB, 'cp-1')).toMatchObject({ routeName: 'Tuyến B', uniqueSessionCount: 1 });

    const onlyA = rpt02OutputSchema.parse(await api().reportRpt02({ ...OCT, routeId: routeA }));
    expect(onlyA.items.every((i) => i.routeId === routeA)).toBe(true);
    expect((await api().reportRpt01({ ...OCT, routeId: routeB })).totalSessionCount).toBe(1);
  });
};
