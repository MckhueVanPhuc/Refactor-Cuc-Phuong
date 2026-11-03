import { describe, expect, it } from 'vitest';
import { liveQrLookupResultSchema } from '../../../../shared/contracts/liveQrLookup';
import { offlinePackageSchema } from '../../../../shared/contracts/offlinePackage';
import { selectedRouteContextV3Schema } from '../../../../shared/contracts/selectedRouteContext';
import { createFakeLookup } from './fakeLookup';
import { CHECKPOINTS, contextV3, LIVE_CONTENT, readyPackage } from './fixtures';

describe('fixture quickstart M02 §4', () => {
  it('context, gói v3 và gói v2 OUTDATED qua schema dùng chung', () => {
    expect(selectedRouteContextV3Schema.safeParse(contextV3()).success).toBe(true);
    expect(offlinePackageSchema.safeParse(readyPackage()).success).toBe(true);
    expect(offlinePackageSchema.safeParse(readyPackage(2, 'OUTDATED')).success).toBe(true);
  });

  it('mọi nội dung live qua schema LiveQrLookupResult', () => {
    for (const content of Object.values(LIVE_CONTENT)) {
      expect(liveQrLookupResultSchema.safeParse({ outcome: 'VALID', content }).success).toBe(true);
    }
  });

  it('QN thuộc C2 nhưng không có trong journey; QX ngoài tuyến', () => {
    expect(LIVE_CONTENT.QN!.checkpointId).toBe('C2');
    expect(CHECKPOINTS.flatMap((c) => c.qrIdentifiers)).not.toContain('QN');
    expect(CHECKPOINTS.map((c) => c.checkpointId)).not.toContain(LIVE_CONTENT.QX!.checkpointId);
  });
});

describe('fakeLookup', () => {
  it('mã trong fixture → VALID; mã lạ → INVALID; ghi lại routeId', async () => {
    const lookup = createFakeLookup();
    expect(await lookup.lookup('Q2', 'A')).toMatchObject({ kind: 'VALID', content: { checkpointId: 'C2' } });
    expect(await lookup.lookup('ZZ')).toEqual({ kind: 'INVALID' });
    expect(lookup.calls).toEqual([{ qrIdentifier: 'Q2', routeId: 'A' }, { qrIdentifier: 'ZZ' }]);
  });

  it('kết quả đặt riêng cho từng mã; reset xóa', async () => {
    const lookup = createFakeLookup();
    lookup.set('Q1a', { kind: 'TEMPORARILY_CLOSED', closedScope: 'ROUTE' });
    lookup.set('Q2', 'SOURCE_ERROR');
    expect(await lookup.lookup('Q1a')).toEqual({ kind: 'TEMPORARILY_CLOSED', closedScope: 'ROUTE' });
    expect(await lookup.lookup('Q2')).toEqual({ kind: 'SOURCE_ERROR' });
    lookup.reset();
    expect(lookup.calls).toEqual([]);
    expect(await lookup.lookup('Q1a')).toMatchObject({ kind: 'VALID' });
  });
});
