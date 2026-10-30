// AuthService trên Supabase Auth (auth-account-contract §2; research R-15).
// Link mời/khôi phục: supabase-js (`detectSessionInUrl`) tự tạo phiên từ URL lúc khởi tạo client;
// lỗi của link nằm trong tham số `error`/`error_code`. Chạy thật ở giai đoạn B trên stack local.
import type { SupabaseClient } from '@supabase/supabase-js';
import { ADMIN_PATHS } from '../paths';
import { AuthError, toAuthError, type AuthService } from './authService';

type ProviderError = { name?: string | undefined; status?: number | undefined; code?: string | undefined; message?: string };

function classify(error: ProviderError, fallback: AuthError['kind']): AuthError {
  if (error.name === 'AuthRetryableFetchError' || error.status === 0) return new AuthError('NETWORK');
  console.error('[m03/auth]', error);
  return new AuthError(fallback);
}

const LINK_MARKERS = /(access_token|token_hash|code|error_code|type=(invite|recovery))=?/;

export function createSupabaseAuthService(supabase: SupabaseClient<any, 'api'>): AuthService {
  return {
    async signInWithPassword(email, password) {
      try {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) {
          throw error.status === 400 || error.code === 'invalid_credentials'
            ? new AuthError('INVALID_CREDENTIALS')
            : classify(error, 'UNKNOWN');
        }
      } catch (error) {
        throw toAuthError(error);
      }
    },

    async signOut() {
      await supabase.auth.signOut({ scope: 'local' });
    },

    async requestPasswordRecovery(email) {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}${ADMIN_PATHS.recovery}`,
      });
      // Mọi lỗi khác bị nuốt để phản hồi luôn như nhau (BR-M03-K02); chỉ mất mạng mới báo
      if (error && classify(error, 'UNKNOWN').kind === 'NETWORK') throw new AuthError('NETWORK');
    },

    hasLinkInUrl: (urlPart) => LINK_MARKERS.test(urlPart),

    async consumeLink(_kind, urlPart) {
      if (/error(_code)?=/.test(urlPart)) return 'INVALID';
      const { data } = await supabase.auth.getSession();
      return data.session ? 'OK' : 'INVALID';
    },

    async updatePassword(password) {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new AuthError('LINK_INVALID');
      const { error } = await supabase.auth.updateUser({ password });
      if (!error) return;
      throw error.code === 'weak_password' || error.code === 'same_password' || error.status === 422
        ? new AuthError('PASSWORD_REJECTED')
        : classify(error, 'UNKNOWN');
    },

    async hasSession() {
      const { data } = await supabase.auth.getSession();
      return data.session !== null;
    },

    onAuthChange(listener) {
      const { data } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN') listener('SIGNED_IN');
        if (event === 'SIGNED_OUT') listener('SIGNED_OUT');
      });
      return () => data.subscription.unsubscribe();
    },
  };
}
