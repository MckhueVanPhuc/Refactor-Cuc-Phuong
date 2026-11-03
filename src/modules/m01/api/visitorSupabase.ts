// Một Supabase client cho phần du khách của M01, tạo lười ở lần dùng đầu (validation-report DV-09).
// Chỉ publishable key, qua factory dùng chung; không sửa src/shared/supabase/client.ts.
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseClient } from '../../../shared/supabase/client';

let client: SupabaseClient<any, 'api'> | undefined;

export function visitorSupabase(): SupabaseClient<any, 'api'> {
  client ??= createSupabaseClient();
  return client;
}
