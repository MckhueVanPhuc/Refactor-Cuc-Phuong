// Kiểm tra dùng chung, hàm thuần (research R-19): cùng hàm chạy cho panel ở client và để đối chiếu server.
// BLOCKS_SAVE chỉ cho giá trị sai rõ ràng (BR-M03-L01); thiếu nội dung chỉ chặn xuất bản.
import type { ValidationIssue } from '../contracts/validationIssue';
import { formatMessage, type MessageKey, type MessageValues } from '../messages/catalog';
import { FIELD_LABELS, fieldLabel, type ItemType } from '../messages/fieldLabels';

/** Số ký tự sau khi trim hai đầu, đếm theo code point (spec-M03 §5.3) */
export function trimmedLength(value: string): number {
  return Array.from(value.trim()).length;
}

export function hasLineBreak(value: string): boolean {
  return /[\r\n]/.test(value);
}

/** Trường một dòng không nhận xuống dòng: thay CR/LF bằng một khoảng trắng */
export function stripLineBreaks(value: string): string {
  return value.replace(/\r\n|[\r\n]/g, ' ');
}

type Target = { itemType: ItemType; itemId: string };

export function makeIssue<K extends MessageKey>(
  input: Target & {
    severity: ValidationIssue['severity'];
    fieldKey: string;
    messageKey: K;
    values: MessageValues<K>;
  },
): ValidationIssue {
  const label = fieldLabel(input.itemType, input.fieldKey);
  if (label === undefined) throw new Error(`Chưa có nhãn cho trường ${input.itemType}.${input.fieldKey}`);
  const render = formatMessage as (key: MessageKey, values: Record<string, string | number>) => string;
  return {
    severity: input.severity,
    fieldLabel: label,
    message: render(input.messageKey, input.values as Record<string, string | number>),
    messageKey: input.messageKey,
    targetItemType: input.itemType,
    targetItemId: input.itemId,
    targetFieldKey: input.fieldKey,
  };
}

function label(target: Target, fieldKey: string): string {
  const found = fieldLabel(target.itemType, fieldKey);
  if (found === undefined) throw new Error(`Chưa có nhãn cho trường ${target.itemType}.${fieldKey}`);
  return found;
}

/** Độ dài tối đa (BLOCKS_SAVE, MSG-LIMIT-TEXT). Trống không báo ở đây. */
export function checkText(input: Target & { fieldKey: string; value: string | undefined; max: number }): ValidationIssue[] {
  const length = trimmedLength(input.value ?? '');
  if (length <= input.max) return [];
  return [
    makeIssue({
      ...input,
      severity: 'BLOCKS_SAVE',
      messageKey: 'MSG-LIMIT-TEXT',
      values: { 'Tên ô': label(input, input.fieldKey), 'tối đa': input.max, số: length },
    }),
  ];
}

const isBlank = (value: unknown) =>
  value === undefined ||
  value === null ||
  (typeof value === 'string' && value.trim() === '') ||
  (Array.isArray(value) && value.length === 0);

/** Bắt buộc khi xuất bản (BLOCKS_PUBLISH, MSG-MISSING-FIELD) */
export function checkRequired(input: Target & { fieldKey: string; value: unknown }): ValidationIssue[] {
  if (!isBlank(input.value)) return [];
  return [
    makeIssue({
      ...input,
      severity: 'BLOCKS_PUBLISH',
      messageKey: 'MSG-MISSING-FIELD',
      values: { 'tên ô': label(input, input.fieldKey) },
    }),
  ];
}

const LANGUAGE_NAMES = { vi: 'tiếng Việt', en: 'tiếng Anh' } as const;

/**
 * Song ngữ both-or-none: có một ngôn ngữ thì phải có cả hai (BLOCKS_PUBLISH, MSG-MISSING-LANGUAGE).
 * `fieldKey` là khóa gốc (ví dụ `safetyWarning`); issue trỏ tới ô của ngôn ngữ còn thiếu.
 */
export function checkBilingual(
  input: Target & { fieldKey: string; value: { vi?: string; en?: string } | undefined },
): ValidationIssue[] {
  const hasVi = !isBlank(input.value?.vi);
  const hasEn = !isBlank(input.value?.en);
  if (hasVi === hasEn) return [];
  const missing = hasVi ? 'en' : 'vi';
  const labels: Record<string, string> = FIELD_LABELS[input.itemType];
  const baseLabel = labels[input.fieldKey];
  if (baseLabel === undefined) throw new Error(`Chưa có nhãn cho trường ${input.itemType}.${input.fieldKey}`);
  return [
    makeIssue({
      ...input,
      fieldKey: `${input.fieldKey}.${missing}`,
      severity: 'BLOCKS_PUBLISH',
      messageKey: 'MSG-MISSING-LANGUAGE',
      values: { 'Tên ô': baseLabel, 'tiếng Việt / tiếng Anh': LANGUAGE_NAMES[missing] },
    }),
  ];
}

/**
 * Song ngữ bắt buộc khi xuất bản: thiếu cả hai → MSG-MISSING-FIELD (nhãn gốc, trỏ ô tiếng Việt);
 * thiếu một → MSG-MISSING-LANGUAGE như `checkBilingual`.
 */
export function checkRequiredBilingual(
  input: Target & { fieldKey: string; value: { vi?: string; en?: string } | undefined },
): ValidationIssue[] {
  if (!isBlank(input.value?.vi) || !isBlank(input.value?.en)) return checkBilingual(input);
  const labels: Record<string, string> = FIELD_LABELS[input.itemType];
  const baseLabel = labels[input.fieldKey];
  if (baseLabel === undefined) throw new Error(`Chưa có nhãn cho trường ${input.itemType}.${input.fieldKey}`);
  const issue = makeIssue({
    ...input,
    fieldKey: `${input.fieldKey}.vi`,
    severity: 'BLOCKS_PUBLISH',
    messageKey: 'MSG-MISSING-FIELD',
    values: { 'tên ô': baseLabel },
  });
  return [{ ...issue, fieldLabel: baseLabel }];
}

const decimalPlaces = (value: number) => {
  const [, fraction = ''] = String(value).split('.');
  return fraction.length;
};

/** Số > 0, ≤ tối đa, số chữ số thập phân (BLOCKS_SAVE). Chưa nhập không báo ở đây. */
export function checkNumber(
  input: Target & { fieldKey: string; value: number | undefined; max: number; unit: string; maxDecimals: number },
): ValidationIssue[] {
  if (input.value === undefined || Number.isNaN(input.value)) return [];
  const name = label(input, input.fieldKey);
  const base = { ...input, severity: 'BLOCKS_SAVE' as const };
  if (input.value <= 0) {
    return [makeIssue({ ...base, messageKey: 'MSG-NUMBER-POSITIVE', values: { 'Tên ô': name } })];
  }
  if (decimalPlaces(input.value) > input.maxDecimals) {
    return [makeIssue({ ...base, messageKey: 'MSG-NUMBER-DECIMALS', values: { 'Tên ô': name } })];
  }
  if (input.value > input.max) {
    return [
      makeIssue({
        ...base,
        messageKey: 'MSG-NUMBER-TOO-BIG',
        values: { 'Tên ô': name, 'tối đa': input.max, 'đơn vị': input.unit },
      }),
    ];
  }
  return [];
}
