// Các ca intake kỳ vọng (tasks T154; session-intake-contract §2; BR-M03-J01–J04; SC-M03-007, 038): mỗi ca qua
// hoặc không qua Zod đúng như bảng; ca không qua Zod luôn INVALID; bảng phủ đủ bốn kết quả và chạy theo thứ tự.
import { describe, expect, it } from 'vitest';
import { SESSION_INTAKE_CASES, SESSION_INTAKE_SNAPSHOT } from './sessionSyncRecord.cases';
import { sessionSyncRecordSchema } from './sessionSyncRecord';

const cases = SESSION_INTAKE_CASES;
const byName = (name: string) => {
  const found = cases.find((item) => item.name === name);
  if (!found) throw new Error(`thiếu ca "${name}"`);
  return found;
};
const sessionIdOf = (record: unknown) => (record as { sessionId?: unknown }).sessionId;

describe('bảng ca intake SessionSyncRecord (BR-M03-J01–J04)', () => {
  it.each(cases.map((item) => [item.name, item] as const))('%s: qua Zod đúng như bảng', (_name, item) => {
    expect(sessionSyncRecordSchema.safeParse(item.record).success).toBe(item.schemaValid);
  });

  it('tên ca không trùng; ca không qua Zod luôn INVALID', () => {
    expect(new Set(cases.map((item) => item.name)).size).toBe(cases.length);
    for (const item of cases.filter((c) => !c.schemaValid)) expect(item.expected, item.name).toBe('INVALID');
  });

  it('phủ đủ ACCEPTED, IDENTICAL, CONFLICT, INVALID', () => {
    expect(new Set(cases.map((item) => item.expected))).toEqual(new Set(['ACCEPTED', 'IDENTICAL', 'CONFLICT', 'INVALID']));
  });

  it('IDENTICAL và CONFLICT dùng sessionId của một ca ACCEPTED đứng trước (bảng chạy theo thứ tự)', () => {
    cases.forEach((item, index) => {
      if (item.expected !== 'IDENTICAL' && item.expected !== 'CONFLICT') return;
      const earlier = cases.slice(0, index).filter((other) => other.expected === 'ACCEPTED').map((other) => sessionIdOf(other.record));
      expect(earlier, item.name).toContain(sessionIdOf(item.record));
    });
  });

  it('gửi lại giống hệt nhưng đổi thứ tự visits và thứ tự khóa vẫn IDENTICAL (BR-M03-J03; SC-M03-007)', () => {
    const first = byName('phiên hoàn thành, hai lượt ghé');
    const reordered = byName('gửi lại, đổi thứ tự visits và thứ tự khóa');
    expect(reordered.expected).toBe('IDENTICAL');
    expect(Object.keys(reordered.record as object)).not.toEqual(Object.keys(first.record as object));
    const visits = (record: unknown) => (record as { visitedCheckpoints: { checkpointId: string }[] }).visitedCheckpoints.map((v) => v.checkpointId);
    expect(visits(reordered.record)).toEqual([...visits(first.record)].reverse());
  });

  it('ca INVALID qua Zod nhưng lệch snapshot: tên, sequence, checkpoint lạ, tuyến lạ, version lạ (BR-M03-J02; SC-M03-038)', () => {
    for (const name of ['sequence lệch snapshot', 'tên điểm dừng lệch snapshot', 'checkpoint không có trong snapshot', 'tuyến không tồn tại', 'version chưa có']) {
      expect(byName(name)).toMatchObject({ schemaValid: true, expected: 'INVALID' });
    }
  });

  it('allowlist: khóa lạ (deviceId) và trạng thái chưa kết thúc bị Zod từ chối (BR-M03-J01)', () => {
    expect(byName('có khóa deviceId')).toMatchObject({ schemaValid: false, expected: 'INVALID' });
    expect(byName('trạng thái DANG_DIEN_RA')).toMatchObject({ schemaValid: false, expected: 'INVALID' });
  });

  it('tuyến đã tạm đóng vẫn nhận (BR-M03-J04); snapshot của bảng có đủ dữ liệu để kiểm', () => {
    expect(byName('tuyến đang tạm đóng vẫn nhận')).toMatchObject({ expected: 'ACCEPTED', routeStatus: 'TAM_DONG' });
    expect(SESSION_INTAKE_SNAPSHOT.checkpoints.length).toBeGreaterThan(1);
  });
});
