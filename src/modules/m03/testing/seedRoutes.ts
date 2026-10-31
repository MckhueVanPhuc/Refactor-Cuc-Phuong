// Dựng tuyến cho test component, qua chính AdminApi giả. Chỉ test import file này.
import { syntheticFile } from '../api/contract/harness';
import { createFakeAdminApi } from '../api/fake/fakeAdminApi';
import { FIXTURE_ACCOUNTS } from '../api/fake/fixtures';
import type { FakeStore } from '../api/fake/store';
import type { RouteContent } from '../contracts/adminDtos';

export type SeedRoute = {
  checkpointIds?: string[];
  /** đủ nội dung để xuất bản (trừ điểm dừng) */
  complete?: boolean;
  /** có ảnh sơ đồ tuyến; `offline` bật tick dùng khi không có mạng */
  map?: 'online' | 'offline';
  content?: Partial<RouteContent>;
};

const pair = (vi: string) => ({ vi, en: `${vi} (en)` });

export const COMPLETE_ROUTE: Partial<RouteContent> = {
  name: pair('Đường lên Mả Tổ'),
  shortDescription: pair('Rừng nguyên sinh'),
  description: pair('Mô tả đầy đủ của tuyến'),
  startingPoint: pair('Trung tâm du khách'),
  safetyWarning: pair('Dốc trơn khi mưa'),
  distanceKm: 4.5,
  durationMin: 150,
  difficulty: 'TRUNG_BINH',
  groupTags: ['GROUP_CA_NHAN_NGUOI_LON'],
  experienceTags: ['INTEREST_KHAM_PHA'],
};

function must<T>(result: { ok: true; data: T } | { ok: false; reason: string }): T {
  if (!result.ok) throw new Error(`seed thất bại: ${result.reason}`);
  return result.data;
}

export async function seedRoute(store: FakeStore, seed: SeedRoute = {}): Promise<{ routeId: string }> {
  const previousUser = store.currentUserId;
  store.currentUserId = FIXTURE_ACCOUNTS.CONTENT_STAFF.userId;
  const api = createFakeAdminApi(store);
  try {
    const { routeId } = must(await api.saveRouteDraft({ content: { noSafetyWarningConfirmed: false, offlineRouteMapRequired: false } }));
    const image = async (usage: 'ROUTE_THUMBNAIL' | 'ROUTE_MAP') => {
      const { objectPath } = await api.uploadMedia({ ownerType: 'ROUTE', ownerId: routeId, file: syntheticFile('anh.jpg', 'image/jpeg', 2048) });
      return must(await api.registerMedia({ ownerType: 'ROUTE', ownerId: routeId, usage, type: 'IMAGE', objectPath })).mediaId;
    };
    const thumbnail = seed.complete ? await image('ROUTE_THUMBNAIL') : undefined;
    const map = seed.map ? await image('ROUTE_MAP') : undefined;
    const editor = await api.getRouteEditor(routeId);
    const content: RouteContent = {
      noSafetyWarningConfirmed: false,
      offlineRouteMapRequired: seed.map === 'offline',
      ...(seed.complete ? COMPLETE_ROUTE : {}),
      ...(thumbnail ? { thumbnailMediaId: thumbnail } : {}),
      ...(map ? { routeMapMediaId: map } : {}),
      checkpointList: (seed.checkpointIds ?? []).map((checkpointId) => ({ checkpointId })),
      ...seed.content,
    };
    must(
      await api.saveRouteDraft({
        routeId,
        expected: { entity: editor.concurrencyRevision, draft: editor.draft?.concurrencyRevision },
        content,
        mediaSettings: [thumbnail, map].flatMap((mediaId) => (mediaId ? [{ mediaId, usageRightsConfirmed: true }] : [])),
      }),
    );
    return { routeId };
  } finally {
    store.currentUserId = previousUser;
  }
}
