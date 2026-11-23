// Tiện ích E2E cho mascot Mila (specs/005 tasks T025, T026; SC-MAS-002). Dùng chung cho project m01 và m02.
import { expect, type Page } from '@playwright/test';

export const PHONE_WIDTHS = [320, 360, 390, 430] as const;

/** Phần tử mascot đang hiển thị: Mila do host render và hình tĩnh INLINE. */
export const MASCOT = '[data-mascot-mode], [data-mascot-figure]';

const PROTECTED = [
  'button',
  'a[href]',
  'input',
  'select',
  'textarea',
  'video',
  'audio',
  '[role="alert"]',
  '[role="status"]',
  '[role="dialog"]',
  '[role="alertdialog"]',
  'h1',
  'p',
].join(', ');

/**
 * Không phần tử Mila nào đè lên nút, liên kết, thông báo, hộp thoại, trình phát, tiêu đề hay đoạn chữ của màn. Phần tử
 * nằm trong Mila (bong bóng, nút đóng) hoặc chứa Mila (khung bao) không tính là đè.
 */
export async function expectMascotOverlapsNothing(page: Page): Promise<void> {
  const overlaps = await page.evaluate(
    ({ mascotSelector, protectedSelector }) => {
      const mascots = [...document.querySelectorAll<HTMLElement>(mascotSelector)].filter((m) => m.getClientRects().length > 0);
      const found: string[] = [];
      for (const mascot of mascots) {
        const a = mascot.getBoundingClientRect();
        for (const other of document.querySelectorAll<HTMLElement>(protectedSelector)) {
          if (mascot.contains(other) || other.contains(mascot) || other.closest('[data-mascot-mode], [data-mascot-figure]')) continue;
          if (other.getClientRects().length === 0) continue;
          const b = other.getBoundingClientRect();
          const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (w > 1 && h > 1) found.push(`${mascot.dataset.mascotMode ?? mascot.dataset.mascotFigure} ∩ ${other.tagName.toLowerCase()} "${(other.textContent ?? '').trim().slice(0, 30)}"`);
        }
      }
      return found;
    },
    { mascotSelector: MASCOT, protectedSelector: PROTECTED },
  );
  expect(overlaps).toEqual([]);
}

/** Không cuộn ngang (WCAG 1.4.10 ở 320 px). */
export async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

/** Kiểm cả hai điều trên ở mọi chiều rộng điện thoại, sau khi `reach` mở đúng màn. */
export async function checkLayoutAcrossWidths(page: Page, reach: () => Promise<void>): Promise<void> {
  for (const width of PHONE_WIDTHS) {
    await page.setViewportSize({ width, height: 780 });
    await reach();
    await expectMascotOverlapsNothing(page);
    await expectNoHorizontalScroll(page);
  }
}

/** Cạnh rộng (px) của hình Mila ở một slot và mode (design-system §9.2, v1.1). */
export async function figureWidth(page: Page, slot: string, mode: string): Promise<number> {
  const figure = page.locator(`[data-mascot-slot="${slot}"] [data-mascot-mode="${mode}"] > :first-child`);
  await expect(figure).toBeVisible({ timeout: 15_000 });
  // Cỡ layout, không tính transform: boundingBox đo giữa animation "enter" (thu phóng) thì ra số nhỏ hơn khi máy bận
  return figure.evaluate((element) => Math.round((element as HTMLElement).offsetWidth));
}
