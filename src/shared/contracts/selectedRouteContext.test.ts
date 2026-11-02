// Contract test SelectedRouteContext v3 (quickstart M01 V26; DAC-M01-002…007).
import { describe, expect, it } from 'vitest';
import { selectedRouteContextV3Schema, type SelectedRouteContextV3 } from './selectedRouteContext';

function validContext(): SelectedRouteContextV3 {
  return {
    contractVersion: 3,
    handoffId: '3f2b8c1e-5d4a-4b6f-9a7e-2c1d0e9f8a7b',
    routeId: 'r1',
    authorizedAt: '2026-11-02T01:00:00.000Z',
    expiresAt: '2026-11-03T01:00:00.000Z',
    authorizationStatus: 'AUTHORIZED',
    routeJourneyManifest: {
      routeId: 'r1',
      contentVersion: 2,
      checkpoints: [
        {
          checkpointId: 'c1',
          sequence: 1,
          checkpointName: { vi: 'Điểm 1', en: 'Stop 1' },
          connectivityMode: 'OFFLINE_REQUIRED',
          qrIdentifiers: ['q1', 'q2'],
        },
        {
          checkpointId: 'c2',
          sequence: 5,
          checkpointName: { vi: 'Điểm 2', en: 'Stop 2' },
          connectivityMode: 'ONLINE_AVAILABLE',
          qrIdentifiers: ['q3'],
        },
      ],
    },
  };
}

const parse = (value: unknown) => selectedRouteContextV3Schema.safeParse(value);

describe('SelectedRouteContextV3', () => {
  it('nhận fixture hợp lệ (sequence có khoảng trống)', () => {
    expect(parse(validContext()).success).toBe(true);
  });

  it('nhận REVOKED', () => {
    expect(parse({ ...validContext(), authorizationStatus: 'REVOKED' }).success).toBe(true);
  });

  it('nhận identifier opaque ngắn, không kiểm định dạng (constitution)', () => {
    const context = validContext();
    context.routeId = 'x';
    context.routeJourneyManifest.routeId = 'x';
    context.routeJourneyManifest.checkpoints[0]!.checkpointId = '#';
    context.routeJourneyManifest.checkpoints[0]!.qrIdentifiers = ['?'];
    expect(parse(context).success).toBe(true);
  });

  it.each([2, 4, '3'])('contractVersion %s bị từ chối (DAC-M01-002)', (contractVersion) => {
    expect(parse({ ...validContext(), contractVersion }).success).toBe(false);
  });

  it.each(['not-a-uuid', ''])('handoffId không phải UUID bị từ chối: %s', (handoffId) => {
    expect(parse({ ...validContext(), handoffId }).success).toBe(false);
  });

  it('routeId khác routeJourneyManifest.routeId bị từ chối (DAC-M01-004)', () => {
    expect(parse({ ...validContext(), routeId: 'r2' }).success).toBe(false);
  });

  it.each([
    ['lệch +1 ms', '2026-11-03T01:00:00.001Z'],
    ['lệch -1 ms', '2026-11-03T00:59:59.999Z'],
    ['23 giờ', '2026-11-03T00:00:00.000Z'],
  ])('expiresAt − authorizedAt %s bị từ chối (DAC-M01-005)', (_label, expiresAt) => {
    expect(parse({ ...validContext(), expiresAt }).success).toBe(false);
  });

  it('thời điểm không phải UTC bị từ chối', () => {
    const context = { ...validContext(), authorizedAt: '2026-11-02T08:00:00+07:00', expiresAt: '2026-11-03T08:00:00+07:00' };
    expect(parse(context).success).toBe(false);
  });

  it.each(['EXPIRED', 'USED', ''])('authorizationStatus %s bị từ chối (DAC-M01-006)', (authorizationStatus) => {
    expect(parse({ ...validContext(), authorizationStatus }).success).toBe(false);
  });

  it('checkpointId lặp bị từ chối', () => {
    const context = validContext();
    context.routeJourneyManifest.checkpoints[1]!.checkpointId = 'c1';
    expect(parse(context).success).toBe(false);
  });

  it('sequence lặp bị từ chối', () => {
    const context = validContext();
    context.routeJourneyManifest.checkpoints[1]!.sequence = 1;
    expect(parse(context).success).toBe(false);
  });

  it('qrIdentifiers rỗng bị từ chối', () => {
    const context = validContext();
    context.routeJourneyManifest.checkpoints[0]!.qrIdentifiers = [];
    expect(parse(context).success).toBe(false);
  });

  it.each(['', null])('identifier rỗng bị từ chối: %s', (empty) => {
    const context: Record<string, unknown> = structuredClone(validContext());
    const manifest = context.routeJourneyManifest as SelectedRouteContextV3['routeJourneyManifest'];
    (manifest.checkpoints[0] as Record<string, unknown>).checkpointId = empty;
    expect(parse(context).success).toBe(false);
  });

  it('checkpointName thiếu một ngôn ngữ bị từ chối', () => {
    const context: Record<string, unknown> = structuredClone(validContext());
    const manifest = context.routeJourneyManifest as SelectedRouteContextV3['routeJourneyManifest'];
    (manifest.checkpoints[0] as Record<string, unknown>).checkpointName = { vi: 'Điểm 1' };
    expect(parse(context).success).toBe(false);
  });

  it.each([
    ['resources', []],
    ['introductionText', 'x'],
  ])('context không chứa %s (spec-M01 §5.3: chỉ metadata hành trình)', (field, value) => {
    expect(parse({ ...validContext(), [field]: value }).success).toBe(false);
  });

  it('checkpoint trong manifest không chứa offlineResources hay byte ảnh', () => {
    const context: Record<string, unknown> = structuredClone(validContext());
    const manifest = context.routeJourneyManifest as SelectedRouteContextV3['routeJourneyManifest'];
    (manifest.checkpoints[0] as Record<string, unknown>).offlineResources = [];
    expect(parse(context).success).toBe(false);
  });

  it.each([
    'contractVersion',
    'handoffId',
    'routeId',
    'authorizedAt',
    'expiresAt',
    'authorizationStatus',
    'routeJourneyManifest',
  ])('thiếu trường Required %s bị từ chối', (field) => {
    const context: Record<string, unknown> = validContext();
    delete context[field];
    expect(parse(context).success).toBe(false);
  });
});
