// Ghi gói (tasks T074; research R-08; BR-M01-005, 006; FR-M01-008, 009, 013; SC-M01-003, 004; DAC-M01-009, 012, 013).
import { Blob as NodeBlob } from 'node:buffer';
import { describe, expect, it } from 'vitest';
import { nextVersion, publicationFixture } from '../../../shared/contracts/__fixtures__/publication';
import { visitorDb } from '../../../shared/db/visitorDb';
import { contextFromSnapshot, packageFromPublication } from '../testing/packageFixture';
import { failNextActivation } from './faultInjection';
import {
  activateCandidate,
  beginCandidate,
  deletePackage,
  failCandidate,
  markOutdated,
  refreshEssentials,
  stageCandidate,
} from './packageWriter';
import { listPackageEntries, readActiveOfflinePackage, readSelectedRouteContext } from './readers';
import type { StagedPackage } from './rows';
import { seedContext } from './testSeed';

const blob = () => new NodeBlob([new Uint8Array([1, 2])], { type: 'image/png' }) as unknown as Blob;

function staged(version: 1 | 2 = 1): StagedPackage {
  const fixture = publicationFixture();
  const { route, snapshot } = version === 1 ? { route: fixture.routes.A, snapshot: fixture.snapshots.A } : nextVersion(fixture.routes.A, fixture.snapshots.A);
  const { resources, downloadedAt: _omit, ...pkg } = packageFromPublication(route, snapshot);
  const refs = [...new Set([...resources.flatMap((r) => r.staticImages), ...(pkg.offlineRouteMap ? [pkg.offlineRouteMap.sourceRef] : [])])];
  return {
    pkg,
    resources: resources.map((r) => ({ ...r, routeId: pkg.routeId, contentVersion: pkg.contentVersion })),
    images: refs.map((sourceRef) => ({ sourceRef, blob: blob() })),
  };
}

async function download(version: 1 | 2 = 1) {
  const token = await beginCandidate('route-a', version);
  expect(await stageCandidate('route-a', token, staged(version))).toBe(true);
  await activateCandidate('route-a', token);
  return token;
}

const M02_STORES = ['playSessions', 'checkpointVisits', 'pendingSyncItems'];

