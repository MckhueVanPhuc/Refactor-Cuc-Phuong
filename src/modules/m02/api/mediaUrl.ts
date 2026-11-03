// Signed URL cho ảnh và audio/video của nội dung live (tasks T022; research R-12; Physical §9): contract chỉ mang
// `sourceRef` trong bucket private, M02 ký bằng quyền `anon`. Không cache URL; Workbox không cache response media.
import { MEDIA_BUCKET } from '../../../shared/config/storage';
import { visitorSupabase } from './visitorSupabase';

/** Thời hạn signed URL, cùng giá trị với M01 và xem trước của M03 (research M03 R-12). Kỹ thuật. */
const SIGNED_URL_SECONDS = 3600;

type SignedUrlItem = { path: string | null; signedUrl: string; error: string | null };

/** Phần của Supabase Storage mà adapter dùng; test dùng bản giả. */
export type StorageApi = {
  from(bucket: string): {
    createSignedUrls(paths: string[], expiresIn: number): Promise<{ data: unknown; error: unknown }>;
  };
};

export type MediaUrlClient = { signedUrls(sourceRefs: readonly string[]): Promise<Map<string, string>> };

export function createMediaUrlClient({ storage }: { storage: () => StorageApi }): MediaUrlClient {
  return {
    /** Signed URL cho các `sourceRef`; mục ký lỗi hoặc cả lô lỗi → không có trong Map (UI hiện placeholder/lỗi tệp). */
    async signedUrls(sourceRefs) {
      const paths = [...new Set(sourceRefs)];
      const urls = new Map<string, string>();
      if (paths.length === 0) return urls;
      try {
        const { data, error } = await storage().from(MEDIA_BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS);
        if (error || !Array.isArray(data)) return urls;
        for (const item of data as SignedUrlItem[]) {
          if (!item.error && item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
        }
      } catch {
        // Lỗi mạng: trả Map rỗng
      }
      return urls;
    },
  };
}

export const mediaUrlClient: MediaUrlClient = createMediaUrlClient({ storage: () => visitorSupabase().storage });
