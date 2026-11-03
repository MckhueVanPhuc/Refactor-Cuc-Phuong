// Từ điển M01 (research R-12; visitor-ui-flow §4): hai ngôn ngữ cùng tập khóa, câu chép từ bảng copy screen spec,
// không chuỗi nào là mã enum, ID hay tên trường.
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
    if (typeof value === 'function') return [String((value as (...args: unknown[]) => unknown)({ n: 3, km: '2,4', min: 90, list: 'A, B', time: '1/11/26', name: 'X' }))];
    if (typeof value === 'object' && value !== null) return renderedStrings(value as Tree);
    return [];
  });
}

const ENUM_CODES = [
  'HOAT_DONG', 'TAM_DONG', 'LUU_TRU', 'NHE', 'TRUNG_BINH', 'KHO', 'TIME_NGAN', 'TIME_VUA', 'TIME_DAI',
  'GROUP_', 'INTEREST_', 'SAN_SANG', 'DANG_TAI', 'CHUA_TAI', 'CHUA_HOAN_TAT', 'CURRENT', 'OUTDATED',
  'OFFLINE_REQUIRED', 'ONLINE_AVAILABLE', 'AUTHORIZED', 'REVOKED', 'DA_CONG_BO',
];
const FIELD_NAMES = ['routeId', 'checkpointId', 'qrIdentifier', 'contentVersion', 'handoffId', 'sourceRef'];

describe('i18n M01', () => {
  it('vi và en có cùng tập khóa và cùng loại giá trị', () => {
    expect(keyPaths(en)).toEqual(keyPaths(vi));
  });

  it.each([['vi', vi], ['en', en]] as const)('%s: không chuỗi nào rỗng, là mã enum hay tên trường', (_lang, messages) => {
    for (const text of renderedStrings(messages)) {
      expect(text.trim()).not.toBe('');
      for (const code of [...ENUM_CODES, ...FIELD_NAMES]) expect(text).not.toContain(code);
    }
  });

  it('câu chép đúng bảng copy screen spec (mẫu mỗi màn)', () => {
    expect(vi.catalog.offlineNeeded).toBe('Cần tải trước');
    expect(en.catalog.stats({ n: 3, km: '2.4', min: 90 })).toBe('3 stops · 2.4 km · 90 min');
    expect(vi.recommend.noMatch).toBe(
      'Chưa có tuyến phù hợp với lựa chọn của bạn. Bạn có thể đổi tiêu chí hoặc xem tất cả tuyến.',
    );
    expect(en.labels.timeTag.TIME_VUA).toBe('Medium (90–180 min)');
    expect(vi.routeDetail.savedAt({ time: '10:00 1/11/2026' })).toBe(
      'Thông tin được lưu lúc 10:00 1/11/2026, có thể không phải bản mới nhất',
    );
    expect(en.offline.deleteConfirm({ name: 'Trail' })).toBe('Delete the download for "Trail"? A trip in progress is not affected.');
    expect(vi.update.available).toBe('Đã có phiên bản mới của ứng dụng.');
  });

  it('messagesFor chọn từ điển theo ngôn ngữ', () => {
    expect(messagesFor('vi')).toBe(vi);
    expect(messagesFor('en')).toBe(en);
  });
});
