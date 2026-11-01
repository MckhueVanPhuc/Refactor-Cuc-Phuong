// concurrencyRevision gửi kèm đóng/mở lại/lưu trữ (BR-M03-F06): bản đang có trên màn, hoặc — khi màn là danh sách —
// bản đọc lúc **mở** hộp thoại. Người khác thao tác trên mục trong lúc hộp thoại mở thì lần gửi bị STALE và hiện
// MSG-STALE kèm "Tải lại" (BR-M03-L05; validation-report D-51), thay vì đọc lại ngay trước khi gửi rồi gặp lỗi chung.
import { useEffect, useState } from 'react';
import { useAdminApi } from '../api/AdminApiProvider';
import { AdminApiError } from '../api/errors';
import type { OperationSubject } from './OperationDialog';

export type ExpectedRevision = { entity: number };

export function useExpectedRevision(open: boolean, subject: OperationSubject) {
  const api = useAdminApi();
  const [expected, setExpected] = useState<ExpectedRevision | null>(null);
  const [error, setError] = useState<AdminApiError | null>(null);
  const { type, id, concurrencyRevision } = subject;

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (concurrencyRevision !== undefined) {
      setExpected({ entity: concurrencyRevision });
      return;
    }
    setExpected(null);
    let cancelled = false;
    const load = type === 'ROUTE' ? api.getRouteEditor(id) : api.getCheckpointEditor(id);
    load.then(
      (editor) => {
        if (!cancelled) setExpected({ entity: editor.concurrencyRevision });
      },
      (caught: unknown) => {
        if (!cancelled) setError(AdminApiError.from(caught));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [api, open, type, id, concurrencyRevision]);

  return { expected, error };
}
