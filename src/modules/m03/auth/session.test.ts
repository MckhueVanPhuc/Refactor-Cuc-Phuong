// Link khôi phục trên cloud: supabase-js xóa `#access_token=…` khỏi URL trước khi trang lazy hiện ra,
// nên AuthService phải nhớ URL lúc tải trang (validation-report M03, sự cố khôi phục mật khẩu).
import { afterEach, describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseAuthService } from './session';

function clientWithSession(hasSession: boolean) {
  return {
    auth: { getSession: async () => ({ data: { session: hasSession ? {} : null } }) },
  } as unknown as SupabaseClient<any, 'api'>;
}

const recoveryLanding = { path: '/admin/recovery', urlPart: '#access_token=x&refresh_token=y&type=recovery' };

describe('createSupabaseAuthService — URL lúc tải trang', () => {
  afterEach(() => window.history.replaceState(null, '', '/'));

  it('vẫn nhận ra link khôi phục khi provider đã xóa hash', () => {
    window.history.replaceState(null, '', '/admin/recovery');
    const auth = createSupabaseAuthService(clientWithSession(true), recoveryLanding);
    expect(auth.hasLinkInUrl('')).toBe(true);
  });

  it('không dùng bản chụp khi đã sang trang khác', () => {
    window.history.replaceState(null, '', '/admin/login');
    const auth = createSupabaseAuthService(clientWithSession(true), recoveryLanding);
    expect(auth.hasLinkInUrl('')).toBe(false);
  });

  it('không có link thì vẫn là form yêu cầu', () => {
    window.history.replaceState(null, '', '/admin/recovery');
    const auth = createSupabaseAuthService(clientWithSession(false), { path: '/admin/recovery', urlPart: '' });
    expect(auth.hasLinkInUrl('')).toBe(false);
  });

  it('lỗi của link trong bản chụp → INVALID', async () => {
    window.history.replaceState(null, '', '/admin/recovery');
    const auth = createSupabaseAuthService(clientWithSession(true), {
      path: '/admin/recovery',
      urlPart: '#error=access_denied&error_code=otp_expired',
    });
    await expect(auth.consumeLink('recovery', '')).resolves.toBe('INVALID');
  });

  it('link hợp lệ đã tạo phiên → OK', async () => {
    window.history.replaceState(null, '', '/admin/recovery');
    const auth = createSupabaseAuthService(clientWithSession(true), recoveryLanding);
    await expect(auth.consumeLink('recovery', '')).resolves.toBe('OK');
  });
});
