// Báo cáo trên adapter giả (tasks T157): Q-12 (RPT-01), Q-13 (RPT-02) trên SessionRecord synthetic theo admin-command
// §6 (BR-M03-J05–J07). Lọc `endedAt` trong `[fromDate 00:00, toDate+1 00:00)` giờ Asia/Ho_Chi_Minh; RPT-02 đếm
// `sessionId` phân biệt theo `(routeId, checkpointId)`, tên và thứ tự lấy từ bản ghi có `endedAt` muộn nhất (hòa thì
// `sessionId` lớn hơn). Truy vấn không ghi audit.
import type { Rpt02Item } from '../../contracts/reportOutputs';
import type { RouteContent } from '../../contracts/adminDtos';
import { vietnamDayStartUtc } from '../../messages/format';
import { validReportRange } from '../../reports/reportInput';
import type { AdminApi } from '../AdminApi';
import { AdminApiError } from '../errors';
import { publishedOf } from './revisions';
import type { FakeSessionRecord, FakeStore } from './store';

type ReportsArea = Pick<AdminApi, 'reportRpt01' | 'reportRpt02'>;

export function createFakeReportsArea(store: FakeStore): ReportsArea {
  /** Chuyến đi trong kỳ của bộ lọc; khoảng ngày sai thì từ chối như server (client không gửi khoảng sai) */
  function sessionsInPeriod(input: { routeId?: string; fromDate?: string; toDate?: string }): FakeSessionRecord[] {
    if (!store.currentAdmin()) throw new AdminApiError('MSG-SESSION-EXPIRED');
    const range = validReportRange(input.fromDate, input.toDate, new Date(store.now()));
    if (!range) throw new AdminApiError('MSG-GENERIC');
    const from = vietnamDayStartUtc(range.fromDate);
    const to = vietnamDayStartUtc(range.toDate, 1);
    return [...store.state.sessionRecords.values()].filter((record) => {
      const endedAt = new Date(record.endedAt).toISOString();
      return endedAt >= from && endedAt < to && (!input.routeId || record.routeId === input.routeId);
    });
  }

  /** Lần nhận thành công gần nhất trên toàn hệ thống; vắng khi chưa từng nhận */
  function lastIngestion(): { lastSuccessfulIngestionAt?: string } {
    const latest = [...store.state.sessionRecords.values()].map((record) => record.ingestedAt).sort().at(-1);
    return latest ? { lastSuccessfulIngestionAt: latest } : {};
  }

  /** Tên tiếng Việt của bản đang xuất bản của tuyến lúc truy vấn (BR-M03-J07) */
  function routeName(routeId: string): string {
    const content = publishedOf(store, 'ROUTE', routeId)?.content as RouteContent | undefined;
    return content?.name?.vi?.trim() || store.state.routes.get(routeId)?.name || 'Tuyến chưa đặt tên';
  }

  return {
    async reportRpt01(input) {
      const sessions = sessionsInPeriod(input);
      const total = sessions.length;
      const completed = sessions.filter((record) => record.status === 'HOAN_TAT').length;
      const abandoned = total - completed;
      const rate = (part: number) => (total === 0 ? 0 : part / total);
      return {
        totalSessionCount: total,
        completedCount: completed,
        completedRate: rate(completed),
        abandonedCount: abandoned,
        abandonedRate: rate(abandoned),
        ...lastIngestion(),
      };
    },

    async reportRpt02(input) {
      const groups = new Map<string, { sessions: Set<string>; latest: { endedAt: string; sessionId: string; name: string; sequence: number }; routeId: string; checkpointId: string }>();
      for (const record of sessionsInPeriod(input)) {
        for (const visit of record.visitedCheckpoints) {
          const key = `${record.routeId}\u0000${visit.checkpointId}`;
          const candidate = { endedAt: record.endedAt, sessionId: record.sessionId, name: visit.checkpointName, sequence: visit.sequence };
          const group = groups.get(key);
          if (!group) {
            groups.set(key, { sessions: new Set([record.sessionId]), latest: candidate, routeId: record.routeId, checkpointId: visit.checkpointId });
            continue;
          }
          group.sessions.add(record.sessionId);
          const later =
            Date.parse(candidate.endedAt) > Date.parse(group.latest.endedAt) ||
            (Date.parse(candidate.endedAt) === Date.parse(group.latest.endedAt) && candidate.sessionId > group.latest.sessionId);
          if (later) group.latest = candidate;
        }
      }
      const items: Rpt02Item[] = [...groups.values()].map((group) => ({
        routeId: group.routeId,
        routeName: routeName(group.routeId),
        checkpointId: group.checkpointId,
        checkpointName: group.latest.name,
        sequence: group.latest.sequence,
        uniqueSessionCount: group.sessions.size,
      }));
      // Theo tên tuyến rồi thứ tự điểm dừng, để bảng dễ đọc
      items.sort((a, b) => a.routeName.localeCompare(b.routeName, 'vi') || a.sequence - b.sequence);
      return { items, ...lastIngestion() };
    },
  };
}
