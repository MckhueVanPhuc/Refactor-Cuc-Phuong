// Bước 2 "Chi tiết" (tasks T110): mô tả, điểm xuất phát, yêu cầu tham gia, chuẩn bị, thời điểm phù hợp,
// cảnh báo an toàn (câu gợi ý §5.5; BR-M03-C07, C08), ảnh chi tiết 0–8, sơ đồ 0–1 + tick offline, điểm nổi bật 0–5.
import { useState } from 'react';
import { Button } from '../../../../shared/ui/Button';
import { Checkbox } from '../../../../shared/ui/Checkbox';
import {
  CAPTION_MAX_CHARS,
  ROUTE_BEST_TIME_MAX_CHARS,
  ROUTE_DESC_MAX_CHARS,
  ROUTE_GALLERY_MAX_IMAGES,
  ROUTE_HIGHLIGHT_MAX_CHARS,
  ROUTE_HIGHLIGHTS_MAX_ITEMS,
  ROUTE_PARTICIPATION_MAX_CHARS,
  ROUTE_PREPARATION_MAX_CHARS,
  ROUTE_SAFETY_WARNING_MAX_CHARS,
  ROUTE_START_MAX_CHARS,
} from '../../config/limits';
import { MediaUploader } from '../../media/MediaUploader';
import type { UploadItem } from '../../media/useUploadQueue';
import { formatMessage } from '../../messages/catalog';
import { FIELD_LABELS } from '../../messages/fieldLabels';
import { HINTS } from '../../messages/hints';
import type { RouteImage } from '../routeForm';
import { PendingImagePicker } from './PendingImagePicker';
import { BilingualField, RouteImageItem, type StepProps, type UploadProps } from './shared';
import styles from './steps.module.css';

const EMPTY_PAIR = { vi: '', en: '' };

const imageOf = (item: UploadItem): RouteImage | null =>
  item.mediaId && item.sourceRef
    ? { mediaId: item.mediaId, sourceRef: item.sourceRef, usageRightsConfirmed: false, fileName: item.fileName }
    : null;

