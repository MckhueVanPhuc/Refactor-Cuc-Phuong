// T199 — mục tiêu hiệu năng trên stack local (research R-24; BR-M03-G07 "performance target for later technical design"):
// publish / close / reopen ≤ 5 s p95 với 10 tuyến cùng liệt kê 30 điểm dừng, mỗi điểm 20 điểm tham quan; api.lookup_qr
// ≤ 300 ms p95. Đo RPC thật qua supabase-js (gồm HTTP local). Không đạt thì ghi rủi ro trong validation-report, không
// chặn release: spec chỉ ghi số đo (annotation + test-results/m03-perf.json), không assert ngưỡng.
// Chỉ chạy ở project m03-local-stack (PW_LOCAL_STACK=1).
import { mkdirSync, writeFileSync } from 'node:fs';
import { test } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { LOCAL_STACK_PROJECT, localConfig, sql } from './localStack';

const RUNS = 10;
const LOOKUPS = 100;
const CHECKPOINT = 'PerfCheckpoint001';

async function signedIn(email: string): Promise<SupabaseClient<any, 'api'>> {
  const { url, key } = localConfig();
  const supabase = createClient(url, key, { db: { schema: 'api' }, auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await supabase.auth.signInWithPassword({ email, password: 'Matkhau-thu-123' });
  if (error) throw new Error(`không đăng nhập được ${email}`);
  return supabase;
}

async function rpc(supabase: SupabaseClient<any, 'api'>, name: string, args: Record<string, unknown>) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw new Error(`${name}: ${error.message}`);
  return data as Record<string, any>;
}

/** Thời gian (ms) của một lời gọi, kiểm kết quả là thành công */
async function timed(run: () => Promise<Record<string, any>>): Promise<number> {
  const start = performance.now();
  const result = await run();
  const elapsed = performance.now() - start;
  if (result && result.ok === false) throw new Error(`lệnh bị từ chối: ${result.reason} ${result.messageKey}`);
  return elapsed;
}

const p95 = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(0.95 * sorted.length) - 1)]!;
};

test('T199 — hiệu năng publish / close / reopen và live lookup', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== LOCAL_STACK_PROJECT, 'chỉ chạy với stack Supabase local (PW_LOCAL_STACK=1)');
  test.setTimeout(15 * 60_000);
  sql('select test_support.reset_m03();');
  sql('select test_support.perf_world();');
  const staff = await signedIn('staff@example.test');
  const reviewer = await signedIn('reviewer@example.test');
  const editorRevision = async () => (await rpc(staff, 'get_checkpoint_editor', { p_checkpoint_id: CHECKPOINT })) as Record<string, any>;

  // publish: đổi tên điểm dừng chung → dựng lại 10 hành trình (CHECKPOINT_REVISION)
  const publish: number[] = [];
  const review: number[] = [];
  for (let i = 0; i < RUNS; i += 1) {
    const editor = await editorRevision();
    await rpc(staff, 'save_checkpoint_draft', {
      p_checkpoint_id: CHECKPOINT,
      p_expected: { entity: editor.concurrencyRevision, draft: editor.draft?.concurrencyRevision },
      p_content: { checkpointName: { vi: `Điểm hiệu năng 1 — lần ${i + 1}`, en: `Perf checkpoint 1 — run ${i + 1}` }, connectivityMode: 'OFFLINE_REQUIRED' },
    });
    let reviewed = 0;
    review.push(await timed(async () => {
      const value = await rpc(staff, 'open_publication_review', { p_unit_type: 'CHECKPOINT_REVISION', p_subject_id: CHECKPOINT });
      reviewed = value.reviewedConcurrencyRevision;
      return value;
    }));
    publish.push(await timed(() => rpc(staff, 'publish_unit', {
      p_unit_type: 'CHECKPOINT_REVISION', p_subject_id: CHECKPOINT, p_reviewed_concurrency_revision: reviewed,
    })));
  }

  // close (Nhân viên) và reopen (Quản lý) điểm dừng chung → 10 hành trình mỗi lần
  const close: number[] = [];
  const reopen: number[] = [];
  for (let i = 0; i < RUNS; i += 1) {
    close.push(await timed(async () => rpc(staff, 'close_checkpoint', {
      p_checkpoint_id: CHECKPOINT, p_reason: 'Đo hiệu năng', p_expected: { entity: (await editorRevision()).concurrencyRevision },
    })));
    reopen.push(await timed(async () => rpc(reviewer, 'reopen_checkpoint', {
      p_checkpoint_id: CHECKPOINT, p_safety_note: 'Đo hiệu năng', p_expected: { entity: (await editorRevision()).concurrencyRevision },
    })));
  }

  // live lookup như du khách
  const { url, key } = localConfig();
  const visitor = createClient(url, key, { db: { schema: 'api' }, auth: { persistSession: false } });
  const lookup: number[] = [];
  for (let i = 0; i < LOOKUPS; i += 1) {
    const qr = `PerfQr${String((i % 30) + 1).padStart(3, '0')}${String((i % 20) + 1).padStart(3, '0')}AbCdEf`;
    lookup.push(await timed(async () => {
      const value = await rpc(visitor, 'lookup_qr', { p_qr_identifier: qr });
      if (value.outcome !== 'VALID') throw new Error(`lookup ${value.outcome}`);
      return value;
    }));
  }

  const summary = {
    fixture: { routes: 10, checkpointsPerRoute: 30, visitPointsPerCheckpoint: 20, runs: RUNS, lookups: LOOKUPS },
    p95Ms: { review: p95(review), publish: p95(publish), close: p95(close), reopen: p95(reopen), lookup: p95(lookup) },
    targetsMs: { publish: 5000, close: 5000, reopen: 5000, lookup: 300 },
    snapshotsAfter: Number(sql("select count(*) from app.journey_snapshots where route_id like 'PerfRoute%';")),
  };
  mkdirSync('test-results', { recursive: true });
  writeFileSync('test-results/m03-perf.json', JSON.stringify(summary, null, 2));
  testInfo.annotations.push({ type: 'perf', description: JSON.stringify(summary.p95Ms) });
  console.log('[T199]', JSON.stringify(summary));
  sql('select test_support.reset_m03();');
});
