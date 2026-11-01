// SCR-M03-007 chế độ khôi phục (auth-account §2.4): không có link → form yêu cầu; có link của provider →
// đặt mật khẩu mới. Không lệnh gọi nào tạo hay đổi AdminAccount (BR-M03-K02; SC-M03-011).
import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Banner } from '../../../shared/ui/Banner';
import { Button } from '../../../shared/ui/Button';
import { TextField } from '../../../shared/ui/TextField';
import { useAuthService } from '../api/AdminApiProvider';
import { formatMessage, formatMessageFromServer, type MessageKey } from '../messages/catalog';
import { ADMIN_PATHS } from '../paths';
import { toAuthError } from './authService';
import { AuthLayout } from './AuthLayout';
import { passwordFailureKey, useLinkSession } from './usePasswordForm';
import styles from './AuthLayout.module.css';

const BACK_TO_LOGIN = (
  <Link className={styles.link} to={ADMIN_PATHS.login}>
    Về đăng nhập
  </Link>
);

function RequestRecovery() {
  const auth = useAuthService();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<MessageKey | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const empty = email.trim() === '';
    setEmailError(empty ? formatMessage('MSG-MISSING-FIELD', { 'tên ô': 'Email' }) : undefined);
    if (empty) return;
    setSubmitting(true);
    try {
      await auth.requestPasswordRecovery(email);
      // Cùng một câu cho email có và không có (BR-M03-K02)
      setOutcome('MSG-RECOVERY-SENT');
    } catch (error) {
      setOutcome(toAuthError(error).kind === 'NETWORK' ? 'MSG-NETWORK-FAILED' : 'MSG-GENERIC');
    } finally {
      setSubmitting(false);
    }
  }

  const notice = outcome ? (
    <Banner tone={outcome === 'MSG-RECOVERY-SENT' ? 'info' : 'error'}>{formatMessageFromServer(outcome)}</Banner>
  ) : undefined;

  return (
    <AuthLayout title="Khôi phục mật khẩu" notice={notice}>
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <TextField label="Email" type="email" autoComplete="username" value={email} onChange={setEmail} error={emailError} />
        <div className={styles.actions}>
          <Button type="submit" variant="primary" disabled={submitting} aria-busy={submitting}>
            {submitting ? 'Đang xử lý…' : 'Gửi yêu cầu khôi phục'}
          </Button>
        </div>
      </form>
      {BACK_TO_LOGIN}
    </AuthLayout>
  );
}

function CompleteRecovery() {
  const auth = useAuthService();
  const navigate = useNavigate();
  const link = useLinkSession('recovery');
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
    // Phiên từ link khôi phục chỉ để đổi mật khẩu; đăng nhập lại như bình thường (tài khoản đã khóa vẫn bị từ chối)
    await auth.signOut();
    void navigate(ADMIN_PATHS.login, { replace: true });
  }

  const linkInvalid = link === 'invalid' || failure === 'MSG-LINK-INVALID';
  const notice = linkInvalid ? (
    <Banner tone="error">{formatMessage('MSG-LINK-INVALID')}</Banner>
  ) : failure ? (
    <Banner tone="error">{formatMessageFromServer(failure)}</Banner>
  ) : undefined;

  return (
    <AuthLayout title="Khôi phục mật khẩu" notice={notice}>
      {link === 'valid' && !linkInvalid ? (
        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <TextField label="Mật khẩu mới" type="password" autoComplete="new-password" value={password} onChange={setPassword} />
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
              {submitting ? 'Đang xử lý…' : 'Đặt mật khẩu mới'}
            </Button>
          </div>
        </form>
      ) : null}
      {BACK_TO_LOGIN}
    </AuthLayout>
  );
}

export function RecoveryPage() {
  const auth = useAuthService();
  const location = useLocation();
  // Quyết định chế độ một lần theo URL lúc mở trang (provider có thể xóa tham số sau khi đọc)
  const [mode] = useState(() => (auth.hasLinkInUrl(location.search + location.hash) ? 'complete' : 'request'));
  return mode === 'complete' ? <CompleteRecovery /> : <RequestRecovery />;
}
