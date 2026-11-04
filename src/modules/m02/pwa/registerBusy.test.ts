// M02 hoãn cập nhật app (tasks T092; research R-15; constitution VI) với coordinator thật của shell. jsdom không có
// Web Locks, nên coordinator chỉ dựa vào busy check và việc bận của chính tab này — đúng phần M02 đăng ký.
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { updateCoordinator } from '../../../app/pwa/updateCoordinator';
import { CHECKPOINTS, ROUTE_A } from '../api/fake/fixtures';
import { playSessionsTable } from '../storage/tables';
import { holdBusy, registerM02BusyCheck, useBusyWhile } from './registerBusy';

const SESSION = '5b1e2d3c-4a5f-4e6d-8c7b-9a0f1e2d3c4b';
const cleanups: (() => void)[] = [];

async function seedRunning() {
  await playSessionsTable.add({
    sessionId: SESSION,
    sourceHandoffId: '1d0c6a2e-7b4f-4c3a-9e8d-2f1a0b9c8d7e',
    routeId: ROUTE_A,
    contentVersion: 3,
    journeyCheckpoints: structuredClone([...CHECKPOINTS]),
    status: 'DANG_DIEN_RA',
    startedAt: '2026-11-04T02:00:00.000Z',
  });
}

function offerUpdate() {
  const apply = vi.fn();
  updateCoordinator.notifyUpdateAvailable(apply);
  return apply;
}

afterEach(() => {
  while (cleanups.length) cleanups.pop()!();
});

describe('M02 và update coordinator', () => {
  it('có phiên DANG_DIEN_RA → bản mới bị hoãn, kể cả khi không có màn M02 nào mở; phiên kết thúc → áp được', async () => {
    cleanups.push(registerM02BusyCheck());
    await seedRunning();
    const apply = offerUpdate();
    expect(await updateCoordinator.applyUpdate()).toBe('deferred');
    expect(apply).not.toHaveBeenCalled();

    await playSessionsTable.update(SESSION, { status: 'HOAN_TAT', endedAt: '2026-11-04T03:00:00.000Z' });
    expect(await updateCoordinator.applyUpdate()).toBe('applied');
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it('đăng ký lặp không nhân đôi busy check; không có phiên → áp được', async () => {
    cleanups.push(registerM02BusyCheck(), registerM02BusyCheck());
    const apply = offerUpdate();
    expect(await updateCoordinator.applyUpdate()).toBe('applied');
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it('đang xử lý quét/đồng bộ → hoãn; nhả → áp được', async () => {
    const release = holdBusy('m02:scan');
    const apply = offerUpdate();
    expect(await updateCoordinator.applyUpdate()).toBe('deferred');
    release();
    expect(await updateCoordinator.applyUpdate()).toBe('applied');
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it('useBusyWhile giữ khi active, nhả khi hết active hoặc unmount', async () => {
    const { rerender, unmount } = renderHook(({ active }: { active: boolean }) => useBusyWhile(active, 'm02:session'), {
      initialProps: { active: true },
    });
    offerUpdate();
    expect(await updateCoordinator.applyUpdate()).toBe('deferred');
    rerender({ active: false });
    expect(await updateCoordinator.applyUpdate()).toBe('applied');

    rerender({ active: true });
    offerUpdate();
    expect(await updateCoordinator.applyUpdate()).toBe('deferred');
    unmount();
    expect(await updateCoordinator.applyUpdate()).toBe('applied');
  });
});
