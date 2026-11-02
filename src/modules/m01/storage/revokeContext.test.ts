// Thu hồi context của tuyến đóng (tasks T066; BR-M01-011; DAC-M01-006).
import { describe, expect, it } from 'vitest';
import { publicationFixture } from '../../../shared/contracts/__fixtures__/publication';
import { contextFromSnapshot } from '../testing/packageFixture';
import { readSelectedRouteContext } from './readers';
import { revokeContextForRoutes } from './revokeContext';
import { seedContext } from './testSeed';

const contextA = () => contextFromSnapshot(publicationFixture().snapshots.A);

describe('revokeContextForRoutes', () => {
  it('context hiện tại của tuyến đó, AUTHORIZED → REVOKED; mọi trường khác giữ nguyên', async () => {
    await seedContext(contextA());
    expect(await revokeContextForRoutes(['route-a'])).toBe(true);
    expect(await readSelectedRouteContext()).toEqual({
      kind: 'OK',
      value: { ...contextA(), authorizationStatus: 'REVOKED' },
    });
  });

  it('context tuyến khác không đổi', async () => {
    await seedContext(contextA());
    expect(await revokeContextForRoutes(['route-b', 'route-c'])).toBe(false);
    expect(await readSelectedRouteContext()).toEqual({ kind: 'OK', value: contextA() });
  });

  it('đã REVOKED hoặc không có context → không ghi gì', async () => {
    expect(await revokeContextForRoutes(['route-a'])).toBe(false);
    await seedContext({ ...contextA(), authorizationStatus: 'REVOKED' });
    expect(await revokeContextForRoutes(['route-a'])).toBe(false);
  });

  it('danh sách rỗng → không làm gì', async () => {
    await seedContext(contextA());
    expect(await revokeContextForRoutes([])).toBe(false);
  });
});
