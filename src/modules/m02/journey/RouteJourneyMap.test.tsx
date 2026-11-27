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

  it('thanh tiến trình k/n dưới câu tiến độ, câu giữ nguyên văn (specs/006 T023; E-SCR-M02-001-25)', () => {
    render(<RouteJourneyMap checkpoints={CHECKPOINTS} visits={[visit]} onOpen={() => {}} />);
    const label = viMessages.journey.progress({ scanned: 1, total: 3 });
    expect(screen.getByText(label)).toBeTruthy();
    const bar = screen.getByRole('progressbar', { name: label });
    expect(bar.getAttribute('aria-valuenow')).toBe('1');
    expect(bar.getAttribute('aria-valuemax')).toBe('3');
  });

  it('mở khóa: điểm vừa ghé có data-unlock; không có dấu hoặc điểm chưa quét → không (specs/006 T023)', () => {
    const { rerender } = render(<RouteJourneyMap checkpoints={CHECKPOINTS} visits={[visit]} onOpen={() => {}} unlock="C2" />);
    expect(items().filter((li) => li.hasAttribute('data-unlock')).map((li) => li.getAttribute('data-checkpoint'))).toEqual(['C2']);
    rerender(<RouteJourneyMap checkpoints={CHECKPOINTS} visits={[visit]} onOpen={() => {}} />);
    expect(items().some((li) => li.hasAttribute('data-unlock'))).toBe(false);
    rerender(<RouteJourneyMap checkpoints={CHECKPOINTS} visits={[visit]} onOpen={() => {}} unlock="C3" />);
    expect(items().some((li) => li.hasAttribute('data-unlock'))).toBe(false);
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

  // —— CHG-MASCOT-2026-11-27-07: thẻ tuyến, điểm tiếp theo, hàng đã quét (E-SCR-M02-001-07, -25, -26) ——
  it('thẻ tuyến: nhãn, tên tuyến theo ngôn ngữ, "Còn r điểm"; không có tên tuyến → không dòng tên', () => {
    const { rerender } = render(
      <RouteJourneyMap checkpoints={CHECKPOINTS} visits={[visit]} onOpen={() => {}} routeName={{ vi: 'Tuyến A', en: 'Route A' }} />,
    );
    const card = document.querySelector('[data-route-summary]') as HTMLElement;
    expect(within(card).getByText(viMessages.journey.currentRoute)).toBeTruthy();
    expect(within(card).getByText('Tuyến A')).toBeTruthy();
    expect(within(card).getByText(viMessages.journey.progress({ scanned: 1, total: 3 }))).toBeTruthy();
    expect(within(card).getByText(viMessages.journey.remaining({ r: 2 }))).toBeTruthy();
    act(() => fakeM01.setLanguage({ languageCode: 'en' }));
    expect(within(card).getByText('Route A')).toBeTruthy();
    expect(within(card).getByText(en.journey.remaining({ r: 2 }))).toBeTruthy();
    act(() => fakeM01.setLanguage({ languageCode: 'vi' }));
    rerender(<RouteJourneyMap checkpoints={CHECKPOINTS} visits={[visit]} onOpen={() => {}} />);
    expect(screen.queryByText('Tuyến A')).toBeNull();
    expect(screen.getByText(viMessages.journey.currentRoute)).toBeTruthy();
  });

  it('thanh chia đoạn: mỗi điểm một đoạn theo thứ tự hiển thị; đã quét / tiếp theo / còn lại', () => {
    render(<RouteJourneyMap checkpoints={[...CHECKPOINTS].reverse()} visits={[visit]} onOpen={() => {}} unlock="C2" />);
    const bar = screen.getByRole('progressbar');
    const segments = [...bar.children];
    expect(segments.map((s) => s.getAttribute('data-state'))).toEqual(['next', 'scanned', 'pending']);
    expect(segments.map((s) => s.hasAttribute('data-unlock'))).toEqual([false, true, false]);
  });

  it('điểm tiếp theo = điểm chưa quét đầu tiên theo thứ tự hiển thị, có nhãn "Tiếp theo"; quét hết → không có (BR-M02-006)', () => {
    const { rerender } = render(<RouteJourneyMap checkpoints={CHECKPOINTS} visits={[visit]} onOpen={() => {}} />);
    const [first, second, third] = items();
    expect(first!.getAttribute('data-state')).toBe('next');
    expect(within(first!).getByText(viMessages.journey.next)).toBeTruthy();
    expect(within(second!).queryByText(viMessages.journey.next)).toBeNull();
    expect(within(third!).queryByText(viMessages.journey.next)).toBeNull();
    const all = CHECKPOINTS.map((c, i) => ({ ...visit, checkpointId: c.checkpointId, qrIdentifier: `Q${i}` }));
    rerender(<RouteJourneyMap checkpoints={CHECKPOINTS} visits={all} onOpen={() => {}} />);
    expect(screen.queryByText(viMessages.journey.next)).toBeNull();
    expect(screen.getByText(viMessages.journey.allScanned)).toBeTruthy();
  });

  it('hàng đã quét: vòng ✓ thay số và mũi tên › trong nút; hàng chưa quét giữ số', () => {
    render(<RouteJourneyMap checkpoints={CHECKPOINTS} visits={[visit]} onOpen={() => {}} />);
    const [first, second] = items();
    expect(second!.getAttribute('data-state')).toBe('scanned');
    expect(second!.textContent!.trim().charAt(0)).not.toBe('2');
    expect(within(screen.getByRole('button')).getByText(viMessages.trip.scanned)).toBeTruthy();
    expect(screen.getByRole('button').querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
    expect(first!.textContent!.trim().charAt(0)).toBe('1');
  });

  it('không chữ nào nói "đã đến", "có mặt", "arrived" (SC-M02-013)', () => {
    const { container } = render(<RouteJourneyMap checkpoints={CHECKPOINTS} visits={[visit]} onOpen={() => {}} />);
    for (const word of ['đã đến', 'có mặt', 'arrived']) expect(container.textContent!.toLowerCase()).not.toContain(word);
  });
});
