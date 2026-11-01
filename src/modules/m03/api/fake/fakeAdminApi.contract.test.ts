import { describeAdminApiContract } from '../contract/harness';
import { accountsContract } from '../contract/accounts.contract';
import { checkpointsContract } from '../contract/checkpoints.contract';
import { publishReviseContract } from '../contract/publish-revise.contract';
import { publishRouteContract } from '../contract/publish-route.contract';
import { auditContract } from '../contract/audit.contract';
import { historyContract } from '../contract/history.contract';
import { mediaContract } from '../contract/media.contract';
import { operationsContract } from '../contract/operations.contract';
import { storeContract } from '../contract/store.contract';
import { createFakeAdminApi, createFakeControls } from './fakeAdminApi';
import { FakeStore } from './store';

// Chạy bộ test hành vi dùng chung với adapter giả. T197 chạy lại y nguyên các suite này với adapter Supabase.
describeAdminApiContract(
  'adapter giả',
  () => {
    const store = new FakeStore();
    return { api: createFakeAdminApi(store), controls: createFakeControls(store) };
  },
  { store: storeContract, media: mediaContract, accounts: accountsContract, checkpoints: checkpointsContract, routes: publishRouteContract, revise: publishReviseContract, operations: operationsContract, history: historyContract, audit: auditContract },
  { fakeOnly: true },
);
