// Tín hiệu cho Mila từ M02 (specs/005 tasks T028–T030; contracts/mascot-event-contract.md §3). Chỉ phát sự kiện, không
// đổi hành vi hay chữ của màn.
import { fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { subscribeMascotEvents } from '../../../shared/mascot/events';
import { MediaList } from './MediaList';
import { ScanNotice } from './ScanNotice';

let seen: string[] = [];
let off: () => void = () => {};
const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

beforeEach(() => {
  vi.stubEnv('VITE_FEATURE_MASCOT', 'on');
  seen = [];
  off = subscribeMascotEvents((event) => seen.push(event.type === 'm02.media.playing' ? `${event.type}:${event.mediaType}` : event.type));
});

afterEach(() => {
  off();
  vi.unstubAllEnvs();
});

describe('ScanNotice', () => {
  it('CLOSED phát m02.notice.closedShown một lần; câu cố định giữ nguyên', async () => {
    const { container, rerender } = render(<ScanNotice kind="CLOSED" />);
    rerender(<ScanNotice kind="CLOSED" />);
    await flush();
    expect(seen).toEqual(['m02.notice.closedShown']);
    expect(container.textContent).toContain('This area is temporarily closed.');
  });

  it('INVALID, CONNECTION_NEEDED không phát gì', async () => {
    render(
      <>
        <ScanNotice kind="INVALID" />
        <ScanNotice kind="CONNECTION_NEEDED" />
      </>,
    );
    await flush();
    expect(seen).toEqual([]);
  });
});

describe('MediaList', () => {
  const items = [{ resource: { type: 'AUDIO' as const, sourceRef: 'media/a.mp3', spokenLanguage: 'vi' as const }, label: 'Âm thanh 1' }];
  const urls = new Map([['media/a.mp3', 'https://media.example/a.mp3']]);

  it('play → playing; pause, ended → stopped', async () => {
    const { container } = render(<MediaList items={items} urls={urls} />);
    const audio = container.querySelector('audio')!;
    fireEvent.play(audio);
    fireEvent.pause(audio);
    fireEvent.play(audio);
    fireEvent.ended(audio);
    await flush();
    expect(seen).toEqual(['m02.media.playing:AUDIO', 'm02.media.stopped', 'm02.media.playing:AUDIO', 'm02.media.stopped']);
  });

  it('bị gỡ khỏi DOM khi đang phát (đổi VI/EN) → stopped', async () => {
    const { container, unmount } = render(<MediaList items={items} urls={urls} />);
    fireEvent.play(container.querySelector('audio')!);
    unmount();
    await flush();
    expect(seen).toEqual(['m02.media.playing:AUDIO', 'm02.media.stopped']);
  });
});
