// Ánh xạ dòng view `api.published_routes` / `api.active_journey_snapshots` → giá trị contract
// (tasks M01 T014; research M01 L-01; Physical §3). Đặt cạnh schema để producer (M03) và consumer (M01) dùng một hàm.
// - Cột là snake_case của key cấp cao nhất của contract; danh sách dưới đây khớp migration
//   supabase/migrations/20261101170012_m03_04b_public_views.sql (M03 T184).
// - Giá trị lồng là jsonb giữ key camelCase: giữ nguyên.
// - Cột nullable của trường Optional: `null` → bỏ property (contract coi Optional là vắng mặt).
// - Cột Required là null hay cột lạ ngoài danh sách được để nguyên, nên schema strict từ chối dòng (không sửa dữ liệu).
import { journeySnapshotSchema, type JourneySnapshot } from './journeySnapshot';
import { publishedRouteSchema, type PublishedRoute } from './publishedRoute';

type ColumnMap = Readonly<Record<string, { key: string; optional: boolean }>>;

function columnMap(entries: readonly (readonly [column: string, key: string, optional?: 'optional'])[]): ColumnMap {
  return Object.fromEntries(entries.map(([column, key, optional]) => [column, { key, optional: optional === 'optional' }]));
}

const PUBLISHED_ROUTE_MAP = columnMap([
  ['route_id', 'routeId'],
  ['status', 'status'],
  ['name', 'name'],
  ['short_description', 'shortDescription'],
  ['description', 'description'],
  ['starting_point', 'startingPoint'],
  ['thumbnail', 'thumbnail'],
  ['gallery', 'gallery'],
  ['route_map', 'routeMap', 'optional'],
  ['participation_requirements', 'participationRequirements', 'optional'],
  ['preparation', 'preparation', 'optional'],
  ['best_time', 'bestTime', 'optional'],
  ['safety_warning', 'safetyWarning', 'optional'],
  ['highlights', 'highlights'],
  ['distance_km', 'distanceKm'],
  ['duration_min', 'durationMin'],
  ['difficulty', 'difficulty'],
  ['time_tags', 'timeTags'],
  ['group_tags', 'groupTags'],
  ['experience_tags', 'experienceTags'],
  ['checkpoint_count', 'checkpointCount'],
  ['has_offline_required_checkpoint', 'hasOfflineRequiredCheckpoint'],
  ['has_offline_route_map', 'hasOfflineRouteMap'],
  ['checkpoint_summaries', 'checkpointSummaries'],
  ['active_content_version', 'activeContentVersion'],
]);

const ACTIVE_JOURNEY_SNAPSHOT_MAP = columnMap([
  ['route_id', 'routeId'],
  ['content_version', 'contentVersion'],
  ['status', 'status'],
  ['published_at', 'publishedAt'],
  ['previous_content_version', 'previousContentVersion', 'optional'],
  ['estimated_offline_size_bytes', 'estimatedOfflineSizeBytes', 'optional'],
  ['offline_route_map', 'offlineRouteMap', 'optional'],
  ['checkpoints', 'checkpoints'],
]);

/** Cột của `api.published_routes` theo thứ tự contract (publication-public-contract §2). */
export const PUBLISHED_ROUTE_COLUMNS = Object.keys(PUBLISHED_ROUTE_MAP);
/** Cột của `api.active_journey_snapshots` theo thứ tự contract (publication-public-contract §3). */
export const ACTIVE_JOURNEY_SNAPSHOT_COLUMNS = Object.keys(ACTIVE_JOURNEY_SNAPSHOT_MAP);

function mapRow(row: Record<string, unknown>, map: ColumnMap): Record<string, unknown> {
  const value: Record<string, unknown> = {};
  for (const [column, cell] of Object.entries(row)) {
    const target = map[column];
    if (!target) {
      value[column] = cell;
      continue;
    }
    if (cell === null && target.optional) continue;
    value[target.key] = cell;
  }
  return value;
}

const isRecord = (row: unknown): row is Record<string, unknown> =>
  typeof row === 'object' && row !== null && !Array.isArray(row);

/** Dòng view → giá trị camelCase chưa kiểm (để schema dùng chung kiểm). */
export function publishedRouteFromRow(row: Record<string, unknown>): Record<string, unknown> {
  return mapRow(row, PUBLISHED_ROUTE_MAP);
}

export function journeySnapshotFromRow(row: Record<string, unknown>): Record<string, unknown> {
  return mapRow(row, ACTIVE_JOURNEY_SNAPSHOT_MAP);
}

/** Dòng view → Published Route đã kiểm; dòng không hợp lệ → `null` (spec-M01 §5.4, §11.2: không sửa, không dùng). */
export function parsePublishedRouteRow(row: unknown): PublishedRoute | null {
  if (!isRecord(row)) return null;
  const result = publishedRouteSchema.safeParse(publishedRouteFromRow(row));
  return result.success ? result.data : null;
}

export function parseJourneySnapshotRow(row: unknown): JourneySnapshot | null {
  if (!isRecord(row)) return null;
  const result = journeySnapshotSchema.safeParse(journeySnapshotFromRow(row));
  return result.success ? result.data : null;
}
