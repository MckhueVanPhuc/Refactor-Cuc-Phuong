// Bố cục Mila trên màn M02 (specs/005 tasks T026; SC-MAS-002): ở 320–430 px, Mila không đè phần tử nào, không cuộn
// ngang. Chạy lại sau mỗi story thêm slot.
import { expect, test, type Page } from '@playwright/test';
import { vi } from '../../src/modules/m02/i18n/vi';
import { checkLayoutAcrossWidths, expectMascotOverlapsNothing, expectNoHorizontalScroll, figureWidth } from '../mascot-helpers';
import { seedValidContext } from './helpers';
import { mockIntakeUnavailable, mockLookup, mockStorage } from './network';

const BASE = 'http://localhost:4173';
type M02TestWindow = { __cpqTestHooks?: { m02?: { scan?: (text: string) => Promise<void> } } };

async function prepare(page: Page) {
  await page.addInitScript(() => Object.defineProperty(navigator, 'language', { get: () => 'vi-VN' }));
  await mockLookup(page);
  await mockStorage(page);
  await mockIntakeUnavailable(page);
}

async function scan(page: Page, qr: string) {
  // Màn chuyến đi phải đã đăng ký bộ nhận mã
  await expect(page.getByRole('button', { name: vi.trip.scan, exact: true })).toBeVisible();
  await page.waitForFunction(() => Boolean((window as unknown as M02TestWindow).__cpqTestHooks?.m02?.scan));
  await page.evaluate((text) => (window as unknown as M02TestWindow).__cpqTestHooks!.m02!.scan!(text), `${BASE}/q/${qr}`);
}

// Bốn chiều rộng × nhiều màn: lâu hơn mức 30 s mặc định khi máy tải nặng
test.describe.configure({ timeout: 120_000 });

test('SCR-M02-001 chuyến đi và SCR-M02-002 nội dung', async ({ page }) => {
  await prepare(page);
  await page.goto('/');
  await seedValidContext(page);
  await checkLayoutAcrossWidths(page, async () => {
    await page.goto('/trip');
    await expect(page.getByRole('button', { name: vi.trip.scan, exact: true })).toBeVisible();
  });
  await checkLayoutAcrossWidths(page, async () => {
    await page.goto('/trip');
    await scan(page, 'Q1a');
    await expect(page).toHaveURL(/\/trip\/qr\/Q1a$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test('v1.1 — cỡ Mila (design-system §9.2): chuyến đi 128 px, avatar trang nội dung 56 px', async ({ page }) => {
  await prepare(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await seedValidContext(page);
  await page.goto('/trip');
  expect(await figureWidth(page, 'trip-dock', 'DOCK')).toBe(128);
  await scan(page, 'Q1a');
  expect(await figureWidth(page, 'content-toast', 'AVATAR')).toBe(56);
});

test('SCR-M02-003 màn kết quả: lúc ăn mừng ở 320 px, rồi hình tĩnh cạnh huy hiệu ở mọi chiều rộng', async ({ page }) => {
  await prepare(page);
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto('/');
  await seedValidContext(page);
  await page.goto('/trip');
  await scan(page, 'Q3');
  await page.waitForFunction(() => {
    const dialog = document.querySelector('[role="alertdialog"]');
    return Boolean(dialog?.parentElement && getComputedStyle(dialog.parentElement).position === 'fixed');
  });
  await page.getByRole('button', { name: vi.endPrompt.end, exact: true }).click();
  await expect(page).toHaveURL(/\/trip\/end$/);
  // Chỗ hẹp nhất lúc Mila lớn nhất (CELEBRATE, bong bóng trên Mila)
  await expect(page.locator('[data-mascot-slot="end-hero"] [data-mascot-mode="CELEBRATE"] [data-mascot-message]')).toBeVisible();
  await expectMascotOverlapsNothing(page);
  await expectNoHorizontalScroll(page);
  // Ở 320 px, Mila ăn mừng co lại vừa chỗ cạnh huy hiệu (không quá cỡ xl 200 px)
  const celebrate = await figureWidth(page, 'end-hero', 'CELEBRATE');
  expect(celebrate).toBeGreaterThanOrEqual(120);
  expect(celebrate).toBeLessThanOrEqual(200);
  await page.screenshot({ path: 'test-results/mascot-end-celebrate-320.png' });
  await expect(page.locator('[data-mascot-slot="end-hero"] [data-mascot-mode="DOCK"]')).toBeVisible({ timeout: 10_000 });
  expect(await figureWidth(page, 'end-hero', 'DOCK')).toBe(104);
  await checkLayoutAcrossWidths(page, async () => {
    await expect(page.getByRole('heading', { name: vi.end.title })).toBeVisible();
  });
  await page.screenshot({ path: 'test-results/mascot-end-dock-430.png' });
});

test('SCR-M02-004 trang mở từ mã QR (khách tự do)', async ({ page }) => {
  await prepare(page);
  await checkLayoutAcrossWidths(page, async () => {
    await page.goto('/q/Q1a');
    await expect(page.getByText(vi.notice.freeVisitor)).toBeVisible();
  });
});
