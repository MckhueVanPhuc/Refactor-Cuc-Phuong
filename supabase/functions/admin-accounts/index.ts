// Edge `admin-accounts` — nối dependency thật vào handler.ts (tasks M03 T178; auth-account-contract §2.2–2.3).
// `verify_jwt = false` trong supabase/config.toml: function tự xác minh JWT người gọi (publishable key không phải JWT).
// APP_BACKEND_SECRET_KEY chỉ có trong secret của Edge (environment.md §4); không bao giờ trả về hay ghi log.
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import { type Deps, handle } from './handler.ts';

const url = Deno.env.get('SUPABASE_URL') ?? '';
const publishableKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const secretKey = Deno.env.get('APP_BACKEND_SECRET_KEY') ?? '';

const noSession = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false };
const service = createClient(url, secretKey, { auth: noSession, db: { schema: 'api' } });

async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await service.rpc(name, args);
  if (error) throw new Error(`${name} failed`);
  return data as T;
}

const deps: Deps = {
  async getUser(token) {
    const { data, error } = await service.auth.getUser(token);
    if (error || !data.user?.email) return null;
    return { id: data.user.id, email: data.user.email };
  },
  async currentAdmin(token) {
    const caller = createClient(url, publishableKey, {
      auth: noSession,
      db: { schema: 'api' },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data, error, status } = await caller.rpc('get_current_admin');
    if (status === 401) return 'UNAUTHORIZED';
    if (error) throw new Error('get_current_admin failed');
    return data;
  },
  prepareInvitation: (actorUserId, email, role) =>
    rpc('prepare_invitation', { p_actor_user_id: actorUserId, p_email: email, p_role: role }),
  async recordAccountEvent(actorUserId, action, email, outcome) {
    await rpc('record_account_event', { p_actor_user_id: actorUserId, p_action: action, p_email: email, p_outcome: outcome });
  },
  async linkInvitation(userId, email) {
    const { result } = await rpc<{ result: 'LINKED' | 'LINK_REJECTED' }>('link_invitation', { p_user_id: userId, p_email: email });
    return result;
  },
  async inviteUserByEmail(email, redirectTo) {
    const { error } = await service.auth.admin.inviteUserByEmail(email, redirectTo ? { redirectTo } : undefined);
    return !error;
  },
};

Deno.serve((req) => handle(req, deps));
