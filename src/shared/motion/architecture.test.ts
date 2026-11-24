// Ranh giới chuyển động dùng chung (specs/006 T009; contracts/motion-ui-contract.md §2): không biết module hay app;
// module chỉ dùng qua public entry `src/shared/motion/index.ts`.
import { describe, expect, it } from 'vitest';

const motionSources = import.meta.glob<string>('./**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true });
const moduleSources = import.meta.glob<string>('../../modules/{m01,m02}/**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const isTest = (path: string) => /\.test\.tsx?$/.test(path);
const importsOf = (source: string) => [...source.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)].map((m) => m[1]!);

describe('kiến trúc chuyển động', () => {
  it('phép quét thấy mã nguồn', () => {
    expect(Object.keys(motionSources)).toContain('./level.ts');
  });

  it('src/shared/motion không import src/modules hay src/app', () => {
    const offenders = Object.entries(motionSources)
      .filter(([path]) => !isTest(path))
      .flatMap(([path, source]) =>
        importsOf(source)
          .filter((specifier) => /(^|\/)(modules|app)(\/|$)/.test(specifier))
          .map((specifier) => `${path} → ${specifier}`),
      );
    expect(offenders).toEqual([]);
  });

  it('M01, M02 chỉ import chuyển động qua public entry index', () => {
    const offenders = Object.entries(moduleSources)
      .filter(([path]) => !isTest(path))
      .flatMap(([path, source]) =>
        importsOf(source)
          .filter((specifier) => /shared\/motion\//.test(specifier) && !/shared\/motion\/index$/.test(specifier))
          .map((specifier) => `${path} → ${specifier}`),
      );
    expect(offenders).toEqual([]);
  });
});
