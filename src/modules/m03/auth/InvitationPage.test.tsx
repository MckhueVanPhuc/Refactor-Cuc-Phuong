import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createFakeServices } from '../api/fake/fakeAdminApi';
import { FIXTURE_ACCOUNTS } from '../api/fake/fixtures';
import { FakeStore } from '../api/fake/store';
import { renderAdmin } from '../testing/renderAdmin';

/** Quản lý mời `staff1@example.test`, đăng xuất; trả store và link mời trong hộp thư giả */
async function invited() {
  const store = new FakeStore();
  store.signIn(FIXTURE_ACCOUNTS.REVIEWER.userId);
  const { api } = createFakeServices(store);
  await api.inviteAccount({ email: 'staff1@example.test', role: 'CONTENT_STAFF' });
  store.signIn(null);
  const mail = store.auth.outbox.find((m) => m.email === 'staff1@example.test' && m.kind === 'invite')!;
  return { store, link: mail.link };
}

async function setPassword(password: string, confirm = password) {
  await userEvent.type(await screen.findByLabelText('Mật khẩu'), password);
  await userEvent.type(screen.getByLabelText('Nhập lại mật khẩu'), confirm);
  await userEvent.click(screen.getByRole('button', { name: 'Hoàn tất lời mời' }));
}

const LINK_INVALID =
  'Liên kết này không dùng được hoặc đã hết hạn. Nếu là lời mời, hãy nhờ quản lý gửi lại; nếu là khôi phục mật khẩu, hãy yêu cầu lại.';

describe('SCR-M03-007 Nhận lời mời (auth-account §2.3; BR-M03-K01; SC-M03-011)', () => {
  it('link sai hoặc hết hạn → MSG-LINK-INVALID, không có form', async () => {
    renderAdmin('/admin/invitation?fake_token=sai');
    expect((await screen.findByRole('alert')).textContent).toBe(LINK_INVALID);
    expect(screen.queryByLabelText('Mật khẩu')).toBeNull();
    expect(screen.getByRole('link', { name: 'Về đăng nhập' })).toBeTruthy();
  });

  it('mật khẩu không khớp → MSG-PASSWORD-MISMATCH dưới ô nhập lại', async () => {
    const { store, link } = await invited();
    renderAdmin(link, { store });
    await setPassword('Matkhau-moi-1', 'Matkhau-khac-2');
    expect(await screen.findByText('Lỗi: Hai lần nhập mật khẩu chưa giống nhau. Hãy nhập lại.')).toBeTruthy();
  });

  it('provider từ chối mật khẩu → MSG-PASSWORD-REJECTED', async () => {
    const { store, link } = await invited();
    renderAdmin(link, { store });
    await setPassword('ngan');
    expect((await screen.findByRole('alert')).textContent).toBe(
      'Mật khẩu này chưa được chấp nhận. Hãy chọn mật khẩu khác dài hơn và khó đoán hơn.',
    );
  });

  it('hợp lệ → tài khoản ACTIVE với đúng role đã mời, vào /admin/routes; link không dùng lại được', async () => {
    const { store, link } = await invited();
    const { router } = renderAdmin(link, { store });
    await setPassword('Matkhau-moi-1');
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/routes'));
    expect(store.state.accounts.get('staff1@example.test')).toMatchObject({ status: 'ACTIVE', role: 'CONTENT_STAFF' });
    expect(store.audit.map((r) => r.action)).toContain('ACCOUNT_LINKED');
    expect(store.auth.linkTokens.size).toBe(0);
  });
});

describe('SCR-M03-007 Khôi phục mật khẩu (auth-account §2.4; BR-M03-K02)', () => {
  it.each([['email có tài khoản', FIXTURE_ACCOUNTS.CONTENT_STAFF.email], ['email không có', 'khong-co@example.test']])(
    '%s → cùng MSG-RECOVERY-SENT; không tài khoản nào đổi',
    async (_label, email) => {
      const store = new FakeStore();
      const before = structuredClone(store.state.accounts);
      renderAdmin('/admin/recovery', { store });
      await userEvent.type(await screen.findByLabelText('Email'), email);
      await userEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu khôi phục' }));
      expect((await screen.findByRole('status')).textContent).toBe(
        'Nếu email này có tài khoản, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.',
      );
      expect(store.state.accounts).toEqual(before);
    },
  );

  it('link khôi phục: đặt mật khẩu mới → về đăng nhập; role/status không đổi; tài khoản đã khóa vẫn bị từ chối', async () => {
    const store = new FakeStore();
    const { auth } = createFakeServices(store);
    await auth.requestPasswordRecovery('locked@example.test');
    const link = store.auth.outbox.find((m) => m.kind === 'recovery')!.link;
    const before = structuredClone(store.state.accounts);
    const { router, services } = renderAdmin(link, { store });
    const updatePassword = vi.spyOn(services.auth, 'updatePassword');
    await userEvent.type(await screen.findByLabelText('Mật khẩu mới'), 'Matkhau-moi-1');
    await userEvent.type(screen.getByLabelText('Nhập lại mật khẩu'), 'Matkhau-moi-1');
    await userEvent.click(screen.getByRole('button', { name: 'Đặt mật khẩu mới' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/login'));
    expect(updatePassword).toHaveBeenCalledWith('Matkhau-moi-1');
    expect(store.state.accounts).toEqual(before);
    expect(store.currentUserId).toBeNull();
  });

  it('link khôi phục sai → MSG-LINK-INVALID', async () => {
    renderAdmin('/admin/recovery?fake_token=sai');
    expect((await screen.findByRole('alert')).textContent).toBe(LINK_INVALID);
  });
});
