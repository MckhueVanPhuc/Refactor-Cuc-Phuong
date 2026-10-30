// SCR-M03-007 chế độ nhận lời mời (auth-account §2.3): đặt mật khẩu, rồi Edge `link` nối danh tính với tài khoản
// Chờ nhận lời mời. Người nhận không chọn hay đổi được role (BR-M03-K01, K02).
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Banner } from '../../../shared/ui/Banner';
import { Button } from '../../../shared/ui/Button';
import { TextField } from '../../../shared/ui/TextField';
import { useAdminApi, useAuthService } from '../api/AdminApiProvider';
import { AdminApiError } from '../api/errors';
import { formatMessage, formatMessageFromServer, type MessageKey } from '../messages/catalog';
import { ADMIN_PATHS } from '../paths';
import { AuthLayout } from './AuthLayout';
import { useCurrentAdmin } from './CurrentAdminContext';
import { passwordFailureKey, useLinkSession } from './usePasswordForm';
import styles from './AuthLayout.module.css';

export function InvitationPage() {
  const api = useAdminApi();
  const auth = useAuthService();
  const { refresh } = useCurrentAdmin();
  const navigate = useNavigate();
  const link = useLinkSession('invite');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [mismatch, setMismatch] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<MessageKey | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMismatch(password !== confirm);
    if (password !== confirm) return;
    setSubmitting(true);
    setFailure(null);
    try {
      await auth.updatePassword(password);
    } catch (error) {
      setFailure(passwordFailureKey(error));
      setSubmitting(false);
      return;
    }
    try {
      const result = await api.linkInvitation();
      if (!result.ok) {
        setFailure(result.messageKey);
        setSubmitting(false);
        return;
      }
    } catch (error) {
      setFailure(AdminApiError.from(error).messageKey);
      setSubmitting(false);
      return;
    }
    // Tài khoản đã hoạt động: vào thẳng; nếu chưa thì về đăng nhập (auth-account §2.3 bước 4)
    const admin = await refresh();
    void navigate(admin ? ADMIN_PATHS.routes : ADMIN_PATHS.login, { replace: true });
  }

  const linkInvalid = link === 'invalid' || failure === 'MSG-LINK-INVALID';
  const notice = linkInvalid ? (
    <Banner tone="error">{formatMessage('MSG-LINK-INVALID')}</Banner>
  ) : failure ? (
    <Banner tone="error">{formatMessageFromServer(failure)}</Banner>
  ) : undefined;

  return (
    <AuthLayout title="Nhận lời mời" notice={notice}>
      {link === 'valid' && !linkInvalid ? (
        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <TextField label="Mật khẩu" type="password" autoComplete="new-password" value={password} onChange={setPassword} />
          <TextField
            label="Nhập lại mật khẩu"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={setConfirm}
            error={mismatch ? formatMessage('MSG-PASSWORD-MISMATCH') : undefined}
          />
          <div className={styles.actions}>
            <Button type="submit" variant="primary" disabled={submitting} aria-busy={submitting}>
              {submitting ? 'Đang xử lý…' : 'Hoàn tất lời mời'}
            </Button>
          </div>
        </form>
      ) : null}
      <Link className={styles.link} to={ADMIN_PATHS.login}>
        Về đăng nhập
      </Link>
    </AuthLayout>
  );
}
