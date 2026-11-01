// SCR-M03-006 Tài khoản & Vai trò (auth-account §2.2, §2.5; screen-spec SCR-M03-006). Chỉ Quản lý.
// Khóa/mở khóa và đổi vai trò không có hộp xác nhận: BR-M03-L12 không cho phép hộp xác nhận cho các thao tác này.
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Banner } from '../../../shared/ui/Banner';
import { Button } from '../../../shared/ui/Button';
import { Select } from '../../../shared/ui/Select';
import { TextField } from '../../../shared/ui/TextField';
import { useAdminApi } from '../api/AdminApiProvider';
import { AdminApiError } from '../api/errors';
import { useSessionExpiry } from '../auth/useSessionExpiry';
import { EMAIL_MAX_CHARS } from '../config/limits';
import type { AccountRow, AdminRole } from '../contracts/adminDtos';
import type { CommandResult } from '../contracts/commandResult';
import { CommandOutcome } from '../editor/CommandOutcome';
import { formatMessage } from '../messages/catalog';
import { DISPLAY_NAMES } from '../messages/displayNames';
import { ADMIN_PATHS } from '../paths';
import { isValidEmail, normalizeEmail } from '../validation/email';
import styles from './AccountsPage.module.css';

const ROLE_OPTIONS = [
  { value: 'CONTENT_STAFF', label: DISPLAY_NAMES.role.CONTENT_STAFF },
  { value: 'REVIEWER', label: DISPLAY_NAMES.role.REVIEWER },
] as const;

const otherRole = (role: AdminRole): AdminRole => (role === 'REVIEWER' ? 'CONTENT_STAFF' : 'REVIEWER');

export function AccountsPage() {
  const api = useAdminApi();
  const navigate = useNavigate();
  const expire = useSessionExpiry();

  const [rows, setRows] = useState<AccountRow[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminRole>('CONTENT_STAFF');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<{ result: CommandResult<unknown>; email?: string } | null>(null);
  const [transportError, setTransportError] = useState<AdminApiError | null>(null);

  // Ô mời đang gõ dở, để cất lại khi phiên hết hạn mà không làm `load` đổi theo từng phím
  const inviteDraft = useRef({ email, role });
  inviteDraft.current = { email, role };

  const handleTransport = useCallback(
    (error: unknown) => {
      const apiError = AdminApiError.from(error);
      if (apiError.messageKey === 'MSG-SESSION-EXPIRED') expire({ key: 'accounts:invite', state: inviteDraft.current });
      else setTransportError(apiError);
    },
    [expire],
  );

  const load = useCallback(async () => {
    try {
      setRows(await api.listAccounts());
      setLoadFailed(false);
    } catch (error) {
      setLoadFailed(true);
      handleTransport(error);
    }
  }, [api, handleTransport]);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(action: () => Promise<CommandResult<unknown>>, options: { showSuccess: boolean; email?: string }) {
    setBusy(true);
    setOutcome(null);
    setTransportError(null);
    try {
      const result = await action();
      // Đổi vai trò/khóa thành công: bảng tự cho thấy kết quả, không có câu thông báo riêng
      if (!result.ok || options.showSuccess) setOutcome({ result, ...(options.email ? { email: options.email } : {}) });
      await load();
      return result;
    } catch (error) {
      handleTransport(error);
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function onInvite(event: FormEvent) {
    event.preventDefault();
    const normalized = normalizeEmail(email);
    const tooLong = normalized.length > EMAIL_MAX_CHARS;
    const error = tooLong
      ? formatMessage('MSG-LIMIT-TEXT', { 'Tên ô': 'Email', 'tối đa': EMAIL_MAX_CHARS, số: normalized.length })
      : isValidEmail(normalized)
        ? undefined
        : formatMessage('MSG-EMAIL-INVALID');
    setEmailError(error);
    if (error) return;
    const result = await run(() => api.inviteAccount({ email: normalized, role }), { showSuccess: true, email: normalized });
    if (result?.ok) setEmail('');
  }

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <h1 className={styles.title}>Tài khoản & Vai trò</h1>
        <Button onClick={() => void navigate(ADMIN_PATHS.routes)}>Quay lại</Button>
      </div>

      <CommandOutcome
        result={outcome?.result ?? null}
        transportError={transportError}
        {...(outcome?.email ? { successValues: { email: outcome.email } } : {})}
        onReload={() => void load()}
      />

      <form className={styles.invite} onSubmit={onInvite} noValidate aria-label="Mời tài khoản">
        <div className={styles.inviteEmail}>
          <TextField
            label="Email người được mời"
            type="email"
            value={email}
            onChange={setEmail}
            error={emailError}
            fieldKey="email"
          />
        </div>
        <Select label="Vai trò" value={role} options={ROLE_OPTIONS} onChange={setRole} />
        <Button type="submit" variant="primary" disabled={busy}>
          Gửi lời mời
        </Button>
      </form>

      {loadFailed && !rows ? <Banner tone="error">{formatMessage('MSG-GENERIC')}</Banner> : null}
      {rows ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Email</th>
                <th scope="col">Vai trò</th>
                <th scope="col">Trạng thái</th>
                <th scope="col">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const expected = { entity: row.concurrencyRevision };
                return (
                  <tr key={row.email}>
                    <td className={styles.email}>{row.email}</td>
                    <td>{DISPLAY_NAMES.role[row.role]}</td>
                    <td>
                      <span className={`${styles.status} ${styles[row.status]}`}>
                        {DISPLAY_NAMES.accountStatus[row.status]}
                      </span>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        {row.status === 'INVITATION_PENDING' ? (
                          <Button
                            disabled={busy}
                            onClick={() =>
                              void run(() => api.resendInvitation({ email: row.email }), { showSuccess: true, email: row.email })
                            }
                          >
                            Gửi lại lời mời
                          </Button>
                        ) : (
                          <>
                            <Button
                              disabled={busy}
                              onClick={() =>
                                void run(
                                  () => api.changeAccountRole({ email: row.email, role: otherRole(row.role), expected }),
                                  { showSuccess: false },
                                )
                              }
                            >
                              Đổi thành {DISPLAY_NAMES.role[otherRole(row.role)]}
                            </Button>
                            <Button
                              disabled={busy}
                              onClick={() =>
                                void run(
                                  () =>
                                    api.setAccountStatus({
                                      email: row.email,
                                      status: row.status === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE',
                                      expected,
                                    }),
                                  { showSuccess: false },
                                )
                              }
                            >
                              {row.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

export default AccountsPage;
