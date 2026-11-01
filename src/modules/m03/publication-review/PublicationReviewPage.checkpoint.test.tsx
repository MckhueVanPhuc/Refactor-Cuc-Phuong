import { beforeAll, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createFakeAdminApi } from '../api/fake/fakeAdminApi';
import { FIXTURE_ACCOUNTS } from '../api/fake/fixtures';
import { FakeStore } from '../api/fake/store';
import type { AdminRole } from '../contracts/adminDtos';
import { formatMessage } from '../messages/catalog';
import { renderAdmin } from '../testing/renderAdmin';
import { seedCheckpoint, type SeedCheckpoint } from '../testing/seedCheckpoints';

// Nạp sẵn chunk lazy của các màn để ca đầu tiên không phụ thuộc thời gian nạp module
beforeAll(() =>
  Promise.all([
    import('./PublicationReviewPage'),
    import('../checkpoint-library/CheckpointEditorPage'),
    import('../visit-points/VisitPointEditorPage'),
  ]),
);

async function openReview(unitType: string, subjectId: string, store: FakeStore, role: AdminRole = 'CONTENT_STAFF') {
  const view = renderAdmin(`/admin/review/${unitType}/${subjectId}`, { store, signedInAs: role });
  await screen.findByRole('heading', { level: 1, name: 'Xem lại & Xuất bản' });
  return view;
}

async function seed(change: Partial<SeedCheckpoint> = {}) {
  const store = new FakeStore();
  const seeded = await seedCheckpoint(store, {
    name: 'Hang Con Moong',
    mode: 'OFFLINE_REQUIRED',
    visitPoints: [{ name: 'Cây chò', ready: true }, { name: 'Đá vôi' }],
    ...change,
  });
  return { store, ...seeded };
}

async function confirmPublish(itemName: string) {
  await userEvent.click(screen.getByRole('button', { name: 'Xuất bản' }));
  const dialog = within(screen.getByRole('dialog'));
  expect(dialog.getByRole('heading').textContent).toBe(formatMessage('MSG-CONFIRM-PUBLISH', { 'tên mục': itemName }));
  await userEvent.click(dialog.getByRole('button', { name: 'Xuất bản' }));
}

