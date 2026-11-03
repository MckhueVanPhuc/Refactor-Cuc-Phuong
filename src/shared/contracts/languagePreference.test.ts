import { describe, expect, it } from 'vitest';
import { languagePreferenceSchema } from './languagePreference';

describe('LanguagePreference (DAC-M01-001; BR-M01-001)', () => {
  it.each(['vi', 'en'])('nhận %s', (languageCode) => {
    expect(languagePreferenceSchema.safeParse({ languageCode }).success).toBe(true);
  });

  it.each(['fr', 'VI', 'vi-VN', '', null, undefined, 1])('từ chối %s', (languageCode) => {
    expect(languagePreferenceSchema.safeParse({ languageCode }).success).toBe(false);
  });

  it('từ chối trường lạ (slot là biểu diễn vật lý, không thuộc contract)', () => {
    expect(languagePreferenceSchema.safeParse({ languageCode: 'vi', slot: 'current' }).success).toBe(false);
  });
});
