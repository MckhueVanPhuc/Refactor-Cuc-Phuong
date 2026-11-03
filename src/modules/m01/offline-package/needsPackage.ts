// Tuyến có cần gói tải trước (BR-M01-012; FR-M01-005; SR-SCR-M01-003-004): khi chưa có snapshot dùng hai cờ của
// Published Route; khi đã đọc snapshot thì snapshot thắng cờ (có checkpoint `OFFLINE_REQUIRED` hoặc `offlineRouteMap`).
import type { JourneySnapshot } from '../../../shared/contracts/journeySnapshot';
import type { LanguageCode } from '../../../shared/contracts/languagePreference';
import type { PublishedRoute } from '../../../shared/contracts/publishedRoute';

export function needsPackage(
  route: Pick<PublishedRoute, 'hasOfflineRequiredCheckpoint' | 'hasOfflineRouteMap'>,
  snapshot?: JourneySnapshot,
): boolean {
  if (snapshot) {
    return snapshot.offlineRouteMap !== undefined || snapshot.checkpoints.some((c) => c.connectivityMode === 'OFFLINE_REQUIRED');
  }
  return route.hasOfflineRequiredCheckpoint || route.hasOfflineRouteMap;
}

/** Tên các điểm dừng `OFFLINE_REQUIRED` theo thứ tự, cho dialog quyết định offline (FR-M01-006). */
export function offlineRequiredCheckpointNames(snapshot: JourneySnapshot, language: LanguageCode): string[] {
  return [...snapshot.checkpoints]
    .sort((a, b) => a.sequence - b.sequence)
    .filter((checkpoint) => checkpoint.connectivityMode === 'OFFLINE_REQUIRED')
    .map((checkpoint) => checkpoint.checkpointName[language]);
}
