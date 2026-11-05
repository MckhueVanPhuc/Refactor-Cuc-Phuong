// Lọc sự kiện trước khi gửi Vercel Web Analytics và Speed Insights (tasks M03 T210; CHG-M03-2026-11-05-01 §6).

const ADMIN_PATH = /^\/admin(\/|$)/i;
const QR_PATH = /^\/q\/[^/]+\/?$/i;

/**
 * `/admin`: không gửi, vì link mời và khôi phục mang token trên URL. `/q/{qrIdentifier}`: gộp thành `/q/[id]`, vì spec-M03 §1
 * loại báo cáo theo từng QR khỏi MVP. Mọi đường dẫn còn lại: bỏ query và hash.
 */
export function redactEvent<T extends { url: string }>(event: T): T | null {
  const url = new URL(event.url);
  if (ADMIN_PATH.test(url.pathname)) return null;
  const path = QR_PATH.test(url.pathname) ? '/q/[id]' : url.pathname;
  return { ...event, url: `${url.origin}${path}` };
}
