// Path của M03 (admin-ui-flow-contract §1). Id trong path là opaque; không bao giờ render id trong trang.
export const ADMIN_PATHS = {
  root: '/admin',
  login: '/admin/login',
  invitation: '/admin/invitation',
  recovery: '/admin/recovery',
  routes: '/admin/routes',
  newRoute: '/admin/routes/new',
  route: (routeId: string) => `/admin/routes/${encodeURIComponent(routeId)}`,
  checkpoints: '/admin/checkpoints',
  newCheckpoint: '/admin/checkpoints/new',
  checkpoint: (checkpointId: string) => `/admin/checkpoints/${encodeURIComponent(checkpointId)}`,
  newVisitPoint: (checkpointId: string) =>
    `/admin/checkpoints/${encodeURIComponent(checkpointId)}/visit-points/new`,
  visitPoint: (checkpointId: string, qrIdentifier: string) =>
    `/admin/checkpoints/${encodeURIComponent(checkpointId)}/visit-points/${encodeURIComponent(qrIdentifier)}`,
  review: (unitType: string, subjectId: string) =>
    `/admin/review/${encodeURIComponent(unitType)}/${encodeURIComponent(subjectId)}`,
  reports: '/admin/reports',
  accounts: '/admin/accounts',
  audit: '/admin/audit',
} as const;
