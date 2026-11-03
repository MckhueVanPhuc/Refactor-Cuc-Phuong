import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router';
import { createAppRouter } from './router';

export function App() {
  const [router] = useState(createAppRouter);

  useEffect(() => {
    // Cầu nối test E2E chỉ ở MODE e2e/fake; import() động trong nhánh này để không vào bundle production
    if (import.meta.env.MODE === 'e2e' || import.meta.env.MODE === 'fake') {
      void import('../shared/testing/e2eHooks').then((hooks) => hooks.installTestHooks());
      void import('../modules/m01/testing/e2eHooks').then((hooks) => hooks.registerM01TestHooks());
    }
    void import('./pwa/registerServiceWorker').then((sw) => sw.registerServiceWorker());
    // M01: candidate gói mồ côi của tab đã đóng giữa lúc tải → thao tác lỗi (research M01 R-08)
    void import('../modules/m01/offline-package/recoverOrphans').then((m01) => m01.recoverM01Orphans());
  }, []);

  return <RouterProvider router={router} />;
}
