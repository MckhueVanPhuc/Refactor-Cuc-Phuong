import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };

// Production chỉ khi Vercel build môi trường production; mọi build khác giữ dấu
// "BẢN THỬ" trên ảnh QR (research R-13, fail-safe).
const isProductionBuild = process.env.VERCEL_ENV === 'production';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const appVersion = env.VITE_APP_VERSION || pkg.version;

  return {
    plugins: [
      react(),
      VitePWA({
        // Cập nhật kiểu prompt: không tự reload, update coordinator quyết định lúc áp (research R-22)
        registerType: 'prompt',
        injectRegister: false,
        manifest: {
          name: 'Cúc Phương Quest',
          short_name: 'Cúc Phương Quest',
          lang: 'vi',
          start_url: '/',
          display: 'standalone',
        },
        workbox: {
          navigateFallback: '/index.html',
          // Không runtime-cache Supabase API, Auth, response quản trị hay media đã ký (constitution VI)
          runtimeCaching: [],
        },
      }),
    ],
    define: {
      __IS_PRODUCTION_BUILD__: JSON.stringify(isProductionBuild),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
    },
  };
});
