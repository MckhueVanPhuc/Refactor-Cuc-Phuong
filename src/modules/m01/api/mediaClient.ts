// Media của M01 (research R-06; m03-publication-consumer-contract §4). Contract chỉ mang `sourceRef` trong bucket
// private; M01 tạo signed URL bằng quyền anon (policy Storage của M03, Physical §9). URL hay signed URL không bao giờ
// được tính là đã tải: gói chỉ nhận Blob byte đọc được (constitution VI; FR-M01-008).
import { MEDIA_BUCKET } from '../../../shared/config/storage';
import { PACKAGE_IMAGE_REQUEST_TIMEOUT_SECONDS } from '../config/limits';
import { visitorSupabase } from './visitorSupabase';

/** Thời hạn signed URL, cùng giá trị xem trước của M03 (research M03 R-12; validation-report M01 DV-15). Kỹ thuật. */
const SIGNED_URL_SECONDS = 3600;

type SignedUrlItem = { path: string | null; signedUrl: string; error: string | null };

/** Phần của Supabase Storage mà adapter dùng; test dùng bản giả. */
export type StorageApi = {
  from(bucket: string): {
    createSignedUrls(paths: string[], expiresIn: number): Promise<{ data: unknown; error: unknown }>;
  };
};

export type MediaClient = ReturnType<typeof createMediaClient>;

export function createMediaClient({
  storage,
  fetch: fetchImpl = (...args) => fetch(...args),
  imageTimeoutSeconds = PACKAGE_IMAGE_REQUEST_TIMEOUT_SECONDS,
}: {
  storage: () => StorageApi;
  fetch?: (url: string, init?: RequestInit) => Promise<Response>;
  imageTimeoutSeconds?: number;
}) {
  return {
    /** Signed URL cho các `sourceRef` (mỗi giá trị một lần); mục ký lỗi bị bỏ; lỗi cả lô → `null`. */
    async createSignedUrls(sourceRefs: readonly string[]): Promise<Map<string, string> | null> {
      const paths = [...new Set(sourceRefs)];
      if (paths.length === 0) return new Map();
      try {
        const { data, error } = await storage().from(MEDIA_BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS);
        if (error || !Array.isArray(data)) return null;
        const urls = new Map<string, string>();
        for (const item of data as SignedUrlItem[]) {
          if (!item.error && item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
        }
        return urls;
      } catch {
        return null;
      }
    },

    /** Byte ảnh cho gói: chỉ trả khi HTTP 2xx, `size > 0`, `type` là `image/*`; lỗi hay quá thời hạn → `null`. */
    async fetchImageBlob(signedUrl: string): Promise<Blob | null> {
      const controller = new AbortController();
      let timer: ReturnType<typeof setTimeout> | undefined;
      // Cả request lẫn việc đọc body đều tính vào thời hạn
      const timeout = new Promise<null>((resolve) => {
        timer = setTimeout(() => {
          controller.abort();
          resolve(null);
        }, imageTimeoutSeconds * 1000);
      });
      const download = async (): Promise<Blob | null> => {
        const response = await fetchImpl(signedUrl, { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) return null;
        const blob = await response.blob();
        return blob.size > 0 && blob.type.startsWith('image/') ? blob : null;
      };
      try {
        return await Promise.race([download().catch(() => null), timeout]);
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

export const mediaClient = createMediaClient({
  storage: () => visitorSupabase().storage as unknown as StorageApi,
});
