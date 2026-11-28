// Quickstart M01 V23 (US-M01-02 phần gợi ý; tasks T090; spec-M01 v3.3, CHG-REC-2026-11-28-01) trên bản build MODE e2e,
// network mock (project `m01`). Fixture: A = Vừa, Gia đình có trẻ nhỏ + Cá nhân/người lớn, Khám phá, Tự tham quan;
// B = Ngắn, Đi theo đoàn, Tìm hiểu + Thiên nhiên, Cần hướng dẫn viên + Tự tham quan.
import { expect, test, type Page } from '@playwright/test';
import { chooseLanguage, mockPublication } from './network';

test.use({ locale: 'vi-VN' });

const box = (page: Page, group: string, option: string) =>
  page.getByRole('group', { name: group }).getByRole('checkbox', { name: option, exact: true });

const titles = (page: Page) => page.getByRole('listitem').getByRole('heading');

test('V23 — không chọn gì → mọi tuyến; HOẶC trong nhóm, VÀ giữa nhóm; bỏ chọn; rỗng không nới tiêu chí', async ({ page }) => {
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page);
  await page.getByRole('link', { name: 'Gợi ý tuyến' }).click();
  const submit = page.getByRole('button', { name: 'Xem tuyến phù hợp' });
  const change = page.getByRole('button', { name: 'Đổi tiêu chí' }).first();

  // Không chọn gì → mọi tuyến chọn được, không chip
  await expect(page.getByRole('button', { name: 'Bỏ chọn tất cả' })).toHaveCount(0);
  await submit.click();
  await expect(page).toHaveURL(/\/recommend\/results$/);
  await expect(titles(page)).toHaveText(['Tuyến thử Ao Hồ', 'Tuyến thử Bách Thảo']);

  // HOẶC trong nhóm (Ngắn hoặc Vừa), VÀ với nhóm khác (Cần hướng dẫn viên) → chỉ B
  await change.click();
  await box(page, 'Thời gian', 'Ngắn (đến 90 phút)').check();
  await box(page, 'Thời gian', 'Vừa (trên 90 đến 180 phút)').check();
  await box(page, 'Hướng dẫn viên', 'Cần hướng dẫn viên').check();
  await submit.click();
  await expect(titles(page)).toHaveText(['Tuyến thử Ao Hồ']);
  await expect(page.getByText('Cần hướng dẫn viên')).toBeVisible();

  // Chạm lại để bỏ một ý; lựa chọn còn nguyên khi quay về
  await change.click();
  await expect(page).toHaveURL(/\/recommend$/);
  await expect(box(page, 'Hướng dẫn viên', 'Cần hướng dẫn viên')).toBeChecked();
  await box(page, 'Hướng dẫn viên', 'Cần hướng dẫn viên').uncheck();
  await box(page, 'Đối tượng', 'Gia đình có trẻ nhỏ').check();
  await submit.click();
  await expect(titles(page)).toHaveText(['Tuyến thử Bách Thảo']);

  // Tổ hợp không khớp → rỗng, không nới tiêu chí
  await change.click();
  await page.getByRole('button', { name: 'Bỏ chọn tất cả' }).click();
  await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(0);
  await box(page, 'Thời gian', 'Dài (trên 180 phút)').check();
  await submit.click();
  await expect(
    page.getByText('Chưa có tuyến phù hợp với lựa chọn của bạn. Bạn có thể đổi tiêu chí hoặc xem tất cả tuyến.'),
  ).toBeVisible();
  await expect(page.getByRole('listitem')).toHaveCount(0);
});
