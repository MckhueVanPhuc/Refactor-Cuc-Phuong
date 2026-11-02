// Edge `admin-accounts`: invite / resend / link (tasks M03 T178; auth-account-contract §2.2–2.3, §3).
// Logic thuần, không gọi mạng: index.ts nối các dependency thật (Auth Admin, RPC service_role) vào đây.
// Body trả về chỉ có `result`; không bao giờ có token, secret, user id hay lỗi thô của provider (BR-M03-L10).
import { json, preflight } from '../_shared/cors.ts';

export type CallerUser = { id: string; email: string };
export type CurrentAdmin = { email: string; role: string; status: string } | null;
type Prepared = { result: 'CREATED' | 'PENDING' | 'INVALID_EMAIL' | 'EMAIL_TAKEN' | 'FORBIDDEN' | 'FAILED'; email?: string };

export type Deps = {
  /** Người dùng của JWT (provider xác minh chữ ký, hạn, phiên); null nếu không hợp lệ */
  getUser(token: string): Promise<CallerUser | null>;
  /** `api.get_current_admin` gọi bằng JWT của người gọi; 'UNAUTHORIZED' khi PostgREST từ chối JWT */
  currentAdmin(token: string): Promise<CurrentAdmin | 'UNAUTHORIZED'>;
  prepareInvitation(actorUserId: string, email: string, role: string | null): Promise<Prepared>;
  recordAccountEvent(actorUserId: string, action: string, email: string, outcome: 'SUCCESS' | 'FAILURE'): Promise<void>;
  linkInvitation(userId: string, email: string): Promise<'LINKED' | 'LINK_REJECTED'>;
  /** Auth Admin `inviteUserByEmail`; false khi provider từ chối */
  inviteUserByEmail(email: string, redirectTo: string | undefined): Promise<boolean>;
};

const PREPARE_STATUS: Record<string, number> = { INVALID_EMAIL: 400, EMAIL_TAKEN: 409, FORBIDDEN: 403, FAILED: 400 };

function bearer(req: Request): string | null {
  const match = /^Bearer\s+(\S+)$/i.exec(req.headers.get('authorization') ?? '');
  return match ? match[1]! : null;
}

async function readBody(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await req.json();
    return typeof body === 'object' && body !== null && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function handle(req: Request, deps: Deps): Promise<Response> {
  if (req.method === 'OPTIONS') return preflight();
  if (req.method !== 'POST') return json(405, { result: 'FAILED' });

  const token = bearer(req);
  if (!token) return json(401, {});
  try {
    const user = await deps.getUser(token);
    if (!user) return json(401, {});

    const body = await readBody(req);
    const action = body?.action;

    if (action === 'link') {
      const result = await deps.linkInvitation(user.id, user.email);
      return json(result === 'LINKED' ? 200 : 422, { result });
    }
    if (action !== 'invite' && action !== 'resend') return json(400, { result: 'FAILED' });

    const email = typeof body?.email === 'string' ? body.email : '';
    const role = action === 'invite' ? (typeof body?.role === 'string' ? body.role : '') : null;
    let auditAction = action === 'invite' ? 'ACCOUNT_INVITED' : 'ACCOUNT_INVITE_RESENT';

    // Quyền đọc từ app.current_admin() với JWT của người gọi (phiên còn sống, ACTIVE), không từ metadata của JWT
    const admin = await deps.currentAdmin(token);
    if (admin === 'UNAUTHORIZED') return json(401, {});
    if (admin?.role !== 'REVIEWER') {
      await deps.recordAccountEvent(user.id, auditAction, email, 'FAILURE');
      return json(403, { result: 'FORBIDDEN' });
    }

    const prepared = await deps.prepareInvitation(user.id, email, role);
    if (prepared.result !== 'CREATED' && prepared.result !== 'PENDING') {
      await deps.recordAccountEvent(user.id, auditAction, email, 'FAILURE');
      return json(PREPARE_STATUS[prepared.result] ?? 400, { result: prepared.result });
    }
    // Mời một tài khoản đang chờ = gửi lại (auth-account §2.2 bước 3)
    if (prepared.result === 'PENDING') auditAction = 'ACCOUNT_INVITE_RESENT';
    const normalized = prepared.email ?? email;

    const origin = req.headers.get('origin');
    const sent = await deps.inviteUserByEmail(normalized, origin ? `${origin}/admin/invitation` : undefined);
    // Lỗi provider: tài khoản vẫn INVITATION_PENDING, gửi lại là idempotent (tech-stack §5)
    await deps.recordAccountEvent(user.id, auditAction, normalized, sent ? 'SUCCESS' : 'FAILURE');
    if (!sent) return json(502, { result: 'INVITE_FAILED' });
    return json(200, { result: prepared.result === 'CREATED' ? 'SENT' : 'RESENT' });
  } catch (error) {
    console.error('[admin-accounts]', error instanceof Error ? error.message : 'unknown error');
    return json(500, { result: 'FAILED' });
  }
}
