// URL đọc media cho thumbnail editor và xem trước (research R-12). Không cache: mỗi lần dùng xin URL mới
// (bản Supabase: signed URL của bucket MEDIA_BUCKET; bản giả: object URL). Workbox cũng không cache.
import { useEffect, useState } from 'react';
import type { AdminApi } from '../api/AdminApi';

export function getMediaUrl(api: AdminApi, sourceRef: string): Promise<string> {
  return api.getMediaUrl(sourceRef);
}

/** URL của một media, hoặc `undefined` khi đang lấy / lấy lỗi (ảnh không đọc được thì UI hiện lý do riêng). */
export function useMediaUrl(api: AdminApi, sourceRef: string | undefined): { url?: string; failed: boolean } {
  const [state, setState] = useState<{ url?: string; failed: boolean }>({ failed: false });

  useEffect(() => {
    if (!sourceRef) {
      setState({ failed: false });
      return;
    }
    let cancelled = false;
    setState({ failed: false });
    getMediaUrl(api, sourceRef).then(
      (url) => !cancelled && setState({ url, failed: false }),
      () => !cancelled && setState({ failed: true }),
    );
    return () => {
      cancelled = true;
    };
  }, [api, sourceRef]);

  return state;
}
