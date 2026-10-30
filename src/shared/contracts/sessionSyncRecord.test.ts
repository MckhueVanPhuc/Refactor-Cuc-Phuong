import { describe, expect, it } from 'vitest';
import { sessionSyncRecordSchema, type SessionSyncRecord } from './sessionSyncRecord';

function validRecord(): SessionSyncRecord {
  return {
    sessionId: '3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b',
    routeId: 'r1',
    contentVersion: 2,
    startedAt: '2026-10-30T01:00:00Z',
    endedAt: '2026-10-30T03:00:00Z',
    status: 'HOAN_TAT',
    visitedCheckpoints: [
      { checkpointId: 'c1', checkpointName: 'Điểm 1', sequence: 1, checkedInAt: '2026-10-30T01:30:00Z' },
      { checkpointId: 'c2', checkpointName: 'Điểm 2', sequence: 2, checkedInAt: '2026-10-30T03:00:00Z' },
    ],
  };
}

const parse = (value: unknown) => sessionSyncRecordSchema.safeParse(value);
const visit = (index: number) => validRecord().visitedCheckpoints[index]!;

describe('SessionSyncRecord (session-intake §1; BR-M03-J01)', () => {
  it('nhận bản ghi hợp lệ; visitedCheckpoints có thể rỗng; status BO_DO', () => {
    expect(parse(validRecord()).success).toBe(true);
    expect(parse({ ...validRecord(), visitedCheckpoints: [], status: 'BO_DO' }).success).toBe(true);
  });

  it('.strict() ở gốc: khóa ngoài allowlist (deviceId) → lỗi', () => {
    expect(parse({ ...validRecord(), deviceId: 'abc' }).success).toBe(false);
  });

  it('.strict() ở phần tử: khóa ngoài allowlist → lỗi', () => {
    const visits = [{ ...visit(0), gps: '20.3,105.6' }];
    expect(parse({ ...validRecord(), visitedCheckpoints: visits }).success).toBe(false);
  });

  it('status chỉ HOAN_TAT / BO_DO', () => {
    expect(parse({ ...validRecord(), status: 'DANG_DI' }).success).toBe(false);
  });

  it('sessionId phải là UUID', () => {
    expect(parse({ ...validRecord(), sessionId: 's1' }).success).toBe(false);
  });

  it('endedAt >= startedAt', () => {
    expect(parse({ ...validRecord(), endedAt: '2026-10-30T00:59:59Z', visitedCheckpoints: [] }).success).toBe(false);
    expect(
      parse({ ...validRecord(), endedAt: '2026-10-30T01:00:00Z', visitedCheckpoints: [] }).success,
    ).toBe(true);
  });

  it('checkpointId duy nhất trong phiên', () => {
    const visits = [visit(0), { ...visit(1), checkpointId: 'c1' }];
    expect(parse({ ...validRecord(), visitedCheckpoints: visits }).success).toBe(false);
  });

  it('checkedInAt nằm trong [startedAt, endedAt]', () => {
    const before = [{ ...visit(0), checkedInAt: '2026-10-30T00:59:59Z' }];
    const after = [{ ...visit(0), checkedInAt: '2026-10-30T03:00:01Z' }];
    expect(parse({ ...validRecord(), visitedCheckpoints: before }).success).toBe(false);
    expect(parse({ ...validRecord(), visitedCheckpoints: after }).success).toBe(false);
  });

  it('thời điểm phải là UTC', () => {
    expect(parse({ ...validRecord(), startedAt: '2026-10-30T08:00:00+07:00' }).success).toBe(false);
  });

  it('thiếu trường Required → lỗi', () => {
    const record: Record<string, unknown> = { ...validRecord() };
    delete record['contentVersion'];
    expect(parse(record).success).toBe(false);
  });
});
