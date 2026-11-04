// Dựng dữ liệu cho E2E `m02-local-stack` (tasks M02 T105) phía Node, theo mẫu e2e/m01/localStack.ts: dữ liệu synthetic
// được M03 xuất bản thật qua adapter Supabase của stack local, không qua hook trong trình duyệt. M03 không tạo
// `e2e/.local-fixture.json` (validation-report M03 D-132), nên `routeId`/`qrIdentifier` do hệ thống sinh được đọc lại ở
// đây (BR-M03-B01: không hard-code `Q1a`). Chỉ chạy với PW_LOCAL_STACK=1; không gọi Supabase cloud.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AdminApi } from '../../src/modules/m03/api/AdminApi';
import { closeRoute, visitorClient } from '../m01/localStack';
import { LOCAL_HOOKS, localConfig, resetLocalStack, sql } from '../m03/localStack';

export const M02_LOCAL_PROJECT = 'm02-local-stack';

export { closeRoute, resetLocalStack, sql };

const SEED_PASSWORD = 'Matkhau-thu-123';
const SEED_EMAIL = { REVIEWER: 'reviewer@example.test', CONTENT_STAFF: 'staff@example.test' } as const;

/** AdminApi Supabase đăng nhập bằng tài khoản seed synthetic (như e2e/m01/localStack.ts) */
async function apiAs(role: keyof typeof SEED_EMAIL): Promise<AdminApi> {
  (globalThis as { __IS_PRODUCTION_BUILD__?: boolean }).__IS_PRODUCTION_BUILD__ = false;
  // Đường dẫn trong biến: tsconfig.node (e2e) không có kiểu Vite mà env.ts cần (như e2e/m03/localStack.ts)
  const adapterPath = '../../src/modules/m03/api/supabaseAdminApi';
  const { createSupabaseAdminApi } = (await import(adapterPath)) as {
    createSupabaseAdminApi: (supabase: SupabaseClient<any, 'api'>) => AdminApi;
  };
  const supabase = visitorClient();
  const { error } = await supabase.auth.signInWithPassword({ email: SEED_EMAIL[role], password: SEED_PASSWORD });
  if (error) throw new Error(`không đăng nhập được ${SEED_EMAIL[role]}`);
  return createSupabaseAdminApi(supabase);
}

function must<T>(result: { ok: true; data: T } | { ok: false; reason: string }, what: string): T {
  if (!result.ok) throw new Error(`${what}: ${result.reason}`);
  return result.data;
}

const literal = (value: string) => `'${value.replaceAll("'", "''")}'`;

/** Các `qr_identifier` của một điểm dừng, theo thứ tự tạo */
function qrCodesOf(checkpointId: string): string[] {
  const list = sql(`select coalesce(string_agg(qr_identifier, ',' order by created_at, qr_identifier), '')
    from app.qr_codes where checkpoint_id = ${literal(checkpointId)};`);
  return list ? list.split(',') : [];
}

export type M02Names = {
  c1: string;
  c2: string;
  cx: string;
  mainRoute: string;
  closableRoute: string;
  /** Tên đối tượng của điểm tham quan thứ hai ở C1 */
  q1bObject: string;
  q1bIntro: string;
};

export type M02World = {
  mainRoute: string;
  closableRoute: string;
  c1: string;
  c2: string;
  cx: string;
  q1a: string;
  q1b: string;
  q2: string;
  qx: string;
};

/**
 * Thế giới của quickstart M02 §4 trên dữ liệu thật:
 * - tuyến chính liệt kê C1, C2 (C2 là điểm cuối); C1 có hai điểm tham quan Q1a, Q1b;
 * - tuyến "đóng thử" chỉ liệt kê C1 (V14 ROUTE tạm đóng tuyến này giữa chuyến);
 * - CX đã xuất bản rồi tạm đóng, không tuyến nào liệt kê (V14 CHECKPOINT).
 */
