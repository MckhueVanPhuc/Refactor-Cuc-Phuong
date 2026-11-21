// Trang mở từ mã QR với Mila (specs/005 tasks T032; US-MAS-01 mục 2; OD-MAS-14; Q3; SC-MAS-010).
import { expect, test } from '@playwright/test';
import { vi } from '../../src/modules/m02/i18n/vi';
import { mockLookup, mockStorage } from './network';

test('Q3 — lần đầu mở /q/Q1a: nội dung như trước, không giới thiệu, Mila chỉ là hình cạnh gợi ý khách tự do', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'language', { get: () => 'vi-VN' }));
  await mockLookup(page);
  await mockStorage(page);
  await page.goto('/q/Q1a');
  await expect(page.getByRole('heading', { level: 1, name: 'Đối tượng Q1a' })).toBeVisible();
  const hint = page.locator('[data-free-visitor]');
  await expect(hint.getByText(vi.notice.freeVisitor)).toBeVisible();
  await expect(hint.locator('[data-mascot-figure="map"]')).toBeVisible();
  await expect(page.locator('[data-mascot-mode="INTRO"]')).toHaveCount(0);
  await expect(page.locator('[data-mascot-message]')).toHaveCount(0);
});
