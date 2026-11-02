// Gói sẵn sàng và context v3 synthetic dựng từ fixture publication (quickstart M01 §4), cho unit test và hook E2E.
// Chỉ là phép chiếu giá trị để có dữ liệu test; pipeline thật ở offline-package/ (US6).
import type { JourneySnapshot } from '../../../shared/contracts/journeySnapshot';
import type { OfflinePackage } from '../../../shared/contracts/offlinePackage';
import type { PublishedRoute } from '../../../shared/contracts/publishedRoute';
import type { SelectedRouteContextV3 } from '../../../shared/contracts/selectedRouteContext';
import { manifestFromSnapshot } from '../start/manifest';

/** Manifest của snapshot (cùng hàm với code Start/tải gói). */
export const manifestOf = (snapshot: JourneySnapshot): OfflinePackage['manifest'] => manifestFromSnapshot(snapshot);

export function packageFromPublication(
  route: PublishedRoute,
  snapshot: JourneySnapshot,
  options: { versionStatus?: 'CURRENT' | 'OUTDATED'; capturedAt?: string } = {},
): OfflinePackage {
  const capturedAt = options.capturedAt ?? '2026-11-01T03:00:00.000Z';
  return {
    routeId: snapshot.routeId,
    contentVersion: snapshot.contentVersion,
    status: 'SAN_SANG',
    versionStatus: options.versionStatus ?? 'CURRENT',
    manifest: manifestOf(snapshot),
    resources: snapshot.checkpoints.flatMap((checkpoint) =>
      (checkpoint.offlineResources ?? []).map((resource) => ({ ...resource, checkpointId: checkpoint.checkpointId })),
    ),
    ...(snapshot.offlineRouteMap && { offlineRouteMap: snapshot.offlineRouteMap }),
    routeEssentials: {
      capturedAt,
      name: route.name,
      startingPoint: route.startingPoint,
      ...(route.participationRequirements && { participationRequirements: route.participationRequirements }),
      ...(route.safetyWarning && { safetyWarning: route.safetyWarning }),
    },
    downloadedAt: capturedAt,
  };
}

export function contextFromSnapshot(
  snapshot: JourneySnapshot,
  overrides: Partial<SelectedRouteContextV3> = {},
): SelectedRouteContextV3 {
  return {
    contractVersion: 3,
    handoffId: '0b6f3c2a-8d1e-4f5a-9b7c-6e2d1a0f9c8b',
    routeId: snapshot.routeId,
    authorizedAt: '2026-11-02T01:00:00.000Z',
    expiresAt: '2026-11-03T01:00:00.000Z',
    authorizationStatus: 'AUTHORIZED',
    routeJourneyManifest: manifestOf(snapshot),
    ...overrides,
  };
}
