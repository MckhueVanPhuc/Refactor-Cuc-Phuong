// Gửi SessionSyncRecord tới Edge Function `session-intake` của M03 (tasks T088; session-sync-record-contract §3–§4;
// research R-11, L-02). Ánh xạ response: `ACCEPTED`/`IDENTICAL` → `SYNCED`; `CONFLICT` (409) hoặc `INVALID` (422, 413)
// → `CONFLICT`, dừng tự gửi (BR-M02-011); MỌI trường hợp khác (mạng, quá SYNC_REQUEST_TIMEOUT_SECONDS, 5xx, 429, 4xx
// khác, body không đọc được) → giữ `PENDING`, để lỗi cấu hình hay triển khai tạm thời không khóa vĩnh viễn bản ghi hợp lệ.
import { FunctionsHttpError } from '@supabase/supabase-js';
import type { SessionSyncRecord } from '../../../shared/contracts/sessionSyncRecord';
import { SYNC_REQUEST_TIMEOUT_SECONDS } from '../config/limits';
import { visitorSupabase } from './visitorSupabase';

export type IntakeOutcome = 'SYNCED' | 'CONFLICT' | 'KEEP_PENDING';

type InvokeResponse = { data: unknown; error: unknown };

/** Phần của `supabase.functions` mà adapter dùng; test dùng bản giả. */
export type FunctionsApi = {
  invoke(name: string, options: { body: unknown; signal?: AbortSignal }): Promise<InvokeResponse>;
};

export type IntakeClient = { send(record: SessionSyncRecord): Promise<IntakeOutcome> };

const resultOf = (body: unknown): unknown =>
  typeof body === 'object' && body !== null ? (body as { result?: unknown }).result : undefined;

/** Body lỗi của response non-2xx; không đọc được → `undefined`. */
async function errorBody(error: FunctionsHttpError): Promise<unknown> {
  try {
    return await (error.context as Response).json();
  } catch {
    return undefined;
  }
}

async function classify(response: InvokeResponse): Promise<IntakeOutcome> {
  if (!response.error) {
    const result = resultOf(response.data);
    return result === 'ACCEPTED' || result === 'IDENTICAL' ? 'SYNCED' : 'KEEP_PENDING';
  }
  if (!(response.error instanceof FunctionsHttpError)) return 'KEEP_PENDING';
  const status = (response.error.context as Response | undefined)?.status;
  const result = resultOf(await errorBody(response.error));
  if (status === 409 && result === 'CONFLICT') return 'CONFLICT';
  if ((status === 422 || status === 413) && result === 'INVALID') return 'CONFLICT';
  return 'KEEP_PENDING';
}

export function createIntakeClient({
  functions,
  timeoutSeconds = SYNC_REQUEST_TIMEOUT_SECONDS,
}: {
  functions: () => FunctionsApi;
  timeoutSeconds?: number;
}): IntakeClient {
  return {
    async send(record) {
      const controller = new AbortController();
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timeout = new Promise<'KEEP_PENDING'>((resolve) => {
        timer = setTimeout(() => {
          controller.abort();
          resolve('KEEP_PENDING');
        }, timeoutSeconds * 1000);
      });
      try {
        const request = functions()
          .invoke('session-intake', { body: record, signal: controller.signal })
          .then(classify, (): IntakeOutcome => 'KEEP_PENDING');
        return await Promise.race([request, timeout]);
      } catch {
        return 'KEEP_PENDING';
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

export const intakeClient: IntakeClient = createIntakeClient({ functions: () => visitorSupabase().functions as unknown as FunctionsApi });
