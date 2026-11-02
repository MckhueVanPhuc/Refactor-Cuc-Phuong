// Start một tuyến (research R-09, R-11; FR-M01-011, 012, 013; BR-M01-010, 015). Trong Web Lock `cpq:m01:start`
// (`ifAvailable`): lần bấm lặp, kể cả ở tab khác, bị bỏ qua và không tạo context thứ hai. Chọn đường → dựng →
// validate → một transaction ghi → chỉ sau commit mới điều hướng sang M02. Lỗi không điều hướng, không đổi context cũ.
import { PATHS } from '../../../app/paths';
import type { LockManagerLike } from '../../../app/pwa/updateCoordinator';
import type { SourceClient } from '../api/sourceClient';
import { writeSelectedRouteContext } from '../storage/contextWriter';
import { buildContext } from './buildContext';
import { chooseStartPath, type StartBlockReason } from './chooseStartPath';

export const START_LOCK = 'cpq:m01:start';

export type StartResult =
  | { kind: 'started' }
  /** Một Start khác đang chạy (cùng tab hoặc tab khác) */
  | { kind: 'busy' }
  | { kind: 'blocked'; reason: StartBlockReason }
  | { kind: 'failed' };

export function createStartRoute({
  source,
  locks,
  now = () => new Date(),
}: {
  source: Pick<SourceClient, 'fetchRoute' | 'fetchActiveSnapshot'>;
  locks: LockManagerLike | undefined;
  now?: () => Date;
}) {
  // Mutex trong tab: luôn có, kể cả trình duyệt không có Web Locks (research R-09)
  let running = false;

  async function run(routeId: string, navigate: (path: string) => unknown): Promise<StartResult> {
    const path = await chooseStartPath(source, routeId);
    if (path.kind === 'blocked') return path;
    try {
      await writeSelectedRouteContext(buildContext(path.manifest, { now: now() }));
    } catch {
      return { kind: 'failed' };
    }
    await navigate(PATHS.m02SessionEntry);
    return { kind: 'started' };
  }

  return async function startRoute(routeId: string, navigate: (path: string) => unknown): Promise<StartResult> {
    if (running) return { kind: 'busy' };
    running = true;
    try {
      if (!locks) return await run(routeId, navigate);
      return await locks.request(START_LOCK, { mode: 'exclusive', ifAvailable: true }, (lock) =>
        lock ? run(routeId, navigate) : ({ kind: 'busy' } as const),
      );
    } finally {
      running = false;
    }
  };
}

/** Web Locks của trình duyệt, nếu có. */
export function browserLocks(): LockManagerLike | undefined {
  if (typeof navigator === 'undefined' || !navigator.locks) return undefined;
  const lockManager = navigator.locks;
  return {
    request: (name, options, callback) =>
      lockManager.request(name, options, (lock) => callback(lock ? { name: lock.name, mode: lock.mode } : null)),
  };
}
