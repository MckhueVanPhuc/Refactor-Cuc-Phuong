// JourneySnapshot (M03 → M01) — publication-public-contract §3; spec-M03 §5.1.
// Không có audio/video trong snapshot (BR-M03-E04): schema strict nên trường lạ bị từ chối.
import { z } from 'zod';
import {
  bilingualText,
  connectivityMode,
  hasDuplicates,
  identifier,
  imageRef,
  localizedIntroduction,
  nonEmptyText,
  positiveInt,
  utcDateTime,
} from './common';

export const offlineResource = z.strictObject({
  qrIdentifier: identifier,
  objectName: bilingualText,
  localizedContent: localizedIntroduction,
  staticImages: z.array(nonEmptyText),
});

export const snapshotCheckpoint = z
  .strictObject({
    checkpointId: identifier,
    sequence: positiveInt,
    checkpointName: bilingualText,
    connectivityMode,
    qrIdentifiers: z.array(identifier).min(1),
    offlineResources: z.array(offlineResource).optional(),
  })
  .superRefine((checkpoint, ctx) => {
    if (hasDuplicates(checkpoint.qrIdentifiers)) {
      ctx.addIssue({ code: 'custom', path: ['qrIdentifiers'], message: 'qrIdentifier bị lặp' });
    }
    const resources = checkpoint.offlineResources;
    if (checkpoint.connectivityMode === 'ONLINE_AVAILABLE') {
      if (resources !== undefined) {
        ctx.addIssue({ code: 'custom', path: ['offlineResources'], message: 'chỉ có khi OFFLINE_REQUIRED' });
      }
      return;
    }
    // OFFLINE_REQUIRED: đúng một resource cho mỗi qrIdentifier của điểm dừng
    const resourceIds = (resources ?? []).map((r) => r.qrIdentifier);
    const matches =
      resources !== undefined &&
      !hasDuplicates(resourceIds) &&
      resourceIds.length === checkpoint.qrIdentifiers.length &&
      resourceIds.every((id) => checkpoint.qrIdentifiers.includes(id));
    if (!matches) {
      ctx.addIssue({
        code: 'custom',
        path: ['offlineResources'],
        message: 'phải có đúng một phần tử cho mỗi qrIdentifier',
      });
    }
  });

export const journeySnapshotSchema = z
  .strictObject({
    routeId: identifier,
    contentVersion: positiveInt,
    status: z.literal('DA_CONG_BO'),
    publishedAt: utcDateTime,
    previousContentVersion: positiveInt.optional(),
    estimatedOfflineSizeBytes: z.number().int().min(0).optional(),
    offlineRouteMap: imageRef.optional(),
    checkpoints: z.array(snapshotCheckpoint),
  })
  .superRefine((snapshot, ctx) => {
    const previous = snapshot.previousContentVersion;
    if (previous !== undefined && previous !== snapshot.contentVersion - 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['previousContentVersion'],
        message: 'vắng ở version 1, ngược lại bằng contentVersion - 1',
      });
    }
    if (hasDuplicates(snapshot.checkpoints.map((c) => c.checkpointId))) {
      ctx.addIssue({ code: 'custom', path: ['checkpoints'], message: 'checkpointId bị lặp' });
    }
    if (hasDuplicates(snapshot.checkpoints.map((c) => c.sequence))) {
      ctx.addIssue({ code: 'custom', path: ['checkpoints'], message: 'sequence bị lặp' });
    }
    const offlineIds = snapshot.checkpoints.flatMap((c) => (c.offlineResources ?? []).map((r) => r.qrIdentifier));
    if (hasDuplicates(offlineIds)) {
      ctx.addIssue({ code: 'custom', path: ['checkpoints'], message: 'qrIdentifier của offline resource bị lặp' });
    }
  });

export type JourneySnapshot = z.infer<typeof journeySnapshotSchema>;
export type SnapshotCheckpoint = z.infer<typeof snapshotCheckpoint>;
export type OfflineResource = z.infer<typeof offlineResource>;
