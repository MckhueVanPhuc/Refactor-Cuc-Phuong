// Quickstart Q6–Q10 (US2) trên adapter giả: `npm run dev:fake`, project `m03`.
// Decode ảnh QR thật bằng @zxing/browser (Q9) là NOT RUN: gói chưa được cài (M02 T003) — xem validation-report.
import { readFile } from 'node:fs/promises';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const INTRO = 'Cây chò ngàn năm cao hơn bốn mươi mét, thân thẳng, tán rộng.';
const MODE_FIRST = 'Hãy chọn loại kết nối cho điểm dừng và lưu lại trước khi thêm điểm tham quan.';
const MB = 1_048_576;

const image = (name: string, size = 2048) => ({ name, mimeType: 'image/jpeg', buffer: Buffer.alloc(size) });

async function createCheckpoint(page: Page, name: string, mode: 'Cần tải trước' | 'Dùng được khi có mạng' = 'Cần tải trước') {
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
async function addReadyVisitPoint(page: Page, name: string) {
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
  return (await page.locator('header, h1 + p').getByText(/^Mã …/).first().textContent()) ?? '';
}

async function backToCheckpoint(page: Page) {
  await page.getByRole('button', { name: 'Về điểm dừng' }).click();
}

async function publishCheckpoint(page: Page, name: string) {
  await page.getByRole('button', { name: 'Xuất bản' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Xem lại & Xuất bản' })).toBeVisible();
  await page.getByRole('button', { name: 'Xuất bản' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading')).toHaveText(`Xuất bản "${name}": du khách sẽ thấy nội dung mới ngay sau khi xuất bản.`);
  await dialog.getByRole('button', { name: 'Xuất bản' }).click();
  await expect(page.getByText('Đã xuất bản. Du khách sẽ thấy nội dung mới.')).toBeVisible();
}

test('Q6 — điểm dừng "Cần tải trước": hai điểm tham quan có ảnh; âm thanh bị từ chối; danh sách hiện "Mã …xxxxxx"', async ({
  page,
  signInAs,
}) => {
  await signInAs('CONTENT_STAFF');
  await createCheckpoint(page, 'Hang Con Moong');
  const first = await addReadyVisitPoint(page, 'Cây chò');
  await expect(page.getByLabel('Âm thanh/video')).toHaveCount(0);
  await expect(page.getByText('Điểm dừng cần tải trước chỉ nhận chữ và ảnh.')).toBeVisible();
  // Âm thanh chọn vào ô ảnh bị từ chối từng tệp
  await page.getByLabel('Ảnh của điểm tham quan').setInputFiles({ name: 'tieng.mp3', mimeType: 'audio/mpeg', buffer: Buffer.alloc(512) });
  await expect(page.getByText('Không tải được')).toBeVisible();
  await expect(page.getByText(/Tệp "tieng\.mp3" không đúng định dạng/)).toBeVisible();

  await backToCheckpoint(page);
  const second = await addReadyVisitPoint(page, 'Cây lim');
  await backToCheckpoint(page);
  const table = page.getByRole('table', { name: 'Điểm tham quan' });
  await expect(table.getByRole('row', { name: /Cây chò/ })).toContainText(first);
  await expect(table.getByRole('row', { name: /Cây lim/ })).toContainText(second);
  // Mục vừa lưu được tô sáng
  await expect(table.getByRole('row', { name: /Cây lim/ })).toHaveAttribute('aria-current', 'true');
});

test('Q7 — chọn 4 tệp một lần, một tệp quá cỡ: 3 "Đã tải", 1 "Không tải được"; lưu nháp giữ cả 3', async ({ page, signInAs }) => {
  await signInAs('CONTENT_STAFF');
  await createCheckpoint(page, 'Vườn thực vật');
  await page.getByRole('button', { name: 'Thêm điểm tham quan' }).click();
  await page.getByLabel('Tên đối tượng (tiếng Việt)').fill('Lan hài');
  await page
    .getByLabel('Ảnh của điểm tham quan')
    .setInputFiles([image('a.jpg'), image('b.jpg'), image('c.jpg'), image('qua-co.jpg', 2 * MB + 1)]);
  await expect(page.getByText('Đã tải 3/4 tệp. Chưa tải được: qua-co.jpg.')).toBeVisible();
  await expect(page.getByText('Không tải được')).toHaveCount(1);
  await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect(page.getByText('Đã thêm điểm tham quan "Lan hài".')).toBeVisible();
  await expect(page.getByRole('checkbox', { name: /^Xác nhận quyền sử dụng — / })).toHaveCount(3);
});

test('Q8 — xuất bản điểm dừng lần đầu khi một điểm tham quan chưa sẵn sàng', async ({ page, signInAs }) => {
  await signInAs('CONTENT_STAFF');
  await createCheckpoint(page, 'Hang Con Moong');
  await addReadyVisitPoint(page, 'Cây chò');
  await backToCheckpoint(page);
  await page.getByRole('button', { name: 'Thêm điểm tham quan' }).click();
  await page.getByLabel('Tên đối tượng (tiếng Việt)').fill('Đá vôi');
  await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect(page.getByText('Đã thêm điểm tham quan "Đá vôi".')).toBeVisible();
  await backToCheckpoint(page);

  await page.getByRole('button', { name: 'Xuất bản' }).click();
  await expect(page.getByText(/^Điểm tham quan "Đá vôi" chưa sẵn sàng: .*Điểm này chưa được xuất bản lần này\.$/)).toBeVisible();
  await page.getByRole('button', { name: 'Xuất bản' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Xuất bản' }).click();
  await expect(page.getByText('Đã xuất bản. Du khách sẽ thấy nội dung mới.')).toBeVisible();
  await expect(page.getByText('Trạng thái: Đang hoạt động')).toBeVisible();
  const table = page.getByRole('table', { name: 'Điểm tham quan' });
  await expect(table.getByRole('row', { name: /Cây chò/ })).toContainText('Đang hoạt động');
  await expect(table.getByRole('row', { name: /Đá vôi/ })).toContainText('Nháp');
});

test('Q9 — tải ảnh in SVG và PNG trên build local', async ({ page, signInAs }) => {
  await signInAs('CONTENT_STAFF');
  await createCheckpoint(page, 'Hang Con Moong');
  const code = await addReadyVisitPoint(page, 'Cây chò');
  await expect(page.getByText('Điểm tham quan này chưa xuất bản. Nếu dán mã ra thực địa, người quét sẽ thấy mã không hợp lệ.')).toBeVisible();
  await expect(page.getByText('Khi in, mã phải rộng ít nhất 3 cm.')).toBeVisible();

  const [svgDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Tải ảnh SVG' }).click()]);
  const svg = await readFile((await svgDownload.path()) ?? '', 'utf8');
  expect(svg).toContain(code);
  expect(svg).toContain('Khu vực không có sóng — hãy tải dữ liệu tuyến trước khi đến');
  expect(svg).toContain('No signal here — download the route data before you come');
  expect(svg).toContain('BẢN THỬ — KHÔNG DÁN RA THỰC ĐỊA');

  const [pngDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Tải ảnh PNG' }).click()]);
  const png = await readFile((await pngDownload.path()) ?? '');
  // IHDR: chữ ký 8 byte, rồi độ dài + "IHDR", rồi chiều rộng (4 byte big-endian)
  expect(png.subarray(1, 4).toString('ascii')).toBe('PNG');
  expect(png.readUInt32BE(16)).toBeGreaterThanOrEqual(1024);
});

test('Q10 — thu hồi QR hoạt động cuối của điểm dừng hoạt động → MSG-LAST-QR', async ({ page, signInAs }) => {
  await signInAs('CONTENT_STAFF');
  await createCheckpoint(page, 'Hang Con Moong');
  await addReadyVisitPoint(page, 'Cây chò');
  await backToCheckpoint(page);
  await publishCheckpoint(page, 'Hang Con Moong');
  await page.getByRole('table', { name: 'Điểm tham quan' }).getByRole('link', { name: 'Cây chò' }).click();
  await page.getByRole('button', { name: 'Thu hồi mã QR' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Lý do').fill('Cây đã đổ');
  await dialog.getByRole('button', { name: 'Thu hồi', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText(
    'Không thể thu hồi mã QR cuối cùng của điểm dừng đang hoạt động. Hãy thêm mã QR khác hoặc đóng tạm điểm dừng trước.',
  );
  await expect(page.getByText('Trạng thái: Đang hoạt động')).toBeVisible();
});
