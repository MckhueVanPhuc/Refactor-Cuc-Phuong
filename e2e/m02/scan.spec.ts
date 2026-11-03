// Quickstart M02 V5–V8, V23 và phần journey của V1 (tasks T039). Lần quét đầu `Q1a` của V5 đi qua camera giả
// (`qr-q1a.y4m`, project m02); các mã khác đi qua `window.__cpqTestHooks.m02.scan`, cùng đường parseQrLink → processScan.
import { expect, test, type Page } from '@playwright/test';
import { vi } from '../../src/modules/m02/i18n/vi';
import { dumpStores, seedValidContext } from './helpers';
import { mockLookup } from './network';

const BASE = 'http://localhost:4173';

async function startTrip(page: Page) {
  await page.addInitScript(() => Object.defineProperty(navigator, 'language', { get: () => 'vi-VN' }));
  await page.goto('/');
  await seedValidContext(page);
  await page.goto('/trip');
  await expect(page.getByText(vi.notice.sessionStartHint)).toBeVisible();
}

/** Hình dạng `window.__cpqTestHooks.m02` (src/modules/m02/testing/e2eHooks.ts). */
type M02TestWindow = { __cpqTestHooks?: { m02?: { scan?: (text: string) => Promise<void> } } };

/** Quét qua hook E2E từ SCR-M02-001. */
async function scan(page: Page, text: string) {
  await page.waitForFunction(() => Boolean((window as unknown as M02TestWindow).__cpqTestHooks?.m02?.scan));
  await page.evaluate((value) => (window as unknown as M02TestWindow).__cpqTestHooks!.m02!.scan!(value), text);
}

async function visits(page: Page) {
  return (await dumpStores(page, ['checkpointVisits'])).checkpointVisits as { checkpointId: string; qrIdentifier: string; checkedInAt: string }[];
}

async function backToTrip(page: Page) {
  await page.goto('/trip');
  await expect(page.locator('[data-entry="RESTORED"]')).toBeAttached();
}

test('V1 — journey đánh số liên tục 1, 2, 3 cho seq 1, 3, 5; chưa quét điểm nào', async ({ page }) => {
  await mockLookup(page);
  await startTrip(page);
  const items = page.getByRole('listitem');
  await expect(items).toHaveCount(3);
  await expect(items.nth(0)).toContainText('1');
  await expect(items.nth(1)).toContainText('2');
  await expect(items.nth(2)).toContainText('3');
  await expect(page.getByText(vi.journey.progress({ scanned: 0, total: 3 }))).toBeVisible();
});

test('V5 — online quét Q1a (camera) rồi Q1b → một lượt ghé C1 với qrIdentifier = Q1a', async ({ page }) => {
  const requests = await mockLookup(page);
  await startTrip(page);

  await page.getByRole('button', { name: vi.trip.scan }).click();
  await expect(page).toHaveURL(/\/trip\/qr\/Q1a$/);
  await expect(page.getByText(vi.trip.visitRecorded)).toBeVisible();
  expect(requests[0]).toEqual({ p_qr_identifier: 'Q1a', p_route_id: 'A' });

  await backToTrip(page);
  await expect(page.getByText(vi.trip.scanned, { exact: true })).toHaveCount(1);
  await scan(page, `${BASE}/q/Q1b`);
  await expect(page).toHaveURL(/\/trip\/qr\/Q1b$/);
  await expect(page.locator('[data-display="LIVE"]')).toBeAttached();
  await expect(page.getByText(vi.trip.visitRecorded)).toHaveCount(0);

  const recorded = await visits(page);
  expect(recorded).toHaveLength(1);
  expect(recorded[0]).toMatchObject({ checkpointId: 'C1', qrIdentifier: 'Q1a' });
});

test('V6 — online quét QN (thêm sau, VALID với C2) → lượt ghé C2 có qrIdentifier = QN; journey không đổi', async ({ page }) => {
  await mockLookup(page);
  await startTrip(page);
  await scan(page, `${BASE}/q/QN`);
  await expect(page).toHaveURL(/\/trip\/qr\/QN$/);
  expect(await visits(page)).toEqual([expect.objectContaining({ checkpointId: 'C2', qrIdentifier: 'QN' })]);
  const [session] = (await dumpStores(page, ['playSessions'])).playSessions as { journeyCheckpoints: { qrIdentifiers: string[] }[] }[];
  expect(session!.journeyCheckpoints.flatMap((c) => c.qrIdentifiers)).not.toContain('QN');
});

test('V7 — offline quét QN → "Cần có kết nối mạng…", không lượt ghé, không request', async ({ page, context }) => {
  const requests = await mockLookup(page);
  await startTrip(page);
  await context.setOffline(true);
  await scan(page, `${BASE}/q/QN`);
  await expect(page.getByRole('alert')).toContainText(vi.notice.connectionNeeded);
  await expect(page).toHaveURL(/\/trip$/);
  expect(requests).toEqual([]);
  expect(await visits(page)).toEqual([]);
  await context.setOffline(false);
});

test('V8 — lỗi tải nội dung sau khi ghi lượt ghé: lượt ghé còn sau khi tải lại', async ({ page }) => {
  await mockLookup(page);
  // Ảnh và media của nội dung live đều lỗi
  await page.route('**/storage/v1/**', (route) => route.fulfill({ status: 500, body: 'boom' }));
  await startTrip(page);
  await scan(page, `${BASE}/q/Q2`);
  await expect(page).toHaveURL(/\/trip\/qr\/Q2$/);
  await page.reload();
  await backToTrip(page);
  await expect(page.getByText(vi.trip.scanned, { exact: true })).toHaveCount(1);
  expect(await visits(page)).toEqual([expect.objectContaining({ checkpointId: 'C2', qrIdentifier: 'Q2' })]);
});

test('V15 (hook) — chuỗi không phải URL và link có query → mã không hợp lệ, không request', async ({ page }) => {
  const requests = await mockLookup(page);
  await startTrip(page);
  for (const text of ['Q1a', `${BASE}/q/Q1a?x=1`]) {
    await scan(page, text);
    await expect(page.getByRole('alert')).toContainText(vi.notice.invalid);
  }
  expect(requests).toEqual([]);
  expect(await visits(page)).toEqual([]);
});

test('V23 — camera bị từ chối khi bấm "Quét" → thông báo camera cố định', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('denied', 'NotAllowedError'));
  });
  await mockLookup(page);
  await startTrip(page);
  await page.getByRole('button', { name: vi.trip.scan }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText(vi.notice.cameraUnavailable);
  await page.getByRole('button', { name: vi.scanner.close }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
