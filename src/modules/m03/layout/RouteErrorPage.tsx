import { useRouteError } from 'react-router';
import { Banner } from '../../../shared/ui/Banner';
import { formatMessage } from '../messages/catalog';

// Thông điệp lỗi import() động của Chromium, Safari và Firefox
const CHUNK_ERROR = /dynamically imported module|Importing a module script failed|Failed to fetch/i;

export function isChunkLoadError(error: unknown): boolean {
  return error instanceof Error && CHUNK_ERROR.test(error.message);
}

/**
 * `errorElement` của cây `/admin/*` (T046): màn không tải được vì mất mạng → MSG-NETWORK-FAILED
 * (M03 chỉ chạy online); lỗi khác → MSG-GENERIC. Chi tiết kỹ thuật chỉ vào console (BR-M03-L10).
 */
export function RouteErrorPage() {
  const error = useRouteError();
  console.error('[m03/routes]', error);
  return (
    <main>
      <Banner tone="error">{formatMessage(isChunkLoadError(error) ? 'MSG-NETWORK-FAILED' : 'MSG-GENERIC')}</Banner>
    </main>
  );
}
