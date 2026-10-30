import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminApiError, toTransportMessageKey } from './errors';

describe('ánh xạ lỗi transport (research R-06; BR-M03-L10)', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([
    ['fetch thất bại', new TypeError('Failed to fetch')],
    ['hết thời gian chờ', Object.assign(new Error('The operation timed out.'), { name: 'TimeoutError' })],
    ['request bị hủy', Object.assign(new Error('aborted'), { name: 'AbortError' })],
    ['Edge không tới được', Object.assign(new Error('x'), { name: 'FunctionsFetchError' })],
  ])('%s → MSG-NETWORK-FAILED', (_label, error) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(toTransportMessageKey(error)).toBe('MSG-NETWORK-FAILED');
  });

  it.each([
    ['JWT hết hạn (PostgREST)', { code: 'PGRST301', message: 'JWT expired' }],
    ['HTTP 401', { status: 401, message: 'Unauthorized' }],
    ['phiên Auth không còn', Object.assign(new Error('Auth session missing!'), { name: 'AuthSessionMissingError' })],
  ])('%s → MSG-SESSION-EXPIRED', (_label, error) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(toTransportMessageKey(error)).toBe('MSG-SESSION-EXPIRED');
  });

  it.each([
    ['insufficient_privilege', { code: '42501', message: 'permission denied for function x' }],
    ['HTTP 403', { status: 403, message: 'Forbidden' }],
  ])('%s → MSG-NO-PERMISSION', (_label, error) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(toTransportMessageKey(error)).toBe('MSG-NO-PERMISSION');
  });

  it('còn lại → MSG-GENERIC; chi tiết kỹ thuật chỉ vào console', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(toTransportMessageKey({ code: 'P0001', message: 'raise exception at line 12' })).toBe('MSG-GENERIC');
    expect(toTransportMessageKey('lạ')).toBe('MSG-GENERIC');
    expect(log).toHaveBeenCalled();
  });

  it('AdminApiError mang messageKey, message không chứa chi tiết kỹ thuật', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = AdminApiError.from({ code: 'PGRST301', message: 'JWT expired' });
    expect(error).toBeInstanceOf(AdminApiError);
    expect(error.messageKey).toBe('MSG-SESSION-EXPIRED');
    expect(error.message).not.toMatch(/JWT/);
  });
});
