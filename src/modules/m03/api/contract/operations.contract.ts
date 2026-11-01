// Đóng tạm, mở lại, lưu trữ — C-09…C-15 và Q-09 (tasks T133; BR-M03-H01–H09, D10, T05, T07, G10, X02, X06;
// SC-M03-006, 019, 020, 031). Chạy với mọi adapter của AdminApi (T197 chạy lại với adapter Supabase).
import { expect, it } from 'vitest';
import { journeySnapshotSchema } from '../../../../shared/contracts/journeySnapshot';
import { QR_INTRO_MIN_CHARS } from '../../config/limits';
import type { PublicationUnitType } from '../../contracts/publicationReview';
import type { ContractSuite } from './harness';
import { syntheticFile } from './harness';

const INTRO = 'Giới thiệu đủ dài cho du khách đọc tại chỗ.'.padEnd(QR_INTRO_MIN_CHARS, '.');
const pair = (vi: string) => ({ vi, en: `${vi} (en)` });
const REASON = 'Sạt lở sau mưa lớn';
const SAFETY_NOTE = 'Đã kiểm tra lại đường đi';

export const operationsContract: ContractSuite = ({ subject, itFakeOnly }) => {
  const api = () => subject().api;
  const controls = () => subject().controls;

  async function image(ownerType: 'ROUTE' | 'CHECKPOINT', ownerId: string, usage: 'QR_MEDIA' | 'ROUTE_THUMBNAIL') {
    const { objectPath } = await api().uploadMedia({ ownerType, ownerId, file: syntheticFile('anh.jpg', 'image/jpeg', 4096) });
    const result = await api().registerMedia({ ownerType, ownerId, usage, type: 'IMAGE', objectPath });
    if (!result.ok) throw new Error('không đăng ký được ảnh');
    return { mediaId: result.data.mediaId, objectPath };
  }

  async function publish(unitType: PublicationUnitType, subjectId: string) {
    const review = await api().openPublicationReview({ unitType, subjectId });
    const result = await api().publishUnit({ unitType, subjectId, reviewedConcurrencyRevision: review.reviewedConcurrencyRevision });
    if (!result.ok) throw new Error(`không xuất bản được: ${result.reason}`);
  }

  /** Điểm dừng "Cần tải trước" đã xuất bản với một điểm tham quan sẵn sàng */
  async function publishedCheckpoint(name: string) {
    const saved = await api().saveCheckpointDraft({ content: { checkpointName: pair(name), connectivityMode: 'OFFLINE_REQUIRED' } });
    if (!saved.ok) throw new Error('không tạo được điểm dừng');
    const { checkpointId } = saved.data;
    const { mediaId, objectPath } = await image('CHECKPOINT', checkpointId, 'QR_MEDIA');
    const visitPoint = await api().saveVisitPointDraft({
      checkpointId,
      content: { objectName: pair(`Vật ở ${name}`), introductionText: { vi: INTRO, en: INTRO }, mediaItems: [{ mediaId }] },
      mediaSettings: [{ mediaId, usageRightsConfirmed: true }],
    });
    if (!visitPoint.ok) throw new Error('không tạo được điểm tham quan');
    await publish('CHECKPOINT_FIRST_PUBLICATION', checkpointId);
    return { checkpointId, mediaId, objectPath };
  }

  async function publishedRoute(name: string, checkpointIds: string[]) {
    const created = await api().saveRouteDraft({ content: { noSafetyWarningConfirmed: false, offlineRouteMapRequired: false } });
    if (!created.ok) throw new Error('không tạo được tuyến');
    const { routeId } = created.data;
    const { mediaId } = await image('ROUTE', routeId, 'ROUTE_THUMBNAIL');
    const editor = await api().getRouteEditor(routeId);
    const saved = await api().saveRouteDraft({
      routeId,
      expected: { entity: editor.concurrencyRevision, draft: editor.draft?.concurrencyRevision },
      content: {
        name: pair(name),
        shortDescription: pair('Rừng nguyên sinh'),
        description: pair('Mô tả đầy đủ'),
        startingPoint: pair('Trung tâm du khách'),
        safetyWarning: pair('Dốc trơn khi mưa'),
        noSafetyWarningConfirmed: false,
        distanceKm: 4.5,
        durationMin: 150,
        difficulty: 'TRUNG_BINH',
        groupTags: ['GROUP_CA_NHAN_NGUOI_LON'],
        experienceTags: ['INTEREST_KHAM_PHA'],
        thumbnailMediaId: mediaId,
        offlineRouteMapRequired: false,
        checkpointList: checkpointIds.map((checkpointId) => ({ checkpointId })),
      },
      mediaSettings: [{ mediaId, usageRightsConfirmed: true }],
    });
    if (!saved.ok) throw new Error(`không lưu được tuyến: ${saved.reason}`);
    await publish('ROUTE_FIRST_PUBLICATION', routeId);
    return routeId;
  }

  /**
   * Q19: điểm dừng X là điểm dừng hoạt động duy nhất của tuyến A; tuyến B liệt kê X và Y.
   * Dựng bằng Nhân viên nội dung.
   */
  async function sharedScenario() {
    await controls().signInAs('CONTENT_STAFF');
    const x = await publishedCheckpoint('Hang Con Moong');
    const y = await publishedCheckpoint('Động Người Xưa');
    const routeA = await publishedRoute('Tuyến A', [x.checkpointId]);
    const routeB = await publishedRoute('Tuyến B', [x.checkpointId, y.checkpointId]);
    return { x, y, routeA, routeB };
  }

  const routeExpected = async (routeId: string) => ({ entity: (await api().getRouteEditor(routeId)).concurrencyRevision });
  const checkpointExpected = async (checkpointId: string) => ({ entity: (await api().getCheckpointEditor(checkpointId)).concurrencyRevision });
  const snapshotOf = async (routeId: string) => journeySnapshotSchema.parse((await controls().readPublication(routeId)).snapshot);
  const routeStatus = async (routeId: string) => (await api().getRouteEditor(routeId)).status;
  const checkpointStatus = async (checkpointId: string) => (await api().getCheckpointEditor(checkpointId)).status;

  async function closeCheckpoint(checkpointId: string) {
    return api().closeCheckpoint({ checkpointId, reason: REASON, expected: await checkpointExpected(checkpointId) });
  }

  // ---- Đóng tạm ----

  it('Q-09: đóng điểm dừng nêu mọi tuyến liệt kê nó và tuyến sẽ tự đóng (BR-M03-H01, X03)', async () => {
    const { x, routeA, routeB } = await sharedScenario();
    const impact = await api().getOperationImpact({ operation: 'CLOSE_CHECKPOINT', subjectId: x.checkpointId });
    expect(impact.affectedRoutes.map((route) => route.routeId).sort()).toEqual([routeA, routeB].sort());
    expect(impact.autoClosingRoutes).toEqual([{ routeId: routeA, routeName: 'Tuyến A' }]);
  });

  it('Q19 — đóng điểm dừng hoạt động cuối của A, B còn điểm dừng khác: A tự đóng có audit riêng, B có version mới (BR-M03-H02, T05, X02, X06; SC-M03-006)', async () => {
    const { x, y, routeA, routeB } = await sharedScenario();
    const versionB = (await snapshotOf(routeB)).contentVersion;
    const result = await closeCheckpoint(x.checkpointId);
    expect(result).toMatchObject({ ok: true, data: { autoClosedRoutes: [{ routeId: routeA, routeName: 'Tuyến A' }] } });

    expect(await checkpointStatus(x.checkpointId)).toBe('TAM_DONG');
    expect(await api().getRouteEditor(routeA)).toMatchObject({ status: 'TAM_DONG', closureSource: 'AUTO_NO_ACTIVE_CHECKPOINT' });
    expect(await routeStatus(routeB)).toBe('HOAT_DONG');
    const snapshotB = await snapshotOf(routeB);
    expect(snapshotB.contentVersion).toBe(versionB + 1);
    expect(snapshotB.checkpoints.map((checkpoint) => checkpoint.checkpointId)).toEqual([y.checkpointId]);
    expect((await controls().readPublication(routeA)).route?.status).toBe('TAM_DONG');

    const rows = await controls().auditRows();
    const closed = rows.filter((row) => row.action === 'CHECKPOINT_CLOSED');
    expect(closed).toHaveLength(1);
    expect(closed[0]).toMatchObject({ result: 'SUCCESS', reason: REASON });
    expect(closed[0]!.changeLines.join(' ')).toMatch(/Tuyến A/);
    expect(closed[0]!.changeLines.join(' ')).toMatch(/Tuyến B/);
    expect(rows.filter((row) => row.action === 'ROUTE_AUTO_CLOSED')).toEqual([
      expect.objectContaining({ result: 'SUCCESS', subjectType: 'ROUTE', subjectName: 'Tuyến A' }),
    ]);
  });

  itFakeOnly('đóng điểm dừng không bao giờ bị trần dung lượng chặn (BR-M03-G10; SC-M03-020)', async () => {
    const { x, y, routeB } = await sharedScenario();
    controls().inflateMedia!(y.mediaId, 60 * 1_048_576);
    const result = await closeCheckpoint(x.checkpointId);
    expect(result.ok).toBe(true);
    expect((await snapshotOf(routeB)).checkpoints.map((checkpoint) => checkpoint.checkpointId)).toEqual([y.checkpointId]);
  });

  it('đóng tuyến: Tạm đóng, đóng thủ công, không tạo version mới; lý do bắt buộc (BR-M03-H01, H03)', async () => {
    const { x } = await sharedScenario();
    const routeId = await publishedRoute('Tuyến C', [x.checkpointId]);
    const version = (await snapshotOf(routeId)).contentVersion;
    const missing = await api().closeRoute({ routeId, reason: '  ', expected: await routeExpected(routeId) });
    expect(missing.ok).toBe(false);
    expect(await routeStatus(routeId)).toBe('HOAT_DONG');

    const result = await api().closeRoute({ routeId, reason: REASON, expected: await routeExpected(routeId) });
    expect(result.ok).toBe(true);
    expect(await api().getRouteEditor(routeId)).toMatchObject({ status: 'TAM_DONG', closureSource: 'MANUAL', closureReason: REASON });
    expect((await snapshotOf(routeId)).contentVersion).toBe(version);
    expect((await controls().readPublication(routeId)).route?.status).toBe('TAM_DONG');
  });

  it('chỉ đóng được mục đang hoạt động; đóng bằng concurrencyRevision cũ → STALE (BR-M03-H01, F06)', async () => {
    const { routeA } = await sharedScenario();
    const old = await routeExpected(routeA);
    expect((await api().closeRoute({ routeId: routeA, reason: REASON, expected: old })).ok).toBe(true);
    const again = await api().closeRoute({ routeId: routeA, reason: REASON, expected: await routeExpected(routeA) });
    expect(again.ok).toBe(false);
    const stale = await api().closeRoute({ routeId: routeA, reason: REASON, expected: old });
    expect(stale).toMatchObject({ ok: false, reason: 'STALE' });
  });

  itFakeOnly('tập kết nối đang bận → BUSY, không đổi gì (BR-M03-F05, L07)', async () => {
    const { x, routeB } = await sharedScenario();
    controls().holdLock!(`route:${routeB}`);
    const result = await closeCheckpoint(x.checkpointId);
    expect(result).toMatchObject({ ok: false, reason: 'BUSY', busy: { itemName: 'Tuyến B' } });
    expect(await checkpointStatus(x.checkpointId)).toBe('HOAT_DONG');
  });

  itFakeOnly('Q20 — đóng điểm dừng lỗi: MSG-CLOSE-FAILED, không đổi gì; "Đóng tạm các tuyến liên quan" đóng các tuyến, điểm dừng vẫn hoạt động (BR-M03-H04, X06)', async () => {
    const { x, routeA, routeB } = await sharedScenario();
    const versionA = (await snapshotOf(routeA)).contentVersion;
    controls().failNext!('CHECKPOINT_CLOSED', 'MSG-CLOSE-FAILED');
    expect(await closeCheckpoint(x.checkpointId)).toEqual({ ok: false, reason: 'FAILED', messageKey: 'MSG-CLOSE-FAILED' });
    expect(await checkpointStatus(x.checkpointId)).toBe('HOAT_DONG');
    expect(await routeStatus(routeA)).toBe('HOAT_DONG');
    expect((await snapshotOf(routeA)).contentVersion).toBe(versionA);

    const related = await api().closeRoutesListingCheckpoint({ checkpointId: x.checkpointId, reason: REASON });
    expect(related.ok).toBe(true);
    expect(related.ok && related.data.closedRoutes.map((route) => route.routeId).sort()).toEqual([routeA, routeB].sort());
    expect(await api().getRouteEditor(routeA)).toMatchObject({ status: 'TAM_DONG', closureSource: 'MANUAL' });
    expect(await routeStatus(routeB)).toBe('TAM_DONG');
    expect(await checkpointStatus(x.checkpointId)).toBe('HOAT_DONG');
    const rows = (await controls().auditRows()).filter((row) => row.action === 'RELATED_ROUTES_CLOSED');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ result: 'SUCCESS', subjectType: 'CHECKPOINT' });
    expect(rows[0]!.changeLines.join(' ')).toMatch(/Tuyến A.*Tuyến B|Tuyến B.*Tuyến A/);
  });

  // ---- Mở lại ----

  it('chỉ Quản lý mở lại và lưu trữ; Nhân viên nội dung nhận FORBIDDEN (BR-M03-A03; SC-M03-009)', async () => {
    const { x, routeA } = await sharedScenario();
    expect((await closeCheckpoint(x.checkpointId)).ok).toBe(true);
    const forbidden = { ok: false, reason: 'FORBIDDEN', messageKey: 'MSG-NO-PERMISSION' };
    expect(await api().reopenRoute({ routeId: routeA, safetyNote: SAFETY_NOTE, expected: await routeExpected(routeA) })).toEqual(forbidden);
    expect(
      await api().reopenCheckpoint({ checkpointId: x.checkpointId, safetyNote: SAFETY_NOTE, expected: await checkpointExpected(x.checkpointId) }),
    ).toEqual(forbidden);
    expect(await api().archiveRoute({ routeId: routeA, reason: REASON, expected: await routeExpected(routeA) })).toEqual(forbidden);
    expect(
      await api().archiveCheckpoint({ checkpointId: x.checkpointId, reason: REASON, expected: await checkpointExpected(x.checkpointId) }),
    ).toEqual(forbidden);
    await expect(api().getOperationImpact({ operation: 'REOPEN_CHECKPOINT', subjectId: x.checkpointId })).rejects.toMatchObject({
      messageKey: 'MSG-NO-PERMISSION',
    });
  });

  it('Q21 — mở lại điểm dừng: các tuyến có version mới, tuyến đã tự đóng vẫn đóng; ghi chú an toàn bắt buộc (BR-M03-H06, H07, X02; SC-M03-019)', async () => {
    const { x, routeA, routeB } = await sharedScenario();
    expect((await closeCheckpoint(x.checkpointId)).ok).toBe(true);
    const versionB = (await snapshotOf(routeB)).contentVersion;
    await controls().signInAs('REVIEWER');
    const noNote = await api().reopenCheckpoint({ checkpointId: x.checkpointId, safetyNote: '', expected: await checkpointExpected(x.checkpointId) });
    expect(noNote.ok).toBe(false);

    const result = await api().reopenCheckpoint({
      checkpointId: x.checkpointId,
      safetyNote: SAFETY_NOTE,
      expected: await checkpointExpected(x.checkpointId),
    });
    expect(result.ok).toBe(true);
    expect(await checkpointStatus(x.checkpointId)).toBe('HOAT_DONG');
    expect(await routeStatus(routeA)).toBe('TAM_DONG');
    const snapshotB = await snapshotOf(routeB);
    expect(snapshotB.contentVersion).toBe(versionB + 1);
    expect(snapshotB.checkpoints.map((checkpoint) => checkpoint.checkpointId)).toContain(x.checkpointId);
    expect((await snapshotOf(routeA)).checkpoints.map((checkpoint) => checkpoint.checkpointId)).toEqual([x.checkpointId]);
  });

  it('mở lại tuyến khi danh sách không còn điểm dừng hoạt động → BLOCKED MSG-NO-ACTIVE-CHECKPOINT; còn thì mở được (BR-M03-H07)', async () => {
    const { x, routeA } = await sharedScenario();
    expect((await closeCheckpoint(x.checkpointId)).ok).toBe(true);
    await controls().signInAs('REVIEWER');
    const impact = await api().getOperationImpact({ operation: 'REOPEN_ROUTE', subjectId: routeA });
    expect(impact.reopenBlockers.length).toBeGreaterThan(0);
    const blocked = await api().reopenRoute({ routeId: routeA, safetyNote: SAFETY_NOTE, expected: await routeExpected(routeA) });
    expect(blocked).toMatchObject({ ok: false, reason: 'BLOCKED', messageKey: 'MSG-NO-ACTIVE-CHECKPOINT' });

    const reopened = await api().reopenCheckpoint({ checkpointId: x.checkpointId, safetyNote: SAFETY_NOTE, expected: await checkpointExpected(x.checkpointId) });
    expect(reopened.ok).toBe(true);
    expect((await api().getOperationImpact({ operation: 'REOPEN_ROUTE', subjectId: routeA })).reopenBlockers).toEqual([]);
    const result = await api().reopenRoute({ routeId: routeA, safetyNote: SAFETY_NOTE, expected: await routeExpected(routeA) });
    expect(result.ok).toBe(true);
    const editor = await api().getRouteEditor(routeA);
    expect(editor.status).toBe('HOAT_DONG');
    expect(editor.closureSource).toBeUndefined();
    expect((await controls().readPublication(routeA)).route?.status).toBe('HOAT_DONG');
  });

  itFakeOnly('mở lại điểm dừng khi ảnh cần tải trước không đọc được → BLOCKED MSG-REOPEN-BLOCKED, Q-09 liệt kê chỗ cần sửa (BR-M03-H06)', async () => {
    const { x } = await sharedScenario();
    expect((await closeCheckpoint(x.checkpointId)).ok).toBe(true);
    controls().removeStorageObject!(x.objectPath);
    await controls().signInAs('REVIEWER');
    const impact = await api().getOperationImpact({ operation: 'REOPEN_CHECKPOINT', subjectId: x.checkpointId });
    expect(impact.reopenBlockers.length).toBeGreaterThan(0);
    const result = await api().reopenCheckpoint({ checkpointId: x.checkpointId, safetyNote: SAFETY_NOTE, expected: await checkpointExpected(x.checkpointId) });
    expect(result).toMatchObject({ ok: false, reason: 'BLOCKED', messageKey: 'MSG-REOPEN-BLOCKED' });
    expect(await checkpointStatus(x.checkpointId)).toBe('TAM_DONG');
  });

  itFakeOnly('mở lại điểm dừng làm gói tải trước của một tuyến vượt trần → BLOCKED MSG-OFFLINE-TOO-BIG nêu tuyến (BR-M03-G10, H06)', async () => {
    const { x, routeB } = await sharedScenario();
    expect((await closeCheckpoint(x.checkpointId)).ok).toBe(true);
    const versionB = (await snapshotOf(routeB)).contentVersion;
    controls().inflateMedia!(x.mediaId, 60 * 1_048_576);
    await controls().signInAs('REVIEWER');
    const result = await api().reopenCheckpoint({ checkpointId: x.checkpointId, safetyNote: SAFETY_NOTE, expected: await checkpointExpected(x.checkpointId) });
    expect(result).toMatchObject({ ok: false, reason: 'BLOCKED', messageKey: 'MSG-OFFLINE-TOO-BIG' });
    expect(result.ok === false && result.reason === 'BLOCKED' && String(result.values['tên tuyến'])).toMatch(/Tuyến [AB]/);
    expect(await checkpointStatus(x.checkpointId)).toBe('TAM_DONG');
    expect((await snapshotOf(routeB)).contentVersion).toBe(versionB);
  });

  // ---- Lưu trữ ----

  it('lưu trữ tuyến chỉ khi Tạm đóng; không đổi điểm dừng nó liệt kê (BR-M03-H09, T07)', async () => {
    const { x, routeB } = await sharedScenario();
    await controls().signInAs('REVIEWER');
    const active = await api().archiveRoute({ routeId: routeB, reason: REASON, expected: await routeExpected(routeB) });
    expect(active.ok).toBe(false);
    expect((await api().closeRoute({ routeId: routeB, reason: REASON, expected: await routeExpected(routeB) })).ok).toBe(true);
    const result = await api().archiveRoute({ routeId: routeB, reason: REASON, expected: await routeExpected(routeB) });
    expect(result.ok).toBe(true);
    expect(await routeStatus(routeB)).toBe('LUU_TRU');
    expect(await checkpointStatus(x.checkpointId)).toBe('HOAT_DONG');
  });

  it('lưu trữ điểm dừng còn được tuyến chưa lưu trữ liệt kê → MSG-CHECKPOINT-IN-USE nêu tên tuyến (BR-M03-D10; SC-M03-031)', async () => {
    const { x } = await sharedScenario();
    expect((await closeCheckpoint(x.checkpointId)).ok).toBe(true);
    await controls().signInAs('REVIEWER');
    const result = await api().archiveCheckpoint({ checkpointId: x.checkpointId, reason: REASON, expected: await checkpointExpected(x.checkpointId) });
    expect(result).toMatchObject({ ok: false, reason: 'BLOCKED', messageKey: 'MSG-CHECKPOINT-IN-USE' });
    expect(result.ok === false && result.reason === 'BLOCKED' && String(result.values['danh sách'])).toMatch(/Tuyến A.*Tuyến B|Tuyến B.*Tuyến A/);
    expect(await checkpointStatus(x.checkpointId)).toBe('TAM_DONG');
  });

  it('lưu trữ điểm dừng Tạm đóng không còn tuyến nào dùng: Đã lưu trữ, điểm tham quan Đã thu hồi; điểm dừng đang hoạt động thì không (BR-M03-D10)', async () => {
    await controls().signInAs('CONTENT_STAFF');
    const lone = await publishedCheckpoint('Cây Chò Ngàn Năm');
    await controls().signInAs('REVIEWER');
    const active = await api().archiveCheckpoint({ checkpointId: lone.checkpointId, reason: REASON, expected: await checkpointExpected(lone.checkpointId) });
    expect(active.ok).toBe(false);
    expect((await closeCheckpoint(lone.checkpointId)).ok).toBe(true);
    const result = await api().archiveCheckpoint({ checkpointId: lone.checkpointId, reason: REASON, expected: await checkpointExpected(lone.checkpointId) });
    expect(result.ok).toBe(true);
    const editor = await api().getCheckpointEditor(lone.checkpointId);
    expect(editor.status).toBe('LUU_TRU');
    expect(editor.visitPoints.map((visitPoint) => visitPoint.status)).toEqual(['THU_HOI']);
  });
};
