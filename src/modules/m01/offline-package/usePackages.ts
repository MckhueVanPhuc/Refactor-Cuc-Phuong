// Trạng thái gói theo thời gian thực cho SCR-M01-003/004 (liveQuery của Dexie; cả giữa các tab), và một bộ thao tác
// gói dùng chung cho cả app theo adapter nguồn (mutex trong tab phải dùng chung giữa các màn).
import { liveQuery } from 'dexie';
import { useEffect, useState } from 'react';
import { registerPackageOperation } from '../../../app/pwa/updateCoordinator';
import type { M01Services } from '../api/services';
import { listPackageEntries, type PackageEntry } from '../storage/readers';
import { browserLocks } from '../start/startRoute';
import { createPackageOps, type PackageOps } from './packageOps';

/** `undefined` khi chưa đọc xong lần đầu. */
export function usePackageEntries(): PackageEntry[] | undefined {
  const [entries, setEntries] = useState<PackageEntry[]>();
  useEffect(() => {
    const subscription = liveQuery(listPackageEntries).subscribe({
      next: setEntries,
      error: () => setEntries([]),
    });
    return () => subscription.unsubscribe();
  }, []);
  return entries;
}

const opsBySource = new WeakMap<object, PackageOps>();

export function packageOpsFor({ source, media }: M01Services): PackageOps {
  let ops = opsBySource.get(source);
  if (!ops) {
    ops = createPackageOps({
      source,
      media,
      locks: browserLocks(),
      registerPackageOperation,
      persistStorage: async () => (typeof navigator !== 'undefined' && navigator.storage?.persist ? navigator.storage.persist() : false),
    });
    opsBySource.set(source, ops);
  }
  return ops;
}
