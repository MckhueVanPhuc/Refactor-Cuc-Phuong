// Schema dòng của ba store M02 (tasks T018; data-model §2; DAC-M02-001–005, 007, 010).
import { describe, expect, it } from 'vitest';
import type { SessionSyncRecord } from '../../../shared/contracts/sessionSyncRecord';
import { CHECKPOINTS, ROUTE_A } from '../api/fake/fixtures';
import { checkpointVisitRowSchema, pendingSyncItemRowSchema, playSessionRowSchema, type PlaySessionRow } from './rows';

const SESSION = '5b1e2d3c-4a5f-4e6d-8c7b-9a0f1e2d3c4b';
const HANDOFF = '1d0c6a2e-7b4f-4c3a-9e8d-2f1a0b9c8d7e';

function running(): PlaySessionRow {
  return {
    sessionId: SESSION,
    sourceHandoffId: HANDOFF,
    routeId: ROUTE_A,
    contentVersion: 3,
    journeyCheckpoints: structuredClone([...CHECKPOINTS]),
    status: 'DANG_DIEN_RA',
    startedAt: '2026-11-04T02:00:00.000Z',
  };
}

const ok = (schema: { safeParse(value: unknown): { success: boolean } }, value: unknown) => schema.safeParse(value).success;

describe('PlaySession', () => {
  it('phiên đang chạy hợp lệ; phiên terminal có endedAt hợp lệ', () => {
    expect(ok(playSessionRowSchema, running())).toBe(true);
    expect(ok(playSessionRowSchema, { ...running(), status: 'HOAN_TAT', endedAt: '2026-11-04T03:00:00.000Z' })).toBe(true);
    expect(ok(playSessionRowSchema, { ...running(), status: 'BO_DO', endedAt: '2026-11-04T03:00:00.000Z' })).toBe(true);
  });

  it('endedAt có ⇔ terminal (DAC-M02-003)', () => {
    expect(ok(playSessionRowSchema, { ...running(), endedAt: '2026-11-04T03:00:00.000Z' })).toBe(false);
    expect(ok(playSessionRowSchema, { ...running(), status: 'HOAN_TAT' })).toBe(false);
  });

  it('sessionId và sourceHandoffId là UUID (DAC-M02-001)', () => {
    expect(ok(playSessionRowSchema, { ...running(), sessionId: 's1' })).toBe(false);
    expect(ok(playSessionRowSchema, { ...running(), sourceHandoffId: 'h1' })).toBe(false);
  });

  it('journey: checkpointId và sequence duy nhất, qrIdentifiers không rỗng (DAC-M02-004)', () => {
    const [first, second] = running().journeyCheckpoints as [PlaySessionRow['journeyCheckpoints'][number], PlaySessionRow['journeyCheckpoints'][number]];
    expect(ok(playSessionRowSchema, { ...running(), journeyCheckpoints: [first, { ...second, checkpointId: first.checkpointId }] })).toBe(false);
    expect(ok(playSessionRowSchema, { ...running(), journeyCheckpoints: [first, { ...second, sequence: first.sequence }] })).toBe(false);
    expect(ok(playSessionRowSchema, { ...running(), journeyCheckpoints: [{ ...first, qrIdentifiers: [] }] })).toBe(false);
  });

  it('trạng thái ngoài enum và khóa lạ bị từ chối', () => {
    expect(ok(playSessionRowSchema, { ...running(), status: 'DA_DEN' })).toBe(false);
    expect(ok(playSessionRowSchema, { ...running(), deviceId: 'may-1' })).toBe(false);
  });
});

describe('CheckpointVisit (DAC-M02-005)', () => {
  const visit = { sessionId: SESSION, checkpointId: 'C2', qrIdentifier: 'QN', checkedInAt: '2026-11-04T02:30:00.000Z' };

  it('hợp lệ, kể cả mã thêm sau không có trong journey', () => {
    expect(ok(checkpointVisitRowSchema, visit)).toBe(true);
  });

  it('thiếu trường, giờ không UTC, khóa lạ → lỗi', () => {
    const { qrIdentifier: _qr, ...missing } = visit;
    expect(ok(checkpointVisitRowSchema, missing)).toBe(false);
    expect(ok(checkpointVisitRowSchema, { ...visit, checkedInAt: '2026-11-04T09:30:00+07:00' })).toBe(false);
    expect(ok(checkpointVisitRowSchema, { ...visit, gps: '20.3,105.6' })).toBe(false);
  });
});

describe('PendingSyncItem (DAC-M02-007, 010)', () => {
  const record: SessionSyncRecord = {
    sessionId: SESSION,
    routeId: ROUTE_A,
    contentVersion: 3,
    startedAt: '2026-11-04T02:00:00.000Z',
    endedAt: '2026-11-04T03:00:00.000Z',
    status: 'BO_DO',
    visitedCheckpoints: [],
  };

  it('ba giá trị syncStatus hợp lệ', () => {
    for (const status of ['PENDING', 'SYNCED', 'CONFLICT']) {
      expect(ok(pendingSyncItemRowSchema, { sessionId: SESSION, record, syncStatus: status })).toBe(true);
    }
  });

  it('sessionId phải bằng record.sessionId; record phải qua schema strict', () => {
    const other = '5b1e2d3c-4a5f-4e6d-8c7b-9a0f1e2d3c4c';
    expect(ok(pendingSyncItemRowSchema, { sessionId: other, record, syncStatus: 'PENDING' })).toBe(false);
    expect(ok(pendingSyncItemRowSchema, { sessionId: SESSION, record: { ...record, status: 'DANG_DIEN_RA' }, syncStatus: 'PENDING' })).toBe(false);
    expect(ok(pendingSyncItemRowSchema, { sessionId: SESSION, record, syncStatus: 'FAILED' })).toBe(false);
  });
});
