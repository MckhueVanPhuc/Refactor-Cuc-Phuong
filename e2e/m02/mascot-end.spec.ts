// Kết thúc chuyến cùng Mila (specs/005 tasks T044; US-MAS-08; Q12; BR-M02-011). Dựng chuyến như sync.spec.ts
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
const dock = (page: Page) => page.locator('[data-mascot-slot="end-hero"] [data-mascot-mode="DOCK"]');

test('Q12, Q24 — kết thúc sớm (1/3 điểm): Mila ăn mừng một lần (062) rồi đứng yên cạnh huy hiệu; tải lại: chỉ hình tĩnh', async ({ page }) => {
  await endTrip(page, { intake: accept });
  await expect.poll(() => seen(page)).toContain('MSG-MAS-062');
  await expect(page.locator('[data-mascot-message="MSG-MAS-062"]')).toContainText('1');
  await expect(dock(page)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(vi.end.syncSynced)).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: vi.end.title })).toBeVisible();
  await expect(dock(page)).toBeVisible();
  expect(await seen(page)).toEqual([]);
  await expect(page.locator('[data-mascot-mode="CELEBRATE"]')).toHaveCount(0);
});

test('Q23 — quét đủ mọi điểm rồi kết thúc: câu 063 "đủ 3 điểm" thay 062 (MAS-B-064, BR-MAS-23 cấp 3)', async ({ page }) => {
  await endTrip(page, { intake: accept, before: ['Q1a', 'Q2'] });
  await expect.poll(() => seen(page)).toContain('MSG-MAS-063');
  expect(await seen(page)).not.toContain('MSG-MAS-062');
  await expect(page.locator('[data-mascot-message="MSG-MAS-063"]')).toHaveText('Bạn đã quét đủ 3 điểm của tuyến. Tuyệt vời!');
  await expect(dock(page)).toBeVisible({ timeout: 10_000 });
});

test('kết thúc khi mất sóng → "Chờ gửi", Mila nói chuyến đã lưu trên máy (070), không nói "đã gửi"', async ({ page, context }) => {
  // page.route vẫn chạy khi context offline: mock phải tự trả lỗi mạng (như mockIntake của sync.spec.ts)
  await endTrip(page, { intake: (route) => route.abort('internetdisconnected'), offline: context });
  await expect(page.getByText(vi.end.syncPending)).toBeVisible();
  // Trước đó có thể có câu khác của chuyến (v1.1: 030 khi bắt đầu chuyến); chỉ kiểm 062 rồi 070
  await expect.poll(() => seen(page), { timeout: 15_000 }).toContain('MSG-MAS-070');
  const said = await seen(page);
  expect(said.indexOf('MSG-MAS-062')).toBeGreaterThanOrEqual(0);
  expect(said.indexOf('MSG-MAS-062')).toBeLessThan(said.indexOf('MSG-MAS-070'));
  await context.setOffline(false);
});

test('CONFLICT → Mila chỉ là hình cạnh thông báo, không có câu hay nút nào của Mila (BR-M02-011)', async ({ page }) => {
  await endTrip(page, { intake: (route) => route.fulfill({ status: 409, json: { result: 'CONFLICT' } }) });
  const conflict = page.getByText(vi.end.syncConflict).locator('xpath=ancestor::*[@data-end-conflict][1]');
  await expect(conflict).toBeVisible();
  await expect(conflict.locator('[data-mascot-figure]')).toBeVisible();
  await expect(conflict.getByRole('button')).toHaveCount(0);
  expect(await seen(page)).not.toContain('MSG-MAS-070');
});
