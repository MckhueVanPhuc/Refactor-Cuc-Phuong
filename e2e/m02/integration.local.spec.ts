// Tích hợp thật M02 ↔ M01 và M03 giai đoạn B trên stack Supabase local (tasks M02 T103, T105; quickstart V5, V14, V20,
// V24, V25). Chỉ chạy ở project `m02-local-stack` (PW_LOCAL_STACK=1, `npm run dev` với .env.local của stack local,
// `supabase functions serve session-intake`).
// - Phiên bắt đầu bằng luồng M01 thật: danh mục → chi tiết tuyến → [Bắt đầu] → `/trip` (context v3 do M01 ghi).
// - "Quét" bằng link `/q/{mã}` như từ camera điện thoại: khi có phiên, trang link đi cùng đường processScan với trình
//   quét trong app (US6, V21). `npm run dev` không có test hook, còn camera giả chỉ phát QR cố định trong khi
//   qrIdentifier do hệ thống sinh (BR-M03-B01).
// - Lookup, Storage và session-intake là thật; `page.route()` chỉ dùng để làm mất response (V24) hoặc sửa body trên
//   đường đi (V25 422), còn kết quả luôn do M03 trả.
import { expect, test, type Page, type Request } from '@playwright/test';
import { vi } from '../../src/modules/m02/i18n/vi';
import { dumpStores, M02_STORES } from './helpers';
import {
  closeRoute,
  M02_LOCAL_PROJECT,
  resetLocalStack,
  seedM02World,
  sendAsVisitor,
  sessionRecordCount,
  type M02World,
} from './localStack';

test.use({ locale: 'vi-VN' });
test.describe.configure({ mode: 'serial' });

const NAMES = {
  c1: 'Điểm M02 hang động',
  c2: 'Điểm M02 cây chò',
  cx: 'Điểm M02 đang đóng',
  mainRoute: 'Tuyến M02 Hang Động',
  closableRoute: 'Tuyến M02 Đóng thử',
  q1bObject: 'Vật thứ hai ở hang động',
  q1bIntro: 'Giới thiệu của điểm tham quan thứ hai ở hang động.',
};
const INTAKE = '**/functions/v1/session-intake';
let world: M02World;

test.beforeAll(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== M02_LOCAL_PROJECT, 'chỉ chạy với stack Supabase local (PW_LOCAL_STACK=1)');
  test.setTimeout(120_000);
  resetLocalStack();
  world = await seedM02World(NAMES);
});

test.afterAll(({}, testInfo) => {
  if (testInfo.project.name === M02_LOCAL_PROJECT) resetLocalStack();
});

/** Thân request lookup mà trang gửi (`npm run dev` chạy StrictMode nên một lần mở trang có thể gửi hai lần) */
function recordLookups(page: Page): Record<string, unknown>[] {
  const bodies: Record<string, unknown>[] = [];
  page.on('request', (request: Request) => {
    if (request.url().includes('/rest/v1/rpc/lookup_qr')) bodies.push(request.postDataJSON() as Record<string, unknown>);
  });
  return bodies;
}

/** Số lần trang POST tới session-intake */
function countIntakePosts(page: Page): () => number {
  let count = 0;
  page.on('request', (request: Request) => {
    if (request.url().includes('/functions/v1/session-intake') && request.method() === 'POST') count += 1;
  });
  return () => count;
}

/** Luồng M01 thật: chọn tiếng Việt, mở tuyến, [Bắt đầu], tiếp tục không tải gói → SCR-M02-001 có phiên mới */
async function startTrip(page: Page, routeName: string) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Tiếng Việt' }).click();
  await page.getByRole('link', { name: new RegExp(routeName) }).click();
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  // Tuyến có điểm dừng cần tải trước (BR-M01-007)
  await page.getByRole('dialog').getByRole('button', { name: 'Tiếp tục không tải' }).click();
  await expect(page).toHaveURL(/\/trip$/);
  await expect(page.getByText(vi.notice.sessionStartHint)).toBeVisible();
}

async function visits(page: Page) {
  return (await dumpStores(page, ['checkpointVisits'])).checkpointVisits as { checkpointId: string; qrIdentifier: string; checkedInAt: string }[];
}

async function pendingItem(page: Page) {
  const [item] = (await dumpStores(page, ['pendingSyncItems'])).pendingSyncItems as {
    sessionId: string;
    syncStatus: string;
    record: Record<string, unknown>;
  }[];
  return item;
}

