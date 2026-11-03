// Vào `/trip` (tasks T031; research R-06): đọc context và phiên, quyết định, rồi tạo / khôi phục / từ chối.
// Quyết định tạo được kiểm lại trong transaction của createSession, nên hai tab vào cùng lúc vẫn chỉ có một phiên.
import type { PlaySessionRow } from '../storage/rows';
import { createSession } from '../storage/createSession';
import type { EntryDecision, RejectReason } from './decideEntry';

export type EntryResult =
  | { kind: 'STARTED'; session: PlaySessionRow }
  | { kind: 'RESTORED'; session: PlaySessionRow }
  | { kind: 'REJECTED'; reason: RejectReason; running: PlaySessionRow | null }
  /** Có handoff mới nhưng chưa thay được phiên; phiên đang chạy giữ nguyên (BR-M02-013; thay phiên ở T071) */
  | { kind: 'REPLACE_FAILED'; running: PlaySessionRow }
  | { kind: 'FREE' };

function fromDecision(decision: Exclude<EntryDecision, { kind: 'CREATE' }>): EntryResult {
  switch (decision.kind) {
    case 'RESTORE':
      return { kind: 'RESTORED', session: decision.session };
    case 'REJECT':
      return { kind: 'REJECTED', reason: decision.reason, running: decision.running };
    case 'REPLACE':
      return { kind: 'REPLACE_FAILED', running: decision.running };
    case 'FREE':
      return { kind: 'FREE' };
  }
}

export async function enterTrip(now: Date = new Date()): Promise<EntryResult> {
  // Tự đóng phiên quá 24 giờ chạy trước mọi quyết định (research R-09) — gắn ở T072
  const result = await createSession(now);
  if (result.kind === 'CREATED') return { kind: 'STARTED', session: result.session };
  return fromDecision(result.decision);
}
