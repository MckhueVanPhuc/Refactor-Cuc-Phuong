// Quickstart M02 V16–V19 (tasks T068): câu hỏi cuối chuyến, Kết thúc / Đi tiếp, thay phiên (và lỗi), tự đóng sau
// hơn 24 giờ. Mã đi qua `window.__cpqTestHooks.m02.scan`; giờ thiết bị điều khiển bằng `page.clock` cho V19.
import { expect, test, type Page } from '@playwright/test';
import { contextV3 } from '../../src/modules/m02/api/fake/fixtures';
import { vi } from '../../src/modules/m02/i18n/vi';
import { callM01Hook, dumpStores, seedValidContext } from './helpers';
import { mockLookup, mockStorage } from './network';

const BASE = 'http://localhost:4173';
const DAY = 86_400_000;

type M02TestWindow = { __cpqTestHooks?: { m02?: { scan?: (text: string) => Promise<void>; failNextCreateSession?: () => void } } };

type SessionRow = { sessionId: string; sourceHandoffId: string; status: string; startedAt: string; endedAt?: string };
type SyncRow = { sessionId: string; syncStatus: string; record: { status: string; endedAt: string } };

async function startTrip(page: Page) {
  await page.addInitScript(() => Object.defineProperty(navigator, 'language', { get: () => 'vi-VN' }));
  await mockLookup(page);
  await mockStorage(page);
  await page.goto('/');
  const context = await seedValidContext(page);
  await page.goto('/trip');
  await expect(page.getByText(vi.notice.sessionStartHint)).toBeVisible();
  return context;
}

async function m02Hook(page: Page, name: 'scan' | 'failNextCreateSession', arg?: string) {
  await page.waitForFunction((hook) => Boolean((window as unknown as M02TestWindow).__cpqTestHooks?.m02?.[hook]), name);
  await page.evaluate(([hook, value]) => (window as unknown as M02TestWindow).__cpqTestHooks!.m02![hook]!(value as string), [name, arg] as const);
}

const scan = async (page: Page, qr: string) => {
  await m02Hook(page, 'scan', `${BASE}/q/${qr}`);
  await expect(page).toHaveURL(new RegExp(`/trip/qr/${qr}$`));
};

async function stores(page: Page) {
  const dump = await dumpStores(page, ['playSessions', 'pendingSyncItems']);
  return { sessions: dump.playSessions as SessionRow[], items: dump.pendingSyncItems as SyncRow[] };
}

/** Về SCR-M02-001 bằng liên kết "Quay lại" (điều hướng trong app, giữ trạng thái JS của trang). */
async function back(page: Page) {
  await page.getByRole('link', { name: vi.content.back }).click();
  await expect(page).toHaveURL(/\/trip$/);
  await expect(page.getByRole('listitem')).toHaveCount(3);
}

test('V16 — quét Q3 lần đầu: câu hỏi một lần; [Đi tiếp] → Finish còn; quét lại Q3 không hỏi', async ({ page }) => {
  await startTrip(page);
  await scan(page, 'Q3');
  await expect(page.getByRole('alertdialog')).toContainText(vi.endPrompt.question);
  await page.getByRole('button', { name: vi.endPrompt.continue }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);

  await back(page);
  await expect(page.getByRole('button', { name: vi.trip.finish })).toBeVisible();
  await scan(page, 'Q3');
  await expect(page.getByRole('heading', { name: 'Đối tượng Q3' })).toBeVisible();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  expect((await stores(page)).sessions.map((s) => s.status)).toEqual(['DANG_DIEN_RA']);
});

test('V17 — [Kết thúc] khi chưa quét C2 → HOAN_TAT; mục hàng đợi PENDING cùng lúc; màn kết quả', async ({ page }) => {
  await startTrip(page);
  await scan(page, 'Q3');
  await page.getByRole('button', { name: vi.endPrompt.end }).click();
  await expect(page).toHaveURL(/\/trip\/end$/);
  await expect(page.getByRole('heading', { name: vi.end.title })).toBeVisible();
  await expect(page.getByText(vi.end.syncPending)).toBeVisible();
  const { sessions, items } = await stores(page);
  expect(sessions.map((s) => s.status)).toEqual(['HOAN_TAT']);
  expect(items).toEqual([expect.objectContaining({ sessionId: sessions[0]!.sessionId, syncStatus: 'PENDING', record: expect.objectContaining({ status: 'HOAN_TAT' }) })]);
});

