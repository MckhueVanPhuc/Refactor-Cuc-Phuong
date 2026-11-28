// Published Route projection (M03 → M01) — publication-public-contract §2; spec-M03 §5.1.
// Chỉ kiểm shape/presence/enum/ràng buộc chéo; giới hạn độ dài là provisional và thuộc M03 limits.
import { z } from 'zod';
import { bilingualText, hasDuplicates, identifier, imageRef, nonEmptyText, positiveInt } from './common';

export const routeStatus = z.enum(['HOAT_DONG', 'TAM_DONG', 'LUU_TRU']);
export const difficulty = z.enum(['NHE', 'TRUNG_BINH', 'KHO']);
export const timeTag = z.enum(['TIME_NGAN', 'TIME_VUA', 'TIME_DAI']);
// spec-M03 v3.8 (CHG-REC-2026-11-28-01): GROUP_DI_THEO_DOAN thay GROUP_CAN_DE_DANG (nghỉ); thêm nhóm guideTags
export const groupTag = z.enum(['GROUP_CA_NHAN_NGUOI_LON', 'GROUP_GIA_DINH_CO_TRE', 'GROUP_DI_THEO_DOAN']);
export const experienceTag = z.enum(['INTEREST_THIEN_NHIEN_CHUP_ANH', 'INTEREST_TIM_HIEU', 'INTEREST_KHAM_PHA']);
export const guideTag = z.enum(['GUIDE_CO_HUONG_DAN_VIEN', 'GUIDE_TU_THAM_QUAN']);

export type TimeTag = z.infer<typeof timeTag>;

/** `timeTags` suy ra từ `durationMin`: ≤ 90 ngắn, 91–180 vừa, > 180 dài (BR-M03-C11). */
export function deriveTimeTag(durationMin: number): TimeTag {
  if (durationMin <= 90) return 'TIME_NGAN';
  if (durationMin <= 180) return 'TIME_VUA';
  return 'TIME_DAI';
}

function distinctNonEmpty<T extends z.ZodType>(item: T) {
  return z
    .array(item)
    .min(1)
    .refine((values) => !hasDuplicates(values), { message: 'giá trị bị lặp' });
}

const hasOneDecimal = (value: number) => Math.abs(value * 10 - Math.round(value * 10)) < 1e-9;

export const checkpointSummary = z.strictObject({
  checkpointId: identifier,
  sequence: positiveInt,
  checkpointName: bilingualText,
});

const publishedRouteObject = z.strictObject({
    routeId: identifier,
    status: routeStatus,
    name: bilingualText,
    shortDescription: bilingualText,
    description: bilingualText,
    startingPoint: bilingualText,
    thumbnail: z.strictObject({ sourceRef: nonEmptyText }),
    gallery: z.array(imageRef),
    routeMap: imageRef.optional(),
    participationRequirements: bilingualText.optional(),
    preparation: bilingualText.optional(),
    bestTime: bilingualText.optional(),
    safetyWarning: bilingualText.optional(),
    highlights: z.array(bilingualText),
    distanceKm: z.number().positive().refine(hasOneDecimal, { message: 'tối đa một chữ số thập phân' }),
    durationMin: positiveInt,
    difficulty,
    timeTags: z.array(timeTag).length(1),
    groupTags: distinctNonEmpty(groupTag),
    experienceTags: distinctNonEmpty(experienceTag),
    guideTags: distinctNonEmpty(guideTag),
    checkpointCount: z.number().int().min(0),
    hasOfflineRequiredCheckpoint: z.boolean(),
    hasOfflineRouteMap: z.boolean(),
    checkpointSummaries: z.array(checkpointSummary),
    activeContentVersion: positiveInt,
  });

/**
 * Nhóm tag phía consumer (spec-M01 v3.3 FR-M01-004, brief D9): bỏ giá trị M01 không biết thay vì loại cả tuyến; mảng vắng
 * (tuyến chưa có `guideTags` trong lúc chuyển giao) coi là rỗng. Chỉ M01 đọc dữ liệu công khai dùng dạng này.
 */
function tolerantTags<T extends z.ZodEnum>(item: T) {
  const known = new Set<unknown>(item.options);
  return z.preprocess(
    (value) => (value == null ? [] : Array.isArray(value) ? value.filter((v) => known.has(v)) : value),
    z.array(item).refine((values) => !hasDuplicates(values), { message: 'giá trị bị lặp' }),
  );
}

function checkRoute(route: z.infer<typeof publishedRouteObject>, ctx: z.RefinementCtx) {
    if (route.timeTags[0] !== deriveTimeTag(route.durationMin)) {
      ctx.addIssue({ code: 'custom', path: ['timeTags'], message: 'không khớp durationMin (BR-M03-C11)' });
    }
    const summaries = route.checkpointSummaries;
    if (summaries.length === 0 && route.status === 'HOAT_DONG') {
      ctx.addIssue({ code: 'custom', path: ['checkpointSummaries'], message: 'tuyến HOAT_DONG phải có điểm dừng' });
    }
    if (hasDuplicates(summaries.map((s) => s.checkpointId))) {
      ctx.addIssue({ code: 'custom', path: ['checkpointSummaries'], message: 'checkpointId bị lặp' });
    }
    if (summaries.some((s, i) => i > 0 && s.sequence <= summaries[i - 1]!.sequence)) {
      ctx.addIssue({ code: 'custom', path: ['checkpointSummaries'], message: 'phải sắp tăng dần theo sequence' });
    }
}

/** Shape đầy đủ M03 phải phát ra (producer, kiểm contract M03). */
export const publishedRouteSchema = publishedRouteObject.superRefine(checkRoute);

/** M01 đọc Published Route: như trên nhưng chịu tag lạ và `guideTags` vắng (brief D9). */
export const publishedRouteConsumerSchema = publishedRouteObject
  .extend({
    groupTags: tolerantTags(groupTag),
    experienceTags: tolerantTags(experienceTag),
    guideTags: tolerantTags(guideTag),
  })
  .superRefine(checkRoute);

export type PublishedRoute = z.infer<typeof publishedRouteSchema>;
