// Dựng SelectedRouteContext v3 (selected-route-context-v3-contract §2; research R-11 bước 3; DAC-M01-002…007).
// handoffId mới mỗi Start; authorizedAt = giờ thiết bị, ISO-8601 UTC; expiresAt = +24 giờ đúng tuyệt đối; AUTHORIZED;
// manifest là bản sao giá trị. M01 không gia hạn và không đổi trạng thái vì thời gian (BR-M01-015).
import type { JourneyManifest } from '../../../shared/contracts/journeyManifest';
import {
  selectedRouteContextV3Schema,
  type SelectedRouteContextV3,
} from '../../../shared/contracts/selectedRouteContext';
import { HANDOFF_VALIDITY_MS } from '../config/limits';

export function buildContext(
  manifest: JourneyManifest,
  { now = new Date(), uuid = () => crypto.randomUUID() }: { now?: Date; uuid?: () => string } = {},
): SelectedRouteContextV3 {
  return selectedRouteContextV3Schema.parse({
    contractVersion: 3,
    handoffId: uuid(),
    routeId: manifest.routeId,
    authorizedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + HANDOFF_VALIDITY_MS).toISOString(),
    authorizationStatus: 'AUTHORIZED',
    routeJourneyManifest: structuredClone(manifest),
  });
}
