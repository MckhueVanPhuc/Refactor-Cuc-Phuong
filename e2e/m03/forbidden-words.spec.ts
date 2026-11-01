// Quickstart Q18 (US5) trên adapter giả: `npm run dev:fake`, project `m03`.
// Duyệt mọi màn `/admin/*`, quét chữ hiển thị và thuộc tính đọc được (aria-label, title, placeholder, alt):
// không có từ cấm §5.4, mã enum, khóa MSG-*, `null`/`undefined`, `{`, mã HTTP hay id nội bộ — trừ 6 ký tự cuối
// mã QR (BR-M03-L09, L10, L11; SC-M03-026).
import type { Page } from '@playwright/test';
import { DISPLAY_NAMES, NEVER_SHOWN_WORDS } from '../../src/modules/m03/messages/displayNames';
import { expect, failNext, m03Hook, spaNavigate, test, waitForHooks } from './fixtures';

/** Mã enum: mọi khóa của bảng tên hiển thị dạng HOA_CO_GACH (mã ngôn ngữ `vi`/`en` là nội dung, không quét) */
const ENUM_CODES = [
  ...new Set(Object.values(DISPLAY_NAMES).flatMap((names) => Object.keys(names).filter((code) => /^[A-Z][A-Z0-9_]{2,}$/.test(code)))),
];

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Ranh giới từ cho chữ có dấu tiếng Việt */
const word = (text: string, flags = 'u') => new RegExp(`(?<![\\p{L}\\p{N}_])${escape(text)}(?![\\p{L}\\p{N}_])`, flags);

const RULES: { name: string; pattern: RegExp }[] = [
  ...NEVER_SHOWN_WORDS.map((text) => ({ name: `từ cấm "${text}"`, pattern: word(text, 'iu') })),
  ...ENUM_CODES.map((code) => ({ name: `mã ${code}`, pattern: word(code) })),
  { name: 'khóa danh mục MSG-*', pattern: /MSG-[A-Z]/ },
  { name: 'dấu ngoặc nhọn', pattern: /[{}]/ },
  { name: 'mã HTTP', pattern: /\bHTTP\b|\b[45]\d\d\s+(?:Bad|Unauthorized|Forbidden|Not Found|Conflict|Internal|Service)/i },
  { name: 'id dài', pattern: /(?<![\p{L}\p{N}])[A-Za-z0-9]{20,}(?![\p{L}\p{N}])/u },
  { name: 'UUID', pattern: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i },
];

/** Chữ người dùng thấy: innerText của trang và các thuộc tính đọc được */
async function visibleText(page: Page): Promise<string> {
  return page.evaluate(() => {
    const attributes = ['aria-label', 'title', 'placeholder', 'alt'];
    const extra = [...document.querySelectorAll('*')].flatMap((element) =>
      attributes.map((name) => element.getAttribute(name)).filter((value): value is string => Boolean(value)),
    );
    return [document.title, document.body.innerText, ...extra].join('\n');
  });
}

type Finding = { screen: string; rule: string; match: string };

async function scan(page: Page, screen: string, internalIds: readonly string[], findings: Finding[]) {
  await page.waitForLoadState('networkidle');
  const text = await visibleText(page);
  for (const rule of RULES) {
    const match = text.match(rule.pattern);
    if (match) findings.push({ screen, rule: rule.name, match: match[0] });
  }
  for (const id of internalIds) {
    if (text.includes(id)) findings.push({ screen, rule: 'id nội bộ', match: id });
  }
}

test('bộ quét bắt được mẫu vi phạm và bỏ qua chữ hợp lệ', () => {
  const caught = (text: string) => RULES.filter((rule) => rule.pattern.test(text)).map((rule) => rule.name);
  for (const bad of ['Trạng thái: HOAT_DONG', 'giá trị null', 'Lỗi JSON', 'MSG-GENERIC', 'Tên: {tên}', 'HTTP 500', 'xung đột trạng thái', 'Mã Ab3dE5fG7hJ9kL1mN2pQ']) {
    expect(caught(bad), bad).not.toEqual([]);
  }
  for (const good of ['Đang hoạt động', 'Mã …a1b2c3', 'Quãng đường (km): 4,5', '120/300', 'Chuyến đi', 'Nhãn thời gian: Vừa']) {
    expect(caught(good), good).toEqual([]);
  }
});

