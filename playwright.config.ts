import { defineConfig, devices, type Project } from '@playwright/test';

// Project *-local-stack chỉ chạy khi PW_LOCAL_STACK=1 (giai đoạn B, stack Supabase local).
// Mặc định `npm run e2e` và CI chỉ chạy project dùng mock. M01/M02 thêm server và project vào file này.
const localStack = process.env.PW_LOCAL_STACK === '1';

// Camera giả của Chromium phát file .y4m chứa ảnh QR synthetic (research M02 R-19; e2e/fixtures/make-qr-y4m.mjs).
// Chromium chỉ nhận một file video mỗi lần khởi chạy, nên mỗi file cần một project riêng.
const fakeCamera = (file: string): string[] => [
  '--use-fake-ui-for-media-stream',
  '--use-fake-device-for-media-stream',
  `--use-file-for-fake-video-capture=e2e/fixtures/${file}`,
];

const mockProjects: Project[] = [
  {
    name: 'm03',
    testDir: 'e2e/m03',
    use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5174' },
  },
  // M01 chạy trên bản build MODE e2e (có service worker); Data API và Storage giả bằng page.route() (research M01 R-16)
  {
    name: 'm01',
    testDir: 'e2e/m01',
    // Spec *.local.spec.ts chỉ chạy ở m01-local-stack
    testIgnore: '**/*.local.spec.ts',
    use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:4173', serviceWorkers: 'allow' },
  },
  // M02 dùng cùng bản build MODE e2e với M01; lookup, intake và Storage giả bằng page.route() (research M02 R-19)
  {
    name: 'm02',
    testDir: 'e2e/m02',
    testIgnore: ['**/*.local.spec.ts', '**/scan-evil.spec.ts'],
    use: {
      ...devices['Desktop Chrome'],
      baseURL: 'http://localhost:4173',
      serviceWorkers: 'allow',
      launchOptions: { args: fakeCamera('qr-q1a.y4m') },
    },
  },
  // QR sai base: camera phát `https://evil.example/q/Q1a`
  {
    name: 'm02-cam-evil',
    testDir: 'e2e/m02',
    testMatch: '**/scan-evil.spec.ts',
    use: {
      ...devices['Desktop Chrome'],
      baseURL: 'http://localhost:4173',
      serviceWorkers: 'allow',
      launchOptions: { args: fakeCamera('qr-evil.y4m') },
    },
  },
];

const localStackProjects: Project[] = [
  {
    name: 'm03-local-stack',
    testDir: 'e2e/m03',
    use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5173' },
  },
  {
    name: 'm01-local-stack',
    testDir: 'e2e/m01',
    // Chỉ tích hợp thật (T105); kịch bản network mock chạy ở project m01
    testMatch: '**/*.local.spec.ts',
    use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5173' },
  },
  {
    name: 'm02-local-stack',
    testDir: 'e2e/m02',
    // Chỉ tích hợp thật (T105); kịch bản network mock chạy ở project m02
    testMatch: '**/*.local.spec.ts',
    use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5173' },
  },
];

export default defineConfig({
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  testMatch: '**/*.spec.ts',
  use: { trace: 'retain-on-failure' },
  projects: localStack ? [...mockProjects, ...localStackProjects] : mockProjects,
  // Playwright không có webServer theo project: mảng cấp cao nhất, mỗi server một cổng
  webServer: [
    {
      command: 'npm run dev:fake',
      url: 'http://localhost:5174',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run preview:e2e',
      url: 'http://localhost:4173',
      reuseExistingServer: !process.env.CI,
      // Gồm thời gian build trước khi preview
      timeout: 180_000,
    },
    ...(localStack
      ? [{ command: 'npm run dev', url: 'http://localhost:5173', reuseExistingServer: !process.env.CI }]
      : []),
  ],
});
