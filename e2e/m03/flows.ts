// Thao tác E2E dùng chung của M03 trên adapter giả: tạo và xuất bản điểm dừng qua giao diện.
import type { Page } from '@playwright/test';
import { expect } from './fixtures';

export const INTRO = 'Cây chò ngàn năm cao hơn bốn mươi mét, thân thẳng, tán rộng.';
export const MODE_FIRST = 'Hãy chọn loại kết nối cho điểm dừng và lưu lại trước khi thêm điểm tham quan.';
export const PUBLISHED = 'Đã xuất bản. Du khách sẽ thấy nội dung mới.';

export const image = (name: string, size = 2048) => ({ name, mimeType: 'image/jpeg', buffer: Buffer.alloc(size) });

export async function createCheckpoint(page: Page, name: string, mode: 'Cần tải trước' | 'Dùng được khi có mạng' = 'Cần tải trước') {
  await page.getByRole('link', { name: 'Thư viện điểm dừng' }).click();
  await page.getByRole('button', { name: 'Tạo điểm dừng' }).click();
  await expect(page.getByRole('button', { name: 'Thêm điểm tham quan' })).toBeDisabled();
  await expect(page.getByText(MODE_FIRST)).toBeVisible();
  await page.getByLabel('Tên điểm dừng (tiếng Việt)').fill(name);
  await page.getByLabel('Tên điểm dừng (tiếng Anh)').fill(`${name} (en)`);
  await page.getByLabel(mode).check();
  if (mode === 'Dùng được khi có mạng') await page.getByLabel('Đã khảo sát thực địa, có sóng ổn định').check();
  await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Thêm điểm tham quan' })).toBeEnabled();
}

/** Thêm điểm tham quan sẵn sàng (tên, giới thiệu song ngữ, một ảnh đã tick quyền); trả "Mã …xxxxxx" */
export async function addReadyVisitPoint(page: Page, name: string) {
  await page.getByRole('button', { name: 'Thêm điểm tham quan' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Điểm tham quan mới' })).toBeVisible();
  // Chưa có mã QR trước lần lưu đầu (SC-M03-034)
  await expect(page.getByText(/^Mã …/)).toHaveCount(0);
  await page.getByLabel('Tên đối tượng (tiếng Việt)').fill(name);
  await page.getByLabel('Tên đối tượng (tiếng Anh)').fill(`${name} (en)`);
  await page.getByLabel('Giới thiệu (tiếng Việt)').fill(INTRO);
  await page.getByLabel('Giới thiệu (tiếng Anh)').fill(INTRO);
  await page.getByLabel('Ảnh của điểm tham quan').setInputFiles(image(`${name}.jpg`));
  await page.getByLabel(`Xác nhận quyền sử dụng — ${name}.jpg`).check();
  await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect(page.getByText(`Đã thêm điểm tham quan "${name}".`)).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: `Đang sửa: ${name}` })).toBeVisible();
  return (await page.locator('h1 + p').getByText(/^Mã …/).first().textContent()) ?? '';
}

export async function backToCheckpoint(page: Page) {
  await page.getByRole('button', { name: 'Về điểm dừng' }).click();
}

/** Từ editor điểm dừng: mở review và xuất bản lần đầu */
export async function publishCheckpoint(page: Page, name: string) {
  await page.getByRole('button', { name: 'Xuất bản' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Xem lại & Xuất bản' })).toBeVisible();
  await page.getByRole('button', { name: 'Xuất bản' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading')).toHaveText(`Xuất bản "${name}": du khách sẽ thấy nội dung mới ngay sau khi xuất bản.`);
  await dialog.getByRole('button', { name: 'Xuất bản' }).click();
  await expect(page.getByText(PUBLISHED)).toBeVisible();
}

/** Điểm dừng "Cần tải trước" đã xuất bản với một điểm tham quan sẵn sàng */
export async function publishedCheckpoint(page: Page, name: string) {
  await createCheckpoint(page, name);
  await addReadyVisitPoint(page, `Vật ở ${name}`);
  await backToCheckpoint(page);
  await publishCheckpoint(page, name);
}
