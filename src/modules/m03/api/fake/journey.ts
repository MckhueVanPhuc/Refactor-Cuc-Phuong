// Hành trình công khai trên adapter giả: dựng snapshot ứng viên từ dữ liệu live (BR-M03-X01, G02), ước tính
// dung lượng gói tải trước (BR-M03-G10; research R-10), và các projection M01 đọc (publication-public §2–§3).
import type { JourneySnapshot, SnapshotCheckpoint } from '../../../../shared/contracts/journeySnapshot';
import type { PublishedRoute } from '../../../../shared/contracts/publishedRoute';
import type { Bilingual, CheckpointContent, DraftBilingual, QrContent, QrStatus, RouteContent } from '../../contracts/adminDtos';
import { formatMegabytes } from '../../messages/format';
import { routeDerivedValues, timeTagOf } from '../../validation/routeDerived';
import { visitPointName } from '../../validation/visitPoint';
import { qrCodesOf } from './checkpointData';
import { publishedOf } from './revisions';
import type { FakeMedia, FakeRoute, FakeStore } from './store';

/** Snapshot chưa có số version: số chỉ được cấp trong lần chuyển atomic (BR-M03-G03) */
export type SnapshotCandidate = Omit<JourneySnapshot, 'contentVersion' | 'publishedAt' | 'previousContentVersion' | 'status'>;

export type JourneyBuild = {
  candidate: SnapshotCandidate;
  /** Điểm dừng trong danh sách nhưng không hoạt động: không nằm trong hành trình (BR-M03-T02, T04) */
  leftOut: { name: string; reason: string }[];
  sizeBytes: number;
  /** Ảnh nặng nhất cho MSG-OFFLINE-TOO-BIG, đã dùng tên hiển thị */
  heaviestImages: string[];
};

const LEFT_OUT_REASON: Record<string, string> = { TAM_DONG: 'Đang tạm đóng', NHAP: 'Chưa xuất bản', LUU_TRU: 'Đã lưu trữ' };

const complete = (value: DraftBilingual | undefined): Bilingual | undefined =>
  value?.vi?.trim() && value.en?.trim() ? { vi: value.vi.trim(), en: value.en.trim() } : undefined;

const utf8Bytes = (text: string) => new TextEncoder().encode(text).length;

/**
 * Nội dung sắp xuất bản đặt chồng lên dữ liệu đã xuất bản khi dựng ứng viên: snapshot phản ánh trạng thái
 * "sau khi xuất bản" mà chưa đổi gì trong store (research R-10).
 */
export type JourneyOverlay = {
  checkpoints?: ReadonlyMap<string, CheckpointContent>;
  qrCodes?: ReadonlyMap<string, { content: QrContent; status: QrStatus }>;
};

export function snapshotKey(routeId: string, contentVersion: number): string {
  return `${routeId}:${contentVersion}`;
}

