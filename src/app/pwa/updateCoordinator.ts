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

/** Điều kiện bận lưu bền (M01 R-14, D-02); hàm ném lỗi hoặc reject được coi là bận. */
export type BusyCheck = () => boolean | Promise<boolean>;

export type UpdateCoordinator = ReturnType<typeof createUpdateCoordinator>;

export function createUpdateCoordinator({ locks }: { locks: LockManagerLike | undefined }) {
  let pendingApply: (() => void | Promise<void>) | null = null;
  const listeners = new Set<(available: boolean) => void>();
  const busyChecks = new Set<BusyCheck>();
  // id form → hàm nhả lock shared
  const unsavedForms = new Map<string, () => void>();
  // Số thao tác gói M01 đang chạy trong tab này (chỉ dùng khi không có Web Locks API)
  let packageOperations = 0;

  function notify(available: boolean) {
    for (const listener of listeners) listener(available);
  }

  /** Giữ lock shared `cpq:busy` tới khi gọi hàm trả về. */
  function holdBusyLock(): () => void {
    if (!locks) return () => {};
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    void locks.request(BUSY_LOCK, { mode: 'shared' }, () => held);
    return release;
  }

  async function anyBusyCheck(): Promise<boolean> {
    const results = await Promise.allSettled([...busyChecks].map(async (check) => check()));
    return results.some((result) => result.status === 'rejected' || result.value);
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
    registerBusyCheck(check: BusyCheck): () => void {
      busyChecks.add(check);
      return () => busyChecks.delete(check);
    },

    /** M03: giữ lock shared `cpq:busy` khi form `id` còn thay đổi chưa lưu. */
    registerUnsavedForm(id: string): void {
      if (unsavedForms.has(id)) return;
      unsavedForms.set(id, holdBusyLock());
    },

    /** M01: giữ lock shared `cpq:busy` suốt một thao tác gói; gọi hàm trả về khi xong (gọi lại không có tác dụng). */
    registerPackageOperation(): () => void {
      packageOperations += 1;
      const releaseLock = holdBusyLock();
      let released = false;
      return () => {
        if (released) return;
        released = true;
        packageOperations -= 1;
        releaseLock();
      };
    },

    unregisterUnsavedForm(id: string): void {
      unsavedForms.get(id)?.();
      unsavedForms.delete(id);
    },

    /** Gọi khi người dùng đồng ý cập nhật. Còn việc bận thì hoãn và giữ bản đang chờ. */
    async applyUpdate(): Promise<ApplyUpdateResult> {
      const apply = pendingApply;
      if (!apply) return 'none';
      if (await anyBusyCheck()) return 'deferred';

      const run = async (): Promise<ApplyUpdateResult> => {
        pendingApply = null;
        notify(false);
        await apply();
        return 'applied';
      };

      // Không có Web Locks API: chỉ biết form chưa lưu và thao tác gói của chính tab này
      if (!locks) return unsavedForms.size > 0 || packageOperations > 0 ? 'deferred' : run();

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

export const registerBusyCheck = (check: BusyCheck) => updateCoordinator.registerBusyCheck(check);
export const registerPackageOperation = () => updateCoordinator.registerPackageOperation();
export const registerUnsavedForm = (id: string) => updateCoordinator.registerUnsavedForm(id);
export const unregisterUnsavedForm = (id: string) => updateCoordinator.unregisterUnsavedForm(id);
