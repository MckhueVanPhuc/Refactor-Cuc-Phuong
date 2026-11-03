// Tạo phiên (tasks T030; research R-05, R-06; Physical §11): MỘT transaction `rw` trên ba store M02 và store context
// của M01 (đọc qua m01Port, không ghi). Trong transaction: đọc lại context và phiên, chạy lại bảng quyết định, chỉ chèn
// khi kết quả là tạo phiên. Unique index `sourceHandoffId` là hàng rào cuối giữa các tab (`ConstraintError` = đã dùng).
// Thay phiên (handoff mới khi đang có phiên) mở rộng ở T071; tới lúc đó kết quả `REPLACE` được trả lại, không ghi gì.
import { visitorDb } from '../../../shared/db/visitorDb';
import { M01_HANDOFF_TABLES, readSelectedRouteContext } from '../m01Port';
import { decideEntry, type EntryDecision } from '../session/decideEntry';
import { getRunningSession } from './readers';
import { playSessionRowSchema, type PlaySessionRow } from './rows';
import { M02_SESSION_TABLES, playSessionsTable } from './tables';

export type CreateSessionResult =
  | { kind: 'CREATED'; session: PlaySessionRow }
  | { kind: 'NOT_CREATED'; decision: Exclude<EntryDecision, { kind: 'CREATE' }> };

export async function createSession(now: Date = new Date()): Promise<CreateSessionResult> {
  try {
    return await visitorDb.transaction('rw', [...M02_SESSION_TABLES, ...M01_HANDOFF_TABLES], async () => {
      const context = await readSelectedRouteContext();
      const running = await getRunningSession();
      const handoffSession =
        context.kind === 'OK' ? ((await playSessionsTable.where('sourceHandoffId').equals(context.value.handoffId).first()) ?? null) : null;
      const decision = decideEntry({ context, running, handoffSession, now: now.getTime() });
      if (decision.kind !== 'CREATE') return { kind: 'NOT_CREATED', decision };
      // decideEntry chỉ trả CREATE cho context OK
      if (context.kind !== 'OK') throw new Error('CREATE without an OK context');

      const handoff = context.value;
      const session = playSessionRowSchema.parse({
        sessionId: crypto.randomUUID(),
        sourceHandoffId: handoff.handoffId,
        routeId: handoff.routeId,
        contentVersion: handoff.routeJourneyManifest.contentVersion,
        // Bản sao giá trị: sửa context về sau không đổi journey của phiên (BR-M02-003)
        journeyCheckpoints: structuredClone(handoff.routeJourneyManifest.checkpoints),
        status: 'DANG_DIEN_RA',
        startedAt: now.toISOString(),
      } satisfies PlaySessionRow);
      await playSessionsTable.add(session);
      return { kind: 'CREATED', session };
    });
  } catch (error) {
    // Tab khác vừa tạo phiên cho cùng handoff giữa lúc đọc và ghi: đọc lại để khôi phục phiên đó
    if (error instanceof Error && error.name === 'ConstraintError') return createSession(now);
    throw error;
  }
}
