import { beforeAll, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createFakeAdminApi } from '../api/fake/fakeAdminApi';
import { FIXTURE_ACCOUNTS } from '../api/fake/fixtures';
import { FakeStore } from '../api/fake/store';
import type { CheckpointContent } from '../contracts/adminDtos';
import { formatMessage } from '../messages/catalog';
import { renderAdmin } from '../testing/renderAdmin';
import { seedCheckpoint } from '../testing/seedCheckpoints';
import { publishSeededRoute, seedRoute } from '../testing/seedRoutes';

// Nạp sẵn chunk lazy của màn để ca đầu tiên không phụ thuộc thời gian nạp module
beforeAll(() => import('./PublicationReviewPage'));

/** Điểm dừng được hai tuyến đã xuất bản liệt kê, có bản nháp chờ với thay đổi cho trước */
async function setup(change: Partial<CheckpointContent>) {
  const store = new FakeStore();
  const { checkpointId } = await seedCheckpoint(store, {
    name: 'Hang Con Moong',
    mode: 'OFFLINE_REQUIRED',
    visitPoints: [{ name: 'Cây chò', ready: true }],
    publish: true,
  });
  for (const name of ['Tuyến A', 'Tuyến B']) {
    const { routeId } = await seedRoute(store, { complete: true, checkpointIds: [checkpointId], content: { name: { vi: name, en: `${name} (en)` } } });
    await publishSeededRoute(store, routeId);
  }
  store.currentUserId = FIXTURE_ACCOUNTS.CONTENT_STAFF.userId;
  const api = createFakeAdminApi(store);
  const editor = await api.getCheckpointEditor(checkpointId);
  const saved = await api.saveCheckpointDraft({
    checkpointId,
    expected: { entity: editor.concurrencyRevision, draft: editor.draft?.concurrencyRevision },
    content: { ...editor.published!.content, ...change },
  });
  if (!saved.ok) throw new Error('không lưu được bản nháp');
  const view = renderAdmin(`/admin/review/CHECKPOINT_REVISION/${checkpointId}`, { store, signedInAs: 'CONTENT_STAFF' });
  await screen.findByRole('heading', { level: 1, name: 'Xem lại & Xuất bản' });
  await screen.findByRole('button', { name: 'Quay lại sửa' });
  return { ...view, store, checkpointId };
}

const rename = { checkpointName: { vi: 'Hang Người Xưa', en: 'Ancient Cave' } };

