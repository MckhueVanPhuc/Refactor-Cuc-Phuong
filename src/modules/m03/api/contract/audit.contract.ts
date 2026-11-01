// Nhật ký thao tác (tasks T146; BR-M03-F08, A05, X06; SC-M03-014): mọi command ghi đúng một dòng audit kể cả khi
// thất bại; xuất bản bản nháp của chính mình có cờ tự xuất bản; không có mật khẩu/bí mật; mọi thao tác trên
// điểm dừng nêu các tuyến bị ảnh hưởng. Chạy với mọi adapter của AdminApi (T197).
import { expect, it } from 'vitest';
import type { AdminApi } from '../AdminApi';
import { contractBuilders, INTRO, pair } from './builders';
import type { ContractSuite } from './harness';

const UNKNOWN = 'KhongCoMucNay0000000';
const REASON = 'Sạt lở sau mưa lớn';
const SYNTHETIC_PASSWORD = 'Matkhau-thu-123';

/** Mỗi command C-01…C-19 và Edge `admin-accounts`, gọi với dữ liệu không tồn tại nên thất bại */
const FAILING_COMMANDS: [string, (api: AdminApi) => Promise<unknown>][] = [
  ['C-01', (api) => api.saveRouteDraft({ routeId: UNKNOWN, expected: { entity: 1 }, content: { noSafetyWarningConfirmed: false, offlineRouteMapRequired: false } })],
  ['C-02', (api) => api.saveCheckpointDraft({ checkpointId: UNKNOWN, expected: { entity: 1 }, content: {} })],
  ['C-03', (api) => api.saveVisitPointDraft({ checkpointId: UNKNOWN, content: {}, mediaSettings: [] })],
  ['C-04', (api) => api.registerMedia({ ownerType: 'ROUTE', ownerId: UNKNOWN, usage: 'ROUTE_THUMBNAIL', type: 'IMAGE', objectPath: 'uploads/khong-co' })],
  ['C-05', (api) => api.publishUnit({ unitType: 'ROUTE_INFORMATION', subjectId: UNKNOWN, reviewedConcurrencyRevision: 1 })],
  ['C-06', (api) => api.discardDraft({ subjectType: 'ROUTE', subjectId: UNKNOWN, expected: { entity: 1 } })],
  ['C-07', (api) => api.discardUnpublished({ subjectType: 'CHECKPOINT', subjectId: UNKNOWN, reason: REASON, expected: { entity: 1 } })],
  ['C-08', (api) => api.restoreRevision({ subjectType: 'ROUTE', subjectId: UNKNOWN, revisionNumber: 1 })],
  ['C-09', (api) => api.closeRoute({ routeId: UNKNOWN, reason: REASON, expected: { entity: 1 } })],
  ['C-10', (api) => api.closeCheckpoint({ checkpointId: UNKNOWN, reason: REASON, expected: { entity: 1 } })],
  ['C-11', (api) => api.closeRoutesListingCheckpoint({ checkpointId: UNKNOWN, reason: REASON })],
  ['C-12', (api) => api.reopenRoute({ routeId: UNKNOWN, safetyNote: REASON, expected: { entity: 1 } })],
  ['C-13', (api) => api.reopenCheckpoint({ checkpointId: UNKNOWN, safetyNote: REASON, expected: { entity: 1 } })],
  ['C-14', (api) => api.archiveRoute({ routeId: UNKNOWN, reason: REASON, expected: { entity: 1 } })],
  ['C-15', (api) => api.archiveCheckpoint({ checkpointId: UNKNOWN, reason: REASON, expected: { entity: 1 } })],
  ['C-16', (api) => api.revokeVisitPoint({ qrIdentifier: UNKNOWN, reason: REASON, expected: { entity: 1 } })],
  ['C-17', (api) => api.recordReprint({ qrIdentifier: UNKNOWN })],
  ['C-18', (api) => api.changeAccountRole({ email: 'khong-co@example.test', role: 'REVIEWER', expected: { entity: 1 } })],
  ['C-19', (api) => api.setAccountStatus({ email: 'khong-co@example.test', status: 'DEACTIVATED', expected: { entity: 1 } })],
  ['mời', (api) => api.inviteAccount({ email: 'khong-hop-le', role: 'CONTENT_STAFF' })],
  ['gửi lại lời mời', (api) => api.resendInvitation({ email: 'khong-co@example.test' })],
  ['nối danh tính', (api) => api.linkInvitation()],
];

