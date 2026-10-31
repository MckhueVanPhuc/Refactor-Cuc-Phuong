// Đọc dữ liệu điểm dừng/điểm tham quan đã lưu trên adapter giả — dùng chung cho C-02/C-03/C-07/C-16
// và Q-05…Q-08. Readiness luôn tính trên dữ liệu đã lưu, không phải trên chữ đang gõ (BR-M03-D04, E05).
import type {
  CheckpointContent,
  ConnectivityMode,
  MediaInfo,
  QrContent,
  Readiness,
  RouteContent,
} from '../../contracts/adminDtos';
import type { ValidationIssue } from '../../contracts/validationIssue';
import { checkpointPublishIssues } from '../../validation/checkpoint';
import { makeIssue } from '../../validation/common';
import {
  readinessOf,
  visitPointName,
  visitPointPublishIssues,
  visitPointSaveIssues,
  type VisitPointCheckInput,
} from '../../validation/visitPoint';
import { currentContent, draftOf, publishedOf } from './revisions';
import type { FakeCheckpoint, FakeMedia, FakeQrCode, FakeStore } from './store';

export function checkpointContent(store: FakeStore, checkpoint: FakeCheckpoint): CheckpointContent {
  return currentContent<CheckpointContent>(store, 'CHECKPOINT', checkpoint.checkpointId) ?? {};
}

/** Tên tiếng Việt đang dùng của điểm dừng (bản nháp, rồi bản đã xuất bản) */
export function checkpointName(store: FakeStore, checkpoint: FakeCheckpoint): string {
  return checkpointContent(store, checkpoint).checkpointName?.vi?.trim() ?? '';
}

/** Mode đã lưu (bản nháp nếu có, ngược lại bản đã xuất bản) — quyết định form điểm tham quan (BR-M03-E15) */
export function savedMode(store: FakeStore, checkpoint: FakeCheckpoint): ConnectivityMode | undefined {
  return checkpointContent(store, checkpoint).connectivityMode;
}

/** Điểm tham quan của điểm dừng theo thứ tự tạo */
export function qrCodesOf(store: FakeStore, checkpointId: string): FakeQrCode[] {
  return [...store.state.qrCodes.values()]
    .filter((qr) => qr.checkpointId === checkpointId)
    .sort((a, b) => a.creationOrder - b.creationOrder);
}

export function qrContent(store: FakeStore, qr: FakeQrCode, source: 'current' | 'draft' = 'current'): QrContent {
  if (source === 'draft') return (draftOf(store, 'QRCODE', qr.qrIdentifier)?.content as QrContent | undefined) ?? {};
  return currentContent<QrContent>(store, 'QRCODE', qr.qrIdentifier) ?? {};
}

export function qrDisplayName(store: FakeStore, qr: FakeQrCode): string {
  return visitPointName(qrContent(store, qr).objectName?.vi, qr.creationOrder);
}

/** Media của một nội dung QR theo đúng thứ tự `mediaItems`; id không tìm thấy bị bỏ qua */
export function mediaOfContent(store: FakeStore, content: QrContent): FakeMedia[] {
  return (content.mediaItems ?? []).flatMap(({ mediaId }) => {
    const media = store.state.media.get(mediaId);
    return media ? [media] : [];
  });
}

export function toMediaInfo(media: FakeMedia): MediaInfo {
  const info: MediaInfo = {
    mediaId: media.mediaId,
    type: media.type,
    usage: media.usage,
    sourceRef: media.sourceRef,
    mimeType: media.mimeType,
    fileSizeBytes: media.fileSizeBytes,
    usageRightsConfirmed: media.usageRightsConfirmed,
  };
  if (media.spokenLanguage !== undefined) info.spokenLanguage = media.spokenLanguage;
  return info;
}

export function qrCheckInput(
  store: FakeStore,
  qr: FakeQrCode,
  checkpoint: FakeCheckpoint,
  source: 'current' | 'draft' = 'current',
): VisitPointCheckInput {
  const content = qrContent(store, qr, source);
  return {
    qrIdentifier: qr.qrIdentifier,
    displayName: visitPointName(content.objectName?.vi, qr.creationOrder),
    checkpointName: checkpointName(store, checkpoint),
    checkpointMode: savedMode(store, checkpoint),
    content,
    installationLabel: qr.installationLabel,
    media: mediaOfContent(store, content).map((media) => ({
      mediaId: media.mediaId,
      type: media.type,
      usageRightsConfirmed: media.usageRightsConfirmed,
      spokenLanguage: media.spokenLanguage,
    })),
  };
}