test('Q18 — mọi màn /admin/* không có từ cấm, mã thô hay id nội bộ', async ({ page, signInAs }) => {
  const findings: Finding[] = [];

  await page.goto('/admin/login');
  await expect(page.getByRole('button', { name: 'Đăng nhập' })).toBeVisible();
  await scan(page, 'đăng nhập', [], findings);

  await signInAs('REVIEWER');
  await waitForHooks(page);
  const { checkpointId, routeIds } = (await m03Hook(page, 'seedSharedRoutes', ['Hang Con Moong', 'Tuyến A', 'Tuyến B'])) as {
    checkpointId: string;
    routeIds: [string, string];
  };
  // Bản nháp chờ của tuyến A để màn xem lại có so sánh trước/sau
  await m03Hook(page, 'reviseRouteAs', ['CONTENT_STAFF', routeIds[0], { distanceKm: 6 }]);

  // Điểm tham quan: lấy identifier từ link trong bảng (không bao giờ hiện trong trang)
  await spaNavigate(page, `/admin/checkpoints/${checkpointId}`);
  const visitPointLink = page.getByRole('table', { name: 'Điểm tham quan' }).getByRole('link', { name: 'Vật ở Hang Con Moong' });
  const href = (await visitPointLink.getAttribute('href')) ?? '';
  const qrIdentifier = decodeURIComponent(href.split('/').at(-1) ?? '');
  expect(qrIdentifier.length).toBeGreaterThan(6);
  const ids = [checkpointId, ...routeIds, qrIdentifier];

  const screens: [string, string, () => Promise<void>][] = [
    ['danh sách tuyến', '/admin/routes', () => expect(page.getByRole('heading', { level: 1 })).toBeVisible()],
    ['tuyến mới', '/admin/routes/new', () => expect(page.getByRole('heading', { level: 1, name: 'Tuyến mới' })).toBeVisible()],
    ['thư viện điểm dừng', '/admin/checkpoints', () => expect(page.getByRole('heading', { level: 1 })).toBeVisible()],
    ['điểm dừng mới', '/admin/checkpoints/new', () => expect(page.getByRole('heading', { level: 1, name: 'Điểm dừng mới' })).toBeVisible()],
    ['editor điểm dừng', `/admin/checkpoints/${checkpointId}`, () => expect(page.getByRole('heading', { level: 1, name: 'Hang Con Moong' })).toBeVisible()],
    [
      'điểm tham quan',
      `/admin/checkpoints/${checkpointId}/visit-points/${qrIdentifier}`,
      () => expect(page.getByRole('heading', { level: 1, name: 'Đang sửa: Vật ở Hang Con Moong' })).toBeVisible(),
    ],
    [
      'điểm tham quan mới',
      `/admin/checkpoints/${checkpointId}/visit-points/new`,
      () => expect(page.getByRole('heading', { level: 1, name: 'Điểm tham quan mới' })).toBeVisible(),
    ],
    [
      'xem lại & xuất bản',
      `/admin/review/ROUTE_INFORMATION/${routeIds[0]}`,
      () => expect(page.getByRole('heading', { level: 1, name: 'Xem lại & Xuất bản' })).toBeVisible(),
    ],
    ['tài khoản', '/admin/accounts', () => expect(page.getByRole('heading', { level: 1 })).toBeVisible()],
    ['báo cáo', '/admin/reports', () => expect(page.getByRole('heading', { level: 1 })).toBeVisible()],
    ['nhật ký', '/admin/audit', () => expect(page.getByRole('heading', { level: 1 })).toBeVisible()],
  ];
  for (const [name, path, ready] of screens) {
    await spaNavigate(page, path);
    await ready();
    await scan(page, name, ids, findings);
  }

  // Editor tuyến: cả bốn bước
  await spaNavigate(page, `/admin/routes/${routeIds[0]}`);
  await expect(page.getByRole('heading', { level: 1, name: 'Tuyến A' })).toBeVisible();
  for (const step of [/Thẻ tuyến/, /Chi tiết/, /Nhãn/, /Điểm dừng/]) {
    await page.getByRole('button', { name: step }).click();
    await scan(page, `editor tuyến — ${step.source}`, ids, findings);
  }

  // Thông báo lỗi khi lưu thất bại cũng là chữ cho nhân viên
  await page.getByRole('button', { name: /Thẻ tuyến/ }).click();
  await failNext(page, 'ROUTE_DRAFT_SAVED', 'MSG-GENERIC');
  await page.getByLabel('Quãng đường (km)').fill('7');
  await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await scan(page, 'editor tuyến — lưu lỗi', ids, findings);

  // Hộp thoại rời trang khi còn thay đổi chưa lưu
  await page.getByRole('link', { name: 'Thư viện điểm dừng' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await scan(page, 'hộp thoại rời trang', ids, findings);

  expect(findings).toEqual([]);
});
