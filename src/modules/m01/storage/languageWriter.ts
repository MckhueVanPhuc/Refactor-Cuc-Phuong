// Ghi LanguagePreference — M01 là writer duy nhất (language-preference-contract §2; BR-M01-001; FR-M01-001).
// Một transaction `put` slot `current`; không đụng gói, context hay phiên M02.
import { languagePreferenceSchema } from '../../../shared/contracts/languagePreference';
import { CURRENT_SLOT } from './rows';
import { languagePreferenceTable } from './tables';

/** Ghi ngôn ngữ đã chọn; giá trị ngoài `vi`/`en` bị từ chối, không ghi (trả `false`). */
export async function writeLanguagePreference(languageCode: unknown): Promise<boolean> {
  const result = languagePreferenceSchema.safeParse({ languageCode });
  if (!result.success) return false;
  await languagePreferenceTable.put({ ...result.data, slot: CURRENT_SLOT });
  return true;
}
