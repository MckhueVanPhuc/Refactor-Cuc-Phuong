// Phần hiển thị lấy từ gói cho màn kết quả (spec-M02 v3.6 §5.1 "Content inputs"; CHG-MASCOT-2026-11-28-10): tên tuyến
// (`routeEssentials.name`) và, cho từng điểm của journey, ảnh đầu tiên trong `resources` của điểm đó. Chỉ đọc gói
// `SAN_SANG` đang dùng của đúng tuyến qua m01Port. Không có gói hoặc đọc lỗi → `null`: màn không có tên tuyến, ảnh nhỏ
// là ô biểu tượng. Chỉ để hiển thị: không chép vào PlaySession, CheckpointVisit hay SessionSyncRecord.
import { useEffect, useState } from 'react';
import type { OfflinePackage } from '../../../shared/contracts/offlinePackage';
import { readActiveOfflinePackage } from '../m01Port';

/** Một ảnh trong gói; đọc byte bằng `readPackageImage` với version của GÓI (có thể khác version của phiên). */
export type PackageImageRef = { routeId: string; contentVersion: number; sourceRef: string };

export type EndPackageView = {
  routeName: OfflinePackage['routeEssentials']['name'];
  /** checkpointId → ảnh đầu tiên của điểm; điểm không có ảnh thì không có khóa */
  thumbnails: ReadonlyMap<string, PackageImageRef>;
};

export function endPackageView(pkg: OfflinePackage): EndPackageView {
  const thumbnails = new Map<string, PackageImageRef>();
  for (const resource of pkg.resources) {
    const sourceRef = resource.staticImages[0];
    if (sourceRef && !thumbnails.has(resource.checkpointId)) {
      thumbnails.set(resource.checkpointId, { routeId: pkg.routeId, contentVersion: pkg.contentVersion, sourceRef });
    }
  }
  return { routeName: pkg.routeEssentials.name, thumbnails };
}

export function useEndPackageView(routeId: string | undefined): EndPackageView | null {
  const [view, setView] = useState<{ routeId: string; value: EndPackageView | null } | null>(null);
  useEffect(() => {
    if (!routeId) return undefined;
    let cancelled = false;
    readActiveOfflinePackage(routeId)
      .then((pkg) => (pkg && pkg.routeId === routeId ? endPackageView(pkg) : null))
      .catch(() => null)
      .then((value) => {
        if (!cancelled) setView({ routeId, value });
      });
    return () => {
      cancelled = true;
    };
  }, [routeId]);
  return view && view.routeId === routeId ? view.value : null;
}
