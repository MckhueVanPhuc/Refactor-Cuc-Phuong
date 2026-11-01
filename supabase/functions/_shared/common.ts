import { z } from 'zod';

/** Identifier opaque: chuỗi không rỗng, không kiểm định dạng (constitution; Physical PT-01). */
export const identifier = z.string().min(1);

export const nonEmptyText = z.string().min(1);

/** Văn bản song ngữ: có cả `vi` và `en`, không rỗng (both-or-none khi trường là Optional). */
export const bilingualText = z.strictObject({ vi: nonEmptyText, en: nonEmptyText });

/**
 * DateTime UTC dạng ISO 8601. Nhận `Z` hoặc `+00:00` (PostgREST trả `timestamptz` dạng offset);
 * offset khác bị từ chối vì contract chỉ dùng UTC.
 */
export const utcDateTime = z.iso
  .datetime({ offset: true })
  .refine((value) => /(Z|[+-]00:?00)$/.test(value), { message: 'phải là thời điểm UTC' });

export const positiveInt = z.number().int().min(1);

export const connectivityMode = z.enum(['ONLINE_AVAILABLE', 'OFFLINE_REQUIRED']);

export const imageRef = z.strictObject({
  sourceRef: nonEmptyText,
  caption: bilingualText.optional(),
});

/** Nội dung giới thiệu song ngữ của một điểm tham quan. */
export const localizedIntroduction = z.strictObject({
  vi: z.strictObject({ introductionText: nonEmptyText }),
  en: z.strictObject({ introductionText: nonEmptyText }),
});

export function hasDuplicates<T>(values: readonly T[]): boolean {
  return new Set(values).size !== values.length;
}
