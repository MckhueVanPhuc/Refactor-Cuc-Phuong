// Contract test ready OfflinePackage / OfflineResource (quickstart M01 V26; DAC-M01-008…015).
import { describe, expect, it } from 'vitest';
import { offlinePackageSchema, offlineResourceSchema, type OfflinePackage } from './offlinePackage';

function validPackage(): OfflinePackage {
  return {
    routeId: 'r1',
    contentVersion: 2,
    status: 'SAN_SANG',
    versionStatus: 'CURRENT',
    manifest: {
      routeId: 'r1',
      contentVersion: 2,
      checkpoints: [
        {
          checkpointId: 'c1',
          sequence: 1,
          checkpointName: { vi: 'Điểm 1', en: 'Stop 1' },
          connectivityMode: 'OFFLINE_REQUIRED',
          qrIdentifiers: ['q1', 'q2'],
        },
        {
          checkpointId: 'c2',
          sequence: 3,
          checkpointName: { vi: 'Điểm 2', en: 'Stop 2' },
          connectivityMode: 'ONLINE_AVAILABLE',
          qrIdentifiers: ['q3'],
        },
      ],
    },
    resources: [
      {
        qrIdentifier: 'q1',
        checkpointId: 'c1',
        objectName: { vi: 'Đối tượng 1', en: 'Object 1' },
        localizedContent: { vi: { introductionText: 'Giới thiệu' }, en: { introductionText: 'Intro' } },
        staticImages: ['media/1.png'],
      },
      {
        qrIdentifier: 'q2',
        checkpointId: 'c1',
        objectName: { vi: 'Đối tượng 2', en: 'Object 2' },
        localizedContent: { vi: { introductionText: 'Giới thiệu' }, en: { introductionText: 'Intro' } },
        staticImages: [],
      },
    ],
    offlineRouteMap: { sourceRef: 'media/map.png', caption: { vi: 'Sơ đồ', en: 'Map' } },
    routeEssentials: {
      capturedAt: '2026-11-02T01:00:00.000Z',
      name: { vi: 'Tuyến', en: 'Route' },
      startingPoint: { vi: 'Cổng', en: 'Gate' },
      participationRequirements: { vi: 'Yêu cầu', en: 'Requirements' },
      safetyWarning: { vi: 'Cảnh báo', en: 'Warning' },
    },
    downloadedAt: '2026-11-02T01:00:05.000Z',
  };
}

const parse = (value: unknown) => offlinePackageSchema.safeParse(value);