export const auditContract: ContractSuite = ({ subject }) => {
  const api = () => subject().api;
  const controls = () => subject().controls;
  const build = contractBuilders(api);

  it.each(FAILING_COMMANDS)('%s thất bại vẫn ghi đúng một dòng audit, kết quả Không thành công (BR-M03-F08)', async (_id, call) => {
    await controls().signInAs('REVIEWER');
    const before = (await controls().auditRows()).length;
    const outcome = await call(api()).then(
      (result) => result,
      () => ({ ok: false }),
    );
    expect(outcome).toMatchObject({ ok: false });
    const rows = await controls().auditRows();
    expect(rows.length - before).toBe(1);
    expect(rows.at(-1)?.result).toBe('FAILURE');
  });

  it('thành công cũng đúng một dòng; xuất bản bản nháp của chính mình có cờ tự xuất bản, người khác xuất bản thì không (BR-M03-F08, A05)', async () => {
    await controls().signInAs('CONTENT_STAFF');
    const { checkpointId } = await build.publishedCheckpoint('Hang Con Moong');
    const routeId = await build.publishedRoute('Đường lên Mả Tổ', [checkpointId]);
    const own = (await controls().auditRows()).filter((row) => row.action === 'PUBLISHED').at(-1);
    expect(own).toMatchObject({ result: 'SUCCESS', selfPublished: true, subjectName: 'Đường lên Mả Tổ' });

    await build.editRoute(routeId, (content) => ({ ...content, distanceKm: 6 }));
    await controls().signInAs('REVIEWER');
    const before = (await controls().auditRows()).length;
    await build.publish('ROUTE_INFORMATION', routeId);
    const rows = await controls().auditRows();
    expect(rows.length - before).toBe(1);
    expect(rows.at(-1)).toMatchObject({ action: 'PUBLISHED', result: 'SUCCESS', actorEmail: 'reviewer@example.test' });
    expect(rows.at(-1)?.selfPublished).not.toBe(true);
  });

  it('dòng xuất bản ghi nội dung trước và sau dạng "{nhãn}: {trước} → {sau}", không JSON (BR-M03-F08, L10)', async () => {
    await controls().signInAs('CONTENT_STAFF');
    const { checkpointId } = await build.publishedCheckpoint('Hang Con Moong');
    const routeId = await build.publishedRoute('Đường lên Mả Tổ', [checkpointId]);
    await build.editRoute(routeId, (content) => ({ ...content, distanceKm: 6 }));
    await build.publish('ROUTE_INFORMATION', routeId);
    const row = (await controls().auditRows()).filter((item) => item.action === 'PUBLISHED').at(-1)!;
    expect(row.changeLines).toContain('Quãng đường (km): 4,5 → 6');
    expect(row.changeLines.join('\n')).not.toMatch(/[{}[\]]/);
  });

  it('nhật ký không chứa mật khẩu hay token (BR-M03-F08; SC-M03-014)', async () => {
    await controls().signInAs('REVIEWER');
    await api().inviteAccount({ email: 'moi@example.test', role: 'CONTENT_STAFF' });
    await api().resendInvitation({ email: 'moi@example.test' });
    const text = JSON.stringify(await controls().auditRows());
    expect(text).not.toContain(SYNTHETIC_PASSWORD);
    expect(text).not.toMatch(/token|password|mật khẩu/i);
  });

  it('mọi thao tác trên điểm dừng nêu tên các tuyến bị ảnh hưởng: xuất bản, thu hồi QR, đóng, mở lại (BR-M03-X06)', async () => {
    await controls().signInAs('CONTENT_STAFF');
    const { checkpointId } = await build.publishedCheckpoint('Hang Con Moong');
    await build.publishedRoute('Tuyến A', [checkpointId]);
    await build.publishedRoute('Tuyến B', [checkpointId]);
    const namesBoth = (lines: string[]) => /Tuyến A/.test(lines.join(' ')) && /Tuyến B/.test(lines.join(' '));
    const last = async (action: string) => (await controls().auditRows()).filter((row) => row.action === action).at(-1)!;

    await build.renameCheckpoint(checkpointId, 'Hang Con Moong mới');
    await build.publish('CHECKPOINT_REVISION', checkpointId);
    expect(namesBoth((await last('PUBLISHED')).changeLines)).toBe(true);

    // Điểm tham quan thứ hai (xuất bản riêng) để thu hồi được điểm thứ nhất (BR-M03-E11)
    const first = (await api().getCheckpointEditor(checkpointId)).visitPoints[0]!;
    const mediaId = await build.image('CHECKPOINT', checkpointId, 'QR_MEDIA');
    const second = await api().saveVisitPointDraft({
      checkpointId,
      content: { objectName: pair('Vật hai'), introductionText: { vi: INTRO, en: INTRO }, mediaItems: [{ mediaId }] },
      mediaSettings: [{ mediaId, usageRightsConfirmed: true }],
    });
    if (!second.ok) throw new Error('không tạo được điểm tham quan thứ hai');
    await build.publish('QR_OBJECT', second.data.qrIdentifier);
    expect(namesBoth((await last('PUBLISHED')).changeLines)).toBe(true);
    const qr = first;
    const revoked = await api().revokeVisitPoint({
      qrIdentifier: qr.qrIdentifier,
      reason: REASON,
      expected: { entity: (await api().getVisitPointEditor(qr.qrIdentifier)).concurrencyRevision },
    });
    expect(revoked.ok).toBe(true);
    expect(namesBoth((await last('QR_REVOKED')).changeLines)).toBe(true);

    const closed = await api().closeCheckpoint({ checkpointId, reason: REASON, expected: { entity: (await api().getCheckpointEditor(checkpointId)).concurrencyRevision } });
    expect(closed.ok).toBe(true);
    expect(namesBoth((await last('CHECKPOINT_CLOSED')).changeLines)).toBe(true);
    await controls().signInAs('REVIEWER');
    const reopened = await api().reopenCheckpoint({
      checkpointId,
      safetyNote: 'Đã kiểm tra lại',
      expected: { entity: (await api().getCheckpointEditor(checkpointId)).concurrencyRevision },
    });
    expect(reopened.ok).toBe(true);
    expect(namesBoth((await last('CHECKPOINT_REOPENED')).changeLines)).toBe(true);
  });
};
