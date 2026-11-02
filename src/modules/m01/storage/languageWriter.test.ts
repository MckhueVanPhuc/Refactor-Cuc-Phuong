// Ghi LanguagePreference (tasks T034; BR-M01-001; DAC-M01-001; US-M01-01 mục 2).
import { Blob as NodeBlob } from 'node:buffer';
import { describe, expect, it } from 'vitest';
import { publicationFixture } from '../../../shared/contracts/__fixtures__/publication';
import { visitorDb } from '../../../shared/db/visitorDb';
import { contextFromSnapshot, packageFromPublication } from '../testing/packageFixture';
import { writeLanguagePreference } from './languageWriter';
import { readActiveOfflinePackage, readLanguagePreference, readSelectedRouteContext } from './readers';
import { seedContext, seedReadyPackage } from './testSeed';

describe('writeLanguagePreference', () => {
  it.each(['vi', 'en'] as const)('ghi %s vào slot current', async (languageCode) => {
    expect(await writeLanguagePreference(languageCode)).toBe(true);
    expect(await readLanguagePreference()).toEqual({ languageCode });
    expect(await visitorDb.table('languagePreference').get('current')).toEqual({ slot: 'current', languageCode });
  });

  it('thay giá trị cũ, chỉ một dòng', async () => {
    await writeLanguagePreference('vi');
    await writeLanguagePreference('en');
    expect(await visitorDb.table('languagePreference').count()).toBe(1);
    expect(await readLanguagePreference()).toEqual({ languageCode: 'en' });
  });

  it.each(['fr', 'VI', '', null, 1])('giá trị khác bị từ chối, không ghi: %s', async (value) => {
    await writeLanguagePreference('vi');
    expect(await writeLanguagePreference(value)).toBe(false);
    expect(await readLanguagePreference()).toEqual({ languageCode: 'vi' });
  });

  it('đổi ngôn ngữ không đổi gói hay context (US-M01-01 mục 2)', async () => {
    const { routes, snapshots } = publicationFixture();
    const pkg = packageFromPublication(routes.A, snapshots.A);
    const context = contextFromSnapshot(snapshots.A);
    await seedReadyPackage(pkg, () => new NodeBlob([new Uint8Array([1])], { type: 'image/png' }) as unknown as Blob);
    await seedContext(context);
    await writeLanguagePreference('en');
    await writeLanguagePreference('vi');
    expect(await readActiveOfflinePackage('route-a')).toEqual(pkg);
    expect(await readSelectedRouteContext()).toEqual({ kind: 'OK', value: context });
  });
});
