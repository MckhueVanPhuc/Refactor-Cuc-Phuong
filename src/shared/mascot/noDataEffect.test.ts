// BR-MAS-01 (Mila không ghi dữ liệu nào) và BR-MAS-18 (không gửi sự kiện ra ngoài, không analytics)
// (specs/005 tasks T073; glob được Vite cache theo nội dung file test). Quét mã nguồn của engine và host: không API lưu trữ, không mạng, không import tầng dữ liệu.
import { describe, expect, it } from 'vitest';

const shared = import.meta.glob<string>('./**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true });
const host = import.meta.glob<string>('../../app/mascot/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true });

const FORBIDDEN_API = [/\bindexedDB\b/, /\bDexie\b/, /\.table\(/, /\blocalStorage\b/, /\bsessionStorage\b/, /\bcaches\./, /\bfetch\(/, /\bsendBeacon\b/, /\bXMLHttpRequest\b/];
const FORBIDDEN_IMPORT = [/shared\/db\//, /shared\/supabase\//, /app\/analytics\//, /@vercel\/analytics/, /@vercel\/speed-insights/];

const importsOf = (source: string) => [...source.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)].map((m) => m[1]!);
const production = (files: Record<string, string>) => Object.entries(files).filter(([path]) => !/\.test\.tsx?$/.test(path));

describe('Mila không ghi dữ liệu, không gửi gì ra ngoài', () => {
  const files = [...production(shared), ...production(host)];

  it('có mã nguồn để quét', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('không dùng API lưu trữ hay mạng', () => {
    const offenders = files.flatMap(([path, source]) => FORBIDDEN_API.filter((re) => re.test(source)).map((re) => `${path}: ${re}`));
    expect(offenders).toEqual([]);
  });

  it('không import tầng dữ liệu, Supabase hay analytics', () => {
    const offenders = files.flatMap(([path, source]) =>
      importsOf(source)
        .filter((specifier) => FORBIDDEN_IMPORT.some((re) => re.test(specifier)))
        .map((specifier) => `${path} → ${specifier}`),
    );
    expect(offenders).toEqual([]);
  });
});
