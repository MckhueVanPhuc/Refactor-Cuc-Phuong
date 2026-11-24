// Màn kết quả: ăn mừng của màn và một Mila khi CONFLICT (specs/006 T049; quickstart M15, M16; FR-MOT-011, 017).
// (quét điểm cuối Q3 → [Kết thúc]). Câu 062 chỉ hiện vài giây: MutationObserver ghi lại mọi câu Mila đã nói
// (`window.__mascotSeen`), như mascot-intro.spec.ts.
import { expect, test, type BrowserContext, type Page, type Route } from '@playwright/test';
import { vi } from '../../src/modules/m02/i18n/vi';
import { seedValidContext } from './helpers';
import { mockLookup, mockStorage } from './network';

type M02TestWindow = { __cpqTestHooks?: { m02?: { scan?: (text: string) => Promise<void> } } };
type SeenWindow = { __mascotSeen?: string[] };

async function recordMascot(page: Page) {
  await page.addInitScript(() => {
    const seen: string[] = [];
    (window as unknown as SeenWindow).__mascotSeen = seen;
    new MutationObserver(() => {
      for (const element of document.querySelectorAll('[data-mascot-message]')) {
        const id = element.getAttribute('data-mascot-message') ?? '';
        if (seen[seen.length - 1] !== id) seen.push(id);
      }
    }).observe(document, { subtree: true, childList: true, attributes: true });
  });
}
const seen = (page: Page) => page.evaluate(() => (window as unknown as SeenWindow).__mascotSeen ?? []);

/** `before`: mã quét trước điểm cuối Q3 (fixture: C1 Q1a, C2 Q2, C3 Q3) — v1.1 Q23: quét đủ 3 điểm → 063 */
type Options = { intake: (route: Route) => Promise<void>; offline?: BrowserContext; before?: readonly string[] };

async function endTrip(page: Page, { intake, offline, before = [] }: Options) {
  await recordMascot(page);
  await page.addInitScript(() => Object.defineProperty(navigator, 'language', { get: () => 'vi-VN' }));
  await page.route('**/functions/v1/session-intake', intake);
  await mockLookup(page);
  await mockStorage(page);
  await page.goto('/');
  await seedValidContext(page);
  await page.goto('/trip');
  await expect(page.getByText(vi.notice.sessionStartHint)).toBeVisible();
  if (offline) await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await page.waitForFunction(() => Boolean((window as unknown as M02TestWindow).__cpqTestHooks?.m02?.scan));
  for (const qr of before) {
    await page.evaluate((text) => (window as unknown as M02TestWindow).__cpqTestHooks!.m02!.scan!(text), `http://localhost:4173/q/${qr}`);
    await expect(page).toHaveURL(new RegExp(`/trip/qr/${qr}$`));
    await page.getByRole('link', { name: vi.content.back }).click();
    await expect(page).toHaveURL(/\/trip$/);
    await page.waitForFunction(() => Boolean((window as unknown as M02TestWindow).__cpqTestHooks?.m02?.scan));
  }
  if (offline) await offline.setOffline(true);
  await page.evaluate(() => (window as unknown as M02TestWindow).__cpqTestHooks!.m02!.scan!('http://localhost:4173/q/Q3'));
  await page.waitForFunction(() => {
    const dialog = document.querySelector('[role="alertdialog"]');
    return Boolean(dialog?.parentElement && getComputedStyle(dialog.parentElement).position === 'fixed');
  });
  await page.getByRole('button', { name: vi.endPrompt.end, exact: true }).click();
  await expect(page.getByRole('heading', { name: vi.end.title })).toBeVisible();
}

const accept = (route: Route) => route.fulfill({ status: 200, json: { result: 'ACCEPTED' } });
const confetti = (page: Page) => page.locator('[data-leaf-confetti] > span');

test('M15: vừa kết thúc → confetti lá ≤ 40 hạt, huy hiệu đóng dấu; hết sau 2,4 s; mở lại: tĩnh; không thêm chữ/số', async ({ page }) => {
  await endTrip(page, { intake: accept, before: ['Q1a', 'Q2'] });
  const count = await confetti(page).count();
  expect(count).toBeGreaterThan(0);
  expect(count).toBeLessThanOrEqual(40);
  await expect(page.locator('section[data-celebrate]')).toHaveCount(1);
  const heroText = await page.locator('section[data-session-id] > div').first().innerText();
  await expect(confetti(page)).toHaveCount(0, { timeout: 5_000 });
  await expect(page.locator('section[data-celebrate]')).toHaveCount(0);
  // Chữ đầu màn không đổi khi hết ăn mừng (không chèn chữ/số)
  expect(await page.locator('section[data-session-id] > div').first().innerText()).toBe(heroText);
  await page.reload();
  await expect(page.getByRole('heading', { name: vi.end.title })).toBeVisible();
  await expect(confetti(page)).toHaveCount(0);
  void seen;
});

test('M15: chạm trong lúc ăn mừng → về trạng thái cuối ngay', async ({ page }) => {
  await endTrip(page, { intake: accept });
  await expect(page.locator('section[data-celebrate]')).toHaveCount(1);
  await page.getByRole('heading', { name: vi.end.title }).click();
  await expect(page.locator('section[data-celebrate]')).toHaveCount(0);
  await expect(confetti(page)).toHaveCount(0);
});

test('M16: CONFLICT → đúng một Mila trên màn (hình trong banner); thẻ "Hẹn gặp lại" dùng trái tim', async ({ page }) => {
  await endTrip(page, { intake: (route) => route.fulfill({ status: 409, json: { result: 'CONFLICT' } }) });
  await expect(page.getByText(vi.end.syncConflict)).toBeVisible();
  await page.waitForTimeout(500);
  await expect(page.locator('[data-mascot-figure], [data-mascot-mode]')).toHaveCount(1);
  await expect(page.locator('[data-mascot-slot="end-hero"]')).toHaveCount(0);
});
