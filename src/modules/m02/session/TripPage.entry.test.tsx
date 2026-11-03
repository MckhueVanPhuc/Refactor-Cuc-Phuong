// SCR-M02-001 khi vào `/trip` (tasks T028; FR-M02-005; BR-M02-017; SC-M02-003, 010) với cổng M01 giả.
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { contextV3 } from '../api/fake/fixtures';
import { vi as viMessages } from '../i18n/vi';
import { playSessionsTable } from '../storage/tables';
import { fakeM01 } from '../testing/fakeM01Port';
import { TripPage } from './TripPage';

vi.mock('../m01Port', () => import('../testing/fakeM01Port'));

const AUTHORIZED_AT = '2026-11-04T01:00:00.000Z';
const context = contextV3({ authorizedAt: AUTHORIZED_AT });

function renderTrip() {
  const router = createMemoryRouter([{ path: '/trip', element: <TripPage /> }], { initialEntries: ['/trip'] });
  return render(<RouterProvider router={router} />);
}

const entryOf = (container: HTMLElement) => container.querySelector('[data-entry]')?.getAttribute('data-entry');

beforeEach(() => {
  // Chỉ giả Date: Dexie và waitFor vẫn dùng timer thật
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(Date.parse(AUTHORIZED_AT) + 60_000));
  fakeM01.reset();
  fakeM01.setLanguage({ languageCode: 'vi' });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('TripPage — vào phiên', () => {
  it('handoff hợp lệ → "Session started" kèm câu gợi ý bắt đầu phiên của §5.1', async () => {
    fakeM01.setContext(context);
    renderTrip();
    expect(await screen.findByText(viMessages.notice.sessionStartHint)).toBeTruthy();
    expect(screen.getByRole('heading', { name: viMessages.screenTitle.trip })).toBeTruthy();
    expect(await playSessionsTable.count()).toBe(1);
  });

  it('mở lại với cùng handoff → "Session restored": cùng phiên, không gợi ý lại, không phiên mới', async () => {
    fakeM01.setContext(context);
    const first = renderTrip();
    await screen.findByText(viMessages.notice.sessionStartHint);
    const sessionId = first.container.querySelector('[data-session-id]')?.getAttribute('data-session-id');
    first.unmount();

    const second = renderTrip();
    await vi.waitFor(() => expect(entryOf(second.container)).toBe('RESTORED'));
    expect(second.container.querySelector('[data-session-id]')?.getAttribute('data-session-id')).toBe(sessionId);
    expect(screen.queryByText(viMessages.notice.sessionStartHint)).toBeNull();
    expect(await playSessionsTable.count()).toBe(1);
  });

  it('phiên đã có không bị kết thúc khi expiresAt đã qua (FR-M02-005)', async () => {
    fakeM01.setContext(context);
    const first = renderTrip();
    await screen.findByText(viMessages.notice.sessionStartHint);
    first.unmount();

    vi.setSystemTime(new Date(Date.parse(context.expiresAt) + 1));
    const second = renderTrip();
    await vi.waitFor(() => expect(entryOf(second.container)).toBe('RESTORED'));
    expect((await playSessionsTable.toArray()).map((s) => s.status)).toEqual(['DANG_DIEN_RA']);
  });

  it.each([
    ['version 2 / context hỏng', 'INVALID' as const, viMessages.handoff.outdatedVersion],
    ['REVOKED', { ...context, authorizationStatus: 'REVOKED' as const }, viMessages.handoff.revoked],
    ['quá expiresAt', { ...context, authorizedAt: '2026-11-02T01:00:00.000Z', expiresAt: '2026-11-03T01:00:00.000Z' }, viMessages.handoff.expired],
  ])('"Handoff rejected" — %s: thông báo bắt đầu lại từ M01, không tạo phiên (BR-M02-017; SC-M02-010)', async (_name, value, message) => {
    fakeM01.setContext(value);
    renderTrip();
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain(message);
    expect(screen.getByRole('link', { name: viMessages.qrLink.chooseRoute }).getAttribute('href')).toBe('/');
    expect(await playSessionsTable.count()).toBe(0);
  });

  it('handoff đã dùng cho phiên terminal → thông báo "đã bắt đầu trước đó"', async () => {
    await playSessionsTable.add({
      sessionId: '5b1e2d3c-4a5f-4e6d-8c7b-9a0f1e2d3c4b',
      sourceHandoffId: context.handoffId,
      routeId: context.routeId,
      contentVersion: 3,
      journeyCheckpoints: structuredClone(context.routeJourneyManifest.checkpoints),
      status: 'HOAN_TAT',
      startedAt: AUTHORIZED_AT,
      endedAt: AUTHORIZED_AT,
    });
    fakeM01.setContext(context);
    renderTrip();
    expect((await screen.findByRole('alert')).textContent).toContain(viMessages.handoff.alreadyUsed);
    expect(await playSessionsTable.count()).toBe(1);
  });

  it('không có handoff, không phiên → thông báo chưa có chuyến đi (khách tự do)', async () => {
    renderTrip();
    expect((await screen.findByRole('alert')).textContent).toContain(viMessages.handoff.none);
  });

  it('handoff mới khi đang có phiên → phiên cũ giữ nguyên, báo chưa bắt đầu được chuyến mới', async () => {
    fakeM01.setContext(context);
    const first = renderTrip();
    await screen.findByText(viMessages.notice.sessionStartHint);
    first.unmount();

    fakeM01.setContext(contextV3({ authorizedAt: AUTHORIZED_AT, handoffId: '2e1d0c9b-8a7f-4e6d-9c5b-4a3f2e1d0c9b' }));
    renderTrip();
    expect((await screen.findByRole('alert')).textContent).toBe(viMessages.trip.replaceFailed);
    expect((await playSessionsTable.toArray()).map((s) => s.sourceHandoffId)).toEqual([context.handoffId]);
  });
});
