import { beforeAll, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAdmin } from '../testing/renderAdmin';

// Nạp sẵn chunk lazy của màn để ca đầu tiên không phụ thuộc thời gian nạp module (validation-report D-23)
beforeAll(() => import('./AccountsPage'));

async function openAccounts() {
  const view = renderAdmin('/admin/accounts', { signedInAs: 'REVIEWER' });
  await screen.findByRole('heading', { level: 1, name: 'Tài khoản & Vai trò' });
  await screen.findByRole('table');
  return view;
}

function rowOf(email: string) {
  return screen.getByRole('row', { name: new RegExp(email.replace('.', '\\.')) });
}

async function invite(email: string, role = 'Nhân viên nội dung') {
  const field = screen.getByLabelText('Email người được mời');
  await userEvent.clear(field);
  await userEvent.type(field, email);
  await userEvent.selectOptions(screen.getByLabelText('Vai trò'), role);
  await userEvent.click(screen.getByRole('button', { name: 'Gửi lời mời' }));
}

describe('SCR-M03-006 Tài khoản & Vai trò (auth-account §2.2, §2.5; BR-M03-K01, K03)', () => {
  it('danh sách chỉ dùng tên hiển thị §5.4', async () => {
    await openAccounts();
    const reviewer = rowOf('reviewer@example.test');
    expect(within(reviewer).getByText('Quản lý')).toBeTruthy();
    expect(within(reviewer).getByText('Đang hoạt động')).toBeTruthy();
    expect(within(rowOf('locked@example.test')).getByText('Đã khóa')).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/REVIEWER|CONTENT_STAFF|ACTIVE|DEACTIVATED/);
  });

  it('mời → MSG-INVITE-SENT; dòng mới "Chờ nhận lời mời"', async () => {
    await openAccounts();
    await invite('staff1@example.test');
    expect((await screen.findByRole('status')).textContent).toBe('Đã gửi lời mời tới staff1@example.test.');
    expect(within(await screen.findByRole('row', { name: /staff1@example\.test/ })).getByText('Chờ nhận lời mời')).toBeTruthy();
  });

  it('gửi lại không tạo bản sao → MSG-INVITE-RESENT', async () => {
    await openAccounts();
    await invite('staff1@example.test');
    const row = await screen.findByRole('row', { name: /staff1@example\.test/ });
    await userEvent.click(within(row).getByRole('button', { name: 'Gửi lại lời mời' }));
    expect((await screen.findByRole('status')).textContent).toBe('Đã gửi lại lời mời tới staff1@example.test.');
    expect(screen.getAllByRole('row', { name: /staff1@example\.test/ })).toHaveLength(1);
  });

  it('mời email đã có tài khoản → MSG-EMAIL-TAKEN', async () => {
    await openAccounts();
    await invite('staff@example.test');
    expect((await screen.findByRole('alert')).textContent).toBe(
      'Email staff@example.test đã có tài khoản. Nếu tài khoản đang chờ nhận lời mời, hãy bấm Gửi lại lời mời.',
    );
  });

  it('email sai → MSG-EMAIL-INVALID dưới ô, không gọi lời mời', async () => {
    const { store } = await openAccounts();
    const before = store.audit.length;
    await invite('khong-phai-email');
    expect(await screen.findByText('Lỗi: Email chưa đúng. Hãy kiểm tra lại.')).toBeTruthy();
    expect(store.audit.length).toBe(before);
  });

  it('khóa hoặc hạ quyền Quản lý cuối → MSG-LAST-REVIEWER, không có hộp xác nhận (BR-M03-L12)', async () => {
    await openAccounts();
    const lastReviewer = 'Không thể khóa hoặc hạ quyền người quản lý cuối cùng.';
    await userEvent.click(within(rowOf('reviewer@example.test')).getByRole('button', { name: 'Khóa' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect((await screen.findByRole('alert')).textContent).toBe(lastReviewer);
    await userEvent.click(within(rowOf('reviewer@example.test')).getByRole('button', { name: 'Đổi thành Nhân viên nội dung' }));
    expect((await screen.findByRole('alert')).textContent).toBe(lastReviewer);
  });

  it('khóa và mở khóa một Nhân viên', async () => {
    await openAccounts();
    await userEvent.click(within(rowOf('staff@example.test')).getByRole('button', { name: 'Khóa' }));
    expect(await within(rowOf('staff@example.test')).findByText('Đã khóa')).toBeTruthy();
    await userEvent.click(within(rowOf('staff@example.test')).getByRole('button', { name: 'Mở khóa' }));
    expect(await within(rowOf('staff@example.test')).findByText('Đang hoạt động')).toBeTruthy();
  });
});
