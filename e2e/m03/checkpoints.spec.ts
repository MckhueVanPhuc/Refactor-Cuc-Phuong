// Quickstart Q6–Q10 (US2) trên adapter giả: `npm run dev:fake`, project `m03`.
// Decode ảnh QR thật bằng @zxing/browser (Q9) là NOT RUN: gói chưa được cài (M02 T003) — xem validation-report.
import { readFile } from 'node:fs/promises';
import { expect, test } from './fixtures';
import { addReadyVisitPoint, backToCheckpoint, createCheckpoint, image, publishCheckpoint } from './flows';

const MB = 1_048_576;

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
