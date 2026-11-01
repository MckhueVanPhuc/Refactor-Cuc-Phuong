import { describe, expect, it } from 'vitest';
import {
  checkBilingual,
  checkNumber,
  checkRequired,
  checkText,
  hasLineBreak,
  makeIssue,
  stripLineBreaks,
  trimmedLength,
} from './common';

const target = { itemType: 'ROUTE' as const, itemId: 'r1' };

describe('độ dài và dòng (spec-M03 §5.3)', () => {
  it('đếm ký tự sau trim, theo code point', () => {
    expect(trimmedLength('  Cúc Phương  ')).toBe(10);
    expect(trimmedLength('🌿ab')).toBe(3);
  });

  it('phát hiện và chặn CR/LF ở trường một dòng', () => {
    expect(hasLineBreak('a\nb')).toBe(true);
    expect(hasLineBreak('a\r\nb')).toBe(true);
    expect(stripLineBreaks('a\r\nb\nc')).toBe('a b c');
  });
});

describe('makeIssue', () => {
  it('nhãn từ fieldLabels, câu từ danh mục, đủ trường của ValidationIssue', () => {
    expect(
      makeIssue({ ...target, severity: 'BLOCKS_PUBLISH', fieldKey: 'name.en', messageKey: 'MSG-MISSING-FIELD', values: { 'tên ô': 'Tên tuyến (tiếng Anh)' } }),
    ).toEqual({
      severity: 'BLOCKS_PUBLISH',
      fieldLabel: 'Tên tuyến (tiếng Anh)',
      message: 'Còn thiếu: Tên tuyến (tiếng Anh).',
      messageKey: 'MSG-MISSING-FIELD',
      targetItemType: 'ROUTE',
      targetItemId: 'r1',
      targetFieldKey: 'name.en',
    });
  });
});

describe('checkText', () => {
  it('dài quá giới hạn → BLOCKS_SAVE MSG-LIMIT-TEXT (biên: đúng giới hạn vẫn qua)', () => {
    expect(checkText({ ...target, fieldKey: 'name.vi', value: 'a'.repeat(100), max: 100 })).toEqual([]);
    const [issue] = checkText({ ...target, fieldKey: 'name.vi', value: `  ${'a'.repeat(101)}  `, max: 100 });
    expect(issue).toMatchObject({ severity: 'BLOCKS_SAVE', messageKey: 'MSG-LIMIT-TEXT' });
    expect(issue?.message).toBe('Tên tuyến (tiếng Việt) dài quá 100 ký tự (hiện có 101). Hãy rút gọn.');
  });

  it('trống thì không báo ở đây (thiếu là việc của checkRequired)', () => {
    expect(checkText({ ...target, fieldKey: 'name.vi', value: '   ', max: 100 })).toEqual([]);
  });
});

describe('checkRequired', () => {
  it('trống sau trim → BLOCKS_PUBLISH MSG-MISSING-FIELD; có giá trị thì qua', () => {
    expect(checkRequired({ ...target, fieldKey: 'distanceKm', value: undefined })[0]).toMatchObject({
      severity: 'BLOCKS_PUBLISH',
      messageKey: 'MSG-MISSING-FIELD',
      message: 'Còn thiếu: Quãng đường (km).',
    });
    expect(checkRequired({ ...target, fieldKey: 'name.vi', value: '  ' })).toHaveLength(1);
    expect(checkRequired({ ...target, fieldKey: 'name.vi', value: 'Có' })).toEqual([]);
    expect(checkRequired({ ...target, fieldKey: 'groupTags', value: [] })).toHaveLength(1);
  });
});

describe('checkBilingual (both-or-none)', () => {
  it('chỉ có một ngôn ngữ → BLOCKS_PUBLISH MSG-MISSING-LANGUAGE nêu ngôn ngữ còn thiếu', () => {
    const [issue] = checkBilingual({ ...target, fieldKey: 'safetyWarning', value: { vi: 'Đá trơn' } });
    expect(issue).toMatchObject({
      severity: 'BLOCKS_PUBLISH',
      messageKey: 'MSG-MISSING-LANGUAGE',
      targetFieldKey: 'safetyWarning.en',
      message: 'Cảnh báo an toàn: còn thiếu bản tiếng Anh.',
    });
    const [viMissing] = checkBilingual({ ...target, fieldKey: 'safetyWarning', value: { vi: ' ', en: 'Slippery' } });
    expect(viMissing?.message).toBe('Cảnh báo an toàn: còn thiếu bản tiếng Việt.');
  });

  it('cả hai hoặc không có ngôn ngữ nào → qua', () => {
    expect(checkBilingual({ ...target, fieldKey: 'safetyWarning', value: { vi: 'A', en: 'B' } })).toEqual([]);
    expect(checkBilingual({ ...target, fieldKey: 'safetyWarning', value: {} })).toEqual([]);
    expect(checkBilingual({ ...target, fieldKey: 'safetyWarning', value: undefined })).toEqual([]);
  });
});

describe('checkNumber', () => {
  const distance = { ...target, fieldKey: 'distanceKm', max: 100, unit: 'km', maxDecimals: 1 };

  it('≤ 0 → MSG-NUMBER-POSITIVE', () => {
    expect(checkNumber({ ...distance, value: 0 })[0]).toMatchObject({
      severity: 'BLOCKS_SAVE',
      messageKey: 'MSG-NUMBER-POSITIVE',
      message: 'Quãng đường (km) phải lớn hơn 0.',
    });
  });

  it('> tối đa → MSG-NUMBER-TOO-BIG (biên: đúng tối đa vẫn qua)', () => {
    expect(checkNumber({ ...distance, value: 100 })).toEqual([]);
    expect(checkNumber({ ...distance, value: 100.1 })[0]).toMatchObject({
      messageKey: 'MSG-NUMBER-TOO-BIG',
      message: 'Quãng đường (km) không được lớn hơn 100 km.',
    });
  });

  it('quá số chữ số thập phân → MSG-NUMBER-DECIMALS', () => {
    expect(checkNumber({ ...distance, value: 3.5 })).toEqual([]);
    expect(checkNumber({ ...distance, value: 3.55 })[0]).toMatchObject({ messageKey: 'MSG-NUMBER-DECIMALS' });
  });

  it('số nguyên: maxDecimals 0', () => {
    const duration = { ...target, fieldKey: 'durationMin', max: 1440, unit: 'phút', maxDecimals: 0 };
    expect(checkNumber({ ...duration, value: 90.5 })[0]).toMatchObject({ messageKey: 'MSG-NUMBER-DECIMALS' });
  });

  it('chưa nhập → không báo ở đây', () => {
    expect(checkNumber({ ...distance, value: undefined })).toEqual([]);
  });
});
