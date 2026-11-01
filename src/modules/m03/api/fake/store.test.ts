import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FIXTURE_ACCOUNTS } from './fixtures';
import { FakeStore } from './store';

// Test lõi của adapter giả (chỉ fake). Hành vi quan sát qua AdminApi nằm ở src/modules/m03/api/contract/*.contract.ts.
function signedInStore(role: 'REVIEWER' | 'CONTENT_STAFF' = 'CONTENT_STAFF') {
  const store = new FakeStore();
  store.signIn(FIXTURE_ACCOUNTS[role].userId);
  return store;
}

const subject = { type: 'ROUTE' as const, id: 'r1', name: 'Tuyến thử' };

describe('FakeStore.run', () => {
  it('thành công: chạy thân command, ghi đúng một dòng audit SUCCESS', () => {
    const store = signedInStore();
    const result = store.run({ action: 'ROUTE_DRAFT_SAVED', roles: 'B', subject }, () => ({
      ok: true,
      messageKey: 'MSG-SAVED',
      data: 1,
    }));
    expect(result).toEqual({ ok: true, messageKey: 'MSG-SAVED', data: 1 });
    expect(store.audit).toHaveLength(1);
    expect(store.audit[0]).toMatchObject({
      action: 'ROUTE_DRAFT_SAVED',
      result: 'SUCCESS',
      actorEmail: FIXTURE_ACCOUNTS.CONTENT_STAFF.email,
      subjectType: 'ROUTE',
      subjectName: 'Tuyến thử',
    });
  });

  it('chưa đăng nhập hoặc không có tài khoản active → FORBIDDEN, có một dòng audit', () => {
    const store = new FakeStore();
    const result = store.run({ action: 'ROUTE_DRAFT_SAVED', roles: 'B', subject }, () => {
      throw new Error('không được chạy');
    });
    expect(result).toEqual({ ok: false, reason: 'FORBIDDEN', messageKey: 'MSG-NO-PERMISSION' });
    expect(store.audit).toHaveLength(1);
    expect(store.audit[0]?.result).toBe('FAILURE');
  });

  it('command chỉ Reviewer: Nhân viên → FORBIDDEN; Quản lý → chạy', () => {
    const spec = { action: 'ROUTE_ARCHIVED', roles: 'R' as const, subject };
    const body = () => ({ ok: true as const, messageKey: 'MSG-SAVED' as const, data: null });
    expect(signedInStore('CONTENT_STAFF').run(spec, body)).toMatchObject({ reason: 'FORBIDDEN' });
    expect(signedInStore('REVIEWER').run(spec, body)).toMatchObject({ ok: true });
  });

  it('expectedConcurrencyRevision lệch → STALE kèm email và thời điểm của lần sửa cuối', () => {
    const store = signedInStore();
    const result = store.run(
      {
        action: 'ROUTE_DRAFT_SAVED',
        roles: 'B',
        subject,
        expected: [{ submitted: 3, current: 4, editorEmail: 'other@example.test', editedAt: '2026-10-30T03:00:00.000Z' }],
      },
      () => ({ ok: true, messageKey: 'MSG-SAVED', data: null }),
    );
    expect(result).toEqual({
      ok: false,
      reason: 'STALE',
      messageKey: 'MSG-STALE',
      stale: { editorEmail: 'other@example.test', editedAt: '2026-10-30T03:00:00.000Z' },
    });
    expect(store.audit).toHaveLength(1);
  });

  it('holdLock trên tập giao nhau → BUSY kèm tên mục; tập rời nhau vẫn chạy', () => {
    const store = signedInStore();
    store.holdLock('route:r1');
    const busy = store.run(
      { action: 'ROUTE_CLOSED', roles: 'B', subject, lockKeys: [{ key: 'route:r1', itemName: 'Tuyến thử' }] },
      () => ({ ok: true, messageKey: 'MSG-SAVED', data: null }),
    );
    expect(busy).toEqual({ ok: false, reason: 'BUSY', messageKey: 'MSG-ROUTE-BUSY', busy: { itemName: 'Tuyến thử' } });
    const other = store.run(
      { action: 'ROUTE_CLOSED', roles: 'B', subject, lockKeys: [{ key: 'route:r2', itemName: 'Tuyến khác' }] },
      () => ({ ok: true, messageKey: 'MSG-SAVED', data: null }),
    );
    expect(other.ok).toBe(true);
    store.releaseLock('route:r1');
  });

  it('failNext → FAILED với khóa đã chọn, chỉ một lần', () => {
    const store = signedInStore();
    store.failNext('PUBLISHED', 'MSG-PUBLISH-FAILED');
    const spec = { action: 'PUBLISHED', roles: 'B' as const, subject };
    const body = () => ({ ok: true as const, messageKey: 'MSG-PUBLISHED' as const, data: null });
    expect(store.run(spec, body)).toEqual({ ok: false, reason: 'FAILED', messageKey: 'MSG-PUBLISH-FAILED' });
    expect(store.run(spec, body).ok).toBe(true);
  });

  it('thân command thất bại hoặc ném lỗi → mọi thay đổi trong thân bị hoàn lại', () => {
    const store = signedInStore();
    const before = store.state.routes.size;
    const failed = store.run({ action: 'ROUTE_DRAFT_SAVED', roles: 'B', subject }, () => {
      store.state.routes.set('tmp', {
        routeId: 'tmp',
        name: 'Tạm',
        status: 'NHAP',
        concurrencyRevision: 1,
        lastEditedByEmail: 'x@example.test',
        lastEditedAt: store.now(),
      });
      return { ok: false, reason: 'FAILED', messageKey: 'MSG-GENERIC' };
    });
    expect(failed.ok).toBe(false);
    expect(store.state.routes.size).toBe(before);
    expect(() =>
      store.run({ action: 'ROUTE_DRAFT_SAVED', roles: 'B', subject }, () => {
        store.state.routes.set('tmp2', {
          routeId: 'tmp2',
          name: 'Tạm',
          status: 'NHAP',
          concurrencyRevision: 1,
          lastEditedByEmail: 'x@example.test',
          lastEditedAt: store.now(),
        });
        throw new Error('lỗi giả');
      }),
    ).toThrow('lỗi giả');
    expect(store.state.routes.size).toBe(before);
    expect(store.audit).toHaveLength(2);
  });

  it('newId sinh id opaque chữ-số, không lặp', () => {
    const store = new FakeStore();
    const ids = new Set(Array.from({ length: 200 }, () => store.newId()));
    expect(ids.size).toBe(200);
    for (const id of ids) expect(id).toMatch(/^[A-Za-z0-9]{20}$/);
  });
});

