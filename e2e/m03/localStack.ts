// Bản stack-local của các test hook M03 (tasks M03 T198). Ở project `m03-local-stack` trang chạy adapter Supabase thật,
// không có `window.__cpqTestHooks`; các hook dựng và đọc dữ liệu chạy ở đây, phía Node, bằng chính adapter Supabase,
// Mailpit và psql trong container DB. Hook tiêm lỗi hay giữ khóa (failNext, holdLock, inflateLatestMedia…) chỉ có ở
// adapter giả: ca dùng chúng bị bỏ qua ở project này, hành vi tương ứng được pgTAP của Phase 14 kiểm trên SQL.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AdminApi } from '../../src/modules/m03/api/AdminApi';

export const LOCAL_STACK_PROJECT = 'm03-local-stack';
const DB_CONTAINER = process.env.M03_DB_CONTAINER ?? 'supabase_db_cuc-phuong-quest-local';
const MAILPIT = process.env.M03_MAILPIT_URL ?? 'http://127.0.0.1:54324';
const SEED_PASSWORD = 'Matkhau-thu-123';
const SEED_EMAIL = { REVIEWER: 'reviewer@example.test', CONTENT_STAFF: 'staff@example.test' } as const;
type Role = keyof typeof SEED_EMAIL;

export function localConfig(): { url: string; key: string } {
  const fromFile: Record<string, string> = {};
  try {
    for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
      const match = /^([A-Z_]+)=(.*)$/.exec(line.trim());
      if (match) fromFile[match[1]!] = match[2]!;
    }
  } catch {
    // không có .env.local: chỉ dùng biến môi trường
  }
  const read = (name: string) => process.env[name] ?? fromFile[name] ?? '';
  return { url: read('VITE_SUPABASE_URL'), key: read('VITE_SUPABASE_PUBLISHABLE_KEY') };
}

/** psql trong container DB; trả dòng cuối của output */
export function sql(statement: string): string {
  const out = execFileSync('docker', ['exec', '-i', DB_CONTAINER, 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-tAq'], {
    input: statement,
  });
  return out.toString().trim().split(/\r?\n/).at(-1) ?? '';
}

export const resetLocalStack = () => sql('select test_support.reset_m03();');

