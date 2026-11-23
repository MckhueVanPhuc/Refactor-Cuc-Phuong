// Ranh giới của mascot Mila (specs/005 tasks T006; research R-02; MAS-TC-043). Engine dùng chung không biết module nào;
// module chỉ dùng mascot qua public entry `src/shared/mascot/index.ts`. Glob được Vite cache theo nội dung file test.
import { describe, expect, it } from 'vitest';

const mascotSources = import.meta.glob<string>('./**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true });
const moduleSources = import.meta.glob<string>('../../modules/{m01,m02}/**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const isTest = (path: string) => /\.test\.tsx?$/.test(path);
const importsOf = (source: string) => [...source.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)].map((m) => m[1]!);

describe('kiến trúc mascot', () => {
  it('phép quét thấy mã nguồn', () => {
    expect(Object.keys(mascotSources)).toContain('./events.ts');
  });

  it('src/shared/mascot không import src/modules hay src/app', () => {
    const offenders = Object.entries(mascotSources)
      .filter(([path]) => !isTest(path))
      .flatMap(([path, source]) =>
        importsOf(source)
          .filter((specifier) => /(^|\/)(modules|app)(\/|$)/.test(specifier))
          .map((specifier) => `${path} → ${specifier}`),
      );
    expect(offenders).toEqual([]);
  });

  it('M01, M02 chỉ import mascot qua public entry index', () => {
    const offenders = Object.entries(moduleSources)
      .filter(([path]) => !isTest(path))
      .flatMap(([path, source]) =>
        importsOf(source)
          .filter((specifier) => /shared\/mascot\//.test(specifier) && !/shared\/mascot\/index$/.test(specifier))
          .map((specifier) => `${path} → ${specifier}`),
      );
    expect(offenders).toEqual([]);
  });
});
