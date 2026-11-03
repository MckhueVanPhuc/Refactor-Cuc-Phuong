// Start (tasks T059; FR-M01-012, 013; BR-M01-010, 015; research R-09, R-11).
import { describe, expect, it, vi } from 'vitest';
import type { LockManagerLike } from '../../../app/pwa/updateCoordinator';
import { visitorDb } from '../../../shared/db/visitorDb';
import { createFakeSource } from '../api/fake/fakeSource';
import { failNextContextWrite } from '../storage/faultInjection';
import { readSelectedRouteContext } from '../storage/readers';
import { createStartRoute } from './startRoute';

/** Web Locks giả dùng chung giữa các "tab" (ifAvailable exclusive). */
function createFakeLocks(): LockManagerLike {
  const held = new Set<string>();
  return {
    request: async (name, _options, callback) => {
      if (held.has(name)) return callback(null);
      held.add(name);
      try {
        return await callback({ name, mode: 'exclusive' });
      } finally {
        held.delete(name);
      }
    },
  };
}

describe('startRoute', () => {
  it('ghi context rồi mới điều hướng PATHS.m02SessionEntry', async () => {
    const fake = createFakeSource();
    const navigate = vi.fn(async (path: string) => {
      // Lúc điều hướng, context đã commit
      expect((await readSelectedRouteContext()).kind).toBe('OK');
      return path;
    });
    const start = createStartRoute({ source: fake.source, locks: createFakeLocks() });
    expect(await start('route-b', navigate)).toEqual({ kind: 'started' });
    expect(navigate).toHaveBeenCalledWith('/trip');
    const read = await readSelectedRouteContext();
    expect(read.kind === 'OK' && read.value.routeId).toBe('route-b');
  });

  it('bấm hai lần khi lần đầu chưa xong (cùng tab) → chỉ một context, lần hai bị bỏ qua', async () => {
    const fake = createFakeSource();
    fake.controls.setDelayMs(30);
    const start = createStartRoute({ source: fake.source, locks: createFakeLocks() });
    const navigate = vi.fn();
    const [first, second] = await Promise.all([start('route-b', navigate), start('route-b', navigate)]);
    expect([first.kind, second.kind].sort()).toEqual(['busy', 'started']);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(await visitorDb.table('selectedRouteContext').count()).toBe(1);
  });

  it('hai tab dùng chung Web Lock → lần thứ hai bị bỏ qua', async () => {
    const fake = createFakeSource();
    fake.controls.setDelayMs(30);
    const locks = createFakeLocks();
    const tabA = createStartRoute({ source: fake.source, locks });
    const tabB = createStartRoute({ source: fake.source, locks });
    const results = await Promise.all([tabA('route-b', vi.fn()), tabB('route-b', vi.fn())]);
    expect(results.map((result) => result.kind).sort()).toEqual(['busy', 'started']);
  });

  it('không có Web Locks API → mutex trong tab vẫn chặn lần bấm lặp', async () => {
    const fake = createFakeSource();
    fake.controls.setDelayMs(30);
    const start = createStartRoute({ source: fake.source, locks: undefined });
    const results = await Promise.all([start('route-b', vi.fn()), start('route-b', vi.fn())]);
    expect(results.map((result) => result.kind).sort()).toEqual(['busy', 'started']);
  });

  it('Start lỗi ghi → không điều hướng, context cũ giữ nguyên', async () => {
    const fake = createFakeSource();
    const start = createStartRoute({ source: fake.source, locks: createFakeLocks() });
    await start('route-b', vi.fn());
    const before = await readSelectedRouteContext();
    failNextContextWrite();
    const navigate = vi.fn();
    expect(await start('route-a', navigate)).toEqual({ kind: 'failed' });
    expect(navigate).not.toHaveBeenCalled();
    expect(await readSelectedRouteContext()).toEqual(before);
  });

  it('bị chặn (offline không có gói) → không điều hướng, không ghi', async () => {
    const fake = createFakeSource();
    fake.controls.setUnavailable(true);
    const navigate = vi.fn();
    const start = createStartRoute({ source: fake.source, locks: createFakeLocks() });
    expect(await start('route-a', navigate)).toEqual({ kind: 'blocked', reason: 'offlineNoPackage' });
    expect(navigate).not.toHaveBeenCalled();
    expect(await readSelectedRouteContext()).toEqual({ kind: 'NONE' });
  });

  it('M01 không đổi authorizationStatus vì thời gian: context quá hạn vẫn AUTHORIZED trong store', async () => {
    const fake = createFakeSource();
    const start = createStartRoute({ source: fake.source, locks: createFakeLocks(), now: () => new Date('2020-01-01T00:00:00Z') });
    await start('route-b', vi.fn());
    const read = await readSelectedRouteContext();
    expect(read.kind === 'OK' && read.value.authorizationStatus).toBe('AUTHORIZED');
    expect(read.kind === 'OK' && read.value.expiresAt).toBe('2020-01-02T00:00:00.000Z');
  });
});
