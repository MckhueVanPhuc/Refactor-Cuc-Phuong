// Luồng kết thúc chuyến (tasks T067; BR-M02-021; FR-M02-015, 016, 023; SC-M02-015) trên router M02 thật với cổng M01,
// lookup và Storage giả.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, createRoutesFromElements, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { contextV3 } from '../api/fake/fixtures';
import { vi as viMessages } from '../i18n/vi';
import { m02Routes } from '../routes';
import { handleScannedText } from '../scan/scanBridge';
import { pendingSyncItemsTable, playSessionsTable } from '../storage/tables';
import { fakeM01 } from '../testing/fakeM01Port';

vi.mock('../m01Port', () => import('../testing/fakeM01Port'));
vi.mock('../api/mediaUrl', () => ({ mediaUrlClient: { signedUrls: async () => new Map() } }));
vi.mock('../api/lookupClient', async () => ({ lookupClient: (await import('../api/fake/fakeLookup')).createFakeLookup() }));

const AUTHORIZED_AT = '2026-11-04T01:00:00.000Z';
const BASE = 'http://localhost:5174';

function renderApp() {
  const router = createMemoryRouter(createRoutesFromElements(<>{m02Routes}</>), { initialEntries: ['/trip'] });
  render(<RouterProvider router={router} />);
  return router;
}

async function startTrip() {
  fakeM01.setContext(contextV3({ authorizedAt: AUTHORIZED_AT }));
  const router = renderApp();
  await screen.findByText(viMessages.notice.sessionStartHint);
  return router;
}

const scan = (qr: string) => act(() => handleScannedText(`${BASE}/q/${qr}`));
const prompt = () => screen.queryByRole('alertdialog');
const finishButton = () => screen.queryByRole('button', { name: viMessages.trip.finish });

async function backToTrip(router: ReturnType<typeof renderApp>) {
  await act(() => router.navigate('/trip'));
  await screen.findByRole('heading', { name: viMessages.screenTitle.trip });
  await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(3));
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(Date.parse(AUTHORIZED_AT) + 60_000));
  fakeM01.reset();
  fakeM01.setLanguage({ languageCode: 'vi' });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('kết thúc chuyến', () => {
  it('Finish chỉ có sau khi điểm cuối đã quét (FR-M02-015)', async () => {
    const router = await startTrip();
    expect(finishButton()).toBeNull();
    await scan('Q1a');
    await backToTrip(router);
    expect(finishButton()).toBeNull();
    await scan('Q3');
    await backToTrip(router);
    expect(finishButton()).not.toBeNull();
  });

  it('quét điểm cuối lần đầu → câu hỏi một lần; [Đi tiếp] giữ phiên; quét lại không hỏi (BR-M02-021; SC-M02-015)', async () => {
    const router = await startTrip();
    await scan('Q3');
    expect((await screen.findByRole('alertdialog')).textContent).toContain(viMessages.endPrompt.question);
    fireEvent.click(screen.getByRole('button', { name: viMessages.endPrompt.continue }));
    await waitFor(() => expect(prompt()).toBeNull());
    expect((await playSessionsTable.toArray()).map((s) => s.status)).toEqual(['DANG_DIEN_RA']);

    await backToTrip(router);
    expect(finishButton()).not.toBeNull();
    await scan('Q3');
    await screen.findByRole('heading', { name: 'Đối tượng Q3' });
    expect(prompt()).toBeNull();
  });

  it('[Kết thúc] → HOAN_TAT kể cả khi bỏ qua điểm trước; mục hàng đợi PENDING; sang màn kết quả (FR-M02-016)', async () => {
    await startTrip();
    await scan('Q3');
    fireEvent.click(await screen.findByRole('button', { name: viMessages.endPrompt.end }));
    expect(await screen.findByRole('heading', { name: viMessages.end.title })).toBeTruthy();
    expect((await playSessionsTable.toArray()).map((s) => s.status)).toEqual(['HOAN_TAT']);
    expect((await pendingSyncItemsTable.toArray()).map((i) => i.syncStatus)).toEqual(['PENDING']);
  });

  it('Finish → xác nhận → màn kết quả: danh sách điểm đã quét theo thứ tự, trạng thái chờ gửi, về danh sách tuyến', async () => {
    const router = await startTrip();
    await scan('Q3');
    fireEvent.click(await screen.findByRole('button', { name: viMessages.endPrompt.continue }));
    // Trình quét ở SCR-M02-001: quay lại phiên rồi quét tiếp
    await backToTrip(router);
    await scan('Q1b');
    await backToTrip(router);

    fireEvent.click(finishButton()!);
    expect((await screen.findByRole('alertdialog')).textContent).toContain(viMessages.endPrompt.question);
    fireEvent.click(screen.getByRole('button', { name: viMessages.endPrompt.end }));

    await screen.findByRole('heading', { name: viMessages.end.title });
    expect(router.state.location.pathname).toBe('/trip/end');
    expect(screen.getByRole('heading', { name: viMessages.end.listTitle })).toBeTruthy();
    const items = screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(items).toHaveLength(2);
    expect(items[0]).toContain('Cổng rừng');
    expect(items[1]).toContain('Động Người Xưa');
    for (const item of items) expect(item).toContain(viMessages.trip.scanned);
    expect(await screen.findByText(viMessages.end.syncPending)).toBeTruthy();
    expect(screen.getByRole('link', { name: viMessages.end.backToRoutes }).getAttribute('href')).toBe('/');
  });

  it('không có nút "Dừng chuyến đi" ở màn phiên và màn kết quả (SR-SCR-M02-003-003)', async () => {
    await startTrip();
    expect(screen.queryByRole('button', { name: /dừng chuyến/i })).toBeNull();
    await scan('Q3');
    fireEvent.click(await screen.findByRole('button', { name: viMessages.endPrompt.end }));
    await screen.findByRole('heading', { name: viMessages.end.title });
    expect(screen.queryByRole('button', { name: /dừng chuyến/i })).toBeNull();
  });
});
