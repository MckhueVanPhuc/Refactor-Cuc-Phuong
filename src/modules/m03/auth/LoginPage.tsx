// SCR-M03-000 Đăng nhập quản trị (auth-account §2.1; screen-spec SCR-M03-000).
// Cũng là nơi hoàn tất đăng xuất và phiên hết hạn: tới đây với state `signOut`/`expired` thì thoát phiên trước.
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { Banner } from '../../../shared/ui/Banner';
import { Button } from '../../../shared/ui/Button';
import { TextField } from '../../../shared/ui/TextField';
import { formatMessage, formatMessageFromServer, type MessageKey } from '../messages/catalog';
import { ADMIN_PATHS } from '../paths';
import { AuthLayout } from './AuthLayout';
import { useCurrentAdmin } from './CurrentAdminContext';
import type { LoginLocationState } from './useSignOut';
import styles from './AuthLayout.module.css';

const missing = (field: string) => formatMessage('MSG-MISSING-FIELD', { 'tên ô': field });

export function LoginPage() {
  const { state, signIn, completeSignOut } = useCurrentAdmin();
  const location = useLocation();
  const navigate = useNavigate();
  const arrival = (location.state ?? {}) as LoginLocationState;
  const [signingOut, setSigningOut] = useState(Boolean(arrival.signOut || arrival.expired));
  const startedSignOut = useRef(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<MessageKey | null>(null);

  useEffect(() => {
    if (!signingOut || startedSignOut.current) return;
    startedSignOut.current = true;
    void completeSignOut().then(() => setSigningOut(false));
  }, [signingOut, completeSignOut]);

  const destination = arrival.from ?? ADMIN_PATHS.routes;
  if (!signingOut && !submitting && state.status === 'signedIn') return <Navigate to={destination} replace />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    // M03 chỉ kiểm hai ô không rỗng; định dạng do provider kiểm (OQ-SCR-M03-000-002)
    const errors = {
      ...(email.trim() === '' ? { email: missing('Email') } : {}),
      ...(password === '' ? { password: missing('Mật khẩu') } : {}),
    };
    setFieldErrors(errors);
    if (errors.email || errors.password) return;
    setSubmitting(true);
    setFailure(null);
    const result = await signIn(email, password);
    setSubmitting(false);
    if (result.ok) void navigate(destination, { replace: true });
    else setFailure(result.messageKey);
  }

  const notice = failure ? (
    <Banner tone="error">{formatMessageFromServer(failure)}</Banner>
  ) : arrival.expired ? (
    <Banner tone="warning">{formatMessage('MSG-SESSION-EXPIRED')}</Banner>
  ) : undefined;

  return (
    <AuthLayout title="Đăng nhập" notice={notice}>
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <TextField
          label="Email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={setEmail}
          error={fieldErrors.email}
        />
        <TextField
          label="Mật khẩu"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          error={fieldErrors.password}
        />
        <div className={styles.actions}>
          <Button type="submit" variant="primary" disabled={submitting || signingOut} aria-busy={submitting}>
            {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </Button>
        </div>
      </form>
      <Link className={styles.link} to={ADMIN_PATHS.recovery}>
        Quên mật khẩu
      </Link>
    </AuthLayout>
  );
}
