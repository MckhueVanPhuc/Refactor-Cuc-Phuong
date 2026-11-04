// scan-resolution-contract §2 dòng 3, 8 và gợi ý khách tự do (tasks T076; BR-M02-012, 019; FR-M02-019).
import { describe, expect, it } from 'vitest';
import { createFakeLookup } from '../api/fake/fakeLookup';
import { LIVE_CONTENT } from '../api/fake/fixtures';
import { playSessionsTable } from '../storage/tables';
import { processScan } from './processScan';
import { resolveScan, type ScanLookup } from './resolveScan';

describe('resolveScan — khách tự do', () => {
  it('dòng 3 — không phiên, online VALID → nội dung live, không lượt ghé, gợi ý khách tự do', () => {
    expect(resolveScan({ journey: null, qrIdentifier: 'Q1a', lookup: { kind: 'VALID', content: LIVE_CONTENT.Q1a! } })).toEqual({
      recordVisitFor: null,
      display: { kind: 'LIVE', content: LIVE_CONTENT.Q1a },
      freeVisitor: true,
    });
  });

  it('dòng 8 — không phiên, offline/lỗi nguồn → cần kết nối, gợi ý khách tự do', () => {
    expect(resolveScan({ journey: null, qrIdentifier: 'Q1a', lookup: { kind: 'SOURCE_ERROR' } })).toEqual({
      recordVisitFor: null,
      display: { kind: 'CONNECTION_NEEDED' },
      freeVisitor: true,
    });
  });

  it.each<[string, ScanLookup]>([
    ['VALID', { kind: 'VALID', content: LIVE_CONTENT.QX! }],
    ['TEMPORARILY_CLOSED', { kind: 'TEMPORARILY_CLOSED', closedScope: 'ROUTE' }],
    ['INVALID', { kind: 'INVALID' }],
    ['lỗi nguồn', { kind: 'SOURCE_ERROR' }],
    ['link sai', { kind: 'INVALID_LINK' }],
  ])('gợi ý khách tự do hiện với mọi kết quả khi không phiên: %s', (_name, lookup) => {
    const resolution = resolveScan({ journey: null, qrIdentifier: 'Q1a', lookup });
    expect(resolution.freeVisitor).toBe(true);
    expect(resolution.recordVisitFor).toBeNull();
  });

  it('request không có routeId và không tạo phiên (BR-M02-019; SC-M02-018)', async () => {
    const lookup = createFakeLookup();
    for (const qr of ['Q1a', 'QX', 'ZZ']) await processScan(qr, 'link', { lookup });
    expect(lookup.calls).toEqual([{ qrIdentifier: 'Q1a' }, { qrIdentifier: 'QX' }, { qrIdentifier: 'ZZ' }]);
    expect(await playSessionsTable.count()).toBe(0);
  });
});
