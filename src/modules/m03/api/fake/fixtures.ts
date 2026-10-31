// Dữ liệu synthetic cho adapter giả — chỉ domain `example.test`, không bao giờ là dữ liệu thật (§1.3 runbook).
import type { FakeAccount, FakeProviderUser, FakeState } from './store';

/** Mật khẩu synthetic của mọi người dùng fixture (chỉ dùng ở adapter giả) */
export const FIXTURE_PASSWORD = 'Matkhau-thu-123';

export const FIXTURE_ACCOUNTS = {
  REVIEWER: { userId: 'u-reviewer', email: 'reviewer@example.test', role: 'REVIEWER' },
  CONTENT_STAFF: { userId: 'u-staff', email: 'staff@example.test', role: 'CONTENT_STAFF' },
} as const satisfies Record<string, Pick<FakeAccount, 'email' | 'role'> & { userId: string }>;

/** Tài khoản đã khóa (quickstart Q1) */
export const FIXTURE_LOCKED = { userId: 'u-locked', email: 'locked@example.test', role: 'CONTENT_STAFF' } as const;

/** Danh tính đã xác thực ở provider nhưng không có AdminAccount (SC-M03-009; quickstart Q1) */
export const USER_WITHOUT_ACCOUNT = 'u-no-account';
export const EMAIL_WITHOUT_ACCOUNT = 'noaccount@example.test';

const FIXTURE_TIME = '2026-10-30T00:00:00.000Z';

export function createFixtureState(): FakeState {
  const accounts = new Map<string, FakeAccount>();
  const base = { concurrencyRevision: 1, lastChangedByEmail: FIXTURE_ACCOUNTS.REVIEWER.email, lastChangedAt: FIXTURE_TIME };
  for (const account of Object.values(FIXTURE_ACCOUNTS)) {
    accounts.set(account.email, { ...account, ...base, status: 'ACTIVE' });
  }
  accounts.set(FIXTURE_LOCKED.email, { ...FIXTURE_LOCKED, ...base, status: 'DEACTIVATED' });
  return {
    accounts,
    routes: new Map(),
    checkpoints: new Map(),
    qrCodes: new Map(),
    revisions: new Map(),
    snapshots: new Map(),
    media: new Map(),
  };
}

export function createFixtureProviderUsers(): FakeProviderUser[] {
  return [
    ...Object.values(FIXTURE_ACCOUNTS).map(({ userId, email }) => ({ userId, email, password: FIXTURE_PASSWORD })),
    { userId: FIXTURE_LOCKED.userId, email: FIXTURE_LOCKED.email, password: FIXTURE_PASSWORD },
    { userId: USER_WITHOUT_ACCOUNT, email: EMAIL_WITHOUT_ACCOUNT, password: FIXTURE_PASSWORD },
  ];
}
