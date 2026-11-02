// Quickstart Q23–Q24 (US8) trên adapter giả: `npm run dev:fake`, project `m03`.
// Ca bản cũ vi phạm giới hạn hiện hành cần sửa thẳng dữ liệu nên kiểm ở RestoreAndDiscard.test.tsx và history.contract.ts.
import type { Page } from '@playwright/test';
import { expect, login, m03Hook, spaNavigate, syntheticAccounts, test, waitForHooks } from './fixtures';
import { PUBLISHED } from './flows';

async function publishedRoute(page: Page) {
  await waitForHooks(page);
  const { routeIds } = (await m03Hook(page, 'seedSharedRoutes', ['Hang Con Moong', 'Tuyến A', 'Tuyến B'])) as { routeIds: [string, string] };
  return routeIds[0];
}

test('Q23 — xuất bản hai lần, khôi phục bản 1, khôi phục khi đã có bản nháp, bỏ thay đổi', async ({ page, signInAs }) => {
  await signInAs('CONTENT_STAFF');
  const routeId = await publishedRoute(page);
  await spaNavigate(page, `/admin/routes/${routeId}`);
  await expect(page.getByLabel('Quãng đường (km)')).toHaveValue('4.5');

  // Lần xuất bản thứ hai
  await page.getByLabel('Quãng đường (km)').fill('6');
  await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect(page.getByText('Đã lưu bản nháp.')).toBeVisible();
  await page.getByRole('button', { name: 'Xuất bản', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Xem lại & Xuất bản' })).toBeVisible();
  await page.getByRole('button', { name: 'Xuất bản', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Xuất bản', exact: true }).click();
  await expect(page.getByText(PUBLISHED)).toBeVisible();

  await spaNavigate(page, `/admin/routes/${routeId}`);
  const history = page.getByRole('region', { name: 'Lịch sử xuất bản' });
  await expect(history.getByRole('listitem')).toHaveCount(2);
  await expect(history.getByRole('listitem').first()).toContainText('Tự xuất bản');

  await history.getByRole('button', { name: 'Khôi phục bản đã xuất bản trước đó: bản 1' }).click();
  await expect(page.getByLabel('Quãng đường (km)')).toHaveValue('4.5');
  await expect(page.getByText('Bản nháp — du khách chưa thấy.')).toBeVisible();

  await history.getByRole('button', { name: 'Khôi phục bản đã xuất bản trước đó: bản 1' }).click();
  await expect(page.getByRole('alert')).toHaveText(
    'Đang có bản nháp chưa xuất bản. Hãy xuất bản hoặc bỏ thay đổi trước, rồi mới khôi phục bản cũ.',
  );

  await page.getByRole('button', { name: 'Bỏ thay đổi' }).click();
  await expect(page.getByLabel('Quãng đường (km)')).toHaveValue('6');
  await expect(page.getByText('Đang hiển thị cho du khách.')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Nhật ký của mục' })).toContainText('Bỏ thay đổi');
});

test('Q24 — Nhân viên nội dung mở /admin/audit → MSG-NO-PERMISSION; Quản lý xem được nhật ký', async ({ page, signInAs }) => {
  await signInAs('CONTENT_STAFF');
  await publishedRoute(page);
  await spaNavigate(page, '/admin/audit');
  await expect(page.getByText('Bạn chưa có quyền làm việc này. Hãy nhờ quản lý.')).toBeVisible();
  await expect(page.getByRole('table', { name: 'Nhật ký' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Đăng xuất' }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await login(page, syntheticAccounts.REVIEWER.email);
  await expect(page).toHaveURL(/\/admin\/routes$/);
  await page.getByRole('link', { name: 'Nhật ký hệ thống' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Nhật ký hệ thống' })).toBeVisible();
  const table = page.getByRole('table', { name: 'Nhật ký' });
  await expect(table.getByRole('row', { name: /Tuyến: Tuyến A.*Xuất bản/ }).first()).toContainText('Thành công');
  await expect(table).not.toContainText('PUBLISHED');
});
