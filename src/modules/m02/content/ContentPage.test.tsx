// SCR-M02-002 (tasks T050; BR-M02-014, 016; FR-M02-009, 011; SC-M02-008, 011) với cổng M01, lookup và Storage giả.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CHECKPOINTS, LIVE_CONTENT, readyPackage, ROUTE_A } from '../api/fake/fixtures';
import { vi as viMessages } from '../i18n/vi';
import type { ScanDisplay } from '../scan/resolveScan';
import type { ScanResult } from '../scan/processScan';
import type { ContentRouteState } from '../session/TripPage';
import { checkpointVisitsTable, playSessionsTable } from '../storage/tables';
import { fakeM01 } from '../testing/fakeM01Port';
import { ContentPage } from './ContentPage';

vi.mock('../m01Port', () => import('../testing/fakeM01Port'));
vi.mock('../api/mediaUrl', () => ({
  mediaUrlClient: {
    signedUrls: async (refs: readonly string[]) => new Map(refs.filter((r) => !r.includes('broken')).map((r) => [r, `https://signed.test/${r}`])),
  },
}));
vi.mock('../api/lookupClient', async () => ({ lookupClient: (await import('../api/fake/fakeLookup')).createFakeLookup() }));

const SESSION = '5b1e2d3c-4a5f-4e6d-8c7b-9a0f1e2d3c4b';
const session = { sessionId: SESSION, routeId: ROUTE_A, contentVersion: 3 };
const [c1, c2] = CHECKPOINTS as [(typeof CHECKPOINTS)[number], (typeof CHECKPOINTS)[number]];

function scanOf(qrIdentifier: string, display: ScanDisplay, change: Partial<ScanResult> = {}): ScanResult {
  return { qrIdentifier, display, freeVisitor: false, session, visit: null, visitCreated: false, finalPromptNeeded: false, ...change };
}

function renderContent(qrIdentifier: string, state: ContentRouteState) {
  const router = createMemoryRouter([{ path: '/trip/qr/:qrIdentifier', element: <ContentPage /> }], {
    initialEntries: [{ pathname: `/trip/qr/${qrIdentifier}`, state }],
  });
  return render(<RouterProvider router={router} />);
}

const live = (qr: string) => scanOf(qr, { kind: 'LIVE', content: LIVE_CONTENT[qr]! });
const view = (container: HTMLElement) => container.querySelector('article')?.getAttribute('data-view');

