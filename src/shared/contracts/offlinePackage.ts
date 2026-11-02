// ready OfflinePackage và OfflineResource (M01 → M02) — offline-package-contract §1; spec-M01 §5.3;
// DAC-M01-008…015. M01 sở hữu. Giá trị trả cho M02 luôn `SAN_SANG` (hàm đọc của M01 bảo đảm).
// Không thêm vào barrel index.ts: journeySnapshot.ts đã export kiểu `OfflineResource` của snapshot (tên theo spec
// ở cả hai phía), nên file này được import trực tiếp (validation-report M01 DV-07).
// Không kiểm giới hạn độ dài provisional của M03 (spec-M03 §5.3; research M01 R-04).
import { z } from 'zod';
import { bilingualText, hasDuplicates, identifier, imageRef, localizedIntroduction, nonEmptyText, utcDateTime } from './common';
import { journeyManifestSchema } from './journeyManifest';

export const packageStatus = z.enum(['CHUA_TAI', 'DANG_TAI', 'SAN_SANG', 'CHUA_HOAN_TAT']);
export const versionStatus = z.enum(['CURRENT', 'OUTDATED']);

export const offlineResourceSchema = z.strictObject({
  qrIdentifier: identifier,
  checkpointId: identifier,
  objectName: bilingualText,
  localizedContent: localizedIntroduction,
  // Có thể rỗng; byte của mọi phần tử có trong gói sẵn sàng (hàm đọc kiểm)
  staticImages: z.array(nonEmptyText),
});

/** Bản sao chữ cốt lõi của tuyến theo thời điểm; chỉ text, không ảnh (spec-M01 §5.3). */
export const routeEssentialsSchema = z.strictObject({
  capturedAt: utcDateTime,
  name: bilingualText,
  startingPoint: bilingualText,
  participationRequirements: bilingualText.optional(),
  safetyWarning: bilingualText.optional(),
});

export const offlinePackageSchema = z
  .strictObject({
    routeId: identifier,
    contentVersion: z.number().int(),
    status: packageStatus,
    versionStatus: versionStatus.optional(),
    manifest: journeyManifestSchema,
    resources: z.array(offlineResourceSchema),
    offlineRouteMap: imageRef.optional(),
    routeEssentials: routeEssentialsSchema,
    downloadedAt: utcDateTime.optional(),
  })
  .superRefine((pkg, ctx) => {
    if (pkg.status === 'SAN_SANG' && pkg.versionStatus === undefined) {
      ctx.addIssue({ code: 'custom', path: ['versionStatus'], message: 'bắt buộc khi SAN_SANG' });
    }
    if (pkg.manifest.routeId !== pkg.routeId) {
      ctx.addIssue({ code: 'custom', path: ['manifest', 'routeId'], message: 'phải bằng routeId' });
    }
    if (pkg.manifest.contentVersion !== pkg.contentVersion) {
      ctx.addIssue({ code: 'custom', path: ['manifest', 'contentVersion'], message: 'phải bằng contentVersion' });
    }

    // Đúng một resource cho mỗi QR của mỗi checkpoint OFFLINE_REQUIRED, không có cho ONLINE_AVAILABLE
    const holderOf = new Map<string, string>();
    for (const checkpoint of pkg.manifest.checkpoints) {
      if (checkpoint.connectivityMode !== 'OFFLINE_REQUIRED') continue;
      for (const qrIdentifier of checkpoint.qrIdentifiers) holderOf.set(qrIdentifier, checkpoint.checkpointId);
    }
    const resourceIds = pkg.resources.map((r) => r.qrIdentifier);
    if (hasDuplicates(resourceIds)) {
      ctx.addIssue({ code: 'custom', path: ['resources'], message: 'qrIdentifier bị lặp trong gói' });
    }
    if (resourceIds.length !== holderOf.size || resourceIds.some((id) => !holderOf.has(id))) {
      ctx.addIssue({
        code: 'custom',
        path: ['resources'],
        message: 'phải có đúng một resource cho mỗi QR của checkpoint OFFLINE_REQUIRED',
      });
    }
    pkg.resources.forEach((resource, index) => {
      const holder = holderOf.get(resource.qrIdentifier);
      if (holder !== undefined && holder !== resource.checkpointId) {
        ctx.addIssue({
          code: 'custom',
          path: ['resources', index, 'checkpointId'],
          message: 'phải là checkpoint OFFLINE_REQUIRED chứa QR đó',
        });
      }
    });
  });

export type PackageStatus = z.infer<typeof packageStatus>;
export type VersionStatus = z.infer<typeof versionStatus>;
export type OfflineResource = z.infer<typeof offlineResourceSchema>;
export type RouteEssentials = z.infer<typeof routeEssentialsSchema>;
export type OfflinePackage = z.infer<typeof offlinePackageSchema>;