describe('SCR-M03-004 — bản sửa điểm dừng (BR-M03-F05, G10, L07, X02, X03; SC-M03-020)', () => {
  it('liệt kê mọi tuyến bị ảnh hưởng và hậu quả; ghi chú tác động dùng từ vựng §5.4', async () => {
    await setup(rename);
    const affected = within(screen.getByRole('region', { name: 'Tuyến bị ảnh hưởng' }));
    for (const name of ['Tuyến A', 'Tuyến B']) {
      const item = affected.getByText(name).closest('li')!;
      expect(item.textContent).toContain('Đang hoạt động');
      expect(item.textContent).toContain('Gói tải trước của du khách cần cập nhật; các chuyến đang đi không bị thay đổi.');
    }
    expect(
      screen.getByText(formatMessage('MSG-AFFECTED-ROUTES', { số: 2, 'danh sách': 'Tuyến A, Tuyến B' })),
    ).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/snapshot|journey version|contentVersion/i);
  });

  it('đổi loại kết nối → MSG-REPRINT-MODE-CHANGED', async () => {
    await setup({ connectivityMode: 'ONLINE_AVAILABLE', fieldVerificationConfirmed: true });
    expect(screen.getByText(formatMessage('MSG-REPRINT-MODE-CHANGED', { tên: 'Hang Con Moong' }))).toBeTruthy();
  });

  it('bản sửa không đổi hành trình → mỗi tuyến nêu "Hành trình của tuyến không đổi.", không có ghi chú cập nhật (BR-M03-G05)', async () => {
    // Bản nháp khác nội dung (khoảng trắng thừa) nhưng hành trình như cũ vì snapshot cắt khoảng trắng. Lưu lại nội dung
    // giống hệt bản đang xuất bản không còn tạo bản nháp (BR-M03-D11; validation-report D-73)
    await setup({ checkpointName: { vi: 'Hang Con Moong ', en: 'Hang Con Moong (en)' } });
    const affected = within(screen.getByRole('region', { name: 'Tuyến bị ảnh hưởng' }));
    expect(affected.getAllByText('Hành trình của tuyến không đổi.')).toHaveLength(2);
    expect(screen.queryByText(/^Thay đổi này ảnh hưởng/)).toBeNull();
  });

  it('thao tác khác đang chạy → MSG-ROUTE-BUSY; không tự thử lại (BR-M03-L07)', async () => {
    const { store, checkpointId } = await setup(rename);
    store.holdLock(`checkpoint:${checkpointId}`);
    const before = store.audit.filter((row) => row.action === 'PUBLISHED').length;
    await userEvent.click(screen.getByRole('button', { name: 'Xuất bản' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Xuất bản' }));
    expect((await screen.findByRole('alert')).textContent).toBe(
      formatMessage('MSG-ROUTE-BUSY', { 'tên tuyến hoặc điểm dừng': 'Hang Con Moong' }),
    );
    expect(store.audit.filter((row) => row.action === 'PUBLISHED').length).toBe(before + 1);
    // Không xuất bản gì: bản nháp vẫn chờ
    const pending = [...store.state.revisions.values()].filter((rev) => rev.subjectId === checkpointId && rev.status === 'NHAP');
    expect(pending).toHaveLength(1);
  });

  it('gói tải trước vượt trần → MSG-OFFLINE-TOO-BIG nêu tên tuyến và ảnh nặng nhất; không xuất bản được', async () => {
    const store = new FakeStore();
    const { checkpointId } = await seedCheckpoint(store, {
      name: 'Hang Con Moong',
      mode: 'OFFLINE_REQUIRED',
      visitPoints: [{ name: 'Cây chò', ready: true }],
      publish: true,
    });
    const { routeId } = await seedRoute(store, { complete: true, checkpointIds: [checkpointId] });
    await publishSeededRoute(store, routeId);
    const extra = await seedCheckpoint(store, { name: 'Phụ', mode: 'OFFLINE_REQUIRED', visitPoints: [{ name: 'x', ready: true }] });
    // Thêm điểm tham quan nặng vào điểm dừng đang hoạt động
    store.currentUserId = FIXTURE_ACCOUNTS.CONTENT_STAFF.userId;
    const api = createFakeAdminApi(store);
    const heavy = [...store.state.media.values()].find((media) => media.ownerId === extra.checkpointId)!;
    heavy.ownerId = checkpointId;
    heavy.fileSizeBytes = 51 * 1_048_576;
    const intro = 'Thạch nhũ hình thành qua hàng nghìn năm trong lòng hang.';
    const saved = await api.saveVisitPointDraft({
      checkpointId,
      content: { objectName: { vi: 'Thạch nhũ', en: 'Stalactite' }, introductionText: { vi: intro, en: intro }, mediaItems: [{ mediaId: heavy.mediaId }] },
      mediaSettings: [{ mediaId: heavy.mediaId, usageRightsConfirmed: true }],
    });
    if (!saved.ok) throw new Error('cần điểm tham quan');
    renderAdmin(`/admin/review/QR_OBJECT/${saved.data.qrIdentifier}`, { store, signedInAs: 'CONTENT_STAFF' });
    const message = await screen.findByText(/^Gói tải trước của tuyến "Đường lên Mả Tổ" sẽ nặng khoảng /);
    expect(message.textContent).toContain('Thạch nhũ – ảnh 1');
    expect((screen.getByRole('button', { name: 'Xuất bản' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
