// Gợi ý tuyến (research R-13; FR-M01-004; BR-M01-003; DAC-M01-018; spec-M01 v3.3, CHG-REC-2026-11-28-01): bốn nhóm tag,
// mỗi nhóm 0..N giá trị. Trong một nhóm các giá trị là lựa chọn thay thế (HOẶC); giữa các nhóm có giá trị được chọn thì
// tuyến phải khớp mọi nhóm (VÀ); nhóm bỏ trống không lọc; không chọn gì thì trả mọi tuyến chọn được. 0..N kết quả, sắp
// A→Z. Không chấm điểm, không nới tiêu chí. Giá trị không hợp lệ bị bỏ qua. `RecommendationContext` là state tạm,
// không lưu (HC-007).
import type { LanguageCode } from '../../../shared/contracts/languagePreference';
import {
  experienceTag,
  groupTag,
  guideTag,
  timeTag,
  type PublishedRoute,
} from '../../../shared/contracts/publishedRoute';
import { selectableRoutes } from '../catalog/selectableRoutes';

export type RecommendationCriteria = {
  time?: readonly string[];
  group?: readonly string[];
  experience?: readonly string[];
  guide?: readonly string[];
};

export type RecommendationResult = { kind: 'results'; routes: PublishedRoute[] };

/** Giá trị hợp lệ, không trùng, theo thứ tự đã chọn */
function valid(values: readonly string[] | undefined, allowed: readonly string[]): string[] {
  return [...new Set((values ?? []).filter((value) => allowed.includes(value)))];
}

/** Tuyến khớp một nhóm: nhóm bỏ trống không lọc; có giá trị thì tuyến chứa ít nhất một giá trị đã chọn */
function matches(chosen: readonly string[], tags: readonly string[]): boolean {
  return chosen.length === 0 || chosen.some((value) => tags.includes(value));
}

export function recommend(
  routes: readonly PublishedRoute[],
  criteria: RecommendationCriteria,
  language: LanguageCode,
): RecommendationResult {
  const time = valid(criteria.time, timeTag.options);
  const group = valid(criteria.group, groupTag.options);
  const experience = valid(criteria.experience, experienceTag.options);
  const guide = valid(criteria.guide, guideTag.options);
  return {
    kind: 'results',
    routes: selectableRoutes(routes, language).filter(
      (route) =>
        matches(time, route.timeTags) &&
        matches(group, route.groupTags) &&
        matches(experience, route.experienceTags) &&
        matches(guide, route.guideTags),
    ),
  };
}

/** Có ít nhất một giá trị được chọn ở bất kỳ nhóm nào (hiện "Bỏ chọn tất cả") */
export function hasAnyChoice(criteria: RecommendationCriteria): boolean {
  return Object.values(criteria).some((values) => (values?.length ?? 0) > 0);
}
