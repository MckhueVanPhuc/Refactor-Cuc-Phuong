// Làm quen với Mila (specs/005 tasks T032; US-MAS-01; Q1, Q2, Q13). Build `preview:e2e` bật VITE_FEATURE_MASCOT.
import { expect, test } from '@playwright/test';
import { chooseLanguage, mockPublication } from './network';

test.use({ locale: 'vi-VN' });

const bubble = (page: import('@playwright/test').Page, id: string) => page.locator(`[data-mascot-message="${id}"]`);

test('Q1 — chọn ngôn ngữ lần đầu: Mila giới thiệu 001 rồi 002, danh mục vẫn bấm được; đổi EN giữ câu', async ({ page }) => {
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page);
  await expect(bubble(page, 'MSG-MAS-001')).toHaveText('Chào bạn! Mình là Mila, rái cá thám hiểm của Cúc Phương.');
  await expect(page.locator('[data-mascot-mode="INTRO"]')).toBeVisible();
  await expect(page.getByRole('link', { name: /Tuyến thử Ao Hồ/ })).toBeVisible();

  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(bubble(page, 'MSG-MAS-001')).toHaveText("Hi! I'm Mila, Cúc Phương's otter explorer.");
  await expect(bubble(page, 'MSG-MAS-002')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('[data-mascot-mode="DOCK"]')).toBeVisible({ timeout: 10_000 });
});

test('Q2 — tải lại (đã có ngôn ngữ): không giới thiệu, chào mừng quay lại một lần', async ({ page }) => {
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page);
  await expect(bubble(page, 'MSG-MAS-001')).toBeVisible();
  await page.reload();
  await expect(bubble(page, 'MSG-MAS-004')).toBeVisible();
  await expect(bubble(page, 'MSG-MAS-001')).toHaveCount(0);
  await page.getByRole('button', { name: 'Đóng lời nhắn' }).click();
  await expect(bubble(page, 'MSG-MAS-004')).toHaveCount(0);
  await expect(page.locator('[data-mascot-mode="DOCK"]')).toBeVisible();
});

test('Q13 — giảm chuyển động: Mila hiện nhưng không animation nào chạy (SC-MAS-008)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page);
  const mascot = page.locator('[data-mascot-mode]');
  await expect(mascot).toBeVisible();
  const running = await mascot.evaluate((element) => element.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length);
  expect(running).toBe(0);
});
