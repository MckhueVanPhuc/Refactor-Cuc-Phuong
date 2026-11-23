// Làm quen với Mila (specs/005 tasks T032; US-MAS-01; Q1, Q2, Q13). Build `preview:e2e` bật VITE_FEATURE_MASCOT.
// v1.3: lời giới thiệu là lớp phủ chờ chạm (US-MAS-01; Q30, Q31). Một MutationObserver ghi lại mọi câu Mila đã nói theo
// thứ tự (`window.__mascotSeen`), nên test khẳng định thứ tự mà không phụ thuộc giờ.
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

const intro = (page: Page) => page.getByRole('dialog', { name: 'Mila' });
const heroDock = (page: Page) => page.locator('[data-mascot-slot="catalog-hero"] [data-mascot-mode="DOCK"]');

test('Q1, Q30 — chọn ngôn ngữ lần đầu: lớp phủ giới thiệu một câu ở giữa màn, chạm để đọc hết rồi chạm để đóng → Mila ở hero', async ({ page }) => {
  await recordMascot(page);
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page, 'Tiếng Việt', { keepIntro: true });
  await expect(intro(page)).toBeVisible();
  await expect(intro(page).locator('[data-mascot-message="MSG-MAS-001"]')).toHaveText('Chào bạn! Mình là Mila, rái cá thám hiểm của Cúc Phương. Mình sẽ đồng hành cùng bạn trong suốt chuyến tham quan này. Cùng chọn một tuyến nhé!');
  await expect(intro(page)).toContainText('Chạm để bắt đầu');
  // Không có nút "Bỏ qua" hay nút đóng ×
  await expect(intro(page).getByRole('button')).toHaveCount(0);
  await expect(intro(page)).toBeFocused();
  // Mila và bong bóng ở giữa màn theo chiều dọc
  const box = (await intro(page).locator('[data-mascot-message]').boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(box.y).toBeGreaterThan(viewport.height * 0.1);
  expect(box.y + box.height).toBeLessThan(viewport.height * 0.75);
  // Lớp phủ không tự đóng
  await page.waitForTimeout(1_500);
  await expect(intro(page)).toBeVisible();
  // Chạm lần đầu: nếu chữ còn đang hiện thì hiện hết; chạm tới khi đóng
  await intro(page).click({ position: { x: 10, y: 10 } });
  if (await intro(page).isVisible()) await intro(page).click({ position: { x: 10, y: 10 } });
  await expect(intro(page)).toHaveCount(0);
  await expect(heroDock(page)).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: /Danh mục tuyến/ })).toBeFocused();
  await expect(page.getByRole('link', { name: /Tuyến thử Ao Hồ/ })).toBeVisible();
  expect(await seenIds(page)).toEqual(['MSG-MAS-001']);
});

test('Q31 — lớp phủ đang mở: nút Back hoặc Esc đóng, vẫn ở danh mục', async ({ page }) => {
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page, 'Tiếng Việt', { keepIntro: true });
  await expect(intro(page)).toBeVisible();
  await page.waitForTimeout(100);
  await page.goBack();
  await expect(intro(page)).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
  await expect(heroDock(page)).toBeVisible();
  await expect(page.getByRole('link', { name: /Tuyến thử Ao Hồ/ })).toBeVisible();
});

test('Q31b — Esc đóng lớp phủ', async ({ page }) => {
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page, 'Tiếng Việt', { keepIntro: true });
  await expect(intro(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(intro(page)).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
  await expect(heroDock(page)).toBeVisible();
});

test('Q1b — đổi EN trước khi chọn: lời giới thiệu tiếng Anh', async ({ page }) => {
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page, 'English', { keepIntro: true });
  await expect(intro(page).locator('[data-mascot-message="MSG-MAS-001"]')).toHaveText(
    "Hi! I'm Mila, Cúc Phương's otter explorer. I'll be with you throughout this visit. Let's pick a route!",
  );
  await expect(intro(page)).toContainText('Tap to start');
});

test('Q2 — tải lại (đã có ngôn ngữ): không giới thiệu, chào mừng quay lại một lần', async ({ page }) => {
  await recordMascot(page);
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page);
  await page.reload();
  await expect(page.locator('[data-mascot-message="MSG-MAS-004"]')).toBeVisible();
  expect(await seenIds(page)).toEqual(['MSG-MAS-004']);
  await expect(intro(page)).toHaveCount(0);
  await page.getByRole('button', { name: 'Đóng lời nhắn' }).click();
  await expect(page.locator('[data-mascot-message]')).toHaveCount(0);
  await expect(page.locator('[data-mascot-mode="DOCK"]')).toBeVisible();
});

test('Q13 — giảm chuyển động: lớp phủ và Mila hiện nhưng không animation nào chạy, chữ hiện ngay (SC-MAS-008)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page, 'Tiếng Việt', { keepIntro: true });
  await expect(intro(page)).toBeVisible();
  await expect(intro(page).locator('[data-mascot-typed]')).toHaveCount(0);
  const running = await intro(page).evaluate((element) => element.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length);
  expect(running).toBe(0);
  // Chữ đã hiện ngay: một lần chạm là đóng
  await intro(page).click({ position: { x: 10, y: 10 } });
  await expect(intro(page)).toHaveCount(0);
  const mascot = page.locator('[data-mascot-mode]');
  await expect(mascot).toBeVisible();
  expect(await mascot.evaluate((element) => element.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length)).toBe(0);
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
  await expect(page.locator('[data-mascot-message="MSG-MAS-012"]')).toHaveText('Bấm Gợi ý tuyến, mình chọn giúp theo thời gian và sở thích của bạn.');
});
