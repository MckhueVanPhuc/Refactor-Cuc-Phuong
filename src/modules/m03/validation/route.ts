// Kiểm tra lúc lưu tuyến (tasks T104; BR-M03-C02, C03, C05, C12, C16, C09, T03, T09; spec-M03 §5.3).
// Hàm thuần dùng chung cho editor và adapter giả. Thiếu nội dung không bao giờ chặn lưu (BR-M03-C03).
import {
  CAPTION_MAX_CHARS,
  NAME_MAX_CHARS,
  ROUTE_BEST_TIME_MAX_CHARS,
  ROUTE_CHECKPOINTS_MAX_ITEMS,
  ROUTE_DESC_MAX_CHARS,
  ROUTE_DISTANCE_MAX_KM,
  ROUTE_DURATION_MAX_MIN,
  ROUTE_GALLERY_MAX_IMAGES,
  ROUTE_HIGHLIGHT_MAX_CHARS,
  ROUTE_PARTICIPATION_MAX_CHARS,
  ROUTE_PREPARATION_MAX_CHARS,
  ROUTE_SAFETY_WARNING_MAX_CHARS,
  ROUTE_SHORT_DESC_MAX_CHARS,
  ROUTE_START_MAX_CHARS,
} from '../config/limits';
import type { DraftBilingual, GroupTag, RouteContent } from '../contracts/adminDtos';
import type { ValidationIssue } from '../contracts/validationIssue';
import { DISPLAY_NAMES } from '../messages/displayNames';
import { checkNumber, checkText, makeIssue, stripLineBreaks } from './common';

export type RouteSaveContext = {
  /** Tên hiển thị của một điểm dừng trong danh sách (cho MSG-CHECKPOINT-DUPLICATE) */
  checkpointName: (checkpointId: string) => string;
};

/** Trường văn bản song ngữ và giới hạn của chúng (§5.3) */
export const ROUTE_TEXT_LIMITS = [
  ['name', NAME_MAX_CHARS],
  ['shortDescription', ROUTE_SHORT_DESC_MAX_CHARS],
  ['description', ROUTE_DESC_MAX_CHARS],
  ['startingPoint', ROUTE_START_MAX_CHARS],
  ['participationRequirements', ROUTE_PARTICIPATION_MAX_CHARS],
  ['preparation', ROUTE_PREPARATION_MAX_CHARS],
  ['bestTime', ROUTE_BEST_TIME_MAX_CHARS],
  ['safetyWarning', ROUTE_SAFETY_WARNING_MAX_CHARS],
] as const;

/** Nhãn nhóm không đi cùng độ khó Khó (BR-M03-C12) */
const CONFLICTS_WITH_HARD: readonly GroupTag[] = ['GROUP_GIA_DINH_CO_TRE', 'GROUP_CAN_DE_DANG'];

const target = (routeId: string) => ({ itemType: 'ROUTE' as const, itemId: routeId });

const oneLine = (value: DraftBilingual | undefined): DraftBilingual | undefined =>
  value && {
    ...(value.vi !== undefined ? { vi: stripLineBreaks(value.vi) } : {}),
    ...(value.en !== undefined ? { en: stripLineBreaks(value.en) } : {}),
  };

const hasText = (value: DraftBilingual | undefined) => Boolean(value?.vi?.trim() || value?.en?.trim());

/**
 * Chuẩn hóa trước khi lưu: trường một dòng bỏ CR/LF; nhãn là tập phân biệt; không còn sơ đồ thì bỏ tick
 * sơ đồ offline (BR-M03-C16); có cảnh báo an toàn thì tick "không có cảnh báo" về false (BR-M03-C09).
 */
export function normalizeRouteContent(content: RouteContent): RouteContent {
  const normalized: RouteContent = { ...content };
  for (const key of ['name', 'shortDescription', 'routeMapCaption'] as const) {
    const value = oneLine(content[key]);
    if (value) normalized[key] = value;
  }
  if (content.highlights) normalized.highlights = content.highlights.map((item) => oneLine(item) ?? {});
  if (content.galleryItems) {
    normalized.galleryItems = content.galleryItems.map((item) => {
      const caption = oneLine(item.caption);
      return caption ? { ...item, caption } : { mediaId: item.mediaId };
    });
  }
  if (content.groupTags) normalized.groupTags = [...new Set(content.groupTags)];
  if (content.experienceTags) normalized.experienceTags = [...new Set(content.experienceTags)];
  normalized.offlineRouteMapRequired = Boolean(content.routeMapMediaId) && content.offlineRouteMapRequired;
  normalized.noSafetyWarningConfirmed = !hasText(content.safetyWarning) && content.noSafetyWarningConfirmed;
  return normalized;
}

