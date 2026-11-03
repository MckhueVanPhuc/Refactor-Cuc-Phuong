// Kiểu dòng Dexie của ba store M02 (data-model §2; Physical §11; DAC-M02-001–005, 007, 010).
// Writer của M02 validate dòng bằng các schema này trước khi ghi; hàm đọc tin dòng vì chỉ writer M02 ghi các store này.
import { z } from 'zod';
import { hasDuplicates, identifier, utcDateTime } from '../../../shared/contracts/common';
import { manifestCheckpointSchema } from '../../../shared/contracts/journeyManifest';
import { sessionSyncRecordSchema } from '../../../shared/contracts/sessionSyncRecord';

export const sessionStatus = z.enum(['DANG_DIEN_RA', 'HOAN_TAT', 'BO_DO']);
export const syncStatus = z.enum(['PENDING', 'SYNCED', 'CONFLICT']);

/** PlaySession — `journeyCheckpoints` là bản sao giá trị của `routeJourneyManifest.checkpoints` (DAC-M02-004). */
export const playSessionRowSchema = z
  .strictObject({
    sessionId: z.uuid(),
    sourceHandoffId: z.uuid(),
    routeId: identifier,
    contentVersion: z.number().int(),
    journeyCheckpoints: z.array(manifestCheckpointSchema),
    status: sessionStatus,
    startedAt: utcDateTime,
    endedAt: utcDateTime.optional(),
  })
  .superRefine((row, ctx) => {
    // `endedAt` có ⇔ trạng thái terminal (DAC-M02-003)
    if ((row.status === 'DANG_DIEN_RA') !== (row.endedAt === undefined)) {
      ctx.addIssue({ code: 'custom', path: ['endedAt'], message: 'có khi và chỉ khi HOAN_TAT/BO_DO' });
    }
    if (hasDuplicates(row.journeyCheckpoints.map((c) => c.checkpointId))) {
      ctx.addIssue({ code: 'custom', path: ['journeyCheckpoints'], message: 'checkpointId bị lặp' });
    }
    if (hasDuplicates(row.journeyCheckpoints.map((c) => c.sequence))) {
      ctx.addIssue({ code: 'custom', path: ['journeyCheckpoints'], message: 'sequence bị lặp' });
    }
  });

/** CheckpointVisit — identity `(sessionId, checkpointId)`; `qrIdentifier` là mã của lần quét được chấp nhận đầu tiên. */
export const checkpointVisitRowSchema = z.strictObject({
  sessionId: z.uuid(),
  checkpointId: identifier,
  qrIdentifier: identifier,
  checkedInAt: utcDateTime,
});

/** PendingSyncItem — `record` bất biến; chỉ `syncStatus` đổi (DAC-M02-007, 010). */
export const pendingSyncItemRowSchema = z
  .strictObject({
    sessionId: z.uuid(),
    record: sessionSyncRecordSchema,
    syncStatus,
  })
  .refine((row) => row.sessionId === row.record.sessionId, { path: ['sessionId'], message: 'phải bằng record.sessionId' });

export type SessionStatus = z.infer<typeof sessionStatus>;
export type SyncStatus = z.infer<typeof syncStatus>;
export type PlaySessionRow = z.infer<typeof playSessionRowSchema>;
export type CheckpointVisitRow = z.infer<typeof checkpointVisitRowSchema>;
export type PendingSyncItemRow = z.infer<typeof pendingSyncItemRowSchema>;
