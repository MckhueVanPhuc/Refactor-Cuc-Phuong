import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';

/**
 * Tạo Supabase client cho trình duyệt. Chỉ dùng publishable key; secret key không bao giờ
 * vào bundle (environment.md §4, §7). Data API chỉ mở schema `api` (Physical §3, §9).
 */
export function createSupabaseClient(): SupabaseClient<any, 'api'> {
  return createClient(env.supabaseUrl, env.supabasePublishableKey, {
    db: { schema: 'api' },
    auth: { persistSession: true, autoRefreshToken: true },
  });
}
