// Hàm đọc M01 (tasks T025; FR-M01-005, 013; DAC-M01-009, 015; data-model §5.2).
// Byte ảnh dùng Blob của Node: fake-indexeddb trong jsdom không clone được Blob của jsdom (validation-report DV-14).
import { Blob as NodeBlob } from 'node:buffer';
import { describe, expect, it } from 'vitest';
import { publicationFixture } from '../../../shared/contracts/__fixtures__/publication';
import { visitorDb } from '../../../shared/db/visitorDb';
import { contextFromSnapshot, packageFromPublication } from '../testing/packageFixture';
import {
  declaredImageRefs,
  findOfflineResource,
  listPackageEntries,
  M01_HANDOFF_TABLES,
  readActiveOfflinePackage,
  readLanguagePreference,
  readPackageImage,
  readSelectedRouteContext,
} from './readers';
import type { OfflinePackage } from '../../../shared/contracts/offlinePackage';
import {
  activePackagesTable,
  imageBytesTable,
  languagePreferenceTable,
  offlinePackagesTable,
  offlineResourcesTable,
  packageCandidatesTable,
  selectedRouteContextTable,
} from './tables';

const png = () => new NodeBlob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' }) as unknown as Blob;

function packageA(versionStatus: 'CURRENT' | 'OUTDATED' = 'CURRENT'): OfflinePackage {
  const { routes, snapshots } = publicationFixture();
  return packageFromPublication(routes.A, snapshots.A, { versionStatus });
}

/** Ghi thẳng vào store như writer sẽ ghi (test không đi qua writer của US6). */
async function seedPackage(pkg: OfflinePackage, options: { skipImage?: string } = {}) {
  const { resources, ...row } = pkg;
  const key = { routeId: pkg.routeId, contentVersion: pkg.contentVersion };
  await offlinePackagesTable.put(row);
  await offlineResourcesTable.bulkPut(resources.map((resource) => ({ ...resource, ...key })));
  const images = declaredImageRefs(pkg).filter((sourceRef) => sourceRef !== options.skipImage);
  await imageBytesTable.bulkPut(images.map((sourceRef) => ({ ...key, sourceRef, blob: png() })));
  await activePackagesTable.put(key);
}

describe('readLanguagePreference', () => {
  it('chưa có → null', async () => {
    expect(await readLanguagePreference()).toBeNull();
  });

  it('có → bỏ slot, trả contract', async () => {
    await languagePreferenceTable.put({ slot: 'current', languageCode: 'en' });
    expect(await readLanguagePreference()).toEqual({ languageCode: 'en' });
  });

  it('giá trị hỏng → null', async () => {
    await visitorDb.table('languagePreference').put({ slot: 'current', languageCode: 'fr' });
    expect(await readLanguagePreference()).toBeNull();
  });
});

describe('readSelectedRouteContext (D-01)', () => {
  const contextA = () => contextFromSnapshot(publicationFixture().snapshots.A);

  it('store trống → NONE', async () => {
    expect(await readSelectedRouteContext()).toEqual({ kind: 'NONE' });
  });

  it('dòng hợp lệ → OK, bỏ slot', async () => {
    await selectedRouteContextTable.put({ ...contextA(), slot: 'current' });
    expect(await readSelectedRouteContext()).toEqual({ kind: 'OK', value: contextA() });
  });

  it('dòng version 2 → INVALID (M02 từ chối, không chuyển đổi)', async () => {
    await visitorDb.table('selectedRouteContext').put({ ...contextA(), contractVersion: 2, slot: 'current' });
    expect(await readSelectedRouteContext()).toEqual({ kind: 'INVALID' });
  });

  it('dòng hỏng → INVALID', async () => {
    await visitorDb.table('selectedRouteContext').put({ slot: 'current', handoffId: 'x' });
    expect(await readSelectedRouteContext()).toEqual({ kind: 'INVALID' });
  });

  it('chạy được trong transaction rw bao ngoài gồm store context và store M02 (M02 research R-05)', async () => {
    await selectedRouteContextTable.put({ ...contextA(), slot: 'current' });
    const result = await visitorDb.transaction('rw', [...M01_HANDOFF_TABLES, 'playSessions'], async () => {
      const read = await readSelectedRouteContext();
      await visitorDb.table('playSessions').put({ sessionId: 's1', sourceHandoffId: contextA().handoffId, status: 'X' });
      return read;
    });
    expect(result.kind).toBe('OK');
    expect(await visitorDb.table('playSessions').count()).toBe(1);
  });

  it('M01_HANDOFF_TABLES chỉ gồm store context', () => {
    expect(M01_HANDOFF_TABLES).toEqual(['selectedRouteContext']);
  });
});

