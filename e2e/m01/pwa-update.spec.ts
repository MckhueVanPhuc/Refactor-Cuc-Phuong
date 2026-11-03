// Quickstart M01 V25 (tasks T095; constitution VI; research R-14): có bản mới khi tab khác đang tải gói → lời nhắc hiện
// nhưng chỉ áp dụng sau khi tải xong. Bản mới được giả lập bằng hook `simulateAppUpdate` (MODE e2e): dựng lại bản build
// giữa chừng test không khả thi; phần áp dụng thật của service worker (`updateSW(true)`) không được kiểm ở đây.
import { expect, test } from '@playwright/test';
import { callM01Hook } from './helpers';
import { chooseLanguage, defaultPublication, mockPublication } from './network';

test.use({ locale: 'vi-VN' });

test('V25 — tab A đang tải gói; tab B có bản mới: Cập nhật bị hoãn tới khi tải xong', async ({ page, context }) => {
  const mock = defaultPublication();
  mock.imageDelayMs = 4_000;
  await mockPublication(page, mock);
  await page.goto('/');
  await chooseLanguage(page);
  await page.goto('/routes/route-a');
  await page.getByRole('region', { name: 'Gói tải trước' }).getByRole('button', { name: 'Tải về' }).click();
  await expect(page.getByRole('region', { name: 'Gói tải trước' }).getByText('Đang tải')).toBeVisible();

  const tabB = await context.newPage();
  await mockPublication(tabB, mock);
  await tabB.goto('/');
  await callM01Hook(tabB, 'simulateAppUpdate');
  const prompt = tabB.getByRole('status').filter({ hasText: 'Đã có phiên bản mới của ứng dụng.' });
  await expect(prompt).toBeVisible();

  await prompt.getByRole('button', { name: 'Cập nhật' }).click();
  await expect(prompt).toBeVisible();
  expect(await tabB.evaluate(() => document.documentElement.dataset.e2eUpdateApplied)).toBeUndefined();

  await expect(page.getByRole('region', { name: 'Gói tải trước' }).getByText('Sẵn sàng – mới nhất')).toBeVisible({
    timeout: 20_000,
  });
  await prompt.getByRole('button', { name: 'Cập nhật' }).click();
  await expect.poll(() => tabB.evaluate(() => document.documentElement.dataset.e2eUpdateApplied)).toBe('true');
  await tabB.close();
});
