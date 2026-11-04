// SCR-M02-004 (tasks T078; BR-M02-024; FR-M02-025; SC-M02-017) với cổng M01, lookup và Storage giả.
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FakeLookup } from '../api/fake/fakeLookup';
import { CHECKPOINTS, ROUTE_A } from '../api/fake/fixtures';
import { lookupClient } from '../api/lookupClient';
import { en } from '../i18n/en';
import { vi as viMessages } from '../i18n/vi';
import { m02Routes } from '../routes';
import { resetAutoEndNoticeForTest } from '../session/autoEnd';
import { checkpointVisitsTable, pendingSyncItemsTable, playSessionsTable } from '../storage/tables';
import { fakeM01 } from '../testing/fakeM01Port';

vi.mock('../m01Port', () => import('../testing/fakeM01Port'));
vi.mock('../api/mediaUrl', () => ({ mediaUrlClient: { signedUrls: async () => new Map() } }));
vi.mock('../api/lookupClient', async () => ({ lookupClient: (await import('../api/fake/fakeLookup')).createFakeLookup() }));

const fakeLookup = lookupClient as FakeLookup;
const SESSION = '5b1e2d3c-4a5f-4e6d-8c7b-9a0f1e2d3c4b';

function openLink(path: string) {
  const router = createMemoryRouter(
    createRoutesFromElements(
      <>
        <Route path="/" element={<p>Danh mục</p>} />
        {m02Routes}
      </>,
    ),
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

async function seedSession(startedAt = new Date(Date.now() - 3_600_000).toISOString()) {
  await playSessionsTable.add({
    sessionId: SESSION,
    sourceHandoffId: '1d0c6a2e-7b4f-4c3a-9e8d-2f1a0b9c8d7e',
    routeId: ROUTE_A,
    contentVersion: 3,
    journeyCheckpoints: structuredClone([...CHECKPOINTS]),
    status: 'DANG_DIEN_RA',
    startedAt,
  });
}

beforeEach(() => {
  fakeLookup.reset();
  fakeM01.reset();
  resetAutoEndNoticeForTest();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('QrLinkPage', () => {
  it('không có bước ngôn ngữ hay tuyến: nội dung hiện ngay, có nút VI/EN của M01 (BR-M02-024; SC-M02-017)', async () => {
    fakeM01.setLanguage({ languageCode: 'vi' });
    openLink('/q/Q1a');
    expect(await screen.findByRole('heading', { name: 'Đối tượng Q1a' })).toBeTruthy();
    expect(screen.getByTestId('m01-language-control')).toBeTruthy();
    expect(screen.getByRole('heading', { name: viMessages.screenTitle.qrLink })).toBeTruthy();
  });

  it.each([
    ['vi-VN', viMessages.notice.freeVisitor],
    ['en-US', en.notice.freeVisitor],
  ])('chưa có preference, thiết bị %s → chữ theo ngôn ngữ thiết bị', async (device, hint) => {
    vi.stubGlobal('navigator', { ...navigator, language: device });
    openLink('/q/Q1a');
    expect(await screen.findByText(hint)).toBeTruthy();
  });

  it('không phiên → khách tự do: gợi ý + "Chọn tuyến" về "/", lookup không gửi routeId', async () => {
    fakeM01.setLanguage({ languageCode: 'vi' });
    const router = openLink('/q/Q1a');
    fireEvent.click(await screen.findByRole('link', { name: viMessages.qrLink.chooseRoute }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(fakeLookup.calls).toEqual([{ qrIdentifier: 'Q1a' }]);
  });

  it('có phiên cùng trình duyệt → như quét trong app: lượt ghé, phản hồi ghi nhận, gửi routeId', async () => {
    fakeM01.setLanguage({ languageCode: 'vi' });
    await seedSession();
    openLink('/q/Q1b');
    expect(await screen.findByText(viMessages.trip.visitRecorded)).toBeTruthy();
    expect(screen.queryByText(viMessages.notice.freeVisitor)).toBeNull();
    expect(await checkpointVisitsTable.toArray()).toEqual([expect.objectContaining({ checkpointId: 'C1', qrIdentifier: 'Q1b' })]);
    expect(fakeLookup.calls).toEqual([{ qrIdentifier: 'Q1b', routeId: ROUTE_A }]);
  });

  it('có phiên + điểm cuối lần đầu → câu hỏi kết thúc chuyến như trong app (BR-M02-021)', async () => {
    fakeM01.setLanguage({ languageCode: 'vi' });
    await seedSession();
    openLink('/q/Q3');
    expect((await screen.findByRole('alertdialog')).textContent).toContain(viMessages.endPrompt.question);
  });

  it('có phiên + TEMPORARILY_CLOSED → thông báo tạm đóng, không nội dung, không lượt ghé', async () => {
    fakeM01.setLanguage({ languageCode: 'vi' });
    await seedSession();
    fakeLookup.set('Q1a', { kind: 'TEMPORARILY_CLOSED', closedScope: 'ROUTE' });
    openLink('/q/Q1a');
    expect((await screen.findByRole('alert')).textContent).toBe(viMessages.notice.temporarilyClosed);
    expect(await checkpointVisitsTable.count()).toBe(0);
  });

  it('tự đóng 24 giờ chạy trước: phiên quá hạn → BO_DO + thông báo, rồi xử lý như khách tự do', async () => {
    fakeM01.setLanguage({ languageCode: 'vi' });
    await seedSession(new Date(Date.now() - 86_400_000 - 60_000).toISOString());
    openLink('/q/Q1a');
    expect(await screen.findByText(viMessages.notice.autoEndedAbandoned)).toBeTruthy();
    expect(await screen.findByText(viMessages.notice.freeVisitor)).toBeTruthy();
    expect((await playSessionsTable.get(SESSION))!.status).toBe('BO_DO');
    expect(await pendingSyncItemsTable.count()).toBe(1);
    expect(await checkpointVisitsTable.count()).toBe(0);
    expect(fakeLookup.calls).toEqual([{ qrIdentifier: 'Q1a' }]);
  });
});
