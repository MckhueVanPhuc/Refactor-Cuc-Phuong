// Chế độ khách tự do trên SCR-M02-001 (tasks T083; SF-M02-008-01; FR-M02-019): không có handoff, không có phiên →
// nút Quét vẫn dùng được, mọi lần quét đi theo dòng 3/8 và không ghi gì.
import { act, render, screen } from '@testing-library/react';
import { createMemoryRouter, createRoutesFromElements, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FakeLookup } from '../api/fake/fakeLookup';
import { lookupClient } from '../api/lookupClient';
import { vi as viMessages } from '../i18n/vi';
import { m02Routes } from '../routes';
import { handleScannedText } from '../scan/scanBridge';
import { checkpointVisitsTable, pendingSyncItemsTable, playSessionsTable } from '../storage/tables';
import { fakeM01 } from '../testing/fakeM01Port';

vi.mock('../m01Port', () => import('../testing/fakeM01Port'));
vi.mock('../api/mediaUrl', () => ({ mediaUrlClient: { signedUrls: async () => new Map() } }));
vi.mock('../api/lookupClient', async () => ({ lookupClient: (await import('../api/fake/fakeLookup')).createFakeLookup() }));

const fakeLookup = lookupClient as FakeLookup;
const BASE = 'http://localhost:5174';

async function openTrip() {
  const router = createMemoryRouter(createRoutesFromElements(<>{m02Routes}</>), { initialEntries: ['/trip'] });
  render(<RouterProvider router={router} />);
  await screen.findByText(viMessages.handoff.none);
  return router;
}

beforeEach(() => {
  fakeLookup.reset();
  fakeM01.reset();
  fakeM01.setLanguage({ languageCode: 'vi' });
});

describe('TripPage — khách tự do', () => {
  it('không handoff, không phiên → có nút Quét; quét VALID → nội dung live + gợi ý khách tự do, không ghi gì', async () => {
    const router = await openTrip();
    expect(screen.getByRole('button', { name: viMessages.trip.scan })).toBeTruthy();
    await act(() => handleScannedText(`${BASE}/q/Q1a`));
    expect(router.state.location.pathname).toBe('/trip/qr/Q1a');
    expect(await screen.findByRole('heading', { name: 'Đối tượng Q1a' })).toBeTruthy();
    expect(screen.getByText(viMessages.notice.freeVisitor)).toBeTruthy();
    expect(fakeLookup.calls).toEqual([{ qrIdentifier: 'Q1a' }]);
    expect([await playSessionsTable.count(), await checkpointVisitsTable.count(), await pendingSyncItemsTable.count()]).toEqual([0, 0, 0]);
  });

  it('quét khi lỗi nguồn → cần kết nối kèm gợi ý khách tự do, ở lại SCR-M02-001', async () => {
    const router = await openTrip();
    fakeLookup.set('Q1a', 'SOURCE_ERROR');
    await act(() => handleScannedText(`${BASE}/q/Q1a`));
    expect(router.state.location.pathname).toBe('/trip');
    const alert = screen.getAllByRole('alert').find((el) => el.textContent?.includes(viMessages.notice.connectionNeeded));
    expect(alert?.textContent).toContain(viMessages.notice.freeVisitor);
    expect(await checkpointVisitsTable.count()).toBe(0);
  });
});
