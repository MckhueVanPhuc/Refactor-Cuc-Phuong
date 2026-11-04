// Quickstart M02 V27 (tasks T093; research R-15; constitution VI): có phiên đang chạy, chỉ còn tab M01 mở, có bản build
// mới → bản mới bị hoãn cho tới khi phiên kết thúc. Bản mới giả lập bằng hook `m01.simulateAppUpdate` như E2E V25 của
// M01; phần service worker áp bản thật không được kiểm ở đây.
import { expect, test } from '@playwright/test';
import { chooseLanguage, defaultPublication, mockPublication } from '../m01/network';
import { vi } from '../../src/modules/m02/i18n/vi';
import { callM01Hook, seedValidContext } from './helpers';
import { mockIntakeUnavailable, mockLookup, mockStorage } from './network';

test.use({ locale: 'vi-VN' });

type M02TestWindow = { __cpqTestHooks?: { m02?: { scan?: (text: string) => Promise<void> } } };

test('V27 — phiên đang chạy, chỉ mở tab M01: Cập nhật bị hoãn; kết thúc phiên → áp được', async ({ page }) => {
  await mockPublication(page, defaultPublication());
  await mockLookup(page);
  await mockStorage(page);
  await mockIntakeUnavailable(page);
  await page.goto('/');
  await chooseLanguage(page);
  await seedValidContext(page);
  await page.goto('/trip');
  await expect(page.getByText(vi.notice.sessionStartHint)).toBeVisible();

  // Rời M02: chỉ còn màn M01 trong tab, phiên vẫn DANG_DIEN_RA trong IndexedDB
  await page.goto('/');
  await callM01Hook(page, 'simulateAppUpdate');
  const prompt = page.getByRole('status').filter({ has: page.getByRole('button', { name: 'Cập nhật' }) });
  await expect(prompt).toContainText('Đã có phiên bản mới của ứng dụng.');
  await prompt.getByRole('button', { name: 'Cập nhật' }).click();
  await expect(prompt).toContainText('Ứng dụng đang tải gói hoặc có chuyến đi đang diễn ra.');
  expect(await page.evaluate(() => document.documentElement.dataset.e2eUpdateApplied)).toBeUndefined();

  // Kết thúc phiên ở điểm cuối
  await page.goto('/trip');
  await expect(page.locator('[data-entry="RESTORED"]')).toBeAttached();
  await page.waitForFunction(() => Boolean((window as unknown as M02TestWindow).__cpqTestHooks?.m02?.scan));
  await page.evaluate(() => (window as unknown as M02TestWindow).__cpqTestHooks!.m02!.scan!('http://localhost:4173/q/Q3'));
  await page.waitForFunction(() => {
    const dialog = document.querySelector('[role="alertdialog"]');
    return Boolean(dialog?.parentElement && getComputedStyle(dialog.parentElement).position === 'fixed');
  });
  await page.getByRole('button', { name: vi.endPrompt.end, exact: true }).click();
  await expect(page.getByRole('heading', { name: vi.end.title })).toBeVisible();

  await page.goto('/');
  await callM01Hook(page, 'simulateAppUpdate');
  await prompt.getByRole('button', { name: 'Cập nhật' }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.e2eUpdateApplied)).toBe('true');
});
