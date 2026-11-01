// Sửa dữ liệu đã xuất bản — C-01/C-02/C-03 trên mục đang hoạt động, C-05 `ROUTE_INFORMATION`,
// `CHECKPOINT_REVISION`, `QR_OBJECT` ở điểm dừng đang hoạt động, C-16 dựng lại hành trình (tasks T116, T119;
// BR-M03-C15, C16, D06, E06, E09, E13, F05, F06, G03–G06, G10, T05, T06, X02, X03; SC-M03-003, 005, 020, 022, 028, 029).
import { expect, it } from 'vitest';
import { journeySnapshotSchema, type JourneySnapshot } from '../../../../shared/contracts/journeySnapshot';
import { QR_INTRO_MIN_CHARS } from '../../config/limits';
import type { ConnectivityMode, RouteContent } from '../../contracts/adminDtos';
import type { PublicationUnitType } from '../../contracts/publicationReview';
import type { ContractSuite } from './harness';
import { syntheticFile } from './harness';

const INTRO = 'Giới thiệu đủ dài cho du khách đọc tại chỗ.'.padEnd(QR_INTRO_MIN_CHARS, '.');
const pair = (vi: string) => ({ vi, en: `${vi} (en)` });

export const publishReviseContract: ContractSuite = ({ subject, itFakeOnly }) => {
  const api = () => subject().api;

  async function image(ownerType: 'ROUTE' | 'CHECKPOINT', ownerId: string, usage: 'QR_MEDIA' | 'ROUTE_THUMBNAIL' | 'ROUTE_MAP') {
    const { objectPath } = await api().uploadMedia({ ownerType, ownerId, file: syntheticFile('anh.jpg', 'image/jpeg', 4096) });
    const result = await api().registerMedia({ ownerType, ownerId, usage, type: 'IMAGE', objectPath });
    if (!result.ok) throw new Error('không đăng ký được ảnh');
    return result.data.mediaId;
  }

  async function publish(unitType: PublicationUnitType, subjectId: string, noSafetyWarningConfirmed?: boolean) {
    const review = await api().openPublicationReview({ unitType, subjectId });
    const result = await api().publishUnit({
      unitType,
      subjectId,
      reviewedConcurrencyRevision: review.reviewedConcurrencyRevision,
      ...(noSafetyWarningConfirmed !== undefined ? { noSafetyWarningConfirmed } : {}),
    });
    return { review, result };
  }

  async function addVisitPoint(checkpointId: string, name: string) {
    const mediaId = await image('CHECKPOINT', checkpointId, 'QR_MEDIA');
    const saved = await api().saveVisitPointDraft({
      checkpointId,
      content: { objectName: pair(name), introductionText: { vi: INTRO, en: INTRO }, mediaItems: [{ mediaId }] },
      mediaSettings: [{ mediaId, usageRightsConfirmed: true }],
    });
    if (!saved.ok) throw new Error('không tạo được điểm tham quan');
    return saved.data.qrIdentifier;
  }

  async function publishedCheckpoint(name: string, mode: ConnectivityMode = 'OFFLINE_REQUIRED') {
    const saved = await api().saveCheckpointDraft({
      content: { checkpointName: pair(name), connectivityMode: mode, ...(mode === 'ONLINE_AVAILABLE' ? { fieldVerificationConfirmed: true } : {}) },
    });
    if (!saved.ok) throw new Error('không tạo được điểm dừng');
    const { checkpointId } = saved.data;
    const qrIdentifier = await addVisitPoint(checkpointId, `Vật ở ${name}`);
    if (!(await publish('CHECKPOINT_FIRST_PUBLICATION', checkpointId)).result.ok) throw new Error('không xuất bản được điểm dừng');
    return { checkpointId, qrIdentifier };
  }

  async function publishedRoute(name: string, checkpointIds: string[], change: Partial<RouteContent> = {}) {
    const created = await api().saveRouteDraft({ content: { noSafetyWarningConfirmed: false, offlineRouteMapRequired: false } });
    if (!created.ok) throw new Error('không tạo được tuyến');
    const { routeId } = created.data;
    const thumbnail = await image('ROUTE', routeId, 'ROUTE_THUMBNAIL');
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
        thumbnailMediaId: thumbnail,
        offlineRouteMapRequired: false,
        checkpointList: checkpointIds.map((checkpointId) => ({ checkpointId })),
        ...change,
      },
      mediaSettings: [{ mediaId: thumbnail, usageRightsConfirmed: true }],
    });
    if (!saved.ok) throw new Error(`không lưu được tuyến: ${saved.reason}`);
    if (!(await publish('ROUTE_FIRST_PUBLICATION', routeId)).result.ok) throw new Error('không xuất bản được tuyến');
    return routeId;
  }

  /** Lưu bản nháp chờ của tuyến đã xuất bản với một thay đổi */
  async function editRoute(routeId: string, change: (content: RouteContent) => RouteContent) {
    const editor = await api().getRouteEditor(routeId);
    const content = (editor.draft ?? editor.published)!.content;
    const result = await api().saveRouteDraft({
      routeId,
      expected: { entity: editor.concurrencyRevision, draft: editor.draft?.concurrencyRevision },
      content: change(content),
      mediaSettings: editor.media.map((media) => ({ mediaId: media.mediaId, usageRightsConfirmed: true })),
    });
    if (!result.ok) throw new Error(`không lưu được bản nháp tuyến: ${result.reason}`);
    return result;
  }

  async function renameCheckpoint(checkpointId: string, vi: string) {
    const editor = await api().getCheckpointEditor(checkpointId);
    const content = (editor.draft ?? editor.published)!.content;
    const result = await api().saveCheckpointDraft({
      checkpointId,
      expected: { entity: editor.concurrencyRevision, draft: editor.draft?.concurrencyRevision },
      content: { ...content, checkpointName: pair(vi) },
    });
    if (!result.ok) throw new Error('không lưu được bản nháp điểm dừng');
  }

  const snapshotOf = async (routeId: string): Promise<JourneySnapshot> =>
    journeySnapshotSchema.parse((await subject().controls.readPublication(routeId)).snapshot);

  it('sửa tuyến đã xuất bản tạo đúng một bản nháp chờ, lần sửa sau tiếp tục bản đó; bản công khai không đổi (BR-M03-F06, C05)', async () => {
    await subject().controls.signInAs('CONTENT_STAFF');
    const { checkpointId } = await publishedCheckpoint('Hang Con Moong');
    const routeId = await publishedRoute('Đường lên Mả Tổ', [checkpointId]);
    const first = await editRoute(routeId, (content) => ({ ...content, distanceKm: 5 }));
    const second = await editRoute(routeId, (content) => ({ ...content, distanceKm: 6 }));
    expect(second.ok && first.ok && second.data.revisionNumber === first.data.revisionNumber).toBe(true);
    const editor = await api().getRouteEditor(routeId);
    expect(editor.draft?.content.distanceKm).toBe(6);
    expect(editor.published?.content.distanceKm).toBe(4.5);
    expect((await subject().controls.readPublication(routeId)).route?.distanceKm).toBe(4.5);
    expect((await api().listRoutes({}))[0]).toMatchObject({ hasPendingDraft: true });
  });

  it('người thứ hai mở tuyến thấy bản nháp chờ; ghi bằng concurrencyRevision cũ → STALE, không ghi đè (BR-M03-F06; Q14)', async () => {
    await subject().controls.signInAs('CONTENT_STAFF');
    const { checkpointId } = await publishedCheckpoint('Hang Con Moong');
    const routeId = await publishedRoute('Đường lên Mả Tổ', [checkpointId]);
    const opened = await api().getRouteEditor(routeId);
    await editRoute(routeId, (content) => ({ ...content, distanceKm: 5 }));
    await subject().controls.signInAs('REVIEWER');
    const stale = await api().saveRouteDraft({
      routeId,
      expected: { entity: opened.concurrencyRevision, draft: opened.draft?.concurrencyRevision },
      content: { ...opened.published!.content, distanceKm: 7 },
    });
    expect(stale).toMatchObject({ ok: false, reason: 'STALE', stale: { editorEmail: 'staff@example.test' } });
    expect((await api().getRouteEditor(routeId)).draft?.content.distanceKm).toBe(5);
  });

  it('đổi thông tin tuyến khác (không phải danh sách, thứ tự, sơ đồ offline) → xuất bản không tạo version (BR-M03-C15, G05)', async () => {
    await subject().controls.signInAs('CONTENT_STAFF');
    const { checkpointId } = await publishedCheckpoint('Hang Con Moong');
    const routeId = await publishedRoute('Đường lên Mả Tổ', [checkpointId]);
    await editRoute(routeId, (content) => ({ ...content, shortDescription: pair('Rừng già'), distanceKm: 5 }));
    const { review, result } = await publish('ROUTE_INFORMATION', routeId);
    expect(review.affectedRoutes).toEqual([expect.objectContaining({ routeId, createsNewJourneyVersion: false })]);
    expect(result).toMatchObject({ ok: true, data: { newJourneyVersions: [] } });
    expect((await snapshotOf(routeId)).contentVersion).toBe(1);
    expect((await subject().controls.readPublication(routeId)).route).toMatchObject({ distanceKm: 5, shortDescription: pair('Rừng già') });
  });

  it('đổi thứ tự điểm dừng chỉ tạo version cho tuyến đó; version liên tục (BR-M03-T06, G03)', async () => {
    await subject().controls.signInAs('CONTENT_STAFF');
    const a = await publishedCheckpoint('Hang Con Moong');
    const b = await publishedCheckpoint('Cây chò', 'ONLINE_AVAILABLE');
    const routeA = await publishedRoute('Tuyến A', [a.checkpointId, b.checkpointId]);
    const routeB = await publishedRoute('Tuyến B', [a.checkpointId, b.checkpointId]);
    await editRoute(routeA, (content) => ({ ...content, checkpointList: [...(content.checkpointList ?? [])].reverse() }));
    const { result } = await publish('ROUTE_INFORMATION', routeA);
    expect(result).toMatchObject({ ok: true, data: { newJourneyVersions: [{ routeId: routeA, contentVersion: 2 }] } });
    const snapshot = await snapshotOf(routeA);
    expect(snapshot).toMatchObject({ contentVersion: 2, previousContentVersion: 1 });
    expect(snapshot.checkpoints.map((c) => [c.checkpointId, c.sequence])).toEqual([
      [b.checkpointId, 1],
      [a.checkpointId, 2],
    ]);
    expect((await snapshotOf(routeB)).contentVersion).toBe(1);
  });

  it('bật sơ đồ offline tạo version mới và đưa sơ đồ vào snapshot; sơ đồ không đánh dấu không vào snapshot (BR-M03-C16)', async () => {
    await subject().controls.signInAs('CONTENT_STAFF');
    const { checkpointId } = await publishedCheckpoint('Hang Con Moong');
    const routeId = await publishedRoute('Đường lên Mả Tổ', [checkpointId]);
    const map = await image('ROUTE', routeId, 'ROUTE_MAP');
    await editRoute(routeId, (content) => ({ ...content, routeMapMediaId: map, offlineRouteMapRequired: false }));
    expect((await publish('ROUTE_INFORMATION', routeId)).result).toMatchObject({ ok: true, data: { newJourneyVersions: [] } });
    expect((await snapshotOf(routeId)).offlineRouteMap).toBeUndefined();

    await editRoute(routeId, (content) => ({ ...content, offlineRouteMapRequired: true }));
    const { review, result } = await publish('ROUTE_INFORMATION', routeId);
    expect(review.sensitiveChanges.map((change) => change.fieldLabel)).toContain('Sơ đồ này cần để định hướng khi không có mạng');
    expect(result).toMatchObject({ ok: true, data: { newJourneyVersions: [{ routeId, contentVersion: 2 }] } });
    expect((await snapshotOf(routeId)).offlineRouteMap).toBeDefined();
    expect((await subject().controls.readPublication(routeId)).route?.hasOfflineRouteMap).toBe(true);
  });

  it('đổi tên điểm dừng được 2 tuyến liệt kê → review nêu cả 2; cả 2 có version mới cùng lúc; snapshot cũ nguyên (BR-M03-X02, X03; Q15)', async () => {
    await subject().controls.signInAs('CONTENT_STAFF');
    const { checkpointId } = await publishedCheckpoint('Hang Con Moong');
    const routeA = await publishedRoute('Tuyến A', [checkpointId]);
    const routeB = await publishedRoute('Tuyến B', [checkpointId]);
    const before = await snapshotOf(routeA);
    await renameCheckpoint(checkpointId, 'Hang Người Xưa');
    expect((await snapshotOf(routeA)).checkpoints[0]?.checkpointName.vi).toBe('Hang Con Moong');

    const { review, result } = await publish('CHECKPOINT_REVISION', checkpointId);
    expect(review.affectedRoutes.map((route) => [route.routeName, route.createsNewJourneyVersion]).sort()).toEqual([
      ['Tuyến A', true],
      ['Tuyến B', true],
    ]);
    expect(review.impactNotes).toContain(
      'Thay đổi này ảnh hưởng 2 tuyến: Tuyến A, Tuyến B. Gói tải trước của du khách ở các tuyến đó cần cập nhật.',
    );
    expect(review.impactNotes.join(' ')).not.toMatch(/snapshot|journey version/i);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.newJourneyVersions.map((v) => v.contentVersion)).toEqual([2, 2]);
    expect((await snapshotOf(routeA)).checkpoints[0]?.checkpointName.vi).toBe('Hang Người Xưa');
    expect((await snapshotOf(routeB)).checkpoints[0]?.checkpointName.vi).toBe('Hang Người Xưa');
    // Snapshot cũ bất biến (BR-M03-G01)
    expect(before.checkpoints[0]?.checkpointName.vi).toBe('Hang Con Moong');
  });

  it('đổi mode điểm dừng → review nhắc in lại mã QR (MSG-REPRINT-MODE-CHANGED; BR-M03-B05)', async () => {
    await subject().controls.signInAs('CONTENT_STAFF');
    const { checkpointId } = await publishedCheckpoint('Cây chò', 'OFFLINE_REQUIRED');
    await publishedRoute('Tuyến A', [checkpointId]);
    const editor = await api().getCheckpointEditor(checkpointId);
    await api().saveCheckpointDraft({
      checkpointId,
      expected: { entity: editor.concurrencyRevision, draft: editor.draft?.concurrencyRevision },
      content: { ...editor.published!.content, connectivityMode: 'ONLINE_AVAILABLE', fieldVerificationConfirmed: true },
    });
    const { review } = await publish('CHECKPOINT_REVISION', checkpointId);
    expect(review.impactNotes).toContain(
      'Loại kết nối của điểm dừng "Cây chò" sẽ đổi. Sau khi xuất bản, hãy in lại mã QR của các điểm tham quan để dòng hướng dẫn trên tem đúng với thực tế.',
    );
  });

  it('nội dung điểm tham quan ở điểm dừng có mạng đổi → không tạo version; điểm tham quan mới gia nhập → có version (BR-M03-E06, E13, G04, G05)', async () => {
    await subject().controls.signInAs('CONTENT_STAFF');
    const online = await publishedCheckpoint('Cây chò', 'ONLINE_AVAILABLE');
    const routeId = await publishedRoute('Tuyến A', [online.checkpointId]);
    const editor = await api().getVisitPointEditor(online.qrIdentifier);
    await api().saveVisitPointDraft({
      checkpointId: online.checkpointId,
      qrIdentifier: online.qrIdentifier,
      expected: { entity: editor.concurrencyRevision, draft: editor.draft?.concurrencyRevision },
      content: { ...editor.published!.content, introductionText: { vi: `${INTRO} Mới.`, en: INTRO } },
      mediaSettings: editor.media.map((media) => ({ mediaId: media.mediaId, usageRightsConfirmed: true })),
    });
    expect((await publish('QR_OBJECT', online.qrIdentifier)).result).toMatchObject({ ok: true, data: { newJourneyVersions: [] } });

    const joined = await addVisitPoint(online.checkpointId, 'Cây lim');
    const { review, result } = await publish('QR_OBJECT', joined);
    expect(review.affectedRoutes).toEqual([expect.objectContaining({ routeId, createsNewJourneyVersion: true })]);
    expect(result).toMatchObject({ ok: true, data: { newJourneyVersions: [{ routeId, contentVersion: 2 }] } });
    expect((await snapshotOf(routeId)).checkpoints[0]?.qrIdentifiers).toEqual([online.qrIdentifier, joined]);
  });

  it('sửa điểm tham quan ở điểm dừng "Cần tải trước" đang hoạt động → version mới mang nội dung mới (BR-M03-E06)', async () => {
    await subject().controls.signInAs('CONTENT_STAFF');
    const offline = await publishedCheckpoint('Hang Con Moong');
    const routeId = await publishedRoute('Tuyến A', [offline.checkpointId]);
    const editor = await api().getVisitPointEditor(offline.qrIdentifier);
    await api().saveVisitPointDraft({
      checkpointId: offline.checkpointId,
      qrIdentifier: offline.qrIdentifier,
      expected: { entity: editor.concurrencyRevision, draft: editor.draft?.concurrencyRevision },
      content: { ...editor.published!.content, objectName: pair('Thạch nhũ') },
      mediaSettings: editor.media.map((media) => ({ mediaId: media.mediaId, usageRightsConfirmed: true })),
    });
    expect((await publish('QR_OBJECT', offline.qrIdentifier)).result).toMatchObject({ ok: true, data: { newJourneyVersions: [{ routeId, contentVersion: 2 }] } });
    expect((await snapshotOf(routeId)).checkpoints[0]?.offlineResources?.[0]?.objectName.vi).toBe('Thạch nhũ');
  });

  it('thu hồi QR ở điểm dừng đang hoạt động → mọi tuyến liệt kê có version mới (BR-M03-E09, X02)', async () => {
    await subject().controls.signInAs('CONTENT_STAFF');
    const { checkpointId, qrIdentifier } = await publishedCheckpoint('Hang Con Moong');
    const second = await addVisitPoint(checkpointId, 'Cây lim');
    const routeId = await publishedRoute('Tuyến A', [checkpointId]);
    await publish('QR_OBJECT', second);
    expect((await snapshotOf(routeId)).contentVersion).toBe(2);
    const editor = await api().getVisitPointEditor(qrIdentifier);
    expect((await api().revokeVisitPoint({ qrIdentifier, reason: 'Cây đã đổ', expected: { entity: editor.concurrencyRevision } })).ok).toBe(true);
    const snapshot = await snapshotOf(routeId);
    expect(snapshot.contentVersion).toBe(3);
    expect(snapshot.checkpoints[0]?.qrIdentifiers).toEqual([second]);
  });

  it('bỏ điểm dừng hoạt động cuối của tuyến đang hoạt động → BLOCKED MSG-ROUTE-LAST-CHECKPOINT (BR-M03-T05)', async () => {
    await subject().controls.signInAs('CONTENT_STAFF');
    const { checkpointId } = await publishedCheckpoint('Hang Con Moong');
    const routeId = await publishedRoute('Tuyến A', [checkpointId]);
    await editRoute(routeId, (content) => ({ ...content, checkpointList: [] }));
    const { result } = await publish('ROUTE_INFORMATION', routeId);
    expect(result).toMatchObject({ ok: false, reason: 'BLOCKED', messageKey: 'MSG-ROUTE-LAST-CHECKPOINT' });
    expect((await snapshotOf(routeId)).checkpoints).toHaveLength(1);
  });

  itFakeOnly('hai thao tác trên hai tuyến chung một điểm dừng: thao tác sau BUSY, không thử lại (BR-M03-F05; Q16)', async () => {
    await subject().controls.signInAs('CONTENT_STAFF');
    const { checkpointId } = await publishedCheckpoint('Hang Con Moong');
    const routeA = await publishedRoute('Tuyến A', [checkpointId]);
    await publishedRoute('Tuyến B', [checkpointId]);
    await editRoute(routeA, (content) => ({ ...content, distanceKm: 5 }));
    // Một xuất bản khác đang chạy trên Tuyến B giữ điểm dừng chung
    subject().controls.holdLock?.(`checkpoint:${checkpointId}`);
    const { result } = await publish('ROUTE_INFORMATION', routeA);
    expect(result).toMatchObject({ ok: false, reason: 'BUSY', messageKey: 'MSG-ROUTE-BUSY', busy: { itemName: 'Hang Con Moong' } });
    expect((await api().getRouteEditor(routeA)).draft).toBeDefined();
  });

  itFakeOnly('xuất bản điểm dừng làm gói tải trước của một tuyến vượt trần → BLOCKED MSG-OFFLINE-TOO-BIG nêu tuyến (BR-M03-G10, X03; Q17)', async () => {
    await subject().controls.signInAs('CONTENT_STAFF');
    const { checkpointId } = await publishedCheckpoint('Hang Con Moong');
    await publishedRoute('Tuyến A', [checkpointId]);
    const joined = await addVisitPoint(checkpointId, 'Thạch nhũ');
    const media = (await api().getVisitPointEditor(joined)).media[0]!;
    subject().controls.inflateMedia?.(media.mediaId, 51 * 1_048_576);
    const { review, result } = await publish('QR_OBJECT', joined);
    expect(review.blockingIssues.map((issue) => issue.messageKey)).toContain('MSG-OFFLINE-TOO-BIG');
    expect(result).toMatchObject({ ok: false, reason: 'BLOCKED', messageKey: 'MSG-OFFLINE-TOO-BIG' });
    if (!result.ok && result.reason === 'BLOCKED') {
      expect(result.values['tên tuyến']).toBe('Tuyến A');
      expect(String(result.values['danh sách'])).toContain('Thạch nhũ – ảnh 1');
    }
  });

  itFakeOnly('dựng snapshot lỗi giữa chừng → không tuyến nào đổi (BR-M03-G07)', async () => {
    await subject().controls.signInAs('CONTENT_STAFF');
    const { checkpointId } = await publishedCheckpoint('Hang Con Moong');
    const routeA = await publishedRoute('Tuyến A', [checkpointId]);
    const routeB = await publishedRoute('Tuyến B', [checkpointId]);
    await renameCheckpoint(checkpointId, 'Hang Người Xưa');
    subject().controls.failNext?.('PUBLISHED', 'MSG-PUBLISH-FAILED');
    const { result } = await publish('CHECKPOINT_REVISION', checkpointId);
    expect(result).toEqual({ ok: false, reason: 'FAILED', messageKey: 'MSG-PUBLISH-FAILED' });
    expect((await snapshotOf(routeA)).contentVersion).toBe(1);
    expect((await snapshotOf(routeB)).contentVersion).toBe(1);
    expect((await api().getCheckpointEditor(checkpointId)).draft).toBeDefined();
  });

  it('thêm, bỏ, đổi thứ tự điểm dừng là sửa bản nháp; chỉ có hiệu lực khi xuất bản (BR-M03-T03)', async () => {
    await subject().controls.signInAs('CONTENT_STAFF');
    const a = await publishedCheckpoint('Hang Con Moong');
    const b = await publishedCheckpoint('Động Người Xưa');
    const c = await publishedCheckpoint('Cây chò');
    const routeId = await publishedRoute('Tuyến A', [a.checkpointId, b.checkpointId]);
    const before = await snapshotOf(routeId);
    await editRoute(routeId, (content) => ({ ...content, checkpointList: [{ checkpointId: c.checkpointId }, { checkpointId: a.checkpointId }] }));
    expect(await snapshotOf(routeId)).toEqual(before);
    expect((await subject().controls.readPublication(routeId)).route?.checkpointCount).toBe(2);
    await publish('ROUTE_INFORMATION', routeId);
    expect((await snapshotOf(routeId)).checkpoints.map((item) => item.checkpointId)).toEqual([c.checkpointId, a.checkpointId]);
  });
};
