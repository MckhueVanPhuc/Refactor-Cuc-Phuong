// Bốn route công khai của M01, nạp lazy theo màn (research R-03; visitor-ui-flow §1). Tên chunk theo thư mục
// (`m01-catalog`, `m01-recommendation`, `m01-route-detail`, `m01-offline-package`; vite.config.ts, DV-02).
// Bốn route qua LanguageGate (US-M01-01 mục 1); route của M02 không qua gate (BR-M02-024).
import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { Route } from 'react-router';
import { registerM01SourceEffects } from './api/sourceEffects';
import { LanguageGate } from './language/LanguageGate';
import { VisitorLayout } from './layout/VisitorLayout';

// Thu hồi context, OUTDATED, làm mới chữ cốt lõi sau mỗi lần đọc nguồn thành công (research R-10, R-11)
registerM01SourceEffects();

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
  <Route
    path="/"
    element={
      <LanguageGate>
        <VisitorLayout />
      </LanguageGate>
    }
  >
    <Route index element={<Lazy><CatalogPage /></Lazy>} />
    <Route path="recommend" element={<Lazy><RecommendPage /></Lazy>} />
    <Route path="routes/:routeId" element={<Lazy><RouteDetailPage /></Lazy>} />
    <Route path="offline" element={<Lazy><OfflinePage /></Lazy>} />
  </Route>
);
