// Quickstart M01 V4–V7 (US-M01-02 phần duyệt; tasks T046) trên bản build MODE e2e, network mock (project `m01`).
import { expect, test } from '@playwright/test';
import { chooseLanguage, defaultPublication, mockPublication } from './network';

test.use({ locale: 'vi-VN' });

const card = (page: import('@playwright/test').Page, name: string) => page.getByRole('link', { name: new RegExp(name) });

test('V4 — danh mục chỉ A và B, sắp A→Z theo ngôn ngữ; C, D, dòng hỏng không hiện; A có dấu cần tải trước', async ({ page }) => {
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page);
  await expect(card(page, 'Tuyến thử Ao Hồ')).toBeVisible();
  await expect(page.getByRole('listitem').getByRole('heading')).toHaveText(['Tuyến thử Ao Hồ', 'Tuyến thử Bách Thảo']);
  await expect(card(page, 'Tuyến thử Bách Thảo').getByText('Cần tải trước')).toBeVisible();
  await expect(card(page, 'Tuyến thử Ao Hồ').getByText('Cần tải trước')).toHaveCount(0);
  await expect(page.getByText(/Tuyến thử C|Tuyến thử D|Tuyến hỏng/)).toHaveCount(0);

  await page.getByRole('button', { name: 'EN' }).click();
  await expect(page.getByRole('listitem').getByRole('heading')).toHaveText(['Test Botanic trail', 'Test Lakeside walk']);
});

test('V5 — thumbnail của A trả 404: placeholder trung tính, thẻ bấm được', async ({ page }) => {
  const mock = defaultPublication();
  mock.imageFailures.set('fixture/a-thumb.png', 404);
  await mockPublication(page, mock);
  await page.goto('/');
  await chooseLanguage(page);
  const a = card(page, 'Tuyến thử Bách Thảo');
  await expect(a.getByTestId('thumbnail-placeholder')).toBeVisible();
  await expect(card(page, 'Tuyến thử Ao Hồ').locator('img')).toBeVisible();
  await a.click();
  await expect(page).toHaveURL(/\/routes\/route-a$/);
});

test('V6 — mất mạng sau khi đã mở danh mục: local view có nhãn dữ liệu cũ; mở lạnh khi offline: Source unavailable, vẫn vào /offline', async ({
  page,
  context,
}) => {
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page);
  await expect(card(page, 'Tuyến thử Ao Hồ')).toBeVisible();
  // Service worker đã điều khiển trang (clientsClaim) nên chunk lazy có trong precache
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

  await context.setOffline(true);
  await page.getByRole('link', { name: 'Tài nguyên offline' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Quản lý tài nguyên offline' })).toBeVisible();
  await page.getByRole('link', { name: 'Danh mục tuyến' }).click();
  await expect(page.getByText('Dữ liệu đã lưu, có thể chưa phải bản mới nhất.')).toBeVisible();
  await expect(card(page, 'Tuyến thử Ao Hồ')).toBeVisible();

  // Mở lạnh khi offline: app shell từ service worker, không có local view
  await page.reload();
  await expect(page.getByText('Chưa tải được danh sách tuyến. Hãy kiểm tra kết nối và thử lại.')).toBeVisible();
  await page.getByRole('link', { name: 'Tài nguyên offline' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Quản lý tài nguyên offline' })).toBeVisible();
  await context.setOffline(false);
});

test('V7 — Data API không trả lời trong 8 s (provisional): coi là nguồn không khả dụng', async ({ page }) => {
  const mock = defaultPublication();
  mock.delayMs = 9_500;
  await mockPublication(page, mock);
  await page.goto('/');
  await chooseLanguage(page);
  await expect(page.getByTestId('catalog-list')).toHaveAttribute('aria-busy', 'true');
  await expect(page.getByText('Chưa tải được danh sách tuyến. Hãy kiểm tra kết nối và thử lại.')).toBeVisible({
    timeout: 12_000,
  });
  await expect(card(page, 'Tuyến thử Ao Hồ')).toHaveCount(0);
});
