import { describe, expect, it } from 'vitest';
import { liveQrLookupResultSchema, type LiveStationContent } from './liveQrLookup';

function validContent(): LiveStationContent {
  return {
    qrIdentifier: 'q1',
    checkpointId: 'c1',
    checkpointName: { vi: 'Điểm 1', en: 'Stop 1' },
    connectivityMode: 'ONLINE_AVAILABLE',
    objectName: { vi: 'Cây', en: 'Tree' },
    localizedContent: { vi: { introductionText: 'Giới thiệu' }, en: { introductionText: 'Intro' } },
    staticImages: ['media/tree.jpg'],
    mediaResources: [
      { type: 'AUDIO', sourceRef: 'media/a.mp3', spokenLanguage: 'vi' },
      { type: 'VIDEO', sourceRef: 'media/v.mp4', spokenLanguage: 'NONE' },
    ],
  };
}

const parse = (value: unknown) => liveQrLookupResultSchema.safeParse(value);

describe('LiveQrLookupResult (live-qr-lookup §2)', () => {
  it('VALID kèm content hợp lệ; identifier ngắn vẫn qua (opaque)', () => {
    expect(parse({ outcome: 'VALID', content: validContent() }).success).toBe(true);
  });

  it('content chỉ khi VALID', () => {
    expect(parse({ outcome: 'VALID' }).success).toBe(false);
    expect(parse({ outcome: 'INVALID', content: validContent() }).success).toBe(false);
    expect(parse({ outcome: 'TEMPORARILY_CLOSED', closedScope: 'ROUTE', content: validContent() }).success).toBe(
      false,
    );
  });

  it('closedScope chỉ khi TEMPORARILY_CLOSED', () => {
    expect(parse({ outcome: 'TEMPORARILY_CLOSED', closedScope: 'CHECKPOINT' }).success).toBe(true);
    expect(parse({ outcome: 'TEMPORARILY_CLOSED' }).success).toBe(false);
    expect(parse({ outcome: 'TEMPORARILY_CLOSED', closedScope: 'QR' }).success).toBe(false);
    expect(parse({ outcome: 'INVALID', closedScope: 'ROUTE' }).success).toBe(false);
    expect(parse({ outcome: 'VALID', closedScope: 'ROUTE', content: validContent() }).success).toBe(false);
  });

  it('INVALID không kèm gì', () => {
    expect(parse({ outcome: 'INVALID' }).success).toBe(true);
  });

  it('mediaResources rỗng khi OFFLINE_REQUIRED (BR-M03-I03)', () => {
    const offline = { ...validContent(), connectivityMode: 'OFFLINE_REQUIRED' };
    expect(parse({ outcome: 'VALID', content: offline }).success).toBe(false);
    expect(parse({ outcome: 'VALID', content: { ...offline, mediaResources: [] } }).success).toBe(true);
  });

  it('spokenLanguage chỉ vi / en / NONE; type chỉ AUDIO / VIDEO', () => {
    const badLanguage = { ...validContent(), mediaResources: [{ type: 'AUDIO', sourceRef: 'a', spokenLanguage: 'fr' }] };
    const badType = { ...validContent(), mediaResources: [{ type: 'IMAGE', sourceRef: 'a', spokenLanguage: 'vi' }] };
    expect(parse({ outcome: 'VALID', content: badLanguage }).success).toBe(false);
    expect(parse({ outcome: 'VALID', content: badType }).success).toBe(false);
  });

  it('không có field route (SC-M03-025)', () => {
    expect(parse({ outcome: 'VALID', content: { ...validContent(), routeId: 'r1' } }).success).toBe(false);
    expect(parse({ outcome: 'INVALID', routeId: 'r1' }).success).toBe(false);
  });

  it('qrIdentifier, checkpointId: chuỗi không rỗng, không kiểm định dạng (SC-M03-039)', () => {
    expect(parse({ outcome: 'VALID', content: { ...validContent(), qrIdentifier: '' } }).success).toBe(false);
    expect(parse({ outcome: 'VALID', content: { ...validContent(), checkpointId: '' } }).success).toBe(false);
    expect(parse({ outcome: 'VALID', content: { ...validContent(), qrIdentifier: 'a-b_c' } }).success).toBe(true);
  });

  it('nội dung song ngữ thiếu một ngôn ngữ → không hợp lệ', () => {
    const missingEn = { ...validContent(), objectName: { vi: 'Cây' } };
    expect(parse({ outcome: 'VALID', content: missingEn }).success).toBe(false);
  });

  it('outcome ngoài enum → không hợp lệ', () => {
    expect(parse({ outcome: 'NOT_FOUND' }).success).toBe(false);
  });
});
