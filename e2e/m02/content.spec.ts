// Quickstart M02 V9–V12 (tasks T051): nội dung của mã đã quét trên bản build MODE e2e. Gói của M01 nạp qua hook
// `m01.seedPackage`; mã đi qua `window.__cpqTestHooks.m02.scan` từ SCR-M02-001.
import { expect, test, type Page } from '@playwright/test';
import { readyPackage } from '../../src/modules/m02/api/fake/fixtures';
import { en } from '../../src/modules/m02/i18n/en';
import { vi } from '../../src/modules/m02/i18n/vi';
import { callM01Hook, dumpStores, seedValidContext } from './helpers';
import { mockLookup, mockStorage } from './network';

const BASE = 'http://localhost:4173';

type M02TestWindow = { __cpqTestHooks?: { m02?: { scan?: (text: string) => Promise<void> } } };

async function startTrip(page: Page, pkg?: ReturnType<typeof readyPackage>) {
  await page.addInitScript(() => Object.defineProperty(navigator, 'language', { get: () => 'vi-VN' }));
  await page.goto('/');
  await seedValidContext(page);
  if (pkg) await callM01Hook(page, 'seedPackage', pkg);
  await page.goto('/trip');
  await expect(page.getByText(vi.notice.sessionStartHint)).toBeVisible();
}

/** Offline chỉ chạy được sau khi app đã mở một lần và service worker đã precache (BR-M02-025). */
async function goOffline(page: Page) {
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await page.context().setOffline(true);
}

async function scan(page: Page, qrIdentifier: string) {
  await page.waitForFunction(() => Boolean((window as unknown as M02TestWindow).__cpqTestHooks?.m02?.scan));
  await page.evaluate((text) => (window as unknown as M02TestWindow).__cpqTestHooks!.m02!.scan!(text), `${BASE}/q/${qrIdentifier}`);
  await expect(page).toHaveURL(new RegExp(`/trip/qr/${qrIdentifier}$`));
}

test('V9 — online Q2: audio/video lọc theo ngôn ngữ, đổi VI ↔ EN đổi ngay, không autoplay', async ({ page }) => {
  await mockLookup(page);
  await mockStorage(page);
  await startTrip(page);
  await scan(page, 'Q2');

  await expect(page.getByText('Âm thanh 1')).toBeVisible();
  await expect(page.getByText('Video 1')).toBeVisible();
  const players = page.locator('audio, video');
  await expect(players).toHaveCount(2);
  for (const player of await players.all()) {
    await expect(player).toHaveAttribute('preload', 'none');
    expect(await player.evaluate((el: HTMLMediaElement) => el.paused && !el.autoplay)).toBe(true);
  }
  await expect(page.locator('[data-media="media/q2-vi.mp3"]')).toBeAttached();

  await page.getByRole('group').getByRole('button', { name: 'EN' }).click();
  await expect(page.getByText(en.content.audioLabel({ n: 1 }))).toBeVisible();
  await expect(page.locator('[data-media="media/q2-vi.mp3"]')).toHaveCount(0);
  await expect(page.locator('[data-media="media/q2-en.mp3"]')).toBeAttached();
  await expect(page.locator('[data-media="media/q2-none.mp4"]')).toBeAttached();
});

test('V10 — offline: Q1a có gói → chữ + ảnh từ gói, không media; Q2 → cần mạng; cả hai có lượt ghé', async ({ page, context }) => {
  await mockLookup(page);
  await startTrip(page, readyPackage());
  await goOffline(page);

  await scan(page, 'Q1a');
  await expect(page.getByText(vi.notice.sourceFailureInJourney)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Q1a (gói)' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Q1a (gói)' })).toBeVisible();
  await expect(page.locator('audio, video')).toHaveCount(0);

  await page.getByRole('link', { name: vi.content.back }).click();
  await scan(page, 'Q2');
  // Điểm ONLINE_AVAILABLE không có nội dung offline (US-M02-03 mục 3; bảng copy SCR-M02-002)
  await expect(page.getByRole('alert')).toContainText(vi.content.needsNetwork);

  const visits = (await dumpStores(page, ['checkpointVisits'])).checkpointVisits as { checkpointId: string }[];
  expect(visits.map((v) => v.checkpointId).sort()).toEqual(['C1', 'C2']);
  await context.setOffline(false);
});

test('V10b — offline, gói thiếu resource của mã → "Chưa có nội dung offline cho điểm này." (BR-M02-018)', async ({ page, context }) => {
  const pkg = readyPackage();
  // Gói hợp lệ của manifest không còn Q3: bỏ C3 khỏi manifest và resource của nó
  pkg.manifest.checkpoints = pkg.manifest.checkpoints.filter((c) => c.checkpointId !== 'C3');
  pkg.resources = pkg.resources.filter((r) => r.qrIdentifier !== 'Q3');
  await mockLookup(page);
  await startTrip(page, pkg);
  await goOffline(page);
  await scan(page, 'Q3');
  await expect(page.getByRole('alert')).toContainText(vi.notice.noOfflineResource);
  await context.setOffline(false);
});

test('V11 — gói A v2 OUTDATED, phiên v3, offline quét Q1a → nội dung gói + cảnh báo gói cũ', async ({ page, context }) => {
  await mockLookup(page);
  await startTrip(page, readyPackage(2, 'OUTDATED'));
  await goOffline(page);
  await scan(page, 'Q1a');
  await expect(page.getByRole('heading', { name: 'Q1a (gói)' })).toBeVisible();
  await expect(page.getByText(vi.content.outdatedPackage)).toBeVisible();
  await context.setOffline(false);
});

test('V12 — lookup không trả lời trong 8 s với Q1a → lỗi nguồn, lượt ghé, nội dung gói; không "mã không hợp lệ"', async ({ page }) => {
  test.setTimeout(60_000);
  await mockLookup(page, { Q1a: { delayMs: 9_000 } });
  await startTrip(page, readyPackage());
  await scan(page, 'Q1a');
  await expect(page.getByText(vi.notice.sourceFailureInJourney)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Q1a (gói)' })).toBeVisible();
  await expect(page.getByText(vi.notice.invalid)).toHaveCount(0);
  const visits = (await dumpStores(page, ['checkpointVisits'])).checkpointVisits as { checkpointId: string }[];
  expect(visits.map((v) => v.checkpointId)).toEqual(['C1']);
});
