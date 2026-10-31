// Khoảng trống xuất bản của tuyến cho panel "Còn thiếu để xuất bản" và guard (tasks T106; BR-M03-C04, C06, C09,
// C14, T04, L03). Điểm dừng trong danh sách đã được xuất bản trước (BR-M03-C17), nên khoảng trống của điểm dừng
// và điểm tham quan không lặp lại ở đây; chỉ đếm điểm dừng đang hoạt động. Thứ tự theo các bước của editor.
import type { CheckpointStatus, DraftBilingual, RouteContent } from '../contracts/adminDtos';
import type { ValidationIssue } from '../contracts/validationIssue';
import { FIELD_LABELS } from '../messages/fieldLabels';
import { checkBilingual, checkRequired, checkRequiredBilingual, makeIssue } from './common';

export type RouteMediaState = { usageRightsConfirmed: boolean; fileName?: string | undefined };

export type RoutePublishContext = {
  /** Media của tuyến theo mediaId (cờ quyền sử dụng đã lưu hoặc trên form) */
  media: ReadonlyMap<string, RouteMediaState>;
  /** Trạng thái hiện tại của các điểm dừng trong danh sách */
  checkpoints: ReadonlyMap<string, { name: string; status: CheckpointStatus }>;
};

const target = (routeId: string) => ({ itemType: 'ROUTE' as const, itemId: routeId });

const hasText = (value: DraftBilingual | undefined) => Boolean(value?.vi?.trim() || value?.en?.trim());

/** Ảnh của tuyến theo thứ tự trên editor, kèm nhãn cho câu MSG-RIGHTS-NOT-CONFIRMED (validation-report D-16) */
export function routeImages(content: RouteContent): { mediaId: string; fieldKey: string; label: string }[] {
  return [
    ...(content.thumbnailMediaId
      ? [{ mediaId: content.thumbnailMediaId, fieldKey: 'thumbnailMediaId', label: FIELD_LABELS.ROUTE.thumbnailMediaId }]
      : []),
    ...(content.galleryItems ?? []).map((item, index) => ({
      mediaId: item.mediaId,
      fieldKey: `galleryItems.${index}`,
      label: `${FIELD_LABELS.ROUTE.galleryItems} ${index + 1}`,
    })),
    ...(content.routeMapMediaId
      ? [{ mediaId: content.routeMapMediaId, fieldKey: 'routeMapMediaId', label: FIELD_LABELS.ROUTE.routeMapMediaId }]
      : []),
  ];
}

export function routePublishIssues(routeId: string, content: RouteContent, context: RoutePublishContext): ValidationIssue[] {
  const at = target(routeId);
  const issues: ValidationIssue[] = [
    // Bước 1 "Thẻ tuyến"
    ...checkRequired({ ...at, fieldKey: 'thumbnailMediaId', value: content.thumbnailMediaId }),
    ...checkRequiredBilingual({ ...at, fieldKey: 'name', value: content.name }),
    ...checkRequiredBilingual({ ...at, fieldKey: 'shortDescription', value: content.shortDescription }),
    ...checkRequired({ ...at, fieldKey: 'distanceKm', value: content.distanceKm }),
    ...checkRequired({ ...at, fieldKey: 'durationMin', value: content.durationMin }),
    ...checkRequired({ ...at, fieldKey: 'difficulty', value: content.difficulty }),
    // Bước 2 "Chi tiết"
    ...checkRequiredBilingual({ ...at, fieldKey: 'description', value: content.description }),
    ...checkRequiredBilingual({ ...at, fieldKey: 'startingPoint', value: content.startingPoint }),
    ...(['participationRequirements', 'preparation', 'bestTime', 'safetyWarning'] as const).flatMap((fieldKey) =>
      checkBilingual({ ...at, fieldKey, value: content[fieldKey] }),
    ),
  ];
  if (!hasText(content.safetyWarning) && !content.noSafetyWarningConfirmed) {
    issues.push(makeIssue({ ...at, severity: 'BLOCKS_PUBLISH', fieldKey: 'safetyWarning.vi', messageKey: 'MSG-SAFETY-CONFIRM', values: {} }));
  }
  (content.galleryItems ?? []).forEach((item, index) => {
    issues.push(...withKey(checkBilingual({ ...at, fieldKey: 'galleryCaption', value: item.caption }), 'galleryCaption', `galleryCaption.${index}`));
  });
  issues.push(...checkBilingual({ ...at, fieldKey: 'routeMapCaption', value: content.routeMapCaption }));
  (content.highlights ?? []).forEach((item, index) => {
    issues.push(...withKey(checkBilingual({ ...at, fieldKey: 'highlights', value: item }), 'highlights', `highlights.${index}`));
  });
  for (const image of routeImages(content)) {
    const media = context.media.get(image.mediaId);
    if (media?.usageRightsConfirmed) continue;
    issues.push(
      makeIssue({
        ...at,
        severity: 'BLOCKS_PUBLISH',
        fieldKey: image.fieldKey,
        messageKey: 'MSG-RIGHTS-NOT-CONFIRMED',
        values: { 'tên tệp': media?.fileName ?? image.label },
      }),
    );
  }
  // Bước 3 "Nhãn"
  issues.push(
    ...checkRequired({ ...at, fieldKey: 'groupTags', value: content.groupTags }),
    ...checkRequired({ ...at, fieldKey: 'experienceTags', value: content.experienceTags }),
  );
  // Bước 4 "Điểm dừng": ít nhất một điểm dừng đang hoạt động (BR-M03-T04)
  const active = (content.checkpointList ?? []).some((item) => context.checkpoints.get(item.checkpointId)?.status === 'HOAT_DONG');
  if (!active) {
    issues.push(makeIssue({ ...at, severity: 'BLOCKS_PUBLISH', fieldKey: 'checkpointList', messageKey: 'MSG-NO-ACTIVE-CHECKPOINT', values: {} }));
  }
  return issues;
}

/** Đổi khóa trường của issue từ `base.vi` sang `base.{chỉ số}.vi` cho phần tử danh sách */
function withKey(issues: ValidationIssue[], base: string, indexed: string): ValidationIssue[] {
  return issues.map((issue) => ({ ...issue, targetFieldKey: issue.targetFieldKey.replace(base, indexed) }));
}
