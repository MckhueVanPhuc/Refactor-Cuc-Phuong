// Tiện ích E2E của M02. Dùng lại dumpStores / callM01Hook của M01 để nạp context qua hook `m01` và đọc store thật.
import { expect, type Page } from '@playwright/test';
import { contextV3 } from '../../src/modules/m02/api/fake/fixtures';
import { en } from '../../src/modules/m02/i18n/en';
import { vi } from '../../src/modules/m02/i18n/vi';
import { callM01Hook, dumpStores } from '../m01/helpers';

export const M02_STORES = ['playSessions', 'checkpointVisits', 'pendingSyncItems'];

/** Context v3 hợp lệ tính từ giờ hiện tại (hạn 24 giờ), nạp qua hook `m01.seedContext`. */
export async function seedValidContext(page: Page, overrides: Parameters<typeof contextV3>[0] = {}) {
  const context = contextV3({ authorizedAt: new Date(Date.now() - 60_000).toISOString(), ...overrides });
  await callM01Hook(page, 'seedContext', context);
  return context;
}

/**
 * Ghi thẳng một dòng `selectedRouteContext` không qua schema v3 (context version 2 cho V2). Chỉ là dữ liệu kiểm thử:
 * hook của M01 chỉ nhận context hợp lệ.
 */
export async function putRawContext(page: Page, row: Record<string, unknown>): Promise<void> {
  await page.evaluate(
    (value) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('cuc-phuong-quest');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction('selectedRouteContext', 'readwrite');
          tx.objectStore('selectedRouteContext').put({ ...value, slot: 'current' });
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
    row,
  );
}

export async function playSessions(page: Page): Promise<Record<string, unknown>[]> {
  return (await dumpStores(page, ['playSessions'])).playSessions as Record<string, unknown>[];
}

/** Chờ quá thời gian dự phòng của Mila (MASCOT_CONFIRM_FALLBACK_MS = 1 000 ms) trước khi đếm. */
const CONFIRM_SETTLE_MS = 1_300;

/** Toast "Đã ghi nhận lượt quét." (đúng nguyên câu, không khớp câu của Mila). */
export function visitToast(page: Page) {
  return page.getByText(vi.trip.visitRecorded, { exact: true }).or(page.getByText(en.trip.visitRecorded, { exact: true }));
}

/** Bong bóng xác nhận lượt ghé của Mila (050, 051, 055, 058). */
export function visitBubble(page: Page) {
  return page.locator('[data-mascot-message][role="status"]').filter({ hasText: /Đã ghi nhận|recorded/i });
}

/**
 * Lời xác nhận lượt ghé vừa ghi (spec-M02 §8, clarification 4; spec-Mascot BR-MAS-24; SC-MAS-015): đúng một trong hai,
 * toast hoặc bong bóng `role="status"` của Mila. Không bao giờ cả hai, không bao giờ không có gì. Trả về bên đã xác nhận.
 */
export async function expectCheckInFeedback(page: Page): Promise<'toast' | 'mascot'> {
  await expect(visitToast(page).or(visitBubble(page)).first()).toBeVisible();
  await page.waitForTimeout(CONFIRM_SETTLE_MS);
  const toasts = await visitToast(page).count();
  const bubbles = await visitBubble(page).count();
  expect(toasts + bubbles, 'đúng một lời xác nhận lượt ghé').toBe(1);
  return toasts === 1 ? 'toast' : 'mascot';
}

export { callM01Hook, dumpStores };
