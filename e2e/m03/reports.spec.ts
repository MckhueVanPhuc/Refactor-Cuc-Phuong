// Quickstart Q26 (US9) trên adapter giả: `npm run dev:fake`, project `m03`.
// Chuyến đi synthetic được nạp thẳng qua test hook (intake thật ở giai đoạn B, Q25).
import { expect, m03Hook, spaNavigate, test, waitForHooks } from './fixtures';

test('Q26 — RPT-01/RPT-02 mặc định 30 ngày; khoảng 367 ngày; chỉ có một ngày; ghi chú một dòng luôn hiện', async ({ page, signInAs }) => {
  await signInAs('CONTENT_STAFF');
  await waitForHooks(page);
  const { routeIds } = (await m03Hook(page, 'seedSharedRoutes', ['Hang Con Moong', 'Tuyến A', 'Tuyến B'])) as { routeIds: [string, string] };
  await m03Hook(page, 'seedSessions', [routeIds[0], [{ daysAgo: 2, status: 'HOAN_TAT' }, { daysAgo: 1, status: 'BO_DO' }, { daysAgo: 40, status: 'HOAN_TAT' }]]);

  await spaNavigate(page, '/admin/reports');
  await expect(page.getByRole('heading', { level: 1, name: 'Báo cáo vận hành' })).toBeVisible();
  await expect(page.getByText(/^Số liệu tính đến \d{2}:\d{2} ngày \d{2}\/\d{2}\/\d{4}\.$/)).toBeVisible();
  await expect(page.getByText('Chỉ tính các chuyến đi đã kết thúc và đã gửi về hệ thống; số liệu không cập nhật tức thời.')).toBeVisible();

  // Mặc định 30 ngày: chuyến kết thúc 40 ngày trước không được tính
  const summary = page.getByRole('tabpanel');
  await expect(summary.getByText('Tổng số chuyến đi').locator('..')).toContainText('2');
  await expect(summary.getByText('Hoàn thành').locator('..')).toContainText('50');
  await expect(summary.getByText('Bỏ dở').locator('..')).toContainText('50');

  await page.getByRole('tab', { name: 'Lượt ghé theo điểm dừng' }).click();
  await expect(page.getByRole('table', { name: 'Lượt ghé theo điểm dừng' }).getByRole('row', { name: /Tuyến A/ })).toContainText('Hang Con Moong');
  await expect(page.getByText('Một lượt ghé là một lần quét mã QR, không chứng minh du khách đã có mặt tại chỗ.')).toBeVisible();

  // 367 ngày
  await page.getByLabel('Từ ngày').fill('01/01/2025');
  await page.getByLabel('Đến ngày').fill('02/01/2026');
  await expect(page.getByText('Khoảng thời gian chọn quá dài. Hãy chọn tối đa 366 ngày.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Áp dụng' })).toBeDisabled();

  // Chỉ có một ngày
  await page.getByLabel('Đến ngày').fill('');
  await expect(page.getByText('Hãy chọn đủ ngày bắt đầu và ngày kết thúc, ngày bắt đầu không được sau ngày kết thúc.')).toBeVisible();
  await expect(page.getByText('Chỉ tính các chuyến đi đã kết thúc và đã gửi về hệ thống; số liệu không cập nhật tức thời.')).toBeVisible();
});
