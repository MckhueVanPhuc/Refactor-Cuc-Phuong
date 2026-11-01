// Dựng dữ liệu đã xuất bản cho các bộ test hành vi dùng chung (history, audit), qua chính AdminApi của adapter
// đang được kiểm, để cùng chạy được với adapter giả và adapter Supabase (T197).
import { QR_INTRO_MIN_CHARS } from '../../config/limits';
import type { RouteContent } from '../../contracts/adminDtos';
import type { PublicationUnitType } from '../../contracts/publicationReview';
import type { AdminApi } from '../AdminApi';
import { syntheticFile } from './harness';

export const INTRO = 'Giới thiệu đủ dài cho du khách đọc tại chỗ.'.padEnd(QR_INTRO_MIN_CHARS, '.');
export const pair = (vi: string) => ({ vi, en: `${vi} (en)` });

export function contractBuilders(api: () => AdminApi) {
  async function image(ownerType: 'ROUTE' | 'CHECKPOINT', ownerId: string, usage: 'QR_MEDIA' | 'ROUTE_THUMBNAIL') {
    const { objectPath } = await api().uploadMedia({ ownerType, ownerId, file: syntheticFile('anh.jpg', 'image/jpeg', 4096) });
    const result = await api().registerMedia({ ownerType, ownerId, usage, type: 'IMAGE', objectPath });
    if (!result.ok) throw new Error('không đăng ký được ảnh');
    return result.data.mediaId;
  }

  async function publish(unitType: PublicationUnitType, subjectId: string) {
    const review = await api().openPublicationReview({ unitType, subjectId });
    const result = await api().publishUnit({ unitType, subjectId, reviewedConcurrencyRevision: review.reviewedConcurrencyRevision });
    if (!result.ok) throw new Error(`không xuất bản được: ${result.reason}`);
    return result;
  }

  /** Điểm dừng "Cần tải trước" đã xuất bản với một điểm tham quan sẵn sàng */
  async function publishedCheckpoint(name: string) {
    const saved = await api().saveCheckpointDraft({ content: { checkpointName: pair(name), connectivityMode: 'OFFLINE_REQUIRED' } });
    if (!saved.ok) throw new Error('không tạo được điểm dừng');
    const { checkpointId } = saved.data;
    const mediaId = await image('CHECKPOINT', checkpointId, 'QR_MEDIA');
    const visitPoint = await api().saveVisitPointDraft({
      checkpointId,
      content: { objectName: pair(`Vật ở ${name}`), introductionText: { vi: INTRO, en: INTRO }, mediaItems: [{ mediaId }] },
      mediaSettings: [{ mediaId, usageRightsConfirmed: true }],
    });
    if (!visitPoint.ok) throw new Error('không tạo được điểm tham quan');
    await publish('CHECKPOINT_FIRST_PUBLICATION', checkpointId);
    return { checkpointId, qrIdentifier: visitPoint.data.qrIdentifier };
  }

  async function publishedRoute(name: string, checkpointIds: string[]) {
    const created = await api().saveRouteDraft({ content: { noSafetyWarningConfirmed: false, offlineRouteMapRequired: false } });
    if (!created.ok) throw new Error('không tạo được tuyến');
    const { routeId } = created.data;
    const mediaId = await image('ROUTE', routeId, 'ROUTE_THUMBNAIL');
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

  return { image, publish, publishedCheckpoint, publishedRoute, editRoute, renameCheckpoint };
}
