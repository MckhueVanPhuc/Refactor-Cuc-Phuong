// SCR-M01-002 trang kết quả riêng (quyết định người dùng 2026-11-21; FR-M01-004; HC-007).
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it } from 'vitest';
import { renderM01 } from '../testing/renderM01';

beforeAll(() => Promise.all([import('./RecommendPage'), import('./RecommendResultsPage')]));

const radio = (group: string, option: string) =>
  within(screen.getByRole('radiogroup', { name: group })).getByRole('radio', { name: option }) as HTMLInputElement;

async function submit(time: string) {
  await screen.findByRole('radiogroup', { name: 'Thời gian' });
  await userEvent.click(radio('Thời gian', time));
  await userEvent.click(radio('Đối tượng', 'Gia đình có trẻ nhỏ'));
  await userEvent.click(radio('Trải nghiệm', 'Khám phá'));
  await userEvent.click(screen.getByRole('button', { name: 'Xem tuyến phù hợp' }));
}

describe('RecommendResultsPage', () => {
  it('bấm "Xem tuyến phù hợp" mở trang kết quả riêng, form không còn trên trang', async () => {
    const { router } = await renderM01('/recommend');
    await submit('Vừa (trên 90 đến 180 phút)');
    expect(await screen.findByRole('heading', { level: 1, name: 'Tuyến phù hợp' })).toBeTruthy();
    expect(router.state.location.pathname).toBe('/recommend/results');
    expect(screen.queryByRole('radiogroup')).toBeNull();
    // Trang kết quả không hiện lại tiêu chí đã chọn (2026-11-28)
    expect(screen.queryByText('Vừa (trên 90 đến 180 phút)')).toBeNull();
    expect(screen.getByRole('link', { name: /Tuyến thử Bách Thảo/ })).toBeTruthy();
  });

  it('"Đổi tiêu chí" về form, lựa chọn còn nguyên và focus vào lựa chọn đang chọn', async () => {
    const { router } = await renderM01('/recommend');
    await submit('Vừa (trên 90 đến 180 phút)');
    await userEvent.click(await screen.findByRole('button', { name: 'Đổi tiêu chí' }));
    expect(await screen.findByRole('radiogroup', { name: 'Thời gian' })).toBeTruthy();
    expect(router.state.location.pathname).toBe('/recommend');
    expect(radio('Thời gian', 'Vừa (trên 90 đến 180 phút)').checked).toBe(true);
    expect(document.activeElement).toBe(radio('Thời gian', 'Vừa (trên 90 đến 180 phút)'));
  });

  it('mở chi tiết rồi quay lại vẫn thấy đúng kết quả (tiêu chí giữ trong bộ nhớ của layout)', async () => {
    const { router } = await renderM01('/recommend');
    await submit('Vừa (trên 90 đến 180 phút)');
    await userEvent.click(await screen.findByRole('link', { name: /Tuyến thử Bách Thảo/ }));
    await screen.findByRole('heading', { level: 1, name: 'Tuyến thử Bách Thảo' });
    await router.navigate(-1);
    expect(await screen.findByRole('heading', { level: 1, name: 'Tuyến phù hợp' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Tuyến thử Bách Thảo/ })).toBeTruthy();
  });

  it('mở thẳng trang kết quả khi chưa có tiêu chí → về form (không đọc tiêu chí từ URL hay storage)', async () => {
    const { router } = await renderM01('/recommend/results');
    expect(await screen.findByRole('radiogroup', { name: 'Thời gian' })).toBeTruthy();
    expect(router.state.location.pathname).toBe('/recommend');
  });
});
