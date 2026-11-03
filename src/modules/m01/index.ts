// Bề mặt công khai của M01 cho M02 (research R-07, R-12; P-02). M02 chỉ import từ file này (qua m01Port.ts).
// Chỉ hàm đọc đã validate; không export hàm ghi nào (FR-M01-013). LanguageControl ghi qua writer nội bộ của M01,
// nên M01 vẫn là writer duy nhất của LanguagePreference (BR-M01-001).
export { LanguageControl } from './language/LanguageControl';
export { resolveDisplayLanguage } from './language/resolveDisplayLanguage';
export { useLanguagePreference } from './language/useLanguagePreference';
export {
  findOfflineResource,
  M01_HANDOFF_TABLES,
  readActiveOfflinePackage,
  readLanguagePreference,
  readPackageImage,
  readSelectedRouteContext,
  type SelectedRouteContextReadResult,
} from './storage/readers';
