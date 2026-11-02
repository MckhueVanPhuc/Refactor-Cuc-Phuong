// Các ca synthetic của intake SessionSyncRecord (tasks T156; session-intake-contract §2–§3; BR-M03-J01–J04).
// Bảng chạy **theo thứ tự** trên một snapshot cho trước: ca sau có thể dùng lại sessionId đã được nhận ở ca trước.
// Dùng làm oracle cho `session-intake` và `api.ingest_session` ở giai đoạn B (T194–T196, Q25) và cho test của M02.
// Bảng chỉ ghi kết quả, không cài lại luật.
import type { SessionSyncRecord } from './sessionSyncRecord';

export type IntakeResult = 'ACCEPTED' | 'IDENTICAL' | 'CONFLICT' | 'INVALID';

export type SessionIntakeCase = {
  name: string;
  /** body gửi lên; có thể sai hình dạng nên kiểu là unknown */
  record: unknown;
  /** qua `sessionSyncRecordSchema` (Zod strict) hay không */
  schemaValid: boolean;
  /** trạng thái tuyến lúc gửi; vắng = `HOAT_DONG` */
  routeStatus?: 'HOAT_DONG' | 'TAM_DONG' | 'LUU_TRU';
  expected: IntakeResult;
};

/** Snapshot đã xuất bản mà các ca tham chiếu: tuyến R, version 2, hai điểm dừng */
export const SESSION_INTAKE_SNAPSHOT = {
  routeId: 'Rt1a2b3c4d5e6f7g8h9',
  contentVersion: 2,
  checkpoints: [
    { checkpointId: 'Cp1a2b3c4d5e6f7g8h9', checkpointName: 'Hang Con Moong', sequence: 1 },
    { checkpointId: 'Cp9z8y7x6w5v4u3t2s1', checkpointName: 'Động Người Xưa', sequence: 2 },
  ],
} as const;

const [first, second] = SESSION_INTAKE_SNAPSHOT.checkpoints;
const SESSION_1 = '6f1c2a3b-4d5e-4f60-8a71-b2c3d4e5f601';
const SESSION_2 = '6f1c2a3b-4d5e-4f60-8a71-b2c3d4e5f602';
const SESSION_3 = '6f1c2a3b-4d5e-4f60-8a71-b2c3d4e5f603';

const base: SessionSyncRecord = {
  sessionId: SESSION_1,
  routeId: SESSION_INTAKE_SNAPSHOT.routeId,
  contentVersion: SESSION_INTAKE_SNAPSHOT.contentVersion,
  startedAt: '2026-10-20T01:00:00.000Z',
  endedAt: '2026-10-20T03:00:00.000Z',
  status: 'HOAN_TAT',
  visitedCheckpoints: [
    { ...first, checkedInAt: '2026-10-20T01:30:00.000Z' },
    { ...second, checkedInAt: '2026-10-20T02:30:00.000Z' },
  ],
};

/** Bản ghi mới (sessionId khác) dựa trên `base` với thay đổi cho trước */
const fresh = (sessionId: string, change: Partial<SessionSyncRecord> = {}): SessionSyncRecord => ({ ...base, sessionId, ...change });
const withVisit = (change: Partial<SessionSyncRecord['visitedCheckpoints'][number]>) => [{ ...base.visitedCheckpoints[0]!, ...change }];

/** Cùng nội dung với `base` nhưng thứ tự khóa và thứ tự visits đảo ngược */
const reordered = {
  visitedCheckpoints: [...base.visitedCheckpoints].reverse().map((visit) => ({
    checkedInAt: visit.checkedInAt,
    sequence: visit.sequence,
    checkpointName: visit.checkpointName,
    checkpointId: visit.checkpointId,
  })),
  status: base.status,
  endedAt: base.endedAt,
  startedAt: base.startedAt,
  contentVersion: base.contentVersion,
  routeId: base.routeId,
  sessionId: base.sessionId,
};

