// Mila ăn mừng tiến độ có thật (specs/005 tasks T038; US-MAS-02; Q4–Q6; SC-MAS-005, 009). Hành trình fixture có 3 điểm
// (C1: Q1a, Q1b; C2: Q2; C3: Q3 — điểm cuối), nên không có mốc nửa chặng (cần n ≥ 4).
import { expect, test, type Page } from '@playwright/test';
import { vi } from '../../src/modules/m02/i18n/vi';
import { expectCheckInFeedback, seedValidContext } from './helpers';
import { mockIntakeUnavailable, mockLookup, mockStorage } from './network';

const BASE = 'http://localhost:4173';
type M02TestWindow = { __cpqTestHooks?: { m02?: { scan?: (text: string) => Promise<void> } } };
const bubble = (page: Page, id: string) => page.locator(`[data-mascot-message="${id}"]`);

async function startTrip(page: Page) {
  await page.addInitScript(() => Object.defineProperty(navigator, 'language', { get: () => 'vi-VN' }));
  await mockLookup(page);
  await mockStorage(page);
  await mockIntakeUnavailable(page);
  await page.goto('/');
  await seedValidContext(page);
  await page.goto('/trip');
  await expect(page.getByText(vi.notice.sessionStartHint)).toBeVisible();
}

async function scan(page: Page, qr: string) {
  await expect(page.getByRole('button', { name: vi.trip.scan, exact: true })).toBeVisible();
  await page.waitForFunction(() => Boolean((window as unknown as M02TestWindow).__cpqTestHooks?.m02?.scan));
  await page.evaluate((text) => (window as unknown as M02TestWindow).__cpqTestHooks!.m02!.scan!(text), `${BASE}/q/${qr}`);
  await expect(page).toHaveURL(new RegExp(`/trip/qr/${qr}$`));
}

async function back(page: Page) {
  await page.getByRole('link', { name: vi.content.back }).click();
  await expect(page).toHaveURL(/\/trip$/);
}

test('Q4, Q5 — mã đầu tiên: 051 thay toast (v1.2), nội dung không chờ; mã thứ hai: mốc "còn một điểm" 058; quét lại: không ăn mừng', async ({ page }) => {
  await startTrip(page);
  await expect(page.locator('[data-mascot-mode="DOCK"][data-mascot-pose="binoculars"]')).toBeVisible();

  await scan(page, 'Q1a');
  await expect(page.getByRole('heading', { level: 1, name: 'Đối tượng Q1a' })).toBeVisible();
  await expect(bubble(page, 'MSG-MAS-051')).toHaveText('Đã ghi nhận mã QR đầu tiên! Đọc thử câu chuyện của điểm này nhé.');
  expect(await expectCheckInFeedback(page)).toBe('mascot');

  await back(page);
  // v1.1 (MAS-B-056): quay về sau lượt ghé mới → nhắc cất máy; đóng thì về tư thế bản đồ
  await expect(bubble(page, 'MSG-MAS-056')).toBeVisible();
  await page.getByRole('button', { name: 'Đóng lời nhắn' }).click();
  await expect(page.locator('[data-mascot-mode="DOCK"][data-mascot-pose="map"]')).toBeVisible();
  await scan(page, 'Q2');
  // n = 3, k = 2 = n − 1 → mốc cấp 2 (BR-MAS-23); cấp 1 (050) cần n ≥ 4 nên chỉ có ở unit test
  await expect(bubble(page, 'MSG-MAS-058')).toHaveText('Đã ghi nhận! Chỉ còn một điểm nữa thôi!');

  await back(page);
  await scan(page, 'Q1a');
  await expect(page.getByRole('heading', { level: 1, name: 'Đối tượng Q1a' })).toBeVisible();
  await page.waitForTimeout(400);
  await expect(page.locator('[data-mascot-message]')).toHaveCount(0);
});

test('Q6 (v1.6) — điểm cuối: trang nội dung xác nhận như mọi điểm; về chuyến đi → hộp thoại có một Mila; "Đi tiếp" → 061', async ({ page }) => {
  await startTrip(page);
  await scan(page, 'Q3');
  await expect(bubble(page, 'MSG-MAS-051')).toBeVisible();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await page.getByRole('link', { name: vi.content.back }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText(vi.endPrompt.someLeft({ r: 2 }));
  // Một Mila trên màn: hình trong hộp thoại, Mila đứng trên nút Quét tạm ẩn (spec-Mascot §5.1)
  await expect(dialog.locator('[data-mascot-figure="think"]')).toBeVisible();
  await expect(page.locator('[data-mascot-mode]')).toHaveCount(0);
  await page.waitForFunction(() => {
    const element = document.querySelector('[role="alertdialog"]');
    return Boolean(element?.parentElement && getComputedStyle(element.parentElement).position === 'fixed');
  });
  await page.getByRole('button', { name: vi.endPrompt.continue, exact: true }).click();
  await expect(bubble(page, 'MSG-MAS-061')).toBeVisible();
});
