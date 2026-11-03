// Adapter giả của M01 (tasks T031): fixture publication qua chính adapter thật (ánh xạ cột, schema, timeout).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFakeSource } from './fakeSource';

afterEach(() => {
  vi.useRealTimers();
});

describe('fakeSource', () => {
  it('danh mục gồm A, B, C, D; dòng hỏng bị adapter bỏ', async () => {
    const fake = createFakeSource();
    const result = await fake.source.fetchCatalog();
    expect(result.kind === 'OK' && result.value.map((route) => route.routeId)).toEqual([
      'route-a',
      'route-b',
      'route-c',
      'route-d',
    ]);
  });

  it('đổi trạng thái tuyến A → TAM_DONG', async () => {
    const fake = createFakeSource();
    fake.controls.setRouteStatus('route-a', 'TAM_DONG');
    const result = await fake.source.fetchRoute('route-a');
    expect(result.kind === 'OK' && result.value?.status).toBe('TAM_DONG');
  });

  it('nâng version A v1 → v2: dòng tuyến và snapshot cùng đổi', async () => {
    const fake = createFakeSource();
    fake.controls.publishNextVersion('route-a');
    const route = await fake.source.fetchRoute('route-a');
    const snapshot = await fake.source.fetchActiveSnapshot('route-a');
    expect(route.kind === 'OK' && route.value?.activeContentVersion).toBe(2);
    expect(snapshot.kind === 'OK' && snapshot.value).toMatchObject({ contentVersion: 2, previousContentVersion: 1 });
  });

  it('bỏ estimatedOfflineSizeBytes của snapshot', async () => {
    const fake = createFakeSource();
    fake.controls.dropEstimatedSize('route-b');
    const snapshot = await fake.source.fetchActiveSnapshot('route-b');
    expect(snapshot.kind === 'OK' && snapshot.value).not.toHaveProperty('estimatedOfflineSizeBytes');
  });

  it('trễ quá 8 s → nguồn không khả dụng', async () => {
    vi.useFakeTimers();
    const fake = createFakeSource();
    fake.controls.setDelayMs(9_000);
    const pending = fake.source.fetchCatalog();
    await vi.advanceTimersByTimeAsync(8_000);
    expect(await pending).toEqual({ kind: 'UNAVAILABLE' });
  });

  it('nguồn lỗi → không khả dụng', async () => {
    const fake = createFakeSource();
    fake.controls.setUnavailable(true);
    expect(await fake.source.fetchCatalog()).toEqual({ kind: 'UNAVAILABLE' });
  });

  it('ảnh: signed URL rồi byte PNG; lỗi 404/500 theo sourceRef', async () => {
    const fake = createFakeSource();
    fake.controls.failImage('fixture/a1-2.png', 404);
    fake.controls.failImage('fixture/a2-1.png', 500);
    const urls = await fake.media.createSignedUrls(['fixture/a1-1-a.png', 'fixture/a1-2.png', 'fixture/a2-1.png']);
    expect(urls?.size).toBe(3);
    expect((await fake.media.fetchImageBlob(urls!.get('fixture/a1-1-a.png')!))?.type).toBe('image/png');
    expect(await fake.media.fetchImageBlob(urls!.get('fixture/a1-2.png')!)).toBeNull();
    expect(await fake.media.fetchImageBlob(urls!.get('fixture/a2-1.png')!)).toBeNull();
  });
});
