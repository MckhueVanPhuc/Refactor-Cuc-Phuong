// Ảnh nhỏ của một media trên editor, đọc qua URL của admin (research R-12). Chưa có hoặc không đọc được thì hiện ô trống.
import { useEffect, useState } from 'react';
import { useAdminApi } from '../api/AdminApiProvider';
import { useMediaUrl } from './signedUrl';
import styles from './MediaThumbnail.module.css';

export function MediaThumbnail({ sourceRef }: { sourceRef: string }) {
  const { url } = useMediaUrl(useAdminApi(), sourceRef);
  return url ? <img className={styles.thumb} src={url} alt="" /> : <span className={styles.missing} aria-hidden="true" />;
}

/** Ảnh nhỏ của một tệp còn trên máy (chưa tải lên) */
export function FileThumbnail({ file }: { file: File }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (typeof URL.createObjectURL !== 'function') return;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return url ? <img className={styles.thumb} src={url} alt="" /> : <span className={styles.missing} aria-hidden="true" />;
}
