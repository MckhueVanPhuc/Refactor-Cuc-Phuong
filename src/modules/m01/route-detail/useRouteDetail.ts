// Nguồn dữ liệu của SCR-M01-003 (research R-05, R-13; visitor-ui-flow §2). Đọc dòng tuyến (R2) và gói active song
// song. Nguồn khả dụng → dữ liệu mới; nguồn lỗi → chữ cốt lõi đã lưu trong gói (offline); không có gói → local view
// danh mục trong bộ nhớ (không khẳng định mới nhất); không có gì → nguồn không khả dụng.
import { useEffect, useState } from 'react';
import type { OfflinePackage } from '../../../shared/contracts/offlinePackage';
import type { PublishedRoute } from '../../../shared/contracts/publishedRoute';
import type { SourceClient } from '../api/sourceClient';
import { catalogStoreFor } from '../catalog/catalogStore';
import { readActiveOfflinePackage } from '../storage/readers';

export type RouteDetailData =
  | { status: 'loading' }
  /** Đọc nguồn thành công, tuyến `HOAT_DONG` */
  | { status: 'online'; route: PublishedRoute; pkg: OfflinePackage | null }
  /** Nguồn lỗi, có gói sẵn sàng: chữ cốt lõi đã lưu */
  | { status: 'saved'; pkg: OfflinePackage }
  /** Nguồn lỗi, không có gói, có dòng tuyến trong local view danh mục */
  | { status: 'localView'; route: PublishedRoute }
  /** Đọc nguồn thành công nhưng tuyến không còn `HOAT_DONG` hoặc không còn dòng (BR-M01-011) */
  | { status: 'routeUnavailable'; route: PublishedRoute | null; pkg: OfflinePackage | null }
  | { status: 'sourceUnavailable' };

function fromLocalView(source: Pick<SourceClient, 'fetchCatalog'>, routeId: string): PublishedRoute | undefined {
  const catalog = catalogStoreFor(source).getSnapshot();
  if (catalog.status !== 'ready') return undefined;
  return catalog.routes.find((route) => route.routeId === routeId && route.status === 'HOAT_DONG');
}

export async function loadRouteDetail(source: SourceClient, routeId: string): Promise<RouteDetailData> {
  const [result, pkg] = await Promise.all([
    source.fetchRoute(routeId),
    readActiveOfflinePackage(routeId).catch(() => null),
  ]);
  if (result.kind === 'OK') {
    const route = result.value;
    if (route?.status === 'HOAT_DONG') return { status: 'online', route, pkg };
    return { status: 'routeUnavailable', route, pkg };
  }
  if (pkg) return { status: 'saved', pkg };
  const local = fromLocalView(source, routeId);
  return local ? { status: 'localView', route: local } : { status: 'sourceUnavailable' };
}

export function useRouteDetail(source: SourceClient, routeId: string): RouteDetailData {
  const [data, setData] = useState<{ routeId: string; value: RouteDetailData } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadRouteDetail(source, routeId).then((value) => {
      if (!cancelled) setData({ routeId, value });
    });
    return () => {
      cancelled = true;
    };
  }, [source, routeId]);

  return data?.routeId === routeId ? data.value : { status: 'loading' };
}
