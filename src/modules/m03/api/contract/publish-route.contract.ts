// Tuyến — C-01, C-07 (tuyến), Q-02…Q-04 và C-05 `ROUTE_FIRST_PUBLICATION` (tasks T100, T102, T103;
// BR-M03-C01, C04, C09, C12, C16, C17, F01, F03, F04, G01–G03, G10, T01, T02, T04, X01; SC-M03-002, 024, 030).
import { expect, it } from 'vitest';
import { journeySnapshotSchema } from '../../../../shared/contracts/journeySnapshot';
import { publishedRouteSchema } from '../../../../shared/contracts/publishedRoute';
import { QR_INTRO_MIN_CHARS } from '../../config/limits';
import type { ConnectivityMode, RouteContent } from '../../contracts/adminDtos';
import type { ContractSuite } from './harness';
import { syntheticFile } from './harness';

const INTRO = 'Giới thiệu đủ dài cho du khách đọc tại chỗ.'.padEnd(QR_INTRO_MIN_CHARS, '.');
const IMAGE_BYTES = 4096;
const pair = (vi: string) => ({ vi, en: `${vi} (en)` });

export const publishRouteContract: ContractSuite = ({ subject, itFakeOnly }) => {
  const api = () => subject().api;

  async function signIn(role: 'CONTENT_STAFF' | 'REVIEWER' = 'CONTENT_STAFF') {
    await subject().controls.signInAs(role);
  }

  async function upload(ownerType: 'ROUTE' | 'CHECKPOINT', ownerId: string, usage: 'QR_MEDIA' | 'ROUTE_THUMBNAIL' | 'ROUTE_MAP') {
    const { objectPath } = await api().uploadMedia({ ownerType, ownerId, file: syntheticFile('anh.jpg', 'image/jpeg', IMAGE_BYTES) });
    const result = await api().registerMedia({ ownerType, ownerId, usage, type: 'IMAGE', objectPath });
    if (!result.ok) throw new Error('không đăng ký được ảnh');
    return { mediaId: result.data.mediaId, objectPath };
  }

  /** Điểm dừng đã xuất bản, một điểm tham quan sẵn sàng (một ảnh) */
  async function publishedCheckpoint(name: string, mode: ConnectivityMode = 'OFFLINE_REQUIRED') {
    const saved = await api().saveCheckpointDraft({
      content: {
        checkpointName: pair(name),
        connectivityMode: mode,
        ...(mode === 'ONLINE_AVAILABLE' ? { fieldVerificationConfirmed: true } : {}),
      },
    });
    if (!saved.ok) throw new Error('không tạo được điểm dừng');
    const { checkpointId } = saved.data;
    const { mediaId } = await upload('CHECKPOINT', checkpointId, 'QR_MEDIA');
    const visitPoint = await api().saveVisitPointDraft({
      checkpointId,
      content: { objectName: pair(`Vật ở ${name}`), introductionText: { vi: INTRO, en: INTRO }, mediaItems: [{ mediaId }] },
      mediaSettings: [{ mediaId, usageRightsConfirmed: true }],
    });
    if (!visitPoint.ok) throw new Error('không tạo được điểm tham quan');
    const review = await api().openPublicationReview({ unitType: 'CHECKPOINT_FIRST_PUBLICATION', subjectId: checkpointId });
    const published = await api().publishUnit({
      unitType: 'CHECKPOINT_FIRST_PUBLICATION',
      subjectId: checkpointId,
      reviewedConcurrencyRevision: review.reviewedConcurrencyRevision,
    });
    if (!published.ok) throw new Error('không xuất bản được điểm dừng');
    return { checkpointId, qrIdentifier: visitPoint.data.qrIdentifier };
  }

  /** Lưu tuyến đủ nội dung (có ảnh đại diện đã tick quyền) với danh sách điểm dừng cho trước */
  async function completeRoute(checkpointIds: string[], change: Partial<RouteContent> = {}) {
    const first = await api().saveRouteDraft({ content: { noSafetyWarningConfirmed: false, offlineRouteMapRequired: false } });
    if (!first.ok) throw new Error('không tạo được tuyến');
    const { routeId } = first.data;
    const thumbnail = await upload('ROUTE', routeId, 'ROUTE_THUMBNAIL');
    const editor = await api().getRouteEditor(routeId);
    const content: RouteContent = {
      name: pair('Đường lên Mả Tổ'),
      shortDescription: pair('Rừng nguyên sinh'),
      description: pair('Mô tả đầy đủ của tuyến'),
      startingPoint: pair('Trung tâm du khách'),
      safetyWarning: pair('Dốc trơn khi mưa'),
      noSafetyWarningConfirmed: false,
      distanceKm: 4.5,
      durationMin: 150,
      difficulty: 'TRUNG_BINH',
      groupTags: ['GROUP_CA_NHAN_NGUOI_LON'],
      experienceTags: ['INTEREST_KHAM_PHA'],
      thumbnailMediaId: thumbnail.mediaId,
      galleryItems: [],
      offlineRouteMapRequired: false,
      checkpointList: checkpointIds.map((checkpointId) => ({ checkpointId })),
      ...change,
    };
    const saved = await api().saveRouteDraft({
      routeId,
      expected: { entity: editor.concurrencyRevision, draft: editor.draft?.concurrencyRevision },
      content,
      mediaSettings: [{ mediaId: thumbnail.mediaId, usageRightsConfirmed: true }],
    });
    if (!saved.ok) throw new Error(`không lưu được tuyến: ${saved.reason}`);
    return routeId;
  }

  async function publishRoute(routeId: string, noSafetyWarningConfirmed?: boolean) {
    const review = await api().openPublicationReview({ unitType: 'ROUTE_FIRST_PUBLICATION', subjectId: routeId });
    return {
      review,
      result: await api().publishUnit({
        unitType: 'ROUTE_FIRST_PUBLICATION',
        subjectId: routeId,
        reviewedConcurrencyRevision: review.reviewedConcurrencyRevision,
        ...(noSafetyWarningConfirmed !== undefined ? { noSafetyWarningConfirmed } : {}),
      }),
    };
  }

  it('lưu tuyến trống được, tạo tuyến Nháp; danh sách hiện tên bản nháp (C-01, Q-02)', async () => {
    await signIn();
    const saved = await api().saveRouteDraft({
      content: { name: { vi: 'Đường lên Mả Tổ' }, noSafetyWarningConfirmed: false, offlineRouteMapRequired: false },
    });
    expect(saved).toMatchObject({ ok: true, messageKey: 'MSG-SAVED' });
    if (!saved.ok) return;
    const rows = await api().listRoutes({});
    expect(rows).toEqual([
      expect.objectContaining({ routeId: saved.data.routeId, name: 'Đường lên Mả Tổ', status: 'NHAP', hasPendingDraft: false }),
    ]);
    const editor = await api().getRouteEditor(saved.data.routeId);
    expect(editor.status).toBe('NHAP');
    expect(editor.issues.length).toBeGreaterThan(0);
  });

  it('Khó + "Gia đình có trẻ nhỏ" → VALIDATION MSG-TAG-CONFLICT, không lưu gì (BR-M03-C12)', async () => {
    await signIn();
    const result = await api().saveRouteDraft({
      content: { difficulty: 'KHO', groupTags: ['GROUP_GIA_DINH_CO_TRE'], noSafetyWarningConfirmed: false, offlineRouteMapRequired: false },
    });
    expect(result).toMatchObject({ ok: false, reason: 'VALIDATION', messageKey: 'MSG-TAG-CONFLICT' });
    expect(await api().listRoutes({})).toEqual([]);
  });

  it('không có sơ đồ thì tick sơ đồ offline bị bỏ khi lưu (BR-M03-C16)', async () => {
    await signIn();
    const saved = await api().saveRouteDraft({ content: { noSafetyWarningConfirmed: false, offlineRouteMapRequired: true } });
    if (!saved.ok) throw new Error('cần tuyến');
    expect((await api().getRouteEditor(saved.data.routeId)).draft?.content.offlineRouteMapRequired).toBe(false);
  });

  it('điểm dừng chọn được chỉ là điểm dừng đang hoạt động, kèm mode, số điểm tham quan, tuyến khác (Q-04; BR-M03-T01)', async () => {
    await signIn();
    const active = await publishedCheckpoint('Hang Con Moong');
    await api().saveCheckpointDraft({ content: { checkpointName: { vi: 'Vườn nháp' } } });
    const routeId = await completeRoute([active.checkpointId]);
    const rows = await api().listSelectableCheckpoints('');
    expect(rows).toEqual([
      {
        checkpointId: active.checkpointId,
        name: 'Hang Con Moong',
        connectivityMode: 'OFFLINE_REQUIRED',
        visitPointCount: 1,
        otherRoutes: [{ routeId, routeName: 'Đường lên Mả Tổ' }],
      },
    ]);
    expect(await api().listSelectableCheckpoints('vườn')).toEqual([]);
  });

  it('thêm điểm dừng chưa hoạt động vào danh sách bị từ chối (BR-M03-T01, C17)', async () => {
    await signIn();
    const draft = await api().saveCheckpointDraft({ content: { checkpointName: { vi: 'Vườn nháp' } } });
    if (!draft.ok) throw new Error('cần điểm dừng');
    const result = await api().saveRouteDraft({
      content: { checkpointList: [{ checkpointId: draft.data.checkpointId }], noSafetyWarningConfirmed: false, offlineRouteMapRequired: false },
    });
    expect(result.ok).toBe(false);
  });

  it('hủy tuyến chưa từng xuất bản: cần lý do; tuyến Đã lưu trữ, điểm dừng không đổi (C-07; BR-M03-C01)', async () => {
    await signIn();
    const checkpoint = await publishedCheckpoint('Hang Con Moong');
    const routeId = await completeRoute([checkpoint.checkpointId]);
    const editor = await api().getRouteEditor(routeId);
    const expected = { entity: editor.concurrencyRevision };
    expect((await api().discardUnpublished({ subjectType: 'ROUTE', subjectId: routeId, expected })).ok).toBe(false);
    const result = await api().discardUnpublished({ subjectType: 'ROUTE', subjectId: routeId, reason: 'Tạo nhầm', expected });
    expect(result).toMatchObject({ ok: true, data: { status: 'LUU_TRU' } });
    expect((await api().getCheckpointEditor(checkpoint.checkpointId)).status).toBe('HOAT_DONG');
    expect(await subject().controls.readPublication(routeId)).toEqual({ route: null, snapshot: null });
  });

  it('xuất bản lần đầu: Đang hoạt động + snapshot version 1 hợp lệ + Published Route với timeTags đúng (Q12)', async () => {
    await signIn();
    const checkpoint = await publishedCheckpoint('Hang Con Moong');
    const routeId = await completeRoute([checkpoint.checkpointId], { durationMin: 180 });
    const { review, result } = await publishRoute(routeId);
    expect(review.blockingIssues).toEqual([]);
    expect(result).toMatchObject({ ok: true, messageKey: 'MSG-PUBLISHED', data: { newJourneyVersions: [{ routeId, contentVersion: 1 }] } });
    expect((await api().getRouteEditor(routeId)).status).toBe('HOAT_DONG');

    const { route, snapshot } = await subject().controls.readPublication(routeId);
    const parsedSnapshot = journeySnapshotSchema.parse(snapshot);
    expect(parsedSnapshot).toMatchObject({ routeId, contentVersion: 1, status: 'DA_CONG_BO' });
    expect(parsedSnapshot.previousContentVersion).toBeUndefined();
    expect(parsedSnapshot.checkpoints[0]).toMatchObject({
      checkpointId: checkpoint.checkpointId,
      sequence: 1,
      connectivityMode: 'OFFLINE_REQUIRED',
      qrIdentifiers: [checkpoint.qrIdentifier],
    });
    const parsedRoute = publishedRouteSchema.parse(route);
    expect(parsedRoute).toMatchObject({ status: 'HOAT_DONG', timeTags: ['TIME_VUA'], activeContentVersion: 1, checkpointCount: 1 });
  });

  itFakeOnly('sequence là vị trí trong danh sách, có khoảng trống khi điểm dừng không hoạt động; điểm đó bị loại ở review (BR-M03-G02, T02)', async () => {
    await signIn();
    const first = await publishedCheckpoint('Hang Con Moong');
    const closed = await publishedCheckpoint('Cây chò', 'ONLINE_AVAILABLE');
    const third = await publishedCheckpoint('Vườn thực vật', 'ONLINE_AVAILABLE');
    const routeId = await completeRoute([first.checkpointId, closed.checkpointId, third.checkpointId]);
    subject().controls.setCheckpointStatus?.(closed.checkpointId, 'TAM_DONG');

    const { review, result } = await publishRoute(routeId);
    expect(review.leftOutCheckpoints).toEqual([{ name: 'Cây chò', reason: 'Đang tạm đóng' }]);
    expect(result.ok).toBe(true);
    const { snapshot } = await subject().controls.readPublication(routeId);
    expect(journeySnapshotSchema.parse(snapshot).checkpoints.map((c) => [c.checkpointId, c.sequence])).toEqual([
      [first.checkpointId, 1],
      [third.checkpointId, 3],
    ]);
  });

  it('ước tính dung lượng chỉ tính ảnh và chữ của điểm dừng "Cần tải trước", không tính âm thanh/video (BR-M03-G10)', async () => {
    await signIn();
    const offline = await publishedCheckpoint('Hang Con Moong');
    const online = await publishedCheckpoint('Cây chò', 'ONLINE_AVAILABLE');
    const routeId = await completeRoute([offline.checkpointId, online.checkpointId]);
    const { review } = await publishRoute(routeId);
    const name = pair('Vật ở Hang Con Moong');
    const textBytes = new TextEncoder().encode(name.vi + name.en + INTRO + INTRO).length;
    expect(review.affectedRoutes).toEqual([
      expect.objectContaining({ routeId, createsNewJourneyVersion: true, estimatedOfflineSizeBytes: IMAGE_BYTES + textBytes }),
    ]);
    const { snapshot } = await subject().controls.readPublication(routeId);
    expect(journeySnapshotSchema.parse(snapshot).estimatedOfflineSizeBytes).toBe(IMAGE_BYTES + textBytes);
  });

  it('cảnh báo an toàn trống: review đòi tick; không tick → BLOCKED MSG-SAFETY-CONFIRM; tick thì xuất bản và lưu tick (BR-M03-C09)', async () => {
    await signIn();
    const checkpoint = await publishedCheckpoint('Hang Con Moong');
    const routeId = await completeRoute([checkpoint.checkpointId], { safetyWarning: {} });
    const { review, result } = await publishRoute(routeId);
    expect(review.noSafetyWarningConfirmationRequired).toBe(true);
    expect(review.blockingIssues).toEqual([]);
    expect(result).toMatchObject({ ok: false, reason: 'BLOCKED', messageKey: 'MSG-SAFETY-CONFIRM' });
    const second = await publishRoute(routeId, true);
    expect(second.result.ok).toBe(true);
    expect((await api().getRouteEditor(routeId)).published?.content.noSafetyWarningConfirmed).toBe(true);
  });

  it('thiếu nội dung hoặc không có điểm dừng hoạt động → không xuất bản gì (BR-M03-C04, T04)', async () => {
    await signIn();
    const saved = await api().saveRouteDraft({ content: { noSafetyWarningConfirmed: false, offlineRouteMapRequired: false } });
    if (!saved.ok) throw new Error('cần tuyến');
    const { review, result } = await publishRoute(saved.data.routeId);
    expect(review.blockingIssues.map((issue) => issue.messageKey)).toContain('MSG-NO-ACTIVE-CHECKPOINT');
    expect(result).toMatchObject({ ok: false, reason: 'VALIDATION' });
    expect(await subject().controls.readPublication(saved.data.routeId)).toEqual({ route: null, snapshot: null });
  });

  it('xuất bản tuyến không bao giờ xuất bản điểm dừng hay điểm tham quan (BR-M03-C17, F04)', async () => {
    await signIn();
    const checkpoint = await publishedCheckpoint('Hang Con Moong');
    const extra = await api().saveVisitPointDraft({
      checkpointId: checkpoint.checkpointId,
      content: { objectName: pair('Đá vôi'), introductionText: { vi: INTRO, en: INTRO } },
      mediaSettings: [],
    });
    if (!extra.ok) throw new Error('cần điểm tham quan nháp');
    const routeId = await completeRoute([checkpoint.checkpointId]);
    expect((await publishRoute(routeId)).result.ok).toBe(true);
    expect((await api().getVisitPointEditor(extra.data.qrIdentifier)).status).toBe('NHAP');
    const { snapshot } = await subject().controls.readPublication(routeId);
    expect(journeySnapshotSchema.parse(snapshot).checkpoints[0]?.qrIdentifiers).toEqual([checkpoint.qrIdentifier]);
  });

  itFakeOnly('lỗi giữa chừng → FAILED MSG-PUBLISH-FAILED, không để lại trạng thái nửa vời, có audit FAILURE (Q13; BR-M03-F03, G09: ứng viên đang dựng không bao giờ lộ ra)', async () => {
    await signIn();
    const checkpoint = await publishedCheckpoint('Hang Con Moong');
    const routeId = await completeRoute([checkpoint.checkpointId]);
    subject().controls.failNext?.('PUBLISHED', 'MSG-PUBLISH-FAILED');
    const { result } = await publishRoute(routeId);
    expect(result).toEqual({ ok: false, reason: 'FAILED', messageKey: 'MSG-PUBLISH-FAILED' });
    expect((await api().getRouteEditor(routeId)).status).toBe('NHAP');
    expect(await subject().controls.readPublication(routeId)).toEqual({ route: null, snapshot: null });
    expect((await subject().controls.auditRows()).at(-1)).toMatchObject({ action: 'PUBLISHED', result: 'FAILURE' });
    // Lần sau thành công vẫn nhận version 1: ứng viên lỗi không tiêu số version (BR-M03-G03)
    const retry = await publishRoute(routeId);
    expect(retry.result).toMatchObject({ ok: true, data: { newJourneyVersions: [{ routeId, contentVersion: 1 }] } });
  });

  itFakeOnly('gói tải trước vượt trần → BLOCKED MSG-OFFLINE-TOO-BIG nêu tuyến (BR-M03-G10)', async () => {
    await signIn();
    const checkpoint = await publishedCheckpoint('Hang Con Moong');
    const editor = await api().getVisitPointEditor(checkpoint.qrIdentifier);
    subject().controls.inflateMedia?.(editor.media[0]!.mediaId, 51 * 1_048_576);
    const routeId = await completeRoute([checkpoint.checkpointId]);
    const { review, result } = await publishRoute(routeId);
    expect(review.blockingIssues.map((issue) => issue.messageKey)).toContain('MSG-OFFLINE-TOO-BIG');
    expect(result).toMatchObject({ ok: false, reason: 'BLOCKED', messageKey: 'MSG-OFFLINE-TOO-BIG' });
    if (!result.ok && result.reason === 'BLOCKED') expect(result.values['tên tuyến']).toBe('Đường lên Mả Tổ');
  });

  itFakeOnly('thao tác khác đang giữ tập kết nối → BUSY, không thử lại (BR-M03-F05)', async () => {
    await signIn();
    const checkpoint = await publishedCheckpoint('Hang Con Moong');
    const routeId = await completeRoute([checkpoint.checkpointId]);
    subject().controls.holdLock?.(`checkpoint:${checkpoint.checkpointId}`);
    const { result } = await publishRoute(routeId);
    expect(result).toMatchObject({ ok: false, reason: 'BUSY', busy: { itemName: 'Hang Con Moong' } });
  });

  it('nội dung đổi sau khi mở review → STALE', async () => {
    await signIn();
    const checkpoint = await publishedCheckpoint('Hang Con Moong');
    const routeId = await completeRoute([checkpoint.checkpointId]);
    const review = await api().openPublicationReview({ unitType: 'ROUTE_FIRST_PUBLICATION', subjectId: routeId });
    const editor = await api().getRouteEditor(routeId);
    await api().saveRouteDraft({
      routeId,
      expected: { entity: editor.concurrencyRevision, draft: editor.draft?.concurrencyRevision },
      content: { ...editor.draft!.content, distanceKm: 5 },
      mediaSettings: editor.media.map((media) => ({ mediaId: media.mediaId, usageRightsConfirmed: media.usageRightsConfirmed })),
    });
    const result = await api().publishUnit({
      unitType: 'ROUTE_FIRST_PUBLICATION',
      subjectId: routeId,
      reviewedConcurrencyRevision: review.reviewedConcurrencyRevision,
    });
    expect(result).toMatchObject({ ok: false, reason: 'STALE' });
  });
};
