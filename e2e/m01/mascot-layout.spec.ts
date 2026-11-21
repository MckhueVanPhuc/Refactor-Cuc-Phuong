// Bố cục Mila trên màn M01 (specs/005 tasks T026; SC-MAS-002): ở 320–430 px, Mila không đè phần tử nào, không cuộn
// ngang. Chạy lại sau mỗi story thêm slot.
import { expect, test } from '@playwright/test';
import { checkLayoutAcrossWidths } from '../mascot-helpers';
import { chooseLanguage, mockPublication } from './network';

// Bốn chiều rộng × nhiều màn: lâu hơn mức 30 s mặc định khi máy tải nặng
test.describe.configure({ timeout: 120_000 });

test.use({ locale: 'vi-VN' });

test('SCR-M01-001…004', async ({ page }) => {
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page);
  await checkLayoutAcrossWidths(page, async () => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Tuyến thử Ao Hồ/ })).toBeVisible();
  });
  await checkLayoutAcrossWidths(page, async () => {
    await page.goto('/recommend');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
  await checkLayoutAcrossWidths(page, async () => {
    await page.goto('/');
    await page.getByRole('link', { name: /Tuyến thử Ao Hồ/ }).click();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
  await checkLayoutAcrossWidths(page, async () => {
    await page.goto('/offline');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
