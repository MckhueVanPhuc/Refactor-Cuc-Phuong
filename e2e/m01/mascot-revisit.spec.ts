// Mila có mặt mỗi lần vào màn (spec-Mascot v1.6, CHG-MASCOT-2026-11-25-06 D1, D3): Gợi ý tuyến đứng và chào mỗi lần mở,
// kể cả khi trang đã tải sẵn (lần thứ hai trở đi); chạm Mila ra câu của chính màn đó (BR-MAS-12 v1.6).
import { expect, test, type Page } from '@playwright/test';
import { chooseLanguage, mockPublication } from './network';

test.use({ locale: 'vi-VN' });

const ASK = 'Hỏi Mila';
const message = (page: Page, slot: string, id: string) => page.locator(`[data-mascot-slot="${slot}"] [data-mascot-message="${id}"]`);

async function choose(page: Page, group: string, option: string) {
  await page.getByRole('radiogroup', { name: group }).getByRole('radio', { name: option, exact: true }).check();
}

test('Gợi ý tuyến: Mila đứng và chào ở mọi lần mở (link, Back, Đổi tiêu chí)', async ({ page }) => {
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page);
  for (let visit = 0; visit < 3; visit += 1) {
    await page.getByRole('link', { name: 'Gợi ý tuyến' }).click();
    await expect(page).toHaveURL(/\/recommend$/);
    await expect(message(page, 'recommend-head', 'MSG-MAS-010')).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
  }
  await page.goForward();
  await expect(message(page, 'recommend-head', 'MSG-MAS-010')).toBeVisible();

  await choose(page, 'Thời gian', 'Vừa (trên 90 đến 180 phút)');
  await choose(page, 'Đối tượng', 'Gia đình có trẻ nhỏ');
  await choose(page, 'Trải nghiệm', 'Khám phá');
  await page.getByRole('button', { name: 'Xem tuyến phù hợp' }).click();
  await expect(message(page, 'recommend-head', 'MSG-MAS-011')).toBeVisible();
  await page.getByRole('button', { name: 'Đổi tiêu chí' }).first().click();
  await expect(page).toHaveURL(/\/recommend$/);
  await expect(message(page, 'recommend-head', 'MSG-MAS-010')).toBeVisible();
});

test('Chạm Mila: mỗi màn M01 có câu riêng (form → 010/015, kết quả → 016)', async ({ page }) => {
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page);
  await page.getByRole('link', { name: 'Gợi ý tuyến' }).click();
  const mila = page.locator('[data-mascot-slot="recommend-head"] [data-mascot-mode]');
  await expect(message(page, 'recommend-head', 'MSG-MAS-010')).toBeVisible();
  await mila.getByRole('button', { name: ASK }).click();
  await expect(message(page, 'recommend-head', 'MSG-MAS-015')).toBeVisible();
  await expect(page.locator('[data-mascot-message="MSG-MAS-009"], [data-mascot-message="MSG-MAS-012"]')).toHaveCount(0);

  await choose(page, 'Thời gian', 'Vừa (trên 90 đến 180 phút)');
  await choose(page, 'Đối tượng', 'Gia đình có trẻ nhỏ');
  await choose(page, 'Trải nghiệm', 'Khám phá');
  await page.getByRole('button', { name: 'Xem tuyến phù hợp' }).click();
  await expect(message(page, 'recommend-head', 'MSG-MAS-011')).toBeVisible();
  await mila.getByRole('button', { name: ASK }).click();
  await expect(message(page, 'recommend-head', 'MSG-MAS-016')).toBeVisible();
});
