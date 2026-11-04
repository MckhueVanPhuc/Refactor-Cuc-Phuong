// Chuyển phiên sang terminal (tasks T070; Physical §11 "Terminal transition"; data-model §3; BR-M02-007, 010).
// Trạng thái, `endedAt` và PendingSyncItem với SessionSyncRecord bất biến được ghi CÙNG một transaction, nên không bao
// giờ có phiên terminal thiếu mục hàng đợi. Dùng chung cho Finish/[Kết thúc], thay phiên và tự đóng 24 giờ.
import { visitorDb } from '../../../shared/db/visitorDb';
import type { SessionSyncRecord } from '../../../shared/contracts/sessionSyncRecord';
import { AUTO_END_AFTER_MS } from '../config/limits';
import { autoEndedAt, buildSyncRecord, confirmedEndedAt, finalCheckpointId, type TerminalStatus } from '../sync/buildSyncRecord';
import { pendingSyncItemRowSchema, playSessionRowSchema, type CheckpointVisitRow, type PlaySessionRow } from './rows';
import { getRunningSession } from './readers';
import { checkpointVisitsTable, M02_SESSION_TABLES, pendingSyncItemsTable, playSessionsTable } from './tables';

/**
 * Kết thúc một phiên đang chạy. PHẢI gọi bên trong transaction `rw` trên M02_SESSION_TABLES; ném lỗi khi phiên không
 * còn `DANG_DIEN_RA` (trạng thái terminal bất biến) để transaction bao ngoài rollback.
 */
export async function endSessionInTx(
  session: PlaySessionRow,
  status: TerminalStatus,
  endedAt: (visits: readonly CheckpointVisitRow[]) => string,
): Promise<{ session: PlaySessionRow; record: SessionSyncRecord }> {
  const current = await playSessionsTable.get(session.sessionId);
  if (current?.status !== 'DANG_DIEN_RA') throw new Error('Phiên không còn DANG_DIEN_RA');
  const visits = await checkpointVisitsTable.where('sessionId').equals(current.sessionId).toArray();
  const ended = endedAt(visits);
  const record = buildSyncRecord(current, visits, status, ended);
  const next = playSessionRowSchema.parse({ ...current, status, endedAt: ended });
  await playSessionsTable.put(next);
  // `add` (không `put`): một mục mỗi phiên terminal; trùng → ConstraintError → rollback
  await pendingSyncItemsTable.add(pendingSyncItemRowSchema.parse({ sessionId: current.sessionId, record, syncStatus: 'PENDING' }));
  return { session: next, record };
}

export type FinishResult =
  | { kind: 'FINISHED'; session: PlaySessionRow; record: SessionSyncRecord }
  /** Finish chỉ khả dụng khi checkpoint cuối đã có lượt ghé (FR-M02-015) */
  | { kind: 'FINAL_NOT_VISITED' }
  | { kind: 'NOT_RUNNING' };

/** Finish / [Kết thúc]: `HOAN_TAT` kể cả khi bỏ qua điểm trước (FR-M02-016; BR-M02-007). */
export async function finishSession(sessionId: string, now: Date = new Date()): Promise<FinishResult> {
  return visitorDb.transaction('rw', M02_SESSION_TABLES, async () => {
    const session = await playSessionsTable.get(sessionId);
    if (session?.status !== 'DANG_DIEN_RA') return { kind: 'NOT_RUNNING' } as const;
    const finalId = finalCheckpointId(session);
    const finalVisit = finalId ? await checkpointVisitsTable.get([sessionId, finalId]) : undefined;
    if (!finalVisit) return { kind: 'FINAL_NOT_VISITED' } as const;
    const ended = await endSessionInTx(session, 'HOAN_TAT', (visits) => confirmedEndedAt(session, visits, now));
    return { kind: 'FINISHED', ...ended } as const;
  });
}

/**
 * Tự đóng phiên bị bỏ quên (BR-M02-022; FR-M02-024; research R-09): phiên `DANG_DIEN_RA` có `now − startedAt` lớn
 * hơn hẳn 24 giờ (giờ thiết bị) → `HOAN_TAT` nếu checkpoint cuối đã có lượt ghé, ngược lại `BO_DO`; `endedAt` = lượt
 * ghé mới nhất hoặc `startedAt`. Kiểm lại trong transaction nên chạy lặp vô hại; không có gì để đóng → `null`.
 */
export async function autoEndIfExpired(now: Date = new Date()): Promise<TerminalStatus | null> {
  return visitorDb.transaction('rw', M02_SESSION_TABLES, async () => {
    const session = await getRunningSession();
    if (!session || now.getTime() - Date.parse(session.startedAt) <= AUTO_END_AFTER_MS) return null;
    const finalId = finalCheckpointId(session);
    const finalVisit = finalId ? await checkpointVisitsTable.get([session.sessionId, finalId]) : undefined;
    const status: TerminalStatus = finalVisit ? 'HOAN_TAT' : 'BO_DO';
    await endSessionInTx(session, status, (visits) => autoEndedAt(session, visits));
    return status;
  });
}