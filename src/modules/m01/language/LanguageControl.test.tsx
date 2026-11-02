// Control VI/EN dùng chung (tasks T037; US-M01-01 mục 3; FR-M01-001).
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { languagePreferenceTable } from '../storage/tables';
import { writeLanguagePreference } from '../storage/languageWriter';
import { readLanguagePreference } from '../storage/readers';
import { LanguageControl } from './LanguageControl';
import { useLanguagePreference } from './useLanguagePreference';

function Probe() {
  const preference = useLanguagePreference();
  return <p data-testid="probe">{preference?.languageCode ?? 'none'}</p>;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('LanguageControl', () => {
  it('bấm VI/EN cập nhật LanguagePreference ngay và đánh dấu aria-pressed', async () => {
    await writeLanguagePreference('vi');
    render(<LanguageControl />);
    const en = await screen.findByRole('button', { name: 'EN' });
    await vi.waitFor(() => expect(screen.getByRole('button', { name: 'VI' }).getAttribute('aria-pressed')).toBe('true'));
    await userEvent.click(en);
    expect(await readLanguagePreference()).toEqual({ languageCode: 'en' });
    await vi.waitFor(() => expect(en.getAttribute('aria-pressed')).toBe('true'));
    expect(screen.getByRole('group', { name: 'Language' })).toBeTruthy();
  });

  it('chưa lưu: nút theo ngôn ngữ thiết bị được đánh dấu, không ghi gì', async () => {
    vi.stubGlobal('navigator', { ...navigator, language: 'vi-VN' });
    render(<LanguageControl />);
    await vi.waitFor(() => expect(screen.getByRole('button', { name: 'VI' }).getAttribute('aria-pressed')).toBe('true'));
    expect(screen.getByRole('group', { name: 'Ngôn ngữ' })).toBeTruthy();
    expect(await readLanguagePreference()).toBeNull();
  });

  it('thay đổi từ nơi khác (tab khác ghi cùng database) hiện ngay qua liveQuery', async () => {
    render(<Probe />);
    await vi.waitFor(() => expect(screen.getByTestId('probe').textContent).toBe('none'));
    await act(async () => {
      await languagePreferenceTable.put({ slot: 'current', languageCode: 'en' });
    });
    await vi.waitFor(() => expect(screen.getByTestId('probe').textContent).toBe('en'));
  });
});
