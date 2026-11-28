// Màn kết quả SCR-M02-003 theo CHG-MASCOT-2026-11-28-10 (spec-M02 v3.6, spec-Mascot v1.10; M02-43, 44, 48): ảnh bìa có chip
// theo số điểm, một lời cảm ơn; thẻ tóm tắt k/n với tên tuyến khi có gói; danh sách mọi điểm với ảnh nhỏ; nhãn gửi dưới
// danh sách; banner CONFLICT không hình Mila; hai lối ra; đổi VI/EN.
import { act, render, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, createRoutesFromElements, RouterProvider } from 'react-router';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SessionSyncRecord } from '../../../shared/contracts/sessionSyncRecord';
import { CHECKPOINTS, readyPackage, ROUTE_A } from '../api/fake/fixtures';
import { en } from '../i18n/en';
import { vi as viMessages } from '../i18n/vi';
import { m02Routes } from '../routes';
import type { SyncStatus } from '../storage/rows';
import { checkpointVisitsTable, pendingSyncItemsTable, playSessionsTable } from '../storage/tables';
import { fakeM01 } from '../testing/fakeM01Port';
import { PRELOAD_TIMEOUT_MS, preloadM02Routes } from '../testing/preloadRoutes';
import { endPackageView } from './useEndPackageView';

vi.mock('../m01Port', () => import('../testing/fakeM01Port'));
vi.mock('../api/mediaUrl', () => ({ mediaUrlClient: { signedUrls: async () => new Map() } }));
vi.mock('../api/lookupClient', async () => ({ lookupClient: (await import('../api/fake/fakeLookup')).createFakeLookup() }));

beforeAll(() => preloadM02Routes(), PRELOAD_TIMEOUT_MS);

const SESSION = '7a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';
const STARTED_AT = '2026-11-04T02:00:00.000Z';
const ENDED_AT = '2026-11-04T03:00:00.000Z';

/** Phiên đã kết thúc với các lượt ghé `visited` (checkpointId → giờ quét). Journey fixture: C1, C2, C3. */
async function seedEnded(visited: Record<string, string>, syncStatus: SyncStatus = 'PENDING') {
  const status = 'C3' in visited ? 'HOAN_TAT' : 'BO_DO';
  await playSessionsTable.add({
    sessionId: SESSION,
    sourceHandoffId: '1d0c6a2e-7b4f-4c3a-9e8d-2f1a0b9c8d7e',
    routeId: ROUTE_A,
    contentVersion: 3,
    journeyCheckpoints: structuredClone([...CHECKPOINTS]),
    status,
    startedAt: STARTED_AT,
    endedAt: ENDED_AT,
  });
  const qrOf: Record<string, string> = { C1: 'Q1a', C2: 'Q2', C3: 'Q3' };
  for (const [checkpointId, checkedInAt] of Object.entries(visited)) {
    await checkpointVisitsTable.add({ sessionId: SESSION, checkpointId, qrIdentifier: qrOf[checkpointId]!, checkedInAt });
  }
  const record: SessionSyncRecord = {
    sessionId: SESSION,
    routeId: ROUTE_A,
    contentVersion: 3,
    startedAt: STARTED_AT,
    endedAt: ENDED_AT,
    status,
    visitedCheckpoints: [],
  };
  await pendingSyncItemsTable.add({ sessionId: SESSION, record, syncStatus });
}

function open() {
  const router = createMemoryRouter(createRoutesFromElements(<>{m02Routes}</>), {
    initialEntries: [{ pathname: '/trip/end', state: { sessionId: SESSION } }],
  });
  render(<RouterProvider router={router} />);
}

const items = () => within(document.querySelector('ol') as HTMLElement).getAllByRole('listitem');
const summary = () => document.querySelector('[data-end-summary]') as HTMLElement;
const at = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(2026, 10, 4, h, m);
  return d.toISOString();
};

