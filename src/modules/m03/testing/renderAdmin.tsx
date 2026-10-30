// Helper cho test component của M03: dựng cây `/admin/*` thật với dịch vụ giả dùng chung một FakeStore.
// Chỉ test import file này; nó không vào bundle ứng dụng.
import { render } from '@testing-library/react';
import { createMemoryRouter, createRoutesFromElements, RouterProvider } from 'react-router';
import type { AdminRole } from '../contracts/adminDtos';
import { createFakeServices } from '../api/fake/fakeAdminApi';
import { FIXTURE_ACCOUNTS } from '../api/fake/fixtures';
import { FakeStore } from '../api/fake/store';
import { createM03Routes } from '../routes';

export type RenderAdminOptions = {
  store?: FakeStore;
  signedInAs?: AdminRole;
  /** state của entry đầu (ví dụ `{ expired: true }`) */
  state?: unknown;
};

export function renderAdmin(path: string, options: RenderAdminOptions = {}) {
  const store = options.store ?? new FakeStore();
  if (options.signedInAs) store.signIn(FIXTURE_ACCOUNTS[options.signedInAs].userId);
  const services = createFakeServices(store);
  const router = createMemoryRouter(createRoutesFromElements(createM03Routes(services)), {
    initialEntries: [{ pathname: path.split('?')[0]!, search: path.includes('?') ? `?${path.split('?')[1]}` : '', state: options.state }],
  });
  const view = render(<RouterProvider router={router} />);
  return { store, services, router, ...view };
}
