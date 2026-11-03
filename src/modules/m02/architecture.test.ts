// Ranh giới module M02 (tasks T017; FR-M02-020; constitution II; research R-05).
import { describe, expect, it } from 'vitest';
import * as fakePort from './testing/fakeM01Port';
import * as port from './m01Port';

const m02Sources = import.meta.glob<string>('./**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true });

const M01_STORES = [
  'languagePreference',
  'selectedRouteContext',
  'offlinePackages',
  'offlineResources',
  'activePackages',
  'packageCandidates',
  'imageBytes',
];

const importsOf = (source: string) => [...source.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)].map((m) => m[1]!);
const ownSources = () => Object.entries(m02Sources).filter(([path]) => path !== './architecture.test.ts');

describe('kiến trúc M02', () => {
  it('phép quét thấy mã nguồn (glob không rỗng)', () => {
    expect(Object.keys(m02Sources)).toContain('./m01Port.ts');
  });

  it('chỉ m01Port.ts import src/modules/m01, và chỉ qua index.ts', () => {
    const offenders = ownSources().flatMap(([path, source]) =>
      importsOf(source)
        .filter((specifier) => /(^|\/)m01(\/|$)/.test(specifier))
        .filter((specifier) => path !== './m01Port.ts' || specifier !== '../m01/index')
        .map((specifier) => `${path} → ${specifier}`),
    );
    expect(offenders).toEqual([]);
  });

  it('không file nào import src/modules/m03', () => {
    const offenders = ownSources().filter(([, source]) => importsOf(source).some((specifier) => /(^|\/)m03(\/|$)/.test(specifier)));
    expect(offenders.map(([path]) => path)).toEqual([]);
  });

  it('không file nào mở bảng của M01 (M02 không ghi store của M01)', () => {
    const offenders = ownSources().filter(([, source]) =>
      M01_STORES.some((store) => new RegExp(`\\.table\\(\\s*['"]${store}['"]`).test(source)),
    );
    expect(offenders.map(([path]) => path)).toEqual([]);
  });

  it('bản giả của cổng có đủ mọi export của m01Port.ts', () => {
    expect(Object.keys(fakePort)).toEqual(expect.arrayContaining(Object.keys(port)));
  });
});
