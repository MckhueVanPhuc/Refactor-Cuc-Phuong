// Hàm đọc ba store M02 (tasks T019; BR-M02-002) trên fake-indexeddb.
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { SessionSyncRecord } from '../../../shared/contracts/sessionSyncRecord';
import { CHECKPOINTS, ROUTE_A } from '../api/fake/fixtures';
import {
  getLatestTerminalSyncItem,
  getRunningSession,
  getSessionVisits,
  hasRunningSession,
  useRunningSession,
  useSessionVisits,
} from './readers';
import type { PlaySessionRow } from './rows';
import { checkpointVisitsTable, pendingSyncItemsTable, playSessionsTable } from './tables';

const uuid = (n: number) => `5b1e2d3c-4a5f-4e6d-8c7b-9a0f1e2d3c${String(n).padStart(2, '0')}`;

function session(n: number, change: Partial<PlaySessionRow> = {}): PlaySessionRow {
  return {
    sessionId: uuid(n),
    sourceHandoffId: uuid(50 + n),
    routeId: ROUTE_A,
    contentVersion: 3,
    journeyCheckpoints: structuredClone([...CHECKPOINTS]),
    status: 'DANG_DIEN_RA',
    startedAt: '2026-11-04T02:00:00.000Z',
    ...change,
  };
}

function record(n: number, endedAt: string): SessionSyncRecord {
  return {
    sessionId: uuid(n),
    routeId: ROUTE_A,
    contentVersion: 3,
    startedAt: '2026-11-01T02:00:00.000Z',
    endedAt,
    status: 'BO_DO',
    visitedCheckpoints: [],
  };
}

describe('readers M02', () => {
  it('không có dữ liệu → không phiên, không mục hàng đợi', async () => {
    expect(await getRunningSession()).toBeNull();
    expect(await hasRunningSession()).toBe(false);
    expect(await getLatestTerminalSyncItem()).toBeNull();
  });

  it('getRunningSession chỉ trả phiên DANG_DIEN_RA', async () => {
    await playSessionsTable.bulkAdd([
      session(1, { status: 'HOAN_TAT', endedAt: '2026-11-04T03:00:00.000Z' }),
      session(2),
    ]);
    expect((await getRunningSession())?.sessionId).toBe(uuid(2));
    expect(await hasRunningSession()).toBe(true);
  });

  it('getSessionVisits chỉ trả lượt ghé của phiên đó', async () => {
    await checkpointVisitsTable.bulkAdd([
      { sessionId: uuid(1), checkpointId: 'C1', qrIdentifier: 'Q1a', checkedInAt: '2026-11-04T02:10:00.000Z' },
      { sessionId: uuid(1), checkpointId: 'C2', qrIdentifier: 'QN', checkedInAt: '2026-11-04T02:20:00.000Z' },
      { sessionId: uuid(2), checkpointId: 'C1', qrIdentifier: 'Q1b', checkedInAt: '2026-11-04T02:30:00.000Z' },
    ]);
    expect((await getSessionVisits(uuid(1))).map((v) => v.checkpointId).sort()).toEqual(['C1', 'C2']);
  });

  it('getLatestTerminalSyncItem chọn chuyến có endedAt muộn nhất', async () => {
    await pendingSyncItemsTable.bulkAdd([
      { sessionId: uuid(1), record: record(1, '2026-11-02T02:00:00.000Z'), syncStatus: 'SYNCED' },
      { sessionId: uuid(2), record: record(2, '2026-11-03T02:00:00.000Z'), syncStatus: 'CONFLICT' },
      { sessionId: uuid(3), record: record(3, '2026-11-01T05:00:00.000Z'), syncStatus: 'PENDING' },
    ]);
    expect(await getLatestTerminalSyncItem()).toMatchObject({ sessionId: uuid(2), syncStatus: 'CONFLICT' });
  });

  it('useRunningSession thấy phiên mới và phiên kết thúc mà không tải lại (BR-M02-002)', async () => {
    const { result } = renderHook(() => useRunningSession());
    await waitFor(() => expect(result.current).toEqual({ status: 'ready', value: null }));

    await act(() => playSessionsTable.add(session(1)));
    await waitFor(() => expect(result.current).toMatchObject({ status: 'ready', value: { sessionId: uuid(1) } }));

    await act(() => playSessionsTable.update(uuid(1), { status: 'BO_DO', endedAt: '2026-11-04T03:00:00.000Z' }));
    await waitFor(() => expect(result.current).toEqual({ status: 'ready', value: null }));
  });

  it('useSessionVisits cập nhật khi có lượt ghé mới; không có sessionId → rỗng', async () => {
    const { result, rerender } = renderHook(({ id }: { id: string | undefined }) => useSessionVisits(id), {
      initialProps: { id: undefined as string | undefined },
    });
    await waitFor(() => expect(result.current).toEqual({ status: 'ready', value: [] }));

    rerender({ id: uuid(1) });
    await act(() =>
      checkpointVisitsTable.add({ sessionId: uuid(1), checkpointId: 'C3', qrIdentifier: 'Q3', checkedInAt: '2026-11-04T02:40:00.000Z' }),
    );
    await waitFor(() => expect(result.current).toMatchObject({ status: 'ready', value: [{ checkpointId: 'C3' }] }));
  });
});
