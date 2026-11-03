// Gợi ý tuyến (research R-13; FR-M01-004; BR-M01-003; DAC-M01-018): một giá trị mỗi nhóm trong ba nhóm tag; trả mọi
// tuyến chọn được chứa cả ba giá trị (set containment), 0..N kết quả, sắp A→Z; thiếu hoặc sai enum ở bất kỳ nhóm nào
// thì không chạy so khớp. Không chấm điểm, không nới tiêu chí. `RecommendationContext` là state tạm, không lưu (HC-007).
import type { LanguageCode } from '../../../shared/contracts/languagePreference';
import {
  experienceTag,
  groupTag,
  timeTag,
  type PublishedRoute,
} from '../../../shared/contracts/publishedRoute';
import { selectableRoutes } from '../catalog/selectableRoutes';

export type RecommendationCriteria = { time?: string; group?: string; experience?: string };

export type RecommendationResult = { kind: 'incomplete' } | { kind: 'results'; routes: PublishedRoute[] };

export function recommend(
  routes: readonly PublishedRoute[],
  criteria: RecommendationCriteria,
  language: LanguageCode,
): RecommendationResult {
  const time = timeTag.safeParse(criteria.time);
  const group = groupTag.safeParse(criteria.group);
  const experience = experienceTag.safeParse(criteria.experience);
  if (!time.success || !group.success || !experience.success) return { kind: 'incomplete' };
  return {
    kind: 'results',
    routes: selectableRoutes(routes, language).filter(
      (route) =>
        route.timeTags.includes(time.data) &&
        route.groupTags.includes(group.data) &&
        route.experienceTags.includes(experience.data),
    ),
  };
}
