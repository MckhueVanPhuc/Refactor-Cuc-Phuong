// Bảng có kiểu của bảy store M01 trên database dùng chung (research R-07). Chỉ code trong src/modules/m01/storage/
// được dùng file này; test kiến trúc kiểm điều đó (tasks T027).
import type { Table } from 'dexie';
import { visitorDb } from '../../../shared/db/visitorDb';
import type {
  ActivePackageRow,
  ImageBytesRow,
  LanguagePreferenceRow,
  OfflinePackageRow,
  OfflineResourceRow,
  PackageCandidateRow,
  SelectedRouteContextRow,
  Slot,
} from './rows';

export const languagePreferenceTable: Table<LanguagePreferenceRow, Slot> = visitorDb.table('languagePreference');
export const selectedRouteContextTable: Table<SelectedRouteContextRow, Slot> = visitorDb.table('selectedRouteContext');
export const offlinePackagesTable: Table<OfflinePackageRow, [string, number]> = visitorDb.table('offlinePackages');
export const offlineResourcesTable: Table<OfflineResourceRow, [string, number, string]> = visitorDb.table('offlineResources');
export const activePackagesTable: Table<ActivePackageRow, string> = visitorDb.table('activePackages');
export const packageCandidatesTable: Table<PackageCandidateRow, string> = visitorDb.table('packageCandidates');
export const imageBytesTable: Table<ImageBytesRow, [string, number, string]> = visitorDb.table('imageBytes');

/** Bốn store mà một gói sẵn sàng được lắp từ (offline-package-contract §2). */
export const PACKAGE_READ_TABLES = [activePackagesTable, offlinePackagesTable, offlineResourcesTable, imageBytesTable];
