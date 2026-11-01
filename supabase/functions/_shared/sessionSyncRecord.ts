// SessionSyncRecord (M02 → M03, transport; lưu thành SessionRecord) — session-intake-contract §1.
// Allowlist: `.strict()` ở gốc và phần tử; không tên, tài khoản, thiết bị hay GPS (BR-M03-J01).
// Edge `session-intake` dùng bản sao của schema này (supabase/functions/_shared).
import { z } from 'zod';
import { hasDuplicates, identifier, nonEmptyText, positiveInt, utcDateTime } from './common.ts';

export const visitedCheckpoint = z.strictObject({
  checkpointId: identifier,
  checkpointName: nonEmptyText,
  sequence: positiveInt,
  checkedInAt: utcDateTime,
});

export const sessionSyncRecordSchema = z
  .strictObject({
    sessionId: z.uuid(),
    routeId: identifier,
    contentVersion: positiveInt,
    startedAt: utcDateTime,
    endedAt: utcDateTime,
    status: z.enum(['HOAN_TAT', 'BO_DO']),
    visitedCheckpoints: z.array(visitedCheckpoint),
  })
  .superRefine((record, ctx) => {
    const startedAt = Date.parse(record.startedAt);
    const endedAt = Date.parse(record.endedAt);
    if (endedAt < startedAt) {
      ctx.addIssue({ code: 'custom', path: ['endedAt'], message: 'phải không sớm hơn startedAt' });
    }
    if (hasDuplicates(record.visitedCheckpoints.map((v) => v.checkpointId))) {
      ctx.addIssue({ code: 'custom', path: ['visitedCheckpoints'], message: 'checkpointId bị lặp' });
    }
    record.visitedCheckpoints.forEach((visit, index) => {
      const checkedInAt = Date.parse(visit.checkedInAt);
      if (checkedInAt < startedAt || checkedInAt > endedAt) {
        ctx.addIssue({
          code: 'custom',
          path: ['visitedCheckpoints', index, 'checkedInAt'],
          message: 'phải nằm trong [startedAt, endedAt]',
        });
      }
    });
  });

export type SessionSyncRecord = z.infer<typeof sessionSyncRecordSchema>;
export type VisitedCheckpoint = z.infer<typeof visitedCheckpoint>;
