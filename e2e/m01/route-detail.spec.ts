// Quickstart M01 V8 và chi tiết tuyến A offline có gói (US-M01-06; SC-M01-008; tasks T053), project `m01`.
import { expect, test } from '@playwright/test';
import { publicationFixture } from '../../src/shared/contracts/__fixtures__/publication';
import { packageFromPublication } from '../../src/modules/m01/testing/packageFixture';
import { callM01Hook } from './helpers';
import { chooseLanguage, mockPublication } from './network';

test.use({ locale: 'vi-VN' });

test('V8 — chi tiết A online: đủ trường bắt buộc, cảnh báo an toàn nổi bật, không có Thời điểm phù hợp, điểm dừng 1, 2, 3', async ({
  page,
}) => {
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page);
  await page.getByRole('link', { name: /Tuyến thử Bách Thảo/ }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'Tuyến thử Bách Thảo' })).toBeVisible();
  await expect(page.getByText('2,4 km')).toBeVisible();
  await expect(page.getByText('150 phút')).toBeVisible();
  await expect(page.getByText('Mô tả đầy đủ tuyến A')).toBeVisible();
  await expect(page.getByText('Cổng thử A')).toBeVisible();
  await expect(page.getByRole('note', { name: 'Cảnh báo an toàn' })).toContainText('Cảnh báo an toàn tuyến A');
  await expect(page.getByText('Thời điểm phù hợp')).toHaveCount(0);
  await expect(page.getByRole('list', { name: 'Các điểm dừng' }).getByRole('listitem')).toHaveText([
    '1Điểm thử A1',
    '2Điểm thử A2',
    '3Điểm thử A3',
  ]);
  await expect(page.getByRole('img', { name: 'Sơ đồ tuyến' })).toBeVisible();
});

test('SC-M01-008 — chi tiết A offline có gói: chữ cốt lõi đã lưu và câu "Thông tin được lưu lúc …"', async ({ page, context }) => {
  const { routes, snapshots } = publicationFixture();
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page);
  await callM01Hook(page, 'seedPackage', packageFromPublication(routes.A, snapshots.A));
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

  await context.setOffline(true);
  await page.goto('/routes/route-a');
  await expect(page.getByRole('heading', { level: 1, name: 'Tuyến thử Bách Thảo' })).toBeVisible();
  await expect(page.getByText(/^Thông tin được lưu lúc .+, có thể không phải bản mới nhất$/)).toBeVisible();
  await expect(page.getByText('Cổng thử A')).toBeVisible();
  await expect(page.getByRole('note', { name: 'Cảnh báo an toàn' })).toBeVisible();
  await expect(page.getByText('Mô tả đầy đủ tuyến A')).toHaveCount(0);
  await expect(page.getByTestId('cover-placeholder')).toBeVisible();
  // Sơ đồ offline của gói hiện từ byte đã lưu
  await expect(page.getByRole('img', { name: 'Sơ đồ tuyến' })).toBeVisible();
  await context.setOffline(false);
});
