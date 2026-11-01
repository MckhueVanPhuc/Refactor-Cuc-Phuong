// Phần dùng chung của bốn bước editor tuyến: props của bước, trường song ngữ, một ảnh đã tải.
import type { ReactNode } from 'react';
import { Button } from '../../../../shared/ui/Button';
import { Checkbox } from '../../../../shared/ui/Checkbox';
import { TextArea } from '../../../../shared/ui/TextArea';
import { TextField } from '../../../../shared/ui/TextField';
import type { AdminApi } from '../../api/AdminApi';
import layout from '../../editor/EditorLayout.module.css';
import { FileThumbnail, MediaThumbnail } from '../../media/MediaThumbnail';
import { stripLineBreaks } from '../../validation/common';
import type { Pair, RouteForm, RouteImage } from '../routeForm';
import styles from './steps.module.css';

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

const LANGUAGES = [
  { key: 'vi', name: 'tiếng Việt' },
  { key: 'en', name: 'tiếng Anh' },
] as const;

/** Hai ô vi/en của một trường; câu gợi ý (nếu có) chỉ đặt dưới nhãn ô tiếng Việt */
export function BilingualField({
  fieldKey,
  label,
  value,
  onChange,
  maxChars,
  multiline = false,
  rows,
  hint,
  errorFor,
  readOnly,
}: {
  fieldKey: string;
  label: string;
  value: Pair;
  onChange: (value: Pair) => void;
  maxChars: number;
  multiline?: boolean;
  rows?: number;
  hint?: ReactNode;
  errorFor: StepProps['errorFor'];
  readOnly: boolean;
}) {
  return (
    <div className={layout.pair}>
      {LANGUAGES.map(({ key, name }) => {
        const common = {
          label: `${label} (${name})`,
          value: value[key],
          maxChars,
          error: errorFor(`${fieldKey}.${key}`),
          fieldKey: `${fieldKey}.${key}`,
          lang: key,
          disabled: readOnly,
          ...(hint && key === 'vi' ? { hint } : {}),
        };
        return multiline ? (
          <TextArea key={key} {...common} rows={rows ?? 4} onChange={(text) => onChange({ ...value, [key]: text })} />
        ) : (
          <TextField key={key} {...common} onChange={(text) => onChange({ ...value, [key]: stripLineBreaks(text) })} />
        );
      })}
    </div>
  );
}

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
