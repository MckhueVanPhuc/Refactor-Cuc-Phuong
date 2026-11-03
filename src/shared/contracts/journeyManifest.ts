// Manifest hành trình dùng chung của `SelectedRouteContext v3.routeJourneyManifest` và `OfflinePackage.manifest`
// (spec-M01 §5.3: cùng một bản chiếu giá trị của JourneySnapshot, không phải entity M03 mới). M01 sở hữu.
import { z } from 'zod';
import { bilingualText, connectivityMode, hasDuplicates, identifier } from './common';

export const manifestCheckpointSchema = z.strictObject({
  checkpointId: identifier,
  sequence: z.number().int(),
  checkpointName: bilingualText,
  connectivityMode,
  qrIdentifiers: z.array(identifier).min(1),
});

export const journeyManifestSchema = z
  .strictObject({
    routeId: identifier,
    contentVersion: z.number().int(),
    checkpoints: z.array(manifestCheckpointSchema),
  })
  .superRefine((manifest, ctx) => {
    if (hasDuplicates(manifest.checkpoints.map((c) => c.checkpointId))) {
      ctx.addIssue({ code: 'custom', path: ['checkpoints'], message: 'checkpointId bị lặp' });
    }
    // Duy nhất trong manifest; cho phép khoảng trống
    if (hasDuplicates(manifest.checkpoints.map((c) => c.sequence))) {
      ctx.addIssue({ code: 'custom', path: ['checkpoints'], message: 'sequence bị lặp' });
    }
  });

export type ManifestCheckpoint = z.infer<typeof manifestCheckpointSchema>;
export type JourneyManifest = z.infer<typeof journeyManifestSchema>;
