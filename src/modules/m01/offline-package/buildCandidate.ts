// Dựng candidate trong bộ nhớ (research R-08 bước 2–3; offline-package-contract §4). Ngoài transaction: tải byte mọi
// ảnh khai báo (mỗi sourceRef một lần, tối đa PACKAGE_IMAGE_CONCURRENCY request song song), dựng manifest, resources,
// offlineRouteMap, routeEssentials; kiểm đủ bảy điều kiện rồi mới trả bundle để staging. Ảnh bìa, gallery và sơ đồ
// tuyến online không vào gói (BR-M01-013).
import type { JourneySnapshot } from '../../../shared/contracts/journeySnapshot';
import { offlinePackageSchema } from '../../../shared/contracts/offlinePackage';
import type { PublishedRoute } from '../../../shared/contracts/publishedRoute';
import type { MediaClient } from '../api/mediaClient';
import { PACKAGE_IMAGE_CONCURRENCY } from '../config/limits';
import { manifestFromSnapshot } from '../start/manifest';
import { declaredImageRefs } from '../storage/readers';
import type { StagedPackage } from '../storage/rows';

export type BuildFailure = 'source' | 'download';

export type BuildResult = { ok: true; staged: StagedPackage } | { ok: false; reason: BuildFailure };

async function downloadAll(
  media: Pick<MediaClient, 'createSignedUrls' | 'fetchImageBlob'>,
  sourceRefs: readonly string[],
): Promise<{ sourceRef: string; blob: Blob }[] | null> {
  if (sourceRefs.length === 0) return [];
  const urls = await media.createSignedUrls(sourceRefs);
  if (!urls || sourceRefs.some((ref) => !urls.has(ref))) return null;

  const images: { sourceRef: string; blob: Blob }[] = [];
  let next = 0;
  let failed = false;
  async function worker() {
    while (!failed && next < sourceRefs.length) {
      const sourceRef = sourceRefs[next]!;
      next += 1;
      const blob = await media.fetchImageBlob(urls!.get(sourceRef)!);
      if (!blob) failed = true;
      else images.push({ sourceRef, blob });
    }
  }
  await Promise.all(Array.from({ length: Math.min(PACKAGE_IMAGE_CONCURRENCY, sourceRefs.length) }, worker));
  return failed ? null : images;
}

export async function buildCandidate({
  route,
  snapshot,
  media,
  readAt,
}: {
  route: PublishedRoute;
  snapshot: JourneySnapshot;
  media: Pick<MediaClient, 'createSignedUrls' | 'fetchImageBlob'>;
  /** Thời điểm đọc dòng tuyến = `routeEssentials.capturedAt` */
  readAt: string;
}): Promise<BuildResult> {
  // 1. Snapshot active hiện hành của tuyến `HOAT_DONG`
  if (route.status !== 'HOAT_DONG' || snapshot.routeId !== route.routeId || snapshot.contentVersion !== route.activeContentVersion) {
    return { ok: false, reason: 'source' };
  }

  const resources = snapshot.checkpoints.flatMap((checkpoint) =>
    (checkpoint.offlineResources ?? []).map((resource) => ({ ...resource, checkpointId: checkpoint.checkpointId })),
  );
  const candidate = {
    routeId: route.routeId,
    contentVersion: snapshot.contentVersion,
    status: 'SAN_SANG' as const,
    versionStatus: 'CURRENT' as const,
    manifest: manifestFromSnapshot(snapshot),
    resources,
    ...(snapshot.offlineRouteMap && { offlineRouteMap: snapshot.offlineRouteMap }),
    routeEssentials: {
      capturedAt: readAt,
      name: route.name,
      startingPoint: route.startingPoint,
      ...(route.participationRequirements && { participationRequirements: route.participationRequirements }),
      ...(route.safetyWarning && { safetyWarning: route.safetyWarning }),
    },
  };
  // 2, 3, 6, 7: manifest, resources, essentials, cùng (routeId, contentVersion) — schema contract
  const parsed = offlinePackageSchema.safeParse(candidate);
  if (!parsed.success) return { ok: false, reason: 'source' };

  // 4, 5: mọi ảnh khai báo và sơ đồ offline đọc được
  const images = await downloadAll(media, declaredImageRefs(parsed.data));
  if (!images) return { ok: false, reason: 'download' };

  const { resources: packageResources, ...pkg } = parsed.data;
  return {
    ok: true,
    staged: {
      pkg,
      resources: packageResources.map((resource) => ({ ...resource, routeId: pkg.routeId, contentVersion: pkg.contentVersion })),
      images,
    },
  };
}