test('V18 — handoff mới khi đang có phiên → cũ BO_DO + mục hàng đợi, mới chạy', async ({ page }) => {
  const first = await startTrip(page);
  await callM01Hook(page, 'seedContext', contextV3({ authorizedAt: new Date(Date.now() - 60_000).toISOString(), handoffId: '2e1d0c9b-8a7f-4e6d-9c5b-4a3f2e1d0c9b' }));
  await page.goto('/trip');
  await expect(page.getByText(vi.notice.sessionStartHint)).toBeVisible();
  const { sessions, items } = await stores(page);
  const old = sessions.find((s) => s.sourceHandoffId === first.handoffId)!;
  expect(old).toMatchObject({ status: 'BO_DO', endedAt: expect.any(String) });
  expect(sessions.filter((s) => s.status === 'DANG_DIEN_RA').map((s) => s.sourceHandoffId)).toEqual(['2e1d0c9b-8a7f-4e6d-9c5b-4a3f2e1d0c9b']);
  expect(items).toEqual([expect.objectContaining({ sessionId: old.sessionId, syncStatus: 'PENDING', record: expect.objectContaining({ status: 'BO_DO' }) })]);
});

test('V18 (lỗi) — lỗi khi chèn phiên mới → phiên cũ vẫn chạy, không có mục hàng đợi, báo chưa bắt đầu được', async ({ page }) => {
  const first = await startTrip(page);
  await scan(page, 'Q1a');
  await callM01Hook(page, 'seedContext', contextV3({ authorizedAt: new Date(Date.now() - 60_000).toISOString(), handoffId: '2e1d0c9b-8a7f-4e6d-9c5b-4a3f2e1d0c9b' }));
  await m02Hook(page, 'failNextCreateSession');
  await page.getByRole('link', { name: vi.content.back }).click();
  await expect(page.getByRole('alert')).toHaveText(vi.trip.replaceFailed);
  const { sessions, items } = await stores(page);
  expect(sessions.map((s) => [s.sourceHandoffId, s.status])).toEqual([[first.handoffId, 'DANG_DIEN_RA']]);
  expect(items).toEqual([]);
});

test.describe('V19 — giờ thiết bị +24 h rồi đưa trang hiện lại', () => {
  for (const visitedFinal of [true, false]) {
    test(visitedFinal ? 'đã quét C3 → HOAN_TAT, endedAt = lượt ghé mới nhất' : 'chưa quét C3 → BO_DO, endedAt = startedAt', async ({ page }) => {
      await page.clock.install({ time: new Date() });
      await startTrip(page);
      if (visitedFinal) {
        await scan(page, 'Q3');
        await page.getByRole('button', { name: vi.endPrompt.continue }).click();
        await back(page);
      }
      const before = (await stores(page)).sessions[0]!;
      await page.clock.setSystemTime(Date.parse(before.startedAt) + DAY + 60_000);
      await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));

      await expect(page.getByText(visitedFinal ? vi.notice.autoEndedCompleted : vi.notice.autoEndedAbandoned)).toBeVisible();
      const { sessions, items } = await stores(page);
      const visits = (await dumpStores(page, ['checkpointVisits'])).checkpointVisits as { checkedInAt: string }[];
      const expectedEnd = visitedFinal ? visits.map((v) => v.checkedInAt).sort().at(-1) : before.startedAt;
      expect(sessions[0]).toMatchObject({ status: visitedFinal ? 'HOAN_TAT' : 'BO_DO', endedAt: expectedEnd });
      expect(items).toEqual([expect.objectContaining({ syncStatus: 'PENDING' })]);
    });
  }
});
