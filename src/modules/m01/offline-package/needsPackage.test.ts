// Tuyến có cần gói (tasks T072; BR-M01-012; FR-M01-005; SC-M01-010).
import { describe, expect, it } from 'vitest';
import { publicationFixture } from '../../../shared/contracts/__fixtures__/publication';
import { needsPackage, offlineRequiredCheckpointNames } from './needsPackage';

describe('needsPackage', () => {
  const { routes, snapshots } = publicationFixture();

  it.each([
    [false, false, false],
    [true, false, true],
    [false, true, true],
  ])('chưa có snapshot: theo cờ (%s, %s) → %s', (required, map, expected) => {
    expect(needsPackage({ ...routes.B, hasOfflineRequiredCheckpoint: required, hasOfflineRouteMap: map })).toBe(expected);
  });

  it('snapshot thắng cờ: cờ nói cần mà snapshot không có OFFLINE_REQUIRED lẫn offlineRouteMap → không cần', () => {
    expect(needsPackage({ ...routes.B, hasOfflineRequiredCheckpoint: true }, snapshots.B)).toBe(false);
  });

  it('snapshot thắng cờ: cờ nói không cần mà snapshot có OFFLINE_REQUIRED → cần', () => {
    expect(needsPackage({ ...routes.A, hasOfflineRequiredCheckpoint: false, hasOfflineRouteMap: false }, snapshots.A)).toBe(true);
  });

  it('tên các checkpoint OFFLINE_REQUIRED theo ngôn ngữ, theo thứ tự', () => {
    expect(offlineRequiredCheckpointNames(snapshots.A, 'vi')).toEqual(['Điểm thử A1', 'Điểm thử A2']);
    expect(offlineRequiredCheckpointNames(snapshots.B, 'en')).toEqual([]);
  });
});
