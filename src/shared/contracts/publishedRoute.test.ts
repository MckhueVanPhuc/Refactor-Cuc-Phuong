import { describe, expect, it } from 'vitest';
import { deriveTimeTag, publishedRouteSchema, type PublishedRoute } from './publishedRoute';

// Fixture synthetic; id ngắn vẫn phải qua vì identifier là opaque (constitution)
function validRoute(): PublishedRoute {
  return {
    routeId: 'r1',
    status: 'HOAT_DONG',
    name: { vi: 'Tuyến thử', en: 'Test route' },
    shortDescription: { vi: 'Mô tả ngắn', en: 'Short description' },
    description: { vi: 'Mô tả', en: 'Description' },
    startingPoint: { vi: 'Cổng thử', en: 'Test gate' },
    thumbnail: { sourceRef: 'media/thumb.jpg' },
    gallery: [{ sourceRef: 'media/thumb.jpg' }, { sourceRef: 'media/2.jpg', caption: { vi: 'Ảnh', en: 'Photo' } }],
    highlights: [{ vi: 'Điểm nhấn', en: 'Highlight' }],
    distanceKm: 3.5,
    durationMin: 120,
    difficulty: 'TRUNG_BINH',
    timeTags: ['TIME_VUA'],
    groupTags: ['GROUP_CA_NHAN_NGUOI_LON'],
    experienceTags: ['INTEREST_KHAM_PHA', 'INTEREST_TIM_HIEU'],
    checkpointCount: 2,
    hasOfflineRequiredCheckpoint: false,
    hasOfflineRouteMap: false,
    checkpointSummaries: [
      { checkpointId: 'c1', sequence: 1, checkpointName: { vi: 'Điểm 1', en: 'Stop 1' } },
      { checkpointId: 'c2', sequence: 3, checkpointName: { vi: 'Điểm 2', en: 'Stop 2' } },
    ],
    activeContentVersion: 1,
  };
}

const parse = (value: unknown) => publishedRouteSchema.safeParse(value);

