// Tự đóng phiên quá 24 giờ (tasks T072; BR-M02-022; research R-09) và thông báo §5.1 tương ứng, hiện MỘT lần trên màn
// M02 đang mở (hoặc màn M02 mở kế tiếp). Phần transaction ở storage/terminalTransition.ts (autoEndIfExpired).
import { useEffect, useState } from 'react';
import { autoEndIfExpired } from '../storage/terminalTransition';
import type { TerminalStatus } from '../sync/buildSyncRecord';
import { requestSync } from '../sync/startSync';

let pendingNotice: TerminalStatus | null = null;
const listeners = new Set<() => void>();

/** Chạy lặp vô hại; trả trạng thái nếu vừa đóng một phiên. */
export async function autoEndForgottenSession(now: Date = new Date()): Promise<TerminalStatus | null> {
  const status = await autoEndIfExpired(now);
  if (status) {
    requestSync();
    pendingNotice = status;
    listeners.forEach((listener) => listener());
  }
  return status;
}

/** Lấy thông báo chưa hiện (rồi xóa), để nó chỉ hiện một lần. */
function takeAutoEndNotice(): TerminalStatus | null {
  const notice = pendingNotice;
  pendingNotice = null;
  return notice;
}

/** Thông báo "chuyến trước đã tự kết thúc" cho màn đang mở; giữ tới khi màn đóng. */
export function useAutoEndNotice(): TerminalStatus | null {
  const [notice, setNotice] = useState<TerminalStatus | null>(null);
  useEffect(() => {
    const take = () => {
      const next = takeAutoEndNotice();
      if (next) setNotice(next);
    };
    take();
    listeners.add(take);
    return () => {
      listeners.delete(take);
    };
  }, []);
  return notice;
}

/** Chỉ cho test: xóa thông báo còn treo giữa các ca. */
export function resetAutoEndNoticeForTest(): void {
  pendingNotice = null;
}
