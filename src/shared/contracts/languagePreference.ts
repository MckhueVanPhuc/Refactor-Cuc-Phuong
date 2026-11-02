// LanguagePreference (M01 → M02) — language-preference-contract §1; spec-M01 §5.3; DAC-M01-001.
// M01 sở hữu và là writer duy nhất; M02 chỉ đọc qua src/modules/m01/index.ts.
import { z } from 'zod';

export const languageCode = z.enum(['vi', 'en']);

export const languagePreferenceSchema = z.strictObject({ languageCode });

export type LanguageCode = z.infer<typeof languageCode>;
export type LanguagePreference = z.infer<typeof languagePreferenceSchema>;
