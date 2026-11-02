// SelectedRouteContext v3 (M01 → M02) — selected-route-context-v3-contract §1; spec-M01 §5.3 = spec-M02 §5.1;
// DAC-M01-002…007. M01 sở hữu và là writer duy nhất. Chỉ chứa metadata hành trình: không có text/ảnh offline
// (schema strict nên `resources`, `introductionText`… bị từ chối).
import { z } from 'zod';
import { identifier, utcDateTime } from './common';
import { journeyManifestSchema } from './journeyManifest';

/** `expiresAt` đúng `authorizedAt` + 24 giờ (spec-M01 §5.3; DAC-M01-005). */
const VALIDITY_MS = 86_400_000;

export const authorizationStatus = z.enum(['AUTHORIZED', 'REVOKED']);

export const selectedRouteContextV3Schema = z
  .strictObject({
    contractVersion: z.literal(3),
    handoffId: z.uuid(),
    routeId: identifier,
    authorizedAt: utcDateTime,
    expiresAt: utcDateTime,
    authorizationStatus,
    routeJourneyManifest: journeyManifestSchema,
  })
  .superRefine((context, ctx) => {
    if (context.routeId !== context.routeJourneyManifest.routeId) {
      ctx.addIssue({ code: 'custom', path: ['routeId'], message: 'phải bằng routeJourneyManifest.routeId' });
    }
    if (Date.parse(context.expiresAt) - Date.parse(context.authorizedAt) !== VALIDITY_MS) {
      ctx.addIssue({ code: 'custom', path: ['expiresAt'], message: 'phải đúng authorizedAt + 24 giờ' });
    }
  });

export type AuthorizationStatus = z.infer<typeof authorizationStatus>;
export type SelectedRouteContextV3 = z.infer<typeof selectedRouteContextV3Schema>;
