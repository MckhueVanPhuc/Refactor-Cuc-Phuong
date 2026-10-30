// Tài khoản trên adapter giả (tasks T063): Q-01, Q-14, C-18, C-19 và mô phỏng Edge `admin-accounts`
// (`invite` / `resend` / `link`) theo auth-account-contract §2.2–2.5; guard Quản lý cuối (BR-M03-K03).
import type { AccountStatus, AdminRole } from '../../contracts/adminDtos';
import type { CommandResult } from '../../contracts/commandResult';
import { DISPLAY_NAMES } from '../../messages/displayNames';
import type { AdminApi } from '../AdminApi';
import { AdminApiError } from '../errors';
import { sendFakeMail } from '../../auth/fakeAuthService';
import { isValidEmail, normalizeEmail } from '../../validation/email';
import type { FakeAccount, FakeStore } from './store';

const failed: CommandResult<never> = { ok: false, reason: 'FAILED', messageKey: 'MSG-GENERIC' };
const lastReviewer: CommandResult<never> = { ok: false, reason: 'BLOCKED', messageKey: 'MSG-LAST-REVIEWER', values: {} };

type AccountsArea = Pick<
  AdminApi,
  | 'getCurrentAdmin'
  | 'listAccounts'
  | 'changeAccountRole'
  | 'setAccountStatus'
  | 'inviteAccount'
  | 'resendInvitation'
  | 'linkInvitation'
>;

