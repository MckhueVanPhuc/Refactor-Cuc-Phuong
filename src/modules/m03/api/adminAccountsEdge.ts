// Client Edge Function `admin-accounts` (auth-account-contract §2.2–2.3, §3; tasks T064).
// HTTP + `result` → CommandResult có messageKey; body không bao giờ được hiển thị thô (BR-M03-L10).
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AdminRole } from '../contracts/adminDtos';
import type { CommandResult } from '../contracts/commandResult';
import type { MessageKey } from '../messages/catalog';
import { AdminApiError } from './errors';
import { ADMIN_ACCOUNTS_FUNCTION } from './rpcNames';

export type AdminAccountsAction =
  | { action: 'invite'; email: string; role: AdminRole }
  | { action: 'resend'; email: string }
  | { action: 'link' };

type EdgeResult = 'SENT' | 'RESENT' | 'LINKED' | 'INVALID_EMAIL' | 'EMAIL_TAKEN' | 'FORBIDDEN' | 'LINK_REJECTED' | 'INVITE_FAILED';

const BLOCKED_KEYS: Partial<Record<EdgeResult, MessageKey>> = {
  INVALID_EMAIL: 'MSG-EMAIL-INVALID',
  EMAIL_TAKEN: 'MSG-EMAIL-TAKEN',
  LINK_REJECTED: 'MSG-LINK-INVALID',
  INVITE_FAILED: 'MSG-INVITE-FAILED',
};

/** Ánh xạ `result` của Edge sang CommandResult; email đi kèm để điền {email} của câu thông báo. */
export function mapEdgeResult(result: string | undefined, email: string | undefined): CommandResult<null> {
  const values: Record<string, string> = email ? { email } : {};
  switch (result) {
    case 'SENT':
      return { ok: true, messageKey: 'MSG-INVITE-SENT', data: null };
    case 'RESENT':
      return { ok: true, messageKey: 'MSG-INVITE-RESENT', data: null };
    // Nối tài khoản xong không có câu thông báo riêng; UI chuyển màn (auth-account §3)
    case 'LINKED':
      return { ok: true, messageKey: 'MSG-SAVED', data: null };
    case 'FORBIDDEN':
      return { ok: false, reason: 'FORBIDDEN', messageKey: 'MSG-NO-PERMISSION' };
  }
  const blocked = result ? BLOCKED_KEYS[result as EdgeResult] : undefined;
  return blocked
    ? { ok: false, reason: 'BLOCKED', messageKey: blocked, values }
    : { ok: false, reason: 'FAILED', messageKey: 'MSG-GENERIC' };
}

async function readResult(response: unknown): Promise<string | undefined> {
  if (!(response instanceof Response)) return undefined;
  try {
    const body = (await response.json()) as { result?: unknown };
    return typeof body.result === 'string' ? body.result : undefined;
  } catch {
    return undefined;
  }
}

export async function callAdminAccounts(
  supabase: SupabaseClient<any, 'api'>,
  body: AdminAccountsAction,
): Promise<CommandResult<null>> {
  const email = 'email' in body ? body.email : undefined;
  const { data, error } = await supabase.functions.invoke<{ result?: string }>(ADMIN_ACCOUNTS_FUNCTION, { body });
  if (!error) return mapEdgeResult(data?.result, email);
  // FunctionsHttpError: response lỗi có `result`; 401 = phiên hết hạn (§3)
  const response = (error as { context?: unknown }).context;
  if (response instanceof Response && response.status === 401) throw new AdminApiError('MSG-SESSION-EXPIRED');
  const result = await readResult(response);
  if (result) return mapEdgeResult(result, email);
  throw AdminApiError.from(error);
}
