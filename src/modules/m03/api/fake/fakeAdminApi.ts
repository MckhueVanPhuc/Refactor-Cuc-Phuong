// Adapter giả của AdminApi (tasks T044): ghép các module fake theo khu vực. Khu vực nào chưa được story
// cài đặt thì báo rõ task sẽ cài; story thay phần `pending` bằng module thật của mình.
import { registerTestHooks } from '../../../../shared/testing/e2eHooks';
import { createFakeAuthService } from '../../auth/fakeAuthService';
import type { AuthService } from '../../auth/authService';
import type { AdminRole, RouteContent } from '../../contracts/adminDtos';
import type { AdminApi } from '../AdminApi';
import type { ContractControls } from '../contract/harness';
import { createFakeAccountsArea } from './accounts';
import { createFakeCheckpointsArea } from './checkpoints';
import { reviseRoute, seedPublishedCheckpoint, seedPublishedRoute } from './e2eSeed';
import { FIXTURE_ACCOUNTS, USER_WITHOUT_ACCOUNT } from './fixtures';
import { publishedRouteOf, activeSnapshotOf } from './journey';
import { createFakeMediaArea } from './media';
import { createFakePublishArea } from './publish';
import { createFakeRoutesArea } from './routes';
import { FakeStore, type FailureKey } from './store';

export { FakeStore };

type ApiMethod = keyof AdminApi;

/** Khu vực chưa cài → task sẽ cài nó */
const PENDING_AREAS: Record<string, readonly ApiMethod[]> = {
  'operations — T135 (US6)': [
    'closeRoute',
    'closeCheckpoint',
    'closeRoutesListingCheckpoint',
    'reopenRoute',
    'reopenCheckpoint',
    'archiveRoute',
    'archiveCheckpoint',
    'getOperationImpact',
  ],
  'history — T148 (US8)': ['discardDraft', 'restoreRevision', 'getItemHistory', 'listAuditLog'],
  'reports — T157 (US9)': ['reportRpt01', 'reportRpt02'],
};

type ImplementedArea = ReturnType<typeof createFakeMediaArea> &
  ReturnType<typeof createFakeAccountsArea> &
  ReturnType<typeof createFakeCheckpointsArea> &
  ReturnType<typeof createFakePublishArea> &
  Omit<ReturnType<typeof createFakeRoutesArea>, 'discardRoute'>;

function pendingArea(): Omit<AdminApi, keyof ImplementedArea> {
  const entries = Object.entries(PENDING_AREAS).flatMap(([area, methods]) =>
    methods.map((method) => [
      method,
      () => Promise.reject(new Error(`Adapter giả chưa có ${method}: khu vực ${area}`)),
    ]),
  );
  return Object.fromEntries(entries) as Omit<AdminApi, keyof ImplementedArea>;
}

export function createFakeAdminApi(store: FakeStore = new FakeStore()): AdminApi {
  const checkpoints = createFakeCheckpointsArea(store);
  const { discardRoute, ...routes } = createFakeRoutesArea(store);
  return {
    ...pendingArea(),
    ...createFakeMediaArea(store),
    ...createFakeAccountsArea(store),
    ...checkpoints,
    ...routes,
    ...createFakePublishArea(store),
    // C-07 dùng chung cho tuyến, điểm dừng và QR
    discardUnpublished: (input) => (input.subjectType === 'ROUTE' ? discardRoute(input) : checkpoints.discardUnpublished(input)),
  };
}

/** AdminApi và AuthService giả dùng chung một store (một "backend" giả) */
export function createFakeServices(store: FakeStore = new FakeStore()): { api: AdminApi; auth: AuthService } {
  return { api: createFakeAdminApi(store), auth: createFakeAuthService(store) };
}

function seedRoute(store: FakeStore, name: string): string {
  const routeId = store.newId();
  store.state.routes.set(routeId, {
    routeId,
    name,
    status: 'NHAP',
    concurrencyRevision: 1,
    lastEditedByEmail: FIXTURE_ACCOUNTS.CONTENT_STAFF.email,
    lastEditedAt: store.now(),
  });
  return routeId;
}

function seedCheckpoint(store: FakeStore, name: string): string {
  const checkpointId = store.newId();
  store.state.checkpoints.set(checkpointId, {
    checkpointId,
    name,
    status: 'NHAP',
    concurrencyRevision: 1,
    lastEditedByEmail: FIXTURE_ACCOUNTS.CONTENT_STAFF.email,
    lastEditedAt: store.now(),
  });
  return checkpointId;
}

