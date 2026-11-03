// Quickstart M01 V24 (tasks T094; constitution VI; spec-M01 §9.3): offline sau khi đã mở app, tải lại `/`, `/routes/A`,
// `/q/{id}` từ app shell; đổi VI/EN được; không request `/rest/v1` hay `/storage/v1` nào được trả từ Cache Storage.
import { expect, test } from '@playwright/test';
import { chooseLanguage, mockPublication } from './network';

test.use({ locale: 'vi-VN' });

test('V24 — offline: app shell phục vụ /, /routes/route-a, /q/{id}; VI/EN đổi được; không cache API hay media', async ({
  page,
  context,
}) => {
  const fromCache: string[] = [];
  page.on('response', (response) => {
    if (response.fromServiceWorker() && /\/(rest|storage)\/v1\//.test(response.url())) fromCache.push(response.url());
  });

  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page);
  await page.getByRole('link', { name: /Tuyến thử Bách Thảo/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Tuyến thử Bách Thảo' })).toBeVisible();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

  await context.setOffline(true);

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Danh mục tuyến' })).toBeVisible();
  await expect(page.getByText('Chưa tải được danh sách tuyến. Hãy kiểm tra kết nối và thử lại.')).toBeVisible();
  await page.getByRole('button', { name: 'EN' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Routes' })).toBeVisible();
  await page.getByRole('button', { name: 'VI' }).click();

  await page.goto('/routes/route-a');
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  // Trang link QR thuộc M02 (chưa cài): chỉ kiểm app shell được phục vụ từ service worker khi offline
  const qr = await page.goto('/q/qr-a1-1');
  expect(qr?.fromServiceWorker()).toBe(true);
  await expect(page.locator('#root')).not.toBeEmpty();

  const cachedUrls = await page.evaluate(async () => {
    const urls: string[] = [];
    for (const name of await caches.keys()) {
      for (const request of await (await caches.open(name)).keys()) urls.push(request.url);
    }
    return urls;
  });
  expect(cachedUrls.length).toBeGreaterThan(0);
  expect(cachedUrls.filter((url) => /\/(rest|storage|auth)\/v1\//.test(url))).toEqual([]);
  expect(fromCache).toEqual([]);
  await context.setOffline(false);
});
