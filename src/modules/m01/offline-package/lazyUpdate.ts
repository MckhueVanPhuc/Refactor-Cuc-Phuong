// Cập nhật lười (research R-10; FR-M01-010, 014): sau mỗi lần đọc nguồn thành công, gói có version cũ hơn thành
// `OUTDATED` và chữ cốt lõi của gói active được thay (capturedAt = thời điểm đọc). Candidate mới chỉ được dựng khi
// tuyến có gói được mở online, tuyến `HOAT_DONG` và version nguồn lớn hơn (không có kiểm tra định kỳ trong nền).
import type { OfflinePackage } from '../../../shared/contracts/offlinePackage';
import type { PublishedRoute } from '../../../shared/contracts/publishedRoute';
import type { SourceRead } from '../api/onSourceRead';
import { markOutdated, refreshEssentials } from '../storage/packageWriter';
import { readActivePackagePointer } from '../storage/readers';
import type { PackageOps } from './packageOps';

export async function markOutdatedPackages(read: SourceRead): Promise<void> {
  for (const route of read.routes) await markOutdated(route.routeId, route.activeContentVersion);
}

export async function refreshSavedEssentials(read: SourceRead): Promise<void> {
  for (const route of read.routes) {
    const pointer = await readActivePackagePointer(route.routeId);
    if (!pointer) continue;
    await refreshEssentials(route.routeId, pointer.contentVersion, {
      capturedAt: read.readAt,
      name: route.name,
      startingPoint: route.startingPoint,
      ...(route.participationRequirements && { participationRequirements: route.participationRequirements }),
      ...(route.safetyWarning && { safetyWarning: route.safetyWarning }),
    });
  }
}

/** Mở chi tiết online tuyến có gói: dựng candidate version mới trong khi gói cũ vẫn active (BR-M01-006). */
export async function maybeUpdatePackage(
  route: PublishedRoute,
  pkg: OfflinePackage | null,
  ops: Pick<PackageOps, 'download'>,
): Promise<void> {
  if (!pkg || route.status !== 'HOAT_DONG' || route.activeContentVersion <= pkg.contentVersion) return;
  await ops.download(route.routeId);
}
