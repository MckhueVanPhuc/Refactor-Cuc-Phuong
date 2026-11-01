import { Outlet } from 'react-router';
import { Banner } from '../../../shared/ui/Banner';
import { formatMessage } from '../messages/catalog';
import { useCurrentAdmin } from './CurrentAdminContext';

/**
 * Route chỉ Quản lý (`/admin/accounts`, `/admin/audit`): Nhân viên mở thẳng bằng URL thấy MSG-NO-PERMISSION
 * (BR-M03-A03). Đây chỉ là tiện ích; server vẫn từ chối.
 */
export function RequireReviewer() {
  const { state } = useCurrentAdmin();
  if (state.status !== 'signedIn' || state.admin.role !== 'REVIEWER') {
    return <Banner tone="error">{formatMessage('MSG-NO-PERMISSION')}</Banner>;
  }
  return <Outlet />;
}
