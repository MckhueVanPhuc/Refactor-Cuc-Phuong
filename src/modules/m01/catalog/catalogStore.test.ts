// Danh mục đọc thành công lần cuối, chỉ trong bộ nhớ (tasks T044; research R-13; FR-M01-002).
import { describe, expect, it } from 'vitest';
import { visitorDb } from '../../../shared/db/visitorDb';
import { createFakeSource } from '../api/fake/fakeSource';
import { createCatalogStore } from './catalogStore';

describe('catalogStore', () => {
  it('ban đầu idle; refresh → loading → ready với mọi dòng hợp lệ', async () => {
    const fake = createFakeSource();
    const store = createCatalogStore(fake.source);
    expect(store.getSnapshot()).toEqual({ status: 'idle' });
    const pending = store.refresh();
    expect(store.getSnapshot()).toEqual({ status: 'loading' });
    await pending;
    const state = store.getSnapshot();
    expect(state.status === 'ready' && state.routes.map((route) => route.routeId)).toEqual([
      'route-a',
      'route-b',
      'route-c',
      'route-d',
    ]);
    expect(state).toMatchObject({ stale: false, refreshing: false });
  });

  it('làm mới lỗi khi đã có local view → giữ local view kèm cờ dữ liệu cũ', async () => {
    const fake = createFakeSource();
    const store = createCatalogStore(fake.source);
    await store.refresh();
    fake.controls.setUnavailable(true);
    const pending = store.refresh();
    expect(store.getSnapshot()).toMatchObject({ status: 'ready', stale: false, refreshing: true });
    await pending;
    expect(store.getSnapshot()).toMatchObject({ status: 'ready', stale: true, refreshing: false });
  });

  it('làm mới thành công sau khi cũ → bỏ cờ dữ liệu cũ, thay local view', async () => {
    const fake = createFakeSource();
    const store = createCatalogStore(fake.source);
    await store.refresh();
    fake.controls.setUnavailable(true);
    await store.refresh();
    fake.controls.setUnavailable(false);
    fake.controls.setRouteStatus('route-a', 'TAM_DONG');
    await store.refresh();
    const state = store.getSnapshot();
    expect(state).toMatchObject({ status: 'ready', stale: false });
    expect(state.status === 'ready' && state.routes.find((route) => route.routeId === 'route-a')?.status).toBe('TAM_DONG');
  });

  it('mở lạnh khi không có nguồn → unavailable ("Source unavailable")', async () => {
    const fake = createFakeSource();
    fake.controls.setUnavailable(true);
    const store = createCatalogStore(fake.source);
    await store.refresh();
    expect(store.getSnapshot()).toEqual({ status: 'unavailable', refreshing: false });
  });

  it('hai lần refresh đồng thời chỉ đọc nguồn một lần', async () => {
    const fake = createFakeSource();
    let reads = 0;
    const counting = { ...fake.source, fetchCatalog: () => ((reads += 1), fake.source.fetchCatalog()) };
    const store = createCatalogStore(counting);
    await Promise.all([store.refresh(), store.refresh()]);
    expect(reads).toBe(1);
  });

  it('báo subscriber khi trạng thái đổi', async () => {
    const store = createCatalogStore(createFakeSource().source);
    const seen: string[] = [];
    store.subscribe(() => seen.push(store.getSnapshot().status));
    await store.refresh();
    expect(seen).toEqual(['loading', 'ready']);
  });

  it('không lưu bền: không ghi gì vào IndexedDB hay localStorage', async () => {
    const store = createCatalogStore(createFakeSource().source);
    await store.refresh();
    const counts = await Promise.all(visitorDb.tables.map((table) => table.count()));
    expect(counts.every((count) => count === 0)).toBe(true);
    expect(localStorage.length).toBe(0);
  });
});
