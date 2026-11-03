// Ghi lượt ghé (tasks T041; research R-08 bước 4, R-10; scan-resolution-contract §3): một transaction chèn-nếu-chưa-có
// theo `[sessionId+checkpointId]`. Lượt ghé đầu tiên (giờ và mã) bất biến; phiên không còn `DANG_DIEN_RA` → không ghi.
import { visitorDb } from '../../../shared/db/visitorDb';
import { checkpointVisitRowSchema, type CheckpointVisitRow } from './rows';
import { checkpointVisitsTable, playSessionsTable } from './tables';

export type RecordVisitResult = { created: boolean; visit: CheckpointVisitRow | null };

export async function recordVisit(
  sessionId: string,
  checkpointId: string,
  qrIdentifier: string,
  now: Date = new Date(),
): Promise<RecordVisitResult> {
  return visitorDb.transaction('rw', [playSessionsTable, checkpointVisitsTable], async () => {
    const session = await playSessionsTable.get(sessionId);
    if (session?.status !== 'DANG_DIEN_RA') return { created: false, visit: null };
    const existing = await checkpointVisitsTable.get([sessionId, checkpointId]);
    if (existing) return { created: false, visit: existing };
    // Đồng hồ thiết bị lùi: kẹp để `checkedInAt` luôn nằm trong khoảng phiên (research R-10)
    const checkedInAt = new Date(Math.max(now.getTime(), Date.parse(session.startedAt))).toISOString();
    const visit = checkpointVisitRowSchema.parse({ sessionId, checkpointId, qrIdentifier, checkedInAt });
    await checkpointVisitsTable.add(visit);
    return { created: true, visit };
  });
}
