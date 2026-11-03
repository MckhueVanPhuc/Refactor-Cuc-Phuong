// Phân tích link QR của trình quét (tasks T033; research R-07; quickstart V15; FR-M02-026; BR-M02-023; DAC-M02-011).
import { describe, expect, it } from 'vitest';
import { parseQrLink } from './parseQrLink';

const BASE = 'https://cucphuong.example.vn';

describe('parseQrLink', () => {
  it('nhận đúng {base}/q/{segment}; qrIdentifier = decodeURIComponent(segment)', () => {
    expect(parseQrLink(`${BASE}/q/Q1a`, BASE)).toEqual({ ok: true, qrIdentifier: 'Q1a' });
    expect(parseQrLink(`${BASE}/q/M%C3%A3%201`, BASE)).toEqual({ ok: true, qrIdentifier: 'Mã 1' });
  });

  it('không kiểm định dạng identifier (chuỗi opaque)', () => {
    expect(parseQrLink(`${BASE}/q/x_-~.9`, BASE)).toEqual({ ok: true, qrIdentifier: 'x_-~.9' });
  });

  it('base có path gốc: phải trùng cả path gốc', () => {
    const base = 'https://example.vn/quest';
    expect(parseQrLink('https://example.vn/quest/q/Q1a', base)).toEqual({ ok: true, qrIdentifier: 'Q1a' });
    expect(parseQrLink('https://example.vn/q/Q1a', base)).toEqual({ ok: false });
    expect(parseQrLink('https://example.vn/questx/q/Q1a', base)).toEqual({ ok: false });
  });

  it.each([
    ['origin khác', 'https://evil.example/q/Q1a'],
    ['tên miền giả mạo kéo dài', 'https://cucphuong.example.vn.evil/q/Q1a'],
    ['http thay vì https', 'http://cucphuong.example.vn/q/Q1a'],
    ['cổng khác', 'https://cucphuong.example.vn:8443/q/Q1a'],
    ['không phải URL', 'Q1a'],
    ['chuỗi rỗng', ''],
    ['có query', `${BASE}/q/Q1a?x=1`],
    ['dấu ? rỗng', `${BASE}/q/Q1a?`],
    ['có fragment', `${BASE}/q/Q1a#x`],
    ['thiếu segment', `${BASE}/q/`],
    ['hai segment', `${BASE}/q/Q1a/more`],
    ['path khác /q/', `${BASE}/qr/Q1a`],
    ['segment mã hóa hỏng', `${BASE}/q/%E0%A4%A`],
  ])('%s → không hợp lệ', (_name, text) => {
    expect(parseQrLink(text, BASE)).toEqual({ ok: false });
  });

  it('base mặc định là VITE_QR_PUBLIC_BASE_URL của build', () => {
    // vitest.config.ts: VITE_QR_PUBLIC_BASE_URL = http://localhost:5174
    expect(parseQrLink('http://localhost:5174/q/Q1a')).toEqual({ ok: true, qrIdentifier: 'Q1a' });
    expect(parseQrLink('http://localhost:4173/q/Q1a')).toEqual({ ok: false });
  });
});
