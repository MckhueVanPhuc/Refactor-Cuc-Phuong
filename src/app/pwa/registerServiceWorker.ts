import { registerSW } from 'virtual:pwa-register';
import { updateCoordinator } from './updateCoordinator';

let registered = false;

/** Đăng ký service worker; bản mới chỉ được báo cho coordinator, không tự reload (research R-22). */
export function registerServiceWorker(): void {
  if (registered) return;
  registered = true;
  const updateServiceWorker = registerSW({
    onNeedRefresh() {
      updateCoordinator.notifyUpdateAvailable(() => updateServiceWorker(true));
    },
  });
}
