// Cây `/admin/*` của M03 (admin-ui-flow-contract §1). Mỗi màn nạp lazy.
// `errorElement` bắt lỗi tải chunk (M03 chỉ online → MSG-NETWORK-FAILED) — shell dùng data router (tech-stack §3).
import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { Navigate, Outlet, Route } from 'react-router';
import { AdminServicesProvider, type AdminServices } from './api/AdminApiProvider';
import { CurrentAdminProvider, useCurrentAdmin } from './auth/CurrentAdminContext';
import { RequireAdmin } from './auth/RequireAdmin';
import { RequireReviewer } from './auth/RequireReviewer';
import { CurrentUserInfo } from './auth/SignOutButton';
import { AdminLayout } from './layout/AdminLayout';
import { RouteErrorPage } from './layout/RouteErrorPage';

function lazyNamed<M, K extends keyof M>(load: () => Promise<M>, name: K) {
  return lazy(async () => ({ default: (await load())[name] as ComponentType }));
}

const LoginPage = lazyNamed(() => import('./auth/LoginPage'), 'LoginPage');
const InvitationPage = lazyNamed(() => import('./auth/InvitationPage'), 'InvitationPage');
const RecoveryPage = lazyNamed(() => import('./auth/RecoveryPage'), 'RecoveryPage');
const AccountsPage = lazyNamed(() => import('./accounts/AccountsPage'), 'AccountsPage');
const RouteListPage = lazyNamed(() => import('./route-admin/RouteListPage'), 'RouteListPage');
const RouteEditorPage = lazyNamed(() => import('./route-admin/RouteEditorPage'), 'RouteEditorPage');
const CheckpointListPage = lazyNamed(() => import('./checkpoint-library/CheckpointListPage'), 'CheckpointListPage');
const CheckpointEditorPage = lazyNamed(() => import('./checkpoint-library/CheckpointEditorPage'), 'CheckpointEditorPage');
const VisitPointEditorPage = lazyNamed(() => import('./visit-points/VisitPointEditorPage'), 'VisitPointEditorPage');
const ReportsPage = lazyNamed(() => import('./reports/ReportsPage'), 'ReportsPage');
const AuditLogPage = lazyNamed(() => import('./history/AuditLogPage'), 'AuditLogPage');
const PublicationReviewPage = lazyNamed(
  () => import('./publication-review/PublicationReviewPage'),
  'PublicationReviewPage',
);

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

function AdminRoot({ services }: { services: AdminServices | undefined }) {
  return (
    <AdminServicesProvider {...(services ? { services } : {})}>
      <CurrentAdminProvider>
        <Outlet />
      </CurrentAdminProvider>
    </AdminServicesProvider>
  );
}

/** Layout của mọi màn đã đăng nhập: header có email, vai trò và "Đăng xuất" (auth-account §2.6) */
function AdminShell() {
  const { state } = useCurrentAdmin();
  if (state.status !== 'signedIn') return null;
  return <AdminLayout role={state.admin.role} userSlot={<CurrentUserInfo admin={state.admin} />} />;
}

/** Route của M03; test truyền `services` giả, ứng dụng để provider tự chọn theo MODE */
export function createM03Routes(services?: AdminServices) {
  return (
    <Route path="/admin" element={<AdminRoot services={services} />} errorElement={<RouteErrorPage />}>
      <Route index element={<Navigate to="routes" replace />} />
      <Route path="login" element={<Lazy><LoginPage /></Lazy>} />
      <Route path="invitation" element={<Lazy><InvitationPage /></Lazy>} />
      <Route path="recovery" element={<Lazy><RecoveryPage /></Lazy>} />
      <Route element={<RequireAdmin />}>
        <Route element={<AdminShell />}>
          <Route path="routes" element={<Lazy><RouteListPage /></Lazy>} />
          <Route path="routes/new" element={<Lazy><RouteEditorPage /></Lazy>} />
          <Route path="routes/:routeId" element={<Lazy><RouteEditorPage /></Lazy>} />
          <Route path="checkpoints" element={<Lazy><CheckpointListPage /></Lazy>} />
          <Route path="checkpoints/new" element={<Lazy><CheckpointEditorPage /></Lazy>} />
          <Route path="checkpoints/:checkpointId" element={<Lazy><CheckpointEditorPage /></Lazy>} />
          <Route path="checkpoints/:checkpointId/visit-points/new" element={<Lazy><VisitPointEditorPage /></Lazy>} />
          <Route
            path="checkpoints/:checkpointId/visit-points/:qrIdentifier"
            element={<Lazy><VisitPointEditorPage /></Lazy>}
          />
          <Route path="review/:unitType/:subjectId" element={<Lazy><PublicationReviewPage /></Lazy>} />
          <Route path="reports" element={<Lazy><ReportsPage /></Lazy>} />
          <Route element={<RequireReviewer />}>
            <Route path="accounts" element={<Lazy><AccountsPage /></Lazy>} />
            <Route path="audit" element={<Lazy><AuditLogPage /></Lazy>} />
          </Route>
        </Route>
      </Route>
    </Route>
  );
}

/** Route của M03, đăng ký trong src/app/router.tsx */
export const m03Routes = createM03Routes();
