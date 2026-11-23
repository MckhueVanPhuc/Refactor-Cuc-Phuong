// Mila bình tĩnh về mạng và dữ liệu (spec-Mascot US-MAS-04; specs/005 tasks T053; quickstart Q11) trên bản build MODE
// e2e, project `m02`. Gói của M01 nạp qua hook `m01.seedPackage`; mã đi qua `window.__cpqTestHooks.m02.scan`.
import { expect, test, type Page } from '@playwright/test';
import { readyPackage } from '../../src/modules/m02/api/fake/fixtures';
import { vi } from '../../src/modules/m02/i18n/vi';
import { callM01Hook, dumpStores, seedValidContext } from './helpers';
import { mockIntakeUnavailable, mockLookup, mockStorage } from './network';

const BASE = 'http://localhost:4173';
type M02TestWindow = { __cpqTestHooks?: { m02?: { scan?: (text: string) => Promise<void> } } };

async function startTrip(page: Page, pkg?: ReturnType<typeof readyPackage>) {
  await page.addInitScript(() => Object.defineProperty(navigator, 'language', { get: () => 'vi-VN' }));
  await mockLookup(page);
  await mockStorage(page);
  await mockIntakeUnavailable(page);
  await page.goto('/');
  await seedValidContext(page);
  if (pkg) await callM01Hook(page, 'seedPackage', pkg);
  await page.goto('/trip');
  await expect(page.getByRole('button', { name: vi.trip.scan, exact: true })).toBeVisible();
}

async function scan(page: Page, qrIdentifier: string) {
  await page.waitForFunction(() => Boolean((window as unknown as M02TestWindow).__cpqTestHooks?.m02?.scan));
  await page.evaluate((text) => (window as unknown as M02TestWindow).__cpqTestHooks!.m02!.scan!(text), `${BASE}/q/${qrIdentifier}`);
  await expect(page).toHaveURL(new RegExp(`/trip/qr/${qrIdentifier}$`));
}

const dock = (page: Page) => page.locator('[data-mascot-slot="trip-dock"]');

test('Q11 — mất sóng giữa chuyến → Mila trấn an một lần (074), ảnh Mila vẫn hiện từ precache; có sóng lại → 075', async ({ page, context }) => {
  await startTrip(page);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await expect(dock(page).locator('[data-mascot-message="MSG-MAS-074"]')).toBeVisible();
  // SC-MAS-007 (một phần): ảnh Mila ở DOCK tải được khi mất sóng
  const image = dock(page).locator('img').first();
  await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);

  await page.getByRole('button', { name: 'Đóng lời nhắn' }).click();
  await context.setOffline(false);
  await expect(dock(page).locator('[data-mascot-message="MSG-MAS-075"]')).toBeVisible();
  await page.getByRole('button', { name: 'Đóng lời nhắn' }).click();
  // Mất sóng lần nữa trong cooldown 10 phút: không nhắc lại
  await context.setOffline(true);
  await page.waitForTimeout(1_500);
  await expect(page.locator('[data-mascot-message="MSG-MAS-074"]')).toHaveCount(0);
  await context.setOffline(false);
});

test('MAS-B-052 — mã live ngoài hành trình → Mila nói không tính vào hành trình; không có lượt ghé mới', async ({ page }) => {
  await startTrip(page);
  await scan(page, 'QX');
  await expect(page.locator('[data-mascot-slot="content-toast"] [data-mascot-message="MSG-MAS-052"]')).toBeVisible();
  expect((await dumpStores(page, ['checkpointVisits'])).checkpointVisits).toEqual([]);
});

test('MAS-B-054 (v1.2) — mất sóng, mở lại điểm đã quét từ gói → Mila minh họa cạnh câu nguồn dự phòng, không câu', async ({ page, context }) => {
  await startTrip(page, readyPackage());
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await scan(page, 'Q1a');
  await expect(page.getByText(vi.notice.sourceFailureInJourney)).toBeVisible();
  await page.getByRole('link', { name: vi.content.back }).click();
  await expect(page.getByRole('button', { name: vi.trip.scan, exact: true })).toBeVisible();

  // Quét lại cùng điểm: không lượt ghé mới, nên không có lời xác nhận của Mila chen vào
  await scan(page, 'Q1a');
  const notice = page.getByRole('status').filter({ hasText: vi.notice.sourceFailureInJourney });
  await expect(notice.locator('[data-mascot-figure="backpack"]')).toBeVisible();
  await expect(page.locator('[data-mascot-message="MSG-MAS-054"]')).toHaveCount(0);
  await context.setOffline(false);
});
