// Mila xác nhận lượt ghé thay toast (specs/005 tasks T098; spec-Mascot v1.2 BR-MAS-24; quickstart Q27–Q29; SC-MAS-015).
// Hành trình fixture có 3 điểm (C1: Q1a, Q1b; C2: Q2; C3: Q3 — điểm cuối). Bản build e2e bật cờ Mila; lượt chạy M02 với
// cờ tắt (unit test ContentPage, QrLinkPage) vẫn thấy toast.
import { expect, test, type Page } from '@playwright/test';
import { vi } from '../../src/modules/m02/i18n/vi';
import { expectCheckInFeedback, seedValidContext, visitBubble } from './helpers';
import { mockIntakeUnavailable, mockLookup, mockStorage } from './network';

const BASE = 'http://localhost:4173';
type M02TestWindow = { __cpqTestHooks?: { m02?: { scan?: (text: string) => Promise<void> } } };

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
  await page.waitForFunction(() => Boolean((window as unknown as M02TestWindow).__cpqTestHooks?.m02?.scan));
  await page.evaluate((text) => (window as unknown as M02TestWindow).__cpqTestHooks!.m02!.scan!(text), `${BASE}/q/${qr}`);
  await expect(page).toHaveURL(new RegExp(`/trip/qr/${qr}$`));
  await expect(page.getByRole('heading', { level: 1, name: `Đối tượng ${qr}` })).toBeVisible();
}

async function back(page: Page) {
  await page.getByRole('link', { name: vi.content.back }).click();
  await expect(page).toHaveURL(/\/trip$/);
}

test.describe('Mila hiện được', () => {
  test('Q27 — mã đầu tiên và "còn một điểm": chỉ bong bóng của Mila (role="status"), không toast', async ({ page }) => {
    await startTrip(page);

    await scan(page, 'Q1a');
    expect(await expectCheckInFeedback(page)).toBe('mascot');
    await expect(visitBubble(page)).toHaveText('Đã ghi nhận mã QR đầu tiên! Đọc thử câu chuyện của điểm này nhé.');
    await expect(page.locator('[data-mascot-mode="AVATAR"]')).toHaveAttribute('data-mascot-animation', 'milestone');

    await back(page);
    await scan(page, 'Q2');
    expect(await expectCheckInFeedback(page)).toBe('mascot');
    await expect(visitBubble(page)).toHaveText('Đã ghi nhận! Chỉ còn một điểm nữa thôi!');
  });

  test('Q29 (v1.6) — điểm cuối: Mila xác nhận như mọi điểm, không hộp thoại ở trang nội dung; về chuyến đi → hộp thoại', async ({ page }) => {
    await startTrip(page);
    await scan(page, 'Q3');
    expect(await expectCheckInFeedback(page)).toBe('mascot');
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    await back(page);
    await expect(page.getByRole('alertdialog')).toContainText(vi.endPrompt.someLeft({ r: 2 }));
  });
});

test.describe('Mila không hiện được', () => {
  // Ảnh precache do service worker trả thì page.route không chặn được
  test.use({ serviceWorkers: 'block' });

  test('Q28 — ảnh Mila hỏng → Mila ẩn, toast "Đã ghi nhận lượt quét." hiện như cũ', async ({ page }) => {
    await page.route('**/assets/ma-*', (route) => route.abort());
    await startTrip(page);
    await scan(page, 'Q1a');
    expect(await expectCheckInFeedback(page)).toBe('toast');
    await expect(page.locator('[data-mascot-mode]')).toHaveCount(0);
  });
});
