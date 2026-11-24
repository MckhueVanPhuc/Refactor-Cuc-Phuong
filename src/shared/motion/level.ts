// Mức chuyển động hiệu lực (specs/006 data-model §2; research R-02): công tắc "Hiệu ứng chuyển động", giảm chuyển động
// của thiết bị, tiết kiệm dữ liệu và máy yếu. Phản chiếu thành `data-motion` / `data-decor` trên <html> để CSS gate.
import { useEffect, useSyncExternalStore } from 'react';
import { getMotion, subscribeMotion } from './store';

export type MotionLevel = { level: 'full' | 'reduced'; decor: boolean };

type LowPowerNavigator = Navigator & {
  connection?: { saveData?: boolean; addEventListener?: (type: 'change', listener: () => void) => void; removeEventListener?: (type: 'change', listener: () => void) => void };
  deviceMemory?: number;
};

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

function reducedMedia(): MediaQueryList | null {
  try {
    return window.matchMedia(REDUCED_QUERY);
  } catch {
    return null;
  }
}

/** Máy hoặc mạng muốn tiết kiệm: T3 tắt (design-system §4.3.2). Trình duyệt không báo → coi là đủ mạnh. */
function lowPower(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as LowPowerNavigator;
  return nav.connection?.saveData === true || (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 2);
}

/** Ảnh chụp dạng chuỗi để `useSyncExternalStore` so sánh ổn định. */
function snapshot(): string {
  const reduced = !getMotion() || reducedMedia()?.matches === true;
  const decor = !reduced && !lowPower();
  return `${reduced ? 'reduced' : 'full'}:${decor ? 'on' : 'off'}`;
}

function subscribe(listener: () => void): () => void {
  const media = reducedMedia();
  const connection = (navigator as LowPowerNavigator).connection;
  const stopMotion = subscribeMotion(listener);
  media?.addEventListener?.('change', listener);
  connection?.addEventListener?.('change', listener);
  return () => {
    stopMotion();
    media?.removeEventListener?.('change', listener);
    connection?.removeEventListener?.('change', listener);
  };
}

export function readMotionLevel(): MotionLevel {
  const [level, decor] = snapshot().split(':');
  return { level: level === 'reduced' ? 'reduced' : 'full', decor: decor === 'on' };
}

export function useMotionLevel(): MotionLevel {
  const value = useSyncExternalStore(subscribe, snapshot, () => 'reduced:off');
  const [level, decor] = value.split(':');
  return { level: level === 'reduced' ? 'reduced' : 'full', decor: decor === 'on' };
}

/** Gọi một lần ở gốc app: ghi `data-motion` và `data-decor` lên <html> (contracts/motion-ui-contract.md §1). */
export function useMotionAttributes(): void {
  const { level, decor } = useMotionLevel();
  useEffect(() => {
    const root = document.documentElement;
    root.dataset['motion'] = level;
    root.dataset['decor'] = decor ? 'on' : 'off';
  }, [level, decor]);
}
