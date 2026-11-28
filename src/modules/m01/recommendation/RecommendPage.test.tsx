// SCR-M01-002 Gợi ý tuyến (tasks T089; OQ-SCR-M01-002-002; HC-007; spec-M01 v3.3, CHG-REC-2026-11-28-01): bốn nhóm ô
// chọn nhiều, chạm lại để bỏ, "Bỏ chọn tất cả", không chọn gì vẫn lọc được.
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it } from 'vitest';
import { visitorDb } from '../../../shared/db/visitorDb';
import { createFakeSource } from '../api/fake/fakeSource';
import { renderM01 } from '../testing/renderM01';

beforeAll(() => import('./RecommendPage'));

const box = (group: string, option: string) =>
  within(screen.getByRole('group', { name: group })).getByRole('checkbox', { name: option }) as HTMLInputElement;

async function toggle(group: string, option: string) {
  await userEvent.click(box(group, option));
}

const submit = () => screen.getByRole('button', { name: 'Xem tuyến phù hợp' }) as HTMLButtonElement;

/** Nút lọc bật khi danh mục đã đọc xong (catalog ready) */
async function clickSubmit() {
  await waitFor(() => expect(submit().disabled).toBe(false));
  await userEvent.click(submit());
}

// Fixture A "Tuyến thử Bách Thảo": TIME_VUA; GIA_DINH_CO_TRE, CA_NHAN_NGUOI_LON; KHAM_PHA; TU_THAM_QUAN.
// Fixture B "Tuyến thử Ao Hồ": TIME_NGAN; DI_THEO_DOAN; TIM_HIEU, THIEN_NHIEN_CHUP_ANH; CO_HUONG_DAN_VIEN, TU_THAM_QUAN.
const A = /Tuyến thử Bách Thảo/;
const B = /Tuyến thử Ao Hồ/;

