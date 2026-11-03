// Giả lập RPC `api.lookup_qr` của M03 cho E2E M02 (research R-19) bằng fixture quickstart §4.
import type { Page } from '@playwright/test';
import { LIVE_CONTENT } from '../../src/modules/m02/api/fake/fixtures';

type LookupBody = { outcome: 'VALID' | 'TEMPORARILY_CLOSED' | 'INVALID'; [key: string]: unknown };

export type LookupRequest = { p_qr_identifier: string; p_route_id?: string };

/** Mọi request lookup được ghi vào mảng trả về. `overrides[mã] = 'ERROR'` → HTTP 500. */
export async function mockLookup(page: Page, overrides: Record<string, LookupBody | 'ERROR'> = {}): Promise<LookupRequest[]> {
  const requests: LookupRequest[] = [];
  await page.route('**/rest/v1/rpc/lookup_qr', async (route) => {
    const body = route.request().postDataJSON() as LookupRequest;
    requests.push(body);
    const override = overrides[body.p_qr_identifier];
    if (override === 'ERROR') return route.fulfill({ status: 500, json: { message: 'boom' } });
    const content = LIVE_CONTENT[body.p_qr_identifier];
    const result: LookupBody = override ?? (content ? { outcome: 'VALID', content } : { outcome: 'INVALID' });
    return route.fulfill({ status: 200, json: result });
  });
  return requests;
}
