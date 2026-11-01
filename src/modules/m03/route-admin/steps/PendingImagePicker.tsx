// Chọn ảnh cho tuyến chưa lưu (validation-report D-25): kiểm trước ở client như khi tải (media-storage §1 bước 1),
// giữ tệp trên form; tệp được tải ở lần "Lưu bản nháp" đầu tiên (firstSave.ts). Tệp sai bị từ chối từng tệp.
import { useId, useRef, useState } from 'react';
import { Button } from '../../../../shared/ui/Button';
import { SUPPORTED_MIME_TYPES } from '../../config/limits';
import { precheckFile } from '../../media/useUploadQueue';
import type { RouteImage } from '../routeForm';
import styles from './steps.module.css';

let nextPending = 0;

export type PendingImagePickerProps = {
  label: string;
  multiple: boolean;
  maxCount: number;
  remaining: number;
  ownerName: string;
  onPicked: (images: RouteImage[]) => void;
};

export function PendingImagePicker({ label, multiple, maxCount, remaining, ownerName, onPicked }: PendingImagePickerProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [refused, setRefused] = useState<string[]>([]);

  function pick(files: File[]) {
    let slots = remaining;
    const accepted: RouteImage[] = [];
    const reasons: string[] = [];
    for (const file of files) {
      const reason = precheckFile(file, { kind: 'IMAGE', maxCount, ownerName }, slots <= 0);
      if (reason) {
        reasons.push(reason);
        continue;
      }
      slots -= 1;
      accepted.push({ mediaId: `pending:${++nextPending}`, sourceRef: '', usageRightsConfirmed: false, fileName: file.name, file });
    }
    setRefused(reasons);
    if (accepted.length > 0) onPicked(accepted);
  }

  return (
    <div className={styles.group}>
      <div className={styles.pickerHead}>
        <label htmlFor={inputId} className={styles.groupLabel}>
          {label}
        </label>
        <Button onClick={() => inputRef.current?.click()}>Chọn tệp</Button>
      </div>
      <input
        ref={inputRef}
        id={inputId}
        className="visually-hidden"
        type="file"
        multiple={multiple}
        accept={SUPPORTED_MIME_TYPES.IMAGE.join(',')}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = '';
          if (files.length > 0) pick(files);
        }}
      />
      {refused.map((reason) => (
        <p key={reason} className={styles.error}>
          {reason}
        </p>
      ))}
    </div>
  );
}
