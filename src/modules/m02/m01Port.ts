// Cổng DUY NHẤT của M02 vào M01 (research R-05, D-01; FR-M02-020): chỉ re-export hàm đọc của src/modules/m01/index.ts.
// M02 không ghi store nào của M01; LanguageControl ghi qua writer nội bộ của M01 nên M01 vẫn là writer duy nhất.
// Test M02 thay file này bằng src/modules/m02/testing/fakeM01Port.ts (`vi.mock('…/m01Port', …)`); test kiến trúc
// (architecture.test.ts) kiểm không file M02 nào khác import M01.
export {
  findOfflineResource,
  LanguageControl,
  M01_HANDOFF_TABLES,
  readActiveOfflinePackage,
  readPackageImage,
  readSelectedRouteContext,
  resolveDisplayLanguage,
  useLanguagePreference,
  type SelectedRouteContextReadResult,
} from '../m01/index';