describe('OfflinePackage', () => {
  it('nhận gói SAN_SANG đầy đủ', () => {
    expect(parse(validPackage()).success).toBe(true);
  });

  it('nhận gói tối thiểu: không có OFFLINE_REQUIRED → resources rỗng; không sơ đồ; không trường Optional', () => {
    const pkg = validPackage();
    pkg.manifest.checkpoints[0]!.connectivityMode = 'ONLINE_AVAILABLE';
    pkg.resources = [];
    delete pkg.offlineRouteMap;
    delete pkg.downloadedAt;
    delete pkg.routeEssentials.participationRequirements;
    delete pkg.routeEssentials.safetyWarning;
    expect(parse(pkg).success).toBe(true);
  });

  it('versionStatus bắt buộc khi SAN_SANG (DAC-M01-009)', () => {
    const pkg: Partial<OfflinePackage> = validPackage();
    delete pkg.versionStatus;
    expect(parse(pkg).success).toBe(false);
  });

  it('nhận OUTDATED', () => {
    expect(parse({ ...validPackage(), versionStatus: 'OUTDATED' }).success).toBe(true);
  });

  it.each(['CHUA_TAI', 'DANG_TAI', 'CHUA_HOAN_TAT'])('status %s không bắt versionStatus', (status) => {
    const pkg: Partial<OfflinePackage> = { ...validPackage(), status: status as OfflinePackage['status'] };
    delete pkg.versionStatus;
    expect(parse(pkg).success).toBe(true);
  });

  it('status ngoài enum bị từ chối', () => {
    expect(parse({ ...validPackage(), status: 'READY' }).success).toBe(false);
  });

  it.each([
    ['manifest.routeId', (pkg: OfflinePackage) => (pkg.manifest.routeId = 'r2')],
    ['manifest.contentVersion', (pkg: OfflinePackage) => (pkg.manifest.contentVersion = 1)],
  ])('%s lệch giá trị ngoài bị từ chối (DAC-M01-008)', (_label, mutate) => {
    const pkg = validPackage();
    mutate(pkg);
    expect(parse(pkg).success).toBe(false);
  });

  it('thiếu resource cho một QR của checkpoint OFFLINE_REQUIRED bị từ chối (DAC-M01-014)', () => {
    const pkg = validPackage();
    pkg.resources.pop();
    expect(parse(pkg).success).toBe(false);
  });

  it('resource thừa cho QR của checkpoint ONLINE_AVAILABLE bị từ chối (DAC-M01-014)', () => {
    const pkg = validPackage();
    pkg.resources.push({ ...structuredClone(pkg.resources[0]!), qrIdentifier: 'q3', checkpointId: 'c2' });
    expect(parse(pkg).success).toBe(false);
  });

  it('resource cho QR không có trong manifest bị từ chối', () => {
    const pkg = validPackage();
    pkg.resources[1]!.qrIdentifier = 'q-unknown';
    expect(parse(pkg).success).toBe(false);
  });

  it('qrIdentifier lặp trong gói bị từ chối', () => {
    const pkg = validPackage();
    pkg.resources[1]!.qrIdentifier = 'q1';
    expect(parse(pkg).success).toBe(false);
  });

  it('resource.checkpointId không phải checkpoint chứa QR đó bị từ chối', () => {
    const pkg = validPackage();
    pkg.resources[0]!.checkpointId = 'c2';
    expect(parse(pkg).success).toBe(false);
  });

  it('manifest có checkpointId hoặc sequence lặp bị từ chối', () => {
    const duplicateId = validPackage();
    duplicateId.manifest.checkpoints[1]!.checkpointId = 'c1';
    expect(parse(duplicateId).success).toBe(false);
    const duplicateSequence = validPackage();
    duplicateSequence.manifest.checkpoints[1]!.sequence = 1;
    expect(parse(duplicateSequence).success).toBe(false);
  });

  it('offlineRouteMap.caption both-or-none (DAC-M01-010)', () => {
    const pkg: Record<string, unknown> = validPackage();
    pkg.offlineRouteMap = { sourceRef: 'media/map.png', caption: { vi: 'Sơ đồ' } };
    expect(parse(pkg).success).toBe(false);
  });

  it('offlineRouteMap thiếu sourceRef bị từ chối', () => {
    expect(parse({ ...validPackage(), offlineRouteMap: {} }).success).toBe(false);
  });

  it.each(['name', 'startingPoint'])('routeEssentials.%s thiếu một ngôn ngữ bị từ chối (DAC-M01-011)', (field) => {
    const pkg = validPackage();
    (pkg.routeEssentials as Record<string, unknown>)[field] = { vi: 'Chỉ tiếng Việt' };
    expect(parse(pkg).success).toBe(false);
  });

  it.each(['participationRequirements', 'safetyWarning'])('routeEssentials.%s both-or-none', (field) => {
    const pkg = validPackage();
    (pkg.routeEssentials as Record<string, unknown>)[field] = { en: 'Only English' };
    expect(parse(pkg).success).toBe(false);
  });

  it('routeEssentials thiếu capturedAt bị từ chối', () => {
    const pkg = validPackage();
    delete (pkg.routeEssentials as Partial<OfflinePackage['routeEssentials']>).capturedAt;
    expect(parse(pkg).success).toBe(false);
  });

  it('routeEssentials không chứa ảnh', () => {
    const pkg = validPackage();
    (pkg.routeEssentials as Record<string, unknown>).thumbnail = { sourceRef: 'media/t.png' };
    expect(parse(pkg).success).toBe(false);
  });

  it.each(['routeId', 'contentVersion', 'status', 'manifest', 'resources', 'routeEssentials'])(
    'thiếu trường Required %s bị từ chối',
    (field) => {
      const pkg: Record<string, unknown> = validPackage();
      delete pkg[field];
      expect(parse(pkg).success).toBe(false);
    },
  );
});

describe('OfflineResource', () => {
  const resource = () => structuredClone(validPackage().resources[0]!);

  it('nhận resource hợp lệ, staticImages có thể rỗng', () => {
    expect(offlineResourceSchema.safeParse({ ...resource(), staticImages: [] }).success).toBe(true);
  });

  it('localizedContent thiếu một nhánh ngôn ngữ bị từ chối (DAC-M01-015)', () => {
    expect(
      offlineResourceSchema.safeParse({ ...resource(), localizedContent: { vi: { introductionText: 'x' } } }).success,
    ).toBe(false);
  });

  it('objectName rỗng bị từ chối', () => {
    expect(offlineResourceSchema.safeParse({ ...resource(), objectName: { vi: '', en: 'x' } }).success).toBe(false);
  });

  it('staticImages chứa chuỗi rỗng bị từ chối', () => {
    expect(offlineResourceSchema.safeParse({ ...resource(), staticImages: [''] }).success).toBe(false);
  });
});