describe('SCR-M03-004 xem lại & xuất bản — điểm dừng/QR (BR-M03-D04, D05, E13, F01, F02, A05)', () => {
  it('xuất bản điểm dừng lần đầu: liệt kê điểm tham quan chưa sẵn sàng bằng MSG-QR-LEFT-OUT', async () => {
    const { store, checkpointId } = await seed();
    await openReview('CHECKPOINT_FIRST_PUBLICATION', checkpointId, store);
    expect(screen.getByText('Xuất bản điểm dừng lần đầu')).toBeTruthy();
    const leftOut = await screen.findByText(/^Điểm tham quan "Đá vôi" chưa sẵn sàng: /);
    expect(leftOut.textContent).toMatch(/Điểm này chưa được xuất bản lần này\.$/);
    expect(screen.getByRole('table', { name: 'Thay đổi' })).toBeTruthy();
  });

  it('xác nhận một lần MSG-CONFIRM-PUBLISH → điểm dừng + điểm tham quan sẵn sàng Đang hoạt động, điểm chưa sẵn sàng giữ Nháp', async () => {
    const { store, checkpointId, qrIdentifiers } = await seed();
    const { router } = await openReview('CHECKPOINT_FIRST_PUBLICATION', checkpointId, store);
    await confirmPublish('Hang Con Moong');
    await waitFor(() => expect(router.state.location.pathname).toBe(`/admin/checkpoints/${checkpointId}`));
    expect(await screen.findByText(formatMessage('MSG-PUBLISHED'))).toBeTruthy();
    expect(store.state.checkpoints.get(checkpointId)?.status).toBe('HOAT_DONG');
    expect(store.state.qrCodes.get(qrIdentifiers[0]!)?.status).toBe('HOAT_DONG');
    expect(store.state.qrCodes.get(qrIdentifiers[1]!)?.status).toBe('NHAP');
  });

  it('Nhân viên nội dung tự xuất bản được, không cần người thứ hai (BR-M03-A05)', async () => {
    const { store, checkpointId } = await seed();
    await openReview('CHECKPOINT_FIRST_PUBLICATION', checkpointId, store, 'CONTENT_STAFF');
    await confirmPublish('Hang Con Moong');
    await waitFor(() => expect(store.state.checkpoints.get(checkpointId)?.status).toBe('HOAT_DONG'));
    expect(store.audit.at(-1)).toMatchObject({ action: 'PUBLISHED', actorEmail: FIXTURE_ACCOUNTS.CONTENT_STAFF.email, selfPublished: true });
  });

  it('chưa sẵn sàng: liệt kê thiếu sót, nút Xuất bản tắt, không xuất bản gì (BR-M03-F01)', async () => {
    const { store, checkpointId } = await seed({ visitPoints: [{ name: 'Đá vôi' }] });
    await openReview('CHECKPOINT_FIRST_PUBLICATION', checkpointId, store);
    const blocking = within(await screen.findByRole('region', { name: 'Còn thiếu để xuất bản' }));
    expect(blocking.getByText('Còn thiếu: ít nhất một điểm tham quan sẵn sàng.')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Xuất bản' }) as HTMLButtonElement).disabled).toBe(true);
    expect(store.state.checkpoints.get(checkpointId)?.status).toBe('NHAP');
  });

  it('"Cần tải trước" có ảnh không đọc được → MSG-IMAGE-NOT-READABLE, không xuất bản (BR-M03-D04 điều 4)', async () => {
    const { store, checkpointId, imagePaths } = await seed({ visitPoints: [{ name: 'Cây chò', ready: true }] });
    store.storage.delete(imagePaths[0]!);
    await openReview('CHECKPOINT_FIRST_PUBLICATION', checkpointId, store);
    expect(
      await screen.findByText(formatMessage('MSG-IMAGE-NOT-READABLE', { 'tên tệp': 'Cây chò – ảnh 1' })),
    ).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Xuất bản' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('điểm tham quan thêm vào điểm dừng đang hoạt động xuất bản riêng (QR_OBJECT)', async () => {
    const { store, checkpointId, qrIdentifiers } = await seed({
      visitPoints: [{ name: 'Cây chò', ready: true }],
      publish: true,
    });
    const extra = await seedCheckpointVisitPoint(store, checkpointId);
    const { router } = await openReview('QR_OBJECT', extra, store);
    expect(screen.getByText('Điểm tham quan (một mã QR)')).toBeTruthy();
    await confirmPublish('Cây lim');
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`/admin/checkpoints/${checkpointId}/visit-points/${extra}`),
    );
    expect(store.state.qrCodes.get(extra)?.status).toBe('HOAT_DONG');
    expect(store.state.qrCodes.get(qrIdentifiers[0]!)?.status).toBe('HOAT_DONG');
  });

  it('nội dung đổi sau khi mở review → MSG-STALE và review được mở lại với dữ liệu mới (BR-M03-F02)', async () => {
    const { store, checkpointId } = await seed({ visitPoints: [{ name: 'Cây chò', ready: true }] });
    await openReview('CHECKPOINT_FIRST_PUBLICATION', checkpointId, store);
    await seedCheckpointVisitPoint(store, checkpointId, 'Đá mới', false);
    await confirmPublish('Hang Con Moong');
    expect((await screen.findByRole('alert')).textContent).toMatch(/vừa sửa mục này lúc/);
    expect(await screen.findByText(/^Điểm tham quan "Đá mới" chưa sẵn sàng: /)).toBeTruthy();
    expect(store.state.checkpoints.get(checkpointId)?.status).toBe('NHAP');
  });

  it('"Quay lại sửa" về editor của đơn vị', async () => {
    const { store, checkpointId } = await seed();
    const { router } = await openReview('CHECKPOINT_FIRST_PUBLICATION', checkpointId, store);
    await userEvent.click(screen.getByRole('button', { name: 'Quay lại sửa' }));
    await waitFor(() => expect(router.state.location.pathname).toBe(`/admin/checkpoints/${checkpointId}`));
  });

  it('có xem trước như du khách cho từng điểm tham quan sẽ xuất bản (BR-M03-F02 e)', async () => {
    const { store, checkpointId } = await seed();
    await openReview('CHECKPOINT_FIRST_PUBLICATION', checkpointId, store);
    await userEvent.click(await screen.findByRole('button', { name: 'Xem trước như du khách: Cây chò' }));
    expect(await screen.findByText(formatMessage('MSG-PREVIEW-DRAFT'))).toBeTruthy();
  });
});

/** Thêm một điểm tham quan vào điểm dừng có sẵn qua API giả; trả identifier */
async function seedCheckpointVisitPoint(store: FakeStore, checkpointId: string, name = 'Cây lim', ready = true) {
  const previous = store.currentUserId;
  store.currentUserId = FIXTURE_ACCOUNTS.REVIEWER.userId;
  try {
    const api = createFakeAdminApi(store);
    const settings: { mediaId: string; usageRightsConfirmed: boolean }[] = [];
    if (ready) {
      const { objectPath } = await api.uploadMedia({
        ownerType: 'CHECKPOINT',
        ownerId: checkpointId,
        file: new File([new Uint8Array(512)], 'lim.jpg', { type: 'image/jpeg' }),
      });
      const media = await api.registerMedia({ ownerType: 'CHECKPOINT', ownerId: checkpointId, usage: 'QR_MEDIA', type: 'IMAGE', objectPath });
      if (!media.ok) throw new Error('seed media');
      settings.push({ mediaId: media.data.mediaId, usageRightsConfirmed: true });
    }
    const intro = 'Cây lim cổ thụ, gỗ rất cứng, được bảo vệ nghiêm ngặt.';
    const result = await api.saveVisitPointDraft({
      checkpointId,
      content: {
        objectName: ready ? { vi: name, en: `${name} (en)` } : { vi: name },
        ...(ready ? { introductionText: { vi: intro, en: intro } } : {}),
        mediaItems: settings.map(({ mediaId }) => ({ mediaId })),
      },
      mediaSettings: settings,
    });
    if (!result.ok) throw new Error('seed visit point');
    return result.data.qrIdentifier;
  } finally {
    store.currentUserId = previous;
  }
}
