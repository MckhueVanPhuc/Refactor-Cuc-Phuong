// Nắng và lá trôi ở đầu màn danh mục (specs/006 T051; quickstart M17; FR-MOT-012): tự dừng ≤ 5 s; không có khi không
// có trang trí; không giao tiêu đề, nút "Gợi ý tuyến" hay Mila.
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
      .map((a) => Number(a.effect!.getComputedTiming().endTime)),
  );

test('M17: nắng và lá chạy một lần, kết thúc ≤ 5 s; không nhận con trỏ; ẩn với công nghệ hỗ trợ', async ({ page }) => {
  await page.reload();
  await expect(page.locator('[data-hero-decor]')).toHaveAttribute('aria-hidden', 'true');
  const ends = await decorAnimations(page);
  expect(ends.length).toBeGreaterThan(0);
  for (const end of ends) expect(end).toBeLessThanOrEqual(5_000);
  expect(await page.locator('[data-hero-decor]').evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('none');
});

test('M17: không có trang trí (tiết kiệm dữ liệu) → lớp nắng/lá không hiện, không animation', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'connection', { value: { saveData: true, addEventListener() {}, removeEventListener() {} }, configurable: true }));
  await open(page);
  await expect(page.locator('[data-hero-decor]')).toBeHidden();
  expect(await decorAnimations(page)).toEqual([]);
});

test.beforeEach(async ({ page }, info) => {
  if (info.title.startsWith('M17: nắng')) await open(page);
});
