import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };

// Production chỉ khi Vercel build môi trường production; mọi build khác giữ dấu
// "BẢN THỬ" trên ảnh QR (research R-13, fail-safe).
const isProductionBuild = process.env.VERCEL_ENV === 'production';

// Tên chunk theo thư mục nguồn (`m01-catalog`, `m03-auth`…) để precache loại được phần chỉ online của M03
// (research M01 R-14; M03 R-24) mà không phải liệt kê từng màn. Chunk màn lazy lấy tên theo module của màn
// (module dùng chung chỉ nằm trong chunk đó khi không màn nào khác cần); chunk chung lẫn nhiều module giữ tên mặc định.
const MODULE_DIR = /(?:^|\/)src\/modules\/(m0\d)\/([^/]+)\//;

function chunkPrefix(facadeModuleId: string | null | undefined, moduleIds: readonly string[]): string | undefined {
  if (facadeModuleId) return chunkPrefix(null, [facadeModuleId]);
  const ids = moduleIds.map((id) => id.replaceAll('\\', '/'));
  if (ids.length === 0) return undefined;
  // Thư viện in QR chỉ M03 dùng (nạp lazy ở renderQr.ts)
  if (ids.some((id) => id.includes('/node_modules/qrcode/')) && ids.every((id) => id.includes('/node_modules/'))) {
    return 'qrcode';
  }
  const matches = ids.map((id) => MODULE_DIR.exec(id));
  if (matches.some((match) => !match)) return undefined;
  const modules = new Set(matches.map((match) => match![1]));
  if (modules.size !== 1) return undefined;
  const dirs = new Set(matches.map((match) => match![2]));
  const [module] = modules;
  return dirs.size === 1 ? `${module}-${[...dirs][0]}` : `${module}-[name]`;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const appVersion = env.VITE_APP_VERSION || pkg.version;

  return {
    plugins: [
      react(),
      VitePWA({
        strategies: 'generateSW',
        // Cập nhật kiểu prompt: không tự reload, update coordinator quyết định lúc áp (research R-22)
        registerType: 'prompt',
        injectRegister: false,
        manifest: {
          name: 'Cúc Phương Quest',
          short_name: 'Cúc Phương Quest',
          lang: 'vi',
          start_url: '/',
          display: 'standalone',
          // Để trống cho tới khi chủ dự án cung cấp icon vuông 192/512 px (tasks M01 T007; không tự tạo asset)
          icons: [],
        },
        workbox: {
          // App shell offline: mọi JS/CSS/HTML/font/icon của build, gồm chunk lazy của M01 và M02 (research M01 R-14)
          globPatterns: ['**/*.{js,css,html,woff,woff2,png,svg,ico,webmanifest}'],
          // M03 chỉ online: không precache màn quản trị và thư viện in QR (M03 R-24)
          globIgnores: ['**/node_modules/**/*', 'assets/m03-*', 'assets/qrcode-*'],
          // `/q/{qrIdentifier}` và mọi route SPA mở từ app shell khi offline (spec-M01 §9.3; BR-M02-025)
          navigateFallback: '/index.html',
          // Service worker đầu tiên điều khiển trang ngay, để chunk chưa nạp vẫn lấy được từ precache nếu mất mạng
          // ngay trong lần mở đầu. Không bật skipWaiting: bản mới vẫn chờ người dùng đồng ý (prompt; DV-24)
          clientsClaim: true,
          // Không runtime-cache Supabase API, Auth, response quản trị hay media đã ký (constitution VI)
          runtimeCaching: [],
        },
      }),
    ],
    build: {
      rolldownOptions: {
        output: {
          chunkFileNames: (chunk) => {
            const prefix = chunkPrefix(chunk.facadeModuleId, chunk.moduleIds);
            return prefix ? `assets/${prefix}-[hash].js` : 'assets/[name]-[hash].js';
          },
          // CSS của một chunk màn mang `originalFileNames` là file nguồn của màn đó
          assetFileNames: (asset) => {
            const prefix = chunkPrefix(null, asset.originalFileNames);
            return prefix ? `assets/${prefix}-[hash][extname]` : 'assets/[name]-[hash][extname]';
          },
        },
      },
    },
    define: {
      __IS_PRODUCTION_BUILD__: JSON.stringify(isProductionBuild),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
    },
  };
});
