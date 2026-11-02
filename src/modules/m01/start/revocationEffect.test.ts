// Hiệu ứng thu hồi sau mỗi lần đọc nguồn thành công (tasks T067; BR-M01-010, 011; US-M01-05 mục 2–3).
import { Blob as NodeBlob } from 'node:buffer';
import { describe, expect, it } from 'vitest';
import { publicationFixture } from '../../../shared/contracts/__fixtures__/publication';
import { visitorDb } from '../../../shared/db/visitorDb';
import { createFakeSource } from '../api/fake/fakeSource';
import { registerM01SourceEffects } from '../api/sourceEffects';
import { readActiveOfflinePackage, readSelectedRouteContext } from '../storage/readers';
import { seedContext, seedReadyPackage } from '../storage/testSeed';
import { contextFromSnapshot, packageFromPublication } from '../testing/packageFixture';
import { chooseStartPath } from './chooseStartPath';
import { revokeClosedRoutes } from './revocationEffect';

const M02_STORES = ['playSessions', 'checkpointVisits', 'pendingSyncItems'];

async function seed() {
  const { routes, snapshots } = publicationFixture();
  const pkg = packageFromPublication(routes.A, snapshots.A);
  await seedReadyPackage(pkg, () => new NodeBlob([new Uint8Array([1])], { type: 'image/png' }) as unknown as Blob);
  await seedContext(contextFromSnapshot(snapshots.A));
  await visitorDb.table('playSessions').put({ sessionId: 's1', sourceHandoffId: 'h-old', status: 'DANG_DIEN_RA' });
  return pkg;
}

const m02Rows = () => Promise.all(M02_STORES.map((store) => visitorDb.table(store).toArray()));

describe('revokeClosedRoutes', () => {
  it.each(['TAM_DONG', 'LUU_TRU'] as const)('đọc thấy %s → context cùng tuyến thành REVOKED', async (status) => {
    await seed();
    const routes = Object.values(publicationFixture().routes).map((route) =>
      route.routeId === 'route-a' ? { ...route, status } : route,
    );
    await revokeClosedRoutes({ routes, readAt: new Date().toISOString() });
    const read = await readSelectedRouteContext();
    expect(read.kind === 'OK' && read.value.authorizationStatus).toBe('REVOKED');
  });
});

describe('đăng ký với onSourceRead: mọi lần đọc nguồn thành công đều thu hồi', () => {
  it.each([
    ['danh mục', (source: ReturnType<typeof createFakeSource>['source']) => source.fetchCatalog()],
    ['chi tiết', (source: ReturnType<typeof createFakeSource>['source']) => source.fetchRoute('route-a')],
    ['Start', (source: ReturnType<typeof createFakeSource>['source']) => chooseStartPath(source, 'route-a')],
  ])('%s', async (_label, read) => {
    const pkg = await seed();
    const before = await m02Rows();
    const unregister = registerM01SourceEffects();
    try {
      const fake = createFakeSource();
      fake.controls.setRouteStatus('route-a', 'TAM_DONG');
      await read(fake.source);
    } finally {
      unregister();
    }
    const context = await readSelectedRouteContext();
    expect(context.kind === 'OK' && context.value.authorizationStatus).toBe('REVOKED');
    // Gói của tuyến còn nguyên; ba store M02 không đổi
    expect(await readActiveOfflinePackage('route-a')).toEqual(pkg);
    expect(await m02Rows()).toEqual(before);
  });

  it('đọc nguồn lỗi → không thu hồi', async () => {
    await seed();
    const unregister = registerM01SourceEffects();
    try {
      const fake = createFakeSource();
      fake.controls.setRouteStatus('route-a', 'TAM_DONG');
      fake.controls.setUnavailable(true);
      await fake.source.fetchCatalog();
    } finally {
      unregister();
    }
    const context = await readSelectedRouteContext();
    expect(context.kind === 'OK' && context.value.authorizationStatus).toBe('AUTHORIZED');
  });
});
