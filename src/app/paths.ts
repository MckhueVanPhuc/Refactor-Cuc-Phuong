/** Hằng path dùng chung giữa các module (plan M01 "Source Code"; research M01 R-03; 002 chốt `/trip`). */
export const PATHS = {
  catalog: '/',
  recommend: '/recommend',
  // Id trong path là opaque (constitution); không bao giờ render id trong trang
  routeDetail: (routeId: string) => `/routes/${encodeURIComponent(routeId)}`,
  offline: '/offline',
  m02SessionEntry: '/trip',
} as const;
