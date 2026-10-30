// Hàng đợi upload theo tệp (media-storage-contract §1; BR-M03-E14): mỗi tệp kiểm trước, tải riêng rồi
// đăng ký C-04; tệp lỗi không ảnh hưởng tệp khác. Media chỉ vào bản nháp khi "Lưu bản nháp" (BR-M03-F11).
import { useCallback, useMemo, useState } from 'react';
import { MAX_FILE_BYTES, SUPPORTED_FORMAT_NAMES, SUPPORTED_MIME_TYPES, type MediaType } from '../config/limits';
import type { ConnectivityMode, MediaUsage } from '../contracts/adminDtos';
import type { AdminApi } from '../api/AdminApi';
import { AdminApiError } from '../api/errors';
import { formatMessage, formatMessageFromServer } from '../messages/catalog';
import { DISPLAY_NAMES } from '../messages/displayNames';
import { formatMegabytes } from '../messages/format';

export type UploadState = 'uploading' | 'uploaded' | 'failed';

export type UploadItem = {
  key: string;
  fileName: string;
  type: MediaType | undefined;
  state: UploadState;
  /** câu lý do khi "Không tải được" */
  message?: string;
  mediaId?: string;
  sourceRef?: string;
};

export type UploadQueueOptions = {
  api: AdminApi;
  ownerType: 'ROUTE' | 'CHECKPOINT';
  ownerId: string;
  usage: MediaUsage;
  /** Ô nhận ảnh hay âm thanh/video */
  kind: 'IMAGE' | 'AV';
  /** Số tối đa của ô (cho câu MSG-COUNT-*) */
  maxCount: number;
  /** Số tệp còn được thêm */
  remaining: number;
  /** Tên tuyến hoặc điểm tham quan cho câu MSG-COUNT-* */
  ownerName: string;
  /** Chỉ cho âm thanh/video của điểm tham quan: mode đã lưu và tên điểm dừng (MSG-AV-OFFLINE) */
  checkpointMode?: ConnectivityMode;
  checkpointName?: string;
};

function mediaTypeOf(mime: string): MediaType | undefined {
  return (Object.keys(SUPPORTED_MIME_TYPES) as MediaType[]).find((type) => SUPPORTED_MIME_TYPES[type].includes(mime));
}

const allowedTypes = (kind: UploadQueueOptions['kind']): MediaType[] => (kind === 'IMAGE' ? ['IMAGE'] : ['AUDIO', 'VIDEO']);

const formatsFor = (kind: UploadQueueOptions['kind']) =>
  kind === 'IMAGE' ? SUPPORTED_FORMAT_NAMES.IMAGE : `${SUPPORTED_FORMAT_NAMES.AUDIO}, ${SUPPORTED_FORMAT_NAMES.VIDEO}`;

/** Kiểm trước ở client (bước 1). Trả câu lý do, hoặc undefined nếu tệp hợp lệ. */
function precheck(file: File, type: MediaType | undefined, options: UploadQueueOptions, slotTaken: boolean): string | undefined {
  if (options.kind === 'AV' && options.checkpointMode === 'OFFLINE_REQUIRED') {
    return formatMessage('MSG-AV-OFFLINE', { tên: options.checkpointName ?? '' });
  }
  if (!type || !allowedTypes(options.kind).includes(type)) {
    return formatMessage('MSG-FILE-TYPE', { 'tên tệp': file.name, 'danh sách định dạng': formatsFor(options.kind) });
  }
  if (file.size <= 0 || file.size > MAX_FILE_BYTES[type]) {
    return formatMessage('MSG-FILE-TOO-BIG', {
      'Loại tệp': DISPLAY_NAMES.mediaType[type],
      'tên tệp': file.name,
      số: formatMegabytes(file.size),
      'tối đa': formatMegabytes(MAX_FILE_BYTES[type]),
    });
  }
  if (slotTaken) {
    return options.kind === 'IMAGE'
      ? formatMessage('MSG-COUNT-IMAGES', { 'Tên điểm tham quan hoặc tên tuyến': options.ownerName, 'tối đa': options.maxCount })
      : formatMessage('MSG-COUNT-AV', { 'Tên điểm tham quan': options.ownerName, 'tối đa': options.maxCount });
  }
  return undefined;
}

let nextKey = 0;

export function useUploadQueue(options: UploadQueueOptions) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [batch, setBatch] = useState<{ keys: string[] } | null>(null);

  const patch = useCallback((key: string, change: Partial<UploadItem>) => {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...change } : item)));
  }, []);

  const uploadOne = useCallback(
    async (key: string, file: File, type: MediaType) => {
      try {
        const { objectPath } = await options.api.uploadMedia({
          ownerType: options.ownerType,
          ownerId: options.ownerId,
          file,
        });
        const result = await options.api.registerMedia({
          ownerType: options.ownerType,
          ownerId: options.ownerId,
          usage: options.usage,
          type,
          objectPath,
        });
        if (result.ok) {
          patch(key, { state: 'uploaded', mediaId: result.data.mediaId, sourceRef: result.data.sourceRef });
        } else {
          const values = result.reason === 'BLOCKED' ? result.values : {};
          patch(key, { state: 'failed', message: formatMessageFromServer(result.messageKey, values) });
        }
      } catch (error) {
        patch(key, { state: 'failed', message: formatMessage(AdminApiError.from(error).messageKey) });
      }
    },
    [options.api, options.ownerType, options.ownerId, options.usage, patch],
  );

  const addFiles = useCallback(
    async (files: readonly File[]) => {
      let slots = options.remaining;
      const accepted: { key: string; file: File; type: MediaType }[] = [];
      const added = files.map((file): UploadItem => {
        const key = `upload-${++nextKey}`;
        const type = mediaTypeOf(file.type);
        const reason = precheck(file, type, options, slots <= 0);
        if (reason || !type) return { key, fileName: file.name, type, state: 'failed', message: reason ?? '' };
        slots -= 1;
        accepted.push({ key, file, type });
        return { key, fileName: file.name, type, state: 'uploading' };
      });
      setItems((current) => [...current, ...added]);
      setBatch({ keys: added.map((item) => item.key) });
      await Promise.allSettled(accepted.map(({ key, file, type }) => uploadOne(key, file, type)));
    },
    [options, uploadOne],
  );

  const remove = useCallback((key: string) => {
    setItems((current) => current.filter((item) => item.key !== key));
  }, []);

  /** MSG-UPLOAD-SUMMARY sau một lần chọn nhiều hơn một tệp, khi mọi tệp đã xong */
  const summary = useMemo(() => {
    if (!batch || batch.keys.length < 2) return undefined;
    const batchItems = items.filter((item) => batch.keys.includes(item.key));
    if (batchItems.some((item) => item.state === 'uploading')) return undefined;
    const failed = batchItems.filter((item) => item.state === 'failed').map((item) => item.fileName);
    return formatMessage('MSG-UPLOAD-SUMMARY', {
      số: batchItems.length - failed.length,
      tổng: batchItems.length,
      'danh sách': failed.join(', '),
    });
  }, [batch, items]);

  return { items, addFiles, remove, summary };
}
