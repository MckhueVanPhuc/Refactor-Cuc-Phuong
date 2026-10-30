// Cầu nối test E2E: chỉ được nạp bằng import() động trong nhánh MODE `e2e`/`fake`
// (src/app/App.tsx), nên không vào bundle production (tasks M03 T007).

export type TestHookNamespace = 'm01' | 'm02' | 'm03';

// Hook nhận tham số tùy module; Playwright gọi qua page.evaluate
export type TestHook = (...args: never[]) => unknown;
export type TestHooks = Record<string, TestHook>;

declare global {
  interface Window {
    __cpqTestHooks?: Partial<Record<TestHookNamespace, TestHooks>>;
  }
}

/** Gắn `window.__cpqTestHooks` rỗng; module đăng ký namespace của mình bằng registerTestHooks. */
export function installTestHooks(): void {
  window.__cpqTestHooks ??= {};
}

/** Đăng ký (hoặc bổ sung) các hook của một module: nạp dữ liệu IndexedDB, tiêm lỗi theo tên… */
export function registerTestHooks(namespace: TestHookNamespace, hooks: TestHooks): void {
  installTestHooks();
  const registry = window.__cpqTestHooks!;
  registry[namespace] = { ...registry[namespace], ...hooks };
}
