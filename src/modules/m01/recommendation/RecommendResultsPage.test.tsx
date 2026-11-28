// SCR-M01-002 trang kết quả riêng (quyết định người dùng 2026-11-21; FR-M01-004; HC-007; spec-M01 v3.3).
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { subscribeMascotEvents } from '../../../shared/mascot/events';
import { renderM01 } from '../testing/renderM01';

// Sự kiện mở form của Mila: quay lại từ trang kết quả thì fromResults (spec-Mascot v1.11)
let opened: boolean[] = [];
let off: () => void = () => {};
beforeEach(() => {
  vi.stubEnv('VITE_FEATURE_MASCOT', 'on');
  opened = [];
  off = subscribeMascotEvents((event) => {
    if (event.type === 'm01.recommend.opened') opened.push(event.fromResults);
  });
});
afterEach(() => {
  off();
  vi.unstubAllEnvs();
});

beforeAll(() => Promise.all([import('./RecommendPage'), import('./RecommendResultsPage')]));

const radio = (group: string, option: string) =>
  within(screen.getByRole('group', { name: group })).getByRole('checkbox', { name: option }) as HTMLInputElement;

async function submit(time: string) {
  await screen.findByRole('group', { name: 'Thời gian' });
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
    expect(screen.queryByRole('group', { name: 'Thời gian' })).toBeNull();
    expect(screen.getByText('Vừa (trên 90 đến 180 phút)')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Tuyến thử Bách Thảo/ })).toBeTruthy();
  });

  it('"Đổi tiêu chí" về form, lựa chọn còn nguyên và focus vào lựa chọn đang chọn', async () => {
    const { router } = await renderM01('/recommend');
    await submit('Vừa (trên 90 đến 180 phút)');
    await userEvent.click(await screen.findByRole('button', { name: 'Đổi tiêu chí' }));
    expect(await screen.findByRole('group', { name: 'Thời gian' })).toBeTruthy();
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

  // spec-M01 v3.3: không chọn gì là mọi tuyến chọn được, nên mở thẳng trang kết quả không còn đưa về form
  it('mở thẳng trang kết quả khi chưa có tiêu chí → mọi tuyến chọn được, không chip (không đọc tiêu chí từ URL hay storage)', async () => {
    const { router } = await renderM01('/recommend/results');
    expect(await screen.findByRole('link', { name: /Tuyến thử Bách Thảo/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Tuyến thử Ao Hồ/ })).toBeTruthy();
    expect(router.state.location.pathname).toBe('/recommend/results');
  });

  it('Mila: mở form bằng link → nói; quay lại bằng "Đổi tiêu chí" hay Back → fromResults (không nói)', async () => {
    const { router } = await renderM01('/recommend');
    await submit('Vừa (trên 90 đến 180 phút)');
    await userEvent.click(await screen.findByRole('button', { name: 'Đổi tiêu chí' }));
    await screen.findByRole('group', { name: 'Thời gian' });
    await userEvent.click(screen.getByRole('button', { name: 'Xem tuyến phù hợp' }));
    await screen.findByRole('heading', { level: 1, name: 'Tuyến phù hợp' });
    await router.navigate(-1);
    await screen.findByRole('group', { name: 'Thời gian' });
    // Rời kết quả sang chỗ khác rồi mở form bằng link: Mila nói như thường
    await router.navigate('/');
    await screen.findByRole('heading', { level: 1, name: 'Danh mục tuyến' });
    await router.navigate('/recommend');
    await screen.findByRole('group', { name: 'Thời gian' });
    expect(opened).toEqual([false, true, true, false]);
  });
});
