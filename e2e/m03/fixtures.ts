import { test as base, expect, type Page } from '@playwright/test';

/** Role cố định của M03 (spec-M03; auth-account-contract). */
export type AdminRole = 'CONTENT_STAFF' | 'REVIEWER';

/** Tài khoản synthetic của adapter giả (src/modules/m03/api/fake/fixtures.ts); chỉ domain `example.test`. */
export const syntheticAccounts = {
  CONTENT_STAFF: { email: 'staff@example.test' },
  REVIEWER: { email: 'reviewer@example.test' },
  LOCKED: { email: 'locked@example.test' },
  NO_ACCOUNT: { email: 'noaccount@example.test' },
} as const;

/** Mật khẩu synthetic của mọi người dùng fixture (FIXTURE_PASSWORD ở adapter giả) */
export const SYNTHETIC_PASSWORD = 'Matkhau-thu-123';

/** Hình dạng `window.__cpqTestHooks.m03` mà E2E dùng (đăng ký ở MODE `fake`, src/modules/m03/api/fake/fakeAdminApi.ts). */
type M03Hooks = {
  latestMail?: (email: string, kind: 'invite' | 'recovery') => string | null;
  currentAdminEmail?: () => string | null;
};
type M03TestWindow = { __cpqTestHooks?: { m03?: M03Hooks } };

/** Đăng nhập qua form SCR-M03-000 */
export async function login(page: Page, email: string, password = SYNTHETIC_PASSWORD): Promise<void> {
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
}

/**
 * Điều hướng phía client (không tải lại trang): store của adapter giả nằm trong bộ nhớ trang,
 * nên mở link mời/khôi phục bằng `page.goto` sẽ mất dữ liệu.
 */
export async function spaNavigate(page: Page, url: string): Promise<void> {
  await page.evaluate((target) => {
    window.history.pushState({}, '', target);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, url);
}

export async function waitForHooks(page: Page): Promise<void> {
  await page.waitForFunction(() => Boolean((window as unknown as M03TestWindow).__cpqTestHooks?.m03?.latestMail));
}

export async function latestMail(page: Page, email: string, kind: 'invite' | 'recovery'): Promise<string> {
  const link = await page.evaluate(
    ([address, mailKind]) => (window as unknown as M03TestWindow).__cpqTestHooks?.m03?.latestMail?.(address, mailKind) ?? null,
    [email, kind] as const,
  );
  if (!link) throw new Error(`Không có thư ${kind} cho ${email}`);
  return link;
}

export async function currentAdminEmail(page: Page): Promise<string | null> {
  return page.evaluate(() => (window as unknown as M03TestWindow).__cpqTestHooks?.m03?.currentAdminEmail?.() ?? null);
}

type M03Fixtures = {
  /** Mở /admin/login và đăng nhập bằng tài khoản synthetic theo role */
  signInAs: (role: AdminRole) => Promise<void>;
};

export const test = base.extend<M03Fixtures>({
  signInAs: async ({ page }, use) => {
    await use(async (role) => {
      await page.goto('/admin/login');
      await login(page, syntheticAccounts[role].email);
      await expect(page).toHaveURL(/\/admin\/routes$/);
    });
  },
});

export { expect };
