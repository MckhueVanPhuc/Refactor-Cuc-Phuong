// Edge `session-intake` — nối RPC `api.ingest_session` vào handler.ts (tasks M03 T195; session-intake-contract §2).
// `verify_jwt = false` trong supabase/config.toml: du khách gọi bằng publishable key, không phải JWT.
// APP_BACKEND_SECRET_KEY chỉ có trong secret của Edge (environment.md §4); không bao giờ trả về hay ghi log.
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import { type Deps, handle } from './handler.ts';

const service = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('APP_BACKEND_SECRET_KEY') ?? '', {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  db: { schema: 'api' },
});

// SQLSTATE 22023 của api.ingest_session = bản ghi không hợp lệ (migration 4d)
const INVALID_RECORD = '22023';

const deps: Deps = {
  async ingest(record) {
    const { data, error } = await service.rpc('ingest_session', { p_record: record });
    if (error?.code === INVALID_RECORD) return 'INVALID';
    if (error) throw new Error('ingest_session failed');
    return (data as { result: 'ACCEPTED' | 'IDENTICAL' | 'CONFLICT' }).result;
  },
};

Deno.serve((req) => handle(req, deps));
