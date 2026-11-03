// Khôi phục candidate mồ côi khi app khởi động (research R-08 "Khôi phục khi mở app"; quickstart V15): candidate
// `DANG_TAI` mà lock của tuyến đang trống (tab tải đã đóng) được xử lý như thao tác lỗi. Không có Web Locks thì mọi
// candidate `DANG_TAI` còn lại từ lần chạy trước đều coi là mồ côi (rủi ro hai tab ghi ở research R-09).
import type { LockManagerLike } from '../../../app/pwa/updateCoordinator';
import { failCandidate } from '../storage/packageWriter';
import { listPackageCandidates } from '../storage/readers';
import { browserLocks } from '../start/startRoute';
import { packageLockName } from './packageOps';

export async function recoverOrphans(locks: LockManagerLike | undefined): Promise<void> {
  const candidates = (await listPackageCandidates()).filter((candidate) => candidate.phase === 'DANG_TAI');
  for (const candidate of candidates) {
    const recover = () => failCandidate(candidate.routeId, candidate.operationToken);
    if (!locks) {
      await recover();
      continue;
    }
    await locks.request(packageLockName(candidate.routeId), { mode: 'exclusive', ifAvailable: true }, (lock) =>
      lock ? recover() : undefined,
    );
  }
}

/** Gọi khi shell khởi động (src/app/App.tsx). */
export function recoverM01Orphans(): Promise<void> {
  return recoverOrphans(browserLocks()).catch(() => {});
}
