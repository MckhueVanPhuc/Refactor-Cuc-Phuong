// Ghi gói offline (research R-08 bước 1, 4–6; R-10; offline-package-contract §4–§5). Mỗi hàm là một transaction
// ngắn; network nằm ngoài transaction (buildCandidate). Kích hoạt là MỘT transaction trên candidate, gói, resources,
// byte và con trỏ, chỉ nhận token hiện hành; lỗi bất kỳ (kể cả hết quota) → rollback, gói cũ nguyên vẹn (BR-M01-006).
import Dexie, { type Table } from 'dexie';
import { routeEssentialsSchema, type RouteEssentials } from '../../../shared/contracts/offlinePackage';
import { visitorDb } from '../../../shared/db/visitorDb';
import { consumeActivationFailure } from './faultInjection';
import type { StagedPackage } from './rows';
import {
  activePackagesTable,
  imageBytesTable,
  offlinePackagesTable,
  offlineResourcesTable,
  packageCandidatesTable,
} from './tables';

const ALL_PACKAGE_TABLES = [
  packageCandidatesTable,
  offlinePackagesTable,
  offlineResourcesTable,
  imageBytesTable,
  activePackagesTable,
];

const nowIso = () => new Date().toISOString();

/** Mọi dòng resources/byte của một tuyến (mọi version), theo index compound `[routeId+contentVersion]`. */
function byRoute<T>(table: Table<T, [string, number, string]>, routeId: string) {
  return table.where('[routeId+contentVersion]').between([routeId, Dexie.minKey], [routeId, Dexie.maxKey]);
}

async function deleteRouteData(routeId: string): Promise<void> {
  await offlinePackagesTable.where('routeId').equals(routeId).delete();
  await byRoute(offlineResourcesTable, routeId).delete();
  await byRoute(imageBytesTable, routeId).delete();
}

/** Bước 1: candidate `DANG_TAI` với token mới (thay candidate cũ của tuyến). */
export async function beginCandidate(routeId: string, targetContentVersion?: number): Promise<string> {
  const operationToken = crypto.randomUUID();
  await packageCandidatesTable.put({
    routeId,
    operationToken,
    phase: 'DANG_TAI',
    ...(targetContentVersion !== undefined && { targetContentVersion }),
    startedAt: nowIso(),
  });
  return operationToken;
}

/** Bước 4: ghi bundle đã kiểm tra vào candidate, chỉ khi token còn khớp. */
export async function stageCandidate(routeId: string, operationToken: string, staged: StagedPackage): Promise<boolean> {
  return visitorDb.transaction('rw', packageCandidatesTable, async () => {
    const candidate = await packageCandidatesTable.get(routeId);
    if (candidate?.operationToken !== operationToken || candidate.phase !== 'DANG_TAI') return false;
    await packageCandidatesTable.put({ ...candidate, staged });
    return true;
  });
}

/** Bước 5: kích hoạt nguyên tử. Ném lỗi khi token không khớp, chưa staging hoặc ghi lỗi (transaction rollback). */
export async function activateCandidate(routeId: string, operationToken: string): Promise<void> {
  await visitorDb.transaction('rw', ALL_PACKAGE_TABLES, async () => {
    const candidate = await packageCandidatesTable.get(routeId);
    if (candidate?.operationToken !== operationToken || candidate.phase !== 'DANG_TAI' || !candidate.staged) {
      throw new Error('candidate không còn hiệu lực');
    }
    const { pkg, resources, images } = candidate.staged;
    const key = { routeId, contentVersion: pkg.contentVersion };
    await deleteRouteData(routeId);
    await offlinePackagesTable.put({ ...pkg, status: 'SAN_SANG', versionStatus: 'CURRENT', downloadedAt: nowIso() });
    await offlineResourcesTable.bulkPut(resources.map((resource) => ({ ...resource, ...key })));
    await imageBytesTable.bulkPut(images.map((image) => ({ ...key, ...image })));
    await activePackagesTable.put(key);
    await packageCandidatesTable.delete(routeId);
    // Tiêm lỗi cho kiểm thử (V12): như trình duyệt báo hết quota giữa transaction
    if (consumeActivationFailure()) throw new DOMException('Hết dung lượng lưu trữ (kiểm thử)', 'QuotaExceededError');
  });
}

/**
 * Bước 6: thao tác lỗi. Có gói `SAN_SANG` → bỏ candidate, gói cũ giữ nguyên; chưa có → candidate `CHUA_HOAN_TAT`
 * không còn dữ liệu staged. Token cũ hơn thao tác hiện tại thì không làm gì.
 */
export async function failCandidate(routeId: string, operationToken: string): Promise<void> {
  await visitorDb.transaction('rw', [packageCandidatesTable, activePackagesTable], async () => {
    const candidate = await packageCandidatesTable.get(routeId);
    if (candidate && candidate.operationToken !== operationToken) return;
    if (await activePackagesTable.get(routeId)) {
      await packageCandidatesTable.delete(routeId);
      return;
    }
    await packageCandidatesTable.put({
      routeId,
      operationToken,
      phase: 'CHUA_HOAN_TAT',
      ...(candidate?.targetContentVersion !== undefined && { targetContentVersion: candidate.targetContentVersion }),
      startedAt: candidate?.startedAt ?? nowIso(),
      failedAt: nowIso(),
    });
  });
}

/** Xóa gói của tuyến (FR-M01-009): con trỏ, gói, resources, byte, candidate; giữ context và dữ liệu M02. */
export async function deletePackage(routeId: string): Promise<void> {
  await visitorDb.transaction('rw', ALL_PACKAGE_TABLES, async () => {
    await activePackagesTable.delete(routeId);
    await packageCandidatesTable.delete(routeId);
    await deleteRouteData(routeId);
  });
}

/** Nguồn có version lớn hơn gói active → `OUTDATED` (FR-M01-010; research R-10). */
export async function markOutdated(routeId: string, sourceContentVersion: number): Promise<void> {
  await visitorDb.transaction('rw', [activePackagesTable, offlinePackagesTable], async () => {
    const pointer = await activePackagesTable.get(routeId);
    if (!pointer || pointer.contentVersion >= sourceContentVersion) return;
    const row = await offlinePackagesTable.get([routeId, pointer.contentVersion]);
    if (row && row.versionStatus !== 'OUTDATED') await offlinePackagesTable.put({ ...row, versionStatus: 'OUTDATED' });
  });
}

/**
 * Thay `routeEssentials` nguyên khối sau một lần đọc nguồn thành công, chỉ khi gói active vẫn là version đó
 * (FR-M01-014; research R-10). Essentials không hợp lệ → giữ bản cũ.
 */
export async function refreshEssentials(routeId: string, contentVersion: number, essentials: RouteEssentials): Promise<boolean> {
  const parsed = routeEssentialsSchema.safeParse(essentials);
  if (!parsed.success) return false;
  return visitorDb.transaction('rw', [activePackagesTable, offlinePackagesTable], async () => {
    const pointer = await activePackagesTable.get(routeId);
    if (pointer?.contentVersion !== contentVersion) return false;
    const row = await offlinePackagesTable.get([routeId, contentVersion]);
    if (!row) return false;
    await offlinePackagesTable.put({ ...row, routeEssentials: parsed.data });
    return true;
  });
}