describe('RecommendPage', () => {
  it('bốn nhóm ô chọn nhiều; nút lọc bật cả khi chưa chọn gì', async () => {
    await renderM01('/recommend');
    for (const name of ['Thời gian', 'Đối tượng', 'Trải nghiệm', 'Hướng dẫn viên']) {
      expect(await screen.findByRole('group', { name })).toBeTruthy();
    }
    expect(box('Đối tượng', 'Đi theo đoàn')).toBeTruthy();
    expect(box('Hướng dẫn viên', 'Cần hướng dẫn viên')).toBeTruthy();
    expect(box('Hướng dẫn viên', 'Tự tham quan')).toBeTruthy();
    expect(screen.queryByText('Cần đi dễ dàng')).toBeNull();
    // Không chọn gì vẫn lọc được: nút bật khi danh mục đọc xong
    await waitFor(() => expect(submit().disabled).toBe(false));
  });

  it('chạm để chọn, chạm lại để bỏ; chọn nhiều ý trong một nhóm', async () => {
    await renderM01('/recommend');
    await screen.findByRole('group', { name: 'Thời gian' });
    await toggle('Thời gian', 'Ngắn (đến 90 phút)');
    await toggle('Thời gian', 'Vừa (trên 90 đến 180 phút)');
    expect(box('Thời gian', 'Ngắn (đến 90 phút)').checked).toBe(true);
    expect(box('Thời gian', 'Vừa (trên 90 đến 180 phút)').checked).toBe(true);
    await toggle('Thời gian', 'Ngắn (đến 90 phút)');
    expect(box('Thời gian', 'Ngắn (đến 90 phút)').checked).toBe(false);
    expect(box('Thời gian', 'Vừa (trên 90 đến 180 phút)').checked).toBe(true);
  });

  it('dùng được bằng bàn phím: Space bật/tắt ô đang focus', async () => {
    await renderM01('/recommend');
    await screen.findByRole('group', { name: 'Thời gian' });
    box('Thời gian', 'Ngắn (đến 90 phút)').focus();
    await userEvent.keyboard(' ');
    expect(box('Thời gian', 'Ngắn (đến 90 phút)').checked).toBe(true);
    await userEvent.keyboard(' ');
    expect(box('Thời gian', 'Ngắn (đến 90 phút)').checked).toBe(false);
  });

  it('"Bỏ chọn tất cả" chỉ hiện khi có ý được chọn; bấm thì bỏ mọi ý ở cả bốn nhóm', async () => {
    await renderM01('/recommend');
    await screen.findByRole('group', { name: 'Thời gian' });
    expect(screen.queryByRole('button', { name: 'Bỏ chọn tất cả' })).toBeNull();
    await toggle('Thời gian', 'Dài (trên 180 phút)');
    await toggle('Hướng dẫn viên', 'Tự tham quan');
    await userEvent.click(screen.getByRole('button', { name: 'Bỏ chọn tất cả' }));
    expect(screen.getAllByRole('checkbox').every((input) => !(input as HTMLInputElement).checked)).toBe(true);
    expect(screen.queryByRole('button', { name: 'Bỏ chọn tất cả' })).toBeNull();
    // Nút biến mất: focus về ô đầu tiên, không rơi khỏi form
    expect(document.activeElement).toBe(box('Thời gian', 'Ngắn (đến 90 phút)'));
  });

  it('không chọn gì → mọi tuyến chọn được', async () => {
    await renderM01('/recommend');
    await screen.findByRole('group', { name: 'Thời gian' });
    await clickSubmit();
    expect(await screen.findByRole('link', { name: A })).toBeTruthy();
    expect(screen.getByRole('link', { name: B })).toBeTruthy();
  });

  it('HOẶC trong nhóm, VÀ giữa nhóm; trang kết quả không hiện lại tiêu chí', async () => {
    await renderM01('/recommend');
    await screen.findByRole('group', { name: 'Thời gian' });
    await toggle('Thời gian', 'Ngắn (đến 90 phút)');
    await toggle('Thời gian', 'Vừa (trên 90 đến 180 phút)');
    await toggle('Hướng dẫn viên', 'Cần hướng dẫn viên');
    await clickSubmit();
    expect(await screen.findByRole('link', { name: B })).toBeTruthy();
    expect(screen.queryByRole('link', { name: A })).toBeNull();
    // Không chip tiêu chí ở trang kết quả (chủ dự án 2026-11-28)
    expect(screen.queryByText('Cần hướng dẫn viên')).toBeNull();
  });

  it('0 kết quả: câu copy; Đổi tiêu chí giữ lựa chọn; Xem tất cả tuyến về danh mục', async () => {
    const { router } = await renderM01('/recommend');
    await screen.findByRole('group', { name: 'Thời gian' });
    await toggle('Thời gian', 'Dài (trên 180 phút)');
    await clickSubmit();
    expect(
      await screen.findByText('Chưa có tuyến phù hợp với lựa chọn của bạn. Bạn có thể đổi tiêu chí hoặc xem tất cả tuyến.'),
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Xem tất cả tuyến' }).getAttribute('href')).toBe('/');
    await userEvent.click(screen.getByRole('button', { name: 'Đổi tiêu chí' }));
    await screen.findByRole('group', { name: 'Thời gian' });
    expect(screen.queryByText(/Chưa có tuyến phù hợp/)).toBeNull();
    expect(box('Thời gian', 'Dài (trên 180 phút)').checked).toBe(true);
    // Focus về ô đang chọn, không phải ô đầu tiên của nhóm
    expect(document.activeElement).toBe(box('Thời gian', 'Dài (trên 180 phút)'));
    expect(screen.queryByRole('link', { name: 'Xem tất cả tuyến' })).toBeNull();
    expect(router.state.location.pathname).toBe('/recommend');
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
    await screen.findByRole('group', { name: 'Thời gian' });
    await toggle('Thời gian', 'Vừa (trên 90 đến 180 phút)');
    const counts = await Promise.all(
      visitorDb.tables.filter((table) => table.name !== 'languagePreference').map((table) => table.count()),
    );
    expect(counts.every((count) => count === 0)).toBe(true);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
});
