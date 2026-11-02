// Bề mặt công khai của M01 cho M02 (research R-07, R-12; P-02). M02 chỉ import từ file này (qua m01Port.ts).
// Chỉ hàm đọc đã validate; không export hàm ghi nào (FR-M01-013). Phần ngôn ngữ (LanguageControl,
// useLanguagePreference, resolveDisplayLanguage) thêm ở US1.
export {
  findOfflineResource,
  M01_HANDOFF_TABLES,
  readActiveOfflinePackage,
  readLanguagePreference,
  readPackageImage,
  readSelectedRouteContext,
  type SelectedRouteContextReadResult,
} from './storage/readers';