export const SESSION_INTAKE_CASES: readonly SessionIntakeCase[] = [
  { name: 'phiên hoàn thành, hai lượt ghé', record: base, schemaValid: true, expected: 'ACCEPTED' },
  { name: 'gửi lại giống hệt', record: base, schemaValid: true, expected: 'IDENTICAL' },
  { name: 'gửi lại, đổi thứ tự visits và thứ tự khóa', record: reordered, schemaValid: true, expected: 'IDENTICAL' },
  { name: 'cùng sessionId, khác trạng thái', record: { ...base, status: 'BO_DO' }, schemaValid: true, expected: 'CONFLICT' },
  { name: 'cùng sessionId, bớt một lượt ghé', record: { ...base, visitedCheckpoints: [base.visitedCheckpoints[0]] }, schemaValid: true, expected: 'CONFLICT' },
  {
    name: 'phiên bỏ dở, không lượt ghé nào',
    record: fresh(SESSION_2, { status: 'BO_DO', visitedCheckpoints: [] }),
    schemaValid: true,
    expected: 'ACCEPTED',
  },
  { name: 'tuyến đang tạm đóng vẫn nhận', record: fresh(SESSION_3), schemaValid: true, routeStatus: 'TAM_DONG', expected: 'ACCEPTED' },

  // Qua Zod nhưng lệch snapshot hoặc dữ liệu M03 (BR-M03-J02)
  { name: 'sequence lệch snapshot', record: fresh('7a000000-0000-4000-8000-000000000001', { visitedCheckpoints: withVisit({ sequence: 2 }) }), schemaValid: true, expected: 'INVALID' },
  {
    name: 'tên điểm dừng lệch snapshot',
    record: fresh('7a000000-0000-4000-8000-000000000002', { visitedCheckpoints: withVisit({ checkpointName: 'Hang khác' }) }),
    schemaValid: true,
    expected: 'INVALID',
  },
  {
    name: 'checkpoint không có trong snapshot',
    record: fresh('7a000000-0000-4000-8000-000000000003', { visitedCheckpoints: withVisit({ checkpointId: 'CpKhongCo0000000000' }) }),
    schemaValid: true,
    expected: 'INVALID',
  },
  { name: 'tuyến không tồn tại', record: fresh('7a000000-0000-4000-8000-000000000004', { routeId: 'RtKhongCo0000000000' }), schemaValid: true, expected: 'INVALID' },
  { name: 'version chưa có', record: fresh('7a000000-0000-4000-8000-000000000005', { contentVersion: 9 }), schemaValid: true, expected: 'INVALID' },

  // Không qua Zod strict (BR-M03-J01)
  { name: 'có khóa deviceId', record: { ...fresh('7b000000-0000-4000-8000-000000000001'), deviceId: 'may-1' }, schemaValid: false, expected: 'INVALID' },
  {
    name: 'lượt ghé có khóa lạ',
    record: fresh('7b000000-0000-4000-8000-000000000002', { visitedCheckpoints: [{ ...base.visitedCheckpoints[0]!, gps: '20.3,105.6' } as never] }),
    schemaValid: false,
    expected: 'INVALID',
  },
  { name: 'trạng thái DANG_DIEN_RA', record: { ...fresh('7b000000-0000-4000-8000-000000000003'), status: 'DANG_DIEN_RA' }, schemaValid: false, expected: 'INVALID' },
  {
    name: 'endedAt sớm hơn startedAt',
    record: fresh('7b000000-0000-4000-8000-000000000004', { endedAt: '2026-10-20T00:30:00.000Z', visitedCheckpoints: [] }),
    schemaValid: false,
    expected: 'INVALID',
  },
  {
    name: 'một điểm dừng ghé hai lần',
    record: fresh('7b000000-0000-4000-8000-000000000005', { visitedCheckpoints: [base.visitedCheckpoints[0]!, base.visitedCheckpoints[0]!] }),
    schemaValid: false,
    expected: 'INVALID',
  },
  {
    name: 'giờ check-in nằm ngoài phiên',
    record: fresh('7b000000-0000-4000-8000-000000000006', { visitedCheckpoints: withVisit({ checkedInAt: '2026-10-20T05:00:00.000Z' }) }),
    schemaValid: false,
    expected: 'INVALID',
  },
  { name: 'sessionId không phải UUID', record: fresh('phien-1'), schemaValid: false, expected: 'INVALID' },
];
