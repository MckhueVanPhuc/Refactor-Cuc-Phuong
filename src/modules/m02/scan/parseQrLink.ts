// Phân tích chuỗi trình quét đọc được (tasks T040; research R-07; live-qr-lookup-consumer-contract §2): chỉ nhận
// đúng `{QR_PUBLIC_BASE_URL}/q/{qrIdentifier}` của môi trường hiện tại — cùng origin, cùng path gốc, đúng một đoạn sau
// `/q/`, không query, không fragment. Không kiểm định dạng identifier (chuỗi opaque).
import { env } from '../../../shared/config/env';

export type QrLinkResult = { ok: true; qrIdentifier: string } | { ok: false };

const INVALID = { ok: false } as const;

export function parseQrLink(text: string, base: string = env.qrPublicBaseUrl): QrLinkResult {
  let url: URL;
  let baseUrl: URL;
  try {
    url = new URL(text);
    baseUrl = new URL(base);
  } catch {
    return INVALID;
  }
  // `URL` bỏ "?" và "#" rỗng khỏi search/hash, nên kiểm thêm trên chuỗi gốc
  if (url.origin !== baseUrl.origin || url.search || url.hash || text.includes('?') || text.includes('#')) return INVALID;

  const prefix = `${baseUrl.pathname.replace(/\/$/, '')}/q/`;
  if (!url.pathname.startsWith(prefix)) return INVALID;
  const segment = url.pathname.slice(prefix.length);
  if (!segment || segment.includes('/')) return INVALID;
  try {
    return { ok: true, qrIdentifier: decodeURIComponent(segment) };
  } catch {
    return INVALID;
  }
}
