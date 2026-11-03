// Quickstart M01 V23 (US-M01-02 phần gợi ý; tasks T090) trên bản build MODE e2e, network mock (project `m01`).
import { expect, test, type Page } from '@playwright/test';
import { chooseLanguage, mockPublication } from './network';

test.use({ locale: 'vi-VN' });

async function choose(page: Page, group: string, option: string) {
  await page.getByRole('radiogroup', { name: group }).getByRole('radio', { name: option, exact: true }).check();
}

test('V23 — TIME_VUA + GROUP_GIA_DINH_CO_TRE + INTEREST_KHAM_PHA; tổ hợp không khớp; thiếu một nhóm', async ({ page }) => {
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page);
  await page.getByRole('link', { name: 'Gợi ý tuyến' }).click();
  const submit = page.getByRole('button', { name: 'Xem tuyến phù hợp' });

  // Thiếu một nhóm → không chạy so khớp
  await choose(page, 'Thời gian', 'Vừa (trên 90 đến 180 phút)');
  await choose(page, 'Đối tượng', 'Gia đình có trẻ nhỏ');
  await expect(submit).toBeDisabled();

  // Đủ ba nhóm → mọi kết quả chứa cả ba tag (fixture: chỉ tuyến A)
  await choose(page, 'Trải nghiệm', 'Khám phá');
  await submit.click();
  await expect(page.getByRole('listitem').getByRole('heading')).toHaveText(['Tuyến thử Bách Thảo']);

  // Tổ hợp không khớp → rỗng, không nới tiêu chí
  await choose(page, 'Thời gian', 'Dài (trên 180 phút)');
  await submit.click();
  await expect(
    page.getByText('Chưa có tuyến phù hợp với lựa chọn của bạn. Bạn có thể đổi tiêu chí hoặc xem tất cả tuyến.'),
  ).toBeVisible();
  await expect(page.getByRole('listitem')).toHaveCount(0);
});
