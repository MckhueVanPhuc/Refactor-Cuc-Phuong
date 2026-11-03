// View chi tiết tuyến online/offline (tasks T051; BR-M01-013, 014; FR-M01-003, 014; SC-M01-008).
import { describe, expect, it } from 'vitest';
import { publicationFixture } from '../../../shared/contracts/__fixtures__/publication';
import { packageFromPublication } from '../testing/packageFixture';
import { onlineDetailView, savedDetailView } from './detailView';

describe('onlineDetailView', () => {
  it('đủ trường bắt buộc theo ngôn ngữ', () => {
    const view = onlineDetailView(publicationFixture().routes.A, 'vi');
    expect(view).toMatchObject({
      source: 'online',
      name: 'Tuyến thử Bách Thảo',
      description: 'Mô tả đầy đủ tuyến A',
      startingPoint: 'Cổng thử A',
      facts: { distanceKm: 2.4, durationMin: 150, difficulty: 'NHE' },
      needsPackage: true,
    });
    expect(onlineDetailView(publicationFixture().routes.A, 'en').name).toBe('Test Botanic trail');
  });

  it('trường tùy chọn vắng thì không có mục, không có chữ thay thế (SR-SCR-M01-003-001)', () => {
    const view = onlineDetailView(publicationFixture().routes.A, 'vi');
    expect(view).not.toHaveProperty('bestTime');
    expect(view).not.toHaveProperty('preparation');
    expect(view.safetyWarning).toBe('Cảnh báo an toàn tuyến A');
    expect(view.participationRequirements).toBe('Yêu cầu tuyến A');
    const b = onlineDetailView(publicationFixture().routes.B, 'vi');
    expect(b).not.toHaveProperty('safetyWarning');
    expect(b).not.toHaveProperty('routeMap');
    expect(b.highlights).toEqual([]);
    expect(b.gallery).toEqual([]);
  });

  it('tên điểm dừng từ checkpointSummaries, đánh số liên tục 1, 2, 3… dù sequence có khoảng trống', () => {
    // fixture A: sequence 1, 2, 4
    expect(onlineDetailView(publicationFixture().routes.A, 'vi').checkpoints).toEqual([
      { number: 1, name: 'Điểm thử A1' },
      { number: 2, name: 'Điểm thử A2' },
      { number: 3, name: 'Điểm thử A3' },
    ]);
  });

  it('gallery: ảnh đầu là ảnh bìa, giữ chú thích theo ngôn ngữ; sơ đồ tuyến online', () => {
    const view = onlineDetailView(publicationFixture().routes.A, 'en');
    expect(view.gallery).toEqual([
      { sourceRef: 'fixture/a-thumb.png' },
      { sourceRef: 'fixture/a-gallery-2.png', caption: 'Photo 2' },
    ]);
    expect(view.routeMap).toEqual({ kind: 'online', sourceRef: 'fixture/a-route-map.png' });
  });
});

describe('savedDetailView (offline có gói)', () => {
  const pkg = () => {
    const { routes, snapshots } = publicationFixture();
    return packageFromPublication(routes.A, snapshots.A, { capturedAt: '2026-11-01T03:00:00.000Z' });
  };

  it('chỉ chữ cốt lõi đã lưu + capturedAt; không có mô tả, gallery hay trường không lưu', () => {
    const view = savedDetailView(pkg(), 'vi');
    expect(view).toMatchObject({
      source: 'saved',
      name: 'Tuyến thử Bách Thảo',
      startingPoint: 'Cổng thử A',
      participationRequirements: 'Yêu cầu tuyến A',
      safetyWarning: 'Cảnh báo an toàn tuyến A',
      capturedAt: '2026-11-01T03:00:00.000Z',
    });
    for (const field of ['description', 'facts', 'preparation', 'bestTime']) expect(view).not.toHaveProperty(field);
    expect(view.gallery).toEqual([]);
    expect(view.highlights).toEqual([]);
  });

  it('tên điểm dừng lấy từ manifest của gói, đánh số liên tục (OQ-SCR-M01-003-002)', () => {
    expect(savedDetailView(pkg(), 'en').checkpoints.map((c) => `${c.number}. ${c.name}`)).toEqual([
      '1. Test stop A1',
      '2. Test stop A2',
      '3. Test stop A3',
    ]);
  });

  it('sơ đồ offline chỉ khi gói có offlineRouteMap (BR-M01-013)', () => {
    expect(savedDetailView(pkg(), 'vi').routeMap).toEqual({
      kind: 'package',
      routeId: 'route-a',
      contentVersion: 1,
      sourceRef: 'fixture/a-offline-map.png',
      caption: 'Sơ đồ offline A',
    });
    const { offlineRouteMap: _dropped, ...withoutMap } = pkg();
    expect(savedDetailView(withoutMap, 'vi')).not.toHaveProperty('routeMap');
  });
});
