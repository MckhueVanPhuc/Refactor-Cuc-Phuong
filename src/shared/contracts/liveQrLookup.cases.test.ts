// Bảng sự thật của live lookup (tasks T141; live-qr-lookup §3; BR-M03-I01–I04, E01; SC-M03-012, 017, 023):
// mọi output kỳ vọng qua Zod của liveQrLookup.ts; bảng phủ cả 6 bước của BR-M03-I02 và thứ tự ưu tiên giữa chúng.
import { describe, expect, it } from 'vitest';
import { LIVE_QR_LOOKUP_CASES } from './liveQrLookup.cases';
import { liveQrLookupResultSchema } from './liveQrLookup';

const cases = LIVE_QR_LOOKUP_CASES;
const byName = (name: string) => {
  const found = cases.find((item) => item.name === name);
  if (!found) throw new Error(`thiếu ca "${name}"`);
  return found;
};

describe('bảng sự thật live lookup (BR-M03-I02)', () => {
  it.each(cases.map((item) => [item.name, item] as const))('%s: output kỳ vọng qua Zod', (_name, item) => {
    expect(liveQrLookupResultSchema.safeParse(item.expected).success).toBe(true);
  });

  it('tên ca không trùng', () => {
    expect(new Set(cases.map((item) => item.name)).size).toBe(cases.length);
  });

  it('mỗi bước 1–6 có ít nhất một ca, và kết quả đúng loại của bước', () => {
    const outcomeOfStep = { 1: 'INVALID', 2: 'INVALID', 3: 'INVALID', 4: 'TEMPORARILY_CLOSED', 5: 'TEMPORARILY_CLOSED', 6: 'VALID' } as const;
    for (const step of [1, 2, 3, 4, 5, 6] as const) {
      const ofStep = cases.filter((item) => item.decidedAtStep === step);
      expect(ofStep.length, `bước ${step}`).toBeGreaterThan(0);
      for (const item of ofStep) expect(item.expected.outcome, item.name).toBe(outcomeOfStep[step]);
    }
    for (const item of cases.filter((c) => c.decidedAtStep === 4)) expect(item.expected).toEqual({ outcome: 'TEMPORARILY_CLOSED', closedScope: 'ROUTE' });
    for (const item of cases.filter((c) => c.decidedAtStep === 5)) expect(item.expected).toEqual({ outcome: 'TEMPORARILY_CLOSED', closedScope: 'CHECKPOINT' });
  });

  it('thứ tự ưu tiên: QR hỏng thắng mọi thứ; điểm dừng Nháp/Đã lưu trữ thắng tuyến; tuyến đóng thắng điểm dừng đóng', () => {
    expect(byName('QR đã thu hồi, điểm dừng và tuyến đều tạm đóng').expected.outcome).toBe('INVALID');
    expect(byName('điểm dừng đã lưu trữ, tuyến tạm đóng').expected.outcome).toBe('INVALID');
    expect(byName('tuyến Nháp, điểm dừng tạm đóng').expected.outcome).toBe('INVALID');
    expect(byName('tuyến tạm đóng, điểm dừng cũng tạm đóng').expected).toEqual({ outcome: 'TEMPORARILY_CLOSED', closedScope: 'ROUTE' });
  });

  it('có và không có routeId đều được phủ; M03 không kiểm tuyến có liệt kê điểm dừng (BR-M03-I01)', () => {
    expect(cases.some((item) => item.input.route === undefined)).toBe(true);
    expect(cases.some((item) => item.input.route !== undefined)).toBe(true);
    expect(byName('tuyến đang hoạt động nhưng không liệt kê điểm dừng').expected.outcome).toBe('VALID');
  });

  it('identifier: khớp chính xác sau khi trim; rỗng sau trim → INVALID (BR-M03-I01; live-qr-lookup §4)', () => {
    expect(byName('identifier có khoảng trắng hai đầu').expected.outcome).toBe('VALID');
    expect(byName('identifier rỗng sau khi trim').expected.outcome).toBe('INVALID');
  });

  it('OFFLINE_REQUIRED → mediaResources rỗng; ONLINE_AVAILABLE mang AV kèm spokenLanguage (BR-M03-I03; SC-M03-025, 039)', () => {
    const offline = byName('điểm dừng cần tải trước').expected;
    expect(offline.outcome === 'VALID' && offline.content.connectivityMode).toBe('OFFLINE_REQUIRED');
    expect(offline.outcome === 'VALID' && offline.content.mediaResources).toEqual([]);
    const online = byName('mọi thứ hoạt động, không có tuyến').expected;
    expect(online.outcome === 'VALID' && online.content.mediaResources.length).toBeGreaterThan(0);
  });

  it('hai QR của cùng điểm dừng trả hai nội dung khác nhau (SC-M03-012; BR-M03-E01)', () => {
    const first = byName('mọi thứ hoạt động, không có tuyến').expected;
    const second = byName('QR thứ hai của cùng điểm dừng').expected;
    if (first.outcome !== 'VALID' || second.outcome !== 'VALID') throw new Error('cả hai ca phải VALID');
    expect(second.content.checkpointId).toBe(first.content.checkpointId);
    expect(second.content.qrIdentifier).not.toBe(first.content.qrIdentifier);
    expect(second.content.objectName).not.toEqual(first.content.objectName);
    expect(second.content.localizedContent).not.toEqual(first.content.localizedContent);
  });

  it('TEMPORARILY_CLOSED và INVALID không mang nội dung; VALID không có field tuyến (BR-M03-I03, I04; SC-M03-023)', () => {
    for (const item of cases) {
      if (item.expected.outcome !== 'VALID') expect(Object.keys(item.expected).sort(), item.name).not.toContain('content');
      else expect(JSON.stringify(item.expected), item.name).not.toMatch(/routeId|route/i);
    }
  });
});
