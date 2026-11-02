// Hàm đọc của M01 (research R-07; data-model §5.2; FR-M01-005, 013). Mỗi hàm lắp dòng thành giá trị contract,
// validate bằng schema dùng chung rồi trả giá trị hoặc kết quả "không có". Không hàm nào đọc `packageCandidates`
// cho M02. Các hàm dùng bảng của visitorDb trực tiếp và không await gì ngoài Dexie, nên chạy được bên trong
// transaction bao ngoài của M02 (M02 research R-05: kiểm "chưa dùng" và tạo phiên phải nguyên tử).
import { languagePreferenceSchema, type LanguagePreference } from '../../../shared/contracts/languagePreference';
import { offlinePackageSchema, type OfflinePackage, type OfflineResource } from '../../../shared/contracts/offlinePackage';
import {
  selectedRouteContextV3Schema,
  type SelectedRouteContextV3,
} from '../../../shared/contracts/selectedRouteContext';
import { visitorDb, type VisitorStoreName } from '../../../shared/db/visitorDb';
import { CURRENT_SLOT, type ActivePackageRow, type PackageCandidateRow } from './rows';
import {
  activePackagesTable,
  imageBytesTable,
  languagePreferenceTable,
  offlinePackagesTable,
  offlineResourcesTable,
  PACKAGE_READ_TABLES,
  packageCandidatesTable,
  selectedRouteContextTable,
} from './tables';

/** Store M02 cần đưa vào phạm vi transaction tạo phiên khi gọi `readSelectedRouteContext()` (không ghi tên store M01). */
export const M01_HANDOFF_TABLES = ['selectedRouteContext'] as const satisfies readonly VisitorStoreName[];

export type SelectedRouteContextReadResult =
  | { kind: 'NONE' }
  | { kind: 'INVALID' }
  | { kind: 'OK'; value: SelectedRouteContextV3 };

function withoutSlot(row: object): Record<string, unknown> {
  const { slot: _slot, ...value } = row as Record<string, unknown>;
  return value;
}

export async function readLanguagePreference(): Promise<LanguagePreference | null> {
  const row = await languagePreferenceTable.get(CURRENT_SLOT);
  if (!row) return null;
  const result = languagePreferenceSchema.safeParse(withoutSlot(row));
  return result.success ? result.data : null;
}

/** Store trống → `NONE`; có dòng nhưng không qua schema (gồm version 2) → `INVALID`; hợp lệ → `OK` (D-01). */
export async function readSelectedRouteContext(): Promise<SelectedRouteContextReadResult> {
  const row = await selectedRouteContextTable.get(CURRENT_SLOT);
  if (!row) return { kind: 'NONE' };
  const result = selectedRouteContextV3Schema.safeParse(withoutSlot(row));
  return result.success ? { kind: 'OK', value: result.data } : { kind: 'INVALID' };
}

/** Mọi tham chiếu ảnh khai báo của gói: `staticImages[]` của mọi resource và `offlineRouteMap.sourceRef`. */
export function declaredImageRefs(pkg: Pick<OfflinePackage, 'resources' | 'offlineRouteMap'>): string[] {
  const refs = pkg.resources.flatMap((resource) => resource.staticImages);
  if (pkg.offlineRouteMap) refs.push(pkg.offlineRouteMap.sourceRef);
  return [...new Set(refs)];
}

const hasBytes = (blob: Blob | undefined) => blob !== undefined && typeof blob.size === 'number' && blob.size > 0;

