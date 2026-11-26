// Không màn nào vuốt ngang được ở cấp trang (WCAG 1.4.10; src/shared/ui/global.css): kể cả khi một phần tử tràn ngang
// (animation, phần tử ẩn định vị tuyệt đối, nội dung dài), thao tác cuộn ngang của người dùng không dịch trang.
import { expect, test, type Page } from '@playwright/test';

async function horizontalScrollAfterGesture(page: Page): Promise<number> {
  // Phần tử rộng gấp nhiều lần màn hình, như một phần tử thoát khỏi bố cục
  await page.evaluate(() => {
    const wide = document.createElement('div');
    wide.setAttribute('data-test-wide', '');
    wide.style.cssText = 'position:absolute;top:0;left:0;width:2000px;height:10px';
    document.body.append(wide);
  });
  await page.mouse.move(100, 200);
  await page.mouse.wheel(600, 0);
  await page.waitForTimeout(300);
  return page.evaluate(() => window.scrollX);
}

for (const width of [320, 390]) {
  test(`${width} px — trang không cuộn ngang dù có phần tử tràn`, async ({ page }) => {
    await page.setViewportSize({ width, height: 780 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    expect(await horizontalScrollAfterGesture(page)).toBe(0);
    expect(['clip', 'hidden']).toContain(await page.evaluate(() => getComputedStyle(document.documentElement).overflowX));
  });
}

test('thanh trên cùng vẫn dính khi cuộn dọc (overflow-x: clip không tạo khung cuộn)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 600 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Tiếng Việt' }).click();
  const header = page.locator('header').first();
  await expect(header).toBeVisible();
  // Đủ dài để cuộn dọc dù danh mục giả có ít tuyến
  await page.evaluate(() => {
    const filler = document.createElement('div');
    filler.style.height = '3000px';
    document.querySelector('main')?.append(filler);
  });
  await page.mouse.move(100, 300);
  await page.mouse.wheel(0, 1500);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
  expect(await header.evaluate((element) => Math.round(element.getBoundingClientRect().top))).toBe(0);
});
