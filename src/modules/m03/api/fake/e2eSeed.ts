// Dựng dữ liệu cho E2E trên `npm run dev:fake` qua chính AdminApi giả (quickstart Q14–Q17). Chỉ nạp ở MODE `fake`
// (registerFakeTestHooks); không vào bundle production. Dữ liệu synthetic.
import { QR_INTRO_MIN_CHARS } from '../../config/limits';
import type { RouteContent } from '../../contracts/adminDtos';
import type { AdminApi } from '../AdminApi';

const INTRO = 'Giới thiệu đủ dài cho du khách đọc tại chỗ.'.padEnd(QR_INTRO_MIN_CHARS, '.');
const pair = (vi: string) => ({ vi, en: `${vi} (en)` });

function must<T>(result: { ok: true; data: T } | { ok: false; reason: string }, what: string): T {
  if (!result.ok) throw new Error(`${what}: ${result.reason}`);
  return result.data;
}

async function image(api: AdminApi, ownerType: 'ROUTE' | 'CHECKPOINT', ownerId: string, usage: 'QR_MEDIA' | 'ROUTE_THUMBNAIL') {
  const file = new File([new Uint8Array(4096)], 'anh.jpg', { type: 'image/jpeg' });
  const { objectPath } = await api.uploadMedia({ ownerType, ownerId, file });
  return must(await api.registerMedia({ ownerType, ownerId, usage, type: 'IMAGE', objectPath }), 'đăng ký ảnh').mediaId;
}

/** Điểm dừng "Cần tải trước" đã xuất bản với một điểm tham quan sẵn sàng */
export async function seedPublishedCheckpoint(api: AdminApi, name: string): Promise<string> {
  const { checkpointId } = must(
    await api.saveCheckpointDraft({ content: { checkpointName: pair(name), connectivityMode: 'OFFLINE_REQUIRED' } }),
    'tạo điểm dừng',
  );
  const mediaId = await image(api, 'CHECKPOINT', checkpointId, 'QR_MEDIA');
  must(
    await api.saveVisitPointDraft({
      checkpointId,
      content: { objectName: pair(`Vật ở ${name}`), introductionText: { vi: INTRO, en: INTRO }, mediaItems: [{ mediaId }] },
      mediaSettings: [{ mediaId, usageRightsConfirmed: true }],
    }),
    'tạo điểm tham quan',
  );
  const review = await api.openPublicationReview({ unitType: 'CHECKPOINT_FIRST_PUBLICATION', subjectId: checkpointId });
  must(
    await api.publishUnit({ unitType: 'CHECKPOINT_FIRST_PUBLICATION', subjectId: checkpointId, reviewedConcurrencyRevision: review.reviewedConcurrencyRevision }),
    'xuất bản điểm dừng',
  );
  return checkpointId;
}

/** Tuyến đủ nội dung đã xuất bản lần đầu, liệt kê các điểm dừng cho trước */
export async function seedPublishedRoute(api: AdminApi, name: string, checkpointIds: string[]): Promise<string> {
  const { routeId } = must(await api.saveRouteDraft({ content: { noSafetyWarningConfirmed: false, offlineRouteMapRequired: false } }), 'tạo tuyến');
  const thumbnail = await image(api, 'ROUTE', routeId, 'ROUTE_THUMBNAIL');
  const editor = await api.getRouteEditor(routeId);
  must(
    await api.saveRouteDraft({
      routeId,
      expected: { entity: editor.concurrencyRevision, draft: editor.draft?.concurrencyRevision },
      content: {
        name: pair(name),
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
        thumbnailMediaId: thumbnail,
        offlineRouteMapRequired: false,
        checkpointList: checkpointIds.map((checkpointId) => ({ checkpointId })),
      },
      mediaSettings: [{ mediaId: thumbnail, usageRightsConfirmed: true }],
    }),
    'lưu tuyến',
  );
  const review = await api.openPublicationReview({ unitType: 'ROUTE_FIRST_PUBLICATION', subjectId: routeId });
  must(
    await api.publishUnit({ unitType: 'ROUTE_FIRST_PUBLICATION', subjectId: routeId, reviewedConcurrencyRevision: review.reviewedConcurrencyRevision }),
    'xuất bản tuyến',
  );
  return routeId;
}

/** Một phiên khác lưu bản nháp chờ của tuyến (quickstart Q14) */
export async function reviseRoute(api: AdminApi, routeId: string, change: Partial<RouteContent>): Promise<void> {
  const editor = await api.getRouteEditor(routeId);
  must(
    await api.saveRouteDraft({
      routeId,
      expected: { entity: editor.concurrencyRevision, draft: editor.draft?.concurrencyRevision },
      content: { ...(editor.draft ?? editor.published)!.content, ...change },
      mediaSettings: editor.media.map((media) => ({ mediaId: media.mediaId, usageRightsConfirmed: media.usageRightsConfirmed })),
    }),
    'lưu bản nháp tuyến',
  );
}
