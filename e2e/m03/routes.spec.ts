// Quickstart Q11–Q13 (US3) trên adapter giả: `npm run dev:fake`, project `m03`.
import type { Page } from '@playwright/test';
import { expect, failNext, readPublication, test, waitForHooks } from './fixtures';
import { image, PUBLISHED, publishedCheckpoint } from './flows';

const pair = async (page: Page, label: string, vi: string) => {
  await page.getByLabel(`${label} (tiếng Việt)`).fill(vi);
  await page.getByLabel(`${label} (tiếng Anh)`).fill(`${vi} (en)`);
};

/** Tuyến đủ điều kiện xuất bản, cảnh báo an toàn để trống, thời lượng 180 phút; dừng ở editor đã lưu */
async function buildPublishableRoute(page: Page) {
  await publishedCheckpoint(page, 'Hang Con Moong');
  await page.getByRole('link', { name: 'Tuyến' }).click();
  await page.getByRole('button', { name: 'Tạo tuyến' }).click();
  // Bước 1: ảnh đại diện chọn ngay trên form mới, tải ở lần lưu đầu (validation-report D-25)
  await pair(page, 'Tên tuyến', 'Đường lên Mả Tổ');
  await page.getByLabel('Ảnh đại diện').setInputFiles(image('dai-dien.jpg'));
  await page.getByLabel('Xác nhận quyền sử dụng — dai-dien.jpg').check();
  await pair(page, 'Mô tả ngắn', 'Rừng nguyên sinh');
  await page.getByLabel('Quãng đường (km)').fill('4.5');
  await page.getByLabel('Thời lượng dự kiến (phút)').fill('180');
  await page.getByLabel('Độ khó').selectOption({ label: 'Trung bình' });
  await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect(page.getByText('Đã lưu bản nháp.')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Còn thiếu để xuất bản' })).not.toContainText('Còn thiếu: Ảnh đại diện.');

  await page.getByRole('button', { name: /Chi tiết/ }).click();
  await pair(page, 'Mô tả đầy đủ', 'Mô tả đầy đủ của tuyến');
  await pair(page, 'Điểm xuất phát và cách đến', 'Trung tâm du khách');

  await page.getByRole('button', { name: /Nhãn/ }).click();
  await page.getByLabel('Cá nhân/người lớn').check();
  await page.getByLabel('Khám phá').check();
  await expect(page.getByText('Nhãn thời gian: Vừa')).toBeVisible();

  await page.getByRole('button', { name: /Điểm dừng/ }).click();
  await page.getByRole('table', { name: 'Điểm dừng chọn được' }).getByRole('row', { name: /Hang Con Moong/ }).getByRole('button', { name: 'Thêm' }).click();
  await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect(page.getByText('Đã lưu bản nháp.')).toBeVisible();
  // Chỉ còn tick an toàn, nằm trên màn review
  await expect(page.getByRole('region', { name: 'Còn thiếu để xuất bản' })).toContainText(
    'Hãy nhập cảnh báo an toàn, hoặc tick xác nhận tuyến không có cảnh báo an toàn cần nêu.',
  );
  return new URL(page.url()).pathname.split('/').pop() ?? '';
}

test('Q11 — lưu tuyến thiếu nội dung; panel liệt kê từng thiếu sót; Khó + "Gia đình có trẻ nhỏ" bị chặn khi lưu', async ({ page, signInAs }) => {
  await signInAs('CONTENT_STAFF');
  await page.getByRole('button', { name: 'Tạo tuyến' }).click();
  await page.getByLabel('Tên tuyến (tiếng Việt)').fill('Đường lên Mả Tổ');
  await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect(page.getByText('Đã lưu bản nháp.')).toBeVisible();
  const panel = page.getByRole('region', { name: 'Còn thiếu để xuất bản' });
  for (const gap of ['Còn thiếu: Ảnh đại diện.', 'Tên tuyến: còn thiếu bản tiếng Anh.', 'Còn thiếu: Mô tả ngắn.', 'Còn thiếu: Nhóm đối tượng.']) {
    await expect(panel.getByText(gap)).toBeVisible();
  }
  await expect(panel.getByText('Tuyến cần ít nhất một điểm dừng đang hoạt động trong danh sách thì mới xuất bản được.')).toBeVisible();

  await page.getByLabel('Độ khó').selectOption({ label: 'Khó' });
  await page.getByRole('button', { name: /Nhãn/ }).click();
  await page.getByLabel('Gia đình có trẻ nhỏ').check();
  await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect(page.getByText('Lỗi: Tuyến độ khó Khó không thể gắn nhãn Gia đình có trẻ nhỏ. Hãy đổi độ khó hoặc bỏ nhãn.')).toBeVisible();
});

test('Q12 — xuất bản tuyến đủ điều kiện, cảnh báo an toàn trống: đòi tick; Đang hoạt động, version 1, timeTags đúng', async ({
  page,
  signInAs,
}) => {
  await signInAs('CONTENT_STAFF');
  await waitForHooks(page);
  const routeId = await buildPublishableRoute(page);
  await page.getByRole('button', { name: 'Xuất bản' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Xem lại & Xuất bản' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Tuyến bị ảnh hưởng' })).toContainText(/Gói tải trước ước tính: [\d,]+ MB/);
  const publish = page.getByRole('button', { name: 'Xuất bản' });
  await expect(publish).toBeDisabled();
  await page.getByLabel('Tôi xác nhận tuyến không có cảnh báo an toàn cần nêu').check();
  await publish.click();
  await page.getByRole('dialog').getByRole('button', { name: 'Xuất bản' }).click();
  await expect(page.getByText(PUBLISHED)).toBeVisible();
  await expect(page.getByText('Trạng thái: Đang hoạt động')).toBeVisible();

  const { route, snapshot } = await readPublication(page, routeId);
  expect(route).toMatchObject({ status: 'HOAT_DONG', timeTags: ['TIME_VUA'], activeContentVersion: 1, checkpointCount: 1 });
  expect(snapshot).toMatchObject({ routeId, contentVersion: 1, status: 'DA_CONG_BO' });
});

test('Q13 — lỗi khi xuất bản lần đầu: MSG-PUBLISH-FAILED, không có dòng công khai nào đổi', async ({ page, signInAs }) => {
  await signInAs('CONTENT_STAFF');
  await waitForHooks(page);
  const routeId = await buildPublishableRoute(page);
  await page.getByRole('button', { name: 'Xuất bản' }).click();
  await page.getByLabel('Tôi xác nhận tuyến không có cảnh báo an toàn cần nêu').check();
  await failNext(page, 'PUBLISHED', 'MSG-PUBLISH-FAILED');
  await page.getByRole('button', { name: 'Xuất bản' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Xuất bản' }).click();
  await expect(page.getByRole('alert')).toHaveText(
    'Chưa xuất bản được. Những gì du khách đang thấy vẫn như cũ. Hãy thử lại sau ít phút.',
  );
  expect(await readPublication(page, routeId)).toEqual({ route: null, snapshot: null });
});