function bilingualLength(routeId: string, fieldKey: string, value: DraftBilingual | undefined, max: number) {
  return [
    ...checkText({ ...target(routeId), fieldKey: `${fieldKey}.vi`, value: value?.vi, max }),
    ...checkText({ ...target(routeId), fieldKey: `${fieldKey}.en`, value: value?.en, max }),
  ];
}

/** Giá trị sai rõ ràng — chặn lưu (BR-M03-L01) */
export function routeSaveIssues(routeId: string, content: RouteContent, context: RouteSaveContext): ValidationIssue[] {
  const at = target(routeId);
  const issues: ValidationIssue[] = ROUTE_TEXT_LIMITS.flatMap(([key, max]) => bilingualLength(routeId, key, content[key], max));
  (content.galleryItems ?? []).forEach((item, index) => {
    issues.push(...bilingualLength(routeId, `galleryCaption.${index}`, item.caption, CAPTION_MAX_CHARS));
  });
  issues.push(...bilingualLength(routeId, 'routeMapCaption', content.routeMapCaption, CAPTION_MAX_CHARS));
  (content.highlights ?? []).forEach((item, index) => {
    issues.push(...bilingualLength(routeId, `highlights.${index}`, item, ROUTE_HIGHLIGHT_MAX_CHARS));
  });

  issues.push(
    ...checkNumber({ ...at, fieldKey: 'distanceKm', value: content.distanceKm, max: ROUTE_DISTANCE_MAX_KM, unit: 'km', maxDecimals: 1 }),
    ...checkNumber({
      ...at,
      fieldKey: 'durationMin',
      value: content.durationMin,
      max: ROUTE_DURATION_MAX_MIN,
      unit: 'phút',
      maxDecimals: Number.POSITIVE_INFINITY,
    }),
  );

  if (content.difficulty === 'KHO') {
    const conflict = (content.groupTags ?? []).find((tag) => CONFLICTS_WITH_HARD.includes(tag));
    if (conflict) {
      issues.push(
        makeIssue({
          ...at,
          severity: 'BLOCKS_SAVE',
          fieldKey: 'groupTags',
          messageKey: 'MSG-TAG-CONFLICT',
          values: { 'độ khó': DISPLAY_NAMES.difficulty.KHO, nhãn: DISPLAY_NAMES.groupTag[conflict] },
        }),
      );
    }
  }

  if ((content.galleryItems ?? []).length > ROUTE_GALLERY_MAX_IMAGES) {
    issues.push(
      makeIssue({
        ...at,
        severity: 'BLOCKS_SAVE',
        fieldKey: 'galleryItems',
        messageKey: 'MSG-COUNT-IMAGES',
        values: { 'Tên điểm tham quan hoặc tên tuyến': content.name?.vi?.trim() ?? '', 'tối đa': ROUTE_GALLERY_MAX_IMAGES },
      }),
    );
  }

  const list = content.checkpointList ?? [];
  const seen = new Set<string>();
  const duplicates = list.filter(({ checkpointId }) => (seen.has(checkpointId) ? true : (seen.add(checkpointId), false)));
  for (const { checkpointId } of new Map(duplicates.map((item) => [item.checkpointId, item])).values()) {
    issues.push(
      makeIssue({
        ...at,
        severity: 'BLOCKS_SAVE',
        fieldKey: 'checkpointList',
        messageKey: 'MSG-CHECKPOINT-DUPLICATE',
        values: { tên: context.checkpointName(checkpointId) },
      }),
    );
  }
  if (list.length > ROUTE_CHECKPOINTS_MAX_ITEMS) {
    issues.push(
      makeIssue({
        ...at,
        severity: 'BLOCKS_SAVE',
        fieldKey: 'checkpointList',
        messageKey: 'MSG-LIMIT-CHECKPOINTS',
        values: { 'tối đa': ROUTE_CHECKPOINTS_MAX_ITEMS },
      }),
    );
  }
  return issues;
}
