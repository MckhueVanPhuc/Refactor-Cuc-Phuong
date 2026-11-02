// Quickstart Q1–Q5 (US1) trên adapter giả: `npm run dev:fake`, project `m03`.
import {
  currentAdminEmail,
  isLocalStack,
  expect,
  latestMail,
  login,
  spaNavigate,
  syntheticAccounts,
  test,
  waitForHooks,
} from './fixtures';

const DENIED = 'Tài khoản này chưa được phép vào hệ thống. Hãy nhờ quản lý.';
const LAST_REVIEWER = 'Không thể khóa hoặc hạ quyền người quản lý cuối cùng.';
const UNSAVED = 'Bạn có thay đổi chưa lưu. Rời trang sẽ mất các thay đổi này.';

test('Q1 — không có tài khoản và tài khoản đã khóa bị từ chối; tài khoản active vào được', async ({ page }) => {
  await page.goto('/admin/login');
  await login(page, syntheticAccounts.NO_ACCOUNT.email);
  await expect(page.getByRole('alert')).toHaveText(DENIED);

  await page.getByLabel('Email').fill('');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('');
  await login(page, syntheticAccounts.LOCKED.email);
  await expect(page.getByRole('alert')).toHaveText(DENIED);
  expect(await currentAdminEmail(page)).toBeNull();

  await page.getByLabel('Email').fill('');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('');
  await login(page, syntheticAccounts.CONTENT_STAFF.email);
  await expect(page).toHaveURL(/\/admin\/routes$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Quản trị tuyến' })).toBeVisible();
});

test('Q2 — mời, gửi lại, người được mời đặt mật khẩu và vào được với đúng vai trò', async ({ page, signInAs }) => {
  await signInAs('REVIEWER');
  await page.getByRole('link', { name: 'Tài khoản' }).click();
  await page.getByLabel('Email người được mời').fill('staff1@example.test');
  await page.getByLabel('Vai trò').selectOption({ label: 'Nhân viên nội dung' });
  await page.getByRole('button', { name: 'Gửi lời mời' }).click();
  await expect(page.getByRole('status')).toHaveText('Đã gửi lời mời tới staff1@example.test.');

  const row = page.getByRole('row', { name: /staff1@example\.test/ });
  await expect(row.getByText('Chờ nhận lời mời')).toBeVisible();
  await row.getByRole('button', { name: 'Gửi lại lời mời' }).click();
  await expect(page.getByRole('status')).toHaveText('Đã gửi lại lời mời tới staff1@example.test.');
  await expect(page.getByRole('row', { name: /staff1@example\.test/ })).toHaveCount(1);

  await page.getByRole('button', { name: 'Đăng xuất' }).click();
  await expect(page.getByRole('button', { name: 'Đăng nhập' })).toBeVisible();

  await waitForHooks(page);
  await spaNavigate(page, await latestMail(page, 'staff1@example.test', 'invite'));
  await expect(page.getByRole('heading', { level: 1, name: 'Nhận lời mời' })).toBeVisible();
  await page.getByLabel('Mật khẩu', { exact: true }).fill('Matkhau-moi-1');
  await page.getByLabel('Nhập lại mật khẩu').fill('Matkhau-moi-1');
  await page.getByRole('button', { name: 'Hoàn tất lời mời' }).click();
  await expect(page).toHaveURL(/\/admin\/routes$/);
  await expect(page.getByText('staff1@example.test')).toBeVisible();
  await expect(page.getByText('Nhân viên nội dung')).toBeVisible();
});

// Khôi phục không cho biết email có tài khoản hay không (BR-M03-K02)
test('Q3 — khôi phục mật khẩu: cùng một câu cho email có và không có', async ({ page }) => {
  const sent = 'Nếu email này có tài khoản, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.';
  for (const email of [syntheticAccounts.CONTENT_STAFF.email, 'khong-co@example.test']) {
    await page.goto('/admin/login');
    await page.getByRole('link', { name: 'Quên mật khẩu' }).click();
    // Điều hướng chạy trong transition: trang đăng nhập còn hiện tới khi chunk của trang khôi phục tải xong,
    // nên phải chờ trang mới trước khi gõ, kẻo gõ vào ô Email của trang đăng nhập
    await expect(page.getByRole('heading', { level: 1, name: 'Khôi phục mật khẩu' })).toBeVisible();
    await page.getByLabel('Email').fill(email);
    await page.getByRole('button', { name: 'Gửi yêu cầu khôi phục' }).click();
    await expect(page.getByRole('status')).toHaveText(sent);
  }
});

test('Q4 — không khóa và không hạ quyền được Quản lý cuối cùng', async ({ page, signInAs }) => {
  await signInAs('REVIEWER');
  await page.goto('/admin/accounts');
  // Adapter giả: tải lại trang tạo store mới, phải đăng nhập lại rồi vào bằng điều hướng trong app.
  // Stack thật giữ phiên qua lần tải lại, nên trang tài khoản mở ngay.
  if (!isLocalStack()) {
    await expect(page).toHaveURL(/\/admin\/login$/);
    await login(page, syntheticAccounts.REVIEWER.email);
    await page.getByRole('link', { name: 'Tài khoản' }).click();
  }
  const me = page.getByRole('row', { name: /reviewer@example\.test/ });
  await me.getByRole('button', { name: 'Khóa' }).click();
  await expect(page.getByRole('alert')).toHaveText(LAST_REVIEWER);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await me.getByRole('button', { name: 'Đổi thành Nhân viên nội dung' }).click();
  await expect(page.getByRole('alert')).toHaveText(LAST_REVIEWER);
  await expect(me.getByText('Đang hoạt động')).toBeVisible();
});

test('Q5 — đăng xuất: về đăng nhập, phiên cũ không còn dùng được', async ({ page, signInAs }) => {
  await signInAs('CONTENT_STAFF');
  await waitForHooks(page);
  expect(await currentAdminEmail(page)).toBe(syntheticAccounts.CONTENT_STAFF.email);
  await page.getByRole('button', { name: 'Đăng xuất' }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  // LoginPage hoàn tất đăng xuất sau khi điều hướng, nên chờ phiên bị xóa thay vì đọc ngay
  await expect.poll(() => currentAdminEmail(page)).toBeNull();
  await spaNavigate(page, '/admin/checkpoints');
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test('Q5 — đăng xuất từ editor có thay đổi chưa lưu hiện MSG-UNSAVED-CHANGES', async ({ page, signInAs }) => {
  await signInAs('CONTENT_STAFF');
  await page.getByRole('link', { name: 'Thư viện điểm dừng' }).click();
  await page.getByRole('button', { name: 'Tạo điểm dừng' }).click();
  await page.getByLabel('Tên điểm dừng (tiếng Việt)').fill('Hang chưa lưu');
  await page.getByRole('button', { name: 'Đăng xuất' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading')).toHaveText(UNSAVED);
  await dialog.getByRole('button', { name: 'Ở lại' }).click();
  await expect(page).toHaveURL(/\/admin\/checkpoints\/new$/);
  await expect(page.getByLabel('Tên điểm dừng (tiếng Việt)')).toHaveValue('Hang chưa lưu');

  await page.getByRole('button', { name: 'Đăng xuất' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Rời đi' }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  // LoginPage hoàn tất đăng xuất sau khi điều hướng, nên chờ phiên bị xóa thay vì đọc ngay
  await expect.poll(() => currentAdminEmail(page)).toBeNull();
});
