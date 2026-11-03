// scan-resolution-contract §2 dòng 1, 6 và R-INVALID-LINK (tasks T034; BR-M02-005, 020; DAC-M02-006).
import { describe, expect, it } from 'vitest';
import { CHECKPOINTS, LIVE_CONTENT } from '../api/fake/fixtures';
import { resolveScan } from './resolveScan';

const journey = CHECKPOINTS;
const [c1, c2] = CHECKPOINTS;

describe('resolveScan', () => {
  it('dòng 1 — có phiên, online VALID, mã trong journey → ghi lượt ghé, nội dung live', () => {
    expect(resolveScan({ journey, qrIdentifier: 'Q1a', lookup: { kind: 'VALID', content: LIVE_CONTENT.Q1a! } })).toEqual({
      recordVisitFor: 'C1',
      display: { kind: 'LIVE', content: LIVE_CONTENT.Q1a },
      freeVisitor: false,
    });
  });

  it('dòng 1 — mã thêm sau (QN) không có trong journey nhưng content.checkpointId thuộc journey → ghi C2 (BR-M02-020)', () => {
    expect(resolveScan({ journey, qrIdentifier: 'QN', lookup: { kind: 'VALID', content: LIVE_CONTENT.QN! } })).toMatchObject({
      recordVisitFor: 'C2',
      display: { kind: 'LIVE' },
    });
  });

  it('dòng 6 — có phiên, lỗi nguồn/offline, mã trong journey → ghi lượt ghé, nguồn gói của J', () => {
    expect(resolveScan({ journey, qrIdentifier: 'Q1b', lookup: { kind: 'SOURCE_ERROR' } })).toEqual({
      recordVisitFor: 'C1',
      display: { kind: 'PACKAGE', checkpoint: c1 },
      freeVisitor: false,
    });
    expect(resolveScan({ journey, qrIdentifier: 'Q2', lookup: { kind: 'SOURCE_ERROR' } })).toMatchObject({
      recordVisitFor: 'C2',
      display: { kind: 'PACKAGE', checkpoint: c2 },
    });
  });

  it('lỗi nguồn với mã thêm sau (QN): không có J → không ghi, cần kết nối (dòng 7)', () => {
    expect(resolveScan({ journey, qrIdentifier: 'QN', lookup: { kind: 'SOURCE_ERROR' } })).toEqual({
      recordVisitFor: null,
      display: { kind: 'CONNECTION_NEEDED' },
      freeVisitor: false,
    });
  });

  it('R-INVALID-LINK — có hoặc không có phiên → mã không hợp lệ, không ghi', () => {
    for (const j of [journey, null]) {
      expect(resolveScan({ journey: j, qrIdentifier: '', lookup: { kind: 'INVALID_LINK' } })).toEqual({
        recordVisitFor: null,
        display: { kind: 'INVALID' },
        freeVisitor: j === null,
      });
    }
  });
});
