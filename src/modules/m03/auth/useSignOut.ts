import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { ADMIN_PATHS } from '../paths';

/** state của `/admin/login` khi được mở để đăng xuất hoặc vì phiên hết hạn */
export type LoginLocationState = { signOut?: boolean; expired?: boolean; from?: string };

/**
 * Đăng xuất (auth-account §2.6): điều hướng tới màn đăng nhập trước, để editor còn thay đổi chưa lưu hiện
 * MSG-UNSAVED-CHANGES (ở lại / rời đi). Chỉ khi rời đi, màn đăng nhập mới hủy request đang bay và
 * `signOut({ scope: 'local' })` — xem LoginPage.
 */
export function useSignOut(): () => void {
  const navigate = useNavigate();
  return useCallback(() => {
    const state: LoginLocationState = { signOut: true };
    void navigate(ADMIN_PATHS.login, { state });
  }, [navigate]);
}
