// Vào `/trip` (tasks T031, T071, T072; research R-06, R-09): tự đóng phiên quá 24 giờ trước, rồi đọc context và phiên,
// quyết định và tạo / thay / khôi phục / từ chối. Quyết định được kiểm lại trong transaction của createSession, nên hai
// tab vào cùng lúc vẫn chỉ có một phiên; thay phiên lỗi giữ nguyên phiên cũ (BR-M02-013).
import type { PlaySessionRow } from '../storage/rows';
import { createSession } from '../storage/createSession';
import { getRunningSession } from '../storage/readers';
import { autoEndForgottenSession } from './autoEnd';
import type { EntryDecision, RejectReason } from './decideEntry';

export type EntryResult =
  | { kind: 'STARTED'; session: PlaySessionRow; replaced: PlaySessionRow | null }
  | { kind: 'RESTORED'; session: PlaySessionRow }
  | { kind: 'REJECTED'; reason: RejectReason; running: PlaySessionRow | null }
  /** Có handoff mới nhưng không thay được phiên; phiên đang chạy giữ nguyên (BR-M02-013) */
  | { kind: 'REPLACE_FAILED'; running: PlaySessionRow }
  | { kind: 'FREE' };

function fromDecision(decision: Exclude<EntryDecision, { kind: 'CREATE' | 'REPLACE' }>): EntryResult {
  switch (decision.kind) {
    case 'RESTORE':
      return { kind: 'RESTORED', session: decision.session };
    case 'REJECT':
      return { kind: 'REJECTED', reason: decision.reason, running: decision.running };
    case 'FREE':
      return { kind: 'FREE' };
  }
}

export async function enterTrip(now: Date = new Date()): Promise<EntryResult> {
  // Tự đóng phiên quá 24 giờ chạy trước mọi quyết định (BR-M02-022)
  await autoEndForgottenSession(now);
  try {
    const result = await createSession(now);
    if (result.kind === 'CREATED') return { kind: 'STARTED', session: result.session, replaced: result.replaced };
    return fromDecision(result.decision);
  } catch (error) {
    // Transaction đã rollback: nếu còn phiên đang chạy thì đó là lần thay phiên lỗi (E-SCR-M02-001-21)
    const running = await getRunningSession();
    if (running) return { kind: 'REPLACE_FAILED', running };
    throw error;
  }
}
