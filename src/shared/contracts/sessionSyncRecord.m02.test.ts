// SessionSyncRecord từ phía M02 (tasks M02 T011; spec-M02 §5.1 "SessionSyncRecord output"; quickstart V29;
// DAC-M02-007–009; SC-M02-007). Dùng lại bảng ca synthetic của M03 (sessionSyncRecord.cases.ts) để hai phía kiểm
// cùng một schema, rồi thêm các ca riêng của bản ghi M02 dựng ra.
// Schema đồng sở hữu M02/M03 (research M02 R-04, L-01): đổi shape phải đổi cả spec-M02 §5.1 và spec-M03 cùng lúc.
// Ghi chú này nằm ở đây vì sessionSyncRecord.ts phải giống hệt bản sao của Edge (sessionSyncRecord.parity.test.ts).
import { describe, expect, it } from 'vitest';
import { SESSION_INTAKE_CASES } from './sessionSyncRecord.cases';
import { sessionSyncRecordSchema, type SessionSyncRecord } from './sessionSyncRecord';

const parse = (value: unknown) => sessionSyncRecordSchema.safeParse(value).success;

const record: SessionSyncRecord = {
  sessionId: '5b1e2d3c-4a5f-4e6d-8c7b-9a0f1e2d3c4b',
  routeId: 'A',
  contentVersion: 3,
  startedAt: '2026-11-04T02:00:00.000Z',
  endedAt: '2026-11-04T04:00:00.000Z',
  status: 'HOAN_TAT',
  visitedCheckpoints: [
    { checkpointId: 'C1', checkpointName: 'Cổng rừng', sequence: 1, checkedInAt: '2026-11-04T02:10:00.000Z' },
    { checkpointId: 'C3', checkpointName: 'Động Người Xưa', sequence: 5, checkedInAt: '2026-11-04T04:00:00.000Z' },
  ],
};
const firstVisit = record.visitedCheckpoints[0]!;

describe('SessionSyncRecord (phía M02)', () => {
  it.each(SESSION_INTAKE_CASES.map((c) => [c.name, c] as const))('ca dùng chung với M03: %s', (_name, c) => {
    expect(parse(c.record)).toBe(c.schemaValid);
  });

  it('bản ghi M02 hợp lệ; phiên bỏ dở không lượt ghé nào hợp lệ', () => {
    expect(parse(record)).toBe(true);
    expect(parse({ ...record, status: 'BO_DO', visitedCheckpoints: [] })).toBe(true);
  });

  it('không có tên, tài khoản, thiết bị, GPS: khóa lạ ở gốc hoặc phần tử bị từ chối (SC-M02-007)', () => {
    for (const key of ['deviceId', 'visitorName', 'accountId', 'location']) {
      expect(parse({ ...record, [key]: 'x' })).toBe(false);
    }
    expect(parse({ ...record, visitedCheckpoints: [{ ...firstVisit, qrIdentifier: 'Q1a' }] })).toBe(false);
  });

  it('status = DANG_DIEN_RA bị từ chối (chỉ trạng thái terminal)', () => {
    expect(parse({ ...record, status: 'DANG_DIEN_RA' })).toBe(false);
  });

  it('checkpointName là chuỗi tiếng Việt, không phải object song ngữ (V29)', () => {
    const bilingual = { ...firstVisit, checkpointName: { vi: 'Cổng rừng', en: 'Forest gate' } };
    expect(parse({ ...record, visitedCheckpoints: [bilingual] })).toBe(false);
    expect(parse({ ...record, visitedCheckpoints: [{ ...firstVisit, checkpointName: '' }] })).toBe(false);
  });

  it('endedAt < startedAt, checkpointId trùng, checkedInAt ngoài khoảng → lỗi (DAC-M02-008, 009)', () => {
    expect(parse({ ...record, endedAt: '2026-11-04T01:59:59.000Z', visitedCheckpoints: [] })).toBe(false);
    expect(parse({ ...record, visitedCheckpoints: [firstVisit, { ...firstVisit, sequence: 5 }] })).toBe(false);
    expect(parse({ ...record, visitedCheckpoints: [{ ...firstVisit, checkedInAt: '2026-11-04T04:00:01.000Z' }] })).toBe(false);
  });

  it('thiếu từng trường Required → lỗi', () => {
    for (const key of Object.keys(record)) {
      const copy: Record<string, unknown> = { ...record };
      delete copy[key];
      expect(parse(copy), key).toBe(false);
    }
    for (const key of Object.keys(firstVisit)) {
      const visit: Record<string, unknown> = { ...firstVisit };
      delete visit[key];
      expect(parse({ ...record, visitedCheckpoints: [visit] }), key).toBe(false);
    }
  });
});
