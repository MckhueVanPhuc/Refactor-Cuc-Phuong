import { useEffect, useId, useRef } from 'react';
import { Button } from '../../../shared/ui/Button';
import { SUPPORTED_MIME_TYPES } from '../config/limits';
import { formatMessage } from '../messages/catalog';
import { DISPLAY_NAMES } from '../messages/displayNames';
import { useUploadQueue, type UploadItem, type UploadQueueOptions } from './useUploadQueue';
import styles from './MediaUploader.module.css';

export type MediaUploaderProps = UploadQueueOptions & {
  label: string;
  /** Câu gợi ý duy nhất được phép (§5.5), ví dụ cho âm thanh/video của điểm dừng cần tải trước */
  hint?: string;
  /** Báo tệp vừa đăng ký xong để editor đưa vào state form (chưa lưu) */
  onUploaded?: (item: UploadItem) => void;
  /** Media đã nằm trong bản đã lưu; tệp thuộc tập này không còn dòng MSG-UPLOADED-NOT-SAVED (BR-M03-E14) */
  savedMediaIds?: ReadonlySet<string>;
};

/** Chọn nhiều tệp; trạng thái từng tệp "Đang tải" / "Đã tải" / "Không tải được" (BR-M03-E14). */
export function MediaUploader({ label, hint, onUploaded, savedMediaIds, ...options }: MediaUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const queue = useUploadQueue(options);
  const reported = useRef(new Set<string>());

  useEffect(() => {
    for (const item of queue.items) {
      if (item.state === 'uploaded' && !reported.current.has(item.key)) {
        reported.current.add(item.key);
        onUploaded?.(item);
      }
    }
  }, [queue.items, onUploaded]);

  const accept = (options.kind === 'IMAGE' ? SUPPORTED_MIME_TYPES.IMAGE : [...SUPPORTED_MIME_TYPES.AUDIO, ...SUPPORTED_MIME_TYPES.VIDEO]).join(',');

  return (
    <div className={styles.uploader}>
      <div className={styles.header}>
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
        <Button onClick={() => inputRef.current?.click()}>Chọn tệp</Button>
      </div>
      {hint ? <p className={styles.hint}>{hint}</p> : null}
      <input
        ref={inputRef}
        id={inputId}
        className="visually-hidden"
        type="file"
        multiple
        accept={accept}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = '';
          if (files.length > 0) void queue.addFiles(files);
        }}
      />
      {queue.items.length > 0 ? (
        <ul className={styles.list}>
          {queue.items.map((item) => (
            <li key={item.key} className={styles.item}>
              <span className={styles.fileName}>{item.fileName}</span>
              <span className={`${styles.state} ${styles[item.state]}`}>{DISPLAY_NAMES.uploadState[item.state]}</span>
              {item.state === 'failed' && item.message ? <p className={styles.reason}>{item.message}</p> : null}
              {item.state === 'uploaded' && !(item.mediaId && savedMediaIds?.has(item.mediaId)) ? (
                <p className={styles.note}>{formatMessage('MSG-UPLOADED-NOT-SAVED')}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      <p role="status" className={styles.summary}>
        {queue.summary ?? ''}
      </p>
    </div>
  );
}
