import { describe, expect, it } from 'vitest';
import { parseEnv } from './env';

const valid = {
  VITE_SUPABASE_URL: 'https://project.supabase.example',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
  VITE_APP_VERSION: '0.1.0',
  VITE_QR_PUBLIC_BASE_URL: 'https://quest.example',
};

describe('parseEnv (research R-14)', () => {
  it('nhận cấu hình hợp lệ và trả tên đã chuẩn hóa', () => {
    expect(parseEnv(valid, true)).toEqual({
      supabaseUrl: 'https://project.supabase.example',
      supabasePublishableKey: 'publishable-key',
      appVersion: '0.1.0',
      qrPublicBaseUrl: 'https://quest.example',
    });
  });

  it('từ chối base URL có dấu / ở cuối', () => {
    expect(() => parseEnv({ ...valid, VITE_QR_PUBLIC_BASE_URL: 'https://quest.example/' }, true)).toThrow(
      /VITE_QR_PUBLIC_BASE_URL/,
    );
    expect(() => parseEnv({ ...valid, VITE_SUPABASE_URL: 'https://project.supabase.example/' }, false)).toThrow(
      /VITE_SUPABASE_URL/,
    );
  });

  it('bắt buộc HTTPS khi IS_PRODUCTION_BUILD', () => {
    expect(() => parseEnv({ ...valid, VITE_QR_PUBLIC_BASE_URL: 'http://quest.example' }, true)).toThrow(
      /VITE_QR_PUBLIC_BASE_URL/,
    );
    expect(() => parseEnv({ ...valid, VITE_QR_PUBLIC_BASE_URL: 'http://localhost:5173' }, true)).toThrow(
      /VITE_QR_PUBLIC_BASE_URL/,
    );
  });

  it('chỉ nhận http://localhost… ở build không phải Production', () => {
    const local = {
      ...valid,
      VITE_QR_PUBLIC_BASE_URL: 'http://localhost:5173',
      VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
    };
    expect(parseEnv(local, false).qrPublicBaseUrl).toBe('http://localhost:5173');
    expect(() => parseEnv({ ...valid, VITE_QR_PUBLIC_BASE_URL: 'http://quest.example' }, false)).toThrow(
      /VITE_QR_PUBLIC_BASE_URL/,
    );
  });

  it('thiếu biến → lỗi khởi động nêu rõ tên biến', () => {
    const { VITE_SUPABASE_PUBLISHABLE_KEY: _omit, ...missing } = valid;
    expect(() => parseEnv(missing, false)).toThrow(/VITE_SUPABASE_PUBLISHABLE_KEY/);
    expect(() => parseEnv({ ...valid, VITE_APP_VERSION: '' }, false)).toThrow(/VITE_APP_VERSION/);
  });
});
