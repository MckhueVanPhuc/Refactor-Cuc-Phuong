// SCR-M01-002 Gợi ý tuyến (tasks T089; OQ-SCR-M01-002-002; HC-007).
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it } from 'vitest';
import { visitorDb } from '../../../shared/db/visitorDb';
import { createFakeSource } from '../api/fake/fakeSource';
import { renderM01 } from '../testing/renderM01';

beforeAll(() => import('./RecommendPage'));

const radio = (group: string, option: string) =>
  within(screen.getByRole('radiogroup', { name: group })).getByRole('radio', { name: option }) as HTMLInputElement;

async function choose(group: string, option: string) {
  await userEvent.click(radio(group, option));
}

async function chooseAll(time: string) {
  await screen.findByRole('radiogroup', { name: 'Thời gian' });
  await choose('Thời gian', time);
  await choose('Đối tượng', 'Gia đình có trẻ nhỏ');
  await choose('Trải nghiệm', 'Khám phá');
  await userEvent.click(screen.getByRole('button', { name: 'Xem tuyến phù hợp' }));
}

describe('RecommendPage', () => {
  it('ba radio group; nút lọc vô hiệu khi thiếu tiêu chí', async () => {
    await renderM01('/recommend');
    expect(await screen.findByRole('radiogroup', { name: 'Thời gian' })).toBeTruthy();
    expect(screen.getByRole('radiogroup', { name: 'Đối tượng' })).toBeTruthy();
    expect(screen.getByRole('radiogroup', { name: 'Trải nghiệm' })).toBeTruthy();
    const submit = screen.getByRole('button', { name: 'Xem tuyến phù hợp' }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    await choose('Thời gian', 'Vừa (trên 90 đến 180 phút)');
    await choose('Đối tượng', 'Gia đình có trẻ nhỏ');
    expect(submit.disabled).toBe(true);
    await choose('Trải nghiệm', 'Khám phá');
    expect(submit.disabled).toBe(false);
  });

  it('dùng được bằng bàn phím: Space chọn, mũi tên đổi lựa chọn trong một nhóm', async () => {
    await renderM01('/recommend');
    await screen.findByRole('radiogroup', { name: 'Thời gian' });
    radio('Thời gian', 'Ngắn (đến 90 phút)').focus();
    await userEvent.keyboard(' ');
    expect(radio('Thời gian', 'Ngắn (đến 90 phút)').checked).toBe(true);
    await userEvent.keyboard('{ArrowDown}');
    expect(radio('Thời gian', 'Vừa (trên 90 đến 180 phút)').checked).toBe(true);
  });

  it('có kết quả: thẻ tuyến khớp cả ba tag', async () => {
    await renderM01('/recommend');
    // Fixture A: TIME_VUA, GIA_DINH_CO_TRE, KHAM_PHA
    await chooseAll('Vừa (trên 90 đến 180 phút)');
    expect(await screen.findByRole('link', { name: /Tuyến thử Bách Thảo/ })).toBeTruthy();
    expect(screen.queryByRole('link', { name: /Tuyến thử Ao Hồ/ })).toBeNull();
  });

  it('0 kết quả: câu copy; Đổi tiêu chí giữ lựa chọn; Xem tất cả tuyến về danh mục', async () => {
    const { router } = await renderM01('/recommend');
    await chooseAll('Dài (trên 180 phút)');
    expect(
      await screen.findByText('Chưa có tuyến phù hợp với lựa chọn của bạn. Bạn có thể đổi tiêu chí hoặc xem tất cả tuyến.'),
    ).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Đổi tiêu chí' }));
    expect(screen.queryByText(/Chưa có tuyến phù hợp/)).toBeNull();
    expect(radio('Thời gian', 'Dài (trên 180 phút)').checked).toBe(true);
    await userEvent.click(screen.getByRole('link', { name: 'Xem tất cả tuyến' }));
    expect(router.state.location.pathname).toBe('/');
  });

  it('không đọc được nguồn → báo nguồn, không báo "không có tuyến"', async () => {
    const fake = createFakeSource();
    fake.controls.setUnavailable(true);
    await renderM01('/recommend', { fake });
    expect(await screen.findByText('Chưa tải được danh sách tuyến. Hãy kiểm tra kết nối và thử lại.')).toBeTruthy();
    expect(screen.queryByText(/Chưa có tuyến phù hợp/)).toBeNull();
  });

  it('RecommendationContext không được lưu (HC-007)', async () => {
    await renderM01('/recommend');
    await screen.findByRole('radiogroup', { name: 'Thời gian' });
    await choose('Thời gian', 'Vừa (trên 90 đến 180 phút)');
    const counts = await Promise.all(
      visitorDb.tables.filter((table) => table.name !== 'languagePreference').map((table) => table.count()),
    );
    expect(counts.every((count) => count === 0)).toBe(true);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
});
