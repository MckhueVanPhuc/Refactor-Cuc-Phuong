// Nút dịch "→" (spec-AI_integration; specs/004-ai-translation quickstart Q1–Q14) trên adapter giả: `npm run dev:fake`,
// project `m03`. Bộ dịch giả trả "{text} (en)"; chế độ ok / fail / slow đặt qua hook `setTranslationMode`.
// Stack local dùng Gemini thật nên bản dịch không cố định: các ca này bỏ qua ở đó (quickstart §3 kiểm tay L1–L5).
import type { Locator, Page } from '@playwright/test';
import { expect, isLocalStack, m03Hook, test } from './fixtures';
import { createCheckpoint, image } from './flows';

const BUTTON = 'Dịch sang tiếng Anh';
const TRANSLATING = 'Đang dịch…';
const FAILED = 'Chưa dịch được. Hãy bấm "Thử lại" hoặc tự nhập tiếng Anh.';
const UNSAVED = 'Bạn có thay đổi chưa lưu. Rời trang sẽ mất các thay đổi này.';

test.beforeEach(() => {
  test.skip(isLocalStack(), 'bản dịch thật không cố định; quickstart §3 kiểm trên stack local');
});

/** Khung nhỏ nhất chứa ô tiếng Việt của trường và một nút dịch: cặp song ngữ của đúng trường đó */
function pairOf(page: Page, label: string): Locator {
  return page
    .locator('div')
    .filter({ has: page.getByLabel(`${label} (tiếng Việt)`, { exact: true }) })
    .filter({ has: page.getByRole('button', { name: BUTTON }) })
    .last();
}

const vi = (page: Page, label: string) => page.getByLabel(`${label} (tiếng Việt)`, { exact: true });
const en = (page: Page, label: string) => page.getByLabel(`${label} (tiếng Anh)`, { exact: true });
const translateButton = (page: Page, label: string) => pairOf(page, label).getByRole('button', { name: BUTTON });
const requestCount = async (page: Page) => (await m03Hook(page, 'translationRequestCount')) as number;
const setMode = (page: Page, mode: 'ok' | 'fail' | 'slow') => m03Hook(page, 'setTranslationMode', [mode]);

async function translate(page: Page, label: string, text: string) {
  await vi(page, label).fill(text);
  await translateButton(page, label).click();
  await expect(en(page, label)).toHaveValue(`${text.trim()} (en)`);
}

async function newRoute(page: Page) {
  await page.getByRole('link', { name: 'Tuyến' }).click();
  await page.getByRole('button', { name: 'Tạo tuyến' }).click();
}

test('Q1, Q2 — biên tập tuyến: mỗi trường song ngữ có nút "→" riêng, chỉ trường đã bấm đổi', async ({ page, signInAs }) => {
  await signInAs('CONTENT_STAFF');
  await newRoute(page);
  await vi(page, 'Tên tuyến').fill('Đường lên Mả Tổ');
  await translateButton(page, 'Tên tuyến').click();
  await expect(pairOf(page, 'Tên tuyến').getByRole('status')).toHaveText(TRANSLATING);
  await expect(en(page, 'Tên tuyến')).toHaveValue('Đường lên Mả Tổ (en)');
  await expect(en(page, 'Mô tả ngắn')).toHaveValue('');
  await translate(page, 'Mô tả ngắn', 'Rừng nguyên sinh');

  await page.getByRole('button', { name: /Chi tiết/ }).click();
  for (const label of [
    'Mô tả đầy đủ',
    'Điểm xuất phát và cách đến',
    'Yêu cầu và điều kiện tham gia',
    'Cần chuẩn bị',
    'Thời điểm phù hợp',
    'Cảnh báo an toàn',
  ]) {
    await translate(page, label, `${label} của tuyến`);
  }
  await page.getByRole('button', { name: 'Thêm điểm nổi bật' }).click();
  await page.getByRole('button', { name: 'Thêm điểm nổi bật' }).click();
  await translate(page, 'Điểm nổi bật 2', 'Thác nước');
  await expect(en(page, 'Điểm nổi bật 1')).toHaveValue('');
  await translate(page, 'Điểm nổi bật 1', 'Cây cổ thụ');

  await page.getByLabel('Ảnh chi tiết').setInputFiles([image('a.jpg'), image('b.jpg')]);
  await translate(page, 'Chú thích ảnh 2', 'Hang động');
  await translate(page, 'Chú thích ảnh 1', 'Suối');
  await page.getByLabel('Ảnh sơ đồ tuyến').setInputFiles(image('so-do.jpg'));
  await translate(page, 'Chú thích sơ đồ tuyến', 'Sơ đồ toàn tuyến');
  // 2 trường thẻ + 6 trường dài + 2 điểm nổi bật + 2 chú thích ảnh + chú thích sơ đồ
  expect(await requestCount(page)).toBe(13);
});

