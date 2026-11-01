// CommandResult — admin-command-contract §2 (plan decision R-06).
// Lỗi transport (MSG-NETWORK-FAILED, MSG-SESSION-EXPIRED, MSG-GENERIC) do adapter tạo, không nằm trong union.
import { z } from 'zod';
import { utcDateTime } from '../../../shared/contracts/common';
import { MESSAGE_KEYS, type MessageKey } from '../messages/catalog';
import { validationIssueSchema, type ValidationIssue } from './validationIssue';

const messageKey = z.enum(MESSAGE_KEYS as [MessageKey, ...MessageKey[]]);

/** Giá trị hiển thị thường — không bao giờ là id hay mã (BR-M03-L10, L13) */
const displayValues = z.record(z.string(), z.union([z.string(), z.number()]));

const failureSchemas = [
  z.strictObject({
    ok: z.literal(false),
    reason: z.literal('VALIDATION'),
    messageKey,
    issues: z.array(validationIssueSchema),
  }),
  z.strictObject({
    ok: z.literal(false),
    reason: z.literal('STALE'),
    messageKey: z.literal('MSG-STALE'),
    stale: z.strictObject({ editorEmail: z.string().min(1), editedAt: utcDateTime }),
  }),
  z.strictObject({
    ok: z.literal(false),
    reason: z.literal('BUSY'),
    messageKey: z.literal('MSG-ROUTE-BUSY'),
    busy: z.strictObject({ itemName: z.string().min(1) }),
  }),
  z.strictObject({ ok: z.literal(false), reason: z.literal('FORBIDDEN'), messageKey: z.literal('MSG-NO-PERMISSION') }),
  z.strictObject({
    ok: z.literal(false),
    reason: z.literal('BLOCKED'),
    messageKey,
    values: displayValues,
    issues: z.array(validationIssueSchema).optional(),
  }),
  z.strictObject({
    ok: z.literal(false),
    reason: z.literal('FAILED'),
    messageKey: z.enum(['MSG-PUBLISH-FAILED', 'MSG-CLOSE-FAILED', 'MSG-GENERIC']),
  }),
] as const;

export const commandFailureSchema = z.discriminatedUnion('reason', [...failureSchemas]);

export type CommandFailure = z.infer<typeof commandFailureSchema>;
export type CommandFailureReason = CommandFailure['reason'];

export type CommandSuccess<T> = { ok: true; messageKey: MessageKey; data: T };
export type CommandResult<T> = CommandSuccess<T> | CommandFailure;

/** Schema của `CommandResult<T>` với `data` theo `dataSchema`. */
export function commandResultSchema<T extends z.ZodType>(dataSchema: T) {
  return z.union([
    z.strictObject({ ok: z.literal(true), messageKey, data: dataSchema }),
    commandFailureSchema,
  ]);
}

export type { ValidationIssue };
