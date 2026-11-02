// SCR-M03-009 Nhật ký hệ thống (tasks T145; BR-M03-F08, F09, A03): chỉ Quản lý; lọc thời gian/người/loại mục;
// Thành công/Không thành công; tên thao tác hiển thị; dấu tự xuất bản trên chính dòng xuất bản, không thành dòng thứ hai.
import { beforeAll, describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { FakeStore } from '../api/fake/store';
import { formatMessage } from '../messages/catalog';
import { renderAdmin } from '../testing/renderAdmin';
import { asRole } from '../testing/seedOperations';
import { seedCheckpoint } from '../testing/seedCheckpoints';

const PAGE_TEST_TIMEOUT = 15_000;

beforeAll(() => import('./AuditLogPage'));

/** Một điểm dừng do Nhân viên tạo và tự xuất bản; một lần Quản lý thu hồi QR thất bại */
async function seeded() {
  const store = new FakeStore();
  const { qrIdentifiers } = await seedCheckpoint(store, { name: 'Hang Con Moong', mode: 'OFFLINE_REQUIRED', visitPoints: [{ name: 'Cây chò', ready: true }], publish: true });
  await asRole(store, 'REVIEWER', (api) => api.revokeVisitPoint({ qrIdentifier: qrIdentifiers[0]!, reason: 'Thử', expected: { entity: 999 } }));
  return store;
}

async function openAudit(store: FakeStore, role: 'REVIEWER' | 'CONTENT_STAFF' = 'REVIEWER') {
  renderAdmin('/admin/audit', { store, signedInAs: role });
  await screen.findByRole('heading', { level: 1 }, { timeout: 5_000 });
}

const rows = () => within(screen.getByRole('table', { name: 'Nhật ký' })).getAllByRole('row').slice(1);

describe('SCR-M03-009 Nhật ký hệ thống (BR-M03-F08, F09, A03)', { timeout: PAGE_TEST_TIMEOUT }, () => {
  it('Nhân viên nội dung → MSG-NO-PERMISSION, không có bảng nhật ký', async () => {
    const store = await seeded();
    renderAdmin('/admin/audit', { store, signedInAs: 'CONTENT_STAFF' });
    expect(await screen.findByText(formatMessage('MSG-NO-PERMISSION'), {}, { timeout: 5_000 })).toBeTruthy();
    expect(screen.queryByRole('table', { name: 'Nhật ký' })).toBeNull();
  });

  it('Quản lý xem mọi dòng: tên thao tác, kết quả bằng chữ, mục, người; dấu tự xuất bản nằm trên dòng xuất bản', async () => {
    const store = await seeded();
    await openAudit(store);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Nhật ký hệ thống');
    await waitFor(() => expect(rows().length).toBe(store.audit.length));
    const publish = rows().find((row) => row.textContent?.includes('Xuất bản'))!;
    expect(publish.textContent).toMatch(/Điểm dừng: Hang Con Moong/);
    expect(publish.textContent).toMatch(/Thành công/);
    expect(publish.textContent).toMatch(/Tự xuất bản/);
    expect(rows().filter((row) => row.textContent?.includes('Tự xuất bản'))).toHaveLength(1);
    const revoke = rows().find((row) => row.textContent?.includes('Thu hồi mã QR'))!;
    expect(revoke.textContent).toMatch(/Không thành công/);
    expect(revoke.textContent).toMatch(/reviewer@example\.test/);
    const text = screen.getByRole('table', { name: 'Nhật ký' }).textContent ?? '';
    expect(text).not.toMatch(/PUBLISHED|QR_REVOKED|SUCCESS|FAILURE|CHECKPOINT\b|[{}]/);
  });

  it('lọc theo người thực hiện, loại mục và khoảng ngày', async () => {
    const store = await seeded();
    await openAudit(store);
    await waitFor(() => expect(rows().length).toBe(store.audit.length));

    fireEvent.change(screen.getByLabelText('Người thực hiện'), { target: { value: 'reviewer@example.test' } });
    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(rows()[0]!.textContent).toMatch(/Thu hồi mã QR/);
    fireEvent.change(screen.getByLabelText('Người thực hiện'), { target: { value: '' } });

    fireEvent.change(screen.getByLabelText('Loại mục'), { target: { value: 'QRCODE' } });
    await waitFor(() => expect(rows().every((row) => /Điểm tham quan/.test(row.textContent ?? ''))).toBe(true));
    fireEvent.change(screen.getByLabelText('Loại mục'), { target: { value: 'ALL' } });

    fireEvent.change(screen.getByLabelText('Từ ngày'), { target: { value: '01/01/2999' } });
    expect(await screen.findByText('Không có dòng nhật ký nào khớp.')).toBeTruthy();
  });
});
