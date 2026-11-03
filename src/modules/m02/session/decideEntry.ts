// Bảng quyết định khi vào `/trip` (tasks T031; research R-06). Hàm thuần: không đọc giờ hay storage.
import type { SelectedRouteContextReadResult } from '../m01Port';
import type { PlaySessionRow } from '../storage/rows';

/** Lý do không dùng được handoff; mỗi lý do có một thông báo ở `i18n` nhóm `handoff`. */
export type RejectReason = 'INVALID' | 'USED' | 'REVOKED' | 'EXPIRED';

export type EntryDecision =
  | { kind: 'RESTORE'; session: PlaySessionRow }
  | { kind: 'REJECT'; reason: RejectReason; running: PlaySessionRow | null }
  | { kind: 'CREATE' }
  | { kind: 'REPLACE'; running: PlaySessionRow }
  | { kind: 'FREE' };

export function decideEntry({
  context,
  running,
  handoffSession,
  now,
}: {
  context: SelectedRouteContextReadResult;
  /** Phiên `DANG_DIEN_RA` hiện có */
  running: PlaySessionRow | null;
  /** Phiên có `sourceHandoffId` = `handoffId` của context (nếu có) */
  handoffSession: PlaySessionRow | null;
  /** Giờ thiết bị, ms */
  now: number;
}): EntryDecision {
  if (context.kind === 'NONE') return running ? { kind: 'RESTORE', session: running } : { kind: 'FREE' };
  // Version 2 hay context hỏng không bao giờ được chuyển đổi (FR-M02-001)
  if (context.kind === 'INVALID') return { kind: 'REJECT', reason: 'INVALID', running };

  const handoff = context.value;
  if (handoffSession) {
    // Phiên đã có không bao giờ bị kết thúc vì handoff hết hạn hay bị thu hồi (FR-M02-005)
    if (handoffSession.status === 'DANG_DIEN_RA') return { kind: 'RESTORE', session: handoffSession };
    return { kind: 'REJECT', reason: 'USED', running };
  }
  if (handoff.authorizationStatus !== 'AUTHORIZED') return { kind: 'REJECT', reason: 'REVOKED', running };
  if (now >= Date.parse(handoff.expiresAt)) return { kind: 'REJECT', reason: 'EXPIRED', running };
  return running ? { kind: 'REPLACE', running } : { kind: 'CREATE' };
}
