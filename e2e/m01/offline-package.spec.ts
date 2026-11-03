// Quickstart M01 V9–V16 (US-M01-03; tasks T079) trên bản build MODE e2e, network mock (project `m01`).
import { expect, test, type Page } from '@playwright/test';
import { nextVersion, publicationFixture } from '../../src/shared/contracts/__fixtures__/publication';
import { contextFromSnapshot } from '../../src/modules/m01/testing/packageFixture';
import { callM01Hook, dumpStores } from './helpers';
import { chooseLanguage, defaultPublication, mockPublication, type PublicationMock } from './network';

test.use({ locale: 'vi-VN' });

type PackageRow = { contentVersion: number; status: string; versionStatus: string; routeEssentials: { capturedAt: string } };

async function stores(page: Page) {
  return dumpStores(page, ['offlinePackages', 'offlineResources', 'imageBytes', 'activePackages', 'packageCandidates']);
}

async function openA(page: Page, mock: PublicationMock = defaultPublication()) {
  await mockPublication(page, mock);
  await page.goto('/');
  await chooseLanguage(page);
  await page.goto('/routes/route-a');
  await expect(page.getByRole('button', { name: 'Bắt đầu' })).toBeVisible();
  return mock;
}

const panel = (page: Page) => page.getByRole('region', { name: 'Gói tải trước' });

test('V9 — Bắt đầu trên A chưa có gói, snapshot không có ước tính: dialog nêu 2 điểm dừng, "Chưa có thông tin dung lượng.", hướng dẫn quét, ba nút; Tải bật', async ({
  page,
}) => {
  await openA(page);
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  const dialog = page.getByRole('dialog', { name: 'Tuyến này nên tải trước' });
  await expect(dialog).toContainText('Điểm thử A1, Điểm thử A2');
  await expect(dialog.getByText('Chưa có thông tin dung lượng.')).toBeVisible();
  await expect(dialog.getByText(/nút Quét trong ứng dụng/)).toBeVisible();
  await expect(dialog.getByRole('button')).toHaveText(['Tải về', 'Tiếp tục không tải', 'Quay lại']);
  await expect(dialog.getByRole('button', { name: 'Tải về' })).toBeEnabled();
});

test('V10 — Tải A: DANG_TAI rồi SAN_SANG + CURRENT; 3 resource; 4 ảnh + sơ đồ; capturedAt có giá trị', async ({ page }) => {
  await openA(page);
  await panel(page).getByRole('button', { name: 'Tải về' }).click();
  await expect(panel(page).getByText('Sẵn sàng – mới nhất')).toBeVisible();
  const data = await stores(page);
  const [pkg] = data.offlinePackages as PackageRow[];
  expect(pkg).toMatchObject({ contentVersion: 1, status: 'SAN_SANG', versionStatus: 'CURRENT' });
  expect(pkg!.routeEssentials.capturedAt).toBeTruthy();
  expect(data.offlineResources).toHaveLength(3);
  expect(data.imageBytes).toHaveLength(5);
  expect(data.packageCandidates).toEqual([]);
});

test('V11 — ảnh QR trả 500: CHUA_HOAN_TAT, không có dòng offlinePackages, thông báo tải chưa hoàn tất', async ({ page }) => {
  const mock = defaultPublication();
  mock.imageFailures.set('fixture/a2-1.png', 500);
  await openA(page, mock);
  await panel(page).getByRole('button', { name: 'Tải về' }).click();
  await expect(panel(page).getByText('Tải chưa hoàn tất. Hãy thử tải lại.')).toBeVisible();
  const data = await stores(page);
  expect(data.offlinePackages).toEqual([]);
  expect(data.packageCandidates).toMatchObject([{ phase: 'CHUA_HOAN_TAT' }]);
});

test('V12 — gói A v1, nguồn lên v2, mở chi tiết, hết quota lúc kích hoạt: v1 OUTDATED, vẫn SAN_SANG và đọc được', async ({
  page,
}) => {
  const mock = await openA(page);
  await panel(page).getByRole('button', { name: 'Tải về' }).click();
  await expect(panel(page).getByText('Sẵn sàng – mới nhất')).toBeVisible();

  const { routes, snapshots } = publicationFixture();
  const v2 = nextVersion(routes.A, snapshots.A);
  mock.routes = mock.routes.map((route) => (route.routeId === 'route-a' ? v2.route : route));
  mock.snapshots = mock.snapshots.map((snapshot) => (snapshot.routeId === 'route-a' ? v2.snapshot : snapshot));
  // Cờ tiêm lỗi nằm trong bộ nhớ của trang: điều hướng trong app, không tải lại trang
  await callM01Hook(page, 'failNextActivation');
  await page.getByRole('link', { name: 'Danh mục tuyến' }).first().click();
  await page.getByRole('link', { name: /Tuyến thử Bách Thảo/ }).click();
  await expect(panel(page).getByText('Sẵn sàng – có bản mới')).toBeVisible();
  await expect(panel(page).getByRole('alert')).toBeVisible();
  const [pkg] = (await stores(page)).offlinePackages as PackageRow[];
  expect(pkg).toMatchObject({ contentVersion: 1, status: 'SAN_SANG', versionStatus: 'OUTDATED' });
  expect((await stores(page)).packageCandidates).toEqual([]);
});

