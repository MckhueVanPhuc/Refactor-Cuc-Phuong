// Signed URL cho ảnh và audio/video của nội dung live (tasks T054; research R-12): ký cả lô một lần cho các `sourceRef`
// đang hiển thị qua src/modules/m02/api/mediaUrl.ts. Không cache; mục ký lỗi không có trong Map (UI hiện placeholder
// hoặc lỗi tệp).
import { useEffect, useState } from 'react';
import { mediaUrlClient } from '../api/mediaUrl';

/** `undefined` = đang ký. */
export function useSignedUrls(sourceRefs: readonly string[]): Map<string, string> | undefined {
  const key = [...new Set(sourceRefs)].sort().join('\n');
  const [urls, setUrls] = useState<Map<string, string> | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    setUrls(undefined);
    void mediaUrlClient.signedUrls(key ? key.split('\n') : []).then((result) => {
      if (!cancelled) setUrls(result);
    });
    return () => {
      cancelled = true;
    };
  }, [key]);
  return urls;
}