describe('PublishedRoute (publication-public §2)', () => {
  it('nhận fixture hợp lệ, kể cả trường Optional vắng', () => {
    expect(parse(validRoute()).success).toBe(true);
  });

  it('nhận đủ trường Optional khi có cả hai ngôn ngữ', () => {
    const route = {
      ...validRoute(),
      routeMap: { sourceRef: 'media/map.png', caption: { vi: 'Sơ đồ', en: 'Map' } },
      participationRequirements: { vi: 'Yêu cầu', en: 'Requirements' },
      preparation: { vi: 'Chuẩn bị', en: 'Preparation' },
      bestTime: { vi: 'Sáng', en: 'Morning' },
      safetyWarning: { vi: 'Cẩn thận', en: 'Be careful' },
    };
    expect(parse(route).success).toBe(true);
  });

  it.each([
    'routeId',
    'status',
    'name',
    'shortDescription',
    'description',
    'startingPoint',
    'thumbnail',
    'gallery',
    'highlights',
    'distanceKm',
    'durationMin',
    'difficulty',
    'timeTags',
    'groupTags',
    'experienceTags',
    'checkpointCount',
    'hasOfflineRequiredCheckpoint',
    'hasOfflineRouteMap',
    'checkpointSummaries',
    'activeContentVersion',
  ] as const)('thiếu trường Required %s → không hợp lệ', (field) => {
    const route: Record<string, unknown> = { ...validRoute() };
    delete route[field];
    expect(parse(route).success).toBe(false);
  });

  it('identifier rỗng → không hợp lệ', () => {
    expect(parse({ ...validRoute(), routeId: '' }).success).toBe(false);
  });

  it.each(['participationRequirements', 'preparation', 'bestTime', 'safetyWarning'] as const)(
    '%s: both-or-none — chỉ một ngôn ngữ hoặc chuỗi rỗng → không hợp lệ',
    (field) => {
      expect(parse({ ...validRoute(), [field]: { vi: 'Chỉ tiếng Việt' } }).success).toBe(false);
      expect(parse({ ...validRoute(), [field]: { vi: 'Có', en: '' } }).success).toBe(false);
    },
  );

  it('tên song ngữ thiếu tiếng Anh → không hợp lệ', () => {
    expect(parse({ ...validRoute(), name: { vi: 'Tên' } }).success).toBe(false);
  });

  it('timeTags phải có đúng một giá trị và khớp durationMin (BR-M03-C11)', () => {
    expect(parse({ ...validRoute(), timeTags: [] }).success).toBe(false);
    expect(parse({ ...validRoute(), timeTags: ['TIME_VUA', 'TIME_DAI'] }).success).toBe(false);
    expect(parse({ ...validRoute(), timeTags: ['TIME_NGAN'] }).success).toBe(false);
  });

  it('deriveTimeTag theo ngưỡng 90 / 180 phút', () => {
    expect(deriveTimeTag(90)).toBe('TIME_NGAN');
    expect(deriveTimeTag(91)).toBe('TIME_VUA');
    expect(deriveTimeTag(180)).toBe('TIME_VUA');
    expect(deriveTimeTag(181)).toBe('TIME_DAI');
  });

  it('groupTags / experienceTags: ≥ 1, giá trị phân biệt, đúng enum', () => {
    expect(parse({ ...validRoute(), groupTags: [] }).success).toBe(false);
    expect(parse({ ...validRoute(), experienceTags: [] }).success).toBe(false);
    expect(parse({ ...validRoute(), groupTags: ['GROUP_CAN_DE_DANG', 'GROUP_CAN_DE_DANG'] }).success).toBe(false);
    expect(parse({ ...validRoute(), experienceTags: ['INTEREST_KHAC'] }).success).toBe(false);
  });

  it('distanceKm > 0 và tối đa một chữ số thập phân', () => {
    expect(parse({ ...validRoute(), distanceKm: 12 }).success).toBe(true);
    expect(parse({ ...validRoute(), distanceKm: 0.1 }).success).toBe(true);
    expect(parse({ ...validRoute(), distanceKm: 3.55 }).success).toBe(false);
    expect(parse({ ...validRoute(), distanceKm: 0 }).success).toBe(false);
  });

  it('durationMin là số nguyên > 0', () => {
    expect(parse({ ...validRoute(), durationMin: 0, timeTags: ['TIME_NGAN'] }).success).toBe(false);
    expect(parse({ ...validRoute(), durationMin: 30.5, timeTags: ['TIME_NGAN'] }).success).toBe(false);
  });

  it('checkpointSummaries chỉ được rỗng khi status ≠ HOAT_DONG', () => {
    expect(parse({ ...validRoute(), checkpointSummaries: [], checkpointCount: 0 }).success).toBe(false);
    expect(parse({ ...validRoute(), status: 'TAM_DONG', checkpointSummaries: [], checkpointCount: 0 }).success).toBe(
      true,
    );
    expect(parse({ ...validRoute(), status: 'LUU_TRU', checkpointSummaries: [], checkpointCount: 0 }).success).toBe(
      true,
    );
  });

  it('checkpointSummaries sắp tăng dần theo sequence, id không trùng', () => {
    const [a, b] = validRoute().checkpointSummaries;
    expect(parse({ ...validRoute(), checkpointSummaries: [b, a] }).success).toBe(false);
    expect(parse({ ...validRoute(), checkpointSummaries: [a, { ...b!, checkpointId: 'c1' }] }).success).toBe(false);
  });

  it('status ngoài enum → không hợp lệ', () => {
    expect(parse({ ...validRoute(), status: 'NHAP' }).success).toBe(false);
  });

  it('trường nội bộ không thuộc contract → không hợp lệ', () => {
    expect(parse({ ...validRoute(), closureReason: 'Bảo trì' }).success).toBe(false);
  });
});
