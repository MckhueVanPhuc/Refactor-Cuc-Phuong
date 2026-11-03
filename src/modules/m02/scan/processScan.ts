// Xử lý một lần quét (tasks T043; scan-resolution-contract §1–§3; research R-08), dùng chung cho trình quét trong app
// và trang `/q/…`. Lượt ghé được commit TRƯỚC khi trả kết quả để điều hướng sang nội dung; lỗi hiển thị về sau không gỡ
// nó (SC-M02-004). Kết quả chỉ sống trong router state, không lưu (data-model §6).
import { lookupClient, type LookupClient } from '../api/lookupClient';
import { getRunningSession } from '../storage/readers';
import { recordVisit } from '../storage/recordVisit';
import type { CheckpointVisitRow } from '../storage/rows';
import { parseQrLink } from './parseQrLink';
import { resolveScan, type ScanDisplay, type ScanLookup } from './resolveScan';

export type ScanOrigin = 'scanner' | 'link';

export type ScanResult = {
  qrIdentifier: string;
  display: ScanDisplay;
  freeVisitor: boolean;
  /** Phiên của lần quét (để xem nội dung gói của đúng tuyến/version) */
  session: { sessionId: string; routeId: string; contentVersion: number } | null;
  /** Lượt ghé của checkpoint (mới ghi hoặc đã có); `null` khi lần quét không ghi */
  visit: CheckpointVisitRow | null;
  visitCreated: boolean;
  /** Lượt ghé điểm cuối (sequence lớn nhất) vừa được tạo lần đầu → hỏi kết thúc chuyến một lần (BR-M02-021, US5) */
  finalPromptNeeded: boolean;
};

export type ScanDeps = { lookup?: LookupClient; now?: () => Date };

/** Một lần quét đã có `qrIdentifier` (đã qua parseQrLink với trình quét, hoặc tham số path của `/q/…`). */
export async function processScan(qrIdentifier: string, origin: ScanOrigin, deps: ScanDeps = {}): Promise<ScanResult> {
  const lookup = deps.lookup ?? lookupClient;
  const now = deps.now ?? (() => new Date());
  if (origin === 'link') {
    // Tự đóng phiên quá 24 giờ trước khi xử lý mã mở từ camera điện thoại (research R-09) — gắn ở T072
  }

  // Đọc lại phiên từ Dexie: tab khác có thể vừa đổi phiên (BR-M02-002)
  const session = await getRunningSession();
  const outcome: ScanLookup = await lookup.lookup(qrIdentifier, session?.routeId);
  const resolution = resolveScan({ journey: session?.journeyCheckpoints ?? null, qrIdentifier, lookup: outcome });

  let visit: CheckpointVisitRow | null = null;
  let visitCreated = false;
  if (session && resolution.recordVisitFor) {
    const recorded = await recordVisit(session.sessionId, resolution.recordVisitFor, qrIdentifier, now());
    visit = recorded.visit;
    visitCreated = recorded.created;
  }
  const lastSequence = Math.max(...(session?.journeyCheckpoints.map((c) => c.sequence) ?? []));
  const finalCheckpoint = session?.journeyCheckpoints.find((c) => c.sequence === lastSequence);

  return {
    qrIdentifier,
    display: resolution.display,
    freeVisitor: resolution.freeVisitor,
    session: session ? { sessionId: session.sessionId, routeId: session.routeId, contentVersion: session.contentVersion } : null,
    visit,
    visitCreated,
    finalPromptNeeded: visitCreated && visit?.checkpointId === finalCheckpoint?.checkpointId,
  };
}

/** Chuỗi trình quét đọc được: link sai → mã không hợp lệ, không gọi mạng (R-INVALID-LINK; FR-M02-026). */
export async function processScannedText(text: string, deps: ScanDeps = {}): Promise<ScanResult> {
  const link = parseQrLink(text);
  if (link.ok) return processScan(link.qrIdentifier, 'scanner', deps);
  const session = await getRunningSession();
  const resolution = resolveScan({ journey: session?.journeyCheckpoints ?? null, qrIdentifier: '', lookup: { kind: 'INVALID_LINK' } });
  return {
    qrIdentifier: '',
    display: resolution.display,
    freeVisitor: resolution.freeVisitor,
    session: null,
    visit: null,
    visitCreated: false,
    finalPromptNeeded: false,
  };
}
