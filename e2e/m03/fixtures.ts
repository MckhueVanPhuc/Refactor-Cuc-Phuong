import { test as base, expect, type Page } from '@playwright/test';
import {
  LOCAL_HOOKS,
  LOCAL_STACK_PROJECT,
  currentAdminEmailLocal,
  latestMailLocal,
  readPublicationLocal,
  resetLocalStack,
} from './localStack';

/**
 * Project `m03-local-stack` (T198): trang chạy adapter Supabase thật, không có test hook trong trang. Các helper dưới đây
 * rẽ nhánh: dựng/đọc dữ liệu phía Node (localStack.ts); hook tiêm lỗi hay giữ khóa thì bỏ qua ca đó, có lý do.
 */
export function isLocalStack(): boolean {
  return base.info().project.name === LOCAL_STACK_PROJECT;
}

const FAKE_ONLY = 'chỉ có ở adapter giả (tiêm lỗi/giữ khóa/đổi dung lượng); pgTAP Phase 14 kiểm hành vi này trên SQL';

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
type Publication = { route: Record<string, unknown> | null; snapshot: Record<string, unknown> | null };
type M03Hooks = {
  latestMail?: (email: string, kind: 'invite' | 'recovery') => string | null;
  currentAdminEmail?: () => string | null;
  failNext?: (action: string, messageKey?: string) => void;
  readPublication?: (routeId: string) => Publication;
  [hook: string]: unknown;
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
  // Stack thật giữ phiên trong localStorage: điều hướng bình thường (link mời mang phiên trong URL)
  if (isLocalStack()) {
    await page.goto(url);
    return;
  }
  await page.evaluate((target) => {
    window.history.pushState({}, '', target);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, url);
}

export async function waitForHooks(page: Page): Promise<void> {
  if (isLocalStack()) return;
  await page.waitForFunction(() => Boolean((window as unknown as M03TestWindow).__cpqTestHooks?.m03?.latestMail));
}

export async function latestMail(page: Page, email: string, kind: 'invite' | 'recovery'): Promise<string> {
  if (isLocalStack()) return latestMailLocal(email);
  const link = await page.evaluate(
    ([address, mailKind]) => (window as unknown as M03TestWindow).__cpqTestHooks?.m03?.latestMail?.(address, mailKind) ?? null,
    [email, kind] as const,
  );
  if (!link) throw new Error(`Không có thư ${kind} cho ${email}`);
  return link;
}

export async function currentAdminEmail(page: Page): Promise<string | null> {
  if (isLocalStack()) return currentAdminEmailLocal(page);
  return page.evaluate(() => (window as unknown as M03TestWindow).__cpqTestHooks?.m03?.currentAdminEmail?.() ?? null);
}

/** Command `action` kế tiếp của adapter giả thất bại với khóa đã chọn (quickstart Q13, Q16, Q20) */
export async function failNext(page: Page, action: string, messageKey: string): Promise<void> {
  base.skip(isLocalStack(), FAKE_ONLY);
  await page.evaluate(([name, key]) => (window as unknown as M03TestWindow).__cpqTestHooks?.m03?.failNext?.(name, key), [action, messageKey] as const);
}

/** Gọi một test hook bất kỳ của namespace `m03` (đợi kết quả nếu hook trả Promise) */
export async function m03Hook(page: Page, name: string, args: unknown[] = []): Promise<unknown> {
  if (isLocalStack()) {
    const hook = LOCAL_HOOKS[name];
    base.skip(!hook, `${name}: ${FAKE_ONLY}`);
    return (hook as (...a: unknown[]) => Promise<unknown>)(...args);
  }
  return page.evaluate(
    async ([hook, hookArgs]) => {
      const fn = (window as unknown as M03TestWindow).__cpqTestHooks?.m03?.[hook as string];
      if (typeof fn !== 'function') throw new Error(`Không có test hook ${String(hook)}`);
      return (fn as (...a: unknown[]) => unknown)(...(hookArgs as unknown[]));
    },
    [name, args] as const,
  );
}

/** Những gì M01 đọc được của tuyến: dòng Published Route và snapshot active */
export async function readPublication(page: Page, routeId: string): Promise<Publication> {
  if (isLocalStack()) return readPublicationLocal(routeId);
  return page.evaluate(
    (id) => (window as unknown as M03TestWindow).__cpqTestHooks?.m03?.readPublication?.(id) ?? { route: null, snapshot: null },
    routeId,
  );
}

type M03Fixtures = {
  /** Mở /admin/login và đăng nhập bằng tài khoản synthetic theo role */
  signInAs: (role: AdminRole) => Promise<void>;
  /** Stack local: mỗi ca bắt đầu từ seed sạch (các ca dùng chung một DB; adapter giả thì mỗi trang một store) */
  localStackReset: void;
};

export const test = base.extend<M03Fixtures>({
  localStackReset: [
    async ({}, use, testInfo) => {
      if (testInfo.project.name === LOCAL_STACK_PROJECT) resetLocalStack();
      await use();
    },
    { auto: true },
  ],
  signInAs: async ({ page }, use) => {
    await use(async (role) => {
      await page.goto('/admin/login');
      await login(page, syntheticAccounts[role].email);
      await expect(page).toHaveURL(/\/admin\/routes$/);
    });
  },
});

export { expect };
