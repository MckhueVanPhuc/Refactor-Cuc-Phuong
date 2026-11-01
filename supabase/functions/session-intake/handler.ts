// Edge `session-intake`: nhận một SessionSyncRecord của M02 (tasks M03 T195; session-intake-contract §1–§3).
// Logic thuần, không gọi mạng: index.ts nối RPC `api.ingest_session` (service_role) vào đây.
// Thứ tự: preflight → chỉ POST → body ≤ 64 KiB → JSON → Zod strict (allowlist khóa) → RPC. Body trả về chỉ có `result`.
import { json, preflight } from '../_shared/cors.ts';
import { sessionSyncRecordSchema, type SessionSyncRecord } from '../_shared/sessionSyncRecord.ts';

/** Trần kỹ thuật của một bản ghi (research R-25) */
export const MAX_BODY_BYTES = 64 * 1024;

export type IngestResult = 'ACCEPTED' | 'IDENTICAL' | 'CONFLICT' | 'INVALID';

export type Deps = {
  /** `api.ingest_session`; bản ghi bị DB từ chối → 'INVALID'; lỗi khác ném ra (M02 giữ PENDING và thử lại) */
  ingest(record: SessionSyncRecord): Promise<IngestResult>;
};

const STATUS: Record<IngestResult, number> = { ACCEPTED: 200, IDENTICAL: 200, CONFLICT: 409, INVALID: 422 };

export async function handle(req: Request, deps: Deps): Promise<Response> {
  if (req.method === 'OPTIONS') return preflight();
  if (req.method !== 'POST') return json(405, { result: 'INVALID' });
  if (Number(req.headers.get('content-length') ?? '0') > MAX_BODY_BYTES) return json(413, { result: 'INVALID' });

  try {
    const bytes = new Uint8Array(await req.arrayBuffer());
    if (bytes.byteLength > MAX_BODY_BYTES) return json(413, { result: 'INVALID' });
    let body: unknown;
    try {
      body = JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      return json(422, { result: 'INVALID' });
    }
    // Khóa ngoài allowlist, ở gốc hay ở lượt ghé, bị từ chối ở đây (BR-M03-J01)
    const parsed = sessionSyncRecordSchema.safeParse(body);
    if (!parsed.success) return json(422, { result: 'INVALID' });
    const result = await deps.ingest(parsed.data);
    return json(STATUS[result], { result });
  } catch (error) {
    console.error('[session-intake]', error instanceof Error ? error.message : 'unknown error');
    return json(500, {});
  }
}
