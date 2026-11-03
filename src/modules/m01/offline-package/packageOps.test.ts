// Thao tác gói (tasks T075; FR-M01-009; research R-08, R-09, R-14).
import { describe, expect, it, vi } from 'vitest';
import type { LockManagerLike } from '../../../app/pwa/updateCoordinator';
import { visitorDb } from '../../../shared/db/visitorDb';
import { createFakeSource } from '../api/fake/fakeSource';
import { writeLanguagePreference } from '../storage/languageWriter';
import { failNextActivation } from '../storage/faultInjection';
import { beginCandidate } from '../storage/packageWriter';
import { listPackageEntries, readActiveOfflinePackage } from '../storage/readers';
import { createPackageOps } from './packageOps';
import { recoverOrphans } from './recoverOrphans';

function createFakeLocks(): LockManagerLike & { held: Set<string> } {
  const held = new Set<string>();
  return {
    held,
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

function setup(options: { locks?: LockManagerLike | undefined } = {}) {
  const fake = createFakeSource();
  const release = vi.fn();
  const registerPackageOperation = vi.fn(() => release);
  const persistStorage = vi.fn(async () => true);
  const ops = createPackageOps({
    source: fake.source,
    media: fake.media,
    locks: 'locks' in options ? options.locks : createFakeLocks(),
    registerPackageOperation,
    persistStorage,
  });
  return { fake, ops, release, registerPackageOperation, persistStorage };
}

describe('packageOps', () => {
  it('tải A thành công → SAN_SANG CURRENT; giữ registerPackageOperation suốt thao tác; persist() trước lần tải đầu', async () => {
    const { ops, release, registerPackageOperation, persistStorage } = setup();
    expect(await ops.download('route-a')).toEqual({ kind: 'ready' });
    expect((await readActiveOfflinePackage('route-a'))?.versionStatus).toBe('CURRENT');
    expect(registerPackageOperation).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledTimes(1);
    expect(persistStorage).toHaveBeenCalled();
    expect(persistStorage.mock.invocationCallOrder[0]!).toBeLessThan(release.mock.invocationCallOrder[0]!);
  });

  it('bấm Tải hai lần (cùng tab) → một thao tác', async () => {
    const { fake, ops } = setup();
    fake.controls.setDelayMs(20);
    const results = await Promise.all([ops.download('route-a'), ops.download('route-a')]);
    expect(results.map((r) => r.kind).sort()).toEqual(['busy', 'ready']);
  });

  it('hai tab dùng chung Web Lock theo tuyến → một thao tác; Tải và Xóa đồng thời → một thao tác', async () => {
    const locks = createFakeLocks();
    const tabA = setup({ locks });
    const tabB = setup({ locks });
    tabA.fake.controls.setDelayMs(20);
    const results = await Promise.all([tabA.ops.download('route-a'), tabB.ops.download('route-a')]);
    expect(results.map((r) => r.kind).sort()).toEqual(['busy', 'ready']);
    const mixed = await Promise.all([tabA.ops.download('route-a'), tabB.ops.remove('route-a')]);
    expect(mixed.map((r) => r.kind)).toContain('busy');
  });

  it('ảnh lỗi lần đầu → CHUA_HOAN_TAT (V11)', async () => {
    const { fake, ops } = setup();
    fake.controls.failImage('fixture/a2-1.png', 500);
    expect(await ops.download('route-a')).toEqual({ kind: 'failed', reason: 'download' });
    expect((await listPackageEntries())[0]).toMatchObject({ candidate: { phase: 'CHUA_HOAN_TAT' }, active: null });
  });

  it('nguồn không khả dụng → lỗi nguồn, không có gói', async () => {
    const { fake, ops } = setup();
    fake.controls.setUnavailable(true);
    expect(await ops.download('route-a')).toEqual({ kind: 'failed', reason: 'source' });
    expect(await readActiveOfflinePackage('route-a')).toBeNull();
  });

  it('hết quota lúc kích hoạt cập nhật → lỗi lưu trữ; gói cũ còn (V12)', async () => {
    const { fake, ops } = setup();
    await ops.download('route-a');
    fake.controls.publishNextVersion('route-a');
    failNextActivation();
    expect(await ops.download('route-a')).toEqual({ kind: 'failed', reason: 'storage' });
    expect((await readActiveOfflinePackage('route-a'))?.contentVersion).toBe(1);
    expect(await visitorDb.table('packageCandidates').count()).toBe(0);
  });

  it('ghi candidate lỗi ngay đầu (quota, IndexedDB bị chặn) → lỗi lưu trữ, không reject', async () => {
    const { ops, release } = setup();
    const put = vi.spyOn(visitorDb.table('packageCandidates'), 'put').mockRejectedValueOnce(new Error('QuotaExceededError'));
    expect(await ops.download('route-a')).toEqual({ kind: 'failed', reason: 'storage' });
    expect(release).toHaveBeenCalledTimes(1);
    put.mockRestore();
    expect(await ops.download('route-a')).toEqual({ kind: 'ready' });
  });

  it('đổi ngôn ngữ trong lúc tải không ảnh hưởng candidate (gói chứa cả hai ngôn ngữ)', async () => {
    const { fake, ops } = setup();
    fake.controls.setDelayMs(10);
    const pending = ops.download('route-a');
    await writeLanguagePreference('en');
    await pending;
    const pkg = await readActiveOfflinePackage('route-a');
    expect(pkg?.routeEssentials.name).toEqual({ vi: 'Tuyến thử Bách Thảo', en: 'Test Botanic trail' });
  });

  it('xóa gói', async () => {
    const { ops } = setup();
    await ops.download('route-a');
    expect(await ops.remove('route-a')).toEqual({ kind: 'deleted' });
    expect(await readActiveOfflinePackage('route-a')).toBeNull();
  });
});

describe('recoverOrphans (R-08 "Khôi phục khi mở app")', () => {
  it('candidate DANG_TAI mà lock tuyến đang trống → xử lý như lỗi (V15)', async () => {
    await beginCandidate('route-a', 1);
    await recoverOrphans(createFakeLocks());
    expect((await listPackageEntries())[0]).toMatchObject({ candidate: { phase: 'CHUA_HOAN_TAT' } });
  });

  it('candidate DANG_TAI mà tab khác đang giữ lock → giữ nguyên', async () => {
    await beginCandidate('route-a', 1);
    const locks = createFakeLocks();
    locks.held.add('cpq:m01:package:route-a');
    await recoverOrphans(locks);
    expect((await listPackageEntries())[0]).toMatchObject({ candidate: { phase: 'DANG_TAI' } });
  });
});