beforeEach(() => {
  fakeM01.reset();
  fakeM01.setLanguage({ languageCode: 'vi' });
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:test'), revokeObjectURL: vi.fn() }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ContentPage', () => {
  it('nội dung của đúng mã: hai mã của C1 cho hai nội dung khác nhau (BR-M02-014; SC-M02-008)', async () => {
    const first = renderContent('Q1a', { scan: live('Q1a') });
    expect(await screen.findByRole('heading', { name: 'Đối tượng Q1a' })).toBeTruthy();
    first.unmount();
    renderContent('Q1b', { scan: live('Q1b') });
    expect(await screen.findByRole('heading', { name: 'Đối tượng Q1b' })).toBeTruthy();
    expect(screen.getByText('Giới thiệu trực tuyến Q1b.')).toBeTruthy();
  });

  it('audio/video: controls + preload="none", không autoplay; chỉ tệp vi + NONE (BR-M02-016, 026)', async () => {
    const { container } = renderContent('Q2', { scan: live('Q2') });
    await screen.findByText('Âm thanh 1');
    const players = [...container.querySelectorAll('audio, video')];
    expect(players.map((p) => p.getAttribute('src'))).toEqual(['https://signed.test/media/q2-vi.mp3', 'https://signed.test/media/q2-none.mp4']);
    for (const player of players) {
      expect(player.hasAttribute('controls')).toBe(true);
      expect(player.getAttribute('preload')).toBe('none');
      expect(player.hasAttribute('autoplay')).toBe(false);
    }
  });

  it('đổi sang EN: tệp vi bị gỡ khỏi DOM (dừng phát), tệp en hiện, NONE còn (SC-M02-019)', async () => {
    const { container } = renderContent('Q2', { scan: live('Q2') });
    await screen.findByText('Âm thanh 1');
    const viAudio = container.querySelector('[data-media="media/q2-vi.mp3"] audio');
    act(() => fakeM01.setLanguage({ languageCode: 'en' }));
    expect(await screen.findByText('Audio 1')).toBeTruthy();
    expect(viAudio!.isConnected).toBe(false);
    expect([...container.querySelectorAll('[data-media]')].map((el) => el.getAttribute('data-media'))).toEqual(['media/q2-en.mp3', 'media/q2-none.mp4']);
  });

  it('lỗi nguồn → "Chưa tải được nội dung mới…" rồi nội dung gói, không có điều khiển media (SC-M02-011)', async () => {
    fakeM01.setPackage(readyPackage());
    const { container } = renderContent('Q1a', { scan: scanOf('Q1a', { kind: 'PACKAGE', checkpoint: c1 }) });
    expect(await screen.findByText(viMessages.notice.sourceFailureInJourney)).toBeTruthy();
    expect(await screen.findByRole('heading', { name: 'Q1a (gói)' })).toBeTruthy();
    expect(container.querySelectorAll('audio, video')).toHaveLength(0);
  });

  it('gói cũ → cảnh báo; offline điểm có mạng → "Điểm này cần có mạng…"; thiếu resource → "Chưa có nội dung offline…"', async () => {
    fakeM01.setPackage(readyPackage(2, 'OUTDATED'));
    const a = renderContent('Q1a', { scan: scanOf('Q1a', { kind: 'PACKAGE', checkpoint: c1 }) });
    expect(await screen.findByText(viMessages.content.outdatedPackage)).toBeTruthy();
    a.unmount();
    const b = renderContent('Q2', { scan: scanOf('Q2', { kind: 'PACKAGE', checkpoint: c2 }) });
    expect((await screen.findByRole('alert')).textContent).toContain(viMessages.content.needsNetwork);
    b.unmount();
    fakeM01.reset();
    fakeM01.setLanguage({ languageCode: 'vi' });
    renderContent('Q1a', { scan: scanOf('Q1a', { kind: 'PACKAGE', checkpoint: c1 }) });
    expect((await screen.findByRole('alert')).textContent).toContain(viMessages.notice.noOfflineResource);
  });

  it('ảnh lỗi → placeholder; chữ vẫn hiện', async () => {
    const { container } = renderContent('Q1a', { scan: live('Q1a') });
    const img = await screen.findByRole('img', { name: 'Đối tượng Q1a' });
    fireEvent.error(img);
    await waitFor(() => expect(container.querySelector('[data-image="placeholder"]')).not.toBeNull());
    expect(screen.getByText('Giới thiệu trực tuyến Q1a.')).toBeTruthy();
  });

  it('media không ký được hoặc không phát được → thông báo lỗi tệp; chữ và ảnh còn', async () => {
    const content = structuredClone(LIVE_CONTENT.Q2!);
    content.mediaResources = [
      { type: 'AUDIO', sourceRef: 'media/broken.mp3', spokenLanguage: 'vi' },
      { type: 'VIDEO', sourceRef: 'media/q2-none.mp4', spokenLanguage: 'NONE' },
    ];
    const { container } = renderContent('Q2', { scan: scanOf('Q2', { kind: 'LIVE', content }) });
    await screen.findByText('Âm thanh 1');
    expect(screen.getAllByText(viMessages.content.mediaError)).toHaveLength(1);
    fireEvent.error(container.querySelector('video')!);
    await waitFor(() => expect(screen.getAllByText(viMessages.content.mediaError)).toHaveLength(2));
    expect(screen.getByRole('heading', { name: 'Đối tượng Q2' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Đối tượng Q2' })).toBeTruthy();
  });

  it('ảnh của gói là object URL và được thu hồi khi rời màn', async () => {
    fakeM01.setPackage(readyPackage());
    const { unmount } = renderContent('Q1a', { scan: scanOf('Q1a', { kind: 'PACKAGE', checkpoint: c1 }) });
    expect((await screen.findByRole('img', { name: 'Q1a (gói)' })).getAttribute('src')).toBe('blob:test');
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
  });

  it('xem lại (không có kết quả trong router state): hiện giờ ghé gốc dạng hh:mm dd/mm/yyyy, không ghi lượt ghé mới', async () => {
    await playSessionsTable.add({
      sessionId: SESSION,
      sourceHandoffId: '1d0c6a2e-7b4f-4c3a-9e8d-2f1a0b9c8d7e',
      routeId: ROUTE_A,
      contentVersion: 3,
      journeyCheckpoints: structuredClone([...CHECKPOINTS]),
      status: 'DANG_DIEN_RA',
      startedAt: '2026-11-04T02:00:00.000Z',
    });
    const checkedInAt = '2026-11-04T02:15:00.000Z';
    await checkpointVisitsTable.add({ sessionId: SESSION, checkpointId: 'C1', qrIdentifier: 'Q1a', checkedInAt });
    const { container } = renderContent('Q1b', { review: true });
    await waitFor(() => expect(view(container)).toBe('LIVE'));
    const d = new Date(checkedInAt);
    const pad = (n: number) => String(n).padStart(2, '0');
    const expected = `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    expect(await screen.findByText(viMessages.content.scannedAt({ time: expected }))).toBeTruthy();
    expect(await checkpointVisitsTable.count()).toBe(1);
  });

  it('khách tự do: gợi ý + "Chọn tuyến"; vừa ghi lượt ghé: "Đã ghi nhận lượt quét."', async () => {
    const a = renderContent('Q1a', { scan: { ...live('Q1a'), freeVisitor: true, session: null } });
    expect(await screen.findByText(viMessages.notice.freeVisitor)).toBeTruthy();
    expect(screen.getByRole('link', { name: viMessages.qrLink.chooseRoute }).getAttribute('href')).toBe('/');
    a.unmount();
    renderContent('Q1a', { scan: { ...live('Q1a'), visitCreated: true } });
    expect(await screen.findByText(viMessages.trip.visitRecorded)).toBeTruthy();
  });
});
