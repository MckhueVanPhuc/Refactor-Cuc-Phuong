// Tên tuyến cho thẻ "Tuyến đang đi" (E-SCR-M02-001-26; spec-M02 v3.5 §5.1 "Content inputs"; CHG-MASCOT-2026-11-27-07).
// Chỉ đọc `routeEssentials.name` của gói `SAN_SANG` đang dùng của cùng tuyến, qua m01Port. Không có gói hoặc đọc lỗi →
// `null`: thẻ không có dòng tên. Chỉ để hiển thị: không chép vào PlaySession, CheckpointVisit hay SessionSyncRecord.
import { useEffect, useState } from 'react';
import type { OfflinePackage } from '../../../shared/contracts/offlinePackage';
import { readActiveOfflinePackage } from '../m01Port';

export type RouteName = OfflinePackage['routeEssentials']['name'];

export function useRouteName(routeId: string | undefined): RouteName | null {
  const [name, setName] = useState<{ routeId: string; value: RouteName | null } | null>(null);
  useEffect(() => {
    if (!routeId) return undefined;
    let cancelled = false;
    readActiveOfflinePackage(routeId)
      .then((pkg) => pkg?.routeEssentials.name ?? null)
      .catch(() => null)
      .then((value) => {
        if (!cancelled) setName({ routeId, value });
      });
    return () => {
      cancelled = true;
    };
  }, [routeId]);
  // Phiên đổi tuyến (handoff mới): không hiện tên của tuyến cũ trong lúc đọc
  return name && name.routeId === routeId ? name.value : null;
}
