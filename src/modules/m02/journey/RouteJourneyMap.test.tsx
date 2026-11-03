// RouteJourneyMap (tasks T037; BR-M02-006; FR-M02-008, 009; SC-M02-013, 019) với cổng M01 giả.
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CHECKPOINTS } from '../api/fake/fixtures';
import { en } from '../i18n/en';
import { vi as viMessages } from '../i18n/vi';
import type { CheckpointVisitRow } from '../storage/rows';
import { fakeM01 } from '../testing/fakeM01Port';
import { RouteJourneyMap } from './RouteJourneyMap';

vi.mock('../m01Port', () => import('../testing/fakeM01Port'));

const SESSION = '5b1e2d3c-4a5f-4e6d-8c7b-9a0f1e2d3c4b';
const visit: CheckpointVisitRow = { sessionId: SESSION, checkpointId: 'C2', qrIdentifier: 'QN', checkedInAt: '2026-11-04T02:15:00.000Z' };

beforeEach(() => {
  fakeM01.reset();
  fakeM01.setLanguage({ languageCode: 'vi' });
});

const items = () => screen.getAllByRole('listitem');

describe('RouteJourneyMap', () => {
  it('sắp theo sequence, đánh số liên tục 1, 2, 3 cho seq 1, 3, 5 (BR-M02-006)', () => {
    // Đảo thứ tự đầu vào để chắc thứ tự đến từ sequence
    render(<RouteJourneyMap checkpoints={[...CHECKPOINTS].reverse()} visits={[]} onOpen={() => {}} />);
    expect(items().map((li) => li.getAttribute('data-checkpoint'))).toEqual(['C1', 'C2', 'C3']);
    expect(items().map((li) => li.textContent!.trim().charAt(0))).toEqual(['1', '2', '3']);
  });

  it('điểm đã quét ghi "Đã quét QR" và giờ quét; điểm chưa quét ghi "Chưa quét"; số đã quét/tổng', () => {
    render(<RouteJourneyMap checkpoints={CHECKPOINTS} visits={[visit]} onOpen={() => {}} />);
    const [first, second] = items();
    expect(within(second!).getByText(viMessages.trip.scanned)).toBeTruthy();
    const time = new Date(visit.checkedInAt);
    const hhmm = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
    expect(second!.textContent).toContain(hhmm);
    expect(within(first!).getByText(viMessages.journey.notScanned)).toBeTruthy();
    expect(screen.getByText(viMessages.journey.progress({ scanned: 1, total: 3 }))).toBeTruthy();
  });

  it('tên theo ngôn ngữ hiện tại và đổi ngay khi đổi VI/EN (SC-M02-019)', () => {
    render(<RouteJourneyMap checkpoints={CHECKPOINTS} visits={[visit]} onOpen={() => {}} />);
    expect(screen.getByText('Cây chò ngàn năm')).toBeTruthy();
    act(() => fakeM01.setLanguage({ languageCode: 'en' }));
    expect(screen.getByText('Thousand-year-old tree')).toBeTruthy();
    expect(screen.getByText(en.trip.scanned)).toBeTruthy();
    expect(screen.queryByText('Cây chò ngàn năm')).toBeNull();
  });

  it('chạm điểm đã quét → xem lại lượt ghé đó; điểm chưa quét không bấm được (FR-M02-009)', () => {
    const onOpen = vi.fn();
    render(<RouteJourneyMap checkpoints={CHECKPOINTS} visits={[visit]} onOpen={onOpen} />);
    expect(screen.getAllByRole('button')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button'));
    expect(onOpen).toHaveBeenCalledWith(visit);
  });

  it('không chữ nào nói "đã đến", "có mặt", "arrived" (SC-M02-013)', () => {
    const { container } = render(<RouteJourneyMap checkpoints={CHECKPOINTS} visits={[visit]} onOpen={() => {}} />);
    for (const word of ['đã đến', 'có mặt', 'arrived']) expect(container.textContent!.toLowerCase()).not.toContain(word);
  });
});
