// Dựng và kiểm candidate trong bộ nhớ (tasks T073; offline-package-contract §4; FR-M01-007, 008; BR-M01-004, 005, 013;
// SC-M01-003, 007; DAC-M01-010, 014, 015).
import { describe, expect, it } from 'vitest';
import { publicationFixture } from '../../../shared/contracts/__fixtures__/publication';
import type { MediaClient } from '../api/mediaClient';
import { createFakeSource } from '../api/fake/fakeSource';
import { buildCandidate } from './buildCandidate';

const READ_AT = '2026-11-03T05:00:00.000Z';

/** Media giả đếm request và số request song song tối đa. */
function countingMedia(failRefs: string[] = []) {
  const fake = createFakeSource();
  for (const ref of failRefs) fake.controls.failImage(ref, 500);
  const fetched: string[] = [];
  let active = 0;
  let maxActive = 0;
  const media: MediaClient = {
    createSignedUrls: (refs) => fake.media.createSignedUrls(refs),
    fetchImageBlob: async (url) => {
      fetched.push(url);
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      try {
        return await fake.media.fetchImageBlob(url);
      } finally {
        active -= 1;
      }
    },
  };
  return { media, fetched, maxActive: () => maxActive };
}

describe('buildCandidate', () => {
  it('tuyến A: manifest đủ checkpoint, đúng một resource mỗi QR OFFLINE_REQUIRED, sơ đồ offline, essentials, byte mọi ảnh', async () => {
    const { routes, snapshots } = publicationFixture();
    const { media, fetched } = countingMedia();
    const result = await buildCandidate({ route: routes.A, snapshot: snapshots.A, media, readAt: READ_AT });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { pkg, resources, images } = result.staged;
    expect(pkg.manifest.checkpoints.map((c) => c.checkpointId)).toEqual(['cp-a1', 'cp-a2', 'cp-a3']);
    expect(resources.map((r) => [r.qrIdentifier, r.checkpointId])).toEqual([
      ['qr-a1-1', 'cp-a1'],
      ['qr-a1-2', 'cp-a1'],
      ['qr-a2-1', 'cp-a2'],
    ]);
    expect(pkg.offlineRouteMap).toEqual(snapshots.A.offlineRouteMap);
    expect(pkg.routeEssentials).toEqual({
      capturedAt: READ_AT,
      name: routes.A.name,
      startingPoint: routes.A.startingPoint,
      participationRequirements: routes.A.participationRequirements,
      safetyWarning: routes.A.safetyWarning,
    });
    expect(pkg).toMatchObject({ routeId: 'route-a', contentVersion: 1, status: 'SAN_SANG', versionStatus: 'CURRENT' });
    expect(images.map((image) => image.sourceRef).sort()).toEqual(
      ['fixture/a-offline-map.png', 'fixture/a1-1-a.png', 'fixture/a1-1-b.png', 'fixture/a1-2.png', 'fixture/a2-1.png'].sort(),
    );
    // ảnh bìa và gallery không vào gói (BR-M01-013)
    expect(fetched.some((url) => /a-thumb|a-gallery|a-route-map/.test(url))).toBe(false);
  });

  it('mỗi sourceRef chỉ tải một lần; tối đa PACKAGE_IMAGE_CONCURRENCY (4) request song song', async () => {
    const { routes, snapshots } = publicationFixture();
    const snapshot = structuredClone(snapshots.A);
    // Hai resource cùng khai báo một ảnh
    snapshot.checkpoints[0]!.offlineResources![1]!.staticImages = ['fixture/a1-1-a.png', 'fixture/a1-2.png'];
    const { media, fetched, maxActive } = countingMedia();
    const result = await buildCandidate({ route: routes.A, snapshot, media, readAt: READ_AT });
    expect(result.ok).toBe(true);
    expect(fetched.length).toBe(new Set(fetched).size);
    expect(maxActive()).toBeLessThanOrEqual(4);
  });

  it.each(['fixture/a2-1.png', 'fixture/a-offline-map.png'])('thiếu một ảnh khai báo (%s) → hỏng', async (ref) => {
    const { routes, snapshots } = publicationFixture();
    const result = await buildCandidate({ route: routes.A, snapshot: snapshots.A, media: countingMedia([ref]).media, readAt: READ_AT });
    expect(result).toEqual({ ok: false, reason: 'download' });
  });

  it('không khai báo ảnh nào → vẫn hợp lệ; cờ nói cần mà snapshot không có gì → SAN_SANG với resources rỗng', async () => {
    const { routes, snapshots } = publicationFixture();
    const route = { ...routes.B, hasOfflineRequiredCheckpoint: true };
    const result = await buildCandidate({ route, snapshot: snapshots.B, media: countingMedia().media, readAt: READ_AT });
    expect(result.ok && result.staged.resources).toEqual([]);
    expect(result.ok && result.staged.images).toEqual([]);
    expect(result.ok && result.staged.pkg).not.toHaveProperty('offlineRouteMap');
  });

  it('tuyến không HOAT_DONG → không dựng', async () => {
    const { routes, snapshots } = publicationFixture();
    const result = await buildCandidate({ route: routes.C, snapshot: snapshots.C, media: countingMedia().media, readAt: READ_AT });
    expect(result).toEqual({ ok: false, reason: 'source' });
  });

  it('snapshot không phải version active của tuyến → không dựng', async () => {
    const { routes, snapshots } = publicationFixture();
    const result = await buildCandidate({
      route: { ...routes.A, activeContentVersion: 2 },
      snapshot: snapshots.A,
      media: countingMedia().media,
      readAt: READ_AT,
    });
    expect(result).toEqual({ ok: false, reason: 'source' });
  });

  it('ký URL lỗi → hỏng', async () => {
    const { routes, snapshots } = publicationFixture();
    const media: MediaClient = { createSignedUrls: async () => null, fetchImageBlob: async () => null };
    expect(await buildCandidate({ route: routes.A, snapshot: snapshots.A, media, readAt: READ_AT })).toEqual({
      ok: false,
      reason: 'download',
    });
  });
});
