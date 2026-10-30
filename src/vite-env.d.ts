/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

/** `true` chỉ khi build trên Vercel với `VERCEL_ENV=production` (research R-13). */
declare const __IS_PRODUCTION_BUILD__: boolean;

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_QR_PUBLIC_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
