// Chặn rời editor khi còn thay đổi chưa lưu (research R-20, R-22; BR-M03-F11, L12):
// `useBlocker` cho điều hướng trong app (cần data router), `beforeunload` cho đóng/tải lại tab,
// và đăng ký với update coordinator để service worker mới không kích hoạt giữa chừng.
import { useCallback, useEffect } from 'react';
import { useBlocker } from 'react-router';
import { registerUnsavedForm, unregisterUnsavedForm } from '../../../app/pwa/updateCoordinator';
import { Dialog } from '../../../shared/ui/Dialog';
import { formatMessage } from '../messages/catalog';

// Bỏ qua lần chặn kế tiếp khi state đã được cất ở nơi khác (phiên hết hạn, auth-account §2.7)
let bypassNextBlock = false;

export function allowNextNavigation(): void {
  bypassNextBlock = true;
  setTimeout(() => {
    bypassNextBlock = false;
  }, 0);
}

export type UnsavedChangesGuard = {
  /** Đang chặn một lần điều hướng, chờ người dùng chọn */
  blocked: boolean;
  stay: () => void;
  leave: () => void;
};

export function useUnsavedChangesGuard(formId: string, isDirty: boolean): UnsavedChangesGuard {
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }: { currentLocation: { pathname: string }; nextLocation: { pathname: string } }) =>
        !bypassNextBlock && isDirty && currentLocation.pathname !== nextLocation.pathname,
      [isDirty],
    ),
  );

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Trình duyệt cũ cần returnValue để hiện hộp xác nhận của chính nó
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) return;
    registerUnsavedForm(formId);
    return () => unregisterUnsavedForm(formId);
  }, [formId, isDirty]);

  return {
    blocked: blocker.state === 'blocked',
    stay: () => blocker.reset?.(),
    leave: () => blocker.proceed?.(),
  };
}

/** Hộp thoại MSG-UNSAVED-CHANGES: một câu và hai nút (BR-M03-L12); Esc = ở lại. */
export function UnsavedChangesDialog({ guard }: { guard: UnsavedChangesGuard }) {
  return (
    <Dialog
      open={guard.blocked}
      title={formatMessage('MSG-UNSAVED-CHANGES')}
      safeLabel="Ở lại"
      confirmLabel="Rời đi"
      onSafe={guard.stay}
      onConfirm={guard.leave}
    />
  );
}
