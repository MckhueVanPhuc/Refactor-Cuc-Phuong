// Dựng SessionSyncRecord (tasks T063; DAC-M02-008, 009; SC-M02-007; research R-10; session-sync-record-contract §2).
import { describe, expect, it } from 'vitest';
import { sessionSyncRecordSchema } from '../../../shared/contracts/sessionSyncRecord';
import { CHECKPOINTS, ROUTE_A } from '../api/fake/fixtures';
import type { CheckpointVisitRow, PlaySessionRow } from '../storage/rows';
import { autoEndedAt, buildSyncRecord, confirmedEndedAt, finalCheckpointId } from './buildSyncRecord';

const SESSION = '5b1e2d3c-4a5f-4e6d-8c7b-9a0f1e2d3c4b';
const STARTED_AT = '2026-11-04T02:00:00.000Z';

const session: PlaySessionRow = {
  sessionId: SESSION,
  sourceHandoffId: '1d0c6a2e-7b4f-4c3a-9e8d-2f1a0b9c8d7e',
  routeId: ROUTE_A,
  contentVersion: 3,
  journeyCheckpoints: structuredClone([...CHECKPOINTS]),
  status: 'DANG_DIEN_RA',
  startedAt: STARTED_AT,
};

const visit = (checkpointId: string, qrIdentifier: string, checkedInAt: string): CheckpointVisitRow => ({
  sessionId: SESSION,
  checkpointId,
  qrIdentifier,
  checkedInAt,
});

// Ghé C3 (seq 5) trước C2 (seq 3), qua mã thêm sau QN
const visits = [visit('C3', 'Q3', '2026-11-04T02:30:00.000Z'), visit('C2', 'QN', '2026-11-04T02:40:00.000Z')];

describe('buildSyncRecord', () => {
  it('đúng 7 trường gốc + 4 trường mỗi lượt ghé; checkpointName là chuỗi vi; sắp theo sequence', () => {
    const record = buildSyncRecord(session, visits, 'HOAN_TAT', '2026-11-04T03:00:00.000Z');
    expect(Object.keys(record).sort()).toEqual(['contentVersion', 'endedAt', 'routeId', 'sessionId', 'startedAt', 'status', 'visitedCheckpoints']);
    expect(record.visitedCheckpoints).toEqual([
      { checkpointId: 'C2', checkpointName: 'Cây chò ngàn năm', sequence: 3, checkedInAt: '2026-11-04T02:40:00.000Z' },
      { checkpointId: 'C3', checkpointName: 'Động Người Xưa', sequence: 5, checkedInAt: '2026-11-04T02:30:00.000Z' },
    ]);
    for (const item of record.visitedCheckpoints) expect(Object.keys(item).sort()).toEqual(['checkedInAt', 'checkpointId', 'checkpointName', 'sequence']);
    expect(sessionSyncRecordSchema.safeParse(record).success).toBe(true);
  });

  it('không có qrIdentifier, tên du khách, thiết bị hay GPS trong bản ghi (SC-M02-007)', () => {
    const text = JSON.stringify(buildSyncRecord(session, visits, 'HOAN_TAT', '2026-11-04T03:00:00.000Z'));
    for (const key of ['qrIdentifier', 'sourceHandoffId', 'device', 'gps', 'visitorName', 'account']) expect(text).not.toContain(key);
  });

  it('phiên bỏ dở không lượt ghé nào hợp lệ', () => {
    expect(buildSyncRecord(session, [], 'BO_DO', STARTED_AT).visitedCheckpoints).toEqual([]);
  });

  it('confirmedEndedAt = max(now, checkedInAt mới nhất, startedAt)', () => {
    expect(confirmedEndedAt(session, visits, new Date('2026-11-04T05:00:00.000Z'))).toBe('2026-11-04T05:00:00.000Z');
    // Đồng hồ lùi giữa chuyến: không sớm hơn lượt ghé mới nhất
    expect(confirmedEndedAt(session, visits, new Date('2026-11-04T02:35:00.000Z'))).toBe('2026-11-04T02:40:00.000Z');
    expect(confirmedEndedAt(session, [], new Date('2026-11-04T01:00:00.000Z'))).toBe(STARTED_AT);
  });

  it('đồng hồ lùi giữa chuyến vẫn cho endedAt ≥ checkedInAt ≥ startedAt (qua schema strict)', () => {
    const endedAt = confirmedEndedAt(session, visits, new Date('2026-11-04T01:00:00.000Z'));
    expect(sessionSyncRecordSchema.safeParse(buildSyncRecord(session, visits, 'HOAN_TAT', endedAt)).success).toBe(true);
  });

  it('autoEndedAt = checkedInAt mới nhất, hoặc startedAt khi chưa quét (BR-M02-022)', () => {
    expect(autoEndedAt(session, visits)).toBe('2026-11-04T02:40:00.000Z');
    expect(autoEndedAt(session, [])).toBe(STARTED_AT);
  });

  it('checkpoint cuối là sequence lớn nhất', () => {
    expect(finalCheckpointId(session)).toBe('C3');
  });

  it('lượt ghé ngoài journey đóng băng → lỗi, không dựng bản ghi', () => {
    expect(() => buildSyncRecord(session, [visit('CX', 'QX', '2026-11-04T02:10:00.000Z')], 'BO_DO', '2026-11-04T03:00:00.000Z')).toThrow();
  });
});
