// Tài khoản quản trị: Q-01, Q-14, C-18, C-19 và Edge `admin-accounts` invite/resend
// (auth-account-contract §2.2, §2.5; admin-command §7; BR-M03-A03, K01, K03).
import { expect, it } from 'vitest';
import { AdminApiError } from '../errors';
import type { ContractSuite } from './harness';

export const accountsContract: ContractSuite = ({ subject }) => {
  const api = () => subject().api;
  const controls = () => subject().controls;

  async function account(email: string) {
    const rows = await api().listAccounts();
    return rows.find((row) => row.email === email);
  }

  it('Q-01: tài khoản active trả email/role/status; danh tính không có tài khoản trả null', async () => {
    await controls().signInAs('REVIEWER');
    expect(await api().getCurrentAdmin()).toMatchObject({ role: 'REVIEWER', status: 'ACTIVE' });
    await controls().signInWithoutAccount();
    expect(await api().getCurrentAdmin()).toBeNull();
  });

  it('Nhân viên gọi Q-14, C-18, C-19, mời → bị từ chối (BR-M03-A03)', async () => {
    await controls().signInAs('CONTENT_STAFF');
    await expect(api().listAccounts()).rejects.toMatchObject({ messageKey: 'MSG-NO-PERMISSION' });
    await expect(api().listAccounts()).rejects.toBeInstanceOf(AdminApiError);
    const expected = { entity: 1 };
    expect(await api().changeAccountRole({ email: 'x@example.test', role: 'REVIEWER', expected })).toMatchObject({
      reason: 'FORBIDDEN',
    });
    expect(await api().setAccountStatus({ email: 'x@example.test', status: 'DEACTIVATED', expected })).toMatchObject({
      reason: 'FORBIDDEN',
    });
    expect(await api().inviteAccount({ email: 'new@example.test', role: 'CONTENT_STAFF' })).toMatchObject({
      reason: 'FORBIDDEN',
    });
  });

  it('Reviewer cuối: hạ role và khóa cùng lúc → cả hai BLOCKED MSG-LAST-REVIEWER, vẫn còn một Quản lý', async () => {
    await controls().signInAs('REVIEWER');
    const me = (await api().getCurrentAdmin())!;
    const row = (await account(me.email))!;
    const expected = { entity: row.concurrencyRevision };
    const [demote, lock] = await Promise.all([
      api().changeAccountRole({ email: me.email, role: 'CONTENT_STAFF', expected }),
      api().setAccountStatus({ email: me.email, status: 'DEACTIVATED', expected }),
    ]);
    expect(demote).toMatchObject({ ok: false, reason: 'BLOCKED', messageKey: 'MSG-LAST-REVIEWER' });
    expect(lock).toMatchObject({ ok: false, reason: 'BLOCKED', messageKey: 'MSG-LAST-REVIEWER' });
    const reviewers = (await api().listAccounts()).filter((a) => a.role === 'REVIEWER' && a.status === 'ACTIVE');
    expect(reviewers).toHaveLength(1);
  });

  it('còn Quản lý khác: đổi role và khóa được; mỗi thay đổi đúng một dòng audit', async () => {
    await controls().signInAs('REVIEWER');
    await controls().seedAccount({ email: 'reviewer2@example.test', role: 'REVIEWER', status: 'ACTIVE' });
    const before = (await controls().auditRows()).length;
    const row = (await account('reviewer2@example.test'))!;
    const demote = await api().changeAccountRole({
      email: row.email,
      role: 'CONTENT_STAFF',
      expected: { entity: row.concurrencyRevision },
    });
    expect(demote.ok).toBe(true);
    const demoted = (await account(row.email))!;
    const lock = await api().setAccountStatus({
      email: row.email,
      status: 'DEACTIVATED',
      expected: { entity: demoted.concurrencyRevision },
    });
    expect(lock.ok).toBe(true);
    expect(await account(row.email)).toMatchObject({ role: 'CONTENT_STAFF', status: 'DEACTIVATED' });
    const rows = (await controls().auditRows()).slice(before);
    expect(rows.map((r) => [r.action, r.result])).toEqual([
      ['ACCOUNT_ROLE_CHANGED', 'SUCCESS'],
      ['ACCOUNT_STATUS_CHANGED', 'SUCCESS'],
    ]);
  });

  it('expectedConcurrencyRevision lệch → STALE kèm email người đổi gần nhất (BR-M03-F06)', async () => {
    await controls().signInAs('REVIEWER');
    await controls().seedAccount({ email: 'staff9@example.test', role: 'CONTENT_STAFF', status: 'ACTIVE' });
    const row = (await account('staff9@example.test'))!;
    const result = await api().setAccountStatus({
      email: row.email,
      status: 'DEACTIVATED',
      expected: { entity: row.concurrencyRevision - 1 },
    });
    expect(result).toMatchObject({ ok: false, reason: 'STALE', messageKey: 'MSG-STALE' });
    if (result.ok || result.reason !== 'STALE') return;
    expect(result.stale.editorEmail).toMatch(/@example\.test$/);
  });

  it('mời: tạo đúng một tài khoản Chờ nhận lời mời; gửi lại không tạo bản sao (BR-M03-K01)', async () => {
    await controls().signInAs('REVIEWER');
    const before = (await controls().auditRows()).length;
    expect(await api().inviteAccount({ email: '  Staff1@Example.TEST ', role: 'CONTENT_STAFF' })).toMatchObject({
      ok: true,
      messageKey: 'MSG-INVITE-SENT',
    });
    expect(await account('staff1@example.test')).toMatchObject({ role: 'CONTENT_STAFF', status: 'INVITATION_PENDING' });
    expect(await api().resendInvitation({ email: 'staff1@example.test' })).toMatchObject({
      ok: true,
      messageKey: 'MSG-INVITE-RESENT',
    });
    // Mời lại một tài khoản đang chờ = gửi lại (auth-account §2.2 bước 3)
    expect(await api().inviteAccount({ email: 'staff1@example.test', role: 'CONTENT_STAFF' })).toMatchObject({
      ok: true,
      messageKey: 'MSG-INVITE-RESENT',
    });
    expect((await api().listAccounts()).filter((a) => a.email === 'staff1@example.test')).toHaveLength(1);
    const rows = (await controls().auditRows()).slice(before);
    expect(rows.map((r) => r.action)).toEqual(['ACCOUNT_INVITED', 'ACCOUNT_INVITE_RESENT', 'ACCOUNT_INVITE_RESENT']);
  });

  it('mời email đã có tài khoản → MSG-EMAIL-TAKEN; email sai → MSG-EMAIL-INVALID', async () => {
    await controls().signInAs('REVIEWER');
    const me = (await api().getCurrentAdmin())!;
    expect(await api().inviteAccount({ email: me.email, role: 'CONTENT_STAFF' })).toMatchObject({
      ok: false,
      messageKey: 'MSG-EMAIL-TAKEN',
    });
    expect(await api().inviteAccount({ email: 'khong-phai-email', role: 'CONTENT_STAFF' })).toMatchObject({
      ok: false,
      messageKey: 'MSG-EMAIL-INVALID',
    });
    expect(await api().inviteAccount({ email: `${'a'.repeat(250)}@example.test`, role: 'CONTENT_STAFF' })).toMatchObject({
      ok: false,
      messageKey: 'MSG-EMAIL-INVALID',
    });
  });

  it('gửi lại chỉ cho tài khoản đang chờ', async () => {
    await controls().signInAs('REVIEWER');
    const me = (await api().getCurrentAdmin())!;
    expect(await api().resendInvitation({ email: me.email })).toMatchObject({ ok: false });
  });
};
