import { test as base, expect, type Page } from '@playwright/test';

/** Role cố định của M03 (spec-M03; auth-account-contract). */
export type AdminRole = 'CONTENT_STAFF' | 'REVIEWER';

/** Tài khoản synthetic; chỉ dùng domain `example.test`, không bao giờ là dữ liệu thật. */
export const syntheticAccounts: Record<AdminRole, { email: string }> = {
  CONTENT_STAFF: { email: 'staff@example.test' },
  REVIEWER: { email: 'reviewer@example.test' },
};

type M03Fixtures = {
  /** Đăng nhập giả theo role qua fake auth (namespace `m03` của `window.__cpqTestHooks`). */
  signInAs: (role: AdminRole) => Promise<void>;
};

/** Hình dạng `window.__cpqTestHooks.m03` mà fixture dùng (đăng ký trong src/, MODE `fake`/`e2e`). */
type M03TestWindow = {
  __cpqTestHooks?: { m03?: { signInAs?: (role: AdminRole, email: string) => Promise<void> } };
};

async function signInWithFakeAuth(page: Page, role: AdminRole): Promise<void> {
  await page.goto('/admin/login');
  await page.waitForFunction(() => Boolean((window as unknown as M03TestWindow).__cpqTestHooks?.m03?.signInAs));
  await page.evaluate(
    async ([r, email]) => {
      await (window as unknown as M03TestWindow).__cpqTestHooks?.m03?.signInAs?.(r, email);
    },
    [role, syntheticAccounts[role].email] as const,
  );
}

export const test = base.extend<M03Fixtures>({
  signInAs: async ({ page }, use) => {
    await use((role) => signInWithFakeAuth(page, role));
  },
});

export { expect };
