// Chọn đường Start (tasks T057; BR-M01-008, 011; FR-M01-011; SC-M01-006, 010; research R-05, R-11).
import { Blob as NodeBlob } from 'node:buffer';
import { describe, expect, it } from 'vitest';
import { publicationFixture } from '../../../shared/contracts/__fixtures__/publication';
import { createFakeSource } from '../api/fake/fakeSource';
import type { SourceClient } from '../api/sourceClient';
import { seedReadyPackage } from '../storage/testSeed';
import { manifestOf, packageFromPublication } from '../testing/packageFixture';
import { chooseStartPath } from './chooseStartPath';

const blob = () => new NodeBlob([new Uint8Array([1])], { type: 'image/png' }) as unknown as Blob;

async function seedPackageA(versionStatus: 'CURRENT' | 'OUTDATED') {
  const { routes, snapshots } = publicationFixture();
  const pkg = packageFromPublication(routes.A, snapshots.A, { versionStatus });
  await seedReadyPackage(pkg, blob);
  return pkg;
}

describe('chooseStartPath', () => {
  it('online + HOAT_DONG + snapshot hợp lệ → đường online với manifest của snapshot', async () => {
    const fake = createFakeSource();
    expect(await chooseStartPath(fake.source, 'route-b')).toEqual({
      kind: 'online',
      manifest: manifestOf(publicationFixture().snapshots.B),
    });
  });

  it('tuyến không cần gói Start online không cần gói (SC-M01-010)', async () => {
    const result = await chooseStartPath(createFakeSource().source, 'route-b');
    expect(result.kind).toBe('online');
  });

  it('tuyến cần gói, online, chưa có gói → vẫn Start online được (điều kiện Start không đòi gói)', async () => {
    const result = await chooseStartPath(createFakeSource().source, 'route-a');
    expect(result.kind).toBe('online');
  });

  it('snapshot lệch activeContentVersion → đọc lại một lần rồi coi là nguồn không khả dụng', async () => {
    const fake = createFakeSource();
    let snapshotReads = 0;
    const source: SourceClient = {
      ...fake.source,
      fetchActiveSnapshot: async (routeId) => {
        snapshotReads += 1;
        const result = await fake.source.fetchActiveSnapshot(routeId);
        return result.kind === 'OK' && result.value ? { kind: 'OK', value: { ...result.value, contentVersion: 99 } } : result;
      },
    };
    expect(await chooseStartPath(source, 'route-b')).toEqual({ kind: 'blocked', reason: 'offlineNoPackage' });
    expect(snapshotReads).toBe(2);
  });

  it('snapshot lệch lần đầu, khớp lần đọc lại → online', async () => {
    const fake = createFakeSource();
    let snapshotReads = 0;
    const source: SourceClient = {
      ...fake.source,
      fetchActiveSnapshot: async (routeId) => {
        snapshotReads += 1;
        const result = await fake.source.fetchActiveSnapshot(routeId);
        if (snapshotReads > 1 || result.kind !== 'OK' || !result.value) return result;
        return { kind: 'OK', value: { ...result.value, contentVersion: 2 } };
      },
    };
    expect((await chooseStartPath(source, 'route-b')).kind).toBe('online');
  });

  it.each(['CURRENT', 'OUTDATED'] as const)('nguồn không khả dụng + gói SAN_SANG %s → đường offline', async (versionStatus) => {
    const pkg = await seedPackageA(versionStatus);
    const fake = createFakeSource();
    fake.controls.setUnavailable(true);
    expect(await chooseStartPath(fake.source, 'route-a')).toEqual({
      kind: 'offline',
      manifest: pkg.manifest,
      versionStatus,
    });
  });

  it('nguồn không khả dụng, không có gói → chặn', async () => {
    const fake = createFakeSource();
    fake.controls.setUnavailable(true);
    expect(await chooseStartPath(fake.source, 'route-a')).toEqual({ kind: 'blocked', reason: 'offlineNoPackage' });
  });

  it.each(['TAM_DONG', 'LUU_TRU'] as const)('tuyến %s → chặn, kể cả khi có gói', async (status) => {
    await seedPackageA('CURRENT');
    const fake = createFakeSource();
    fake.controls.setRouteStatus('route-a', status);
    expect(await chooseStartPath(fake.source, 'route-a')).toEqual({ kind: 'blocked', reason: 'routeUnavailable' });
  });

  it('tuyến không có dòng nguồn → chặn (không còn khả dụng)', async () => {
    expect(await chooseStartPath(createFakeSource().source, 'route-x')).toEqual({
      kind: 'blocked',
      reason: 'routeUnavailable',
    });
  });
});
