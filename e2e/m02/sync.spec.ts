// Quickstart M02 V24–V26 (tasks T087): gửi SessionSyncRecord tới Edge `session-intake` giả bằng `page.route()`. Mock
// giữ ngữ nghĩa của M03 (session-intake-contract §3): lần đầu `ACCEPTED`, gửi lại giống hệt `IDENTICAL`, khác nội dung
// `CONFLICT`; đếm số lần ghi phía server. `script[i]` đặt kết quả riêng cho lần gọi thứ i.
import { expect, test, type Page, type Route } from '@playwright/test';
import { vi } from '../../src/modules/m02/i18n/vi';
import { dumpStores, seedValidContext } from './helpers';
import { mockLookup, mockStorage } from './network';

type Step = 'SERVER' | 'LOST_RESPONSE' | { status: number; json: unknown };

async function mockIntake(page: Page, script: Step[] = []) {
  const stored = new Map<string, string>();
  const calls: string[] = [];
  // page.route() vẫn trả lời khi context offline; mạng thật thì request thất bại
  let offline = false;
  await page.route('**/functions/v1/session-intake', async (route: Route) => {
    if (route.request().method() !== 'POST') return route.fulfill({ status: 204 });
    const body = route.request().postData() ?? '';
    const { sessionId } = JSON.parse(body) as { sessionId: string };
    const step = script[calls.length] ?? 'SERVER';
    calls.push(sessionId);
    if (offline) return route.abort('internetdisconnected');
    if (typeof step === 'object') return route.fulfill({ status: step.status, json: step.json });
    // Ngữ nghĩa server: ghi nếu chưa có; giống hệt → IDENTICAL; khác → CONFLICT
    const previous = stored.get(sessionId);
    if (previous === undefined) stored.set(sessionId, body);
    if (step === 'LOST_RESPONSE') return route.abort('failed');
    if (previous === undefined) return route.fulfill({ status: 200, json: { result: 'ACCEPTED' } });
    return previous === body ? route.fulfill({ status: 200, json: { result: 'IDENTICAL' } }) : route.fulfill({ status: 409, json: { result: 'CONFLICT' } });
  });
  return {
    calls,
    writes: () => stored.size,
    setOffline(value: boolean) {
      offline = value;
    },
  };
}

type M02TestWindow = { __cpqTestHooks?: { m02?: { scan?: (text: string) => Promise<void> } } };

/** Một chuyến hoàn tất: Start, quét điểm cuối Q3, [Kết thúc] → màn kết quả. */
async function finishTrip(page: Page) {
  await page.addInitScript(() => Object.defineProperty(navigator, 'language', { get: () => 'vi-VN' }));
  await mockLookup(page);
  await mockStorage(page);
  await page.goto('/');
  await seedValidContext(page);
  await page.goto('/trip');
  await expect(page.getByText(vi.notice.sessionStartHint)).toBeVisible();
  await page.waitForFunction(() => Boolean((window as unknown as M02TestWindow).__cpqTestHooks?.m02?.scan));
  await page.evaluate(() => (window as unknown as M02TestWindow).__cpqTestHooks!.m02!.scan!('http://localhost:4173/q/Q3'));
  await page.waitForFunction(() => {
    const dialog = document.querySelector('[role="alertdialog"]');
    return Boolean(dialog?.parentElement && getComputedStyle(dialog.parentElement).position === 'fixed');
  });
  await page.getByRole('button', { name: vi.endPrompt.end, exact: true }).click();
  await expect(page.getByRole('heading', { name: vi.end.title })).toBeVisible();
}

async function syncStatus(page: Page) {
  const [item] = (await dumpStores(page, ['pendingSyncItems'])).pendingSyncItems as { syncStatus: string }[];
  return item?.syncStatus;
}

/** Trang hiện lại: trigger đồng bộ (research R-11). */
const pageVisibleAgain = (page: Page) => page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));

test('V24 — intake ACCEPTED → "Đã gửi về hệ thống", SYNCED, một lần ghi', async ({ page }) => {
  const intake = await mockIntake(page);
  await finishTrip(page);
  await expect(page.getByText(vi.end.syncSynced)).toBeVisible();
  expect(await syncStatus(page)).toBe('SYNCED');
  expect(intake.writes()).toBe(1);
});

