// Chọn đường Start (research R-05, R-11 bước 2; FR-M01-011; BR-M01-008, 011; SC-M01-006, 010).
// Online: dòng tuyến `HOAT_DONG` + snapshot active cùng version trong cùng thao tác (lệch → đọc lại một lần, vẫn lệch
// → nguồn không khả dụng). Đọc thành công thấy tuyến đóng → chặn (thu hồi chạy qua onSourceRead, US5).
// Nguồn không khả dụng → gói `SAN_SANG` của tuyến (kể cả `OUTDATED`); không có → chặn.
import type { JourneyManifest } from '../../../shared/contracts/journeyManifest';
import type { VersionStatus } from '../../../shared/contracts/offlinePackage';
import type { SourceClient } from '../api/sourceClient';
import { readActiveOfflinePackage } from '../storage/readers';
import { manifestFromSnapshot } from './manifest';

export type StartBlockReason = 'routeUnavailable' | 'offlineNoPackage';

export type StartPath =
  | { kind: 'online'; manifest: JourneyManifest }
  | { kind: 'offline'; manifest: JourneyManifest; versionStatus: VersionStatus }
  | { kind: 'blocked'; reason: StartBlockReason };

/** Hai lần đọc (lần đầu + một lần đọc lại khi snapshot lệch version). */
const SOURCE_ATTEMPTS = 2;

async function onlineManifest(
  source: Pick<SourceClient, 'fetchRoute' | 'fetchActiveSnapshot'>,
  routeId: string,
): Promise<JourneyManifest | 'routeUnavailable' | 'sourceUnavailable'> {
  for (let attempt = 0; attempt < SOURCE_ATTEMPTS; attempt += 1) {
    const route = await source.fetchRoute(routeId);
    if (route.kind === 'UNAVAILABLE') return 'sourceUnavailable';
    if (route.value?.status !== 'HOAT_DONG') return 'routeUnavailable';
    const snapshot = await source.fetchActiveSnapshot(routeId);
    // Không có snapshot active → không Start online (m03-publication-consumer-contract §6)
    if (snapshot.kind === 'UNAVAILABLE' || !snapshot.value) return 'sourceUnavailable';
    if (snapshot.value.routeId === routeId && snapshot.value.contentVersion === route.value.activeContentVersion) {
      return manifestFromSnapshot(snapshot.value);
    }
  }
  return 'sourceUnavailable';
}

export async function chooseStartPath(
  source: Pick<SourceClient, 'fetchRoute' | 'fetchActiveSnapshot'>,
  routeId: string,
): Promise<StartPath> {
  const online = await onlineManifest(source, routeId);
  if (online === 'routeUnavailable') return { kind: 'blocked', reason: 'routeUnavailable' };
  if (online !== 'sourceUnavailable') return { kind: 'online', manifest: online };

  const pkg = await readActiveOfflinePackage(routeId).catch(() => null);
  if (!pkg?.versionStatus) return { kind: 'blocked', reason: 'offlineNoPackage' };
  return { kind: 'offline', manifest: pkg.manifest, versionStatus: pkg.versionStatus };
}
