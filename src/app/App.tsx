import { useEffect, useState, useSyncExternalStore } from 'react';
import { RouterProvider } from 'react-router';
import { UpdatePrompt } from './pwa/UpdatePrompt';
import { createAppRouter } from './router';

export function App() {
  const [router] = useState(createAppRouter);

  useEffect(() => {
    // Cầu nối test E2E chỉ ở MODE e2e/fake; import() động trong nhánh này để không vào bundle production
    if (import.meta.env.MODE === 'e2e' || import.meta.env.MODE === 'fake') {
      void import('../shared/testing/e2eHooks').then((hooks) => hooks.installTestHooks());
      void import('../modules/m01/testing/e2eHooks').then((hooks) => hooks.registerM01TestHooks());
      void import('../modules/m02/testing/e2eHooks').then((hooks) => hooks.registerM02TestHooks());
    }
    void import('./pwa/registerServiceWorker').then((sw) => sw.registerServiceWorker());
    // M01: candidate gói mồ côi của tab đã đóng giữa lúc tải → thao tác lỗi (research M01 R-08)
    void import('../modules/m01/offline-package/recoverOrphans').then((m01) => m01.recoverM01Orphans());
  }, []);

  // Lời nhắc cập nhật chỉ trên route du khách: theo dõi đường dẫn của router (tasks M01 T093)
  const pathname = useSyncExternalStore(router.subscribe, () => router.state.location.pathname);

  return (
    <>
      <RouterProvider router={router} />
      <UpdatePrompt pathname={pathname} />
    </>
  );
}
