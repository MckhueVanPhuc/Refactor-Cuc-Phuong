// Tạo phiên trên fake-indexeddb với cổng M01 giả (tasks T027; BR-M02-001, 002, 003; FR-M02-002, 003, 004; SC-M02-001).
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { contextV3 } from '../api/fake/fixtures';
import { fakeM01 } from '../testing/fakeM01Port';
import { createSession } from './createSession';
import { playSessionsTable } from './tables';

vi.mock('../m01Port', () => import('../testing/fakeM01Port'));

const context = contextV3();
const NOW = new Date(Date.parse(context.authorizedAt) + 60_000);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

beforeEach(() => {
  fakeM01.reset();
  fakeM01.setContext(context);
});

const running = () => playSessionsTable.where('status').equals('DANG_DIEN_RA').toArray();

describe('createSession', () => {
  it('tạo một phiên DANG_DIEN_RA: sessionId UUID, sourceHandoffId = handoffId, startedAt UTC (FR-M02-002, 003)', async () => {
    const result = await createSession(NOW);
    expect(result.kind).toBe('CREATED');
    const [stored] = await running();
    expect(stored).toMatchObject({
      sourceHandoffId: context.handoffId,
      routeId: context.routeId,
      contentVersion: context.routeJourneyManifest.contentVersion,
      status: 'DANG_DIEN_RA',
      startedAt: NOW.toISOString(),
    });
    expect(stored!.sessionId).toMatch(UUID);
    expect(stored!.endedAt).toBeUndefined();
  });

  it('journeyCheckpoints là bản sao sâu của manifest (BR-M02-003; FR-M02-004)', async () => {
    const result = await createSession(NOW);
    if (result.kind !== 'CREATED') throw new Error('phải tạo phiên');
    expect(result.session.journeyCheckpoints).toEqual(context.routeJourneyManifest.checkpoints);
    // Context nguồn đổi sau đó (M01 ghi đè) không đổi phiên đã lưu
    const changed = structuredClone(context);
    changed.routeJourneyManifest.checkpoints[0]!.qrIdentifiers.push('QZ');
    fakeM01.setContext(changed);
    const [stored] = await running();
    expect(stored!.journeyCheckpoints[0]!.qrIdentifiers).toEqual(['Q1a', 'Q1b']);
  });

  it('đọc lại context trong transaction: context đã bị thu hồi hoặc hết hạn → không tạo', async () => {
    fakeM01.setContext({ ...context, authorizationStatus: 'REVOKED' });
    expect(await createSession(NOW)).toEqual({ kind: 'NOT_CREATED', decision: { kind: 'REJECT', reason: 'REVOKED', running: null } });
    fakeM01.setContext(context);
    expect(await createSession(new Date(context.expiresAt))).toMatchObject({ kind: 'NOT_CREATED', decision: { reason: 'EXPIRED' } });
    expect(await playSessionsTable.count()).toBe(0);
  });

  it('hai lời gọi đồng thời cùng handoff → đúng một phiên; lời gọi sau khôi phục phiên đó (BR-M02-001; SC-M02-001)', async () => {
    const [first, second] = await Promise.all([createSession(NOW), createSession(NOW)]);
    const results = [first, second];
    expect(results.filter((r) => r.kind === 'CREATED')).toHaveLength(1);
    const created = results.find((r) => r.kind === 'CREATED');
    const other = results.find((r) => r.kind === 'NOT_CREATED');
    expect(other).toEqual({ kind: 'NOT_CREATED', decision: { kind: 'RESTORE', session: created!.kind === 'CREATED' ? created!.session : null } });
    expect(await playSessionsTable.count()).toBe(1);
  });

  it('handoff đã dùng cho một phiên terminal → không tạo lại', async () => {
    await createSession(NOW);
    const [stored] = await running();
    await playSessionsTable.update(stored!.sessionId, { status: 'HOAN_TAT', endedAt: NOW.toISOString() });
    expect(await createSession(NOW)).toMatchObject({ kind: 'NOT_CREATED', decision: { kind: 'REJECT', reason: 'USED' } });
    expect(await playSessionsTable.count()).toBe(1);
  });

  it('không bao giờ có hai phiên DANG_DIEN_RA: đang có phiên của handoff khác → REPLACE, không ghi (BR-M02-002)', async () => {
    await createSession(NOW);
    const next = contextV3({ handoffId: '2e1d0c9b-8a7f-4e6d-9c5b-4a3f2e1d0c9b' });
    fakeM01.setContext(next);
    expect(await createSession(NOW)).toMatchObject({ kind: 'NOT_CREATED', decision: { kind: 'REPLACE' } });
    expect(await running()).toHaveLength(1);
  });

  it('không có context hoặc context INVALID → không tạo', async () => {
    fakeM01.setContext(null);
    expect(await createSession(NOW)).toEqual({ kind: 'NOT_CREATED', decision: { kind: 'FREE' } });
    fakeM01.setContext('INVALID');
    expect(await createSession(NOW)).toMatchObject({ kind: 'NOT_CREATED', decision: { kind: 'REJECT', reason: 'INVALID' } });
    expect(await playSessionsTable.count()).toBe(0);
  });
});