test('Q2 — điểm dừng và điểm tham quan: tên, tên đối tượng, giới thiệu', async ({ page, signInAs }) => {
  await signInAs('CONTENT_STAFF');
  await page.getByRole('link', { name: 'Thư viện điểm dừng' }).click();
  await page.getByRole('button', { name: 'Tạo điểm dừng' }).click();
  await translate(page, 'Tên điểm dừng', 'Hang Con Moong');
  await page.getByLabel('Cần tải trước').check();
  await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Hang Con Moong' })).toBeVisible();

  await page.getByRole('button', { name: 'Thêm điểm tham quan' }).click();
  await translate(page, 'Tên đối tượng', 'Cây chò ngàn năm');
  await translate(page, 'Giới thiệu', 'Cây chò cao hơn bốn mươi mét, thân thẳng, tán rộng.');
});

test('Q3, Q4 — ô tiếng Việt trống thì không bấm được; ô tiếng Anh có chữ thì bị thay, không hỏi', async ({ page, signInAs }) => {
  await signInAs('CONTENT_STAFF');
  await newRoute(page);
  await expect(translateButton(page, 'Tên tuyến')).toBeDisabled();
  await vi(page, 'Tên tuyến').fill('   ');
  await expect(translateButton(page, 'Tên tuyến')).toBeDisabled();
  await vi(page, 'Tên tuyến').fill('Rừng già');
  await en(page, 'Tên tuyến').fill('Old forest');
  await translateButton(page, 'Tên tuyến').click();
  await expect(en(page, 'Tên tuyến')).toHaveValue('Rừng già (en)');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('Q5 — không bao giờ tự dịch: gõ, sửa tiếng Việt, xóa tiếng Anh không đổi ô tiếng Anh', async ({ page, signInAs }) => {
  await signInAs('CONTENT_STAFF');
  await newRoute(page);
  await vi(page, 'Tên tuyến').fill('Rừng già');
  await vi(page, 'Tên tuyến').blur();
  expect(await requestCount(page)).toBe(0);
  await translateButton(page, 'Tên tuyến').click();
  await expect(en(page, 'Tên tuyến')).toHaveValue('Rừng già (en)');
  await vi(page, 'Tên tuyến').fill('Rừng nguyên sinh');
  await en(page, 'Mô tả ngắn').click();
  await expect(en(page, 'Tên tuyến')).toHaveValue('Rừng già (en)');
  await en(page, 'Tên tuyến').fill('');
  await vi(page, 'Tên tuyến').click();
  await expect(en(page, 'Tên tuyến')).toHaveValue('');
  expect(await requestCount(page)).toBe(1);
});

test('Q6, Q7 — kết quả về trễ bị bỏ khi đã gõ ô tiếng Anh hoặc sửa ô tiếng Việt', async ({ page, signInAs }) => {
  await signInAs('CONTENT_STAFF');
  await newRoute(page);
  await setMode(page, 'slow');
  await vi(page, 'Tên tuyến').fill('Rừng già');
  await translateButton(page, 'Tên tuyến').click();
  await en(page, 'Tên tuyến').fill('My own text');
  await expect(pairOf(page, 'Tên tuyến').getByRole('status')).toHaveCount(0, { timeout: 6000 });
  await expect(en(page, 'Tên tuyến')).toHaveValue('My own text');

  await vi(page, 'Mô tả ngắn').fill('Suối');
  await translateButton(page, 'Mô tả ngắn').click();
  await vi(page, 'Mô tả ngắn').fill('Suối nước');
  await expect(pairOf(page, 'Mô tả ngắn').getByRole('status')).toHaveCount(0, { timeout: 6000 });
  await expect(en(page, 'Mô tả ngắn')).toHaveValue('');
});

test('Q8, Q9 — lỗi: thông báo kèm "Thử lại", ô tiếng Anh giữ nguyên; vẫn điền tay và lưu được', async ({ page, signInAs }) => {
  await signInAs('CONTENT_STAFF');
  await page.getByRole('link', { name: 'Thư viện điểm dừng' }).click();
  await page.getByRole('button', { name: 'Tạo điểm dừng' }).click();
  await setMode(page, 'fail');
  await vi(page, 'Tên điểm dừng').fill('Hang Đầu Người');
  await en(page, 'Tên điểm dừng').fill('Giữ nguyên');
  await translateButton(page, 'Tên điểm dừng').click();
  const alert = pairOf(page, 'Tên điểm dừng').getByRole('alert');
  await expect(alert).toContainText(FAILED);
  await expect(en(page, 'Tên điểm dừng')).toHaveValue('Giữ nguyên');

  await setMode(page, 'ok');
  await alert.getByRole('button', { name: 'Thử lại' }).click();
  await expect(en(page, 'Tên điểm dừng')).toHaveValue('Hang Đầu Người (en)');
  await expect(pairOf(page, 'Tên điểm dừng').getByRole('alert')).toHaveCount(0);

  // Dịch vụ hỏng hẳn: điền tay, lưu như spec-M03 (SC-AI-003)
  await setMode(page, 'fail');
  await translateButton(page, 'Tên điểm dừng').click();
  await expect(pairOf(page, 'Tên điểm dừng').getByRole('alert')).toBeVisible();
  await en(page, 'Tên điểm dừng').fill('Head Cave');
  await expect(pairOf(page, 'Tên điểm dừng').getByRole('alert')).toHaveCount(0);
  await page.getByLabel('Cần tải trước').check();
  await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect(page.getByText('Đã lưu bản nháp.')).toBeVisible();
});

test('Q10 — dịch không lưu: rời editor hiện hộp thay đổi chưa lưu', async ({ page, signInAs }) => {
  await signInAs('CONTENT_STAFF');
  await page.getByRole('link', { name: 'Thư viện điểm dừng' }).click();
  await page.getByRole('button', { name: 'Tạo điểm dừng' }).click();
  await vi(page, 'Tên điểm dừng').fill('Động Người Xưa');
  await en(page, 'Tên điểm dừng').fill('Cave');
  await page.getByLabel('Cần tải trước').check();
  await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Động Người Xưa' })).toBeVisible();
  // Thay đổi duy nhất sau khi lưu là bản dịch
  await translateButton(page, 'Tên điểm dừng').click();
  await expect(en(page, 'Tên điểm dừng')).toHaveValue('Động Người Xưa (en)');
  await page.getByRole('link', { name: 'Tuyến' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading')).toHaveText(UNSAVED);
  await dialog.getByRole('button', { name: 'Ở lại' }).click();
  await expect(en(page, 'Tên điểm dừng')).toHaveValue('Động Người Xưa (en)');
});

test('Q11 — bản dịch dài quá giới hạn được điền đủ; bộ đếm báo vượt; lưu báo MSG-LIMIT-TEXT', async ({ page, signInAs }) => {
  await signInAs('CONTENT_STAFF');
  await newRoute(page);
  const name = 'R'.repeat(98);
  await translate(page, 'Tên tuyến', name);
  await expect(pairOf(page, 'Tên tuyến').getByText('103/100')).toBeVisible();
  await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect(page.getByText('Tên tuyến (tiếng Anh) dài quá 100 ký tự (hiện có 103). Hãy rút gọn.').first()).toBeVisible();
});

test('Q12 — giới thiệu nhiều dòng giữ xuống dòng; điểm nổi bật một dòng', async ({ page, signInAs }) => {
  await signInAs('CONTENT_STAFF');
  await createCheckpoint(page, 'Vườn thực vật');
  await page.getByRole('button', { name: 'Thêm điểm tham quan' }).click();
  await vi(page, 'Giới thiệu').fill('Dòng một của giới thiệu.\nDòng hai của giới thiệu.');
  await translateButton(page, 'Giới thiệu').click();
  await expect(en(page, 'Giới thiệu')).toHaveValue('Dòng một của giới thiệu.\nDòng hai của giới thiệu. (en)');
});

test('Q13 — điểm dừng đã lưu trữ (chỉ đọc) không có nút "→"', async ({ page, signInAs }) => {
  await signInAs('CONTENT_STAFF');
  await createCheckpoint(page, 'Điểm thử');
  await page.getByRole('button', { name: 'Hủy điểm dừng' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Lý do').fill('Tạo nhầm');
  await dialog.getByRole('button', { name: 'Hủy điểm dừng' }).click();
  await expect(page).toHaveURL(/\/admin\/checkpoints$/);
  await page.getByRole('link', { name: 'Điểm thử' }).click();
  await expect(vi(page, 'Tên điểm dừng')).toBeDisabled();
  await expect(page.getByRole('button', { name: BUTTON })).toHaveCount(0);
});

test('Q14 — bàn phím: Tab tới nút rồi Enter', async ({ page, signInAs }) => {
  await signInAs('CONTENT_STAFF');
  await newRoute(page);
  await vi(page, 'Tên tuyến').fill('Rừng già');
  await vi(page, 'Tên tuyến').focus();
  await page.keyboard.press('Tab');
  await expect(translateButton(page, 'Tên tuyến')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(en(page, 'Tên tuyến')).toHaveValue('Rừng già (en)');
});
