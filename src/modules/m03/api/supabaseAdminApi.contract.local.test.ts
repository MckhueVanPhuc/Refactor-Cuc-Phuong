// @vitest-environment node
// Bộ test hành vi dùng chung chạy với adapter Supabase trên stack local (tasks M03 T197): cùng các suite của adapter giả.
// Chỉ chạy khi M03_LOCAL_STACK=1 (cần `supabase start`, `supabase db reset` và Docker); `npm run test` thường bỏ qua.
// Mỗi test bắt đầu từ trạng thái seed sạch (test_support.reset_m03 qua psql trong container DB). Ca `fakeOnly` cần tiêm
// lỗi hoặc giữ khóa nên chỉ chạy với adapter giả; pgTAP của Phase 14 phủ chúng trên SQL.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { describe } from 'vitest';
import { journeySnapshotSchema } from '../../../shared/contracts/journeySnapshot';
import { publishedRouteSchema } from '../../../shared/contracts/publishedRoute';
import type { AdminRole, AuditRow } from '../contracts/adminDtos';
import { accountsContract } from './contract/accounts.contract';
import { auditContract } from './contract/audit.contract';
import { checkpointsContract } from './contract/checkpoints.contract';
import { describeAdminApiContract, type ContractControls } from './contract/harness';
import { historyContract } from './contract/history.contract';
import { mediaContract } from './contract/media.contract';
import { operationsContract } from './contract/operations.contract';
import { publishReviseContract } from './contract/publish-revise.contract';
import { publishRouteContract } from './contract/publish-route.contract';
import { reportsContract } from './contract/reports.contract';
import { storeContract } from './contract/store.contract';
import { createSupabaseAdminApi } from './supabaseAdminApi';

const enabled = process.env.M03_LOCAL_STACK === '1';
const DB_CONTAINER = process.env.M03_DB_CONTAINER ?? 'supabase_db_cuc-phuong-quest-local';
// Mật khẩu synthetic của seed.sql; tài khoản *@example.test chỉ có ở stack local
const SEED_PASSWORD = 'Matkhau-thu-123';
const SEED_EMAIL: Record<AdminRole, string> = { REVIEWER: 'reviewer@example.test', CONTENT_STAFF: 'staff@example.test' };

/** VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY từ môi trường, nếu không có thì từ .env.local (quickstart §2) */
function localConfig(): { url: string; key: string } {
  const fromFile: Record<string, string> = {};
  try {
    for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
      const match = /^([A-Z_]+)=(.*)$/.exec(line.trim());
      if (match) fromFile[match[1]!] = match[2]!;
    }
  } catch {
    // không có .env.local
  }
  const read = (name: string) => process.env[name] ?? fromFile[name] ?? '';
  return { url: read('VITE_SUPABASE_URL'), key: read('VITE_SUPABASE_PUBLISHABLE_KEY') };
}

/** Chạy SQL bằng psql trong container DB; trả dòng cuối của output (-tA) */
function sql(statement: string): string {
  const out = execFileSync('docker', ['exec', '-i', DB_CONTAINER, 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-tAq'], {
    input: statement,
  });
  return out.toString().trim().split(/\r?\n/).at(-1) ?? '';
}

const literal = (value: string) => `'${value.replaceAll("'", "''")}'`;
const camelKeys = (row: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(row)
      .filter(([, value]) => value !== null)
      .map(([key, value]) => [key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase()), value]),
  );

function createLocalSubject() {
  sql('select test_support.reset_m03();');
  const { url, key } = localConfig();
  const supabase = createClient(url, key, {
    db: { schema: 'api' },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  async function signInWith(email: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password: SEED_PASSWORD });
    if (error) throw new Error(`không đăng nhập được ${email}`);
  }

  const controls: ContractControls = {
    signInAs: (role) => signInWith(SEED_EMAIL[role]),
    signInWithoutAccount: () => signInWith('noaccount@example.test'),
    signOut: async () => {
      await supabase.auth.signOut({ scope: 'local' });
    },
    // Dòng audit theo thứ tự ghi, hiển thị như Q-10 (không có id)
    auditRows: async () =>
      JSON.parse(sql(`select coalesce(jsonb_agg(app.audit_row(a, false) order by a.occurred_at, a.audit_id), '[]') from app.audit_records a;`)) as AuditRow[],
    // Như adapter giả: chỉ dòng thực thể Nháp, không bản nháp, không audit
    seedRoute: async (name) => sql(`insert into app.routes (created_by_user_id) values (${literal(`seed:${name}`)}) returning route_id;`),
    seedCheckpoint: async (name) => sql(`insert into app.checkpoints (created_by_user_id) values (${literal(`seed:${name}`)}) returning checkpoint_id;`),
    // Tài khoản có thật thì đã được một Quản lý mời: một dòng audit ACCOUNT_INVITED như ngoài đời (STALE nêu người đó)
    seedAccount: async ({ email, role, status }) => {
      const userId = crypto.randomUUID();
      sql(`select test_support.create_auth_user(${literal(userId)}, ${literal(email)}, ${literal(SEED_PASSWORD)});
        ${status === 'INVITATION_PENDING'
          ? `insert into app.admin_accounts (email, role) values (${literal(email)}, ${literal(role)});`
          : `select test_support.create_admin_account(${literal(email)}, ${literal(userId)}, ${literal(role)}, ${literal(status)});`}
        select app.audit('00000000-0000-4000-8000-000000000001', 'ACCOUNT_INVITED', 'ACCOUNT', ${literal(email)}, 'SUCCESS');`);
    },
    // Những gì M01 đọc được (publication-public §2–§3): hai view, cột snake_case → khóa camelCase, qua Zod
    readPublication: async (routeId) => {
      const route = await supabase.from('published_routes').select('*').eq('route_id', routeId).maybeSingle();
      const snapshot = await supabase.from('active_journey_snapshots').select('*').eq('route_id', routeId).maybeSingle();
      if (route.error || snapshot.error) throw new Error('không đọc được view công khai');
      return {
        route: route.data ? publishedRouteSchema.parse(camelKeys(route.data)) : null,
        snapshot: snapshot.data ? journeySnapshotSchema.parse(camelKeys(snapshot.data)) : null,
      };
    },
  };
  return { api: createSupabaseAdminApi(supabase), controls };
}

describe.runIf(enabled)('stack Supabase local', () => {
  describeAdminApiContract(
    'adapter Supabase (stack local)',
    createLocalSubject,
    {
      store: storeContract,
      media: mediaContract,
      accounts: accountsContract,
      checkpoints: checkpointsContract,
      routes: publishRouteContract,
      revise: publishReviseContract,
      operations: operationsContract,
      history: historyContract,
      audit: auditContract,
      reports: reportsContract,
    },
    { fakeOnly: false },
  );
});
