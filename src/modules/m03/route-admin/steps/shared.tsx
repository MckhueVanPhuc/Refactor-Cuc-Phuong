// Phần dùng chung của bốn bước editor tuyến: props của bước, trường song ngữ, một ảnh đã tải.
// BilingualField nằm ở editor/ (dùng chung cho ba editor M03, spec-AI research R-08); export lại để import cũ không đổi.
import type { ReactNode } from 'react';
import { Button } from '../../../../shared/ui/Button';
import { Checkbox } from '../../../../shared/ui/Checkbox';
import type { AdminApi } from '../../api/AdminApi';
import { FileThumbnail, MediaThumbnail } from '../../media/MediaThumbnail';
import type { RouteForm, RouteImage } from '../routeForm';
import styles from './steps.module.css';

export { BilingualField } from '../../editor/BilingualField';

export type StepProps = {
  form: RouteForm;
  update: (change: (current: RouteForm) => RouteForm) => void;
  errorFor: (fieldKey: string) => string | undefined;
  readOnly: boolean;
};

/** Bước có ảnh: tuyến đã lưu thì tải ngay; tuyến mới thì giữ tệp trên form, tải ở lần lưu đầu (D-25) */
export type UploadProps = {
  api: AdminApi;
  routeId: string | undefined;
  /** Media của bản đã lưu, để ảnh đã lưu không còn dòng "chưa lưu vào bản nháp" (BR-M03-E14) */
  savedMediaIds: ReadonlySet<string>;
};

/** Một ảnh đã tải của tuyến: ảnh nhỏ, tick quyền sử dụng, nút bỏ; phần thêm (chú thích) qua `children` */
export function RouteImageItem({
  label,
  image,
  removeLabel,
  onChange,
  onRemove,
  rightsFieldKey,
  readOnly,
  children,
}: {
  label: string;
  image: RouteImage;
  removeLabel: string;
  onChange: (image: RouteImage) => void;
  onRemove: () => void;
  rightsFieldKey: string;
  readOnly: boolean;
  children?: ReactNode;
}) {
  const name = image.fileName ?? label;
  return (
    <li className={styles.imageItem}>
      {image.file instanceof File ? <FileThumbnail file={image.file} /> : <MediaThumbnail sourceRef={image.sourceRef} />}
      <div className={styles.imageBody}>
        <p className={styles.imageName}>{name}</p>
        <Checkbox
          label={`Xác nhận quyền sử dụng — ${name}`}
          checked={image.usageRightsConfirmed}
          onChange={(usageRightsConfirmed) => onChange({ ...image, usageRightsConfirmed })}
          fieldKey={rightsFieldKey}
          disabled={readOnly}
        />
        {children}
      </div>
      {readOnly ? null : (
        <Button onClick={onRemove} aria-label={removeLabel}>
          Bỏ ảnh
        </Button>
      )}
    </li>
  );
}