test('V13 — gói A v1, nguồn v2, mở chi tiết, tải thành công: con trỏ sang v2 CURRENT, dữ liệu v1 bị xóa', async ({ page }) => {
  const mock = await openA(page);
  await panel(page).getByRole('button', { name: 'Tải về' }).click();
  await expect(panel(page).getByText('Sẵn sàng – mới nhất')).toBeVisible();
  const { routes, snapshots } = publicationFixture();
  const v2 = nextVersion(routes.A, snapshots.A);
  mock.routes = mock.routes.map((route) => (route.routeId === 'route-a' ? v2.route : route));
  mock.snapshots = mock.snapshots.map((snapshot) => (snapshot.routeId === 'route-a' ? v2.snapshot : snapshot));
  await page.goto('/routes/route-a');
  await expect.poll(async () => ((await stores(page)).activePackages as { contentVersion: number }[])[0]?.contentVersion).toBe(2);
  const data = await stores(page);
  expect((data.offlinePackages as PackageRow[]).map((row) => [row.contentVersion, row.versionStatus])).toEqual([[2, 'CURRENT']]);
  expect((data.offlineResources as { contentVersion: number }[]).every((row) => row.contentVersion === 2)).toBe(true);
  expect((data.imageBytes as { contentVersion: number }[]).every((row) => row.contentVersion === 2)).toBe(true);
});

test('V14 — bấm Tải hai lần nhanh; tab thứ hai bấm Tải cùng tuyến: chỉ một thao tác', async ({ page, context }) => {
  const mock = defaultPublication();
  mock.imageDelayMs = 600;
  await openA(page, mock);
  const second = await context.newPage();
  await mockPublication(second, mock);
  await second.goto('/routes/route-a');
  await expect(panel(second).getByRole('button', { name: 'Tải về' })).toBeVisible();

  // Chỉ đếm lô ký URL của thao tác gói (danh mục và gallery cũng ký URL)
  mock.signRequests = 0;
  await panel(page).getByRole('button', { name: 'Tải về' }).dblclick();
  await expect(panel(second).getByText('Đang tải')).toBeVisible();
  // Tab thứ hai đang thấy "Đang tải" nên không còn nút; ép thử thao tác qua ops cũng bị khóa theo tuyến
  await expect(panel(second).getByRole('button')).toHaveCount(0);
  await expect(panel(page).getByText('Sẵn sàng – mới nhất')).toBeVisible();
  expect(mock.signRequests).toBe(1);
  await second.close();
});

test('V15 — đóng tab giữa lúc tải, mở lại app: candidate mồ côi được dọn thành CHUA_HOAN_TAT', async ({ page, context }) => {
  const mock = defaultPublication();
  mock.imageDelayMs = 60_000;
  await openA(page, mock);
  await panel(page).getByRole('button', { name: 'Tải về' }).click();
  await expect(panel(page).getByText('Đang tải')).toBeVisible();
  await page.close();

  const reopened = await context.newPage();
  await mockPublication(reopened, defaultPublication());
  await reopened.goto('/offline');
  await expect(reopened.getByText('Chưa hoàn tất')).toBeVisible();
  expect(((await stores(reopened)).packageCandidates as { phase: string }[]).map((row) => row.phase)).toEqual(['CHUA_HOAN_TAT']);
});

test('V16 — xóa gói A ở SCR-M01-004 khi đã có context A: dialog xác nhận; gói mất, context còn', async ({ page }) => {
  await openA(page);
  await panel(page).getByRole('button', { name: 'Tải về' }).click();
  await expect(panel(page).getByText('Sẵn sàng – mới nhất')).toBeVisible();
  const context = contextFromSnapshot(publicationFixture().snapshots.A);
  await callM01Hook(page, 'seedContext', context);

  await page.getByRole('link', { name: 'Tài nguyên offline' }).click();
  await page.getByRole('button', { name: 'Xóa' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Xóa gói tải trước của tuyến "Tuyến thử Bách Thảo"?');
  await dialog.getByRole('button', { name: 'Xóa' }).click();
  await expect(page.getByText('Bạn chưa tải tuyến nào.')).toBeVisible();
  const data = await stores(page);
  for (const rows of Object.values(data)) expect(rows).toEqual([]);
  expect((await dumpStores(page, ['selectedRouteContext'])).selectedRouteContext).toEqual([{ ...context, slot: 'current' }]);
});