/** Quét Q1a rồi điểm cuối Q2 qua link, [Kết thúc] → SCR-M02-003 */
async function finishTrip(page: Page) {
  await page.goto(`/q/${world.q1a}`);
  await expect(page.getByText(vi.trip.visitRecorded)).toBeVisible();
  await page.goto(`/q/${world.q2}`);
  await expect(page.getByRole('alertdialog')).toContainText(vi.endPrompt.question);
  // Hộp thoại dùng CSS tải theo chunk: chờ lớp phủ cố định rồi mới bấm
  await page.waitForFunction(() => {
    const dialog = document.querySelector('[role="alertdialog"]');
    return Boolean(dialog?.parentElement && getComputedStyle(dialog.parentElement).position === 'fixed');
  });
  await page.getByRole('button', { name: vi.endPrompt.end, exact: true }).click();
  await expect(page.getByRole('heading', { name: vi.end.title })).toBeVisible();
}

/** Trang link luôn có khung nội dung: đã tra cứu xong nhưng không có nội dung live hay gói */
async function expectNoContent(page: Page) {
  const article = page.locator('article');
  await expect(article).not.toHaveAttribute('data-view', 'LOADING');
  await expect(article).not.toHaveAttribute('data-view', /^(LIVE|PACKAGE)$/);
}

/** Trang hiện lại: trigger đồng bộ (research R-11) */
const pageVisibleAgain = (page: Page) => page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));

test('V20 + T103 — /q/{Q1a} không phiên, vi-VN chưa có preference: nội dung thật, gợi ý khách tự do, không routeId, không ghi gì; VI/EN ghi qua M01', async ({ page }) => {
  const lookups = recordLookups(page);
  await page.goto(`/q/${world.q1a}`);
  await expect(page.getByRole('heading', { name: `Vật ở ${NAMES.c1}` })).toBeVisible();
  await expect(page.getByText(vi.notice.freeVisitor)).toBeVisible();
  await expect(page.getByRole('link', { name: vi.qrLink.chooseRoute })).toHaveAttribute('href', '/');
  expect(lookups.length).toBeGreaterThan(0);
  for (const body of lookups) expect(body).toEqual({ p_qr_identifier: world.q1a });
  const dump = await dumpStores(page, [...M02_STORES, 'languagePreference']);
  expect(M02_STORES.map((store) => dump[store]!.length)).toEqual([0, 0, 0]);
  expect(dump.languagePreference).toEqual([]);

  // Nút VI/EN là LanguageControl của M01: lựa chọn được ghi vào store của M01, trang đổi chữ ngay
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.getByRole('button', { name: 'EN', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { name: `Vật ở ${NAMES.c1} (en)` })).toBeVisible();
  expect((await dumpStores(page, ['languagePreference'])).languagePreference).toMatchObject([{ languageCode: 'en' }]);
});

test('V5 + T103 — Start từ M01 → phiên mới; online Q1a rồi Q1b: một lượt ghé C1 (qrIdentifier = Q1a), hai nội dung, lần hai hiện giờ ghé cũ', async ({ page }) => {
  const lookups = recordLookups(page);
  await startTrip(page, NAMES.mainRoute);
  const sessions = (await dumpStores(page, ['playSessions'])).playSessions;
  expect(sessions).toMatchObject([{ routeId: world.mainRoute, status: 'DANG_DIEN_RA' }]);

  await page.goto(`/q/${world.q1a}`);
  await expect(page.getByText(vi.trip.visitRecorded)).toBeVisible();
  await expect(page.getByRole('heading', { name: `Vật ở ${NAMES.c1}` })).toBeVisible();
  await expect(page.getByText(vi.notice.freeVisitor)).toHaveCount(0);
  const first = await visits(page);
  expect(first).toHaveLength(1);
  expect(first[0]).toMatchObject({ checkpointId: world.c1, qrIdentifier: world.q1a });
  const scannedAt = page.getByText(/^Quét lúc /);
  await expect(scannedAt).toBeVisible();
  const firstTime = await scannedAt.textContent();

  await page.goto(`/q/${world.q1b}`);
  await expect(page.getByRole('heading', { name: NAMES.q1bObject })).toBeVisible();
  await expect(page.getByText(NAMES.q1bIntro)).toBeVisible();
  await expect(page.getByText(vi.trip.visitRecorded)).toHaveCount(0);
  await expect(page.getByText(/^Quét lúc /)).toHaveText(firstTime!);
  expect(await visits(page)).toEqual(first);
  // Có phiên: lookup luôn kèm tuyến của phiên (BR-M02-019)
  for (const body of lookups) expect(body).toMatchObject({ p_route_id: world.mainRoute });
});

