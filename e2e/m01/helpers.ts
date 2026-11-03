// Tiện ích E2E của M01: đọc store IndexedDB thật và gọi hook `m01` (src/modules/m01/testing/e2eHooks.ts).
import type { Page } from '@playwright/test';

/** Mọi dòng của các store trong database `cuc-phuong-quest` (Blob được thay bằng kích thước để so sánh được). */
export function dumpStores(page: Page, stores: string[]): Promise<Record<string, unknown[]>> {
  return page.evaluate(
    (names) =>
      new Promise<Record<string, unknown[]>>((resolve, reject) => {
        const open = indexedDB.open('cuc-phuong-quest');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction(names, 'readonly');
          const out: Record<string, unknown[]> = {};
          for (const name of names) {
            const request = tx.objectStore(name).getAll();
            request.onsuccess = () => {
              out[name] = request.result.map((row: Record<string, unknown>) =>
                row.blob instanceof Blob ? { ...row, blob: row.blob.size } : row,
              );
            };
          }
          tx.oncomplete = () => {
            db.close();
            resolve(out);
          };
        };
      }),
    stores,
  );
}

/** Hình dạng `window.__cpqTestHooks.m01` (đăng ký ở MODE e2e/fake, src/modules/m01/testing/e2eHooks.ts). */
type M01TestWindow = { __cpqTestHooks?: { m01?: Record<string, (...args: unknown[]) => Promise<unknown>> } };

/** Gọi một hook của namespace `m01` sau khi app đã đăng ký hook (MODE e2e). */
export async function callM01Hook(page: Page, name: string, ...args: unknown[]): Promise<void> {
  await page.waitForFunction((hook) => Boolean((window as unknown as M01TestWindow).__cpqTestHooks?.m01?.[hook]), name);
  await page.evaluate(
    async ([hook, hookArgs]) => {
      await (window as unknown as M01TestWindow).__cpqTestHooks!.m01![hook]!(...hookArgs);
    },
    [name, args] as const,
  );
}

export const PACKAGE_STORES = ['offlinePackages', 'offlineResources', 'imageBytes', 'activePackages', 'packageCandidates'];
