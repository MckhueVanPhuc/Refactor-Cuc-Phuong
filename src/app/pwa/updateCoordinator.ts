// Điều phối cập nhật PWA kiểu prompt (research R-22; M01 R-14, D-02).
// Bản mới chỉ được áp khi người dùng đồng ý, mọi busy check trả false và lấy được
// lock exclusive `cpq:busy` (ifAvailable). Việc bận ở bất kỳ tab nào giữ lock shared.

export const BUSY_LOCK = 'cpq:busy';

export type LockLike = { name: string; mode: 'shared' | 'exclusive' };

/** Phần của Web Locks API mà coordinator cần; test dùng bản giả. */
export interface LockManagerLike {
  request<T>(
    name: string,
    options: { mode: 'shared' | 'exclusive'; ifAvailable?: boolean },
    callback: (lock: LockLike | null) => T | Promise<T>,
  ): Promise<T>;
}

export type ApplyUpdateResult = 'applied' | 'deferred' | 'none';

export type UpdateCoordinator = ReturnType<typeof createUpdateCoordinator>;

export function createUpdateCoordinator({ locks }: { locks: LockManagerLike | undefined }) {
  let pendingApply: (() => void | Promise<void>) | null = null;
  const listeners = new Set<(available: boolean) => void>();
  const busyChecks = new Set<() => boolean>();
  // id form → hàm nhả lock shared
  const unsavedForms = new Map<string, () => void>();

  function notify(available: boolean) {
    for (const listener of listeners) listener(available);
  }

  return {
    /** Service worker báo có bản mới; `apply` kích hoạt bản mới (không gọi ở đây). */
    notifyUpdateAvailable(apply: () => void | Promise<void>): void {
      pendingApply = apply;
      notify(true);
    },

    isUpdateAvailable(): boolean {
      return pendingApply !== null;
    },

    subscribe(listener: (available: boolean) => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    /** Module đăng ký điều kiện bận trong tab này (ví dụ M02 `hasRunningSession`). */
    registerBusyCheck(check: () => boolean): () => void {
      busyChecks.add(check);
      return () => busyChecks.delete(check);
    },

    /** M03: giữ lock shared `cpq:busy` khi form `id` còn thay đổi chưa lưu. */
    registerUnsavedForm(id: string): void {
      if (unsavedForms.has(id)) return;
      if (!locks) {
        unsavedForms.set(id, () => {});
        return;
      }
      let release: () => void = () => {};
      const held = new Promise<void>((resolve) => {
        release = resolve;
      });
      unsavedForms.set(id, release);
      void locks.request(BUSY_LOCK, { mode: 'shared' }, () => held);
    },

    unregisterUnsavedForm(id: string): void {
      unsavedForms.get(id)?.();
      unsavedForms.delete(id);
    },

    /** Gọi khi người dùng đồng ý cập nhật. Còn việc bận thì hoãn và giữ bản đang chờ. */
    async applyUpdate(): Promise<ApplyUpdateResult> {
      const apply = pendingApply;
      if (!apply) return 'none';
      if ([...busyChecks].some((check) => check())) return 'deferred';

      const run = async (): Promise<ApplyUpdateResult> => {
        pendingApply = null;
        notify(false);
        await apply();
        return 'applied';
      };

      // Không có Web Locks API: chỉ biết form chưa lưu của chính tab này
      if (!locks) return unsavedForms.size > 0 ? 'deferred' : run();

      return locks.request(BUSY_LOCK, { mode: 'exclusive', ifAvailable: true }, (lock) =>
        lock ? run() : ('deferred' as const),
      );
    },
  };
}

function browserLocks(): LockManagerLike | undefined {
  if (typeof navigator === 'undefined' || !navigator.locks) return undefined;
  const lockManager = navigator.locks;
  return {
    request: (name, options, callback) =>
      lockManager.request(name, options, (lock) => callback(lock ? { name: lock.name, mode: lock.mode } : null)),
  };
}

export const updateCoordinator = createUpdateCoordinator({ locks: browserLocks() });

export const registerBusyCheck = (check: () => boolean) => updateCoordinator.registerBusyCheck(check);
export const registerUnsavedForm = (id: string) => updateCoordinator.registerUnsavedForm(id);
export const unregisterUnsavedForm = (id: string) => updateCoordinator.unregisterUnsavedForm(id);
