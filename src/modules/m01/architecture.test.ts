// Ranh giới module M01 (tasks T027; constitution II; FR-M01-013; research R-07).
import { describe, expect, it } from 'vitest';
import * as publicSurface from './index';

const m01Sources = import.meta.glob<string>('./**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true });
const allSources = import.meta.glob<string>('/src/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true });

const M01_STORES = [
  'languagePreference',
  'selectedRouteContext',
  'offlinePackages',
  'offlineResources',
  'activePackages',
  'packageCandidates',
  'imageBytes',
];

const isTest = (path: string) => /\.test\.tsx?$/.test(path);
const importsOf = (source: string) => [...source.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)].map((m) => m[1]!);

describe('kiến trúc M01', () => {
  it('phép quét thấy mã nguồn (glob không rỗng)', () => {
    expect(Object.keys(m01Sources)).toContain('./storage/readers.ts');
    expect(Object.keys(allSources)).toContain('/src/modules/m03/routes.tsx');
  });

  it('src/modules/m01/** không import src/modules/m02 hay m03', () => {
    const offenders = Object.entries(m01Sources).filter(([, source]) =>
      importsOf(source).some((specifier) => /(^|\/)modules\/m0[23](\/|$)|^\.\.\/m0[23](\/|$)/.test(specifier)),
    );
    expect(offenders.map(([path]) => path)).toEqual([]);
  });

  it('index.ts không export gì từ storage/*Writer*', () => {
    const index = m01Sources['./index.ts']!;
    expect(importsOf(index).filter((specifier) => /storage\/.*Writer/i.test(specifier))).toEqual([]);
  });

  it('bề mặt công khai chỉ gồm hàm đọc và M01_HANDOFF_TABLES (tasks T026; US1 thêm phần ngôn ngữ)', () => {
    expect(Object.keys(publicSurface).sort()).toEqual(
      [
        'M01_HANDOFF_TABLES',
        'findOfflineResource',
        'readActiveOfflinePackage',
        'readLanguagePreference',
        'readPackageImage',
        'readSelectedRouteContext',
      ].sort(),
    );
  });

  it('chỉ src/modules/m01/storage/ chạm bảy store của M01', () => {
    const offenders = Object.entries(allSources).filter(([path, source]) => {
      if (isTest(path) || path.startsWith('/src/modules/m01/storage/') || path === '/src/shared/db/visitorDb.ts') return false;
      const touchesTable = M01_STORES.some((store) => new RegExp(`\\.table\\(\\s*['"]${store}['"]`).test(source));
      const importsTables = importsOf(source).some((specifier) => /storage\/tables$/.test(specifier));
      return touchesTable || importsTables;
    });
    expect(offenders.map(([path]) => path)).toEqual([]);
  });
});