describe('packageWriter', () => {
  it('beginCandidate ghi DANG_TAI với operationToken; trong lúc tải readActiveOfflinePackage không trả candidate', async () => {
    const token = await beginCandidate('route-a', 1);
    expect(token).toMatch(/^[0-9a-f-]{36}$/);
    await stageCandidate('route-a', token, staged());
    expect(await readActiveOfflinePackage('route-a')).toBeNull();
    expect((await listPackageEntries())[0]).toMatchObject({ candidate: { phase: 'DANG_TAI' }, active: null });
  });

  it('staging chỉ khi token khớp', async () => {
    await beginCandidate('route-a', 1);
    expect(await stageCandidate('route-a', 'token-khac', staged())).toBe(false);
  });

  it('kích hoạt là một transaction: gói SAN_SANG + CURRENT + downloadedAt, resources, byte, con trỏ; xóa candidate', async () => {
    await download();
    const pkg = await readActiveOfflinePackage('route-a');
    expect(pkg).toMatchObject({ status: 'SAN_SANG', versionStatus: 'CURRENT', contentVersion: 1 });
    expect(pkg?.downloadedAt).toBeDefined();
    expect(pkg?.resources).toHaveLength(3);
    expect(await visitorDb.table('imageBytes').count()).toBe(5);
    expect(await visitorDb.table('packageCandidates').count()).toBe(0);
  });

  it('kích hoạt với token lạ bị từ chối, không ghi gì', async () => {
    const token = await beginCandidate('route-a', 1);
    await stageCandidate('route-a', token, staged());
    await expect(activateCandidate('route-a', 'token-khac')).rejects.toThrow();
    expect(await readActiveOfflinePackage('route-a')).toBeNull();
  });

  it('cập nhật v1 → v2: con trỏ sang v2 CURRENT, dữ liệu v1 bị xóa cùng transaction', async () => {
    await download(1);
    await download(2);
    expect((await readActiveOfflinePackage('route-a'))?.contentVersion).toBe(2);
    expect(await visitorDb.table('offlinePackages').count()).toBe(1);
    expect((await visitorDb.table('offlineResources').toArray()).every((r) => r.contentVersion === 2)).toBe(true);
    expect((await visitorDb.table('imageBytes').toArray()).every((r) => r.contentVersion === 2)).toBe(true);
  });

  it('QuotaExceededError lúc kích hoạt → rollback, gói cũ nguyên vẹn (SC-M01-004)', async () => {
    await download(1);
    await markOutdated('route-a', 2);
    const before = await readActiveOfflinePackage('route-a');
    const token = await beginCandidate('route-a', 2);
    await stageCandidate('route-a', token, staged(2));
    failNextActivation();
    await expect(activateCandidate('route-a', token)).rejects.toMatchObject({ name: 'QuotaExceededError' });
    expect(await readActiveOfflinePackage('route-a')).toEqual(before);
    await failCandidate('route-a', token);
    expect(await visitorDb.table('packageCandidates').count()).toBe(0);
    expect((await readActiveOfflinePackage('route-a'))?.versionStatus).toBe('OUTDATED');
  });

  it('lỗi lần đầu → CHUA_HOAN_TAT, không có dòng offlinePackages; candidate CHUA_HOAN_TAT không bao giờ thành active', async () => {
    const token = await beginCandidate('route-a', 1);
    await stageCandidate('route-a', token, staged());
    await failCandidate('route-a', token);
    expect(await visitorDb.table('offlinePackages').count()).toBe(0);
    const [entry] = await listPackageEntries();
    expect(entry).toMatchObject({ candidate: { phase: 'CHUA_HOAN_TAT' }, active: null });
    expect((await visitorDb.table('packageCandidates').get('route-a'))?.staged).toBeUndefined();
    await expect(activateCandidate('route-a', token)).rejects.toThrow();
    expect(await readActiveOfflinePackage('route-a')).toBeNull();
  });

  it('failCandidate với token cũ không đè thao tác mới hơn', async () => {
    const old = await beginCandidate('route-a', 1);
    const current = await beginCandidate('route-a', 1);
    await failCandidate('route-a', old);
    expect((await visitorDb.table('packageCandidates').get('route-a'))?.operationToken).toBe(current);
  });

  it('xóa gói: gói, resources, byte, candidate, con trỏ mất; context và store M02 giữ nguyên', async () => {
    await download();
    const context = contextFromSnapshot(publicationFixture().snapshots.A);
    await seedContext(context);
    await visitorDb.table('playSessions').put({ sessionId: 's', sourceHandoffId: 'h', status: 'X' });
    await deletePackage('route-a');
    for (const store of ['offlinePackages', 'offlineResources', 'imageBytes', 'activePackages', 'packageCandidates']) {
      expect(await visitorDb.table(store).count()).toBe(0);
    }
    expect(await readSelectedRouteContext()).toEqual({ kind: 'OK', value: context });
    expect(await Promise.all(M02_STORES.map((s) => visitorDb.table(s).count()))).toEqual([1, 0, 0]);
  });

  it('markOutdated chỉ khi version nguồn lớn hơn version gói', async () => {
    await download();
    await markOutdated('route-a', 1);
    expect((await readActiveOfflinePackage('route-a'))?.versionStatus).toBe('CURRENT');
    await markOutdated('route-a', 2);
    expect((await readActiveOfflinePackage('route-a'))?.versionStatus).toBe('OUTDATED');
  });

  it('refreshEssentials thay nguyên khối khi gói active vẫn là gói đó; version khác → không đổi', async () => {
    await download();
    const essentials = {
      capturedAt: '2026-11-03T09:00:00.000Z',
      name: { vi: 'Tên mới', en: 'New name' },
      startingPoint: { vi: 'Cổng mới', en: 'New gate' },
    };
    expect(await refreshEssentials('route-a', 2, essentials)).toBe(false);
    expect(await refreshEssentials('route-a', 1, essentials)).toBe(true);
    expect((await readActiveOfflinePackage('route-a'))?.routeEssentials).toEqual(essentials);
  });

  it('refreshEssentials từ chối essentials không hợp lệ (không để gói thiếu essentials)', async () => {
    await download();
    expect(await refreshEssentials('route-a', 1, { capturedAt: 'x' } as never)).toBe(false);
    expect(await readActiveOfflinePackage('route-a')).not.toBeNull();
  });
});
