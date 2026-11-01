import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROUTE_TEXT_LIMITS } from '../validation/route';
import { fieldLabel, type ItemType } from './fieldLabels';

describe('fieldLabel (BR-M03-L04)', () => {
  it('trường thường', () => {
    expect(fieldLabel('ROUTE', 'distanceKm')).toBe('Quãng đường (km)');
    expect(fieldLabel('CHECKPOINT', 'connectivityMode')).toBe('Loại kết nối');
  });

  it('trường song ngữ thêm tên ngôn ngữ', () => {
    expect(fieldLabel('ROUTE', 'safetyWarning.en')).toBe('Cảnh báo an toàn (tiếng Anh)');
    expect(fieldLabel('QRCODE', 'objectName.vi')).toBe('Tên đối tượng (tiếng Việt)');
  });

  it('bỏ chỉ số phần tử danh sách', () => {
    expect(fieldLabel('ROUTE', 'highlights.2.en')).toBe('Điểm nổi bật (tiếng Anh)');
  });

  it('khóa lạ hoặc sai loại mục → undefined', () => {
    expect(fieldLabel('ROUTE', 'objectName.vi')).toBeUndefined();
    expect(fieldLabel('QRCODE', 'khong-co')).toBeUndefined();
  });
});

// ---- Mọi `targetFieldKey` mà validation client và server (adapter giả) trả về đều có nhãn ----
// Nguồn issue: các hàm validation dùng chung (chạy ở cả client và server, research R-19) và phần kiểm riêng của
// server trong adapter giả. Media (api/fake/media.ts) lấy nhãn thẳng từ FIELD_LABELS nên đã được kiểu bảo đảm.

const m03Dir = join(process.cwd(), 'src', 'modules', 'm03');

/** File sinh issue → loại mục của issue */
const ISSUE_SOURCES: Record<string, ItemType> = {
  'validation/route.ts': 'ROUTE',
  'validation/publishGaps.ts': 'ROUTE',
  'validation/checkpoint.ts': 'CHECKPOINT',
  'validation/visitPoint.ts': 'QRCODE',
  'api/fake/checkpointData.ts': 'QRCODE',
  'api/fake/publish.ts': 'ROUTE',
};

/** Khóa trường viết thẳng trong mã: `fieldKey: 'x'`, tiền tố `x.${…}`, đối số khóa và mảng khóa `[...] as const` */
function fieldKeysIn(source: string): string[] {
  const keys = [
    ...[...source.matchAll(/fieldKey: '([\w.]+)'/g)].map((m) => m[1]!),
    ...[...source.matchAll(/`(\w+)\.\$\{/g)].map((m) => m[1]!),
    ...[...source.matchAll(/(?:bilingualLength\([^,]+|withKey\([\s\S]*?\)\)), '(\w+)'/g)].map((m) => m[1]!),
    ...[...source.matchAll(/\[((?:'\w+',?\s*)+)\] as const\)\.flatMap/g)].flatMap((m) => [...m[1]!.matchAll(/'(\w+)'/g)].map((k) => k[1]!)),
  ];
  // `['vi', 'en']` là danh sách ngôn ngữ (đuôi của khóa song ngữ), không phải khóa trường
  return [...new Set(keys)].filter((key) => key !== 'vi' && key !== 'en');
}

describe('mọi targetFieldKey của validation có nhãn (BR-M03-L04; tasks T129)', () => {
  it.each(Object.entries(ISSUE_SOURCES))('%s', (file, itemType) => {
    const keys = fieldKeysIn(readFileSync(join(m03Dir, file), 'utf8'));
    expect(keys.length).toBeGreaterThan(0);
    expect(keys.filter((key) => fieldLabel(itemType, key) === undefined)).toEqual([]);
  });

  it('các trường giới hạn độ dài của tuyến (ROUTE_TEXT_LIMITS), cả hai ngôn ngữ', () => {
    const missing = ROUTE_TEXT_LIMITS.flatMap(([key]) => [`${key}.vi`, `${key}.en`]).filter((key) => fieldLabel('ROUTE', key) === undefined);
    expect(missing).toEqual([]);
  });

  it('dòng trước/sau của lịch sử: mọi trường textChanges(loại, khóa) có nhãn theo đúng loại mục', () => {
    const source = readFileSync(join(m03Dir, 'api/fake/publish.ts'), 'utf8');
    const calls = [...source.matchAll(/textChanges\('(ROUTE|CHECKPOINT|QRCODE)', '(\w+)'/g)].map((m) => [m[1] as ItemType, m[2]!] as const);
    expect(calls.length).toBeGreaterThan(0);
    expect(calls.filter(([type, key]) => fieldLabel(type, `${key}.vi`) === undefined)).toEqual([]);
  });
});
