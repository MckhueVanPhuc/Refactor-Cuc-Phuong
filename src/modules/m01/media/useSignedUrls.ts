// Signed URL để hiển thị ảnh online (thumbnail, gallery, sơ đồ tuyến; research R-06). Chỉ trong bộ nhớ, không
// lưu và không đưa vào gói (data-model §6). Ký lỗi (kể cả khi offline) → không có URL → placeholder trung tính.
import { useEffect, useState } from 'react';
import type { MediaClient } from '../api/mediaClient';

export function useSignedUrls(media: Pick<MediaClient, 'createSignedUrls'>, sourceRefs: readonly string[]): ReadonlyMap<string, string> {
  const [urls, setUrls] = useState<ReadonlyMap<string, string>>(new Map());
  const key = [...new Set(sourceRefs)].sort().join('\n');

  useEffect(() => {
    const missing = key.split('\n').filter((ref) => ref !== '' && !urls.has(ref));
    if (missing.length === 0) return;
    let cancelled = false;
    void media.createSignedUrls(missing).then((signed) => {
      if (cancelled || !signed || signed.size === 0) return;
      setUrls((previous) => new Map([...previous, ...signed]));
    });
    return () => {
      cancelled = true;
    };
    // `urls` cố ý không nằm trong deps: chỉ ký lại khi tập sourceRef đổi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media, key]);

  return urls;
}