/** Hành trình của tuyến từ nội dung tuyến cho trước và nội dung đã xuất bản của các điểm dừng (BR-M03-X01) */
export function buildJourney(store: FakeStore, routeId: string, content: RouteContent, overlay: JourneyOverlay = {}): JourneyBuild {
  const leftOut: JourneyBuild['leftOut'] = [];
  const images = new Map<string, { media: FakeMedia; label: string }>();
  let textBytes = 0;

  const checkpoints = (content.checkpointList ?? []).flatMap(({ checkpointId }, index): SnapshotCheckpoint[] => {
    const checkpoint = store.state.checkpoints.get(checkpointId);
    const published =
      overlay.checkpoints?.get(checkpointId) ??
      (publishedOf(store, 'CHECKPOINT', checkpointId)?.content as CheckpointContent | undefined);
    const name = published?.checkpointName?.vi ?? checkpoint?.name ?? '';
    if (!checkpoint || checkpoint.status !== 'HOAT_DONG' || !published) {
      leftOut.push({ name, reason: LEFT_OUT_REASON[checkpoint?.status ?? 'LUU_TRU'] ?? 'Đang tạm đóng' });
      return [];
    }
    const mode = published.connectivityMode ?? 'OFFLINE_REQUIRED';
    const active = qrCodesOf(store, checkpointId).filter(
      (qr) => (overlay.qrCodes?.get(qr.qrIdentifier)?.status ?? qr.status) === 'HOAT_DONG',
    );
    const entry: SnapshotCheckpoint = {
      checkpointId,
      sequence: index + 1,
      checkpointName: complete(published.checkpointName) ?? { vi: name, en: name },
      connectivityMode: mode,
      qrIdentifiers: active.map((qr) => qr.qrIdentifier),
    };
    if (mode === 'OFFLINE_REQUIRED') {
      entry.offlineResources = active.map((qr) => {
        const qrPublished = (overlay.qrCodes?.get(qr.qrIdentifier)?.content ??
          publishedOf(store, 'QRCODE', qr.qrIdentifier)?.content ??
          {}) as QrContent;
        const objectName = complete(qrPublished.objectName) ?? { vi: '', en: '' };
        const intro = complete(qrPublished.introductionText) ?? { vi: '', en: '' };
        textBytes += utf8Bytes(objectName.vi + objectName.en + intro.vi + intro.en);
        const displayName = visitPointName(objectName.vi, qr.creationOrder);
        const qrImages = (qrPublished.mediaItems ?? []).flatMap(({ mediaId }) => {
          const media = store.state.media.get(mediaId);
          return media && media.type === 'IMAGE' ? [media] : [];
        });
        qrImages.forEach((media, i) => images.set(media.sourceRef, { media, label: `${displayName} – ảnh ${i + 1}` }));
        return {
          qrIdentifier: qr.qrIdentifier,
          objectName,
          localizedContent: { vi: { introductionText: intro.vi }, en: { introductionText: intro.en } },
          staticImages: qrImages.map((media) => media.sourceRef),
        };
      });
    }
    return [entry];
  });

  const candidate: SnapshotCandidate = { routeId, checkpoints };
  // Sơ đồ chỉ vào snapshot khi nội dung bật tick dùng khi không có mạng (BR-M03-C16)
  const map = content.offlineRouteMapRequired && content.routeMapMediaId ? store.state.media.get(content.routeMapMediaId) : undefined;
  if (map) {
    const caption = complete(content.routeMapCaption);
    candidate.offlineRouteMap = { sourceRef: map.sourceRef, ...(caption ? { caption } : {}) };
    images.set(map.sourceRef, { media: map, label: 'Ảnh sơ đồ tuyến' });
  }
  // Ảnh phân biệt + chữ offline; âm thanh/video không bao giờ được tính (BR-M03-G10)
  const sizeBytes = [...images.values()].reduce((sum, { media }) => sum + media.fileSizeBytes, 0) + textBytes;
  candidate.estimatedOfflineSizeBytes = sizeBytes;
  const heaviestImages = [...images.values()]
    .sort((a, b) => b.media.fileSizeBytes - a.media.fileSizeBytes)
    .slice(0, 3)
    .map(({ media, label }) => `${label} (${formatMegabytes(media.fileSizeBytes)} MB)`);
  return { candidate, leftOut, sizeBytes, heaviestImages };
}

/** So sánh ứng viên với snapshot active trên nội dung hành trình, bỏ số version và thời điểm (research R-10) */
export function sameJourney(candidate: SnapshotCandidate, active: JourneySnapshot | undefined): boolean {
  if (!active) return false;
  const pick = (snapshot: SnapshotCandidate) =>
    JSON.stringify([snapshot.checkpoints, snapshot.offlineRouteMap ?? null, snapshot.estimatedOfflineSizeBytes ?? null]);
  return pick(candidate) === pick(active);
}

/** Tuyến bị ảnh hưởng bởi một thay đổi của điểm dừng: `HOAT_DONG`/`TAM_DONG` có danh sách đã xuất bản chứa nó (BR-M03-X02) */
export function routesAffectedBy(store: FakeStore, checkpointId: string): FakeRoute[] {
  return [...store.state.routes.values()].filter((route) => {
    if (route.status !== 'HOAT_DONG' && route.status !== 'TAM_DONG') return false;
    const list = (publishedOf(store, 'ROUTE', route.routeId)?.content as RouteContent | undefined)?.checkpointList ?? [];
    return list.some((item) => item.checkpointId === checkpointId);
  });
}

export type RouteRebuild = { route: FakeRoute; name: string; build: JourneyBuild; changed: boolean };

