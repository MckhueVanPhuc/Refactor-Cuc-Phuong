// Lịch sử, khôi phục, bỏ thay đổi, nhật ký toàn hệ thống — C-06, C-08, Q-10, Q-11 (tasks T146, T148;
// BR-M03-F07, F09, F10, A03; SC-M03-021). Chạy với mọi adapter của AdminApi (T197 chạy lại với adapter Supabase).
import { expect, it } from 'vitest';
import { NAME_MAX_CHARS } from '../../config/limits';
import { contractBuilders } from './builders';
import type { ContractSuite } from './harness';

export const historyContract: ContractSuite = ({ subject, itFakeOnly }) => {
  const api = () => subject().api;
  const controls = () => subject().controls;
  const build = contractBuilders(api);

  /** Tuyến xuất bản hai lần: bản 1 quãng đường 4,5 km, bản 2 là 6 km */
  async function routePublishedTwice() {
    await controls().signInAs('CONTENT_STAFF');
    const { checkpointId } = await build.publishedCheckpoint('Hang Con Moong');
    const routeId = await build.publishedRoute('Đường lên Mả Tổ', [checkpointId]);
    await build.editRoute(routeId, (content) => ({ ...content, distanceKm: 6 }));
    await build.publish('ROUTE_INFORMATION', routeId);
    return { routeId, checkpointId };
  }

  const routeExpected = async (routeId: string) => {
    const editor = await api().getRouteEditor(routeId);
    return { entity: editor.concurrencyRevision, draft: editor.draft?.concurrencyRevision };
  };

  it('Q-10: lịch sử liệt kê các bản đã xuất bản, mới nhất trước, có người, thời gian và dấu tự xuất bản (BR-M03-F09)', async () => {
    const { routeId } = await routePublishedTwice();
    const history = await api().getItemHistory({ subjectType: 'ROUTE', subjectId: routeId });
    expect(history.publishedRevisions.map((rev) => [rev.revisionNumber, rev.status])).toEqual([
      [2, 'PHAT_HANH'],
      [1, 'LUU_TRU'],
    ]);
    expect(history.publishedRevisions[0]).toMatchObject({ publishedByEmail: 'staff@example.test', selfPublished: true });
    expect(history.publishedRevisions.every((rev) => typeof rev.publishedAt === 'string')).toBe(true);
    const actions = history.auditRows.map((row) => row.action);
    expect(actions.filter((action) => action === 'PUBLISHED')).toHaveLength(2);
    expect(history.auditRows.every((row) => row.subjectType === 'ROUTE')).toBe(true);
    const times = history.auditRows.map((row) => row.occurredAt);
    expect([...times].sort().reverse()).toEqual(times);
  });

  it('Q23 — khôi phục bản 1 tạo bản nháp dựa trên bản 1; bản đang xuất bản không đổi; lần thứ hai → MSG-DRAFT-EXISTS (BR-M03-F07)', async () => {
    const { routeId } = await routePublishedTwice();
    const result = await api().restoreRevision({ subjectType: 'ROUTE', subjectId: routeId, revisionNumber: 1 });
    expect(result).toMatchObject({ ok: true, data: { basedOnRevisionNumber: 1, revisionNumber: 3 } });
    const editor = await api().getRouteEditor(routeId);
    expect(editor.draft).toMatchObject({ revisionNumber: 3, basedOnRevisionNumber: 1, status: 'NHAP' });
    expect(editor.draft?.content.distanceKm).toBe(4.5);
    expect(editor.published?.content.distanceKm).toBe(6);
    expect((await controls().readPublication(routeId)).route?.distanceKm).toBe(6);

    const again = await api().restoreRevision({ subjectType: 'ROUTE', subjectId: routeId, revisionNumber: 1 });
    expect(again).toMatchObject({ ok: false, reason: 'BLOCKED', messageKey: 'MSG-DRAFT-EXISTS' });
  });

  it('chỉ khôi phục được bản cũ đã xuất bản; bản đang xuất bản hay số không có thì không tạo gì', async () => {
    const { routeId } = await routePublishedTwice();
    expect((await api().restoreRevision({ subjectType: 'ROUTE', subjectId: routeId, revisionNumber: 2 })).ok).toBe(false);
    expect((await api().restoreRevision({ subjectType: 'ROUTE', subjectId: routeId, revisionNumber: 9 })).ok).toBe(false);
    expect((await api().getRouteEditor(routeId)).draft).toBeUndefined();
  });

  it('bỏ thay đổi: bản nháp thành Đã bỏ, bản đang xuất bản giữ nguyên, lịch sử không liệt kê bản đã bỏ (BR-M03-F10)', async () => {
    const { routeId } = await routePublishedTwice();
    await build.editRoute(routeId, (content) => ({ ...content, distanceKm: 8 }));
    const expected = await routeExpected(routeId);
    const result = await api().discardDraft({ subjectType: 'ROUTE', subjectId: routeId, expected });
    expect(result.ok).toBe(true);
    const editor = await api().getRouteEditor(routeId);
    expect(editor.draft).toBeUndefined();
    expect(editor.published?.content.distanceKm).toBe(6);
    const history = await api().getItemHistory({ subjectType: 'ROUTE', subjectId: routeId });
    expect(history.publishedRevisions.map((rev) => rev.status)).toEqual(['PHAT_HANH', 'LUU_TRU']);
    expect(history.auditRows[0]).toMatchObject({ action: 'DRAFT_DISCARDED', result: 'SUCCESS' });

    const stale = await api().discardDraft({ subjectType: 'ROUTE', subjectId: routeId, expected });
    expect(stale.ok).toBe(false);
  });

  it('bỏ thay đổi bằng concurrencyRevision cũ → STALE, bản nháp còn nguyên (BR-M03-F06)', async () => {
    const { routeId } = await routePublishedTwice();
    await build.editRoute(routeId, (content) => ({ ...content, distanceKm: 8 }));
    const old = await routeExpected(routeId);
    await build.editRoute(routeId, (content) => ({ ...content, distanceKm: 9 }));
    expect(await api().discardDraft({ subjectType: 'ROUTE', subjectId: routeId, expected: old })).toMatchObject({ ok: false, reason: 'STALE' });
    expect((await api().getRouteEditor(routeId)).draft?.content.distanceKm).toBe(9);
  });

  it('khôi phục điểm dừng: bản nháp mang tên của bản 1', async () => {
    await controls().signInAs('CONTENT_STAFF');
    const { checkpointId } = await build.publishedCheckpoint('Hang Con Moong');
    await build.renameCheckpoint(checkpointId, 'Hang Con Moong mới');
    await build.publish('CHECKPOINT_REVISION', checkpointId);
    const result = await api().restoreRevision({ subjectType: 'CHECKPOINT', subjectId: checkpointId, revisionNumber: 1 });
    expect(result.ok).toBe(true);
    const editor = await api().getCheckpointEditor(checkpointId);
    expect(editor.draft?.content.checkpointName?.vi).toBe('Hang Con Moong');
    expect(editor.published?.content.checkpointName?.vi).toBe('Hang Con Moong mới');
  });

  itFakeOnly('bản cũ vi phạm giới hạn hiện hành → MSG-RESTORE-BLOCKED nêu chỗ cần sửa, không tạo bản nháp (BR-M03-F07; SC-M03-021)', async () => {
    const { routeId } = await routePublishedTwice();
    controls().tamperRevisionContent!('ROUTE', routeId, 1, { name: { vi: 'Đ'.repeat(NAME_MAX_CHARS + 1), en: 'Ma To trail' } });
    const result = await api().restoreRevision({ subjectType: 'ROUTE', subjectId: routeId, revisionNumber: 1 });
    expect(result).toMatchObject({ ok: false, reason: 'BLOCKED', messageKey: 'MSG-RESTORE-BLOCKED' });
    expect(result.ok === false && result.reason === 'BLOCKED' && String(result.values['danh sách chỗ cần sửa'])).toMatch(/Tên tuyến \(tiếng Việt\)/);
    expect((await api().getRouteEditor(routeId)).draft).toBeUndefined();
  });

  it('Q24 — nhật ký toàn hệ thống: Nhân viên nội dung bị từ chối; Quản lý xem được, mới nhất trước (BR-M03-A03, F09)', async () => {
    await routePublishedTwice();
    await expect(api().listAuditLog({ page: 0 })).rejects.toMatchObject({ messageKey: 'MSG-NO-PERMISSION' });
    await controls().signInAs('REVIEWER');
    const page = await api().listAuditLog({ page: 0 });
    expect(page.rows.length).toBeGreaterThan(0);
    const times = page.rows.map((row) => row.occurredAt);
    expect([...times].sort().reverse()).toEqual(times);
  });

  it('nhật ký lọc theo người, loại mục và khoảng thời gian; phân trang (BR-M03-F09)', async () => {
    const { routeId } = await routePublishedTwice();
    await controls().signInAs('REVIEWER');
    const all = await api().listAuditLog({ page: 0 });
    const byStaff = await api().listAuditLog({ page: 0, actorEmail: 'staff@example.test' });
    expect(byStaff.rows.length).toBeGreaterThan(0);
    expect(byStaff.rows.every((row) => row.actorEmail === 'staff@example.test')).toBe(true);
    const routes = await api().listAuditLog({ page: 0, subjectType: 'ROUTE' });
    expect(routes.rows.every((row) => row.subjectType === 'ROUTE')).toBe(true);
    expect(routes.rows.length).toBeLessThan(all.rows.length);
    const future = await api().listAuditLog({ page: 0, from: '2999-01-01T00:00:00.000Z' });
    expect(future.rows).toEqual([]);

    // Thêm đủ dòng để có trang thứ hai
    const qr = (await api().getCheckpointEditor((await api().getRouteEditor(routeId)).checkpoints[0]!.checkpointId)).visitPoints[0]!;
    for (let i = 0; i < 60; i += 1) await api().recordReprint({ qrIdentifier: qr.qrIdentifier });
    const first = await api().listAuditLog({ page: 0 });
    expect(first.hasMore).toBe(true);
    const second = await api().listAuditLog({ page: 1 });
    expect(second.page).toBe(1);
    expect(second.rows.length).toBeGreaterThan(0);
    expect(new Set([...first.rows, ...second.rows].map((row) => row.auditId)).size).toBe(first.rows.length + second.rows.length);
  });
};
