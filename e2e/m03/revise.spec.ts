// Quickstart Q14–Q17 (US4) trên adapter giả: `npm run dev:fake`, project `m03`.
// Tuyến và điểm dừng đã xuất bản được dựng sẵn qua test hook; phần sửa, review, xuất bản chạy qua giao diện.
import type { Page } from '@playwright/test';
import { expect, m03Hook, readPublication, spaNavigate, test, waitForHooks } from './fixtures';
import { PUBLISHED } from './flows';

/** Hai tuyến đã xuất bản cùng liệt kê một điểm dừng "Cần tải trước" */
async function twoRoutesSharingCheckpoint(page: Page) {
  await waitForHooks(page);
  return m03Hook(page, 'seedSharedRoutes', ['Hang Con Moong', 'Tuyến A', 'Tuyến B']) as Promise<{
    checkpointId: string;
    routeIds: [string, string];
  }>;
}

async function confirmPublish(page: Page) {
  await page.getByRole('button', { name: 'Xuất bản' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Xuất bản' }).click();
}

test('Q14 — hai phiên cùng sửa một tuyến: phiên sau nhận MSG-STALE với email và giờ; chữ còn nguyên; không ghi đè', async ({
  page,
  signInAs,
}) => {
  await signInAs('CONTENT_STAFF');
  const { routeIds } = await twoRoutesSharingCheckpoint(page);
  await spaNavigate(page, `/admin/routes/${routeIds[0]}`);
  await expect(page.getByText('Đang hiển thị cho du khách.')).toBeVisible();
  await page.getByLabel('Quãng đường (km)').fill('7');
  // Quản lý lưu bản nháp của cùng tuyến trong một phiên khác
  await m03Hook(page, 'reviseRouteAs', ['REVIEWER', routeIds[0], { distanceKm: 6 }]);
  await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect(page.getByRole('alert')).toContainText(/^reviewer@example\.test vừa sửa mục này lúc \d{2}:\d{2}\./);
  await expect(page.getByLabel('Quãng đường (km)')).toHaveValue('7');

  await page.getByRole('alert').getByRole('button', { name: 'Tải lại' }).click();
  await expect(page.getByLabel('Quãng đường (km)')).toHaveValue('6');
  await expect(page.getByText('Bản nháp — du khách chưa thấy.')).toBeVisible();
});

test('Q15 — sửa tên điểm dừng mà 2 tuyến liệt kê: review nêu cả 2; cả 2 có version mới cùng lúc', async ({ page, signInAs }) => {
  await signInAs('CONTENT_STAFF');
  const { checkpointId, routeIds } = await twoRoutesSharingCheckpoint(page);
  await spaNavigate(page, `/admin/checkpoints/${checkpointId}`);
  await page.getByLabel('Tên điểm dừng (tiếng Việt)').fill('Hang Người Xưa');
  await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect(page.getByText('Bản nháp — du khách chưa thấy.')).toBeVisible();
  await page.getByRole('button', { name: 'Xuất bản' }).click();

  const affected = page.getByRole('region', { name: 'Tuyến bị ảnh hưởng' });
  for (const name of ['Tuyến A', 'Tuyến B']) {
    await expect(affected.getByRole('listitem').filter({ hasText: name })).toContainText('Gói tải trước của du khách cần cập nhật');
  }
  await expect(page.getByText('Thay đổi này ảnh hưởng 2 tuyến: Tuyến A, Tuyến B.', { exact: false })).toBeVisible();
  await confirmPublish(page);
  await expect(page.getByText(PUBLISHED)).toBeVisible();

  for (const routeId of routeIds) {
    const { snapshot } = await readPublication(page, routeId);
    expect(snapshot).toMatchObject({ contentVersion: 2, previousContentVersion: 1 });
    expect((snapshot?.checkpoints as { checkpointName: { vi: string } }[])[0]?.checkpointName.vi).toBe('Hang Người Xưa');
  }
});

test('Q16 — hai lệnh xuất bản trên hai tuyến có chung điểm dừng: lệnh sau BUSY MSG-ROUTE-BUSY', async ({ page, signInAs }) => {
  await signInAs('CONTENT_STAFF');
  const { checkpointId, routeIds } = await twoRoutesSharingCheckpoint(page);
  await spaNavigate(page, `/admin/routes/${routeIds[0]}`);
  await page.getByLabel('Quãng đường (km)').fill('5');
  await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect(page.getByText('Đã lưu bản nháp.')).toBeVisible();
  await page.getByRole('button', { name: 'Xuất bản' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Xem lại & Xuất bản' })).toBeVisible();
  // Xuất bản của Tuyến B đang chạy và giữ điểm dừng chung
  await m03Hook(page, 'holdLock', [`checkpoint:${checkpointId}`]);
  await confirmPublish(page);
  await expect(page.getByRole('alert')).toHaveText('Đang có thao tác khác chạy trên Hang Con Moong. Hãy thử lại sau ít phút.');

  await m03Hook(page, 'releaseLock', [`checkpoint:${checkpointId}`]);
  await confirmPublish(page);
  await expect(page.getByText(PUBLISHED)).toBeVisible();
});

test('Q17 — xuất bản làm gói tải trước vượt trần: MSG-OFFLINE-TOO-BIG nêu tên tuyến và ảnh nặng nhất', async ({ page, signInAs }) => {
  await signInAs('CONTENT_STAFF');
  const { checkpointId } = await twoRoutesSharingCheckpoint(page);
  await spaNavigate(page, `/admin/checkpoints/${checkpointId}`);
  await page.getByRole('button', { name: 'Thêm điểm tham quan' }).click();
  const intro = 'Thạch nhũ hình thành qua hàng nghìn năm trong lòng hang.';
  await page.getByLabel('Tên đối tượng (tiếng Việt)').fill('Thạch nhũ');
  await page.getByLabel('Tên đối tượng (tiếng Anh)').fill('Stalactite');
  await page.getByLabel('Giới thiệu (tiếng Việt)').fill(intro);
  await page.getByLabel('Giới thiệu (tiếng Anh)').fill(intro);
  await page.getByLabel('Ảnh của điểm tham quan').setInputFiles({ name: 'thach-nhu.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(2048) });
  await page.getByLabel('Xác nhận quyền sử dụng — thach-nhu.jpg').check();
  await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect(page.getByText('Đã thêm điểm tham quan "Thạch nhũ".')).toBeVisible();
  // Ảnh vừa tải được ghi nhận nặng 51 MB (giả lập; ảnh thật tối đa 2 MB mỗi tệp)
  await m03Hook(page, 'inflateLatestMedia', [51 * 1_048_576]);
  await page.getByRole('button', { name: 'Xuất bản' }).click();
  await expect(page.getByText(/^Gói tải trước của tuyến "Tuyến [AB]" sẽ nặng khoảng [\d,]+ MB, vượt mức 50 MB\. Ảnh nặng nhất: Thạch nhũ – ảnh 1/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Xuất bản' })).toBeDisabled();
});