/** Dựng lại hành trình của các tuyến từ nội dung đã xuất bản của chúng, với lớp phủ cho trước */
export function rebuildRoutes(store: FakeStore, routes: readonly FakeRoute[], overlay: JourneyOverlay = {}): RouteRebuild[] {
  return routes.map((route) => {
    const content = (publishedOf(store, 'ROUTE', route.routeId)?.content ?? {}) as RouteContent;
    const build = buildJourney(store, route.routeId, content, overlay);
    return { route, name: content.name?.vi ?? route.name ?? '', build, changed: !sameJourney(build.candidate, activeSnapshotOf(store, route)) };
  });
}

/** Chuyển mọi tuyến có hành trình đổi sang snapshot mới, cùng lúc (BR-M03-G06, X02) */
export function commitRebuilds(store: FakeStore, rebuilds: readonly RouteRebuild[]) {
  return rebuilds
    .filter((rebuild) => rebuild.changed)
    .map(({ route, build }) => ({ routeId: route.routeId, contentVersion: commitSnapshot(store, route, build.candidate).contentVersion }));
}

export function activeSnapshotOf(store: FakeStore, route: FakeRoute): JourneySnapshot | undefined {
  return route.activeContentVersion === undefined
    ? undefined
    : store.state.snapshots.get(snapshotKey(route.routeId, route.activeContentVersion));
}

/** Snapshot mới với version kế tiếp, cấp số trong lần chuyển (BR-M03-G03) */
export function commitSnapshot(store: FakeStore, route: FakeRoute, candidate: SnapshotCandidate): JourneySnapshot {
  const previous = route.activeContentVersion;
  const contentVersion = (previous ?? 0) + 1;
  const snapshot: JourneySnapshot = {
    ...structuredClone(candidate),
    contentVersion,
    status: 'DA_CONG_BO',
    publishedAt: store.now(),
    ...(previous !== undefined ? { previousContentVersion: previous } : {}),
  };
  store.state.snapshots.set(snapshotKey(route.routeId, contentVersion), snapshot);
  route.activeContentVersion = contentVersion;
  return snapshot;
}

/** Dòng Published Route của tuyến (publication-public §2); null khi chưa từng xuất bản */
export function publishedRouteOf(store: FakeStore, routeId: string): PublishedRoute | null {
  const route = store.state.routes.get(routeId);
  const content = publishedOf(store, 'ROUTE', routeId)?.content as RouteContent | undefined;
  const snapshot = route && activeSnapshotOf(store, route);
  if (!route || !content || !snapshot || route.status === 'NHAP') return null;
  const sourceRef = (mediaId: string | undefined) => (mediaId ? store.state.media.get(mediaId)?.sourceRef : undefined) ?? '';
  const optional = (key: 'participationRequirements' | 'preparation' | 'bestTime' | 'safetyWarning') => {
    const value = complete(content[key]);
    return value ? { [key]: value } : {};
  };
  const mapCaption = complete(content.routeMapCaption);
  const timeTag = timeTagOf(content.durationMin);
  return {
    routeId,
    status: route.status,
    name: complete(content.name)!,
    shortDescription: complete(content.shortDescription)!,
    description: complete(content.description)!,
    startingPoint: complete(content.startingPoint)!,
    thumbnail: { sourceRef: sourceRef(content.thumbnailMediaId) },
    gallery: (content.galleryItems ?? []).map((item) => {
      const caption = complete(item.caption);
      return { sourceRef: sourceRef(item.mediaId), ...(caption ? { caption } : {}) };
    }),
    ...(content.routeMapMediaId
      ? { routeMap: { sourceRef: sourceRef(content.routeMapMediaId), ...(mapCaption ? { caption: mapCaption } : {}) } }
      : {}),
    ...optional('participationRequirements'),
    ...optional('preparation'),
    ...optional('bestTime'),
    ...optional('safetyWarning'),
    highlights: (content.highlights ?? []).flatMap((item) => {
      const value = complete(item);
      return value ? [value] : [];
    }),
    distanceKm: content.distanceKm ?? 0,
    durationMin: content.durationMin ?? 0,
    difficulty: content.difficulty ?? 'NHE',
    timeTags: timeTag ? [timeTag] : [],
    groupTags: content.groupTags ?? [],
    experienceTags: content.experienceTags ?? [],
    ...routeDerivedValues(snapshot),
    activeContentVersion: snapshot.contentVersion,
  };
}
