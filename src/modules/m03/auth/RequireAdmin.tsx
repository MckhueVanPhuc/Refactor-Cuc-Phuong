import { Navigate, Outlet, useLocation } from 'react-router';
import { ADMIN_PATHS } from '../paths';
import { useCurrentAdmin } from './CurrentAdminContext';

/** Mọi route đã đăng nhập: chưa có tài khoản active → về đăng nhập, nhớ đích ban đầu (SCR-M03-000). */
export function RequireAdmin() {
  const { state } = useCurrentAdmin();
  const location = useLocation();
  if (state.status === 'loading') return null;
  if (state.status === 'signedOut') {
    return <Navigate to={ADMIN_PATHS.login} replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}
