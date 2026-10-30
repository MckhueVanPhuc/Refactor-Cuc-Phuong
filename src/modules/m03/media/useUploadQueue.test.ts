import { describe, expect, it } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createFakeAdminApi, FakeStore } from '../api/fake/fakeAdminApi';
import { createFakeControls } from '../api/fake/fakeAdminApi';
import { syntheticFile } from '../api/contract/harness';
import { useUploadQueue, type UploadQueueOptions } from './useUploadQueue';

const MB = 1_048_576;

async function setup(overrides: Partial<UploadQueueOptions> = {}) {
  const store = new FakeStore();
  const controls = createFakeControls(store);
  await controls.signInAs('CONTENT_STAFF');
  const checkpointId = await controls.seedCheckpoint('Điểm thử');
  const api = createFakeAdminApi(store);
  const options: UploadQueueOptions = {
    api,
    ownerType: 'CHECKPOINT',
    ownerId: checkpointId,
    usage: 'QR_MEDIA',
    kind: 'IMAGE',
    maxCount: 5,
    remaining: 5,
    ownerName: 'Cây cổ thụ',
    ...overrides,
  };
  const hook = renderHook(() => useUploadQueue(options));
  return { hook, store };
}

describe('useUploadQueue (media-storage §1; BR-M03-E14)', () => {
  it('mỗi tệp tải và đăng ký riêng; tệp lỗi không ảnh hưởng tệp khác; tóm tắt MSG-UPLOAD-SUMMARY', async () => {
    const { hook } = await setup();
    await act(() =>
      hook.result.current.addFiles([
        syntheticFile('a.jpg', 'image/jpeg', 1024),
        syntheticFile('b.gif', 'image/gif', 1024),
        syntheticFile('c.png', 'image/png', 3 * MB),
        syntheticFile('d.webp', 'image/webp', 2048),
      ]),
    );
    await waitFor(() => expect(hook.result.current.items.every((i) => i.state !== 'uploading')).toBe(true));
    const states = Object.fromEntries(hook.result.current.items.map((i) => [i.fileName, i.state]));
    expect(states).toEqual({ 'a.jpg': 'uploaded', 'b.gif': 'failed', 'c.png': 'failed', 'd.webp': 'uploaded' });
    const gif = hook.result.current.items.find((i) => i.fileName === 'b.gif');
    expect(gif?.message).toBe('Tệp "b.gif" không đúng định dạng. Chỉ nhận JPEG, PNG, WebP.');
    const big = hook.result.current.items.find((i) => i.fileName === 'c.png');
    expect(big?.message).toBe('Ảnh "c.png" nặng 3 MB, tối đa 2 MB. Hãy nén nhỏ hơn rồi tải lại.');
    expect(hook.result.current.summary).toBe('Đã tải 2/4 tệp. Chưa tải được: b.gif, c.png.');
    expect(hook.result.current.items.filter((i) => i.mediaId)).toHaveLength(2);
  });

  it('một tệp: không có câu tóm tắt', async () => {
    const { hook } = await setup();
    await act(() => hook.result.current.addFiles([syntheticFile('a.jpg', 'image/jpeg', 1024)]));
    await waitFor(() => expect(hook.result.current.items[0]?.state).toBe('uploaded'));
    expect(hook.result.current.summary).toBeUndefined();
  });

  it('vượt số lượng còn lại → các tệp dư "Không tải được" với MSG-COUNT-IMAGES', async () => {
    const { hook } = await setup({ remaining: 1 });
    await act(() =>
      hook.result.current.addFiles([syntheticFile('a.jpg', 'image/jpeg', 10), syntheticFile('b.jpg', 'image/jpeg', 10)]),
    );
    await waitFor(() => expect(hook.result.current.items.every((i) => i.state !== 'uploading')).toBe(true));
    expect(hook.result.current.items.map((i) => i.state)).toEqual(['uploaded', 'failed']);
    expect(hook.result.current.items[1]?.message).toBe('Cây cổ thụ đã đủ 5 ảnh. Hãy xóa bớt ảnh trước khi thêm.');
  });

  it('âm thanh/video ở điểm dừng cần tải trước → MSG-AV-OFFLINE, không tải', async () => {
    const { hook, store } = await setup({
      kind: 'AV',
      remaining: 3,
      checkpointMode: 'OFFLINE_REQUIRED',
      checkpointName: 'Hang Người Xưa',
    });
    await act(() => hook.result.current.addFiles([syntheticFile('a.mp3', 'audio/mpeg', 10)]));
    await waitFor(() => expect(hook.result.current.items[0]?.state).toBe('failed'));
    expect(hook.result.current.items[0]?.message).toBe(
      'Điểm dừng "Hang Người Xưa" là loại cần tải trước nên chỉ nhận chữ và ảnh. Âm thanh và video chỉ dùng cho điểm dừng có mạng.',
    );
    expect(store.storage.size).toBe(0);
  });

  it('âm thanh và video hợp lệ ở điểm dừng có mạng; loại media lấy từ MIME', async () => {
    const { hook } = await setup({ kind: 'AV', remaining: 3, checkpointMode: 'ONLINE_AVAILABLE' });
    await act(() =>
      hook.result.current.addFiles([syntheticFile('a.m4a', 'audio/mp4', 10), syntheticFile('v.mp4', 'video/mp4', 10)]),
    );
    await waitFor(() => expect(hook.result.current.items.every((i) => i.state === 'uploaded')).toBe(true));
    expect(hook.result.current.items.map((i) => i.type)).toEqual(['AUDIO', 'VIDEO']);
  });

  it('remove bỏ một mục khỏi danh sách', async () => {
    const { hook } = await setup();
    await act(() => hook.result.current.addFiles([syntheticFile('a.jpg', 'image/jpeg', 10)]));
    await waitFor(() => expect(hook.result.current.items[0]?.state).toBe('uploaded'));
    act(() => hook.result.current.remove(hook.result.current.items[0]!.key));
    expect(hook.result.current.items).toHaveLength(0);
  });
});
