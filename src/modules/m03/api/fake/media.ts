// Media trên adapter giả (tasks T045): upload Storage, URL đọc và C-04 `register_media`
// theo media-storage-contract §1 bước 2–4 (DAC-M03-055–058).
import { MAX_FILE_BYTES, SUPPORTED_FORMAT_NAMES, SUPPORTED_MIME_TYPES } from '../../config/limits';
import type { MediaType, MediaUsage, RegisterMediaData, RegisterMediaInput } from '../../contracts/adminDtos';
import type { CommandResult } from '../../contracts/commandResult';
import type { ValidationIssue } from '../../contracts/validationIssue';
import { formatMessage, type MessageKey } from '../../messages/catalog';
import { DISPLAY_NAMES } from '../../messages/displayNames';
import { FIELD_LABELS } from '../../messages/fieldLabels';
import { formatMegabytes } from '../../messages/format';
import type { AdminApi } from '../AdminApi';
import { AdminApiError } from '../errors';
import type { FakeStore } from './store';

// Schema chưa lưu tên tệp gốc, nên phía server không điền được {tên tệp}; UI kiểm trước với tên thật (bước 1).
// [NEEDS CLARIFICATION: tên tệp trong thông báo phía server — xem validation-report.md]
const SERVER_FILE_NAME = 'tệp vừa tải lên';

/** Trường trên editor nhận media theo usage (để focus và lấy nhãn) */
function targetField(usage: MediaUsage, type: MediaType): { key: string; label: string } {
  switch (usage) {
    case 'ROUTE_THUMBNAIL':
      return { key: 'thumbnailMediaId', label: FIELD_LABELS.ROUTE.thumbnailMediaId };
    case 'ROUTE_GALLERY':
      return { key: 'galleryItems', label: FIELD_LABELS.ROUTE.galleryItems };
    case 'ROUTE_MAP':
      return { key: 'routeMapMediaId', label: FIELD_LABELS.ROUTE.routeMapMediaId };
    case 'QR_MEDIA':
      return type === 'IMAGE'
        ? { key: 'images', label: FIELD_LABELS.QRCODE.images }
        : { key: 'avFiles', label: FIELD_LABELS.QRCODE.avFiles };
  }
}

const isRouteUsage = (usage: MediaUsage) => usage !== 'QR_MEDIA';

export function createFakeMediaArea(store: FakeStore): Pick<AdminApi, 'uploadMedia' | 'getMediaUrl' | 'registerMedia'> {
  function validation(
    input: RegisterMediaInput,
    messageKey: MessageKey,
    message: string,
  ): CommandResult<RegisterMediaData> {
    const field = targetField(input.usage, input.type);
    const issue: ValidationIssue = {
      severity: 'BLOCKS_SAVE',
      fieldLabel: field.label,
      message,
      messageKey,
      targetItemType: input.ownerType,
      targetItemId: input.ownerId,
      targetFieldKey: field.key,
    };
    return { ok: false, reason: 'VALIDATION', messageKey, issues: [issue] };
  }

  const failed: CommandResult<RegisterMediaData> = { ok: false, reason: 'FAILED', messageKey: 'MSG-GENERIC' };

  return {
    async uploadMedia({ ownerType, ownerId, file }) {
      if (!store.currentAdmin()) throw new AdminApiError('MSG-SESSION-EXPIRED');
      const objectPath = `uploads/${ownerType}/${ownerId}/${store.newUuid()}`;
      // upsert: false — không bao giờ ghi đè object đã có (constitution IV)
      if (store.storage.has(objectPath)) throw new AdminApiError('MSG-GENERIC');
      store.storage.set(objectPath, { size: file.size, mimetype: file.type, blob: file });
      return { objectPath };
    },

    async getMediaUrl(sourceRef) {
      const object = store.storage.get(sourceRef);
      if (!object) throw new AdminApiError('MSG-GENERIC');
      return typeof URL.createObjectURL === 'function' ? URL.createObjectURL(object.blob) : `fake-media:${sourceRef}`;
    },

    async registerMedia(input) {
      const owners = input.ownerType === 'ROUTE' ? store.state.routes : store.state.checkpoints;
      const ownerName = owners.get(input.ownerId)?.name;
      return store.run(
        {
          action: 'MEDIA_REGISTERED',
          roles: 'B',
          subject: { type: 'MEDIA', ...(ownerName ? { name: ownerName } : {}) },
        },
        (context) => {
          if (!owners.has(input.ownerId)) return failed;
          // Usage của tuyến chỉ thuộc tuyến; QR_MEDIA chỉ thuộc điểm dừng
          if (isRouteUsage(input.usage) !== (input.ownerType === 'ROUTE')) return failed;
          // spokenLanguage chỉ có ở âm thanh/video (BR-M03-E17)
          if (input.type === 'IMAGE' && input.spokenLanguage !== undefined) return failed;

          const object = store.storage.get(input.objectPath);
          if (!object) return failed;

          const typeAllowed = !isRouteUsage(input.usage) || input.type === 'IMAGE';
          if (!typeAllowed || !SUPPORTED_MIME_TYPES[input.type].includes(object.mimetype)) {
            const formats = isRouteUsage(input.usage) ? SUPPORTED_FORMAT_NAMES.IMAGE : SUPPORTED_FORMAT_NAMES[input.type];
            return validation(
              input,
              'MSG-FILE-TYPE',
              formatMessage('MSG-FILE-TYPE', { 'tên tệp': SERVER_FILE_NAME, 'danh sách định dạng': formats }),
            );
          }

          const maxBytes = MAX_FILE_BYTES[input.type];
          if (object.size <= 0 || object.size > maxBytes) {
            return validation(
              input,
              'MSG-FILE-TOO-BIG',
              formatMessage('MSG-FILE-TOO-BIG', {
                'Loại tệp': DISPLAY_NAMES.mediaType[input.type],
                'tên tệp': SERVER_FILE_NAME,
                số: formatMegabytes(object.size),
                'tối đa': formatMegabytes(maxBytes),
              }),
            );
          }

          const mediaId = store.newUuid();
          store.state.media.set(mediaId, {
            mediaId,
            ownerType: input.ownerType,
            ownerId: input.ownerId,
            usage: input.usage,
            type: input.type,
            sourceRef: input.objectPath,
            mimeType: object.mimetype,
            fileSizeBytes: object.size,
            ...(input.spokenLanguage ? { spokenLanguage: input.spokenLanguage } : {}),
            usageRightsConfirmed: false,
          });
          context.subjectId = mediaId;
          return { ok: true, messageKey: 'MSG-UPLOADED-NOT-SAVED', data: { mediaId, sourceRef: input.objectPath } };
        },
      );
    },
  };
}
