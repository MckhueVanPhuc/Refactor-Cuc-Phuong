// Cây `/admin/*` của M03 (admin-ui-flow-contract §1). Mỗi màn nạp lazy; story thay trang placeholder bằng màn thật.
// `errorElement` bắt lỗi tải chunk (M03 chỉ online → MSG-NETWORK-FAILED) — shell dùng data router (tech-stack §3).
import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Outlet, Route } from 'react-router';
import { AdminApiProvider } from './api/AdminApiProvider';
import { AdminLayout } from './layout/AdminLayout';
import { RouteErrorPage } from './layout/RouteErrorPage';

const PlaceholderPage = lazy(() => import('./layout/PlaceholderPage'));

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

const placeholder = (title: string) => (
  <Lazy>
    <PlaceholderPage title={title} />
  </Lazy>
);

function AdminRoot() {
  return (
    <AdminApiProvider>
      <Outlet />
    </AdminApiProvider>
  );
}

/** Route của M03, đăng ký trong src/app/router.tsx */
export const m03Routes = (
  <Route path="/admin" element={<AdminRoot />} errorElement={<RouteErrorPage />}>
    <Route index element={<Navigate to="routes" replace />} />
    <Route path="login" element={placeholder('Đăng nhập quản trị')} />
    <Route path="invitation" element={placeholder('Nhận lời mời & Khôi phục mật khẩu')} />
    <Route path="recovery" element={placeholder('Nhận lời mời & Khôi phục mật khẩu')} />
    <Route element={<AdminLayout />}>
      <Route path="routes" element={placeholder('Quản trị tuyến')} />
      <Route path="routes/new" element={placeholder('Biên tập tuyến')} />
      <Route path="routes/:routeId" element={placeholder('Biên tập tuyến')} />
      <Route path="checkpoints" element={placeholder('Thư viện điểm dừng')} />
      <Route path="checkpoints/new" element={placeholder('Thư viện điểm dừng')} />
      <Route path="checkpoints/:checkpointId" element={placeholder('Thư viện điểm dừng')} />
      <Route path="checkpoints/:checkpointId/visit-points/new" element={placeholder('Điểm tham quan (QR) & Nội dung')} />
      <Route
        path="checkpoints/:checkpointId/visit-points/:qrIdentifier"
        element={placeholder('Điểm tham quan (QR) & Nội dung')}
      />
      <Route path="review/:unitType/:subjectId" element={placeholder('Xem lại & Xuất bản')} />
      <Route path="reports" element={placeholder('Báo cáo vận hành')} />
      <Route path="accounts" element={placeholder('Tài khoản & Vai trò')} />
      <Route path="audit" element={placeholder('Nhật ký hệ thống')} />
    </Route>
  </Route>
);
