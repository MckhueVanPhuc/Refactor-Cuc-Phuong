import { describe, expect, it, vi } from 'vitest';
import { createUpdateCoordinator, type LockManagerLike } from './updateCoordinator';

/** LockManager giả, đủ cho `cpq:busy`: shared giữ lâu dài, exclusive dùng `ifAvailable`. */
function createFakeLocks(): LockManagerLike & { sharedHolders: () => number } {
  let shared = 0;
  let exclusive = false;
  const request: LockManagerLike['request'] = async (name, options, callback) => {
    if (options.mode === 'shared') {
      shared += 1;
      try {
        return await callback({ name, mode: 'shared' });
      } finally {
        shared -= 1;
      }
    }
    if (shared > 0 || exclusive) return callback(null);
    exclusive = true;
    try {
      return await callback({ name, mode: 'exclusive' });
    } finally {
      exclusive = false;
    }
  };
  return { request, sharedHolders: () => shared };
}

describe('updateCoordinator (research R-22; M01 D-02)', () => {
  it('không có bản mới → none', async () => {
    const coordinator = createUpdateCoordinator({ locks: createFakeLocks() });
    expect(await coordinator.applyUpdate()).toBe('none');
  });

  it('báo cho subscriber khi có bản mới, không tự áp', () => {
    const coordinator = createUpdateCoordinator({ locks: createFakeLocks() });
    const listener = vi.fn();
    const apply = vi.fn();
    coordinator.subscribe(listener);
    coordinator.notifyUpdateAvailable(apply);
    expect(listener).toHaveBeenCalledWith(true);
    expect(coordinator.isUpdateAvailable()).toBe(true);
    expect(apply).not.toHaveBeenCalled();
  });

  it('người dùng đồng ý, không có việc bận → áp bản mới', async () => {
    const coordinator = createUpdateCoordinator({ locks: createFakeLocks() });
    const apply = vi.fn();
    coordinator.notifyUpdateAvailable(apply);
    expect(await coordinator.applyUpdate()).toBe('applied');
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it('registerBusyCheck trả true → hoãn, giữ bản đang chờ; hủy đăng ký thì áp được', async () => {
    const coordinator = createUpdateCoordinator({ locks: createFakeLocks() });
    const apply = vi.fn();
    coordinator.notifyUpdateAvailable(apply);
    const unregister = coordinator.registerBusyCheck(() => true);
    expect(await coordinator.applyUpdate()).toBe('deferred');
    expect(apply).not.toHaveBeenCalled();
    expect(coordinator.isUpdateAvailable()).toBe(true);
    unregister();
    expect(await coordinator.applyUpdate()).toBe('applied');
  });

  it('tab khác giữ lock shared cpq:busy → hoãn', async () => {
    const locks = createFakeLocks();
    const otherTab = createUpdateCoordinator({ locks });
    const coordinator = createUpdateCoordinator({ locks });
    const apply = vi.fn();
    coordinator.notifyUpdateAvailable(apply);
    otherTab.registerUnsavedForm('route-editor');
    expect(await coordinator.applyUpdate()).toBe('deferred');
    otherTab.unregisterUnsavedForm('route-editor');
    await vi.waitFor(() => expect(locks.sharedHolders()).toBe(0));
    expect(await coordinator.applyUpdate()).toBe('applied');
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it('registerUnsavedForm giữ lock shared tới khi unregister; đăng ký trùng id không giữ thêm', async () => {
    const locks = createFakeLocks();
    const coordinator = createUpdateCoordinator({ locks });
    coordinator.registerUnsavedForm('a');
    coordinator.registerUnsavedForm('a');
    coordinator.registerUnsavedForm('b');
    expect(locks.sharedHolders()).toBe(2);
    coordinator.unregisterUnsavedForm('a');
    coordinator.unregisterUnsavedForm('b');
    await vi.waitFor(() => expect(locks.sharedHolders()).toBe(0));
  });

  it('busy check bất đồng bộ (M02 hasRunningSession đọc Dexie): true → hoãn, false → áp', async () => {
    const coordinator = createUpdateCoordinator({ locks: createFakeLocks() });
    const apply = vi.fn();
    coordinator.notifyUpdateAvailable(apply);
    let busy = true;
    coordinator.registerBusyCheck(async () => busy);
    expect(await coordinator.applyUpdate()).toBe('deferred');
    busy = false;
    expect(await coordinator.applyUpdate()).toBe('applied');
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['ném lỗi', () => { throw new Error('đọc lỗi'); }],
    ['reject', () => Promise.reject(new Error('đọc lỗi'))],
  ])('busy check %s → coi là bận, hoãn (research R-14)', async (_label, check) => {
    const coordinator = createUpdateCoordinator({ locks: createFakeLocks() });
    const apply = vi.fn();
    coordinator.notifyUpdateAvailable(apply);
    coordinator.registerBusyCheck(check);
    expect(await coordinator.applyUpdate()).toBe('deferred');
    expect(apply).not.toHaveBeenCalled();
  });

  it('registerPackageOperation giữ lock shared cpq:busy suốt thao tác gói (M01 R-14)', async () => {
    const locks = createFakeLocks();
    const downloadTab = createUpdateCoordinator({ locks });
    const coordinator = createUpdateCoordinator({ locks });
    const apply = vi.fn();
    coordinator.notifyUpdateAvailable(apply);
    const release = downloadTab.registerPackageOperation();
    expect(locks.sharedHolders()).toBe(1);
    expect(await coordinator.applyUpdate()).toBe('deferred');
    release();
    release();
    await vi.waitFor(() => expect(locks.sharedHolders()).toBe(0));
    expect(await coordinator.applyUpdate()).toBe('applied');
  });

  it('không có Web Locks API → thao tác gói của tab này vẫn hoãn cập nhật', async () => {
    const coordinator = createUpdateCoordinator({ locks: undefined });
    const apply = vi.fn();
    coordinator.notifyUpdateAvailable(apply);
    const first = coordinator.registerPackageOperation();
    const second = coordinator.registerPackageOperation();
    first();
    expect(await coordinator.applyUpdate()).toBe('deferred');
    second();
    expect(await coordinator.applyUpdate()).toBe('applied');
  });

  it('không có Web Locks API → form chưa lưu của tab này vẫn hoãn cập nhật', async () => {
    const coordinator = createUpdateCoordinator({ locks: undefined });
    const apply = vi.fn();
    coordinator.notifyUpdateAvailable(apply);
    coordinator.registerUnsavedForm('a');
    expect(await coordinator.applyUpdate()).toBe('deferred');
    coordinator.unregisterUnsavedForm('a');
    expect(await coordinator.applyUpdate()).toBe('applied');
  });
});
