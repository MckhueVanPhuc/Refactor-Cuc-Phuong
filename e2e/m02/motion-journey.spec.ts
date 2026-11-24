// Thanh tiến trình hành trình và mở khóa checkpoint (specs/006 T029; quickstart M3–M5; FR-MOT-003, 004). Dựng chuyến
// như mascot-end.spec.ts (fixture: C1 Q1a, C2 Q2, C3 Q3).
import { expect, test, type Page } from '@playwright/test';
import { vi } from '../../src/modules/m02/i18n/vi';
import { seedValidContext } from './helpers';
import { mockLookup, mockStorage } from './network';

type M02TestWindow = { __cpqTestHooks?: { m02?: { scan?: (text: string) => Promise<void> } } };
const BASE = 'http://localhost:4173';

async function scan(page: Page, qr: string) {
  await expect(page.getByRole('button', { name: vi.trip.scan, exact: true })).toBeVisible();
  await page.waitForFunction(() => Boolean((window as unknown as M02TestWindow).__cpqTestHooks?.m02?.scan));
  await page.evaluate((text) => (window as unknown as M02TestWindow).__cpqTestHooks!.m02!.scan!(text), `${BASE}/q/${qr}`);
  await expect(page).toHaveURL(new RegExp(`/trip/qr/${qr}$`));
}

async function startTrip(page: Page) {
  await page.addInitScript(() => Object.defineProperty(navigator, 'language', { get: () => 'vi-VN' }));
  await mockLookup(page);
  await mockStorage(page);
  await page.goto('/');
  await seedValidContext(page);
  await page.goto('/trip');
  await expect(page.getByText(vi.notice.sessionStartHint)).toBeVisible();
}

const bar = (page: Page) => page.getByRole('progressbar', { name: /Đã quét QR/ });
const unlocked = (page: Page) => page.locator('[data-checkpoint][data-unlock]');

test('M3: quét điểm 1, xem nội dung, Quay lại → điểm 1 mở khóa, thanh 1/3, câu tiến độ nguyên văn', async ({ page }) => {
  await startTrip(page);
  await expect(bar(page)).toHaveAttribute('aria-valuenow', '0');
  await scan(page, 'Q1a');
  await page.getByRole('link', { name: vi.content.back }).click();
  await expect(page).toHaveURL(/\/trip$/);
  await expect(unlocked(page)).toHaveAttribute('data-checkpoint', 'C1');
  await expect(bar(page)).toHaveAttribute('aria-valuenow', '1');
  await expect(bar(page)).toHaveAttribute('aria-valuemax', '3');
  await expect(page.getByText(vi.journey.progress({ scanned: 1, total: 3 }))).toBeVisible();
});

test('M4: tải lại hoặc quét lại điểm đã có lượt ghé → không mở khóa', async ({ page }) => {
  await startTrip(page);
  await scan(page, 'Q1a');
  await page.getByRole('link', { name: vi.content.back }).click();
  await expect(unlocked(page)).toHaveCount(1);
  await page.reload();
  await expect(bar(page)).toHaveAttribute('aria-valuenow', '1');
  await expect(unlocked(page)).toHaveCount(0);
  await scan(page, 'Q1a');
  await page.getByRole('link', { name: vi.content.back }).click();
  await expect(page).toHaveURL(/\/trip$/);
  await expect(bar(page)).toHaveAttribute('aria-valuenow', '1');
  await expect(unlocked(page)).toHaveCount(0);
});

test('M5: khách tự do mở link QR → không có thanh tiến trình', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'language', { get: () => 'vi-VN' }));
  await mockLookup(page);
  await mockStorage(page);
  await page.goto('/q/Q1a');
  await expect(page.getByText(vi.notice.freeVisitor)).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveCount(0);
});

test('DV-05, US9: quay lại sau lượt ghé mới → Mila ngạc nhiên rồi sải bước hai khung khi nói 056; chỉ một Mila trên màn', async ({ page }) => {
  await startTrip(page);
  await scan(page, 'Q1a');
  await page.getByRole('link', { name: vi.content.back }).click();
  await expect(page).toHaveURL(/\/trip$/);
  await expect(page.locator('[data-mascot-slot="trip-dock"] [data-mascot-pose="amazed"]')).toBeVisible();
  await expect(page.locator('[data-mascot-slot="trip-dock"] [data-mascot-pose="walk"] [data-mascot-frame2]')).toBeAttached({ timeout: 5_000 });
  await expect(page.locator('[data-mascot-message="MSG-MAS-056"]')).toBeVisible();
  await expect(page.locator('[data-mascot-figure], [data-mascot-mode]')).toHaveCount(1);
});
