// Dựng dữ liệu cho E2E `m01-local-stack` (tasks M01 T105) phía Node, theo mẫu e2e/m03/localStack.ts: dữ liệu synthetic
// được M03 xuất bản thật qua adapter Supabase (Data API, Edge, Storage của stack local), không qua hook trong trình duyệt.
// Chỉ chạy với PW_LOCAL_STACK=1; không gọi Supabase cloud.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AdminApi } from '../../src/modules/m03/api/AdminApi';
import { LOCAL_HOOKS, localConfig, resetLocalStack } from '../m03/localStack';

export const M01_LOCAL_PROJECT = 'm01-local-stack';

export { localConfig, resetLocalStack };

/** Client du khách (anon, schema `api`) như app M01 dùng */
export function visitorClient(): SupabaseClient<any, 'api'> {
  const { url, key } = localConfig();
  return createClient(url, key, { db: { schema: 'api' }, auth: { persistSession: false, autoRefreshToken: false } });
}

/** Hai tuyến đã xuất bản: A có một điểm dừng `OFFLINE_REQUIRED` (một điểm tham quan có ảnh), B có hai điểm dừng */
export async function seedTwoRoutes(names: { checkpoint: string; other: string; routeA: string; routeB: string }) {
  const seed = LOCAL_HOOKS.seedCloseScenario as unknown as (...args: string[]) => Promise<{ routeIds: [string, string] }>;
  const { routeIds } = await seed(names.checkpoint, names.other, names.routeA, names.routeB);
  return { routeA: routeIds[0], routeB: routeIds[1] };
}

const SEED_PASSWORD = 'Matkhau-thu-123';

/** Quản lý (tài khoản seed synthetic) tạm đóng tuyến qua lệnh C-09 thật */
export async function closeRoute(routeId: string): Promise<void> {
  (globalThis as { __IS_PRODUCTION_BUILD__?: boolean }).__IS_PRODUCTION_BUILD__ = false;
  // Đường dẫn trong biến: tsconfig.node (e2e) không có kiểu Vite mà env.ts cần (như e2e/m03/localStack.ts)
  const adapterPath = '../../src/modules/m03/api/supabaseAdminApi';
  const { createSupabaseAdminApi } = (await import(adapterPath)) as {
    createSupabaseAdminApi: (supabase: SupabaseClient<any, 'api'>) => AdminApi;
  };
  const supabase = visitorClient();
  const { error } = await supabase.auth.signInWithPassword({ email: 'reviewer@example.test', password: SEED_PASSWORD });
  if (error) throw new Error('không đăng nhập được tài khoản Quản lý synthetic');
  const api = createSupabaseAdminApi(supabase);
  const editor = await api.getRouteEditor(routeId);
  const result = await api.closeRoute({
    routeId,
    reason: 'Đóng thử cho kiểm thử M01',
    expected: { entity: editor.concurrencyRevision, draft: editor.draft?.concurrencyRevision },
  });
  if (!result.ok) throw new Error(`không đóng được tuyến: ${result.reason}`);
}