/** Điều khiển cho bộ test hành vi dùng chung (harness T043) */
export function createFakeControls(store: FakeStore): ContractControls {
  return {
    signInAs: async (role: AdminRole) => store.signIn(FIXTURE_ACCOUNTS[role].userId),
    signInWithoutAccount: async () => store.signIn(USER_WITHOUT_ACCOUNT),
    signOut: async () => store.signIn(null),
    auditRows: async () => store.audit.map(({ subjectId: _internal, ...row }) => row),
    seedRoute: async (name) => seedRoute(store, name),
    seedCheckpoint: async (name) => seedCheckpoint(store, name),
    seedAccount: async ({ email, role, status }) => {
      const userId = status === 'INVITATION_PENDING' ? null : `u-${store.newId(12)}`;
      store.state.accounts.set(email, {
        userId,
        email,
        role,
        status,
        concurrencyRevision: 1,
        lastChangedByEmail: FIXTURE_ACCOUNTS.REVIEWER.email,
        lastChangedAt: store.now(),
      });
      if (userId) store.auth.users.set(email, { userId, email, password: store.newId(16) });
    },
    failNext: (action, messageKey) => store.failNext(action, messageKey),
    holdLock: (key) => store.holdLock(key),
    queueQrIdentifiers: (ids) => store.queuedQrIdentifiers.push(...ids),
    removeStorageObject: (objectPath) => store.storage.delete(objectPath),
    inflateMedia: (mediaId, sizeBytes) => {
      const media = store.state.media.get(mediaId);
      if (media) media.fileSizeBytes = sizeBytes;
    },
    setCheckpointStatus: (checkpointId, status) => {
      const checkpoint = store.state.checkpoints.get(checkpointId);
      if (checkpoint) checkpoint.status = status;
    },
    readPublication: async (routeId) => publicationOf(store, routeId),
  };
}

/** Chạy `run` bằng tài khoản fixture của role cho trước rồi trả lại phiên hiện tại */
async function asAccount<T>(store: FakeStore, role: AdminRole, run: (api: AdminApi) => Promise<T>): Promise<T> {
  const previous = store.currentUserId;
  store.currentUserId = FIXTURE_ACCOUNTS[role].userId;
  try {
    return await run(createFakeAdminApi(store));
  } finally {
    store.currentUserId = previous;
  }
}

/** Những gì M01 đọc được của một tuyến (thay cho view `api.published_routes`, `api.active_journey_snapshots`) */
function publicationOf(store: FakeStore, routeId: string) {
  const route = store.state.routes.get(routeId);
  return {
    route: publishedRouteOf(store, routeId),
    snapshot: (route && activeSnapshotOf(store, route)) ?? null,
  };
}

/** Namespace `m03` của `window.__cpqTestHooks` cho E2E trên `npm run dev:fake` (Q13, Q16, Q20) */
export function registerFakeTestHooks(store: FakeStore): void {
  registerTestHooks('m03', {
    signInAs: async (role: AdminRole) => store.signIn(FIXTURE_ACCOUNTS[role].userId),
    failNext: (action: string, messageKey?: FailureKey) => store.failNext(action, messageKey),
    holdLock: (key: string) => store.holdLock(key),
    releaseLock: (key: string) => store.releaseLock(key),
    seedRoute: (name: string) => seedRoute(store, name),
    seedCheckpoint: (name: string) => seedCheckpoint(store, name),
    /** Giả lập ảnh không đọc được (BR-M03-D04 điều 4) */
    removeStorageObject: (objectPath: string) => store.storage.delete(objectPath),
    /** Dòng Published Route và snapshot active của tuyến (quickstart Q12, Q13, Q15) */
    readPublication: (routeId: string) => publicationOf(store, routeId),
    /** Một điểm dừng đã xuất bản và hai tuyến đã xuất bản cùng liệt kê nó (quickstart Q14–Q17) */
    seedSharedRoutes: (checkpointName: string, routeA: string, routeB: string) =>
      asAccount(store, 'CONTENT_STAFF', async (api) => {
        const checkpointId = await seedPublishedCheckpoint(api, checkpointName);
        const routeIds = [await seedPublishedRoute(api, routeA, [checkpointId]), await seedPublishedRoute(api, routeB, [checkpointId])];
        return { checkpointId, routeIds };
      }),
    /** Một phiên khác (role cho trước) lưu bản nháp chờ của tuyến (quickstart Q14) */
    reviseRouteAs: (role: AdminRole, routeId: string, change: Partial<RouteContent>) =>
      asAccount(store, role, (api) => reviseRoute(api, routeId, change)),
    /** Giả lập dung lượng ghi nhận của media vừa đăng ký (quickstart Q17) */
    inflateLatestMedia: (sizeBytes: number) => {
      const latest = [...store.state.media.values()].at(-1);
      if (latest) latest.fileSizeBytes = sizeBytes;
    },
    /** Hộp thư giả của provider (thay Inbucket): link mời/khôi phục mới nhất cho email */
    latestMail: (email: string, kind: 'invite' | 'recovery') =>
      [...store.auth.outbox].reverse().find((mail) => mail.email === email && mail.kind === kind)?.link ?? null,
    /** Q-01 bằng phiên hiện tại — sau đăng xuất phải là null (quickstart Q5) */
    currentAdminEmail: () => store.currentAdmin()?.email ?? null,
  });
}
