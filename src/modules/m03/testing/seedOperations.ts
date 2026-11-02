// Dựng dữ liệu cho test đóng/mở lại/lưu trữ (US6), qua chính AdminApi giả. Chỉ test import file này.
import type { AdminApi } from '../api/AdminApi';
import { createFakeAdminApi } from '../api/fake/fakeAdminApi';
import { FIXTURE_ACCOUNTS } from '../api/fake/fixtures';
import type { FakeStore } from '../api/fake/store';
import type { AdminRole } from '../contracts/adminDtos';
import { seedCheckpoint } from './seedCheckpoints';
import { publishSeededRoute, seedRoute } from './seedRoutes';

/** Chạy `work` với AdminApi giả dưới danh tính `role`, rồi trả lại người dùng trước đó */
export async function asRole<T>(store: FakeStore, role: AdminRole, work: (api: AdminApi) => Promise<T>): Promise<T> {
  const previousUser = store.currentUserId;
  store.currentUserId = FIXTURE_ACCOUNTS[role].userId;
  try {
    return await work(createFakeAdminApi(store));
  } finally {
    store.currentUserId = previousUser;
  }
}

async function publishedRoute(store: FakeStore, name: string, checkpointIds: string[]) {
  const { routeId } = await seedRoute(store, { complete: true, checkpointIds, content: { name: { vi: name, en: `${name} (en)` } } });
  await publishSeededRoute(store, routeId);
  return routeId;
}

/**
 * Quickstart Q19: điểm dừng "Hang Con Moong" (X) là điểm dừng hoạt động duy nhất của "Tuyến A";
 * "Tuyến B" liệt kê X và "Động Người Xưa" (Y). Mọi thứ đã xuất bản.
 */
export async function seedSharedCheckpoint(store: FakeStore) {
  const x = await seedCheckpoint(store, { name: 'Hang Con Moong', mode: 'OFFLINE_REQUIRED', visitPoints: [{ name: 'Cây chò', ready: true }], publish: true });
  const y = await seedCheckpoint(store, { name: 'Động Người Xưa', mode: 'OFFLINE_REQUIRED', visitPoints: [{ name: 'Cây lim', ready: true }], publish: true });
  const routeA = await publishedRoute(store, 'Tuyến A', [x.checkpointId]);
  const routeB = await publishedRoute(store, 'Tuyến B', [x.checkpointId, y.checkpointId]);
  return { x, y, routeA, routeB };
}

export async function closeCheckpointAs(store: FakeStore, role: AdminRole, checkpointId: string) {
  return asRole(store, role, async (api) => {
    const editor = await api.getCheckpointEditor(checkpointId);
    const result = await api.closeCheckpoint({ checkpointId, reason: 'Sạt lở', expected: { entity: editor.concurrencyRevision } });
    if (!result.ok) throw new Error(`không đóng được điểm dừng: ${result.reason}`);
  });
}

export async function closeRouteAs(store: FakeStore, role: AdminRole, routeId: string) {
  return asRole(store, role, async (api) => {
    const editor = await api.getRouteEditor(routeId);
    const result = await api.closeRoute({ routeId, reason: 'Sạt lở', expected: { entity: editor.concurrencyRevision } });
    if (!result.ok) throw new Error(`không đóng được tuyến: ${result.reason}`);
  });
}