describe('không xóa vật lý bản ghi nào (BR-M03-D12, G08)', () => {
  // Quét mã của adapter giả: không có lệnh xóa hay làm rỗng bảng "database" nào. Hủy, lưu trữ, thu hồi, bỏ thay đổi
  // đều là đổi trạng thái; snapshot không bao giờ bị xóa nên mọi version cũ luôn còn (BR-M03-G08).
  // Ở giai đoạn B, pgTAP kiểm cùng điều này bằng trigger chặn DELETE (T200).
  const fakeDir = join(process.cwd(), 'src', 'modules', 'm03', 'api', 'fake');
  const sources = readdirSync(fakeDir).filter((name) => name.endsWith('.ts') && !name.endsWith('.test.ts'));
  const TABLES = ['accounts', 'routes', 'checkpoints', 'qrCodes', 'revisions', 'snapshots', 'media', 'sessionRecords'];

  it.each(TABLES)('bảng %s không bị xóa dòng hay làm rỗng', (table) => {
    const pattern = new RegExp(String.raw`\b${table}(\(\))?\.(delete|clear)\(`);
    const offenders = sources.filter((name) => pattern.test(readFileSync(join(fakeDir, name), 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('bảng quét đúng mọi bảng của FakeState', () => {
    expect(Object.keys(new FakeStore().state).sort()).toEqual([...TABLES].sort());
  });
});
