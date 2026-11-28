// Mila khi chuẩn bị (spec-Mascot US-MAS-07; specs/005 tasks T057; quickstart Q15) trên bản build MODE e2e, network mock
// (project `m01`). Gói tải trước, gợi ý tuyến, nhắc Cảnh báo an toàn, gợi ý ở danh mục sau 20 s không thao tác.
import { expect, test, type Page } from '@playwright/test';
import { callM01Hook } from './helpers';
import { chooseLanguage, defaultPublication, mockPublication, type PublicationMock } from './network';

test.use({ locale: 'vi-VN' });

const panel = (page: Page) => page.getByRole('region', { name: 'Gói tải trước' });
const message = (page: Page, slot: string, id: string) => page.locator(`[data-mascot-slot="${slot}"] [data-mascot-message="${id}"]`);

/** Tuyến A (fixture: cần gói, có Cảnh báo an toàn) */
async function openA(page: Page, mock: PublicationMock = defaultPublication()) {
  await mockPublication(page, mock);
  await page.goto('/');
  await chooseLanguage(page);
  await page.goto('/routes/route-a');
  await expect(page.getByRole('button', { name: 'Bắt đầu' })).toBeVisible();
  return mock;
}

async function choose(page: Page, group: string, option: string) {
  // spec-M01 v3.3: mỗi nhóm là ô chọn nhiều (checkbox) trong một nhóm có tên
  await page.getByRole('group', { name: group }).getByRole('checkbox', { name: option, exact: true }).check();
}

test('MAS-B-014: tuyến có Cảnh báo an toàn → Mila nhắc đọc ở panel Bắt đầu, không nằm trong khối cảnh báo', async ({ page }) => {
  await openA(page);
  await expect(message(page, 'start-panel', 'MSG-MAS-014')).toBeVisible();
  await expect(page.getByRole('note', { name: 'Cảnh báo an toàn' }).locator('[data-mascot-mode], [data-mascot-figure]')).toHaveCount(0);
});

test('MAS-B-020 → 021: tải gói → "xếp vào ba lô" trong panel gói, xong → "xem được cả khi mất sóng"; không phần trăm', async ({ page }) => {
  const mock = defaultPublication();
  mock.imageDelayMs = 800;
  await openA(page, mock);
  await panel(page).getByRole('button', { name: 'Tải về' }).click();
  await expect(panel(page).locator('[data-mascot-message="MSG-MAS-020"]')).toBeVisible();
  await expect(panel(page).locator('[data-mascot-message="MSG-MAS-021"]')).toBeVisible({ timeout: 15_000 });
  await expect(panel(page).getByText('Sẵn sàng – mới nhất')).toBeVisible();
  await expect(panel(page)).not.toContainText('%');
});

test('MAS-B-025 (v1.2): máy không cho lưu → Mila minh họa cạnh câu lỗi cố định, không bong bóng', async ({ page }) => {
  await openA(page);
  await callM01Hook(page, 'failNextActivation');
  await panel(page).getByRole('button', { name: 'Tải về' }).click();
  const error = panel(page).getByRole('alert');
  await expect(error).toBeVisible();
  await expect(panel(page).locator('[data-mascot-figure="confused"]')).toBeVisible();
  await expect(panel(page).locator('[data-mascot-message]')).toHaveCount(0);
});

test('MAS-B-024 → 026: tải lỗi → hình minh họa; lỗi lần 2 liên tiếp khi có mạng → câu trấn an trong panel gói', async ({ page }) => {
  const mock = defaultPublication();
  mock.imageFailures.set('fixture/a2-1.png', 500);
  await openA(page, mock);
  await panel(page).getByRole('button', { name: 'Tải về' }).click();
  await expect(panel(page).getByText('Tải chưa hoàn tất. Hãy thử tải lại.')).toBeVisible();
  await expect(panel(page).locator('[data-mascot-figure="confused"]')).toBeVisible();
  await expect(panel(page).locator('[data-mascot-message]')).toHaveCount(0);

  await panel(page).getByRole('button', { name: 'Tải lại' }).click();
  await expect(panel(page).locator('[data-mascot-message="MSG-MAS-026"]')).toBeVisible({ timeout: 15_000 });
});

test('MAS-B-010, 011, 012/013: mở Gợi ý tuyến → Mila hỏi tiêu chí; có kết quả → câu 011; hai lần rỗng → chỉ hình, "Xem tất cả tuyến" về danh mục', async ({
  page,
}) => {
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page);
  await page.getByRole('link', { name: 'Gợi ý tuyến' }).click();
  await expect(message(page, 'recommend-head', 'MSG-MAS-010')).toBeVisible();

  const submit = page.getByRole('button', { name: 'Xem tuyến phù hợp' });
  await choose(page, 'Thời gian', 'Vừa (trên 90 đến 180 phút)');
  await choose(page, 'Đối tượng', 'Gia đình có trẻ nhỏ');
  await choose(page, 'Trải nghiệm', 'Khám phá');
  await submit.click();
  await expect(message(page, 'recommend-head', 'MSG-MAS-011')).toBeVisible();

  // Hai lần rỗng liên tiếp: Mila chỉ minh họa cạnh câu cố định (v1.2), không có nút thứ hai
  for (const time of ['Dài (trên 180 phút)', 'Ngắn (đến 90 phút)']) {
    await page.getByRole('button', { name: 'Đổi tiêu chí' }).first().click();
    await expect(page).toHaveURL(/\/recommend$/);
    // Chọn nhiều (v3.3): bỏ hết rồi chọn lại, để thời gian mới thay chứ không cộng thêm
    await page.getByRole('button', { name: 'Bỏ chọn tất cả' }).click();
    await choose(page, 'Thời gian', time);
    await choose(page, 'Đối tượng', 'Gia đình có trẻ nhỏ');
    await choose(page, 'Trải nghiệm', 'Khám phá');
    await submit.click();
    await expect(page.getByText(/Chưa có tuyến phù hợp/)).toBeVisible();
    await expect(page.locator('[data-mascot-figure="think"]')).toBeVisible();
    await expect(page.locator('[data-mascot-message="MSG-MAS-013"]')).toHaveCount(0);
  }
  await expect(page.getByRole('link', { name: 'Xem tất cả tuyến' })).toHaveCount(1);
  await page.getByRole('link', { name: 'Xem tất cả tuyến' }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('MAS-B-008: 20 s không thao tác ở danh mục → Mila gợi ý, "Gợi ý tuyến" mở /recommend', async ({ page }) => {
  await page.clock.install();
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page);
  await expect(page.getByRole('link', { name: /Tuyến thử Ao Hồ/ })).toBeVisible();
  await page.clock.fastForward(21_000);
  const hint = message(page, 'catalog-hero', 'MSG-MAS-008');
  await expect(hint).toBeVisible();
  // Đồng hồ giả (page.clock) + chuyển cảnh của specs/006 US5 làm bước kiểm tư thế con trỏ của click() chập chờn: test
  // chỉ cần CTA của bong bóng mở /recommend, nên gửi thẳng sự kiện click vào nút
  await page.locator('[data-mascot-slot="catalog-hero"]').getByRole('button', { name: 'Gợi ý tuyến' }).dispatchEvent('click');
  await expect(page).toHaveURL(/\/recommend$/);
});
