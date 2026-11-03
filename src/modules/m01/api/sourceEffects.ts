// Các hiệu ứng M01 chạy sau mỗi lần đọc nguồn thành công (registry onSourceRead; tasks T070, T084). Đăng ký một lần
// khi M01 được nạp (routes.tsx); có đếm tham chiếu nên test đăng ký/hủy được mà không đăng ký trùng.
import { markOutdatedPackages, refreshSavedEssentials } from '../offline-package/lazyUpdate';
import { revokeClosedRoutes } from '../start/revocationEffect';
import { registerSourceReadEffect, type SourceReadEffect } from './onSourceRead';

const EFFECTS: readonly SourceReadEffect[] = [revokeClosedRoutes, markOutdatedPackages, refreshSavedEssentials];

let registrations = 0;
let unregisterAll: (() => void) | undefined;

export function registerM01SourceEffects(): () => void {
  registrations += 1;
  if (registrations === 1) {
    const unregisters = EFFECTS.map((effect) => registerSourceReadEffect(effect));
    unregisterAll = () => unregisters.forEach((unregister) => unregister());
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    registrations -= 1;
    if (registrations === 0) {
      unregisterAll?.();
      unregisterAll = undefined;
    }
  };
}
