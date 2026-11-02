// Bốn route công khai của M01, nạp lazy theo màn (research R-03; visitor-ui-flow §1). Tên chunk theo thư mục
// (`m01-catalog`, `m01-recommendation`, `m01-route-detail`, `m01-offline-package`; vite.config.ts, DV-02).
// US1 bọc các route này bằng LanguageGate (không bọc route của M02).
import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { Route } from 'react-router';
import { VisitorLayout } from './layout/VisitorLayout';

function lazyNamed<M, K extends keyof M>(load: () => Promise<M>, name: K) {
  return lazy(async () => ({ default: (await load())[name] as ComponentType }));
}

const CatalogPage = lazyNamed(() => import('./catalog/CatalogPage'), 'CatalogPage');
const RecommendPage = lazyNamed(() => import('./recommendation/RecommendPage'), 'RecommendPage');
const RouteDetailPage = lazyNamed(() => import('./route-detail/RouteDetailPage'), 'RouteDetailPage');
const OfflinePage = lazyNamed(() => import('./offline-package/OfflinePage'), 'OfflinePage');

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

export const m01Routes = (
  <Route path="/" element={<VisitorLayout />}>
    <Route index element={<Lazy><CatalogPage /></Lazy>} />
    <Route path="recommend" element={<Lazy><RecommendPage /></Lazy>} />
    <Route path="routes/:routeId" element={<Lazy><RouteDetailPage /></Lazy>} />
    <Route path="offline" element={<Lazy><OfflinePage /></Lazy>} />
  </Route>
);
