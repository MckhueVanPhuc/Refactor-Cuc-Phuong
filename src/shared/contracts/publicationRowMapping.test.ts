import { describe, expect, it } from 'vitest';
import { publicationFixture } from './__fixtures__/publication';
import {
  ACTIVE_JOURNEY_SNAPSHOT_COLUMNS,
  PUBLISHED_ROUTE_COLUMNS,
  journeySnapshotFromRow,
  parseJourneySnapshotRow,
  parsePublishedRouteRow,
  publishedRouteFromRow,
} from './publicationRowMapping';

// Dòng như PostgREST trả từ view: cột snake_case, giá trị jsonb giữ camelCase, Optional vắng là null
function routeRow(): Record<string, unknown> {
  const a = publicationFixture().routes.A;
  return {
    route_id: a.routeId,
    status: a.status,
    name: a.name,
    short_description: a.shortDescription,
    description: a.description,
    starting_point: a.startingPoint,
    thumbnail: a.thumbnail,
    gallery: a.gallery,
    route_map: a.routeMap,
    participation_requirements: a.participationRequirements,
    preparation: null,
    best_time: null,
    safety_warning: a.safetyWarning,
    highlights: a.highlights,
    distance_km: a.distanceKm,
    duration_min: a.durationMin,
    difficulty: a.difficulty,
    time_tags: a.timeTags,
    group_tags: a.groupTags,
    experience_tags: a.experienceTags,
    checkpoint_count: a.checkpointCount,
    has_offline_required_checkpoint: a.hasOfflineRequiredCheckpoint,
    has_offline_route_map: a.hasOfflineRouteMap,
    checkpoint_summaries: a.checkpointSummaries,
    active_content_version: a.activeContentVersion,
  };
}

function snapshotRow(): Record<string, unknown> {
  const a = publicationFixture().snapshots.A;
  return {
    route_id: a.routeId,
    content_version: a.contentVersion,
    status: a.status,
    // PostgREST trả timestamptz dạng offset
    published_at: '2026-10-01T02:00:00+00:00',
    previous_content_version: null,
    estimated_offline_size_bytes: null,
    offline_route_map: a.offlineRouteMap,
    checkpoints: a.checkpoints,
  };
}

describe('publicationRowMapping (Physical §3; research M01 L-01)', () => {
  it('danh sách cột là snake_case của key cấp cao nhất, đúng migration view 04b', () => {
    expect(PUBLISHED_ROUTE_COLUMNS).toEqual(Object.keys(routeRow()));
    expect(ACTIVE_JOURNEY_SNAPSHOT_COLUMNS).toEqual(Object.keys(snapshotRow()));
  });

  it('dòng tuyến → giá trị contract: key camelCase, jsonb lồng giữ nguyên, Optional null → bỏ property', () => {
    const mapped = publishedRouteFromRow(routeRow());
    expect(mapped).not.toHaveProperty('preparation');
    expect(mapped).not.toHaveProperty('bestTime');
    expect(mapped).toMatchObject({ routeId: 'route-a', shortDescription: publicationFixture().routes.A.shortDescription });
    expect(parsePublishedRouteRow(routeRow())).toEqual(publicationFixture().routes.A);
  });

  it('dòng tuyến có đủ trường Optional cũng qua', () => {
    const row = { ...routeRow(), preparation: { vi: 'Chuẩn bị', en: 'Preparation' }, best_time: { vi: 'Sáng', en: 'Morning' } };
    expect(parsePublishedRouteRow(row)).toMatchObject({ preparation: { vi: 'Chuẩn bị' }, bestTime: { en: 'Morning' } });
  });

  it('dòng snapshot → JourneySnapshot; cột Optional null bị bỏ', () => {
    const mapped = journeySnapshotFromRow(snapshotRow());
    expect(mapped).not.toHaveProperty('previousContentVersion');
    expect(mapped).not.toHaveProperty('estimatedOfflineSizeBytes');
    expect(parseJourneySnapshotRow(snapshotRow())).toMatchObject({ routeId: 'route-a', contentVersion: 1 });
  });

  it('cột Required là null → dòng không hợp lệ (không sửa)', () => {
    expect(parsePublishedRouteRow({ ...routeRow(), name: null })).toBeNull();
    expect(parseJourneySnapshotRow({ ...snapshotRow(), checkpoints: null })).toBeNull();
  });

  it('cột lạ ngoài danh sách → dòng không hợp lệ (schema strict báo view lệch)', () => {
    expect(parsePublishedRouteRow({ ...routeRow(), closure_reason: 'x' })).toBeNull();
  });

  it('giá trị không phải object → null', () => {
    expect(parsePublishedRouteRow(null)).toBeNull();
    expect(parseJourneySnapshotRow('x')).toBeNull();
  });
});
