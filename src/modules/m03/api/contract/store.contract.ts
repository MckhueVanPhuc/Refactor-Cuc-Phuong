// Hành vi chung của mọi command (admin-command §1, §2, §7): FORBIDDEN, STALE, đúng một dòng audit.
// Giai đoạn nền chỉ có C-04; story sau bổ sung ca cho command của mình vào đây (STALE: US1 T061 với C-18/C-19).
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

  it.todo('STALE kèm email người sửa và giờ (BR-M03-F06) — thêm ca khi có C-18/C-19 ở US1 (T061)');
  it.todo('Command chỉ Reviewer gọi bởi Nhân viên → FORBIDDEN (SC-M03-009) — thêm ca khi có C-18/C-19 ở US1 (T061)');
};
