// Bước 1 "Thẻ tuyến" (tasks T109): ảnh đại diện, tên, mô tả ngắn, quãng đường, thời lượng, độ khó.
import { Select } from '../../../../shared/ui/Select';
import { TextField } from '../../../../shared/ui/TextField';
import { NAME_MAX_CHARS, ROUTE_SHORT_DESC_MAX_CHARS } from '../../config/limits';
import type { Difficulty } from '../../contracts/adminDtos';
import { MediaUploader } from '../../media/MediaUploader';
import { DISPLAY_NAMES } from '../../messages/displayNames';
import { FIELD_LABELS } from '../../messages/fieldLabels';
import { PendingImagePicker } from './PendingImagePicker';
import { BilingualField, RouteImageItem, type StepProps, type UploadProps } from './shared';
import styles from './steps.module.css';

const DIFFICULTY_OPTIONS = (Object.entries(DISPLAY_NAMES.difficulty) as [Difficulty, string][]).map(([value, label]) => ({ value, label }));

export function CardStep({ form, update, errorFor, readOnly, api, routeId }: StepProps & UploadProps) {
  const labels = FIELD_LABELS.ROUTE;
  return (
    <>
      <div className={styles.group} data-field-key="thumbnailMediaId" tabIndex={-1}>
        {routeId && !readOnly ? (
          <MediaUploader
            api={api}
            label={labels.thumbnailMediaId}
            ownerType="ROUTE"
            ownerId={routeId}
            usage="ROUTE_THUMBNAIL"
            kind="IMAGE"
            maxCount={1}
            remaining={form.thumbnail ? 0 : 1}
            ownerName={form.name.vi.trim()}
            onUploaded={(item) => {
              if (!item.mediaId || !item.sourceRef) return;
              const image = { mediaId: item.mediaId, sourceRef: item.sourceRef, usageRightsConfirmed: false, fileName: item.fileName };
              update((current) => ({ ...current, thumbnail: image }));
            }}
          />
        ) : !readOnly ? (
          <PendingImagePicker
            label={labels.thumbnailMediaId}
            multiple={false}
            maxCount={1}
            remaining={form.thumbnail ? 0 : 1}
            ownerName={form.name.vi.trim()}
            onPicked={([image]) => image && update((current) => ({ ...current, thumbnail: image }))}
          />
        ) : (
          <p className={styles.groupLabel}>{labels.thumbnailMediaId}</p>
        )}
        {form.thumbnail ? (
          <ul className={styles.imageList}>
            <RouteImageItem
              label={labels.thumbnailMediaId}
              image={form.thumbnail}
              removeLabel="Bỏ ảnh đại diện"
              rightsFieldKey="thumbnailMediaId"
              readOnly={readOnly}
              onChange={(thumbnail) => update((current) => ({ ...current, thumbnail }))}
              onRemove={() => update((current) => ({ ...current, thumbnail: null }))}
            />
          </ul>
        ) : null}
      </div>

      <BilingualField
        fieldKey="name"
        label={labels.name}
        value={form.name}
        onChange={(name) => update((current) => ({ ...current, name }))}
        maxChars={NAME_MAX_CHARS}
        errorFor={errorFor}
        readOnly={readOnly}
      />
      <BilingualField
        fieldKey="shortDescription"
        label={labels.shortDescription}
        value={form.shortDescription}
        onChange={(shortDescription) => update((current) => ({ ...current, shortDescription }))}
        maxChars={ROUTE_SHORT_DESC_MAX_CHARS}
        errorFor={errorFor}
        readOnly={readOnly}
      />

      <div className={styles.numbers}>
        <TextField
          label={labels.distanceKm}
          type="number"
          value={form.distanceKm}
          onChange={(distanceKm) => update((current) => ({ ...current, distanceKm }))}
          error={errorFor('distanceKm')}
          fieldKey="distanceKm"
          disabled={readOnly}
        />
        <TextField
          label={labels.durationMin}
          type="number"
          value={form.durationMin}
          onChange={(durationMin) => update((current) => ({ ...current, durationMin }))}
          error={errorFor('durationMin')}
          fieldKey="durationMin"
          disabled={readOnly}
        />
        <Select
          label={labels.difficulty}
          value={form.difficulty}
          options={DIFFICULTY_OPTIONS}
          emptyLabel="Chưa chọn"
          onChange={(difficulty) => update((current) => ({ ...current, difficulty }))}
          error={errorFor('difficulty')}
          fieldKey="difficulty"
          disabled={readOnly}
        />
      </div>
    </>
  );
}
