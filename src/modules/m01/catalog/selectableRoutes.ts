// Tuyến chọn được của danh mục và gợi ý (BR-M01-002; DAC-M01-017; research R-13).
// Đầu vào là các dòng đã qua schema (adapter bỏ dòng hỏng), nên `activeContentVersion` luôn có giá trị.
import type { LanguageCode } from '../../../shared/contracts/languagePreference';
import type { PublishedRoute } from '../../../shared/contracts/publishedRoute';

/** Chỉ tuyến `HOAT_DONG`, sắp theo tên A→Z ở ngôn ngữ đang chọn (OQ-SCR-M01-001-001; không chấm điểm). */
export function selectableRoutes(routes: readonly PublishedRoute[], language: LanguageCode): PublishedRoute[] {
  const collator = new Intl.Collator(language);
  return routes
    .filter((route) => route.status === 'HOAT_DONG')
    .sort((a, b) => collator.compare(a.name[language], b.name[language]));
}

/** Dấu "cần tải trước" khi một trong hai cờ là `true`; snapshot tải về mới là nguồn quyết định cuối (BR-M01-012). */
export function needsOfflinePackageMark(route: PublishedRoute): boolean {
  return route.hasOfflineRequiredCheckpoint || route.hasOfflineRouteMap;
}
