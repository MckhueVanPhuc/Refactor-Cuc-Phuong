// Phản hồi nhấn (specs/006 T017; quickstart M1, M2; design-system §5.4 v1.4): nhấn giữ → co lại, nhả → về; bố cục
// không dịch; giảm chuyển động → chỉ lớp phủ (transform: none).
import { expect, test, type Locator, type Page } from '@playwright/test';
import { chooseLanguage, mockPublication } from './network';

async function pressAndRead(page: Page, target: Locator) {
  await expect(target).toBeVisible();
  // Chờ chuyển cảnh và Mila vào xong để vị trí ổn định
  await page.waitForTimeout(500);
  const box = (await target.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(250);
  const pressed = await target.evaluate((el) => getComputedStyle(el).transform);
  await page.mouse.up();
  return pressed;
}

async function openCatalog(page: Page) {
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page);
}

test('M1: nhấn giữ thẻ tuyến → co lại; thẻ kế bên không dịch', async ({ page }) => {
  await openCatalog(page);
  const cards = page.locator('a[href^="/routes/"]');
  await expect(cards.first()).toBeVisible();
  await page.waitForTimeout(800);
  // Vị trí bố cục (offset, không tính transform) của thẻ kế bên
  const layoutOf = () => cards.nth(1).evaluate((el) => ({ top: (el as HTMLElement).offsetTop, left: (el as HTMLElement).offsetLeft }));
  const neighbour = await layoutOf();
  // Không thả chuột trong lúc đo để không điều hướng
  const box = (await cards.first().boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + 8);
  await page.mouse.down();
  await page.waitForTimeout(250);
  const pressed = await cards.first().evaluate((el) => getComputedStyle(el).transform);
  expect(pressed).toMatch(/^matrix\(0\.9[0-9]+/);
  expect(await layoutOf()).toEqual(neighbour);
  await page.mouse.move(0, 0);
  await page.mouse.up();
});

test('M1: nhấn giữ một ô tiêu chí ở Gợi ý tuyến → co lại', async ({ page }) => {
  await openCatalog(page);
  await page.getByRole('link', { name: 'Gợi ý tuyến' }).click();
  const tile = page.getByText('Ngắn', { exact: false }).first();
  const pressed = await pressAndRead(page, tile);
  expect(pressed).toMatch(/^matrix\(0\.9[0-9]+/);
});

test('M2: giảm chuyển động → không co (chỉ lớp phủ màu)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openCatalog(page);
  await page.getByRole('link', { name: 'Gợi ý tuyến' }).click();
  const tile = page.getByText('Ngắn', { exact: false }).first();
  expect(await pressAndRead(page, tile)).toBe('none');
});