/** Lắp gói của một con trỏ; không hợp lệ, không `SAN_SANG` hay thiếu byte → `null`. Gọi trong transaction đọc gói. */
async function assemblePackage(pointer: ActivePackageRow): Promise<OfflinePackage | null> {
  const key = [pointer.routeId, pointer.contentVersion] as const;
  const row = await offlinePackagesTable.get([...key]);
  if (!row) return null;
  const resourceRows = await offlineResourcesTable.where('[routeId+contentVersion]').equals([...key]).toArray();
  const resources = resourceRows.map(({ routeId: _routeId, contentVersion: _contentVersion, ...resource }) => resource);
  const result = offlinePackageSchema.safeParse({ ...row, resources });
  if (!result.success || result.data.status !== 'SAN_SANG') return null;
  const pkg = result.data;
  if (pkg.routeId !== pointer.routeId || pkg.contentVersion !== pointer.contentVersion) return null;
  const refs = declaredImageRefs(pkg);
  const images = await imageBytesTable.bulkGet(refs.map((sourceRef) => [...key, sourceRef]));
  if (!images.every((image) => hasBytes(image?.blob))) return null;
  return pkg;
}

/** Gói `SAN_SANG` active của tuyến; không có con trỏ, không qua schema, thiếu byte → `null` (FR-M01-005). */
export async function readActiveOfflinePackage(routeId: string): Promise<OfflinePackage | null> {
  return visitorDb.transaction('r', PACKAGE_READ_TABLES, async () => {
    const pointer = await activePackagesTable.get(routeId);
    return pointer ? assemblePackage(pointer) : null;
  });
}

/** Resource có `qrIdentifier` trong gói active (đọc được) của tuyến. */
export async function findOfflineResource(routeId: string, qrIdentifier: string): Promise<OfflineResource | null> {
  const pkg = await readActiveOfflinePackage(routeId);
  return pkg?.resources.find((resource) => resource.qrIdentifier === qrIdentifier) ?? null;
}

/** Byte ảnh của gói active; `contentVersion` không phải gói active hoặc không có byte → `null`. */
export async function readPackageImage(routeId: string, contentVersion: number, sourceRef: string): Promise<Blob | null> {
  return visitorDb.transaction('r', [activePackagesTable, imageBytesTable], async () => {
    const pointer = await activePackagesTable.get(routeId);
    if (pointer?.contentVersion !== contentVersion) return null;
    const image = await imageBytesTable.get([routeId, contentVersion, sourceRef]);
    return image && hasBytes(image.blob) ? image.blob : null;
  });
}

/** Trạng thái thao tác gói hiển thị ở SCR-M01-004; không mang dữ liệu staged. */
export type PackageCandidateStatus = Pick<PackageCandidateRow, 'phase' | 'startedAt' | 'failedAt' | 'targetContentVersion'>;

export type PackageEntry = {
  routeId: string;
  /** Gói active theo con trỏ; `pkg = null` khi gói không đọc được ("Gói tải trước không đọc được") */
  active: { contentVersion: number; pkg: OfflinePackage | null } | null;
  candidate: PackageCandidateStatus | null;
};

/** Danh sách gói và thao tác gói theo tuyến cho SCR-M01-004 (nội bộ M01, không export cho M02). */
export async function listPackageEntries(): Promise<PackageEntry[]> {
  return visitorDb.transaction('r', [...PACKAGE_READ_TABLES, packageCandidatesTable], async () => {
    const pointers = await activePackagesTable.toArray();
    const candidates = await packageCandidatesTable.toArray();
    const routeIds = [...new Set([...pointers, ...candidates].map((row) => row.routeId))].sort();
    const entries: PackageEntry[] = [];
    for (const routeId of routeIds) {
      const pointer = pointers.find((row) => row.routeId === routeId);
      const candidate = candidates.find((row) => row.routeId === routeId);
      entries.push({
        routeId,
        active: pointer ? { contentVersion: pointer.contentVersion, pkg: await assemblePackage(pointer) } : null,
        candidate: candidate
          ? {
              phase: candidate.phase,
              startedAt: candidate.startedAt,
              ...(candidate.failedAt !== undefined && { failedAt: candidate.failedAt }),
              ...(candidate.targetContentVersion !== undefined && { targetContentVersion: candidate.targetContentVersion }),
            }
          : null,
      });
    }
    return entries;
  });
}
