// Người đăng nhập hiện tại của M03 (auth-account §2.1, §2.6; research R-15). Quyền lấy từ Q-01 sau đăng nhập,
// không đọc role/status từ token (BR-M03-K05). Phần UI theo role chỉ là tiện ích; server vẫn kiểm.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CurrentAdmin } from '../contracts/adminDtos';
import { useAdminApi, useAuthService } from '../api/AdminApiProvider';
import { AdminApiError } from '../api/errors';
import { abortAll } from '../api/inflight';
import { toAuthError } from './authService';

export type CurrentAdminState = { status: 'loading' } | { status: 'signedOut' } | { status: 'signedIn'; admin: CurrentAdmin };

export type SignInResult =
  | { ok: true }
  | { ok: false; messageKey: 'MSG-LOGIN-FAILED' | 'MSG-LOGIN-DENIED' | 'MSG-NETWORK-FAILED' | 'MSG-GENERIC' };

type CurrentAdminValue = {
  state: CurrentAdminState;
  signIn(email: string, password: string): Promise<SignInResult>;
  /** Nạp lại Q-01 theo phiên hiện tại (sau khi nhận lời mời) */
  refresh(): Promise<CurrentAdmin | null>;
  /** Hủy request đang bay rồi `signOut({ scope: 'local' })`; không ghi audit (BR-M03-K06) */
  completeSignOut(): Promise<void>;
};

const CurrentAdminContext = createContext<CurrentAdminValue | null>(null);

export function CurrentAdminProvider({ children }: { children: ReactNode }) {
  const api = useAdminApi();
  const auth = useAuthService();
  const [state, setState] = useState<CurrentAdminState>({ status: 'loading' });

  const refresh = useCallback(async (): Promise<CurrentAdmin | null> => {
    let admin: CurrentAdmin | null = null;
    try {
      if (await auth.hasSession()) admin = await api.getCurrentAdmin();
    } catch (error) {
      AdminApiError.from(error);
    }
    const active = admin?.status === 'ACTIVE' ? admin : null;
    setState(active ? { status: 'signedIn', admin: active } : { status: 'signedOut' });
    return active;
  }, [api, auth]);

  useEffect(() => {
    void refresh();
    return auth.onAuthChange((event) => {
      if (event === 'SIGNED_OUT') setState({ status: 'signedOut' });
      else void refresh();
    });
  }, [auth, refresh]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<SignInResult> => {
      try {
        await auth.signInWithPassword(email, password);
      } catch (error) {
        const { kind } = toAuthError(error);
        if (kind === 'INVALID_CREDENTIALS') return { ok: false, messageKey: 'MSG-LOGIN-FAILED' };
        return { ok: false, messageKey: kind === 'NETWORK' ? 'MSG-NETWORK-FAILED' : 'MSG-GENERIC' };
      }
      let admin: CurrentAdmin | null;
      try {
        admin = await api.getCurrentAdmin();
      } catch (error) {
        await auth.signOut();
        const key = AdminApiError.from(error).messageKey;
        return { ok: false, messageKey: key === 'MSG-NETWORK-FAILED' ? key : 'MSG-GENERIC' };
      }
      // Không có tài khoản, đang chờ nhận lời mời hoặc đã khóa → thoát phiên provider (BR-M03-A04)
      if (admin?.status !== 'ACTIVE') {
        await auth.signOut();
        setState({ status: 'signedOut' });
        return { ok: false, messageKey: 'MSG-LOGIN-DENIED' };
      }
      setState({ status: 'signedIn', admin });
      return { ok: true };
    },
    [api, auth],
  );

  const completeSignOut = useCallback(async () => {
    abortAll();
    await auth.signOut();
    setState({ status: 'signedOut' });
  }, [auth]);

  const value = useMemo(() => ({ state, signIn, refresh, completeSignOut }), [state, signIn, refresh, completeSignOut]);
  return <CurrentAdminContext.Provider value={value}>{children}</CurrentAdminContext.Provider>;
}

export function useCurrentAdmin(): CurrentAdminValue {
  const value = useContext(CurrentAdminContext);
  if (!value) throw new Error('Cần đặt trong CurrentAdminProvider');
  return value;
}
