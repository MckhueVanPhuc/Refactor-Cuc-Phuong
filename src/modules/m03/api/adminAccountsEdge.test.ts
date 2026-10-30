import { describe, expect, it } from 'vitest';
import { mapEdgeResult } from './adminAccountsEdge';

// Bảng auth-account-contract §3
describe('Edge admin-accounts → messageKey (T064)', () => {
  it.each([
    ['SENT', { ok: true, messageKey: 'MSG-INVITE-SENT' }],
    ['RESENT', { ok: true, messageKey: 'MSG-INVITE-RESENT' }],
    ['LINKED', { ok: true }],
    ['INVALID_EMAIL', { ok: false, reason: 'BLOCKED', messageKey: 'MSG-EMAIL-INVALID' }],
    ['EMAIL_TAKEN', { ok: false, reason: 'BLOCKED', messageKey: 'MSG-EMAIL-TAKEN', values: { email: 'a@example.test' } }],
    ['FORBIDDEN', { ok: false, reason: 'FORBIDDEN', messageKey: 'MSG-NO-PERMISSION' }],
    ['LINK_REJECTED', { ok: false, reason: 'BLOCKED', messageKey: 'MSG-LINK-INVALID' }],
    ['INVITE_FAILED', { ok: false, reason: 'BLOCKED', messageKey: 'MSG-INVITE-FAILED' }],
    ['LA_LUNG', { ok: false, reason: 'FAILED', messageKey: 'MSG-GENERIC' }],
  ])('%s', (result, expected) => {
    expect(mapEdgeResult(result, 'a@example.test')).toMatchObject(expected);
  });
});
