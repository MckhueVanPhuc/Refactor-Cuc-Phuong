import { useEffect, useState, useSyncExternalStore } from 'react';
import { RouterProvider } from 'react-router';
import { registerM02BusyCheck } from '../modules/m02/pwa/registerBusy';
import { UpdatePrompt } from './pwa/UpdatePrompt';
import { createAppRouter } from './router';

export function App() {
  const [router] = useState(createAppRouter);

  useEffect(() => {
    // M02: không áp bản mới khi có phiên đang chạy hoặc đang quét/đồng bộ (research M02 R-15). Đồng bộ, trước mọi import()
    // động, để điều kiện bận có mặt trước khi người dùng kịp bấm Cập nhật.
    registerM02BusyCheck();
    // Cầu nối test E2E chỉ ở MODE e2e/fake; import() động trong nhánh này để không vào bundle production
    if (import.meta.env.MODE === 'e2e' || import.meta.env.MODE === 'fake') {
      void import('../shared/testing/e2eHooks').then((hooks) => hooks.installTestHooks());
      void import('../modules/m01/testing/e2eHooks').then((hooks) => hooks.registerM01TestHooks());
      void import('../modules/m02/testing/e2eHooks').then((hooks) => hooks.registerM02TestHooks());
    }
    void import('./pwa/registerServiceWorker').then((sw) => sw.registerServiceWorker());
    // M01: candidate gói mồ côi của tab đã đóng giữa lúc tải → thao tác lỗi (research M01 R-08)
    void import('../modules/m01/offline-package/recoverOrphans').then((m01) => m01.recoverM01Orphans());
    // M02: tự đóng phiên quá 24 giờ khi mở app và khi trang hiện lại (BR-M02-022; research M02 R-09)
    void import('../modules/m02/session/autoEndTriggers').then((m02) => m02.startAutoEndTriggers());
    // M02: gửi phiên terminal khi mở app, trang hiện lại, có mạng lại (research M02 R-11)
    void import('../modules/m02/sync/startSync').then((m02) => m02.startSync());
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
