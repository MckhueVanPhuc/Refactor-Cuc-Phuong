// Trạng thái đồng bộ trên giao diện (tasks T086; E-SCR-M02-003-07, -08; E-SCR-M02-001-22; BR-M02-011).
import { act, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, createRoutesFromElements, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SessionSyncRecord } from '../../../shared/contracts/sessionSyncRecord';
import { CHECKPOINTS, ROUTE_A } from '../api/fake/fixtures';
import { vi as viMessages } from '../i18n/vi';
import { m02Routes } from '../routes';
import type { SyncStatus } from '../storage/rows';
import { pendingSyncItemsTable, playSessionsTable } from '../storage/tables';
import { fakeM01 } from '../testing/fakeM01Port';

vi.mock('../m01Port', () => import('../testing/fakeM01Port'));
vi.mock('../api/mediaUrl', () => ({ mediaUrlClient: { signedUrls: async () => new Map() } }));
vi.mock('../api/lookupClient', async () => ({ lookupClient: (await import('../api/fake/fakeLookup')).createFakeLookup() }));

const SESSION = '5b1e2d3c-4a5f-4e6d-8c7b-9a0f1e2d3c4b';
const ENDED_AT = '2026-11-04T03:00:00.000Z';

async function seedEnded(syncStatus: SyncStatus) {
  await playSessionsTable.add({
    sessionId: SESSION,
    sourceHandoffId: '1d0c6a2e-7b4f-4c3a-9e8d-2f1a0b9c8d7e',
    routeId: ROUTE_A,
    contentVersion: 3,
    journeyCheckpoints: structuredClone([...CHECKPOINTS]),
    status: 'BO_DO',
    startedAt: '2026-11-04T02:00:00.000Z',
    endedAt: ENDED_AT,
  });
  const record: SessionSyncRecord = {
    sessionId: SESSION,
    routeId: ROUTE_A,
    contentVersion: 3,
    startedAt: '2026-11-04T02:00:00.000Z',
    endedAt: ENDED_AT,
    status: 'BO_DO',
    visitedCheckpoints: [],
  };
  await pendingSyncItemsTable.add({ sessionId: SESSION, record, syncStatus });
}

function open(path: string, state?: unknown) {
  const router = createMemoryRouter(createRoutesFromElements(<>{m02Routes}</>), { initialEntries: [{ pathname: path, state }] });
  render(<RouterProvider router={router} />);
}

const noActionButtons = () =>
  expect(screen.queryAllByRole('button').map((b) => b.textContent?.toLowerCase())).not.toEqual(
    expect.arrayContaining([expect.stringMatching(/thử lại|gửi lại|sửa|xóa|retry|delete/)]),
  );

beforeEach(() => {
  fakeM01.reset();
  fakeM01.setLanguage({ languageCode: 'vi' });
});

describe('SCR-M02-003 — trạng thái đồng bộ', () => {
  it.each<[SyncStatus, string]>([
    ['PENDING', viMessages.end.syncPending],
    ['SYNCED', viMessages.end.syncSynced],
    ['CONFLICT', viMessages.end.syncConflict],
  ])('%s → "%s"; không có nút thử lại, sửa hay xóa', async (status, text) => {
    await seedEnded(status);
    open('/trip/end', { sessionId: SESSION });
    expect(await screen.findByText(text)).toBeTruthy();
    noActionButtons();
  });

  it('đổi trạng thái ở nơi khác (runner) → màn kết quả cập nhật ngay', async () => {
    await seedEnded('PENDING');
    open('/trip/end', { sessionId: SESSION });
    await screen.findByText(viMessages.end.syncPending);
    await act(() => pendingSyncItemsTable.update(SESSION, { syncStatus: 'SYNCED' }));
    expect(await screen.findByText(viMessages.end.syncSynced)).toBeTruthy();
  });

  it('offline: kết thúc vẫn hiện "Chờ gửi về hệ thống"', async () => {
    vi.stubGlobal('navigator', { ...navigator, onLine: false });
    await seedEnded('PENDING');
    open('/trip/end', { sessionId: SESSION });
    expect(await screen.findByText(viMessages.end.syncPending)).toBeTruthy();
    vi.unstubAllGlobals();
  });
});

describe('SCR-M02-001 — dòng lỗi chuyến trước (E-SCR-M02-001-22)', () => {
  it('chuyến gần nhất CONFLICT và chưa có chuyến mới → một dòng lỗi, không có thao tác', async () => {
    await seedEnded('CONFLICT');
    open('/trip');
    expect(await screen.findByText(viMessages.trip.previousTripSyncError)).toBeTruthy();
    noActionButtons();
  });

  it('chuyến trước CONFLICT nhưng đã có chuyến mới đang chạy → không có dòng lỗi', async () => {
    await seedEnded('CONFLICT');
    await playSessionsTable.add({
      sessionId: '6c2f3e4d-5b6a-4f7e-9d8c-0b1a2f3e4d5c',
      sourceHandoffId: '2e1d0c9b-8a7f-4e6d-9c5b-4a3f2e1d0c9b',
      routeId: ROUTE_A,
      contentVersion: 3,
      journeyCheckpoints: structuredClone([...CHECKPOINTS]),
      status: 'DANG_DIEN_RA',
      startedAt: '2026-11-04T04:00:00.000Z',
    });
    open('/trip');
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(3));
    expect(screen.queryByText(viMessages.trip.previousTripSyncError)).toBeNull();
  });

  it.each<SyncStatus>(['PENDING', 'SYNCED'])('chuyến gần nhất %s → không có dòng lỗi', async (status) => {
    await seedEnded(status);
    open('/trip');
    await screen.findByText(viMessages.handoff.none);
    await waitFor(() => expect(screen.queryByText(viMessages.trip.previousTripSyncError)).toBeNull());
  });
});
