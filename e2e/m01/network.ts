// Network mock của M01 (research R-16): `page.route()` giả Data API (`/rest/v1/published_routes`,
// `/rest/v1/active_journey_snapshots`) và Storage (`/storage/v1/object/sign/…`) bằng fixture synthetic.
// Hình dạng request/response theo supabase-js: PostgREST trả mảng (hoặc object với Accept vnd.pgrst.object);
// createSignedUrls POST trả `[{ path, signedURL, error }]` với `signedURL` tương đối so với `/storage/v1`.
import type { Page, Route } from '@playwright/test';
import {
  journeySnapshotRow,
  publicationFixture,
  publishedRouteRow,
} from '../../src/shared/contracts/__fixtures__/publication';
import type { JourneySnapshot } from '../../src/shared/contracts/journeySnapshot';
import type { PublishedRoute } from '../../src/shared/contracts/publishedRoute';

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

export type PublicationMock = {
  routes: PublishedRoute[];
  snapshots: JourneySnapshot[];
  /** Dòng thêm vào view tuyến nguyên dạng (ví dụ dòng hỏng) */
  extraRouteRows: unknown[];
  /** sourceRef → mã HTTP lỗi khi tải ảnh */
  imageFailures: Map<string, number>;
  /** Trễ mọi response Data API (ms) */
  delayMs: number;
  /** Số request Data API đã nhận */
  dataApiRequests: number;
};

export function defaultPublication(): PublicationMock {
  const fixture = publicationFixture();
  return {
    routes: Object.values(fixture.routes),
    snapshots: Object.values(fixture.snapshots),
    extraRouteRows: [fixture.brokenRoute],
    imageFailures: new Map(),
    delayMs: 0,
    dataApiRequests: 0,
  };
}

function routeIdFilter(url: URL): string | undefined {
  const value = url.searchParams.get('route_id');
  return value?.startsWith('eq.') ? decodeURIComponent(value.slice(3)) : undefined;
}

async function fulfillRows(route: Route, mock: PublicationMock, rows: unknown[]) {
  mock.dataApiRequests += 1;
  if (mock.delayMs > 0) await new Promise((resolve) => setTimeout(resolve, mock.delayMs));
  const url = new URL(route.request().url());
  const id = routeIdFilter(url);
  const matching = id === undefined ? rows : rows.filter((row) => (row as { route_id?: unknown }).route_id === id);
  const wantsObject = (route.request().headers()['accept'] ?? '').includes('vnd.pgrst.object');
  if (wantsObject && matching.length !== 1) {
    await route
      .fulfill({ status: 406, contentType: 'application/json', body: JSON.stringify({ code: 'PGRST116', message: 'no rows' }) })
      .catch(() => {});
    return;
  }
  await route
    .fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(wantsObject ? matching[0] : matching) })
    .catch(() => {});
}

/** Cài network mock; trả object có thể sửa trong test để đổi dữ liệu nguồn giữa chừng. */
export async function mockPublication(page: Page, mock: PublicationMock = defaultPublication()): Promise<PublicationMock> {
  await page.route('**/rest/v1/published_routes*', (route) =>
    fulfillRows(route, mock, [...mock.routes.map(publishedRouteRow), ...mock.extraRouteRows]),
  );
  await page.route('**/rest/v1/active_journey_snapshots*', (route) =>
    fulfillRows(route, mock, mock.snapshots.map(journeySnapshotRow)),
  );
  await page.route('**/storage/v1/object/sign/quest-media', async (route) => {
    const { paths } = route.request().postDataJSON() as { paths: string[] };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        paths.map((path) => ({ path, signedURL: `/object/sign/quest-media/${path}?token=e2e`, error: null })),
      ),
    });
  });
  await page.route('**/storage/v1/object/sign/quest-media/**', async (route) => {
    const url = new URL(route.request().url());
    const sourceRef = decodeURIComponent(url.pathname.replace(/^.*\/object\/sign\/quest-media\//, ''));
    const status = mock.imageFailures.get(sourceRef);
    if (status !== undefined) await route.fulfill({ status, body: '' });
    else await route.fulfill({ status: 200, contentType: 'image/png', body: PNG_1X1 });
  });
  return mock;
}

/** Qua panel chọn ngôn ngữ của lần mở đầu tiên. */
export async function chooseLanguage(page: Page, label: 'Tiếng Việt' | 'English' = 'Tiếng Việt'): Promise<void> {
  await page.getByRole('button', { name: label }).click();
}