export function DetailsStep({ form, update, errorFor, readOnly, api, routeId, savedMediaIds }: StepProps & UploadProps) {
  const labels = FIELD_LABELS.ROUTE;
  const [mapTickCleared, setMapTickCleared] = useState(false);
  const text = (
    key: 'description' | 'startingPoint' | 'participationRequirements' | 'preparation' | 'bestTime' | 'safetyWarning',
    max: number,
    hint?: string,
  ) => (
    <BilingualField
      fieldKey={key}
      label={labels[key]}
      value={form[key]}
      onChange={(value) => update((current) => ({ ...current, [key]: value }))}
      maxChars={max}
      multiline
      {...(hint ? { hint } : {})}
      errorFor={errorFor}
      readOnly={readOnly}
    />
  );

  function removeMap() {
    // Không còn sơ đồ thì tick sơ đồ offline tự bỏ và báo cho tác giả (BR-M03-C16)
    if (form.offlineRouteMapRequired) setMapTickCleared(true);
    update((current) => ({ ...current, routeMap: null, offlineRouteMapRequired: false }));
  }

  return (
    <>
      {text('description', ROUTE_DESC_MAX_CHARS)}
      {text('startingPoint', ROUTE_START_MAX_CHARS)}
      {text('participationRequirements', ROUTE_PARTICIPATION_MAX_CHARS, HINTS.participationRequirements)}
      {text('preparation', ROUTE_PREPARATION_MAX_CHARS, HINTS.preparation)}
      {text('bestTime', ROUTE_BEST_TIME_MAX_CHARS, HINTS.bestTime)}
      {text('safetyWarning', ROUTE_SAFETY_WARNING_MAX_CHARS, HINTS.safetyWarning)}

      <div className={styles.group} data-field-key="galleryItems" tabIndex={-1}>
        {routeId && !readOnly ? (
          <MediaUploader
            api={api}
            label={labels.galleryItems}
            ownerType="ROUTE"
            ownerId={routeId}
            usage="ROUTE_GALLERY"
            kind="IMAGE"
            maxCount={ROUTE_GALLERY_MAX_IMAGES}
            remaining={ROUTE_GALLERY_MAX_IMAGES - form.gallery.length}
            ownerName={form.name.vi.trim()}
            savedMediaIds={savedMediaIds}
            onUploaded={(item) => {
              const image = imageOf(item);
              if (image) update((current) => ({ ...current, gallery: [...current.gallery, { image, caption: EMPTY_PAIR }] }));
            }}
          />
        ) : !readOnly ? (
          <PendingImagePicker
            label={labels.galleryItems}
            multiple
            maxCount={ROUTE_GALLERY_MAX_IMAGES}
            remaining={ROUTE_GALLERY_MAX_IMAGES - form.gallery.length}
            ownerName={form.name.vi.trim()}
            onPicked={(images) =>
              update((current) => ({ ...current, gallery: [...current.gallery, ...images.map((image) => ({ image, caption: EMPTY_PAIR }))] }))
            }
          />
        ) : (
          <p className={styles.groupLabel}>{labels.galleryItems}</p>
        )}
        {errorFor('galleryItems') ? <p className={styles.error}>Lỗi: {errorFor('galleryItems')}</p> : null}
        {form.gallery.length > 0 ? (
          <ul className={styles.imageList}>
            {form.gallery.map((item, index) => (
              <RouteImageItem
                key={item.image.mediaId}
                label={`${labels.galleryItems} ${index + 1}`}
                image={item.image}
                removeLabel={`Bỏ ảnh chi tiết ${index + 1}`}
                rightsFieldKey={`galleryItems.${index}`}
                readOnly={readOnly}
                onChange={(image) =>
                  update((current) => ({ ...current, gallery: current.gallery.map((other, i) => (i === index ? { ...other, image } : other)) }))
                }
                onRemove={() => update((current) => ({ ...current, gallery: current.gallery.filter((_, i) => i !== index) }))}
              >
                <BilingualField
                  fieldKey={`galleryCaption.${index}`}
                  label={`${labels.galleryCaption} ${index + 1}`}
                  value={item.caption}
                  onChange={(caption) =>
                    update((current) => ({
                      ...current,
                      gallery: current.gallery.map((other, i) => (i === index ? { ...other, caption } : other)),
                    }))
                  }
                  maxChars={CAPTION_MAX_CHARS}
                  errorFor={errorFor}
                  readOnly={readOnly}
                />
              </RouteImageItem>
            ))}
          </ul>
        ) : null}
      </div>

      <div className={styles.group} data-field-key="routeMapMediaId" tabIndex={-1}>
        {routeId && !readOnly ? (
          <MediaUploader
            api={api}
            label={labels.routeMapMediaId}
            ownerType="ROUTE"
            ownerId={routeId}
            usage="ROUTE_MAP"
            kind="IMAGE"
            maxCount={1}
            remaining={form.routeMap ? 0 : 1}
            ownerName={form.name.vi.trim()}
            savedMediaIds={savedMediaIds}
            onUploaded={(item) => {
              const image = imageOf(item);
              if (image) {
                setMapTickCleared(false);
                update((current) => ({ ...current, routeMap: image }));
              }
            }}
          />
        ) : !readOnly ? (
          <PendingImagePicker
            label={labels.routeMapMediaId}
            multiple={false}
            maxCount={1}
            remaining={form.routeMap ? 0 : 1}
            ownerName={form.name.vi.trim()}
            onPicked={([image]) => {
              if (!image) return;
              setMapTickCleared(false);
              update((current) => ({ ...current, routeMap: image }));
            }}
          />
        ) : (
          <p className={styles.groupLabel}>{labels.routeMapMediaId}</p>
        )}
        {form.routeMap ? (
          <ul className={styles.imageList}>
            <RouteImageItem
              label={labels.routeMapMediaId}
              image={form.routeMap}
              removeLabel="Bỏ ảnh sơ đồ tuyến"
              rightsFieldKey="routeMapMediaId"
              readOnly={readOnly}
              onChange={(routeMap) => update((current) => ({ ...current, routeMap }))}
              onRemove={removeMap}
            >
              <BilingualField
                fieldKey="routeMapCaption"
                label={labels.routeMapCaption}
                value={form.routeMapCaption}
                onChange={(routeMapCaption) => update((current) => ({ ...current, routeMapCaption }))}
                maxChars={CAPTION_MAX_CHARS}
                errorFor={errorFor}
                readOnly={readOnly}
              />
              <Checkbox
                label={labels.offlineRouteMapRequired}
                checked={form.offlineRouteMapRequired}
                onChange={(offlineRouteMapRequired) => update((current) => ({ ...current, offlineRouteMapRequired }))}
                fieldKey="offlineRouteMapRequired"
                disabled={readOnly}
              />
            </RouteImageItem>
          </ul>
        ) : null}
        {mapTickCleared ? (
          <p className={styles.derived} role="status">
            {formatMessage('MSG-MAP-TICK-CLEARED')}
          </p>
        ) : null}
      </div>

      <div className={styles.group} data-field-key="highlights" tabIndex={-1}>
        <p className={styles.groupLabel}>{labels.highlights}</p>
        {form.highlights.length > 0 ? (
          <ul className={styles.itemList}>
            {form.highlights.map((item, index) => (
              <li key={index} className={styles.highlight}>
                <div className={styles.highlightHead}>
                  <span className={styles.groupLabel}>
                    {labels.highlights} {index + 1}
                  </span>
                  {readOnly ? null : (
                    <Button
                      onClick={() => update((current) => ({ ...current, highlights: current.highlights.filter((_, i) => i !== index) }))}
                      aria-label={`Bỏ điểm nổi bật ${index + 1}`}
                    >
                      Bỏ
                    </Button>
                  )}
                </div>
                <BilingualField
                  fieldKey={`highlights.${index}`}
                  label={`${labels.highlights} ${index + 1}`}
                  value={item}
                  onChange={(value) =>
                    update((current) => ({ ...current, highlights: current.highlights.map((other, i) => (i === index ? value : other)) }))
                  }
                  maxChars={ROUTE_HIGHLIGHT_MAX_CHARS}
                  errorFor={errorFor}
                  readOnly={readOnly}
                />
              </li>
            ))}
          </ul>
        ) : null}
        {readOnly ? null : (
          <div>
            <Button
              disabled={form.highlights.length >= ROUTE_HIGHLIGHTS_MAX_ITEMS}
              onClick={() => update((current) => ({ ...current, highlights: [...current.highlights, EMPTY_PAIR] }))}
            >
              Thêm điểm nổi bật
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
