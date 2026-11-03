// Bảng quyết định của một lần quét (tasks T042; scan-resolution-contract §2; research R-08). Hàm thuần.
// Dòng 1, 6, R-INVALID-LINK kiểm ở resolveScan.test.ts (US2); dòng 2, 4, 5, 7 ở resolveScan.outside.test.ts (US4);
// dòng 3, 8 (khách tự do) ở US6 (T076).
import type { ManifestCheckpoint } from '../../../shared/contracts/journeyManifest';
import type { LiveStationContent } from '../../../shared/contracts/liveQrLookup';
import type { LookupOutcome } from '../api/lookupClient';

/** Kết quả tra cứu, hoặc link không phải QR của môi trường hiện tại (không gọi mạng). */
export type ScanLookup = LookupOutcome | { kind: 'INVALID_LINK' };

export type ScanDisplay =
  /** Nội dung live của mã (dòng 1, 2, 3) */
  | { kind: 'LIVE'; content: LiveStationContent }
  /** Lỗi nguồn với mã trong journey: thông báo lỗi nguồn rồi nội dung gói của `J`, hoặc "Chưa có nội dung offline" (dòng 6) */
  | { kind: 'PACKAGE'; checkpoint: ManifestCheckpoint }
  | { kind: 'CLOSED' }
  | { kind: 'INVALID' }
  | { kind: 'CONNECTION_NEEDED' };

export type ScanResolution = {
  /** checkpoint cần ghi lượt ghé (nếu chưa có); `null` = không ghi */
  recordVisitFor: string | null;
  display: ScanDisplay;
  /** Gợi ý khách tự do hiện với mọi kết quả khi không có phiên (US-M02-07) */
  freeVisitor: boolean;
};

export function resolveScan({
  journey,
  qrIdentifier,
  lookup,
}: {
  /** journey đóng băng của phiên đang chạy; `null` = không có phiên */
  journey: readonly ManifestCheckpoint[] | null;
  qrIdentifier: string;
  lookup: ScanLookup;
}): ScanResolution {
  const freeVisitor = journey === null;
  const none = (display: ScanDisplay): ScanResolution => ({ recordVisitFor: null, display, freeVisitor });

  switch (lookup.kind) {
    case 'INVALID_LINK':
    case 'INVALID':
      return none({ kind: 'INVALID' });
    case 'TEMPORARILY_CLOSED':
      // Cùng một thông báo cho ROUTE và CHECKPOINT; không nội dung, không lượt ghé (BR-M02-015)
      return none({ kind: 'CLOSED' });
    case 'VALID': {
      // Thuộc journey: theo mã đóng băng, hoặc theo checkpoint của nội dung (mã thêm sau, BR-M02-020)
      const byCode = journey?.find((c) => c.qrIdentifiers.includes(qrIdentifier));
      const byContent = journey?.find((c) => c.checkpointId === lookup.content.checkpointId);
      const checkpoint = byCode ?? byContent;
      return { recordVisitFor: checkpoint?.checkpointId ?? null, display: { kind: 'LIVE', content: lookup.content }, freeVisitor };
    }
    case 'SOURCE_ERROR': {
      // Offline hoặc lỗi nguồn: chỉ mã có trong journey đóng băng mới được ghi (BR-M02-005, 020)
      const checkpoint = journey?.find((c) => c.qrIdentifiers.includes(qrIdentifier));
      if (!checkpoint) return none({ kind: 'CONNECTION_NEEDED' });
      return { recordVisitFor: checkpoint.checkpointId, display: { kind: 'PACKAGE', checkpoint }, freeVisitor };
    }
  }
}
