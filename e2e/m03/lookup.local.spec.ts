// Q22 — live lookup trên stack Supabase local (tasks M03 T191; live-qr-lookup-contract §1–§4; BR-M03-I01–I04).
// Chạy chính bảng sự thật LIVE_QR_LOOKUP_CASES: dựng thế giới của mỗi ca bằng test_support.lookup_world (seed.sql, qua
// psql trong container DB), gọi RPC `api.lookup_qr` bằng publishable key như du khách, parse bằng Zod rồi so `expected`.
// Chỉ chạy ở project m03-local-stack (PW_LOCAL_STACK=1). Không secret: URL và publishable key của stack local.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { liveQrLookupResultSchema } from '../../src/shared/contracts/liveQrLookup';
import { LIVE_QR_LOOKUP_CASES, type LiveQrLookupCase } from '../../src/shared/contracts/liveQrLookup.cases';

const DB_CONTAINER = process.env.M03_DB_CONTAINER ?? 'supabase_db_cuc-phuong-quest-local';

/** VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY từ môi trường, nếu không có thì từ .env.local (quickstart §2) */
function localConfig(): { url: string; key: string } {
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

function sql(statement: string): void {
  execFileSync('docker', ['exec', '-i', DB_CONTAINER, 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-tAq'], {
    input: statement,
  });
}

const literal = (value: string) => `'${value.replaceAll("'", "''")}'`;

/** routeId gửi lên theo ca: vắng (khách tự do), không tồn tại, tuyến liệt kê hoặc không liệt kê điểm dừng */
function routeIdOf({ input }: LiveQrLookupCase): string | undefined {
  if (input.route === undefined) return undefined;
  if (input.route === 'KHONG_CO') return 'RtMissing00000001';
  return input.routeListsCheckpoint === false ? 'RtNotListing00001' : 'RtListing00000001';
}

test.describe('Q22 live lookup trên stack local', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'm03-local-stack', 'chỉ chạy với stack Supabase local (PW_LOCAL_STACK=1)');
  });

  test.afterAll(({}, testInfo) => {
    if (testInfo.project.name === 'm03-local-stack') sql('select test_support.reset_m03();');
  });

  for (const lookupCase of LIVE_QR_LOOKUP_CASES) {
    test(`bước ${lookupCase.decidedAtStep}: ${lookupCase.name}`, async () => {
      const { url, key } = localConfig();
      const { input } = lookupCase;
      sql(`select test_support.lookup_world(${literal(input.qr)}, ${literal(input.checkpoint)}, ${literal(input.connectivityMode)}, ` +
        `${literal(input.route ?? 'HOAT_DONG')});`);
      const routeId = routeIdOf(lookupCase);
      const response = await fetch(`${url}/rest/v1/rpc/lookup_qr`, {
        method: 'POST',
        headers: { apikey: key, 'content-type': 'application/json', 'content-profile': 'api' },
        body: JSON.stringify({ p_qr_identifier: input.qrIdentifier, ...(routeId ? { p_route_id: routeId } : {}) }),
      });
      expect(response.status).toBe(200);
      // Body không qua Zod sẽ là lỗi nguồn ở M02, không phải INVALID (contract §4)
      const result = liveQrLookupResultSchema.parse(await response.json());
      expect(result).toEqual(lookupCase.expected);
    });
  }
});
