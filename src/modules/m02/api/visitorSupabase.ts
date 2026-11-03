// Một Supabase client cho M02, tạo lười ở lần dùng đầu. Chỉ publishable key, qua factory dùng chung (client mở schema
// `api`); không import client của M01 (FR-M02-020).
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseClient } from '../../../shared/supabase/client';

let client: SupabaseClient<any, 'api'> | undefined;

export function visitorSupabase(): SupabaseClient<any, 'api'> {
  client ??= createSupabaseClient();
  return client;
}
