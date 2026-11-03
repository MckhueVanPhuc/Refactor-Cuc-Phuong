// Thao tác gói Tải / Cập nhật / Xóa (research R-08, R-09, R-14; FR-M01-007…010). Mỗi thao tác trong Web Lock
// `cpq:m01:package:{routeId}` (`ifAvailable`): lặp lại, hai tab, Tải và Xóa đồng thời → chỉ một thao tác. Giữ
// `registerPackageOperation()` suốt thao tác để bản cập nhật app không áp giữa chừng (constitution VI).
import type { LockManagerLike } from '../../../app/pwa/updateCoordinator';
import type { MediaClient } from '../api/mediaClient';
import type { SourceClient } from '../api/sourceClient';
import { activateCandidate, beginCandidate, deletePackage, failCandidate, stageCandidate } from '../storage/packageWriter';
import { buildCandidate } from './buildCandidate';

export type PackageFailure = 'source' | 'download' | 'storage';

export type PackageOpResult =
  | { kind: 'ready' }
  | { kind: 'deleted' }
  /** Thao tác khác của tuyến đang chạy (cùng tab hoặc tab khác) */
  | { kind: 'busy' }
  | { kind: 'failed'; reason: PackageFailure };

export const packageLockName = (routeId: string) => `cpq:m01:package:${routeId}`;

export type PackageOps = ReturnType<typeof createPackageOps>;

export function createPackageOps({
  source,
  media,
  locks,
  registerPackageOperation,
  persistStorage,
}: {
  source: Pick<SourceClient, 'fetchRoute' | 'fetchActiveSnapshot'>;
  media: Pick<MediaClient, 'createSignedUrls' | 'fetchImageBlob'>;
  locks: LockManagerLike | undefined;
  registerPackageOperation: () => () => void;
  /** `navigator.storage.persist()`; không bắt buộc thành công (tech-stack §4) */
  persistStorage: () => Promise<boolean>;
}) {
  // Mutex trong tab theo tuyến: luôn có, kể cả trình duyệt không có Web Locks (research R-09)
  const running = new Set<string>();
  let persistRequested = false;

  async function exclusive(routeId: string, task: () => Promise<PackageOpResult>): Promise<PackageOpResult> {
    if (running.has(routeId)) return { kind: 'busy' };
    running.add(routeId);
    const release = registerPackageOperation();
    try {
      if (!locks) return await task();
      return await locks.request(packageLockName(routeId), { mode: 'exclusive', ifAvailable: true }, (lock) =>
        lock ? task() : ({ kind: 'busy' } as const),
      );
    } finally {
      release();
      running.delete(routeId);
    }
  }

  async function downloadTask(routeId: string): Promise<PackageOpResult> {
    if (!persistRequested) {
      persistRequested = true;
      await persistStorage().catch(() => false);
    }
    // Ghi candidate lỗi (quota, IndexedDB bị chặn) → lỗi lưu trữ, không reject ra màn
    let token: string;
    try {
      token = await beginCandidate(routeId);
    } catch {
      return { kind: 'failed', reason: 'storage' };
    }
    const fail = async (reason: PackageFailure): Promise<PackageOpResult> => {
      await failCandidate(routeId, token).catch(() => {});
      return { kind: 'failed', reason };
    };

    const route = await source.fetchRoute(routeId);
    if (route.kind !== 'OK' || !route.value) return fail('source');
    const readAt = new Date().toISOString();
    const snapshot = await source.fetchActiveSnapshot(routeId);
    if (snapshot.kind !== 'OK' || !snapshot.value) return fail('source');

    const built = await buildCandidate({ route: route.value, snapshot: snapshot.value, media, readAt });
    if (!built.ok) return fail(built.reason);
    try {
      if (!(await stageCandidate(routeId, token, built.staged))) return fail('storage');
      await activateCandidate(routeId, token);
    } catch {
      return fail('storage');
    }
    return { kind: 'ready' };
  }

  return {
    /** Tải lần đầu, tải lại, hoặc cập nhật lên version nguồn hiện hành (gói cũ vẫn active tới khi kích hoạt). */
    download: (routeId: string) => exclusive(routeId, () => downloadTask(routeId)),
    remove: (routeId: string) =>
      exclusive(routeId, async () => {
        await deletePackage(routeId);
        return { kind: 'deleted' };
      }),
  };
}
