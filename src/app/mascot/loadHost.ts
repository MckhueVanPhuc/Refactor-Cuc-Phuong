// Nạp host Mila chỉ khi công tắc bật (specs/005 research R-13): cờ tắt thì không import() chunk `mascot`.
import { lazy } from 'react';
import { isMascotEnabled } from '../../shared/mascot/flag';

export function loadMascotHost() {
  if (!isMascotEnabled()) return null;
  return lazy(async () => ({ default: (await import('./MascotHost')).MascotHost }));
}
