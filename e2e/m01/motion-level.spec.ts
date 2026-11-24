// Mức chuyển động trên <html> (specs/006 T016; quickstart M8, M9; data-model §2): công tắc "Hiệu ứng chuyển động",
// giảm chuyển động, tiết kiệm dữ liệu, máy yếu.
import { expect, test, type Page } from '@playwright/test';
import { chooseLanguage, mockPublication } from './network';

const attrs = (page: Page) =>
  page.evaluate(() => ({ motion: document.documentElement.dataset['motion'], decor: document.documentElement.dataset['decor'] }));

async function open(page: Page) {
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page);
}

test('mặc định: full, trang trí bật; tắt công tắc ở Tài nguyên → reduced ở mọi màn; bật lại → full', async ({ page }) => {
  await open(page);
  await expect.poll(() => attrs(page)).toEqual({ motion: 'full', decor: 'on' });
  await page.getByRole('link', { name: 'Tài nguyên' }).click();
  const control = page.getByRole('switch', { name: /Hiệu ứng chuyển động/ });
  await control.click();
  await expect(control).toHaveAttribute('aria-checked', 'false');
  await page.getByRole('link', { name: 'Tuyến', exact: true }).click();
  await expect.poll(() => attrs(page)).toEqual({ motion: 'reduced', decor: 'off' });
  await page.getByRole('link', { name: 'Tài nguyên' }).click();
  await control.click();
  await expect.poll(() => attrs(page)).toEqual({ motion: 'full', decor: 'on' });
});

test('thiết bị giảm chuyển động → reduced; công tắc khởi đầu tắt', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  await expect.poll(() => attrs(page)).toEqual({ motion: 'reduced', decor: 'off' });
  await page.getByRole('link', { name: 'Tài nguyên' }).click();
  await expect(page.getByRole('switch', { name: /Hiệu ứng chuyển động/ })).toHaveAttribute('aria-checked', 'false');
});

test('tiết kiệm dữ liệu → full nhưng không trang trí (M9)', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'connection', { value: { saveData: true, addEventListener() {}, removeEventListener() {} }, configurable: true }));
  await open(page);
  await expect.poll(() => attrs(page)).toEqual({ motion: 'full', decor: 'off' });
});

test('bộ nhớ thiết bị ≤ 2 GB → full nhưng không trang trí (M9)', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'deviceMemory', { value: 2, configurable: true }));
  await open(page);
  await expect.poll(() => attrs(page)).toEqual({ motion: 'full', decor: 'off' });
});
