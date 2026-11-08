// Bước chọn ngôn ngữ (tasks T036; US-M01-01 mục 1; SR-SCR-M01-001-002; BR-M02-024).
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createMemoryRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router';
import { visitorDb } from '../../../shared/db/visitorDb';
import { writeLanguagePreference } from '../storage/languageWriter';
import { LanguageControl } from './LanguageControl';
import { LanguageGate } from './LanguageGate';

function renderAt(path: string) {
  const router = createMemoryRouter(
    createRoutesFromElements(
      <>
        <Route path="/" element={<LanguageGate><h1>Trang M01</h1></LanguageGate>} />
        {/* Trang link QR của M02: không bọc gate, chỉ đặt LanguageControl */}
        <Route path="/q/:qrIdentifier" element={<><h1>Trang QR</h1><LanguageControl /></>} />
      </>,
    ),
    { initialEntries: [path] },
  );
  return render(<RouterProvider router={router} />);
}

describe('LanguageGate', () => {
  it('route thường chưa có ngôn ngữ → panel chọn chặn toàn trang', async () => {
    renderAt('/');
    expect(await screen.findByRole('button', { name: 'Tiếng Việt' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'English' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Trang M01' })).toBeNull();
  });

  it('panel song ngữ: tiêu đề tiếng Việt, dòng tiếng Anh kèm lang="en" (bảng copy SCR-M01-001)', async () => {
    renderAt('/');
    expect(await screen.findByRole('heading', { level: 1, name: 'Chọn ngôn ngữ' })).toBeTruthy();
    expect(screen.getByText('Choose your language').getAttribute('lang')).toBe('en');
    expect(screen.getByText('Chọn ngôn ngữ để bắt đầu hành trình khám phá Vườn quốc gia Cúc Phương.')).toBeTruthy();
    expect(
      screen.getByText('Choose a language to begin your journey through Cuc Phuong National Park.').getAttribute('lang'),
    ).toBe('en');
  });

  it('chọn English → lưu en và vào trang', async () => {
    renderAt('/');
    await userEvent.click(await screen.findByRole('button', { name: 'English' }));
    expect(await screen.findByRole('heading', { name: 'Trang M01' })).toBeTruthy();
    expect(await visitorDb.table('languagePreference').get('current')).toEqual({ slot: 'current', languageCode: 'en' });
  });

  it('đã có ngôn ngữ → không có panel', async () => {
    await writeLanguagePreference('vi');
    renderAt('/');
    expect(await screen.findByRole('heading', { name: 'Trang M01' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'English' })).toBeNull();
  });

  it('trang /q/… không có panel và không ghi gì cho tới khi bấm VI/EN (BR-M02-024)', async () => {
    renderAt('/q/qr-1');
    expect(await screen.findByRole('heading', { name: 'Trang QR' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Tiếng Việt' })).toBeNull();
    expect(await visitorDb.table('languagePreference').count()).toBe(0);
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    await expect.poll(() => visitorDb.table('languagePreference').get('current')).toEqual({
      slot: 'current',
      languageCode: 'en',
    });
  });
});
