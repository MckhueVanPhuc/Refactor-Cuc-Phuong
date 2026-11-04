// Tự đóng phiên quá 24 giờ (tasks T066; BR-M02-022; FR-M02-024; SC-M02-016) trên fake-indexeddb.
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { CHECKPOINTS, ROUTE_A } from '../api/fake/fixtures';
import { recordVisit } from '../storage/recordVisit';
import { pendingSyncItemsTable, playSessionsTable } from '../storage/tables';
import { autoEndForgottenSession, resetAutoEndNoticeForTest, useAutoEndNotice } from './autoEnd';

const SESSION = '5b1e2d3c-4a5f-4e6d-8c7b-9a0f1e2d3c4b';
const STARTED_AT = '2026-11-04T02:00:00.000Z';
const DAY = 86_400_000;
const after = (ms: number) => new Date(Date.parse(STARTED_AT) + ms);

async function seedSession() {
  await playSessionsTable.add({
    sessionId: SESSION,
    sourceHandoffId: '1d0c6a2e-7b4f-4c3a-9e8d-2f1a0b9c8d7e',
    routeId: ROUTE_A,
    contentVersion: 3,
    journeyCheckpoints: structuredClone([...CHECKPOINTS]),
    status: 'DANG_DIEN_RA',
    startedAt: STARTED_AT,
  });
}

beforeEach(() => resetAutoEndNoticeForTest());

describe('autoEndForgottenSession', () => {
  it('đúng 24 giờ chưa đóng; hơn 24 giờ 1 ms mới đóng ("more than")', async () => {
    await seedSession();
    expect(await autoEndForgottenSession(after(DAY))).toBeNull();
    expect((await playSessionsTable.get(SESSION))!.status).toBe('DANG_DIEN_RA');
    expect(await autoEndForgottenSession(after(DAY + 1))).toBe('BO_DO');
  });

  it('đã ghé điểm cuối → HOAN_TAT; endedAt = lượt ghé mới nhất; xếp hàng đồng bộ cùng lúc', async () => {
    await seedSession();
    await recordVisit(SESSION, 'C3', 'Q3', after(600_000));
    await recordVisit(SESSION, 'C1', 'Q1a', after(1_200_000));
    expect(await autoEndForgottenSession(after(DAY + 1))).toBe('HOAN_TAT');
    const endedAt = after(1_200_000).toISOString();
    expect(await playSessionsTable.get(SESSION)).toMatchObject({ status: 'HOAN_TAT', endedAt });
    expect(await pendingSyncItemsTable.toArray()).toEqual([
      expect.objectContaining({ sessionId: SESSION, syncStatus: 'PENDING', record: expect.objectContaining({ status: 'HOAN_TAT', endedAt }) }),
    ]);
  });

  it('chưa ghé điểm cuối → BO_DO; chưa quét gì → endedAt = startedAt', async () => {
    await seedSession();
    expect(await autoEndForgottenSession(after(2 * DAY))).toBe('BO_DO');
    expect((await playSessionsTable.get(SESSION))!.endedAt).toBe(STARTED_AT);
  });

  it('chạy lặp vô hại: lần hai không đổi gì, không thêm mục hàng đợi', async () => {
    await seedSession();
    await autoEndForgottenSession(after(DAY + 1));
    expect(await autoEndForgottenSession(after(DAY + 2))).toBeNull();
    expect(await pendingSyncItemsTable.count()).toBe(1);
  });

  it('không có phiên → null', async () => {
    expect(await autoEndForgottenSession(after(DAY * 3))).toBeNull();
  });

  it('thông báo hiện một lần: màn đang mở nhận, màn mở sau không nhận lại', async () => {
    await seedSession();
    const open = renderHook(() => useAutoEndNotice());
    await act(() => autoEndForgottenSession(after(DAY + 1)));
    expect(open.result.current).toBe('BO_DO');
    open.unmount();
    expect(renderHook(() => useAutoEndNotice()).result.current).toBeNull();
  });

  it('đóng trước khi có màn nào mở → màn mở kế tiếp hiện thông báo', async () => {
    await seedSession();
    await autoEndForgottenSession(after(DAY + 1));
    expect(renderHook(() => useAutoEndNotice()).result.current).toBe('BO_DO');
  });
});