test('V24 — mất response sau khi server đã ghi → PENDING; gửi lại → IDENTICAL → SYNCED; vẫn một lần ghi', async ({ page }) => {
  const intake = await mockIntake(page, ['LOST_RESPONSE']);
  await finishTrip(page);
  await expect(page.getByText(vi.end.syncPending)).toBeVisible();
  expect(await syncStatus(page)).toBe('PENDING');
  await pageVisibleAgain(page);
  await expect(page.getByText(vi.end.syncSynced)).toBeVisible();
  expect(intake.calls).toHaveLength(2);
  expect(intake.writes()).toBe(1);
});

test.describe('V25 — conflict / bị từ chối → CONFLICT, không gửi lại', () => {
  for (const [name, status, result] of [['409 CONFLICT', 409, 'CONFLICT'], ['422 INVALID', 422, 'INVALID']] as const) {
    test(name, async ({ page }) => {
      const intake = await mockIntake(page, [{ status, json: { result } }]);
      await finishTrip(page);
      await expect(page.getByRole('alert')).toHaveText(vi.end.syncConflict);
      expect(await syncStatus(page)).toBe('CONFLICT');
      await pageVisibleAgain(page);
      await page.waitForTimeout(500);
      expect(intake.calls).toHaveLength(1);
      // SCR-M02-001 hiện một dòng lỗi khi chưa có chuyến mới; không có thao tác thử lại
      await page.goto('/trip');
      await expect(page.getByText(vi.trip.previousTripSyncError)).toBeVisible();
      expect(intake.calls).toHaveLength(1);
    });
  }
});

test.describe('V26 — 503, 429, offline → PENDING; gửi lại khi trang hiện lại hoặc có mạng', () => {
  for (const [name, status] of [['503', 503], ['429', 429]] as const) {
    test(`${name} → PENDING; trang hiện lại → SYNCED`, async ({ page }) => {
      const intake = await mockIntake(page, [{ status, json: { message: 'later' } }]);
      await finishTrip(page);
      await expect(page.getByText(vi.end.syncPending)).toBeVisible();
      expect(await syncStatus(page)).toBe('PENDING');
      await pageVisibleAgain(page);
      await expect(page.getByText(vi.end.syncSynced)).toBeVisible();
      expect(intake.calls).toHaveLength(2);
    });
  }

  test('offline khi kết thúc → PENDING ("Chờ gửi"); có mạng lại → SYNCED', async ({ page, context }) => {
    const intake = await mockIntake(page);
    await page.addInitScript(() => Object.defineProperty(navigator, 'language', { get: () => 'vi-VN' }));
    await mockLookup(page);
    await mockStorage(page);
    await page.goto('/');
    await seedValidContext(page);
    await page.goto('/trip');
    await expect(page.getByText(vi.notice.sessionStartHint)).toBeVisible();
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await page.waitForFunction(() => Boolean((window as unknown as M02TestWindow).__cpqTestHooks?.m02?.scan));
    await context.setOffline(true);
    intake.setOffline(true);
    // Offline: Q3 có trong journey → vẫn ghi lượt ghé (nguồn gói), câu hỏi kết thúc hiện như thường
    await page.evaluate(() => (window as unknown as M02TestWindow).__cpqTestHooks!.m02!.scan!('http://localhost:4173/q/Q3'));
    await page.waitForFunction(() => {
      const dialog = document.querySelector('[role="alertdialog"]');
      return Boolean(dialog?.parentElement && getComputedStyle(dialog.parentElement).position === 'fixed');
    });
    await page.getByRole('button', { name: vi.endPrompt.end, exact: true }).click();
    await expect(page.getByText(vi.end.syncPending)).toBeVisible();
    expect(intake.writes()).toBe(0);

    intake.setOffline(false);
    await context.setOffline(false);
    await expect(page.getByText(vi.end.syncSynced)).toBeVisible();
    expect(intake.writes()).toBe(1);
  });
});
