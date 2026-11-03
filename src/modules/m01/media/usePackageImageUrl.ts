// Object URL cho byte ảnh của gói active (sơ đồ offline; readPackageImage). Thu hồi URL khi đổi ảnh hoặc unmount.
import { useEffect, useState } from 'react';
import { readPackageImage } from '../storage/readers';

export function usePackageImageUrl(
  image: { routeId: string; contentVersion: number; sourceRef: string } | undefined,
): string | undefined {
  const [url, setUrl] = useState<string>();
  const key = image ? `${image.routeId}\n${image.contentVersion}\n${image.sourceRef}` : '';

  useEffect(() => {
    if (!image || typeof URL.createObjectURL !== 'function') return;
    let objectUrl: string | undefined;
    let cancelled = false;
    void readPackageImage(image.routeId, image.contentVersion, image.sourceRef).then((blob) => {
      if (cancelled || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setUrl(undefined);
    };
    // `image` được đại diện bởi `key`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return url;
}
