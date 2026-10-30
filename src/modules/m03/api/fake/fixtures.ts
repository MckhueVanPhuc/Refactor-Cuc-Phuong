// Dữ liệu synthetic cho adapter giả — chỉ domain `example.test`, không bao giờ là dữ liệu thật (§1.3 runbook).
import type { FakeAccount, FakeState } from './store';

export const FIXTURE_ACCOUNTS = {
  REVIEWER: { userId: 'u-reviewer', email: 'reviewer@example.test', role: 'REVIEWER' },
  CONTENT_STAFF: { userId: 'u-staff', email: 'staff@example.test', role: 'CONTENT_STAFF' },
} as const satisfies Record<string, Pick<FakeAccount, 'userId' | 'email' | 'role'>>;

/** Danh tính đã xác thực ở provider nhưng không có AdminAccount (SC-M03-009) */
export const USER_WITHOUT_ACCOUNT = 'u-no-account';

export function createFixtureState(): FakeState {
  const accounts = new Map<string, FakeAccount>();
  for (const account of Object.values(FIXTURE_ACCOUNTS)) {
    accounts.set(account.userId, { ...account, status: 'ACTIVE', concurrencyRevision: 1 });
  }
  return {
    accounts,
    routes: new Map(),
    checkpoints: new Map(),
    media: new Map(),
  };
}
