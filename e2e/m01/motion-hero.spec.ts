// Nắng và lá trôi ở đầu màn danh mục (specs/006 T051; quickstart M17; FR-MOT-012; CHG-MASCOT-2026-11-25-06 D4): lặp liên tục
// khi có trang trí, dừng bằng công tắc "Hiệu ứng chuyển động"; không có khi không có trang trí; không giao tiêu đề, nút
// "Gợi ý tuyến" hay Mila.
import { expect, test, type Page } from '@playwright/test';
import { chooseLanguage, mockPublication } from './network';

async function open(page: Page) {
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page);
  await expect(page.locator('[data-mascot-slot="catalog-hero"] [data-mascot-mode="DOCK"]')).toBeVisible();
}

const decorAnimations = (page: Page) =>
  page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) => (a.effect as KeyframeEffect | null)?.target instanceof Element && ((a.effect as KeyframeEffect).target as Element).closest('[data-hero-decor]'))
      .map((a) => ({ iterations: Number(a.effect!.getComputedTiming().iterations), state: a.playState })),
  );

test('M17 (v1.6): nắng và lá lặp liên tục; không nhận con trỏ; ẩn với công nghệ hỗ trợ; tắt công tắc → dừng', async ({ page }) => {
  await page.reload();
  await expect(page.locator('[data-hero-decor]')).toHaveAttribute('aria-hidden', 'true');
  const running = await decorAnimations(page);
  expect(running.length).toBeGreaterThan(0);
  for (const animation of running) expect(animation.iterations).toBe(Number.POSITIVE_INFINITY);
  expect(await page.locator('[data-hero-decor]').evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('none');
  // Công tắc tắt → không còn trang trí (WCAG 2.2.2: có cách dừng chuyển động kéo dài hơn 5 s)
  await page.evaluate(() => {
    document.documentElement.dataset['decor'] = 'off';
    document.documentElement.dataset['motion'] = 'reduced';
  });
  await expect(page.locator('[data-hero-decor]')).toBeHidden();
  expect(await decorAnimations(page)).toEqual([]);
});

test('M17: không có trang trí (tiết kiệm dữ liệu) → lớp nắng/lá không hiện, không animation', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'connection', { value: { saveData: true, addEventListener() {}, removeEventListener() {} }, configurable: true }));
  await open(page);
  await expect(page.locator('[data-hero-decor]')).toBeHidden();
  expect(await decorAnimations(page)).toEqual([]);
});

test.beforeEach(async ({ page }, info) => {
  if (info.title.startsWith('M17 (v1.6): nắng')) await open(page);
});
