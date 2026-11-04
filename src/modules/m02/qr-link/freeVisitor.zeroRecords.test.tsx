// Khách tự do không để lại bản ghi nào (tasks T077; constitution "Free-visitor path"; SC-M02-018; BR-M02-012):
// mở `/q/{id}` không phiên với mọi kết quả lookup → ba store M02 đều rỗng, không bao giờ tạo phiên.
import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, createRoutesFromElements, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { lookupClient } from '../api/lookupClient';
import type { FakeLookup } from '../api/fake/fakeLookup';
import type { LookupOutcome } from '../api/lookupClient';
import { contextV3 } from '../api/fake/fixtures';
import { vi as viMessages } from '../i18n/vi';
import { m02Routes } from '../routes';
import { checkpointVisitsTable, pendingSyncItemsTable, playSessionsTable } from '../storage/tables';
import { fakeM01 } from '../testing/fakeM01Port';

vi.mock('../m01Port', () => import('../testing/fakeM01Port'));
vi.mock('../api/mediaUrl', () => ({ mediaUrlClient: { signedUrls: async () => new Map() } }));
vi.mock('../api/lookupClient', async () => ({ lookupClient: (await import('../api/fake/fakeLookup')).createFakeLookup() }));

const fakeLookup = lookupClient as FakeLookup;

function openLink(qrIdentifier: string) {
  const router = createMemoryRouter(createRoutesFromElements(<>{m02Routes}</>), { initialEntries: [`/q/${qrIdentifier}`] });
  return render(<RouterProvider router={router} />);
}

async function storeCounts() {
  return [await playSessionsTable.count(), await checkpointVisitsTable.count(), await pendingSyncItemsTable.count()];
}

beforeEach(() => {
  fakeLookup.reset();
  fakeM01.reset();
  fakeM01.setLanguage({ languageCode: 'vi' });
  // Có cả handoff hợp lệ trong M01: trang `/q/…` vẫn không được tạo phiên từ nó
  fakeM01.setContext(contextV3({ authorizedAt: new Date(Date.now() - 60_000).toISOString() }));
});

describe('khách tự do mở /q/… — không bản ghi nào', () => {
  it.each<[string, LookupOutcome | 'SOURCE_ERROR' | null]>([
    ['VALID', null],
    ['TEMPORARILY_CLOSED', { kind: 'TEMPORARILY_CLOSED', closedScope: 'CHECKPOINT' }],
    ['INVALID', { kind: 'INVALID' }],
    ['lỗi nguồn / offline', 'SOURCE_ERROR'],
  ])('%s → playSessions, checkpointVisits, pendingSyncItems rỗng', async (_name, outcome) => {
    if (outcome) fakeLookup.set('Q1a', outcome);
    const { container } = openLink('Q1a');
    await waitFor(() => expect(container.querySelector('article[data-view]:not([data-view="LOADING"])')).not.toBeNull());
    expect(screen.getByText(viMessages.notice.freeVisitor)).toBeTruthy();
    expect(await storeCounts()).toEqual([0, 0, 0]);
    expect(fakeLookup.calls).toEqual([{ qrIdentifier: 'Q1a' }]);
  });
});