function client(): SupabaseClient<any, 'api'> {
  const { url, key } = localConfig();
  return createClient(url, key, { db: { schema: 'api' }, auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

/** AdminApi Supabase đăng nhập bằng tài khoản seed của role (import động: env.ts cần hằng Vite __IS_PRODUCTION_BUILD__) */
async function apiAs(role: Role) {
  (globalThis as { __IS_PRODUCTION_BUILD__?: boolean }).__IS_PRODUCTION_BUILD__ = false;
  // Đường dẫn trong biến: tsconfig.node (e2e) không có kiểu Vite mà env.ts cần
  const adapterPath = '../../src/modules/m03/api/supabaseAdminApi';
  const { createSupabaseAdminApi } = (await import(adapterPath)) as {
    createSupabaseAdminApi: (supabase: SupabaseClient<any, 'api'>) => AdminApi;
  };
  const supabase = client();
  const { error } = await supabase.auth.signInWithPassword({ email: SEED_EMAIL[role], password: SEED_PASSWORD });
  if (error) throw new Error(`không đăng nhập được ${SEED_EMAIL[role]}`);
  return createSupabaseAdminApi(supabase);
}

async function seeds() {
  return import('../../src/modules/m03/api/fake/e2eSeed');
}

const camelKeys = (row: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(row)
      .filter(([, value]) => value !== null)
      .map(([key, value]) => [key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase()), value]),
  );

/** Những gì M01 đọc được (publication-public §2–§3): hai view công khai, đọc như du khách */
export async function readPublicationLocal(routeId: string) {
  const supabase = client();
  const route = await supabase.from('published_routes').select('*').eq('route_id', routeId).maybeSingle();
  const snapshot = await supabase.from('active_journey_snapshots').select('*').eq('route_id', routeId).maybeSingle();
  if (route.error || snapshot.error) throw new Error('không đọc được view công khai');
  return { route: route.data ? camelKeys(route.data) : null, snapshot: snapshot.data ? camelKeys(snapshot.data) : null };
}

/** Link trong thư mới nhất gửi tới email (Mailpit), đi theo redirect của Auth tới trang của app (có phiên trong URL) */
export async function latestMailLocal(email: string): Promise<string> {
  const search = (await (await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`)).json()) as {
    messages: { ID: string }[];
  };
  const id = search.messages[0]?.ID;
  if (!id) throw new Error(`Không có thư cho ${email}`);
  const message = (await (await fetch(`${MAILPIT}/api/v1/message/${id}`)).json()) as { HTML: string };
  const link = /href="([^"]+)"/.exec(message.HTML)?.[1]?.replace(/&amp;/g, '&');
  if (!link) throw new Error(`Thư cho ${email} không có link`);
  const verify = await fetch(link, { redirect: 'manual' });
  return verify.headers.get('location') ?? link;
}

/** Q-01 bằng phiên hiện tại của trang: đọc token Supabase trong localStorage rồi gọi RPC (null khi không có phiên) */
export async function currentAdminEmailLocal(page: Page): Promise<string | null> {
  const token = await page.evaluate(() => {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i) ?? '';
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const value = JSON.parse(localStorage.getItem(key) ?? 'null') as { access_token?: string } | null;
        return value?.access_token ?? null;
      }
    }
    return null;
  });
  if (!token) return null;
  const { url, key } = localConfig();
  const response = await fetch(`${url}/rest/v1/rpc/get_current_admin`, {
    method: 'POST',
    headers: { apikey: key, authorization: `Bearer ${token}`, 'content-type': 'application/json', 'content-profile': 'api' },
    body: '{}',
  });
  if (!response.ok) return null;
  return ((await response.json()) as { email?: string } | null)?.email ?? null;
}

/** Hook dựng/đọc dữ liệu, cùng tên và cùng kết quả như bản của adapter giả (src/modules/m03/api/fake/fakeAdminApi.ts) */
export const LOCAL_HOOKS: Record<string, (...args: never[]) => Promise<unknown>> = {
  async seedSharedRoutes(checkpointName: string, routeA: string, routeB: string) {
    const { seedPublishedCheckpoint, seedPublishedRoute } = await seeds();
    const api = await apiAs('CONTENT_STAFF');
    const checkpointId = await seedPublishedCheckpoint(api, checkpointName);
    const routeIds = [await seedPublishedRoute(api, routeA, [checkpointId]), await seedPublishedRoute(api, routeB, [checkpointId])];
    return { checkpointId, routeIds };
  },
  async seedCloseScenario(checkpointName: string, otherCheckpointName: string, routeA: string, routeB: string) {
    const { seedPublishedCheckpoint, seedPublishedRoute } = await seeds();
    const api = await apiAs('CONTENT_STAFF');
    const checkpointId = await seedPublishedCheckpoint(api, checkpointName);
    const otherCheckpointId = await seedPublishedCheckpoint(api, otherCheckpointName);
    const routeIds = [await seedPublishedRoute(api, routeA, [checkpointId]), await seedPublishedRoute(api, routeB, [checkpointId, otherCheckpointId])];
    return { checkpointId, otherCheckpointId, routeIds };
  },
  async reviseRouteAs(role: Role, routeId: string, change: Record<string, unknown>) {
    const { reviseRoute } = await seeds();
    return reviseRoute(await apiAs(role), routeId, change);
  },
  async readPublication(routeId: string) {
    return readPublicationLocal(routeId);
  },
  /** Chuyến đi synthetic kết thúc `daysAgo` ngày trước, ghé điểm dừng đầu của hành trình active (như bản giả) */
  async seedSessions(routeId: string, sessions: { daysAgo: number; status: 'HOAN_TAT' | 'BO_DO' }[]) {
    for (const { daysAgo, status } of sessions) {
      sql(`insert into app.session_records (session_id, route_id, content_version, started_at, ended_at, status, visited_checkpoints, ingested_at)
        select gen_random_uuid(), r.route_id, r.active_content_version, now() - interval '${Number(daysAgo)} days' - interval '1 hour',
               now() - interval '${Number(daysAgo)} days', '${status === 'BO_DO' ? 'BO_DO' : 'HOAN_TAT'}',
               coalesce((select jsonb_build_array(jsonb_build_object('checkpointId', k ->> 'checkpointId', 'checkpointName', k #>> '{checkpointName,vi}',
                 'sequence', (k ->> 'sequence')::int, 'checkedInAt', to_char((now() - interval '${Number(daysAgo)} days' - interval '1 hour') at time zone 'UTC',
                 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))) from jsonb_array_elements(s.checkpoints) k order by (k ->> 'sequence')::int limit 1), '[]'),
               now() - interval '${Number(daysAgo)} days'
        from app.routes r join app.journey_snapshots s on s.route_id = r.route_id and s.content_version = r.active_content_version
        where r.route_id = '${routeId.replaceAll("'", "''")}';`);
    }
  },
};
