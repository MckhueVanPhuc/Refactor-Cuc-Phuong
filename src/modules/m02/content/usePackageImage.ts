// Ảnh của nội dung gói (tasks T054; research R-12): byte đọc qua m01Port (`readPackageImage`) thành object URL, thu hồi
// khi rời màn hoặc đổi ảnh. `routeId`/`contentVersion` là của gói active, có thể khác version của phiên.
import { useEffect, useState } from 'react';
import { readPackageImage } from '../m01Port';

/** `undefined` = đang đọc; `null` = không có byte (hiện placeholder). */
export function usePackageImage(routeId: string, contentVersion: number, sourceRef: string): string | null | undefined {
  const [url, setUrl] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | undefined;
    setUrl(undefined);
    void readPackageImage(routeId, contentVersion, sourceRef)
      .catch(() => null)
      .then((blob) => {
        if (cancelled) return;
        if (!blob) {
          setUrl(null);
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [routeId, contentVersion, sourceRef]);
  return url;
}