export async function seedM02World(names: M02Names): Promise<M02World> {
  const seed = LOCAL_HOOKS.seedCloseScenario as unknown as (
    ...args: string[]
  ) => Promise<{ checkpointId: string; otherCheckpointId: string; routeIds: [string, string] }>;
  // seedCloseScenario: tuyến thứ nhất liệt kê C1, tuyến thứ hai liệt kê C1, C2
  const { checkpointId: c1, otherCheckpointId: c2, routeIds } = await seed(names.c1, names.c2, names.closableRoute, names.mainRoute);
  const [closableRoute, mainRoute] = routeIds;
  const [q1a] = qrCodesOf(c1);
  const [q2] = qrCodesOf(c2);

  const staff = await apiAs('CONTENT_STAFF');
  // Điểm tham quan thứ hai ở C1, xuất bản riêng (QR_OBJECT)
  const file = new File([new Uint8Array(4096)], 'anh.jpg', { type: 'image/jpeg' });
  const { objectPath } = await staff.uploadMedia({ ownerType: 'CHECKPOINT', ownerId: c1, file });
  const { mediaId } = must(
    await staff.registerMedia({ ownerType: 'CHECKPOINT', ownerId: c1, usage: 'QR_MEDIA', type: 'IMAGE', objectPath }),
    'đăng ký ảnh',
  );
  const { qrIdentifier: q1b } = must(
    await staff.saveVisitPointDraft({
      checkpointId: c1,
      content: {
        objectName: { vi: names.q1bObject, en: `${names.q1bObject} (en)` },
        introductionText: { vi: names.q1bIntro, en: `${names.q1bIntro} (en)` },
        mediaItems: [{ mediaId }],
      },
      mediaSettings: [{ mediaId, usageRightsConfirmed: true }],
    }),
    'tạo điểm tham quan thứ hai',
  );
  const review = await staff.openPublicationReview({ unitType: 'QR_OBJECT', subjectId: q1b });
  must(
    await staff.publishUnit({ unitType: 'QR_OBJECT', subjectId: q1b, reviewedConcurrencyRevision: review.reviewedConcurrencyRevision }),
    'xuất bản điểm tham quan thứ hai',
  );

  // CX: xuất bản rồi Quản lý tạm đóng (C-10)
  const { seedPublishedCheckpoint } = await import('../../src/modules/m03/api/fake/e2eSeed');
  const cx = await seedPublishedCheckpoint(staff, names.cx);
  const [qx] = qrCodesOf(cx);
  const reviewer = await apiAs('REVIEWER');
  const editor = await reviewer.getCheckpointEditor(cx);
  must(
    await reviewer.closeCheckpoint({
      checkpointId: cx,
      reason: 'Đóng thử cho kiểm thử M02',
      expected: { entity: editor.concurrencyRevision, draft: editor.draft?.concurrencyRevision },
    }),
    'tạm đóng CX',
  );

  if (!q1a || !q2 || !qx) throw new Error('thiếu qr_identifier sau khi dựng dữ liệu');
  return { mainRoute, closableRoute, c1, c2, cx, q1a, q1b, q2, qx };
}

/** Gửi một SessionSyncRecord như M02 (publishable key, không JWT); kết quả theo bảng HTTP của session-intake §3 */
export async function sendAsVisitor(record: unknown): Promise<{ status: number; result: string | undefined }> {
  const { url, key } = localConfig();
  const response = await fetch(`${url}/functions/v1/session-intake`, {
    method: 'POST',
    headers: { apikey: key, 'content-type': 'application/json' },
    body: JSON.stringify(record),
  });
  const text = await response.text();
  return { status: response.status, result: text ? (JSON.parse(text) as { result?: string }).result : undefined };
}

/** Số dòng SessionRecord của M03 cho một sessionId */
export const sessionRecordCount = (sessionId: string): number =>
  Number(sql(`select count(*) from app.session_records where session_id = ${literal(sessionId)};`));