beforeEach(() => {
  fakeM01.reset();
  fakeM01.setLanguage({ languageCode: 'vi' });
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:thumb'), revokeObjectURL: vi.fn() }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SCR-M02-003 — bố cục kết quả (CHG-MASCOT-2026-11-28-10)', () => {
  it('thiếu điểm: chip "Đã kết thúc chuyến đi", một tiêu đề, "2/3", mọi điểm theo thứ tự, điểm bỏ lỡ "Chưa ghé · lần sau nhé!"', async () => {
    await seedEnded({ C1: at('09:22'), C3: at('09:24') });
    open();
    expect(await screen.findByRole('heading', { level: 1, name: viMessages.end.title })).toBeTruthy();
    expect(screen.getByText(viMessages.end.chipEnded)).toBeTruthy();
    expect(screen.queryByText(viMessages.end.chipComplete)).toBeNull();
    expect(screen.getByText(viMessages.end.farewell)).toBeTruthy();
    await waitFor(() => expect(summary().textContent).toContain(`2/3 ${viMessages.end.visitedCount}`));

    expect(screen.getByRole('heading', { level: 2, name: viMessages.end.listTitle })).toBeTruthy();
    const rows = items().map((li) => li.textContent ?? '');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toContain('01');
    expect(rows[0]).toContain('Cổng rừng');
    expect(rows[0]).toContain(`${viMessages.end.visited} 09:22`);
    expect(rows[1]).toContain('Cây chò ngàn năm');
    expect(rows[1]).toContain(viMessages.end.missed);
    expect(rows[1]).not.toContain(viMessages.end.visited);
    expect(rows[2]).toContain(`${viMessages.end.visited} 09:24`);
    expect(items().map((li) => li.hasAttribute('data-visited'))).toEqual([true, false, true]);
  });

  it('quét đủ: chip "Hoàn thành hành trình", "3/3", không có điểm bỏ lỡ', async () => {
    await seedEnded({ C1: at('09:22'), C2: at('09:23'), C3: at('09:24') });
    open();
    expect(await screen.findByText(viMessages.end.chipComplete)).toBeTruthy();
    await waitFor(() => expect(summary().textContent).toContain(`3/3 ${viMessages.end.visitedCount}`));
    expect(screen.queryByText(viMessages.end.missed)).toBeNull();
  });

  it('có gói sẵn sàng của tuyến: tên tuyến và dòng nhỏ; ảnh nhỏ là ảnh đầu tiên của điểm, điểm không có ảnh → ô biểu tượng', async () => {
    fakeM01.setPackage(readyPackage());
    await seedEnded({ C1: at('09:22'), C2: at('09:23'), C3: at('09:24') });
    open();
    expect((await screen.findByText('Tuyến A')).closest('[data-end-summary]') !== null).toBe(true);
    expect(within(summary()).getByText(viMessages.end.routeComplete)).toBeTruthy();
    await waitFor(() =>
      expect(items().map((li) => li.querySelector('[data-end-thumb]')?.getAttribute('data-end-thumb'))).toEqual(['', 'placeholder', '']),
    );
    // Ảnh chỉ trang trí: tên điểm đã là chữ của dòng
    for (const img of document.querySelectorAll('img[data-end-thumb]')) expect(img.getAttribute('alt')).toBe('');
  });

  it('không có gói: không tên tuyến, không dòng nhỏ; mọi ảnh nhỏ là ô biểu tượng', async () => {
    await seedEnded({ C1: at('09:22') });
    open();
    await waitFor(() => expect(summary().textContent).toContain(`1/3 ${viMessages.end.visitedCount}`));
    expect(screen.queryByText(viMessages.end.routeYours)).toBeNull();
    expect(screen.queryByText('Tuyến A')).toBeNull();
    expect(items().map((li) => li.querySelector('[data-end-thumb]')?.getAttribute('data-end-thumb'))).toEqual(['placeholder', 'placeholder', 'placeholder']);
  });

  it('nhãn gửi nằm ngay dưới danh sách; hai lối ra: "Gợi ý tuyến tiếp theo" (/recommend) trước "Về danh sách tuyến" (/)', async () => {
    await seedEnded({ C1: at('09:22') });
    open();
    const status = await screen.findByText(viMessages.end.syncPending);
    expect(status.getAttribute('role')).toBe('status');
    const list = document.querySelector('ol') as HTMLElement;
    expect(list.compareDocumentPosition(status) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const links = screen.getAllByRole('link').map((a) => [a.textContent, a.getAttribute('href')]);
    expect(links).toEqual([
      [viMessages.end.suggestNext, '/recommend'],
      [viMessages.end.backToRoutes, '/'],
    ]);
  });

  it('CONFLICT: banner chỉ có chữ (không hình Mila), không nhãn gửi, không nút thử lại', async () => {
    await seedEnded({ C1: at('09:22') }, 'CONFLICT');
    open();
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe(viMessages.end.syncConflict);
    const banner = document.querySelector('[data-end-conflict]') as HTMLElement;
    expect(banner.querySelector('[data-mascot-figure], img')).toBeNull();
    expect(screen.queryByRole('status', { name: viMessages.end.syncPending })).toBeNull();
    expect(screen.queryAllByRole('button').map((b) => b.textContent)).not.toContain(viMessages.content.retry);
  });

  it('đổi sang EN: mọi chữ của màn đổi ngay, kể cả tên điểm và tên tuyến', async () => {
    fakeM01.setPackage(readyPackage());
    await seedEnded({ C1: at('09:22'), C3: at('09:24') });
    open();
    await screen.findByText('Tuyến A');
    act(() => fakeM01.setLanguage({ languageCode: 'en' }));
    expect(await screen.findByRole('heading', { level: 1, name: en.end.title })).toBeTruthy();
    expect(screen.getByText(en.end.chipEnded)).toBeTruthy();
    expect(screen.getByText(en.end.farewell)).toBeTruthy();
    expect(within(summary()).getByText('Route A')).toBeTruthy();
    expect(within(summary()).getByText(en.end.routeYours)).toBeTruthy();
    expect(summary().textContent).toContain(`2/3 ${en.end.visitedCount}`);
    expect(screen.getByRole('heading', { level: 2, name: en.end.listTitle })).toBeTruthy();
    const rows = items().map((li) => li.textContent ?? '');
    expect(rows[0]).toContain('Forest gate');
    expect(rows[1]).toContain(en.end.missed);
    expect(screen.getByText(en.end.syncPending)).toBeTruthy();
    expect(screen.getByRole('link', { name: en.end.suggestNext })).toBeTruthy();
    expect(screen.getByRole('link', { name: en.end.backToRoutes })).toBeTruthy();
  });
});

describe('endPackageView', () => {
  it('ảnh đầu tiên của resource đầu tiên có ảnh, theo checkpointId; version là của gói', () => {
    const pkg = readyPackage(4);
    const view = endPackageView(pkg);
    expect(view.routeName).toEqual(pkg.routeEssentials.name);
    expect(view.thumbnails.get('C1')).toEqual({ routeId: ROUTE_A, contentVersion: 4, sourceRef: 'img/Q1a.png' });
    expect(view.thumbnails.has('C2')).toBe(false);
    expect(view.thumbnails.get('C3')?.sourceRef).toBe('img/Q3.png');
  });
});
