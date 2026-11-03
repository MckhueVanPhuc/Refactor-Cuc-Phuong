// Tiện ích E2E của M02. Dùng lại dumpStores / callM01Hook của M01 để nạp context qua hook `m01` và đọc store thật.
import type { Page } from '@playwright/test';
import { contextV3 } from '../../src/modules/m02/api/fake/fixtures';
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

export { callM01Hook, dumpStores };
