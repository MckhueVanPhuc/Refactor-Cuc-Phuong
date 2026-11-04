// Trigger tự đóng phiên quá 24 giờ (tasks T072; BR-M02-022; research R-09): khi shell khởi động và mỗi khi trang hiện
// lại (`visibilitychange` sang `visible`). Không hẹn giờ chạy nền (constitution VII). Đăng ký một lần từ src/app/App.tsx.
import { autoEndForgottenSession } from './autoEnd';

let started = false;

export function startAutoEndTriggers(): void {
  if (started || typeof document === 'undefined') return;
  started = true;
  void autoEndForgottenSession();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void autoEndForgottenSession();
  });
}
