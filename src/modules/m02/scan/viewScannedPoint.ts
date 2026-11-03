// Xem lại một điểm đã quét (tasks T044; scan-resolution-contract §4): chạm điểm trong journey hoặc tải lại
// `/trip/qr/:qrIdentifier`. Chọn nội dung như processScan nhưng KHÔNG ghi lượt ghé; trả lượt ghé gốc (FR-M02-009).
import { lookupClient } from '../api/lookupClient';
import { getRunningSession, getVisit } from '../storage/readers';
import type { ScanDeps, ScanResult } from './processScan';
import { resolveScan } from './resolveScan';

export async function viewScannedPoint(qrIdentifier: string, deps: Pick<ScanDeps, 'lookup'> = {}): Promise<ScanResult> {
  const lookup = deps.lookup ?? lookupClient;
  const session = await getRunningSession();
  const outcome = await lookup.lookup(qrIdentifier, session?.routeId);
  const resolution = resolveScan({ journey: session?.journeyCheckpoints ?? null, qrIdentifier, lookup: outcome });
  const visit = session && resolution.recordVisitFor ? await getVisit(session.sessionId, resolution.recordVisitFor) : null;
  return {
    qrIdentifier,
    display: resolution.display,
    freeVisitor: resolution.freeVisitor,
    session: session ? { sessionId: session.sessionId, routeId: session.routeId, contentVersion: session.contentVersion } : null,
    visit,
    visitCreated: false,
    finalPromptNeeded: false,
  };
}
