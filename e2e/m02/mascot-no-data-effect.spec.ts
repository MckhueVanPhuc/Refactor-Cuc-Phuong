// Mila không ghi dữ liệu, không gửi gì ra ngoài (specs/005 tasks T074; BR-MAS-01, BR-MAS-18; SC-MAS-001).
// Build `preview:e2e` bật VITE_FEATURE_MASCOT=on. Một chuyến trọn vẹn: Start → quét điểm cuối → Kết thúc → gửi.
import { expect, test, type Page, type Route } from '@playwright/test';
import { VISITOR_DB_NAME, VISITOR_DB_SCHEMA_V1 } from '../../src/shared/db/visitorDb';
import { vi } from '../../src/modules/m02/i18n/vi';
import { dumpStores, seedValidContext } from './helpers';
import { mockLookup, mockStorage } from './network';

const BASE = 'http://localhost:4173';
type M02TestWindow = { __cpqTestHooks?: { m02?: { scan?: (text: string) => Promise<void> } } };

async function scan(page: Page, qr: string) {
  await page.waitForFunction(() => Boolean((window as unknown as M02TestWindow).__cpqTestHooks?.m02?.scan));
  await page.evaluate((text) => (window as unknown as M02TestWindow).__cpqTestHooks!.m02!.scan!(text), `${BASE}/q/${qr}`);
  await expect(page).toHaveURL(new RegExp(`/trip/qr/${qr}$`));
}

test('chuyến trọn vẹn với Mila bật: không khóa lưu trữ mới, store IndexedDB không đổi, bản ghi gửi đi đúng, không request mang dữ liệu Mila', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(`${request.url()}\n${request.postData() ?? ''}`));
  const intakeBodies: Record<string, unknown>[] = [];
  await page.route('**/functions/v1/session-intake', async (route: Route) => {
    if (route.request().method() !== 'POST') return route.fulfill({ status: 204 });
    intakeBodies.push(JSON.parse(route.request().postData() ?? '{}') as Record<string, unknown>);
    return route.fulfill({ status: 200, json: { result: 'ACCEPTED' } });
  });
  await page.addInitScript(() => Object.defineProperty(navigator, 'language', { get: () => 'vi-VN' }));
  await mockLookup(page);
  await mockStorage(page);
  await page.goto('/');
  await seedValidContext(page);
  await page.goto('/trip');
  await expect(page.getByText(vi.notice.sessionStartHint)).toBeVisible();

  await scan(page, 'Q3');
  // Hộp thoại đã có style cố định ở đáy rồi mới bấm (như sync.spec.ts)
  // spec-M02 v3.4 (BR-M02-021): câu hỏi kết thúc chuyến hiện khi về màn chuyến đi
  await page.getByRole('link', { name: vi.content.back }).click();
  await page.waitForFunction(() => {
    const dialog = document.querySelector('[role="alertdialog"]');
    return Boolean(dialog?.parentElement && getComputedStyle(dialog.parentElement).position === 'fixed');
  });
  await page.getByRole('button', { name: vi.endPrompt.end, exact: true }).click();
  await expect(page).toHaveURL(/\/trip\/end$/);
  await expect(page.getByText(vi.end.syncSynced)).toBeVisible();

  // Không khóa lưu trữ nào của Mila
  const storageKeys = await page.evaluate(() => [...Object.keys(localStorage), ...Object.keys(sessionStorage)]);
  expect(storageKeys.filter((key) => /mascot|mila/i.test(key))).toEqual([]);

  // Danh sách store IndexedDB đúng như khai báo, không database nào khác
  const idb = await page.evaluate(async (name) => {
    const names = (await indexedDB.databases()).map((db) => db.name);
    const stores = await new Promise<string[]>((resolve, reject) => {
      const open = indexedDB.open(name);
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        resolve([...open.result.objectStoreNames]);
        open.result.close();
      };
    });
    return { names, stores };
  }, VISITOR_DB_NAME);
  expect(idb.names).toEqual([VISITOR_DB_NAME]);
  expect(idb.stores.sort()).toEqual(Object.keys(VISITOR_DB_SCHEMA_V1).sort());

  // Bản ghi gửi đi là bản ghi của M02, không có trường của Mila
  expect(intakeBodies).toHaveLength(1);
  expect(Object.keys(intakeBodies[0]!).sort()).toEqual(['contentVersion', 'endedAt', 'routeId', 'sessionId', 'startedAt', 'status', 'visitedCheckpoints']);
  const dump = await dumpStores(page, ['pendingSyncItems']);
  expect((dump.pendingSyncItems as Array<{ record: unknown }>)[0]!.record).toEqual(intakeBodies[0]);

  // Không request nào mang dữ liệu của Mila (tệp tĩnh của bản build dưới /assets/ không mang dữ liệu nên bỏ qua)
  const dataRequests = requests.filter((entry) => !new URL(entry.split('\n')[0]!).pathname.startsWith('/assets/'));
  expect(dataRequests.filter((entry) => /MSG-MAS|mascot/i.test(entry))).toEqual([]);
});