/** Mọi issue của điểm tham quan trên dữ liệu đã lưu (giá trị sai và khoảng trống xuất bản) */
export function qrIssues(
  store: FakeStore,
  qr: FakeQrCode,
  checkpoint: FakeCheckpoint,
  source: 'current' | 'draft' = 'current',
): ValidationIssue[] {
  const input = qrCheckInput(store, qr, checkpoint, source);
  return [...visitPointSaveIssues(input), ...visitPointPublishIssues(input)];
}

export function qrReadiness(store: FakeStore, qr: FakeQrCode, checkpoint: FakeCheckpoint): Readiness {
  return readinessOf(qrIssues(store, qr, checkpoint));
}

/** Điểm tham quan chưa thu hồi (BR-M03-E02: tối đa CHECKPOINT_QR_MAX_ITEMS) */
export function openQrCodesOf(store: FakeStore, checkpointId: string): FakeQrCode[] {
  return qrCodesOf(store, checkpointId).filter((qr) => qr.status !== 'THU_HOI');
}

export function checkpointIssues(store: FakeStore, checkpoint: FakeCheckpoint): ValidationIssue[] {
  const ready = openQrCodesOf(store, checkpoint.checkpointId).filter((qr) => qrReadiness(store, qr, checkpoint).ready);
  return checkpointPublishIssues(checkpoint.checkpointId, checkpointContent(store, checkpoint), ready.length);
}

/**
 * BR-M03-D04 điều 4: với điểm dừng `OFFLINE_REQUIRED`, mọi ảnh của các điểm tham quan sẽ xuất bản phải còn
 * trong Storage và đọc được. Câu thông báo không có tên tệp gốc (validation-report D-3, chọn b).
 */
export function unreadableImageIssues(
  store: FakeStore,
  checkpoint: FakeCheckpoint,
  items: readonly { qr: FakeQrCode; content: QrContent }[],
): ValidationIssue[] {
  if (savedMode(store, checkpoint) !== 'OFFLINE_REQUIRED') return [];
  return items.flatMap(({ qr, content }) => {
    const displayName = visitPointName(content.objectName?.vi, qr.creationOrder);
    const images = mediaOfContent(store, content).filter((media) => media.type === 'IMAGE');
    return images.flatMap((media, index) =>
      store.storage.has(media.sourceRef)
        ? []
        : [
            makeIssue({
              itemType: 'QRCODE',
              itemId: qr.qrIdentifier,
              severity: 'BLOCKS_PUBLISH',
              fieldKey: `images.${index}`,
              messageKey: 'MSG-IMAGE-NOT-READABLE',
              values: { 'tên tệp': `${displayName} – ảnh ${index + 1}` },
            }),
          ],
    );
  });
}

/** Điểm tham quan có âm thanh/video ở bản nháp hoặc bản đã xuất bản (MSG-MODE-HAS-AV) */
export function visitPointsWithAv(store: FakeStore, checkpointId: string): string[] {
  return openQrCodesOf(store, checkpointId)
    .filter((qr) =>
      [draftOf(store, 'QRCODE', qr.qrIdentifier), publishedOf(store, 'QRCODE', qr.qrIdentifier)].some(
        (rev) => rev && mediaOfContent(store, rev.content as QrContent).some((media) => media.type !== 'IMAGE'),
      ),
    )
    .map((qr) => qrDisplayName(store, qr));
}

/** Tuyến chưa lưu trữ có điểm dừng trong danh sách đã xuất bản hoặc bản nháp (BR-M03-F05, X03) */
export function routesListing(store: FakeStore, checkpointId: string) {
  return [...store.state.routes.values()]
    .filter((route) => route.status !== 'LUU_TRU')
    .filter((route) =>
      [draftOf(store, 'ROUTE', route.routeId), publishedOf(store, 'ROUTE', route.routeId)].some((rev) =>
        (rev?.content as RouteContent | undefined)?.checkpointList?.some((item) => item.checkpointId === checkpointId),
      ),
    )
    .map((route) => ({ routeId: route.routeId, routeName: route.name ?? '', routeStatus: route.status }));
}
