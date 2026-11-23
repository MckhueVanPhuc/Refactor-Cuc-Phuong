// Hỏi Mila và nhắc cất máy (specs/005 tasks T064, T087; spec-Mascot v1.1 BR-MAS-12, 13, 22; quickstart Q16, Q21,
// Q22). Hành trình fixture: 3 điểm (C1: Q1a, Q1b; C2: Q2; C3: Q3).
import { expect, test, type Page } from '@playwright/test';
import { vi } from '../../src/modules/m02/i18n/vi';
import { seedValidContext } from './helpers';
import { mockIntakeUnavailable, mockLookup, mockStorage } from './network';

const BASE = 'http://localhost:4173';
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

const scan = (page: Page, qr: string) => page.evaluate((text) => (window as unknown as M02TestWindow).__cpqTestHooks!.m02!.scan!(text), `${BASE}/q/${qr}`);
const ask = (page: Page) => page.getByRole('button', { name: 'Hỏi Mila' });
const bubble = (page: Page, id: string) => page.locator(`[data-mascot-message="${id}"]`);

test('Q21 — chuyến đi: chạm → 032; quét Q1a rồi quay lại → nhắc cất máy (056); chạm → "Còn 2 điểm nữa…" (033)', async ({ page }) => {
  await startTrip(page);
  await expect(page.locator('[data-mascot-slot="trip-dock"] [data-mascot-mode="DOCK"]')).toBeVisible();
  await ask(page).click();
  await expect(bubble(page, 'MSG-MAS-032')).toBeVisible();

  await scan(page, 'Q1a');
  await expect(page.getByRole('heading', { level: 1, name: 'Đối tượng Q1a' })).toBeVisible();
  await page.getByRole('link', { name: vi.content.back }).click();
  await expect(page).toHaveURL(/\/trip$/);
  await expect(bubble(page, 'MSG-MAS-056')).toHaveText('Giờ cất máy và ngắm rừng thôi! Ở điểm sau nhớ quét mã nhé.');
  await page.getByRole('button', { name: 'Đóng lời nhắn' }).click();
  await ask(page).click();
  await expect(bubble(page, 'MSG-MAS-033')).toHaveText('Còn 2 điểm nữa. Thấy tem thì bấm Quét QR nhé.');
});

test('Q22 — chạm Mila 5 lần trong 3 giây → chóng mặt (085) một lần; lần sau chạm như thường', async ({ page }) => {
  await startTrip(page);
  await expect(ask(page)).toBeVisible();
  for (let i = 0; i < 5; i++) {
    await ask(page).click();
    await page.waitForTimeout(450);
  }
  await expect(bubble(page, 'MSG-MAS-085')).toHaveText('Ui, chóng mặt quá!');
  await expect(page.locator('[data-mascot-mode="DOCK"]')).toHaveAttribute('data-mascot-pose', 'confused');
  await page.getByRole('button', { name: 'Đóng lời nhắn' }).click();
  for (let i = 0; i < 5; i++) {
    await ask(page).click();
    await page.waitForTimeout(450);
  }
  await expect(bubble(page, 'MSG-MAS-032')).toBeVisible();
  await expect(bubble(page, 'MSG-MAS-085')).toHaveCount(0);
});
