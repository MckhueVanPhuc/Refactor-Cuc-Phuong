// Media M01 (tasks T030; research R-06; constitution VI; m03-publication-consumer-contract §4).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMediaClient, type StorageApi } from './mediaClient';

function fakeStorage(result: { data: unknown; error: unknown } | Promise<never>) {
  const calls: { bucket: string; paths: string[]; expiresIn: number }[] = [];
  const storage: StorageApi = {
    from(bucket) {
      return {
        createSignedUrls(paths, expiresIn) {
          calls.push({ bucket, paths, expiresIn });
          return Promise.resolve(result);
        },
      };
    },
  };
  return { storage, calls };
}

const png = (bytes = 4) => new Response(new Uint8Array(bytes), { status: 200, headers: { 'Content-Type': 'image/png' } });

function mediaWithFetch(fetchImpl: (url: string, init?: RequestInit) => Promise<Response>) {
  const fetchSpy = vi.fn(fetchImpl);
  const media = createMediaClient({ storage: () => fakeStorage({ data: [], error: null }).storage, fetch: fetchSpy });
  return { media, fetchSpy };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('createSignedUrls', () => {
  it('ký trên bucket quest-media với quyền anon; trả map sourceRef → URL, bỏ mục lỗi', async () => {
    const { storage, calls } = fakeStorage({
      data: [
        { path: 'a.png', signedUrl: 'http://127.0.0.1:54321/storage/v1/object/sign/quest-media/a.png?token=t', error: null },
        { path: 'b.png', signedUrl: '', error: 'Object not found' },
      ],
      error: null,
    });
    const media = createMediaClient({ storage: () => storage });
    const urls = await media.createSignedUrls(['a.png', 'b.png', 'a.png']);
    expect(calls).toEqual([{ bucket: 'quest-media', paths: ['a.png', 'b.png'], expiresIn: 3600 }]);
    expect([...(urls ?? new Map()).entries()]).toEqual([
      ['a.png', 'http://127.0.0.1:54321/storage/v1/object/sign/quest-media/a.png?token=t'],
    ]);
  });

  it('lỗi tạo signed URL → null', async () => {
    const media = createMediaClient({ storage: () => fakeStorage({ data: null, error: { message: 'x' } }).storage });
    expect(await media.createSignedUrls(['a.png'])).toBeNull();
  });

  it('danh sách rỗng → map rỗng, không gọi Storage', async () => {
    const { storage, calls } = fakeStorage({ data: [], error: null });
    const media = createMediaClient({ storage: () => storage });
    expect((await media.createSignedUrls([]))?.size).toBe(0);
    expect(calls).toHaveLength(0);
  });
});

describe('fetchImageBlob — chỉ "đọc được" khi HTTP 2xx, size > 0, type image/*', () => {
  it('ảnh hợp lệ → Blob byte (không phải URL)', async () => {
    const { media } = mediaWithFetch(async () => png());
    const blob = await media.fetchImageBlob('http://x/a.png');
    expect(blob?.size).toBe(4);
    expect(blob?.type).toBe('image/png');
    expect(typeof blob).not.toBe('string');
  });

  it.each([
    ['HTTP 404', () => new Response(new Uint8Array(4), { status: 404, headers: { 'Content-Type': 'image/png' } })],
    ['HTTP 500', () => new Response(new Uint8Array(4), { status: 500, headers: { 'Content-Type': 'image/png' } })],
    ['byte rỗng', () => png(0)],
    ['không phải image/*', () => new Response('<html>', { status: 200, headers: { 'Content-Type': 'text/html' } })],
  ])('%s → null', async (_label, response) => {
    const { media } = mediaWithFetch(async () => response());
    expect(await media.fetchImageBlob('http://x/a.png')).toBeNull();
  });

  it('lỗi mạng → null', async () => {
    const { media } = mediaWithFetch(() => Promise.reject(new TypeError('Failed to fetch')));
    expect(await media.fetchImageBlob('http://x/a.png')).toBeNull();
  });

  it('quá PACKAGE_IMAGE_REQUEST_TIMEOUT_SECONDS (60 s, kỹ thuật) → null và abort request', async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    const { media } = mediaWithFetch((_url, init) => {
      signal = init?.signal ?? undefined;
      return new Promise<Response>(() => {});
    });
    const pending = media.fetchImageBlob('http://x/a.png');
    await vi.advanceTimersByTimeAsync(59_999);
    expect(signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await pending).toBeNull();
    expect(signal?.aborted).toBe(true);
  });

  it('không đi qua cache HTTP của trình duyệt (cache: no-store)', async () => {
    const { media, fetchSpy } = mediaWithFetch(async () => png());
    await media.fetchImageBlob('http://x/a.png');
    expect(fetchSpy.mock.calls[0]![1]).toMatchObject({ cache: 'no-store' });
  });
});
