import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AdminServicesProvider } from '../api/AdminApiProvider';
import { createFakeServices } from '../api/fake/fakeAdminApi';
import { FIXTURE_ACCOUNTS } from '../api/fake/fixtures';
import { FakeStore } from '../api/fake/store';
import { UnsavedChangesDialog, useUnsavedChangesGuard } from '../editor/useUnsavedChangesGuard';
import { CurrentAdminProvider } from './CurrentAdminContext';
import { LoginPage } from './LoginPage';
import { SignOutButton } from './SignOutButton';

const inflight = vi.hoisted(() => ({ abortAll: vi.fn() }));
vi.mock('../api/inflight', async (importOriginal) => ({ ...(await importOriginal<object>()), ...inflight }));

function DirtyEditor() {
  const [dirty, setDirty] = useState(false);
  const guard = useUnsavedChangesGuard('editor', dirty);
  return (
    <>
      <h1>Biên tập tuyến</h1>
      <button type="button" onClick={() => setDirty(true)}>
        Gõ
      </button>
      <SignOutButton />
      <UnsavedChangesDialog guard={guard} />
    </>
  );
}

function setup() {
  const store = new FakeStore();
  store.signIn(FIXTURE_ACCOUNTS.CONTENT_STAFF.userId);
  const services = createFakeServices(store);
  const signOut = vi.spyOn(services.auth, 'signOut');
  const wrap = (element: React.ReactNode) => (
    <AdminServicesProvider services={services}>
      <CurrentAdminProvider>{element}</CurrentAdminProvider>
    </AdminServicesProvider>
  );
  const router = createMemoryRouter(
    [
      { path: '/admin/login', element: wrap(<LoginPage />) },
      { path: '/admin/edit', element: wrap(<DirtyEditor />) },
    ],
    { initialEntries: ['/admin/edit'] },
  );
  render(<RouterProvider router={router} />);
  return { store, router, signOut };
}

describe('Đăng xuất (auth-account §2.6; BR-M03-K06; SC-M03-040)', () => {
  it('có form chưa lưu → MSG-UNSAVED-CHANGES trước; ở lại thì vẫn đăng nhập', async () => {
    const { store, signOut } = setup();
    await userEvent.click(await screen.findByRole('button', { name: 'Gõ' }));
    await userEvent.click(screen.getByRole('button', { name: 'Đăng xuất' }));
    expect(
      await screen.findByRole('dialog', { name: 'Bạn có thay đổi chưa lưu. Rời trang sẽ mất các thay đổi này.' }),
    ).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Ở lại' }));
    expect(signOut).not.toHaveBeenCalled();
    expect(store.currentUserId).toBe(FIXTURE_ACCOUNTS.CONTENT_STAFF.userId);
  });

  it('rời đi → hủy request đang bay, signOut, về /admin/login; không ghi audit, không đổi tài khoản', async () => {
    const { store, router, signOut } = setup();
    const accountsBefore = structuredClone(store.state.accounts);
    await userEvent.click(await screen.findByRole('button', { name: 'Gõ' }));
    await userEvent.click(screen.getByRole('button', { name: 'Đăng xuất' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Rời đi' }));
    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
    expect(inflight.abortAll).toHaveBeenCalled();
    expect(router.state.location.pathname).toBe('/admin/login');
    expect(store.currentUserId).toBeNull();
    expect(store.audit).toHaveLength(0);
    expect(store.state.accounts).toEqual(accountsBefore);
    expect(await screen.findByRole('button', { name: 'Đăng nhập' })).toBeTruthy();
  });

  it('không có thay đổi chưa lưu → đăng xuất ngay', async () => {
    const { signOut, router } = setup();
    await userEvent.click(await screen.findByRole('button', { name: 'Đăng xuất' }));
    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
    expect(router.state.location.pathname).toBe('/admin/login');
  });
});