test.describe('V14 — tạm đóng (ROUTE, CHECKPOINT) và INVALID từ lookup thật: không nội dung, không lượt ghé', () => {
  test('TEMPORARILY_CLOSED ROUTE: Quản lý tạm đóng tuyến giữa chuyến → thông báo tạm đóng', async ({ page }) => {
    await startTrip(page, NAMES.closableRoute);
    await closeRoute(world.closableRoute);
    await page.goto(`/q/${world.q1a}`);
    await expect(page.getByRole('alert')).toHaveText(vi.notice.temporarilyClosed);
    await expectNoContent(page);
    expect(await visits(page)).toEqual([]);
  });

  test('TEMPORARILY_CLOSED CHECKPOINT: mã của điểm dừng đang tạm đóng → cùng thông báo', async ({ page }) => {
    await startTrip(page, NAMES.mainRoute);
    await page.goto(`/q/${world.qx}`);
    await expect(page.getByRole('alert')).toHaveText(vi.notice.temporarilyClosed);
    await expectNoContent(page);
    expect(await visits(page)).toEqual([]);
  });

  test('INVALID: mã không tồn tại → "Mã không còn hiệu lực hoặc không tồn tại."', async ({ page }) => {
    await startTrip(page, NAMES.mainRoute);
    await page.goto('/q/QzKhongTonTai00000001');
    await expect(page.getByRole('alert')).toHaveText(vi.notice.invalid);
    await expectNoContent(page);
    expect(await visits(page)).toEqual([]);
  });
});

test.describe('V24 — session-intake thật', () => {
  test('ACCEPTED → "Đã gửi về hệ thống", SYNCED, một SessionRecord', async ({ page }) => {
    await startTrip(page, NAMES.mainRoute);
    await finishTrip(page);
    await expect(page.getByText(vi.end.syncSynced)).toBeVisible();
    const item = await pendingItem(page);
    expect(item).toMatchObject({ syncStatus: 'SYNCED' });
    expect(sessionRecordCount(item!.sessionId)).toBe(1);
  });

  test('mất response sau khi M03 đã ghi → PENDING; gửi lại → IDENTICAL → SYNCED; vẫn một SessionRecord', async ({ page }) => {
    const posts = countIntakePosts(page);
    // Lần POST đầu tới M03 thật, nhưng trang không nhận được response
    let lost = false;
    await page.route(INTAKE, async (route) => {
      if (route.request().method() !== 'POST' || lost) return route.continue();
      lost = true;
      await route.fetch();
      await route.abort('failed');
    });
    await startTrip(page, NAMES.mainRoute);
    await finishTrip(page);
    await expect(page.getByText(vi.end.syncPending)).toBeVisible();
    const item = await pendingItem(page);
    expect(item).toMatchObject({ syncStatus: 'PENDING' });
    expect(sessionRecordCount(item!.sessionId)).toBe(1);

    await pageVisibleAgain(page);
    await expect(page.getByText(vi.end.syncSynced)).toBeVisible();
    expect(posts()).toBe(2);
    expect(sessionRecordCount(item!.sessionId)).toBe(1);
  });
});

test.describe('V25 — M03 thật trả 409 và 422 → CONFLICT, không gửi lại, dòng lỗi ở SCR-M02-001', () => {
  async function expectConflictStays(page: Page, posts: () => number) {
    await expect(page.getByRole('alert')).toHaveText(vi.end.syncConflict);
    expect(await pendingItem(page)).toMatchObject({ syncStatus: 'CONFLICT' });
    const sent = posts();
    await pageVisibleAgain(page);
    await page.waitForTimeout(500);
    expect(posts()).toBe(sent);
    await page.goto('/trip');
    await expect(page.getByText(vi.trip.previousTripSyncError)).toBeVisible();
    expect(posts()).toBe(sent);
  }

  test('409 CONFLICT: M03 đã có phiên cùng sessionId với nội dung khác', async ({ page }) => {
    const posts = countIntakePosts(page);
    // Giữ bản ghi ở PENDING cho tới khi M03 có phiên khác nội dung
    await page.route(INTAKE, (route) => (route.request().method() === 'POST' ? route.abort('internetdisconnected') : route.continue()));
    await startTrip(page, NAMES.mainRoute);
    await finishTrip(page);
    await expect(page.getByText(vi.end.syncPending)).toBeVisible();
    const item = await pendingItem(page);
    expect(await sendAsVisitor({ ...item!.record, status: 'BO_DO', visitedCheckpoints: [] })).toEqual({ status: 200, result: 'ACCEPTED' });

    await page.unroute(INTAKE);
    await pageVisibleAgain(page);
    await expectConflictStays(page, posts);
    expect(sessionRecordCount(item!.sessionId)).toBe(1);
  });

  test('422 INVALID: M03 từ chối bản ghi (contentVersion không có snapshot)', async ({ page }) => {
    const posts = countIntakePosts(page);
    // Sửa body trên đường đi; kết quả 422 do Edge thật trả
    await page.route(INTAKE, async (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      const body = route.request().postDataJSON() as { contentVersion: number };
      return route.continue({ postData: JSON.stringify({ ...body, contentVersion: body.contentVersion + 100 }) });
    });
    await startTrip(page, NAMES.mainRoute);
    await finishTrip(page);
    await expectConflictStays(page, posts);
    expect(sessionRecordCount((await pendingItem(page))!.sessionId)).toBe(0);
  });
});
