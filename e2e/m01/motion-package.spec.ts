// Thanh "đang tải" của gói và dấu ✓ (specs/006 T030; quickstart M10; FR-MOT-005): không xác định, không số; xong có ✓;
// lỗi thì bỏ thanh, câu lỗi như cũ.
import { expect, test, type Page } from '@playwright/test';
import { callM01Hook } from './helpers';
import { chooseLanguage, defaultPublication, mockPublication, type PublicationMock } from './network';

test.use({ locale: 'vi-VN' });

const panel = (page: Page) => page.getByRole('region', { name: 'Gói tải trước' });

async function openA(page: Page, mock: PublicationMock = defaultPublication()) {
  await mockPublication(page, mock);
  await page.goto('/');
  await chooseLanguage(page);
  await page.goto('/routes/route-a');
  await expect(page.getByRole('button', { name: 'Bắt đầu' })).toBeVisible();
}

test('M10: đang tải → thanh không xác định, không phần trăm; xong → dấu ✓, thanh mất', async ({ page }) => {
  const mock = defaultPublication();
  mock.imageDelayMs = 800;
  await openA(page, mock);
  await panel(page).getByRole('button', { name: 'Tải về' }).click();
  const bar = panel(page).getByRole('progressbar', { name: 'Đang tải' });
  await expect(bar).toBeVisible();
  expect(await bar.getAttribute('aria-valuenow')).toBeNull();
  await expect(panel(page)).not.toContainText('%');
  await expect(panel(page).locator('[data-package-ready]')).toBeVisible({ timeout: 15_000 });
  await expect(bar).toHaveCount(0);
  await expect(panel(page).getByText('Sẵn sàng – mới nhất')).toBeVisible();
});

test('M10: máy không cho lưu → không thanh, không ✓, câu lỗi cố định như cũ', async ({ page }) => {
  await openA(page);
  await callM01Hook(page, 'failNextActivation');
  await panel(page).getByRole('button', { name: 'Tải về' }).click();
  await expect(panel(page).getByRole('alert')).toBeVisible();
  await expect(panel(page).getByRole('progressbar')).toHaveCount(0);
  await expect(panel(page).locator('[data-package-ready]')).toHaveCount(0);
});
