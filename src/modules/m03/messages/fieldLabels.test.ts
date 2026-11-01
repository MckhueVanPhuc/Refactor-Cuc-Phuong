import { describe, expect, it } from 'vitest';
import { fieldLabel } from './fieldLabels';

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
