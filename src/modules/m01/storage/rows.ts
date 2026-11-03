// Kiểu dòng Dexie của M01 (data-model §2–§3; Physical §11). Transport ≠ canonical (research R-04):
// dòng có `slot`, dòng gói không mang `resources[]` (quan hệ REL-012 ở store `offlineResources`), byte ảnh ở `imageBytes`.
// Hàm đọc lắp các dòng lại thành giá trị contract rồi validate trước khi trả.
import type { LanguagePreference } from '../../../shared/contracts/languagePreference';
import type { OfflinePackage, OfflineResource } from '../../../shared/contracts/offlinePackage';
import type { SelectedRouteContextV3 } from '../../../shared/contracts/selectedRouteContext';

/** Khóa singleton của `languagePreference` và `selectedRouteContext` (Physical §11). */
export const CURRENT_SLOT = 'current';
export type Slot = typeof CURRENT_SLOT;

export type LanguagePreferenceRow = LanguagePreference & { slot: Slot };

export type SelectedRouteContextRow = SelectedRouteContextV3 & { slot: Slot };

/** Dòng `offlinePackages`: chỉ tồn tại cho gói `SAN_SANG` (research R-08); `resources[]` nằm ở `offlineResources`. */
export type OfflinePackageRow = Omit<OfflinePackage, 'resources'>;

export type OfflineResourceRow = OfflineResource & { routeId: string; contentVersion: number };

/** Con trỏ tới gói `SAN_SANG` active duy nhất của tuyến (store kỹ thuật, plan decision R-08). */
export type ActivePackageRow = { routeId: string; contentVersion: number };

export type ImageBytesRow = { routeId: string; contentVersion: number; sourceRef: string; blob: Blob };

/** Bundle đã kiểm tra, ghi ở bước staging và chỉ dùng tới lúc kích hoạt (R-08 bước 4). */
export type StagedPackage = {
  pkg: OfflinePackageRow;
  resources: OfflineResourceRow[];
  images: { sourceRef: string; blob: Blob }[];
};

/**
 * Dòng `packageCandidates` (store kỹ thuật, plan decision R-08). `phase` dùng lại hai giá trị enum của
 * `OfflinePackage.status` để UI hiển thị, nhưng dòng này không phải dòng OfflinePackage và không bao giờ lộ cho M02.
 */
export type PackageCandidateRow = {
  routeId: string;
  operationToken: string;
  phase: 'DANG_TAI' | 'CHUA_HOAN_TAT';
  targetContentVersion?: number;
  startedAt: string;
  failedAt?: string;
  staged?: StagedPackage;
};
