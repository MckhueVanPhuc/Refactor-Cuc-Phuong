// Bảng quyết định vào phiên (tasks T026; research R-06; BR-M02-001, 017; FR-M02-001; SC-M02-010).
import { describe, expect, it } from 'vitest';
import { CHECKPOINTS, contextV3, ROUTE_A } from '../api/fake/fixtures';
import type { PlaySessionRow } from '../storage/rows';
import { decideEntry } from './decideEntry';

const context = contextV3();
const NOW = Date.parse(context.authorizedAt) + 60_000;

function session(change: Partial<PlaySessionRow> = {}): PlaySessionRow {
  return {
    sessionId: '5b1e2d3c-4a5f-4e6d-8c7b-9a0f1e2d3c4b',
    sourceHandoffId: '9e8d7c6b-5a4f-4e3d-8c2b-1a0f9e8d7c6b',
    routeId: ROUTE_A,
    contentVersion: 3,
    journeyCheckpoints: structuredClone([...CHECKPOINTS]),
    status: 'DANG_DIEN_RA',
    startedAt: '2026-11-04T00:00:00.000Z',
    ...change,
  };
}

const ok = (value = context) => ({ kind: 'OK' as const, value });

describe('decideEntry', () => {
  it('OK trùng handoff của phiên đang chạy → khôi phục, kể cả khi đã quá expiresAt hay REVOKED (FR-M02-005)', () => {
    const running = session({ sourceHandoffId: context.handoffId });
    expect(decideEntry({ context: ok(), running, handoffSession: running, now: NOW })).toEqual({ kind: 'RESTORE', session: running });
    const later = Date.parse(context.expiresAt) + 1;
    expect(decideEntry({ context: ok(), running, handoffSession: running, now: later })).toEqual({ kind: 'RESTORE', session: running });
    const revoked = ok({ ...context, authorizationStatus: 'REVOKED' });
    expect(decideEntry({ context: revoked, running, handoffSession: running, now: NOW })).toEqual({ kind: 'RESTORE', session: running });
  });

  it('handoff đã có phiên terminal → từ chối "đã dùng"; phiên đang chạy khác vẫn mở được (BR-M02-001)', () => {
    const used = session({ sourceHandoffId: context.handoffId, status: 'HOAN_TAT', endedAt: '2026-11-04T03:00:00.000Z' });
    expect(decideEntry({ context: ok(), running: null, handoffSession: used, now: NOW })).toEqual({ kind: 'REJECT', reason: 'USED', running: null });
    const other = session();
    expect(decideEntry({ context: ok(), running: other, handoffSession: used, now: NOW })).toEqual({ kind: 'REJECT', reason: 'USED', running: other });
  });

  it('REVOKED → từ chối (BR-M02-017)', () => {
    const revoked = ok({ ...context, authorizationStatus: 'REVOKED' });
    expect(decideEntry({ context: revoked, running: null, handoffSession: null, now: NOW })).toEqual({ kind: 'REJECT', reason: 'REVOKED', running: null });
  });

  it('giờ thiết bị ≥ expiresAt → từ chối; trước 1 ms → tạo (BR-M02-017)', () => {
    const expiresAt = Date.parse(context.expiresAt);
    expect(decideEntry({ context: ok(), running: null, handoffSession: null, now: expiresAt })).toEqual({ kind: 'REJECT', reason: 'EXPIRED', running: null });
    expect(decideEntry({ context: ok(), running: null, handoffSession: null, now: expiresAt - 1 })).toEqual({ kind: 'CREATE' });
  });

  it('OK hợp lệ, không phiên → tạo; có phiên của handoff khác → thay (FR-M02-017)', () => {
    expect(decideEntry({ context: ok(), running: null, handoffSession: null, now: NOW })).toEqual({ kind: 'CREATE' });
    const running = session();
    expect(decideEntry({ context: ok(), running, handoffSession: null, now: NOW })).toEqual({ kind: 'REPLACE', running });
  });

  it('INVALID (gồm version 2) → từ chối với thông báo, không chuyển đổi (FR-M02-001; SC-M02-010)', () => {
    expect(decideEntry({ context: { kind: 'INVALID' }, running: null, handoffSession: null, now: NOW })).toEqual({
      kind: 'REJECT',
      reason: 'INVALID',
      running: null,
    });
    const running = session();
    expect(decideEntry({ context: { kind: 'INVALID' }, running, handoffSession: null, now: NOW })).toEqual({ kind: 'REJECT', reason: 'INVALID', running });
  });

  it('NONE + có phiên → khôi phục; NONE + không phiên → khách tự do', () => {
    const running = session();
    expect(decideEntry({ context: { kind: 'NONE' }, running, handoffSession: null, now: NOW })).toEqual({ kind: 'RESTORE', session: running });
    expect(decideEntry({ context: { kind: 'NONE' }, running: null, handoffSession: null, now: NOW })).toEqual({ kind: 'FREE' });
  });
});
