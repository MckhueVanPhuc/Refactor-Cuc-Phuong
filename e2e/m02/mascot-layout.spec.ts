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

/**
 * Màn kết quả (CHG-MASCOT-2026-11-28-10): khung Mila ở ảnh bìa là `display: contents` nên `expectMascotOverlapsNothing`
 * không đo được nó. Đo trực tiếp hình và bong bóng của Mila với từng dòng chữ của ảnh bìa và thẻ tóm tắt.
 */
async function expectEndHeroClear(page: Page) {
  const overlaps = await page.evaluate(() => {
    const mila = document.querySelector('[data-mascot-slot="end-hero"] [data-mascot-mode]');
    const parts = mila ? [...mila.children].filter((el) => !el.hasAttribute('data-mascot-leaves')) : [];
    const lines = [...document.querySelectorAll('[data-end-hero-text] > *, [data-end-summary] p')].flatMap((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return [...range.getClientRects()].map((rect) => ({ rect, text: (el.textContent ?? '').trim().slice(0, 30) }));
    });
    const found: string[] = [];
    for (const part of parts) {
      const a = part.getBoundingClientRect();
      for (const { rect: b, text } of lines) {
        const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (w > 1 && h > 1) found.push(`${part.className} ∩ "${text}"`);
      }
    }
    return { count: parts.length, found };
  });
  expect(overlaps.count).toBeGreaterThan(0);
  expect(overlaps.found).toEqual([]);
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

test('SCR-M02-003 màn kết quả: lúc ăn mừng ở 320 px, rồi hình tĩnh ở ảnh bìa ở mọi chiều rộng', async ({ page }) => {
  test.slow();
  await prepare(page);
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto('/');
  await seedValidContext(page);
  await page.goto('/trip');
  await scan(page, 'Q3');
  // spec-M02 v3.4 (BR-M02-021): câu hỏi kết thúc chuyến hiện khi về màn chuyến đi
  await page.getByRole('link', { name: vi.content.back }).click();
  await page.waitForFunction(() => {
    const dialog = document.querySelector('[role="alertdialog"]');
    return Boolean(dialog?.parentElement && getComputedStyle(dialog.parentElement).position === 'fixed');
  });
  await page.getByRole('button', { name: vi.endPrompt.end, exact: true }).click();
  await expect(page).toHaveURL(/\/trip\/end$/);
  // Chỗ hẹp nhất lúc Mila ăn mừng (bong bóng bên trái Mila, dưới phụ đề)
  await expect(page.locator('[data-mascot-slot="end-hero"] [data-mascot-mode="CELEBRATE"] [data-mascot-message]')).toBeVisible();
  await expectMascotOverlapsNothing(page);
  await expectEndHeroClear(page);
  await expectNoHorizontalScroll(page);
  // v1.10 (OD-MAS-34): Mila ở ảnh bìa cùng cỡ 104 px khi ăn mừng và khi đứng
  expect(await figureWidth(page, 'end-hero', 'CELEBRATE')).toBe(104);
  await page.screenshot({ path: 'test-results/mascot-end-celebrate-320.png' });
  // v1.5 (DV-92): hết phần ăn mừng (≤ 2,4 s) Mila về DOCK cùng chỗ, câu ăn mừng vẫn hiện
  await expect(page.locator('[data-mascot-slot="end-hero"] [data-mascot-mode="DOCK"]')).toBeVisible({ timeout: 5_000 });
  await expect(page.locator('[data-mascot-slot="end-hero"] [data-mascot-mode="DOCK"] [data-mascot-message]')).toBeVisible();
  expect(await figureWidth(page, 'end-hero', 'DOCK')).toBe(104);
  await checkLayoutAcrossWidths(page, async () => {
    await expect(page.getByRole('heading', { name: vi.end.title })).toBeVisible();
    await expectEndHeroClear(page);
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
