// M02 với update coordinator của shell (tasks T092; research R-15; constitution VI): bản build mới không được áp khi
// (a) trình duyệt có phiên `DANG_DIEN_RA` — kiểm từ IndexedDB nên đúng cả khi chỉ còn tab M01 mở; (b) một tab M02 đang
// hiển thị phiên chạy hoặc đang xử lý quét/đồng bộ — giữ lock shared `cpq:busy` trong lúc đó.
import { useEffect } from 'react';
import { registerBusyCheck, registerBusyWork, unregisterBusyWork } from '../../../app/pwa/updateCoordinator';
import { hasRunningSession } from '../storage/readers';

let unregister: (() => void) | null = null;

/** Đăng ký một lần từ src/app/App.tsx; lỗi đọc IndexedDB được coordinator coi là bận. */
export function registerM02BusyCheck(): () => void {
  unregister ??= registerBusyCheck(() => hasRunningSession());
  return () => {
    unregister?.();
    unregister = null;
  };
}

/** Giữ lock shared `cpq:busy` cho việc `id` tới khi gọi hàm trả về. */
export function holdBusy(id: string): () => void {
  registerBusyWork(id);
  return () => unregisterBusyWork(id);
}

/** Giữ lock khi `active`; nhả khi hết active hoặc màn đóng. */
export function useBusyWhile(active: boolean, id: string): void {
  useEffect(() => (active ? holdBusy(id) : undefined), [active, id]);
}
