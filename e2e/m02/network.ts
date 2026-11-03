// Giả lập RPC `api.lookup_qr` và Storage của M03 cho E2E M02 (research R-19) bằng fixture quickstart §4.
import type { Page } from '@playwright/test';
import { LIVE_CONTENT } from '../../src/modules/m02/api/fake/fixtures';

type LookupBody = { outcome: 'VALID' | 'TEMPORARILY_CLOSED' | 'INVALID'; [key: string]: unknown };

export type LookupRequest = { p_qr_identifier: string; p_route_id?: string };

type Delay = { delayMs: number };
type LookupOverride = LookupBody | 'ERROR' | Delay;

const isDelay = (value: LookupOverride | undefined): value is Delay =>
  typeof value === 'object' && typeof (value as Partial<Delay>).delayMs === 'number';

/**
 * Mọi request lookup được ghi vào mảng trả về. `overrides[mã]`: `'ERROR'` → HTTP 500; `{ delayMs }` → trả nội dung
 * fixture sau khoảng trễ (quá LOOKUP_TIMEOUT_SECONDS thì app đã coi là lỗi nguồn).
 */
export async function mockLookup(page: Page, overrides: Record<string, LookupOverride> = {}): Promise<LookupRequest[]> {
  const requests: LookupRequest[] = [];
  await page.route('**/rest/v1/rpc/lookup_qr', async (route) => {
    const body = route.request().postDataJSON() as LookupRequest;
    requests.push(body);
    const override = overrides[body.p_qr_identifier];
    if (override === 'ERROR') return route.fulfill({ status: 500, json: { message: 'boom' } });
    if (isDelay(override)) await new Promise((resolve) => setTimeout(resolve, override.delayMs));
    const content = LIVE_CONTENT[body.p_qr_identifier];
    const result: LookupBody =
      override && !isDelay(override) ? override : content ? { outcome: 'VALID', content } : { outcome: 'INVALID' };
    return route.fulfill({ status: 200, json: result }).catch(() => {});
  });
  return requests;
}

// PNG 1×1 hợp lệ cho ảnh đã ký
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

/**
 * Storage của M03: `createSignedUrls` (POST `/storage/v1/object/sign/quest-media`) trả `signedURL` tương đối so với
 * `/storage/v1`; tải theo signed URL trả PNG cho ảnh, byte rỗng cho audio/video (chỉ phát khi bấm).
 */
export async function mockStorage(page: Page): Promise<void> {
  await page.route('**/storage/v1/object/sign/quest-media', async (route) => {
    const { paths } = route.request().postDataJSON() as { paths: string[] };
    await route.fulfill({
      status: 200,
      json: paths.map((path) => ({ path, signedURL: `/object/sign/quest-media/${path}?token=e2e`, error: null })),
    });
  });
  await page.route('**/storage/v1/object/sign/quest-media/**', async (route) => {
    const isImage = /\.png(\?|$)/.test(route.request().url());
    await route.fulfill(isImage ? { status: 200, contentType: 'image/png', body: PNG_1X1 } : { status: 200, body: '' }).catch(() => {});
  });
}
