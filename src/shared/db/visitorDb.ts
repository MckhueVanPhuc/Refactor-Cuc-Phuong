// Database IndexedDB duy nhất của phần du khách (research M01 R-07, P-01; Physical §11).
// Chuỗi version khai báo MỘT nơi cho cả M01 và M02: đổi schema phải tăng version chung tại đây,
// M02 không tạo database thứ hai. Version Dexie độc lập với VITE_APP_VERSION và contentVersion (environment.md §8).
// File này chỉ khai báo store; kiểu dòng và quyền ghi thuộc module sở hữu store (M01: src/modules/m01/storage/,
// M02: package 002), lấy bảng có kiểu bằng `visitorDb.table<Row, Key>(tên)`.
import Dexie from 'dexie';

export const VISITOR_DB_NAME = 'cuc-phuong-quest';

/** Version 1 — chép 1:1 data-model M01 §4 (`&` = unique, `[a+b]` = compound). */
export const VISITOR_DB_SCHEMA_V1 = {
  // M01 — entity
  languagePreference: 'slot',
  selectedRouteContext: 'slot, &handoffId',
  offlinePackages: '[routeId+contentVersion], routeId',
  offlineResources: '[routeId+contentVersion+qrIdentifier], [routeId+contentVersion], qrIdentifier',
  // M01 — kỹ thuật
  activePackages: 'routeId',
  packageCandidates: 'routeId',
  imageBytes: '[routeId+contentVersion+sourceRef], [routeId+contentVersion]',
  // M02
  playSessions: 'sessionId, &sourceHandoffId, status',
  checkpointVisits: '[sessionId+checkpointId], sessionId',
  pendingSyncItems: 'sessionId, syncStatus',
} as const;

export type VisitorStoreName = keyof typeof VISITOR_DB_SCHEMA_V1;

export const visitorDb = new Dexie(VISITOR_DB_NAME);
visitorDb.version(1).stores(VISITOR_DB_SCHEMA_V1);
