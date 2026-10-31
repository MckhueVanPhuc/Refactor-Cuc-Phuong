// Giá trị suy ra của tuyến (tasks T105; BR-M03-C11, T08). Không bao giờ là input: nhãn thời gian tính từ
// `durationMin`; số điểm dừng, cờ offline và danh sách tên tính từ snapshot đang active.
import type { JourneySnapshot } from '../../../shared/contracts/journeySnapshot';
import { deriveTimeTag, type PublishedRoute, type TimeTag } from '../../../shared/contracts/publishedRoute';
import { DISPLAY_NAMES } from '../messages/displayNames';

export function timeTagOf(durationMin: number | undefined): TimeTag | undefined {
  return durationMin === undefined || Number.isNaN(durationMin) || durationMin <= 0 ? undefined : deriveTimeTag(durationMin);
}

/** Tên hiển thị của nhãn thời gian trên editor (chỉ đọc) */
export function timeTagName(durationMin: number | undefined): string {
  const tag = timeTagOf(durationMin);
  return tag ? DISPLAY_NAMES.timeTag[tag] : 'Chưa có (tính từ thời lượng)';
}

export type RouteDerivedValues = Pick<
  PublishedRoute,
  'checkpointCount' | 'hasOfflineRequiredCheckpoint' | 'hasOfflineRouteMap' | 'checkpointSummaries'
>;

export function routeDerivedValues(snapshot: JourneySnapshot | undefined): RouteDerivedValues {
  const checkpoints = [...(snapshot?.checkpoints ?? [])].sort((a, b) => a.sequence - b.sequence);
  return {
    checkpointCount: checkpoints.length,
    hasOfflineRequiredCheckpoint: checkpoints.some((checkpoint) => checkpoint.connectivityMode === 'OFFLINE_REQUIRED'),
    hasOfflineRouteMap: snapshot?.offlineRouteMap !== undefined,
    checkpointSummaries: checkpoints.map(({ checkpointId, sequence, checkpointName }) => ({ checkpointId, sequence, checkpointName })),
  };
}
