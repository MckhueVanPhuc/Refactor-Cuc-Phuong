// Giao diện tới auth provider (Supabase Auth) — auth-account-contract §2; research R-15.
// Provider chỉ giữ danh tính và mật khẩu; quyền M03 lấy từ Q-01 `get_current_admin`, không từ token.

export type AuthFailure = 'INVALID_CREDENTIALS' | 'PASSWORD_REJECTED' | 'LINK_INVALID' | 'NETWORK' | 'UNKNOWN';

/** Lỗi provider đã phân loại; chi tiết gốc chỉ vào console (BR-M03-L10) */
export class AuthError extends Error {
  readonly kind: AuthFailure;

  constructor(kind: AuthFailure) {
    super(kind);
    this.name = 'AuthError';
    this.kind = kind;
  }
}

export type LinkKind = 'invite' | 'recovery';
export type AuthEvent = 'SIGNED_IN' | 'SIGNED_OUT';

export interface AuthService {
  /** Lỗi: AuthError INVALID_CREDENTIALS / NETWORK / UNKNOWN */
  signInWithPassword(email: string, password: string): Promise<void>;
  /** `signOut({ scope: 'local' })`: kết thúc phiên hiện tại; token cũ bị từ chối */
  signOut(): Promise<void>;
  /** Gửi link khôi phục tới `/admin/recovery`; không tiết lộ email có tồn tại (BR-M03-K02) */
  requestPasswordRecovery(email: string): Promise<void>;
  /** URL hiện tại (search + hash) có mang link mời/khôi phục của provider không */
  hasLinkInUrl(urlPart: string): boolean;
  /** Tạo phiên từ link trong URL; link sai/hết hạn → 'INVALID' */
  consumeLink(kind: LinkKind, urlPart: string): Promise<'OK' | 'INVALID'>;
  /** Đặt mật khẩu cho phiên hiện tại. Lỗi: PASSWORD_REJECTED / LINK_INVALID (không có phiên) / NETWORK */
  updatePassword(password: string): Promise<void>;
  hasSession(): Promise<boolean>;
  onAuthChange(listener: (event: AuthEvent) => void): () => void;
}

export function toAuthError(error: unknown): AuthError {
  if (error instanceof AuthError) return error;
  console.error('[m03/auth]', error);
  return new AuthError('UNKNOWN');
}
