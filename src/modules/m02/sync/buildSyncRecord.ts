// Dựng SessionSyncRecord của một phiên terminal (tasks T069; session-sync-record-contract §2; research R-10, R-11).
// Hàm thuần, gọi trong transaction chuyển terminal. Chỉ đúng các trường của contract: không tên, tài khoản, định danh
// thiết bị hay GPS (SC-M02-007). `checkpointName` là nhánh `vi` của tên đóng băng; lượt ghé sắp theo `sequence`.
import { sessionSyncRecordSchema, type SessionSyncRecord } from '../../../shared/contracts/sessionSyncRecord';
import type { CheckpointVisitRow, PlaySessionRow } from '../storage/rows';

export type TerminalStatus = 'HOAN_TAT' | 'BO_DO';

export function buildSyncRecord(
  session: PlaySessionRow,
  visits: readonly CheckpointVisitRow[],
  status: TerminalStatus,
  endedAt: string,
): SessionSyncRecord {
  const byId = new Map(session.journeyCheckpoints.map((checkpoint) => [checkpoint.checkpointId, checkpoint]));
  const visitedCheckpoints = visits
    .map((visit) => {
      const checkpoint = byId.get(visit.checkpointId);
      // Mọi lượt ghé thuộc journey đóng băng (recordVisit chỉ ghi checkpoint của journey)
      if (!checkpoint) throw new Error(`Lượt ghé ngoài journey đóng băng: ${visit.checkpointId}`);
      return {
        checkpointId: visit.checkpointId,
        checkpointName: checkpoint.checkpointName.vi,
        sequence: checkpoint.sequence,
        checkedInAt: visit.checkedInAt,
      };
    })
    .sort((a, b) => a.sequence - b.sequence);

  return sessionSyncRecordSchema.parse({
    sessionId: session.sessionId,
    routeId: session.routeId,
    contentVersion: session.contentVersion,
    startedAt: session.startedAt,
    endedAt,
    status,
    visitedCheckpoints,
  } satisfies SessionSyncRecord);
}

/** `endedAt` khi kết thúc bằng xác nhận hoặc thay phiên: max(now, checkedInAt mới nhất, startedAt) (research R-10). */
export function confirmedEndedAt(session: PlaySessionRow, visits: readonly CheckpointVisitRow[], now: Date): string {
  const times = [now.getTime(), Date.parse(session.startedAt), ...visits.map((v) => Date.parse(v.checkedInAt))];
  return new Date(Math.max(...times)).toISOString();
}

/** `endedAt` khi tự đóng phiên quá 24 giờ: checkedInAt mới nhất, hoặc startedAt khi chưa quét gì (BR-M02-022). */
export function autoEndedAt(session: PlaySessionRow, visits: readonly CheckpointVisitRow[]): string {
  const times = visits.map((v) => Date.parse(v.checkedInAt));
  return times.length > 0 ? new Date(Math.max(...times)).toISOString() : session.startedAt;
}

/** Checkpoint cuối = phần tử journey có `sequence` lớn nhất (spec-M02 §9). */
export function finalCheckpointId(session: PlaySessionRow): string | undefined {
  const last = Math.max(...session.journeyCheckpoints.map((c) => c.sequence));
  return session.journeyCheckpoints.find((c) => c.sequence === last)?.checkpointId;
}
