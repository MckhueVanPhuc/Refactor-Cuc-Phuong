// Tuyến chọn được (tasks T043; BR-M01-002, 012; SC-M01-001; DAC-M01-017; OQ-SCR-M01-001-001).
import { describe, expect, it } from 'vitest';
import { publicationFixture } from '../../../shared/contracts/__fixtures__/publication';
import { needsOfflinePackageMark, selectableRoutes } from './selectableRoutes';

const allRoutes = () => Object.values(publicationFixture().routes);

describe('selectableRoutes', () => {
  it('chỉ HOAT_DONG; TAM_DONG và LUU_TRU bị loại', () => {
    expect(selectableRoutes(allRoutes(), 'vi').map((route) => route.routeId).sort()).toEqual(['route-a', 'route-b']);
  });

  it('sắp A→Z theo tên ở ngôn ngữ đang chọn (Intl.Collator)', () => {
    // vi: "Tuyến thử Ao Hồ" (B) < "Tuyến thử Bách Thảo" (A); en: "Test Botanic trail" (A) < "Test Lakeside walk" (B)
    expect(selectableRoutes(allRoutes(), 'vi').map((route) => route.routeId)).toEqual(['route-b', 'route-a']);
    expect(selectableRoutes(allRoutes(), 'en').map((route) => route.routeId)).toEqual(['route-a', 'route-b']);
  });

  it('so sánh theo quy tắc ngôn ngữ, không theo mã ký tự (Đ sau D trong tiếng Việt)', () => {
    const base = publicationFixture().routes.B;
    const named = (id: string, vi: string) => ({ ...base, routeId: id, name: { vi, en: vi } });
    const routes = [named('r3', 'Đồi'), named('r2', 'Dốc'), named('r1', 'Ăn'), named('r4', 'An')];
    expect(selectableRoutes(routes, 'vi').map((route) => route.name.vi)).toEqual(['An', 'Ăn', 'Dốc', 'Đồi']);
  });

  it('không sửa mảng đầu vào', () => {
    const routes = allRoutes();
    const before = routes.map((route) => route.routeId);
    selectableRoutes(routes, 'vi');
    expect(routes.map((route) => route.routeId)).toEqual(before);
  });
});

describe('needsOfflinePackageMark (BR-M01-012)', () => {
  const route = () => publicationFixture().routes.B;

  it.each([
    [false, false, false],
    [true, false, true],
    [false, true, true],
    [true, true, true],
  ])('hasOfflineRequiredCheckpoint=%s, hasOfflineRouteMap=%s → %s', (required, map, expected) => {
    expect(needsOfflinePackageMark({ ...route(), hasOfflineRequiredCheckpoint: required, hasOfflineRouteMap: map })).toBe(
      expected,
    );
  });
});
