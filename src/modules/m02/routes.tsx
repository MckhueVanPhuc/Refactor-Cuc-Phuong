// Bốn route của M02, nạp lazy theo màn (tasks T024; field-ui-flow-contract §1). Tên chunk theo thư mục
// (`m02-trip`, `m02-content`, `m02-end`, `m02-qr-link`; vite.config.ts). Không route nào đi qua LanguageGate của M01:
// trang mở từ camera điện thoại phải hiện nội dung ngay theo ngôn ngữ thiết bị (BR-M02-024).
import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { Route } from 'react-router';
import { PATHS } from '../../app/paths';

function lazyNamed<M, K extends keyof M>(load: () => Promise<M>, name: K) {
  return lazy(async () => ({ default: (await load())[name] as ComponentType }));
}

const TripPage = lazyNamed(() => import('./session/TripPage'), 'TripPage');
const ContentPage = lazyNamed(() => import('./content/ContentPage'), 'ContentPage');
const EndPage = lazyNamed(() => import('./end/EndPage'), 'EndPage');
const QrLinkPage = lazyNamed(() => import('./qr-link/QrLinkPage'), 'QrLinkPage');

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

export const m02Routes = (
  <>
    <Route path={PATHS.m02SessionEntry}>
      <Route index element={<Lazy><TripPage /></Lazy>} />
      <Route path="qr/:qrIdentifier" element={<Lazy><ContentPage /></Lazy>} />
      <Route path="end" element={<Lazy><EndPage /></Lazy>} />
    </Route>
    <Route path="/q/:qrIdentifier" element={<Lazy><QrLinkPage /></Lazy>} />
  </>
);
