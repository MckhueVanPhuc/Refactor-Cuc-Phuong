// Adapter giả của AdminApi (tasks T044): ghép các module fake theo khu vực. Khu vực nào chưa được story
// cài đặt thì báo rõ task sẽ cài; story thay phần `pending` bằng module thật của mình.
import { registerTestHooks } from '../../../../shared/testing/e2eHooks';
import type { AdminRole } from '../../contracts/adminDtos';
import type { AdminApi } from '../AdminApi';
import type { ContractControls } from '../contract/harness';
import { FIXTURE_ACCOUNTS, USER_WITHOUT_ACCOUNT } from './fixtures';
import { createFakeMediaArea } from './media';
import { FakeStore, type FailureKey } from './store';

export { FakeStore };

type ApiMethod = keyof AdminApi;

/** Khu vực chưa cài → task sẽ cài nó */
const PENDING_AREAS: Record<string, readonly ApiMethod[]> = {
  'accounts — T063 (US1)': [
    'getCurrentAdmin',
    'listAccounts',
    'changeAccountRole',
    'setAccountStatus',
    'inviteAccount',
    'resendInvitation',
    'linkInvitation',
  ],
  'checkpoints — T083 (US2)': [
    'saveCheckpointDraft',
    'saveVisitPointDraft',
    'discardUnpublished',
    'revokeVisitPoint',
    'recordReprint',
    'listCheckpoints',
    'getCheckpointEditor',
    'getVisitPointEditor',
  ],
  'publish — T084, T103, T119': ['publishUnit', 'openPublicationReview'],
  'routes — T102 (US3)': ['saveRouteDraft', 'listRoutes', 'getRouteEditor', 'listSelectableCheckpoints'],
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

function pendingArea(): Omit<AdminApi, 'uploadMedia' | 'getMediaUrl' | 'registerMedia'> {
  const entries = Object.entries(PENDING_AREAS).flatMap(([area, methods]) =>
    methods.map((method) => [
      method,
      () => Promise.reject(new Error(`Adapter giả chưa có ${method}: khu vực ${area}`)),
    ]),
  );
  return Object.fromEntries(entries) as Omit<AdminApi, 'uploadMedia' | 'getMediaUrl' | 'registerMedia'>;
}

export function createFakeAdminApi(store: FakeStore = new FakeStore()): AdminApi {
  return { ...pendingArea(), ...createFakeMediaArea(store) };
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
    failNext: (action, messageKey) => store.failNext(action, messageKey),
    holdLock: (key) => store.holdLock(key),
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
  });
}
