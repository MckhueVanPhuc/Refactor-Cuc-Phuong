// LiveQrLookupResult với LiveStationContent (M03 → M02) — live-qr-lookup-contract §2; spec-M03 §5.1.
// Không có field route (BR-M03-I03): mọi object strict. Identifier opaque — ràng buộc định dạng chỉ ở DB.
import { z } from 'zod';
import { bilingualText, connectivityMode, identifier, localizedIntroduction, nonEmptyText } from './common';

export const mediaResource = z.strictObject({
  type: z.enum(['AUDIO', 'VIDEO']),
  sourceRef: nonEmptyText,
  spokenLanguage: z.enum(['vi', 'en', 'NONE']),
});

export const liveStationContentSchema = z
  .strictObject({
    qrIdentifier: identifier,
    checkpointId: identifier,
    checkpointName: bilingualText,
    connectivityMode,
    objectName: bilingualText,
    localizedContent: localizedIntroduction,
    staticImages: z.array(nonEmptyText),
    mediaResources: z.array(mediaResource),
  })
  .refine((content) => content.connectivityMode !== 'OFFLINE_REQUIRED' || content.mediaResources.length === 0, {
    path: ['mediaResources'],
    message: 'luôn rỗng khi OFFLINE_REQUIRED',
  });

export const liveQrLookupResultSchema = z.discriminatedUnion('outcome', [
  z.strictObject({ outcome: z.literal('VALID'), content: liveStationContentSchema }),
  z.strictObject({ outcome: z.literal('TEMPORARILY_CLOSED'), closedScope: z.enum(['ROUTE', 'CHECKPOINT']) }),
  z.strictObject({ outcome: z.literal('INVALID') }),
]);

export type LiveStationContent = z.infer<typeof liveStationContentSchema>;
export type LiveQrLookupResult = z.infer<typeof liveQrLookupResultSchema>;
export type MediaResource = z.infer<typeof mediaResource>;
