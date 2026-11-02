// Nạp dữ liệu cho hook E2E và test (tasks T031: seedContext, seedPackage, failNextActivation).
import { Blob as NodeBlob } from 'node:buffer';
import { describe, expect, it } from 'vitest';
import { publicationFixture } from '../../../shared/contracts/__fixtures__/publication';
import { contextFromSnapshot, packageFromPublication } from '../testing/packageFixture';
import { consumeActivationFailure, failNextActivation } from './faultInjection';
import { readActiveOfflinePackage, readSelectedRouteContext } from './readers';
import { seedContext, seedReadyPackage } from './testSeed';

const blobFor = () => new NodeBlob([new Uint8Array([1, 2, 3])], { type: 'image/png' }) as unknown as Blob;

describe('testSeed', () => {
  it('seedContext ghi context hiện tại', async () => {
    const context = contextFromSnapshot(publicationFixture().snapshots.B);
    await seedContext(context);
    expect(await readSelectedRouteContext()).toEqual({ kind: 'OK', value: context });
  });

  it('seedReadyPackage ghi gói đọc được qua hàm đọc công khai', async () => {
    const { routes, snapshots } = publicationFixture();
    const pkg = packageFromPublication(routes.A, snapshots.A, { versionStatus: 'OUTDATED' });
    await seedReadyPackage(pkg, blobFor);
    expect(await readActiveOfflinePackage('route-a')).toEqual(pkg);
  });

  it('seedReadyPackage thay gói cũ của tuyến', async () => {
    const { routes, snapshots } = publicationFixture();
    await seedReadyPackage(packageFromPublication(routes.A, snapshots.A), blobFor);
    const v2 = { ...packageFromPublication(routes.A, snapshots.A), contentVersion: 2 };
    v2.manifest = { ...v2.manifest, contentVersion: 2 };
    await seedReadyPackage(v2, blobFor);
    expect((await readActiveOfflinePackage('route-a'))?.contentVersion).toBe(2);
  });

  it('seedReadyPackage từ chối gói không qua schema', async () => {
    const { routes, snapshots } = publicationFixture();
    const pkg = { ...packageFromPublication(routes.A, snapshots.A), resources: [] };
    await expect(seedReadyPackage(pkg, blobFor)).rejects.toThrow();
  });

  it('failNextActivation chỉ tác dụng cho một lần kích hoạt', () => {
    expect(consumeActivationFailure()).toBe(false);
    failNextActivation();
    expect(consumeActivationFailure()).toBe(true);
    expect(consumeActivationFailure()).toBe(false);
  });
});
