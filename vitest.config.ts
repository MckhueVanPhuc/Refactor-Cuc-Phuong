import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    __IS_PRODUCTION_BUILD__: 'false',
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.test.ts?(x)'],
    // Giá trị giả an toàn để src/shared/config/env.ts không làm hỏng test có import nó
    env: {
      VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
      VITE_APP_VERSION: '0.0.0-test',
      VITE_QR_PUBLIC_BASE_URL: 'http://localhost:5174',
    },
  },
});
