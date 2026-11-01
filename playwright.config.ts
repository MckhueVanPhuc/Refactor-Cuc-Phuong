import { defineConfig, devices, type Project } from '@playwright/test';

// Project *-local-stack chỉ chạy khi PW_LOCAL_STACK=1 (giai đoạn B, stack Supabase local).
// Mặc định `npm run e2e` và CI chỉ chạy project dùng mock. M01/M02 thêm server và project vào file này.
const localStack = process.env.PW_LOCAL_STACK === '1';

const mockProjects: Project[] = [
  {
    name: 'm03',
    testDir: 'e2e/m03',
    use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5174' },
  },
];

const localStackProjects: Project[] = [
  {
    name: 'm03-local-stack',
    testDir: 'e2e/m03',
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
    ...(localStack
      ? [{ command: 'npm run dev', url: 'http://localhost:5173', reuseExistingServer: !process.env.CI }]
      : []),
  ],
});
