// scan-resolution-contract §2 dòng 2, 4, 5, 7 (tasks T057; BR-M02-008, 015; FR-M02-012, 013, 021; SC-M02-009).
import { describe, expect, it } from 'vitest';
import { CHECKPOINTS, LIVE_CONTENT } from '../api/fake/fixtures';
import { resolveScan } from './resolveScan';

const journey = CHECKPOINTS;

describe('resolveScan — ngoài hành trình, tạm đóng, không hợp lệ', () => {
  it('dòng 2 — có phiên, online VALID, checkpoint ngoài journey → nội dung live, không lượt ghé (BR-M02-008)', () => {
    expect(resolveScan({ journey, qrIdentifier: 'QX', lookup: { kind: 'VALID', content: LIVE_CONTENT.QX! } })).toEqual({
      recordVisitFor: null,
      display: { kind: 'LIVE', content: LIVE_CONTENT.QX },
      freeVisitor: false,
    });
  });

  it.each(['ROUTE', 'CHECKPOINT'] as const)('dòng 4 — TEMPORARILY_CLOSED %s, mã trong hoặc ngoài journey → không lượt ghé, không nội dung (BR-M02-015)', (closedScope) => {
    for (const qrIdentifier of ['Q1a', 'QX']) {
      expect(resolveScan({ journey, qrIdentifier, lookup: { kind: 'TEMPORARILY_CLOSED', closedScope } })).toEqual({
        recordVisitFor: null,
        display: { kind: 'CLOSED' },
        freeVisitor: false,
      });
    }
  });

  it('dòng 4 — hai scope cho cùng một kết quả hiển thị (SC-M02-009)', () => {
    const route = resolveScan({ journey, qrIdentifier: 'Q1a', lookup: { kind: 'TEMPORARILY_CLOSED', closedScope: 'ROUTE' } });
    const checkpoint = resolveScan({ journey, qrIdentifier: 'Q1a', lookup: { kind: 'TEMPORARILY_CLOSED', closedScope: 'CHECKPOINT' } });
    expect(route).toEqual(checkpoint);
  });

  it('dòng 5 — INVALID, mã trong hoặc ngoài journey → mã không hợp lệ, không lượt ghé', () => {
    for (const qrIdentifier of ['Q1a', 'ZZ']) {
      expect(resolveScan({ journey, qrIdentifier, lookup: { kind: 'INVALID' } })).toEqual({
        recordVisitFor: null,
        display: { kind: 'INVALID' },
        freeVisitor: false,
      });
    }
  });

  it('dòng 7 — có phiên, offline/lỗi nguồn, mã không có trong journey → cần kết nối, không phải mã không hợp lệ (FR-M02-013)', () => {
    for (const qrIdentifier of ['QX', 'QN']) {
      expect(resolveScan({ journey, qrIdentifier, lookup: { kind: 'SOURCE_ERROR' } })).toEqual({
        recordVisitFor: null,
        display: { kind: 'CONNECTION_NEEDED' },
        freeVisitor: false,
      });
    }
  });
});
