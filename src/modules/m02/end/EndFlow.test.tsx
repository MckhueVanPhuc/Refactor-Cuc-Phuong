// Luồng kết thúc chuyến (tasks T067; BR-M02-021; FR-M02-015, 016, 023; SC-M02-015) trên router M02 thật với cổng M01,
// lookup và Storage giả.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, createRoutesFromElements, RouterProvider } from 'react-router';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PRELOAD_TIMEOUT_MS, preloadM02Routes } from '../testing/preloadRoutes';
import { contextV3 } from '../api/fake/fixtures';
import { resetFinalPromptForTest } from './finalPromptSignal';
import { vi as viMessages } from '../i18n/vi';
import { m02Routes } from '../routes';
import { handleScannedText } from '../scan/scanBridge';
import { pendingSyncItemsTable, playSessionsTable } from '../storage/tables';
import { fakeM01 } from '../testing/fakeM01Port';

vi.mock('../m01Port', () => import('../testing/fakeM01Port'));
vi.mock('../api/mediaUrl', () => ({ mediaUrlClient: { signedUrls: async () => new Map() } }));
vi.mock('../api/lookupClient', async () => ({ lookupClient: (await import('../api/fake/fakeLookup')).createFakeLookup() }));

// Nạp sẵn màn lazy để ca đầu tiên không quá thời gian chờ khi máy chậm (DV-100)
beforeAll(() => preloadM02Routes(), PRELOAD_TIMEOUT_MS);

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
  resetFinalPromptForTest();
  fakeM01.setLanguage({ languageCode: 'vi' });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('kết thúc chuyến (spec-M02 v3.4)', () => {
  it('nút Kết thúc chuyến có ở mọi lúc trong chuyến (FR-M02-015)', async () => {
    const router = await startTrip();
    expect(finishButton()).not.toBeNull();
    await scan('Q1a');
    await backToTrip(router);
    expect(finishButton()).not.toBeNull();
  });

  it('quét điểm cuối lần đầu → trang nội dung không hỏi; về màn chuyến đi → hỏi một lần; [Đi tiếp] giữ phiên (BR-M02-021; SC-M02-015)', async () => {
    const router = await startTrip();
    await scan('Q3');
    await screen.findByRole('heading', { name: 'Đối tượng Q3' });
    expect(prompt()).toBeNull();

    await backToTrip(router);
    expect((await screen.findByRole('alertdialog')).textContent).toContain(viMessages.endPrompt.someLeft({ r: 2 }));
    fireEvent.click(screen.getByRole('button', { name: viMessages.endPrompt.continue }));
    await waitFor(() => expect(prompt()).toBeNull());
    expect((await playSessionsTable.toArray()).map((s) => s.status)).toEqual(['DANG_DIEN_RA']);

    // Về lại màn chuyến đi, quét lại điểm cuối: không hỏi lần nữa
    await scan('Q1a');
    await backToTrip(router);
    expect(prompt()).toBeNull();
    await scan('Q3');
    await screen.findByRole('heading', { name: 'Đối tượng Q3' });
    await backToTrip(router);
    expect(prompt()).toBeNull();
  });

  it('quét đủ mọi điểm → câu "đã quét mã ở tất cả {n} điểm"', async () => {
    const router = await startTrip();
    for (const qr of ['Q1a', 'Q2', 'Q3']) {
      await scan(qr);
      await backToTrip(router);
    }
    expect((await screen.findByRole('alertdialog')).textContent).toContain(viMessages.endPrompt.allScanned({ n: 3 }));
    // M02-15 (CHG-MASCOT-2026-11-27-08 D1): đóng câu hỏi → thẻ quét đủ, "Kết thúc chuyến" là nút chính trước "Quét QR"
    fireEvent.click(screen.getByRole('button', { name: viMessages.endPrompt.continue }));
    await waitFor(() => expect(prompt()).toBeNull());
    const card = document.querySelector('[data-all-scanned]') as HTMLElement;
    expect(card.textContent).toContain(viMessages.trip.allScanned({ n: 3 }));
    expect([...card.querySelectorAll('button')].map((b) => b.textContent)).toEqual([viMessages.trip.finish, viMessages.trip.scan]);
  });

  it('chưa quét đủ → không có thẻ quét đủ; "Quét QR" vẫn là nút chính trước "Kết thúc chuyến" (M02-15)', async () => {
    const router = await startTrip();
    await scan('Q1a');
    await backToTrip(router);
    expect(document.querySelector('[data-all-scanned]')).toBeNull();
    const names = screen.getAllByRole('button').map((b) => b.textContent);
    expect(names.indexOf(viMessages.trip.scan)).toBeLessThan(names.indexOf(viMessages.trip.finish));
  });

  it('bàn phím: câu hỏi mở với focus ở [Kết thúc]; Esc = [Đi tiếp], phiên vẫn chạy (WCAG 2.1.1)', async () => {
    const router = await startTrip();
    await scan('Q3');
    await backToTrip(router);
    await screen.findByRole('alertdialog');
    expect(document.activeElement?.textContent).toBe(viMessages.endPrompt.end);
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(prompt()).toBeNull());
    expect((await playSessionsTable.toArray()).map((s) => s.status)).toEqual(['DANG_DIEN_RA']);
  });

  it('[Kết thúc] sau điểm cuối → HOAN_TAT kể cả khi bỏ qua điểm trước; mục hàng đợi PENDING; sang màn kết quả (FR-M02-016)', async () => {
    const router = await startTrip();
    await scan('Q3');
    await backToTrip(router);
    fireEvent.click(await screen.findByRole('button', { name: viMessages.endPrompt.end }));
    expect(await screen.findByRole('heading', { name: viMessages.end.title })).toBeTruthy();
    expect((await playSessionsTable.toArray()).map((s) => s.status)).toEqual(['HOAN_TAT']);
    expect((await pendingSyncItemsTable.toArray()).map((i) => i.syncStatus)).toEqual(['PENDING']);
  });

  it('Kết thúc trước điểm cuối → xác nhận "còn {r} điểm" → BO_DO, mục hàng đợi PENDING, màn kết quả (BR-M02-007 v3.4)', async () => {
    const router = await startTrip();
    await scan('Q1a');
    await backToTrip(router);
    expect(prompt()).toBeNull();
    fireEvent.click(finishButton()!);
    expect((await screen.findByRole('alertdialog')).textContent).toContain(viMessages.endPrompt.someLeft({ r: 2 }));
    fireEvent.click(screen.getByRole('button', { name: viMessages.endPrompt.end }));
    await screen.findByRole('heading', { name: viMessages.end.title });
    expect((await playSessionsTable.toArray()).map((s) => s.status)).toEqual(['BO_DO']);
    expect((await pendingSyncItemsTable.toArray()).map((i) => i.syncStatus)).toEqual(['PENDING']);
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)[0]).toContain('Cổng rừng');
  });

  it('Finish → xác nhận → màn kết quả: mọi điểm theo thứ tự (v3.6), trạng thái chờ gửi, hai lối ra', async () => {
    const router = await startTrip();
    await scan('Q3');
    await backToTrip(router);
    fireEvent.click(await screen.findByRole('button', { name: viMessages.endPrompt.continue }));
    await scan('Q1b');
    await backToTrip(router);

    fireEvent.click(finishButton()!);
    expect((await screen.findByRole('alertdialog')).textContent).toContain(viMessages.endPrompt.someLeft({ r: 1 }));
    fireEvent.click(screen.getByRole('button', { name: viMessages.endPrompt.end }));

    await screen.findByRole('heading', { name: viMessages.end.title });
    expect(router.state.location.pathname).toBe('/trip/end');
    expect(screen.getByRole('heading', { name: viMessages.end.listTitle })).toBeTruthy();
    const items = screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(items).toHaveLength(3);
    expect(items[0]).toContain('Cổng rừng');
    expect(items[0]).toContain(viMessages.end.visited);
    expect(items[1]).toContain(viMessages.end.missed);
    expect(items[2]).toContain('Động Người Xưa');
    expect(items[2]).toContain(viMessages.end.visited);
    expect(await screen.findByText(viMessages.end.syncPending)).toBeTruthy();
    expect(screen.getByRole('link', { name: viMessages.end.suggestNext }).getAttribute('href')).toBe('/recommend');
    expect(screen.getByRole('link', { name: viMessages.end.backToRoutes }).getAttribute('href')).toBe('/');
  });

  it('không có nút "Dừng chuyến đi" ở màn phiên và màn kết quả (SR-SCR-M02-003-003)', async () => {
    const router = await startTrip();
    expect(screen.queryByRole('button', { name: /dừng chuyến/i })).toBeNull();
    await scan('Q3');
    await backToTrip(router);
    fireEvent.click(await screen.findByRole('button', { name: viMessages.endPrompt.end }));
    await screen.findByRole('heading', { name: viMessages.end.title });
    expect(screen.queryByRole('button', { name: /dừng chuyến/i })).toBeNull();
  });
});
