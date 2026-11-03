// Test phía consumer M01 cho Published Route projection và JourneySnapshot (tasks M01 T012;
// m03-publication-consumer-contract §3; research M01 R-04, L-02).
import { describe, expect, it } from 'vitest';
import { publicationFixture } from './__fixtures__/publication';
import { journeySnapshotSchema } from './journeySnapshot';
import { publishedRouteSchema } from './publishedRoute';

describe('fixture publication qua schema dùng chung (consumer M01)', () => {
  it.each(['A', 'B', 'C', 'D'] as const)('tuyến %s và snapshot của nó qua schema', (key) => {
    const fixture = publicationFixture();
    expect(publishedRouteSchema.safeParse(fixture.routes[key]).success).toBe(true);
    expect(journeySnapshotSchema.safeParse(fixture.snapshots[key]).success).toBe(true);
  });

  it('dòng hỏng bị từ chối (không sửa dữ liệu)', () => {
    expect(publishedRouteSchema.safeParse(publicationFixture().brokenRoute).success).toBe(false);
  });

  it('thiếu activeContentVersion → không qua schema (DAC-M01-017)', () => {
    const { activeContentVersion: _omitted, ...route } = publicationFixture().routes.B;
    expect(publishedRouteSchema.safeParse(route).success).toBe(false);
  });

  it('chuỗi dài hơn giới hạn provisional của M03 vẫn được nhận (spec-M03 §5.3 câu cuối)', () => {
    const { routes, snapshots } = publicationFixture();
    const long = 'x'.repeat(5000);
    const route = { ...routes.A, name: { vi: long, en: long }, description: { vi: long, en: long } };
    expect(publishedRouteSchema.safeParse(route).success).toBe(true);
    const snapshot = structuredClone(snapshots.A);
    snapshot.checkpoints[0]!.checkpointName = { vi: long, en: long };
    expect(journeySnapshotSchema.safeParse(snapshot).success).toBe(true);
  });

  it('offlineResources chỉ có khi OFFLINE_REQUIRED', () => {
    const snapshot = structuredClone(publicationFixture().snapshots.A);
    const online = snapshot.checkpoints[2]!;
    online.offlineResources = [structuredClone(snapshot.checkpoints[1]!.offlineResources![0]!)];
    expect(journeySnapshotSchema.safeParse(snapshot).success).toBe(false);
  });

  it('OFFLINE_REQUIRED thiếu resource cho một QR → bị từ chối', () => {
    const snapshot = structuredClone(publicationFixture().snapshots.A);
    snapshot.checkpoints[0]!.offlineResources!.pop();
    expect(journeySnapshotSchema.safeParse(snapshot).success).toBe(false);
  });
});
