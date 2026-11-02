// Local view danh mục (research R-13): danh mục đọc thành công lần cuối trong phiên chạy hiện tại, chỉ trong
// bộ nhớ (Physical §11 không có store danh mục; constitution VI cấm runtime-cache Data API). Làm mới lỗi → giữ local
// view kèm cờ dữ liệu cũ; chưa từng đọc được → "Source unavailable" (FR-M01-002; SR-SCR-M01-001-004).
import { useEffect, useSyncExternalStore } from 'react';
import type { PublishedRoute } from '../../../shared/contracts/publishedRoute';
import type { SourceClient } from '../api/sourceClient';

export type CatalogState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; routes: PublishedRoute[]; stale: boolean; refreshing: boolean }
  | { status: 'unavailable'; refreshing: boolean };

export type CatalogStore = ReturnType<typeof createCatalogStore>;

export function createCatalogStore(source: Pick<SourceClient, 'fetchCatalog'>) {
  let state: CatalogState = { status: 'idle' };
  let inFlight: Promise<void> | undefined;
  const listeners = new Set<() => void>();

  function set(next: CatalogState) {
    state = next;
    for (const listener of listeners) listener();
  }

  async function read(): Promise<void> {
    const previous = state;
    if (previous.status === 'ready' || previous.status === 'unavailable') set({ ...previous, refreshing: true });
    else set({ status: 'loading' });

    const result = await source.fetchCatalog();
    if (result.kind === 'OK') {
      set({ status: 'ready', routes: result.value, stale: false, refreshing: false });
    } else if (previous.status === 'ready') {
      set({ status: 'ready', routes: previous.routes, stale: true, refreshing: false });
    } else {
      set({ status: 'unavailable', refreshing: false });
    }
  }

  return {
    getSnapshot: (): CatalogState => state,
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    /** Đọc lại nguồn; lần gọi trùng khi đang đọc dùng chung một request. */
    refresh(): Promise<void> {
      inFlight ??= read().finally(() => {
        inFlight = undefined;
      });
      return inFlight;
    },
  };
}

// Một store cho mỗi adapter nguồn, sống suốt phiên chạy của app
const stores = new WeakMap<object, CatalogStore>();

export function catalogStoreFor(source: Pick<SourceClient, 'fetchCatalog'>): CatalogStore {
  let store = stores.get(source);
  if (!store) {
    store = createCatalogStore(source);
    stores.set(source, store);
  }
  return store;
}

/** Trạng thái danh mục; mỗi lần màn được mở thì làm mới nguồn (screen spec SCR-M01-001 §5 mục 6). */
export function useCatalog(source: Pick<SourceClient, 'fetchCatalog'>): CatalogState {
  const store = catalogStoreFor(source);
  useEffect(() => {
    void store.refresh();
  }, [store]);
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
