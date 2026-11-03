// Quickstart M02 V1–V4 (tasks T029): vào `/trip` với context M01 thật trên bản build MODE e2e.
// Đánh số journey 1, 2, 3 của V1 kiểm ở E2E của US2 (journey map dựng ở US2).
import { expect, test, type Page } from '@playwright/test';
import { vi } from '../../src/modules/m02/i18n/vi';
import { playSessions, putRawContext, seedValidContext } from './helpers';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** Mở app một lần để hook E2E được đăng ký, chọn tiếng Việt cho chữ ổn định. */
async function openApp(page: Page) {
  await page.addInitScript(() => Object.defineProperty(navigator, 'language', { get: () => 'vi-VN' }));
  await page.goto('/');
}

test('V1 — context v3 hợp lệ → một phiên DANG_DIEN_RA, sessionId UUID, sourceHandoffId = handoffId, gợi ý bắt đầu phiên', async ({ page }) => {
  await openApp(page);
  const context = await seedValidContext(page);
  await page.goto('/trip');
  await expect(page.getByText(vi.notice.sessionStartHint)).toBeVisible();
  const sessions = await playSessions(page);
  expect(sessions).toHaveLength(1);
  expect(sessions[0]).toMatchObject({ status: 'DANG_DIEN_RA', sourceHandoffId: context.handoffId, routeId: context.routeId });
  expect(String(sessions[0]!.sessionId)).toMatch(UUID);
});

test.describe('V2 — handoff không dùng được → không tạo phiên, thông báo bắt đầu lại từ M01', () => {
  test('context version 2', async ({ page }) => {
    await openApp(page);
    const { routeJourneyManifest, routeId, handoffId } = await seedValidContext(page);
    await putRawContext(page, { contractVersion: 2, handoffId, routeId, checkpoints: routeJourneyManifest.checkpoints });
    await page.goto('/trip');
    await expect(page.getByRole('alert')).toContainText(vi.handoff.outdatedVersion);
    await expect(page.getByRole('link', { name: vi.qrLink.chooseRoute })).toHaveAttribute('href', '/');
    expect(await playSessions(page)).toEqual([]);
  });

  test('REVOKED', async ({ page }) => {
    await openApp(page);
    await seedValidContext(page, { authorizationStatus: 'REVOKED' });
    await page.goto('/trip');
    await expect(page.getByRole('alert')).toContainText(vi.handoff.revoked);
    expect(await playSessions(page)).toEqual([]);
  });

  test('quá expiresAt 1 ms', async ({ page }) => {
    await openApp(page);
    const expiresAtMs = Date.now() - 1;
    await seedValidContext(page, { authorizedAt: new Date(expiresAtMs - 86_400_000).toISOString() });
    await page.goto('/trip');
    await expect(page.getByRole('alert')).toContainText(vi.handoff.expired);
    expect(await playSessions(page)).toEqual([]);
  });

  test('handoff đã có phiên terminal', async ({ page }) => {
    await openApp(page);
    await seedValidContext(page);
    await page.goto('/trip');
    await expect(page.getByText(vi.notice.sessionStartHint)).toBeVisible();
    // Kết thúc phiên trực tiếp trong IndexedDB (luồng Finish thuộc US5)
    await page.evaluate(
      () =>
        new Promise<void>((resolve, reject) => {
          const open = indexedDB.open('cuc-phuong-quest');
          open.onsuccess = () => {
            const tx = open.result.transaction('playSessions', 'readwrite');
            const store = tx.objectStore('playSessions');
            store.getAll().onsuccess = (event) => {
              for (const row of (event.target as IDBRequest<Record<string, unknown>[]>).result) {
                store.put({ ...row, status: 'HOAN_TAT', endedAt: new Date().toISOString() });
              }
            };
            tx.oncomplete = () => {
              open.result.close();
              resolve();
            };
            tx.onerror = () => reject(tx.error);
          };
        }),
    );
    await page.reload();
    await expect(page.getByRole('alert')).toContainText(vi.handoff.alreadyUsed);
    expect(await playSessions(page)).toHaveLength(1);
  });
});

test('V3 — tải lại giữa phiên, rồi offline và tải lại → cùng phiên', async ({ page, context }) => {
  await openApp(page);
  await seedValidContext(page);
  await page.goto('/trip');
  await expect(page.getByText(vi.notice.sessionStartHint)).toBeVisible();
  const [session] = await playSessions(page);

  await page.reload();
  await expect(page.locator('[data-entry="RESTORED"]')).toHaveAttribute('data-session-id', String(session!.sessionId));

  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('[data-entry="RESTORED"]')).toHaveAttribute('data-session-id', String(session!.sessionId));
  expect(await playSessions(page)).toHaveLength(1);
  await context.setOffline(false);
});

test('V4 — hai tab cùng vào /trip với một handoff mới → đúng một phiên', async ({ page, context }) => {
  await openApp(page);
  await seedValidContext(page);
  const other = await context.newPage();
  await Promise.all([page.goto('/trip'), other.goto('/trip')]);
  await expect(page.locator('[data-session-id]')).toHaveAttribute('data-session-id', UUID);
  await expect(other.locator('[data-session-id]')).toHaveAttribute('data-session-id', UUID);
  const sessions = await playSessions(page);
  expect(sessions).toHaveLength(1);
  // Hai tab hiện cùng một phiên
  expect(await other.locator('[data-session-id]').getAttribute('data-session-id')).toBe(sessions[0]!.sessionId);
  expect(await page.locator('[data-session-id]').getAttribute('data-session-id')).toBe(sessions[0]!.sessionId);
});
