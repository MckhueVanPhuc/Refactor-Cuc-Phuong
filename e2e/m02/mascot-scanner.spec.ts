// Mila khi quét khó (spec-Mascot US-MAS-03; specs/005 tasks T048; quickstart Q9, Q10) trên bản build MODE e2e, project
// `m02`. Camera giả của project đọc ngay mã Q1a, nên các ca chờ thay camera bằng luồng hình trống (canvas: camera chạy,
// không có mã) hoặc camera bị từ chối; giờ thiết bị điều khiển bằng `page.clock`.
import { expect, test, type Page } from '@playwright/test';
import { vi } from '../../src/modules/m02/i18n/vi';
import { seedValidContext } from './helpers';
import { mockIntakeUnavailable, mockLookup, mockStorage } from './network';

type M02TestWindow = { __cpqTestHooks?: { m02?: { scan?: (text: string) => Promise<void> } } };

async function startTrip(page: Page) {
  await page.addInitScript(() => Object.defineProperty(navigator, 'language', { get: () => 'vi-VN' }));
  await mockLookup(page);
  await mockStorage(page);
  await mockIntakeUnavailable(page);
  await page.goto('/');
  await seedValidContext(page);
  await page.goto('/trip');
  await expect(page.getByRole('button', { name: vi.trip.scan, exact: true })).toBeVisible();
  await page.waitForFunction(() => Boolean((window as unknown as M02TestWindow).__cpqTestHooks?.m02?.scan));
}

/** Camera chạy nhưng chỉ thấy hình trống: không bao giờ đọc được mã */
async function blankCamera(page: Page) {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      canvas.getContext('2d')!.fillRect(0, 0, 320, 240);
      return canvas.captureStream(5);
    };
  });
}

const scanner = (page: Page) => page.locator('[data-mascot-slot="scanner-bottom"]');

test('Q9 — scanner mở, chưa có lượt ghé: Mila minh họa ở dải dưới; 15 s nhìn quanh; 30 s hỏi giúp; 90 s gợi ý tắt camera, "Đóng camera" đóng scanner', async ({
  page,
}) => {
  await page.clock.install();
  await blankCamera(page);
  await startTrip(page);
  await page.getByRole('button', { name: vi.trip.scan, exact: true }).click();
  await expect(page.getByRole('dialog', { name: vi.scanner.title })).toBeVisible();

  // MAS-B-040 (v1.2): chỉ minh họa, không chữ
  await expect(scanner(page).locator('[data-mascot-mode="AVATAR"]')).toHaveAttribute('data-mascot-pose', 'point');
  await expect(scanner(page).locator('[data-mascot-message]')).toHaveCount(0);

  await page.clock.fastForward(15_000);
  await expect(scanner(page).locator('[data-mascot-mode="AVATAR"]')).toHaveAttribute('data-mascot-pose', 'binoculars');
  await page.clock.fastForward(15_000);
  await expect(scanner(page).locator('[data-mascot-message="MSG-MAS-042"]')).toBeVisible();
  await page.clock.fastForward(60_000);
  await expect(scanner(page).locator('[data-mascot-message="MSG-MAS-049"]')).toBeVisible();

  await scanner(page).getByRole('button', { name: 'Đóng camera' }).click();
  await expect(page.getByRole('dialog', { name: vi.scanner.title })).toHaveCount(0);
  await expect(page.locator('[data-mascot-slot="trip-dock"] [data-mascot-mode="DOCK"]')).toBeVisible();
});

test('Q10 (v1.9) — hai lần liên tiếp mã không hợp lệ: lần đầu Mila đứng chờ bối rối, không hình trong thông báo; lần hai Mila nói 046, câu cố định vẫn còn', async ({ page }) => {
  await startTrip(page);
  const scan = (text: string) => page.evaluate((value) => (window as unknown as M02TestWindow).__cpqTestHooks!.m02!.scan!(value), text);
  const notice = page.locator('[data-scan-notice="INVALID"]');

  await scan('không phải mã của Vườn');
  await expect(notice).toContainText(vi.notice.invalid);
  await expect(notice.locator('[data-mascot-figure]')).toHaveCount(0);
  await expect(page.locator('[data-mascot-slot="trip-dock"] [data-mascot-mode="DOCK"]')).toHaveAttribute('data-mascot-pose', 'confused');
  await expect(page.locator('[data-mascot-message="MSG-MAS-046"]')).toHaveCount(0);
  // Một Mila trên màn (spec-Mascot §5.1)
  await expect(page.locator('[data-mascot-figure], [data-mascot-mode]')).toHaveCount(1);

  // Lần quét thứ hai là một thao tác khác (không rơi vào cửa sổ chống trùng 500 ms của BR-MAS-06)
  await page.waitForTimeout(600);
  await scan('không phải mã của Vườn');
  await expect(page.locator('[data-mascot-slot="trip-dock"] [data-mascot-message="MSG-MAS-046"]')).toBeVisible();
  await expect(notice).toContainText(vi.notice.invalid);
});

test('MAS-B-038 (v1.8) — camera bị từ chối: không Mila, icon camera và các bước bật camera; không bong bóng', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException('denied', 'NotAllowedError');
    };
  });
  await startTrip(page);
  await page.getByRole('button', { name: vi.trip.scan, exact: true }).click();
  const failure = page.getByRole('dialog', { name: vi.scanner.title }).getByRole('alert');
  await expect(failure).toContainText(vi.notice.cameraUnavailable);
  const dialog = page.getByRole('dialog', { name: vi.scanner.title });
  await expect(dialog.getByRole('heading', { name: vi.scanner.howToTitle })).toBeVisible();
  await expect(dialog.locator('[data-mascot-figure], [data-mascot-slot]')).toHaveCount(0);
  await expect(page.locator('[data-mascot-message]')).toHaveCount(0);
});
