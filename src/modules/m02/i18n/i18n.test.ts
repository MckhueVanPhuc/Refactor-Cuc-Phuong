// Từ điển M02 (research R-14; field-ui-flow-contract §3): hai ngôn ngữ cùng tập khóa, câu chép nguyên văn
// spec-M02 §5.1 và bảng copy screen spec, không chuỗi nào nói "đã đến"/"có mặt" (SC-M02-013).
import { describe, expect, it } from 'vitest';
import { en } from './en';
import { messagesFor } from './index';
import { vi } from './vi';

type Tree = { [key: string]: unknown };

function keyPaths(tree: Tree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'object' && value !== null ? keyPaths(value as Tree, path) : [`${path}:${typeof value}`];
  });
}

/** Mọi chuỗi hiển thị: chuỗi thường, và kết quả của hàm có tham số (gọi với giá trị mẫu). */
function renderedStrings(tree: Tree): string[] {
  return Object.values(tree).flatMap((value) => {
    if (typeof value === 'string') return [value];
    if (typeof value === 'function') return [String((value as (...args: unknown[]) => unknown)({ n: 2, time: '10:00', scanned: 1, total: 3 }))];
    if (typeof value === 'object' && value !== null) return renderedStrings(value as Tree);
    return [];
  });
}

const FORBIDDEN = ['đã đến', 'có mặt', 'arrived'];
const ENUM_CODES = ['DANG_DIEN_RA', 'HOAN_TAT', 'BO_DO', 'PENDING', 'SYNCED', 'CONFLICT', 'VALID', 'INVALID', 'TEMPORARILY_CLOSED'];

describe('i18n M02', () => {
  it('vi và en có cùng tập khóa và cùng loại giá trị', () => {
    expect(keyPaths(en)).toEqual(keyPaths(vi));
  });

  it.each([['vi', vi], ['en', en]] as const)('%s: không chuỗi nào rỗng, là mã enum hay nói "đã đến"', (_lang, messages) => {
    for (const text of renderedStrings(messages)) {
      expect(text.trim()).not.toBe('');
      for (const word of FORBIDDEN) expect(text.toLowerCase()).not.toContain(word);
      for (const code of ENUM_CODES) expect(text).not.toContain(code);
    }
  });

  it('thông báo tạm đóng song ngữ đúng nguyên văn (US-M02-04 mục 3; spec-M02 §5.1)', () => {
    expect(vi.notice.temporarilyClosed).toBe(
      'Khu vực này đang tạm đóng. Vui lòng dừng lại hoặc quay về theo hướng dẫn của Ban Quản lý.',
    );
    expect(en.notice.temporarilyClosed).toBe(
      'This area is temporarily closed. Please stop here or return as directed by Park Management.',
    );
  });

  it('câu chép đúng spec-M02 §5.1 và bảng copy screen spec (mẫu mỗi nhóm)', () => {
    expect(vi.notice.invalid).toBe('Mã không còn hiệu lực hoặc không tồn tại.');
    expect(en.notice.connectionNeeded).toBe('A connection is needed to check this QR code.');
    expect(vi.endPrompt.question).toBe('Bạn đã quét điểm cuối. Kết thúc chuyến đi?');
    expect([en.endPrompt.end, en.endPrompt.continue]).toEqual(['End', 'Continue']);
    expect(vi.trip.scanned).toBe('Đã quét QR');
    expect(en.handoff.expired).toBe('This start has expired (over 24 hours). Please start again from the route list.');
    expect(vi.content.scannedAt({ time: '10:00' })).toBe('Quét lúc 10:00');
    expect(en.content.audioLabel({ n: 2 })).toBe('Audio 2');
    expect(vi.end.syncConflict).toBe(
      'Chuyến đi này không gửi được về hệ thống. Chuyến đi vẫn được lưu trên thiết bị này.',
    );
    expect(en.qrLink.chooseRoute).toBe('Choose a route');
  });

  it('messagesFor chọn từ điển theo ngôn ngữ', () => {
    expect(messagesFor('vi')).toBe(vi);
    expect(messagesFor('en')).toBe(en);
  });
});
