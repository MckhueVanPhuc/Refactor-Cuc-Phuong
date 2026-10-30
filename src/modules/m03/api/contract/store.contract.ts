// Hành vi chung của mọi command (admin-command §1, §2, §7): FORBIDDEN, STALE, đúng một dòng audit.
// Dùng C-04 và C-19; story sau bổ sung ca cho command của mình vào đây.
import { expect, it } from 'vitest';
import type { ContractSuite } from './harness';
import { syntheticFile } from './harness';

export const storeContract: ContractSuite = ({ subject, itFakeOnly }) => {
  async function uploadImage(ownerId: string, sizeBytes = 1024, type = 'image/jpeg') {
    const { api } = subject();
    const { objectPath } = await api.uploadMedia({
      ownerType: 'ROUTE',
      ownerId,
      file: syntheticFile('anh.jpg', type, sizeBytes),
    });
    return objectPath;
  }

  it('command thành công ghi đúng một dòng audit SUCCESS', async () => {
    const { api, controls } = subject();
    await controls.signInAs('CONTENT_STAFF');
    const routeId = await controls.seedRoute('Tuyến thử');
    const objectPath = await uploadImage(routeId);
    const before = (await controls.auditRows()).length;
    const result = await api.registerMedia({ ownerType: 'ROUTE', ownerId: routeId, usage: 'ROUTE_THUMBNAIL', type: 'IMAGE', objectPath });
    expect(result.ok).toBe(true);
    const rows = (await controls.auditRows()).slice(before);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ action: 'MEDIA_REGISTERED', result: 'SUCCESS' });
  });

  it('command bị từ chối vẫn ghi đúng một dòng audit FAILURE', async () => {
    const { api, controls } = subject();
    await controls.signInAs('CONTENT_STAFF');
    const routeId = await controls.seedRoute('Tuyến thử');
    const objectPath = await uploadImage(routeId, 1024, 'image/gif');
    const before = (await controls.auditRows()).length;
    const result = await api.registerMedia({ ownerType: 'ROUTE', ownerId: routeId, usage: 'ROUTE_THUMBNAIL', type: 'IMAGE', objectPath });
    expect(result).toMatchObject({ ok: false, reason: 'VALIDATION' });
    const rows = (await controls.auditRows()).slice(before);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ action: 'MEDIA_REGISTERED', result: 'FAILURE' });
  });

  it('danh tính không có tài khoản active → FORBIDDEN (SC-M03-009)', async () => {
    const { api, controls } = subject();
    await controls.signInAs('CONTENT_STAFF');
    const routeId = await controls.seedRoute('Tuyến thử');
    const objectPath = await uploadImage(routeId);
    await controls.signInWithoutAccount();
    const result = await api.registerMedia({ ownerType: 'ROUTE', ownerId: routeId, usage: 'ROUTE_THUMBNAIL', type: 'IMAGE', objectPath });
    expect(result).toEqual({ ok: false, reason: 'FORBIDDEN', messageKey: 'MSG-NO-PERMISSION' });
  });

  itFakeOnly('lỗi tiêm vào → FAILED, một dòng audit FAILURE, không tạo gì', async () => {
    const { api, controls } = subject();
    await controls.signInAs('CONTENT_STAFF');
    const routeId = await controls.seedRoute('Tuyến thử');
    const objectPath = await uploadImage(routeId);
    controls.failNext?.('MEDIA_REGISTERED');
    const before = (await controls.auditRows()).length;
    const failed = await api.registerMedia({ ownerType: 'ROUTE', ownerId: routeId, usage: 'ROUTE_THUMBNAIL', type: 'IMAGE', objectPath });
    expect(failed).toEqual({ ok: false, reason: 'FAILED', messageKey: 'MSG-GENERIC' });
    const rows = (await controls.auditRows()).slice(before);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.result).toBe('FAILURE');
  });

  it('STALE kèm email người sửa và giờ (BR-M03-F06), có một dòng audit FAILURE', async () => {
    const { api, controls } = subject();
    await controls.signInAs('REVIEWER');
    await controls.seedAccount({ email: 'staff7@example.test', role: 'CONTENT_STAFF', status: 'ACTIVE' });
    const row = (await api.listAccounts()).find((a) => a.email === 'staff7@example.test')!;
    const before = (await controls.auditRows()).length;
    const result = await api.setAccountStatus({
      email: row.email,
      status: 'DEACTIVATED',
      expected: { entity: row.concurrencyRevision + 1 },
    });
    expect(result).toMatchObject({ ok: false, reason: 'STALE', messageKey: 'MSG-STALE' });
    expect((await controls.auditRows()).slice(before).map((r) => r.result)).toEqual(['FAILURE']);
  });

  it('command chỉ Quản lý gọi bởi Nhân viên → FORBIDDEN (SC-M03-009)', async () => {
    const { api, controls } = subject();
    await controls.signInAs('CONTENT_STAFF');
    const result = await api.setAccountStatus({ email: 'staff@example.test', status: 'DEACTIVATED', expected: { entity: 1 } });
    expect(result).toEqual({ ok: false, reason: 'FORBIDDEN', messageKey: 'MSG-NO-PERMISSION' });
  });
};
