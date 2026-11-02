// Quickstart Q19–Q21 (US6) trên adapter giả: `npm run dev:fake`, project `m03`.
// Điểm dừng và hai tuyến đã xuất bản được dựng sẵn qua test hook; đóng, mở lại chạy qua giao diện.
import type { Page } from '@playwright/test';
import {
  expect,
  failNext,
  login,
  m03Hook,
  readPublication,
  spaNavigate,
  syntheticAccounts,
  test,
  waitForHooks,
  type AdminRole,
} from './fixtures';

type Scenario = { checkpointId: string; otherCheckpointId: string; routeIds: [string, string] };

/** Đổi người dùng mà không tải lại trang (store của adapter giả nằm trong bộ nhớ trang) */
async function signOutAndSignInAs(page: Page, role: AdminRole) {
  await page.getByRole('button', { name: 'Đăng xuất' }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await login(page, syntheticAccounts[role].email);
  await expect(page).toHaveURL(/\/admin\/routes$/);
}

/** "Hang Con Moong" là điểm dừng hoạt động duy nhất của Tuyến A; Tuyến B liệt kê nó và "Động Người Xưa" */
async function scenario(page: Page): Promise<Scenario> {
  await waitForHooks(page);
  return m03Hook(page, 'seedCloseScenario', ['Hang Con Moong', 'Động Người Xưa', 'Tuyến A', 'Tuyến B']) as Promise<Scenario>;
}

async function closeCheckpoint(page: Page, checkpointId: string) {
  await spaNavigate(page, `/admin/checkpoints/${checkpointId}`);
  await expect(page.getByRole('heading', { level: 1, name: 'Hang Con Moong' })).toBeVisible();
  await page.getByRole('button', { name: 'Đóng tạm' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading')).toHaveText('Điểm dừng này có trong 2 tuyến: Tuyến A, Tuyến B.');
  await expect(dialog).toContainText('Các tuyến sau sẽ tự đóng tạm vì hết điểm dừng hoạt động: Tuyến A.');
  await dialog.getByLabel('Lý do').fill('Sạt lở sau mưa lớn');
  await dialog.getByRole('button', { name: 'Đóng tạm' }).click();
}

test('Q19 — đóng điểm dừng hoạt động cuối của tuyến A, tuyến B còn điểm dừng khác: A tự đóng, B có version mới', async ({
  page,
  signInAs,
}) => {
  await signInAs('CONTENT_STAFF');
  const { checkpointId, otherCheckpointId, routeIds } = await scenario(page);
  const before = await readPublication(page, routeIds[1]);

  await closeCheckpoint(page, checkpointId);
  await expect(page.getByText('Trạng thái: Tạm đóng', { exact: true })).toBeVisible();

  const routeA = await readPublication(page, routeIds[0]);
  const routeB = await readPublication(page, routeIds[1]);
  expect(routeA.route?.status).toBe('TAM_DONG');
  expect(routeB.route?.status).toBe('HOAT_DONG');
  expect(routeB.snapshot?.contentVersion).toBe(Number(before.snapshot?.contentVersion) + 1);
  expect((routeB.snapshot?.checkpoints as { checkpointId: string }[]).map((checkpoint) => checkpoint.checkpointId)).toEqual([otherCheckpointId]);

  await page.getByRole('link', { name: 'Tuyến', exact: true }).click();
  await expect(page.getByRole('row', { name: /Tuyến A/ })).toContainText('Tạm đóng');
  await expect(page.getByRole('row', { name: /Tuyến B/ })).toContainText('Đang hoạt động');
});

test('Q20 — đóng điểm dừng lỗi: MSG-CLOSE-FAILED + "Đóng tạm các tuyến liên quan"; các tuyến Tạm đóng, điểm dừng vẫn hoạt động', async ({
  page,
  signInAs,
}) => {
  await signInAs('CONTENT_STAFF');
  const { checkpointId, routeIds } = await scenario(page);
  await failNext(page, 'CHECKPOINT_CLOSED', 'MSG-CLOSE-FAILED');

  await closeCheckpoint(page, checkpointId);
  const alert = page.getByRole('alert');
  await expect(alert).toContainText('Chưa đóng được điểm dừng, mọi thứ vẫn như cũ.');
  await expect(page.getByText('Trạng thái: Đang hoạt động', { exact: true })).toBeVisible();
  expect((await readPublication(page, routeIds[0])).route?.status).toBe('HOAT_DONG');

  await alert.getByRole('button', { name: 'Đóng tạm các tuyến liên quan' }).click();
  await expect(page.getByText('Chưa đóng được điểm dừng')).toHaveCount(0);
  await expect.poll(async () => (await readPublication(page, routeIds[0])).route?.status).toBe('TAM_DONG');
  expect((await readPublication(page, routeIds[1])).route?.status).toBe('TAM_DONG');
  await expect(page.getByText('Trạng thái: Đang hoạt động', { exact: true })).toBeVisible();
});

test('Q21 — Quản lý mở lại điểm dừng: tuyến đã tự đóng vẫn đóng; Nhân viên nội dung không có thao tác mở lại', async ({ page, signInAs }) => {
  await signInAs('CONTENT_STAFF');
  const { checkpointId, routeIds } = await scenario(page);
  await closeCheckpoint(page, checkpointId);
  await expect(page.getByText('Trạng thái: Tạm đóng', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mở lại', exact: true })).toHaveCount(0);

  await signOutAndSignInAs(page, 'REVIEWER');
  await spaNavigate(page, `/admin/checkpoints/${checkpointId}`);
  await page.getByRole('button', { name: 'Mở lại', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading')).toHaveText(
    'Mở lại điểm dừng "Hang Con Moong" sẽ đưa điểm dừng trở lại các tuyến: Tuyến A, Tuyến B; gói tải trước của du khách ở các tuyến đó cần cập nhật.',
  );
  await dialog.getByLabel('Ghi chú xác nhận an toàn').fill('Đã kiểm tra lại đường đi');
  await dialog.getByRole('button', { name: 'Mở lại', exact: true }).click();
  await expect(page.getByText('Trạng thái: Đang hoạt động', { exact: true })).toBeVisible();

  expect((await readPublication(page, routeIds[0])).route?.status).toBe('TAM_DONG');
  const routeB = await readPublication(page, routeIds[1]);
  expect((routeB.snapshot?.checkpoints as { checkpointId: string }[]).map((checkpoint) => checkpoint.checkpointId)).toContain(checkpointId);
});
