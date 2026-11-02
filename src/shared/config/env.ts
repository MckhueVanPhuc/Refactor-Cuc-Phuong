import { z } from 'zod';

export { MEDIA_BUCKET } from './storage';

/** `true` chỉ khi build Production trên Vercel (research R-13); mọi build khác là bản thử. */
export const IS_PRODUCTION_BUILD: boolean = __IS_PRODUCTION_BUILD__;

export type AppEnv = {
  supabaseUrl: string;
  supabasePublishableKey: string;
  appVersion: string;
  qrPublicBaseUrl: string;
};

// Stack Supabase local in ra 127.0.0.1, nên cả hai tên máy local đều được nhận ở build không phải Production
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

function baseUrl(isProductionBuild: boolean) {
  return z.string().superRefine((value, ctx) => {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      ctx.addIssue({ code: 'custom', message: 'không phải URL hợp lệ' });
      return;
    }
    if (value.endsWith('/')) {
      ctx.addIssue({ code: 'custom', message: 'không được có dấu / ở cuối' });
    }
    if (url.protocol === 'https:') return;
    if (url.protocol === 'http:' && !isProductionBuild && LOCAL_HOSTS.has(url.hostname)) return;
    ctx.addIssue({
      code: 'custom',
      message: isProductionBuild ? 'phải dùng HTTPS ở build Production' : 'chỉ nhận HTTPS hoặc http://localhost',
    });
  });
}

const required = z.string().min(1, 'thiếu giá trị');

function envSchema(isProductionBuild: boolean) {
  return z.object({
    VITE_SUPABASE_URL: baseUrl(isProductionBuild),
    VITE_SUPABASE_PUBLISHABLE_KEY: required,
    VITE_APP_VERSION: required,
    VITE_QR_PUBLIC_BASE_URL: baseUrl(isProductionBuild),
  });
}

/** Đọc và kiểm các biến `VITE_*` (research R-14). Sai hoặc thiếu → lỗi khởi động nêu tên biến. */
export function parseEnv(raw: Record<string, unknown>, isProductionBuild: boolean): AppEnv {
  const result = envSchema(isProductionBuild).safeParse(raw);
  if (!result.success) {
    const lines = result.error.issues.map((issue) => `- ${String(issue.path[0])}: ${issue.message}`);
    throw new Error(`Cấu hình ứng dụng không hợp lệ:\n${lines.join('\n')}`);
  }
  const data = result.data;
  return {
    supabaseUrl: data.VITE_SUPABASE_URL,
    supabasePublishableKey: data.VITE_SUPABASE_PUBLISHABLE_KEY,
    appVersion: data.VITE_APP_VERSION,
    qrPublicBaseUrl: data.VITE_QR_PUBLIC_BASE_URL,
  };
}

export const env: AppEnv = parseEnv(import.meta.env, IS_PRODUCTION_BUILD);