export function createFakeAccountsArea(store: FakeStore): AccountsArea {
  const accounts = () => store.state.accounts;

  function activeReviewers(): number {
    return [...accounts().values()].filter((a) => a.role === 'REVIEWER' && a.status === 'ACTIVE').length;
  }

  /** Kiểm tra trong "transaction": thay đổi có để lại 0 Quản lý đang hoạt động không */
  function removesLastReviewer(account: FakeAccount, next: { role: AdminRole; status: AccountStatus }): boolean {
    const wasActiveReviewer = account.role === 'REVIEWER' && account.status === 'ACTIVE';
    const staysActiveReviewer = next.role === 'REVIEWER' && next.status === 'ACTIVE';
    return wasActiveReviewer && !staysActiveReviewer && activeReviewers() <= 1;
  }

  function expectedFor(email: string, submitted: number | undefined) {
    const account = accounts().get(email);
    return account
      ? [{ submitted, current: account.concurrencyRevision, editorEmail: account.lastChangedByEmail, editedAt: account.lastChangedAt }]
      : [];
  }

  function touch(account: FakeAccount, actorEmail: string): void {
    account.concurrencyRevision += 1;
    account.lastChangedByEmail = actorEmail;
    account.lastChangedAt = store.now();
  }

  function invite(email: string, role: AdminRole, action: 'ACCOUNT_INVITED' | 'ACCOUNT_INVITE_RESENT') {
    return store.run({ action, roles: 'R', subject: { type: 'ACCOUNT', name: email } }, (context): CommandResult<null> => {
      if (!isValidEmail(email)) return { ok: false, reason: 'BLOCKED', messageKey: 'MSG-EMAIL-INVALID', values: {} };
      const existing = accounts().get(email);
      if (existing && existing.status !== 'INVITATION_PENDING') {
        return { ok: false, reason: 'BLOCKED', messageKey: 'MSG-EMAIL-TAKEN', values: { email } };
      }
      if (!existing) {
        accounts().set(email, {
          userId: null,
          email,
          role,
          status: 'INVITATION_PENDING',
          concurrencyRevision: 1,
          lastChangedByEmail: context.actor.email,
          lastChangedAt: store.now(),
        });
      }
      // inviteUserByEmail của provider tạo người dùng (chưa có mật khẩu dùng được) nếu chưa có
      if (!store.auth.users.has(email)) {
        store.auth.users.set(email, { userId: `u-${store.newId(12)}`, email, password: store.newId(32) });
      }
      sendFakeMail(store, email, 'invite');
      return { ok: true, messageKey: existing ? 'MSG-INVITE-RESENT' : 'MSG-INVITE-SENT', data: null };
    });
  }

  return {
    async getCurrentAdmin() {
      const admin = store.currentAdmin();
      return admin ? { email: admin.email, role: admin.role, status: admin.status } : null;
    },

    async listAccounts() {
      if (store.currentAdmin()?.role !== 'REVIEWER') throw new AdminApiError('MSG-NO-PERMISSION');
      return [...accounts().values()]
        .sort((a, b) => a.email.localeCompare(b.email))
        .map(({ email, role, status, concurrencyRevision }) => ({ email, role, status, concurrencyRevision }));
    },

    async changeAccountRole({ email, role, expected }) {
      const key = normalizeEmail(email);
      return store.run(
        {
          action: 'ACCOUNT_ROLE_CHANGED',
          roles: 'R',
          subject: { type: 'ACCOUNT', name: key },
          expected: expectedFor(key, expected.entity),
        },
        (context): CommandResult<{ status: string; concurrencyRevision: number }> => {
          const account = accounts().get(key);
          if (!account) return failed;
          if (removesLastReviewer(account, { role, status: account.status })) return lastReviewer;
          context.changeLines.push(`Vai trò: ${DISPLAY_NAMES.role[account.role]} → ${DISPLAY_NAMES.role[role]}`);
          account.role = role;
          touch(account, context.actor.email);
          return { ok: true, messageKey: 'MSG-SAVED', data: { status: account.status, concurrencyRevision: account.concurrencyRevision } };
        },
      );
    },

    async setAccountStatus({ email, status, expected }) {
      const key = normalizeEmail(email);
      return store.run(
        {
          action: 'ACCOUNT_STATUS_CHANGED',
          roles: 'R',
          subject: { type: 'ACCOUNT', name: key },
          expected: expectedFor(key, expected.entity),
        },
        (context): CommandResult<{ status: string; concurrencyRevision: number }> => {
          const account = accounts().get(key);
          // Chỉ đổi giữa Đang hoạt động và Đã khóa; tài khoản chờ nhận lời mời không khóa/mở được ở đây
          if (!account || account.status === 'INVITATION_PENDING') return failed;
          if (removesLastReviewer(account, { role: account.role, status })) return lastReviewer;
          context.changeLines.push(
            `Trạng thái: ${DISPLAY_NAMES.accountStatus[account.status]} → ${DISPLAY_NAMES.accountStatus[status]}`,
          );
          account.status = status;
          touch(account, context.actor.email);
          return { ok: true, messageKey: 'MSG-SAVED', data: { status, concurrencyRevision: account.concurrencyRevision } };
        },
      );
    },

    async inviteAccount({ email, role }) {
      const key = normalizeEmail(email);
      // Mời một tài khoản đang chờ = gửi lại (auth-account §2.2 bước 3)
      const pending = accounts().get(key)?.status === 'INVITATION_PENDING';
      return invite(key, role, pending ? 'ACCOUNT_INVITE_RESENT' : 'ACCOUNT_INVITED');
    },

    async resendInvitation({ email }) {
      const key = normalizeEmail(email);
      const account = accounts().get(key);
      if (account?.status !== 'INVITATION_PENDING') {
        return store.run({ action: 'ACCOUNT_INVITE_RESENT', roles: 'R', subject: { type: 'ACCOUNT', name: key } }, () => failed);
      }
      return invite(key, account.role, 'ACCOUNT_INVITE_RESENT');
    },

    async linkInvitation() {
      return store.run({ action: 'ACCOUNT_LINKED', roles: 'AUTH', subject: { type: 'ACCOUNT' } }, (context): CommandResult<null> => {
        const account = accounts().get(normalizeEmail(context.actor.email));
        context.subjectName = context.actor.email;
        // Chỉ khớp một tài khoản đang chờ; người nhận không chọn hay đổi được role
        if (account?.status !== 'INVITATION_PENDING') {
          return { ok: false, reason: 'BLOCKED', messageKey: 'MSG-LINK-INVALID', values: {} };
        }
        account.userId = context.actor.userId;
        account.status = 'ACTIVE';
        touch(account, context.actor.email);
        return { ok: true, messageKey: 'MSG-SAVED', data: null };
      });
    },
  };
}
