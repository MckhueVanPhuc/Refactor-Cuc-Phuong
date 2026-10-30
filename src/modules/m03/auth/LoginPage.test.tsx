import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EMAIL_WITHOUT_ACCOUNT, FIXTURE_ACCOUNTS, FIXTURE_LOCKED, FIXTURE_PASSWORD } from '../api/fake/fixtures';
import { FakeStore } from '../api/fake/store';
import { renderAdmin } from '../testing/renderAdmin';

async function login(email: string, password = FIXTURE_PASSWORD) {
  await userEvent.type(await screen.findByLabelText('Email'), email);
  await userEvent.type(screen.getByLabelText('Mật khẩu'), password);
  await userEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
}

const DENIED = 'Tài khoản này chưa được phép vào hệ thống. Hãy nhờ quản lý.';

describe('SCR-M03-000 Đăng nhập (auth-account §2.1; BR-M03-A04, K05; SC-M03-009)', () => {
  it('tài khoản ACTIVE → vào /admin/routes', async () => {
    const { router } = renderAdmin('/admin/login');
    await login(FIXTURE_ACCOUNTS.CONTENT_STAFF.email);
    expect(await screen.findByRole('heading', { level: 1, name: 'Quản trị tuyến' })).toBeTruthy();
    expect(router.state.location.pathname).toBe('/admin/routes');
  });

  it.each([
    ['không có tài khoản', EMAIL_WITHOUT_ACCOUNT],
    ['tài khoản DEACTIVATED', FIXTURE_LOCKED.email],
  ])('%s → signOut local + MSG-LOGIN-DENIED', async (_label, email) => {
    const { services, store } = renderAdmin('/admin/login');
    const signOut = vi.spyOn(services.auth, 'signOut');
    await login(email);
    expect((await screen.findByRole('alert')).textContent).toBe(DENIED);
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(store.currentUserId).toBeNull();
  });

  it('tài khoản INVITATION_PENDING → MSG-LOGIN-DENIED', async () => {
    const store = new FakeStore();
    store.state.accounts.set(EMAIL_WITHOUT_ACCOUNT, {
      userId: null,
      email: EMAIL_WITHOUT_ACCOUNT,
      role: 'CONTENT_STAFF',
      status: 'INVITATION_PENDING',
      concurrencyRevision: 1,
      lastChangedByEmail: FIXTURE_ACCOUNTS.REVIEWER.email,
      lastChangedAt: store.now(),
    });
    renderAdmin('/admin/login', { store });
    await login(EMAIL_WITHOUT_ACCOUNT);
    expect((await screen.findByRole('alert')).textContent).toBe(DENIED);
  });

  it('provider từ chối → MSG-LOGIN-FAILED, không nói rõ sai email hay mật khẩu', async () => {
    renderAdmin('/admin/login');
    await login(FIXTURE_ACCOUNTS.CONTENT_STAFF.email, 'sai-mat-khau');
    expect((await screen.findByRole('alert')).textContent).toBe('Email hoặc mật khẩu chưa đúng. Hãy kiểm tra lại.');
  });

  it('ô trống → không gửi cho provider, báo thiếu dưới ô', async () => {
    const { services } = renderAdmin('/admin/login');
    const signIn = vi.spyOn(services.auth, 'signInWithPassword');
    await userEvent.click(await screen.findByRole('button', { name: 'Đăng nhập' }));
    expect(signIn).not.toHaveBeenCalled();
    expect(screen.getByText('Lỗi: Còn thiếu: Email.')).toBeTruthy();
    expect(screen.getByText('Lỗi: Còn thiếu: Mật khẩu.')).toBeTruthy();
  });

  it('phiên hết hạn: thông báo trước form; đăng nhập xong quay lại trang cũ', async () => {
    const { router } = renderAdmin('/admin/login', { state: { expired: true, from: '/admin/checkpoints' } });
    expect((await screen.findByRole('status')).textContent).toBe('Phiên làm việc đã hết hạn. Hãy đăng nhập lại.');
    await login(FIXTURE_ACCOUNTS.CONTENT_STAFF.email);
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/checkpoints'));
  });

  it('đã đăng nhập mà mở /admin/login → vào thẳng /admin/routes', async () => {
    const { router } = renderAdmin('/admin/login', { signedInAs: 'CONTENT_STAFF' });
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/routes'));
  });

  it('có lối vào "Quên mật khẩu" tới /admin/recovery', async () => {
    renderAdmin('/admin/login');
    expect((await screen.findByRole('link', { name: 'Quên mật khẩu' })).getAttribute('href')).toBe('/admin/recovery');
  });
});