describe('readActiveOfflinePackage', () => {
  it('không có con trỏ → null', async () => {
    expect(await readActiveOfflinePackage('route-a')).toBeNull();
  });

  it('gói hợp lệ đủ byte → lắp resources[] và trả đúng contract', async () => {
    await seedPackage(packageA());
    const pkg = await readActiveOfflinePackage('route-a');
    expect(pkg).toEqual(packageA());
    expect(pkg?.resources).toHaveLength(3);
  });

  it('gói OUTDATED vẫn được trả', async () => {
    await seedPackage(packageA('OUTDATED'));
    expect((await readActiveOfflinePackage('route-a'))?.versionStatus).toBe('OUTDATED');
  });

  it('thiếu byte của một ảnh QR → null (DAC-M01-015)', async () => {
    await seedPackage(packageA(), { skipImage: 'fixture/a2-1.png' });
    expect(await readActiveOfflinePackage('route-a')).toBeNull();
  });

  it('thiếu byte của sơ đồ offline → null (DAC-M01-010)', async () => {
    await seedPackage(packageA(), { skipImage: 'fixture/a-offline-map.png' });
    expect(await readActiveOfflinePackage('route-a')).toBeNull();
  });

  it('byte rỗng → null', async () => {
    await seedPackage(packageA());
    await imageBytesTable.put({
      routeId: 'route-a',
      contentVersion: 1,
      sourceRef: 'fixture/a1-2.png',
      blob: new NodeBlob([]) as unknown as Blob,
    });
    expect(await readActiveOfflinePackage('route-a')).toBeNull();
  });

  it('gói hỏng (sửa tay một dòng resource) → null', async () => {
    await seedPackage(packageA());
    await offlineResourcesTable.delete(['route-a', 1, 'qr-a1-2']);
    expect(await readActiveOfflinePackage('route-a')).toBeNull();
  });

  it('dòng gói không phải SAN_SANG → null', async () => {
    await seedPackage({ ...packageA(), status: 'CHUA_HOAN_TAT' });
    expect(await readActiveOfflinePackage('route-a')).toBeNull();
  });

  it('con trỏ trỏ tới version không có dòng gói → null', async () => {
    await seedPackage(packageA());
    await activePackagesTable.put({ routeId: 'route-a', contentVersion: 2 });
    expect(await readActiveOfflinePackage('route-a')).toBeNull();
  });

  it('candidate DANG_TAI (kể cả có staged) không bao giờ được trả ra (FR-M01-013)', async () => {
    const pkg = packageA();
    const { resources, ...row } = pkg;
    await packageCandidatesTable.put({
      routeId: 'route-a',
      operationToken: 't',
      phase: 'DANG_TAI',
      startedAt: '2026-11-02T00:00:00.000Z',
      staged: {
        pkg: row,
        resources: resources.map((resource) => ({ ...resource, routeId: 'route-a', contentVersion: 1 })),
        images: [],
      },
    });
    expect(await readActiveOfflinePackage('route-a')).toBeNull();
    expect(await findOfflineResource('route-a', 'qr-a1-1')).toBeNull();
  });
});

describe('findOfflineResource / readPackageImage', () => {
  it('trả resource của gói active theo qrIdentifier', async () => {
    await seedPackage(packageA());
    expect(await findOfflineResource('route-a', 'qr-a2-1')).toMatchObject({ checkpointId: 'cp-a2' });
    expect(await findOfflineResource('route-a', 'qr-a3-1')).toBeNull();
  });

  it('gói không đọc được → không trả resource', async () => {
    await seedPackage(packageA(), { skipImage: 'fixture/a1-2.png' });
    expect(await findOfflineResource('route-a', 'qr-a2-1')).toBeNull();
  });

  it('readPackageImage trả byte của gói active; version khác → null', async () => {
    await seedPackage(packageA());
    const blob = await readPackageImage('route-a', 1, 'fixture/a1-2.png');
    expect(blob?.size).toBe(4);
    expect(await readPackageImage('route-a', 2, 'fixture/a1-2.png')).toBeNull();
    expect(await readPackageImage('route-a', 1, 'fixture/none.png')).toBeNull();
  });
});

describe('listPackageEntries (SCR-M01-004, nội bộ M01)', () => {
  it('liệt kê gói active (đọc được hoặc không) và candidate theo tuyến', async () => {
    await seedPackage(packageA());
    await packageCandidatesTable.put({
      routeId: 'route-b',
      operationToken: 't',
      phase: 'CHUA_HOAN_TAT',
      startedAt: '2026-11-02T00:00:00.000Z',
      failedAt: '2026-11-02T00:01:00.000Z',
    });
    await activePackagesTable.put({ routeId: 'route-c', contentVersion: 1 });

    const entries = await listPackageEntries();
    expect(entries.map((entry) => entry.routeId)).toEqual(['route-a', 'route-b', 'route-c']);
    expect(entries[0]).toMatchObject({ active: { contentVersion: 1, pkg: { routeId: 'route-a' } }, candidate: null });
    expect(entries[1]).toMatchObject({ active: null, candidate: { phase: 'CHUA_HOAN_TAT' } });
    expect(entries[2]).toMatchObject({ active: { contentVersion: 1, pkg: null }, candidate: null });
    expect(entries[1]!.candidate).not.toHaveProperty('staged');
  });
});
