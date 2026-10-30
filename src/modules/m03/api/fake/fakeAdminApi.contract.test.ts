import { describeAdminApiContract } from '../contract/harness';
import { mediaContract } from '../contract/media.contract';
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
  { store: storeContract, media: mediaContract },
  { fakeOnly: true },
);
