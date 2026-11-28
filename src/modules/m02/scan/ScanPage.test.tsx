// SCR-M02-005 Quét QR mở từ thanh tab M01 (2026-11-21): camera bật ngay; xử lý mã y như trình quét trong app
// (BR-M02-023): có phiên → lượt quét của phiên (BR-M02-005); không có → khách tự do, không ghi gì (US-M02-07).
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PRELOAD_TIMEOUT_MS, preloadM02Routes } from '../testing/preloadRoutes';
import type { FakeLookup } from '../api/fake/fakeLookup';
import { CHECKPOINTS, ROUTE_A } from '../api/fake/fixtures';
import { lookupClient } from '../api/lookupClient';
import { vi as viMessages } from '../i18n/vi';
import { m02Routes } from '../routes';
import { resetAutoEndNoticeForTest } from '../session/autoEnd';
import { checkpointVisitsTable, pendingSyncItemsTable, playSessionsTable } from '../storage/tables';
import { fakeM01 } from '../testing/fakeM01Port';
import { handleScannedText } from './scanBridge';

vi.mock('../m01Port', () => import('../testing/fakeM01Port'));
vi.mock('../api/mediaUrl', () => ({ mediaUrlClient: { signedUrls: async () => new Map() } }));
vi.mock('../api/lookupClient', async () => ({ lookupClient: (await import('../api/fake/fakeLookup')).createFakeLookup() }));

// Nạp sẵn màn lazy để ca đầu tiên không quá thời gian chờ khi máy chậm (DV-100)
beforeAll(() => preloadM02Routes(), PRELOAD_TIMEOUT_MS);

const fakeLookup = lookupClient as FakeLookup;
const SESSION = '5b1e2d3c-4a5f-4e6d-8c7b-9a0f1e2d3c4b';
const BASE = 'http://localhost:5174';

/** Mở `/scan` như thanh tab M01: màn trước là danh mục, router state mang `returnTo`. */
function openFromTab() {
  const router = createMemoryRouter(
    createRoutesFromElements(
      <>
        <Route path="/" element={<p>Danh mục</p>} />
        {m02Routes}
      </>,
    ),
    { initialEntries: ['/', { pathname: '/scan', state: { returnTo: '/' } }], initialIndex: 1 },
  );
  render(<RouterProvider router={router} />);
  return router;
}

async function seedSession() {
  await playSessionsTable.add({
    sessionId: SESSION,
    sourceHandoffId: '1d0c6a2e-7b4f-4c3a-9e8d-2f1a0b9c8d7e',
    routeId: ROUTE_A,
    contentVersion: 3,
    journeyCheckpoints: structuredClone([...CHECKPOINTS]),
    status: 'DANG_DIEN_RA',
    startedAt: new Date(Date.now() - 3_600_000).toISOString(),
  });
}

// Trình quét nạp lazy cùng thư viện decode QR (chunk `m02-scanner`): khi cả bộ test chạy song song có thể quá 1 s
const SCANNER_LOAD = { timeout: 10_000 };

/** Chờ màn Quét đăng ký handler rồi đưa chuỗi vào như camera vừa đọc được. */
async function scan(text: string) {
  await screen.findByRole('dialog', { name: viMessages.scanner.title }, SCANNER_LOAD);
  await handleScannedText(text);
}

beforeEach(() => {
  fakeLookup.reset();
  fakeM01.reset();
  fakeM01.setLanguage({ languageCode: 'vi' });
  resetAutoEndNoticeForTest();
});

describe('ScanPage', () => {
  it('mở màn là bật trình quét ngay, không cần bấm thêm', async () => {
    openFromTab();
    expect(await screen.findByRole('dialog', { name: viMessages.scanner.title }, SCANNER_LOAD)).toBeTruthy();
  });

  it('không có phiên → khách tự do: tra mã không gửi tuyến, nội dung kèm gợi ý, không ghi gì; chỉ có nút Chọn tuyến, không có Quay lại', async () => {
    const router = openFromTab();
    await scan(`${BASE}/q/Q2`);
    await waitFor(() => expect(router.state.location.pathname).toBe('/trip/qr/Q2'));
    expect(await screen.findByText(viMessages.notice.freeVisitor)).toBeTruthy();
    expect(fakeLookup.calls).toEqual([{ qrIdentifier: 'Q2' }]);
    expect([await playSessionsTable.count(), await checkpointVisitsTable.count(), await pendingSyncItemsTable.count()]).toEqual([
      0, 0, 0,
    ]);
    expect(screen.getByRole('link', { name: viMessages.qrLink.chooseRoute }).getAttribute('href')).toBe('/');
    expect(screen.queryByRole('link', { name: viMessages.content.back })).toBeNull();
  });

  it('có phiên → lượt quét của phiên: gửi tuyến, ghi lượt ghé, Quay lại về hành trình', async () => {
    await seedSession();
    const router = openFromTab();
    await scan(`${BASE}/q/Q2`);
    await waitFor(() => expect(router.state.location.pathname).toBe('/trip/qr/Q2'));
    expect(fakeLookup.calls).toEqual([{ qrIdentifier: 'Q2', routeId: ROUTE_A }]);
    expect(await checkpointVisitsTable.count()).toBe(1);
    expect(await screen.findByRole('link', { name: viMessages.content.back })).toBeTruthy();
    expect(screen.getByRole('link', { name: viMessages.content.back }).getAttribute('href')).toBe('/trip');
  });

  it('link khác môi trường → mã không hợp lệ ngay trên màn Quét, không tra cứu', async () => {
    const router = openFromTab();
    await scan('https://evil.example/q/Q1a');
    expect(await screen.findByText(viMessages.notice.invalid)).toBeTruthy();
    expect(router.state.location.pathname).toBe('/scan');
    expect(fakeLookup.calls).toEqual([]);
  });

  it('Đóng camera → về màn đã mở thanh tab', async () => {
    const router = openFromTab();
    fireEvent.click(await screen.findByRole('button', { name: viMessages.scanner.close }, SCANNER_LOAD));
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
  });
});
