// Làm quen với Mila (specs/005 tasks T032; US-MAS-01; Q1, Q2, Q13). Build `preview:e2e` bật VITE_FEATURE_MASCOT.
// Câu 001 chỉ hiện ~3,8 s; máy tải nặng có thể bỏ lỡ nếu chỉ nhìn một thời điểm. Một MutationObserver ghi lại mọi câu
// Mila đã nói theo thứ tự (`window.__mascotSeen`), nên test khẳng định thứ tự mà không phụ thuộc giờ.
import { expect, test, type Page } from '@playwright/test';
import { chooseLanguage, mockPublication } from './network';

test.use({ locale: 'vi-VN' });

type SeenWindow = { __mascotSeen?: Array<{ id: string; text: string }> };

async function recordMascot(page: Page) {
  await page.addInitScript(() => {
    const seen: Array<{ id: string; text: string }> = [];
    (window as unknown as SeenWindow).__mascotSeen = seen;
    new MutationObserver(() => {
      for (const element of document.querySelectorAll('[data-mascot-message]')) {
        const id = element.getAttribute('data-mascot-message') ?? '';
        const text = element.textContent ?? '';
        const last = seen[seen.length - 1];
        if (!last || last.id !== id || last.text !== text) seen.push({ id, text });
      }
    }).observe(document, { subtree: true, childList: true, characterData: true, attributes: true });
  });
}

const seenIds = (page: Page) => page.evaluate(() => ((window as unknown as SeenWindow).__mascotSeen ?? []).map((entry) => entry.id));

test('Q1 — chọn ngôn ngữ lần đầu: Mila giới thiệu 001 rồi 002 rồi về DOCK; danh mục vẫn bấm được', async ({ page }) => {
  await recordMascot(page);
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page);
  await expect(page.getByRole('link', { name: /Tuyến thử Ao Hồ/ })).toBeVisible();
  await expect.poll(() => seenIds(page), { timeout: 20_000 }).toEqual(['MSG-MAS-001', 'MSG-MAS-002']);
  await expect(page.locator('[data-mascot-slot="catalog-hero"] [data-mascot-mode="DOCK"]')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('[data-mascot-message]')).toHaveCount(0);
  const texts = await page.evaluate(() => (window as unknown as SeenWindow).__mascotSeen!.map((entry) => entry.text));
  expect(texts[0]).toBe('Chào bạn! Mình là Mila, rái cá thám hiểm của Cúc Phương.');
});

test('Q1b — đổi EN khi Mila đang giới thiệu: cùng câu, chữ tiếng Anh', async ({ page }) => {
  await recordMascot(page);
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page);
  const intro = page.locator('[data-mascot-mode="INTRO"] [data-mascot-message]');
  await expect(intro).toBeVisible();
  const id = await intro.getAttribute('data-mascot-message');
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  const english = { 'MSG-MAS-001': "Hi! I'm Mila, Cúc Phương's otter explorer.", 'MSG-MAS-002': "I'll be with you all the way. Let's pick a route!" };
  await expect(page.locator(`[data-mascot-message="${id}"]`)).toHaveText(english[id as keyof typeof english]);
});

test('Q2 — tải lại (đã có ngôn ngữ): không giới thiệu, chào mừng quay lại một lần', async ({ page }) => {
  await recordMascot(page);
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page);
  await expect.poll(() => seenIds(page)).toContain('MSG-MAS-001');
  await page.reload();
  await expect(page.locator('[data-mascot-message="MSG-MAS-004"]')).toBeVisible();
  expect(await seenIds(page)).toEqual(['MSG-MAS-004']);
  await page.getByRole('button', { name: 'Đóng lời nhắn' }).click();
  await expect(page.locator('[data-mascot-message]')).toHaveCount(0);
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

test('Q16 — danh mục: chạm Mila → 009; chạm lần nữa khi còn hiện → 012 (v1.1, BR-MAS-12)', async ({ page }) => {
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page);
  await page.reload();
  await expect(page.locator('[data-mascot-message="MSG-MAS-004"]')).toBeVisible();
  await page.getByRole('button', { name: 'Đóng lời nhắn' }).click();
  await page.getByRole('button', { name: 'Hỏi Mila' }).click();
  await expect(page.locator('[data-mascot-message="MSG-MAS-009"]')).toBeVisible();
  await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'Hỏi Mila' }).click();
  await expect(page.locator('[data-mascot-message="MSG-MAS-012"]')).toHaveText('Chưa biết chọn tuyến nào? Bấm Gợi ý tuyến nhé.');
});
