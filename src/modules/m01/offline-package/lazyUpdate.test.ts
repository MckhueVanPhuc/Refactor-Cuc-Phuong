// Cập nhật lười, OUTDATED, làm mới chữ cốt lõi (tasks T076; BR-M01-006, 014; FR-M01-010, 014; SC-M01-004).
import { describe, expect, it, vi } from 'vitest';
import { publicationFixture } from '../../../shared/contracts/__fixtures__/publication';
import { createFakeSource } from '../api/fake/fakeSource';
import { registerM01SourceEffects } from '../api/sourceEffects';
import { readActiveOfflinePackage } from '../storage/readers';
import { maybeUpdatePackage } from './lazyUpdate';
import { createPackageOps } from './packageOps';

function opsFor(fake: ReturnType<typeof createFakeSource>) {
  return createPackageOps({
    source: fake.source,
    media: fake.media,
    locks: undefined,
    registerPackageOperation: () => () => {},
    persistStorage: async () => true,
  });
}

describe('hiệu ứng sau đọc nguồn', () => {
  it('activeContentVersion lớn hơn version gói → OUTDATED; gói vẫn dùng được', async () => {
    const fake = createFakeSource();
    await opsFor(fake).download('route-a');
    const unregister = registerM01SourceEffects();
    try {
      fake.controls.publishNextVersion('route-a');
      await fake.source.fetchCatalog();
    } finally {
      unregister();
    }
    const pkg = await readActiveOfflinePackage('route-a');
    expect(pkg?.versionStatus).toBe('OUTDATED');
    expect(pkg?.contentVersion).toBe(1);
  });

  it('đọc thành công → essentials thay nguyên khối, capturedAt = thời điểm đọc; đọc lỗi → giữ bản cũ', async () => {
    const fake = createFakeSource();
    await opsFor(fake).download('route-a');
    const before = (await readActiveOfflinePackage('route-a'))!.routeEssentials;
    const unregister = registerM01SourceEffects();
    try {
      fake.controls.setUnavailable(true);
      await fake.source.fetchRoute('route-a');
      expect((await readActiveOfflinePackage('route-a'))!.routeEssentials).toEqual(before);
      fake.controls.setUnavailable(false);
      await new Promise((resolve) => setTimeout(resolve, 5));
      await fake.source.fetchRoute('route-a');
    } finally {
      unregister();
    }
    const after = (await readActiveOfflinePackage('route-a'))!.routeEssentials;
    expect(Date.parse(after.capturedAt)).toBeGreaterThan(Date.parse(before.capturedAt));
    expect(after.name).toEqual(publicationFixture().routes.A.name);
  });
});

describe('maybeUpdatePackage (mở chi tiết online)', () => {
  it('tuyến HOAT_DONG có gói, version mới → dựng candidate khi gói cũ vẫn active rồi kích hoạt', async () => {
    const fake = createFakeSource();
    const ops = opsFor(fake);
    await ops.download('route-a');
    fake.controls.publishNextVersion('route-a');
    const route = await fake.source.fetchRoute('route-a');
    if (route.kind !== 'OK' || !route.value) throw new Error('không đọc được tuyến');
    const pkg = await readActiveOfflinePackage('route-a');
    const download = vi.spyOn(ops, 'download');
    await maybeUpdatePackage(route.value, pkg, ops);
    expect(download).toHaveBeenCalledWith('route-a');
    expect((await readActiveOfflinePackage('route-a'))?.contentVersion).toBe(2);
  });

  it('tuyến không HOAT_DONG hoặc cùng version → không dựng', async () => {
    const fake = createFakeSource();
    const ops = opsFor(fake);
    await ops.download('route-a');
    const pkg = await readActiveOfflinePackage('route-a');
    const download = vi.spyOn(ops, 'download');
    const { routes } = publicationFixture();
    await maybeUpdatePackage(routes.A, pkg, ops);
    await maybeUpdatePackage({ ...routes.A, status: 'TAM_DONG', activeContentVersion: 2 }, pkg, ops);
    expect(download).not.toHaveBeenCalled();
  });
});
