import { describe, expect, it } from 'vitest';
import {
  CAPTION_MAX_CHARS,
  NAME_MAX_CHARS,
  ROUTE_BEST_TIME_MAX_CHARS,
  ROUTE_CHECKPOINTS_MAX_ITEMS,
  ROUTE_DESC_MAX_CHARS,
  ROUTE_DISTANCE_MAX_KM,
  ROUTE_DURATION_MAX_MIN,
  ROUTE_GALLERY_MAX_IMAGES,
  ROUTE_HIGHLIGHT_MAX_CHARS,
  ROUTE_PARTICIPATION_MAX_CHARS,
  ROUTE_PREPARATION_MAX_CHARS,
  ROUTE_SAFETY_WARNING_MAX_CHARS,
  ROUTE_SHORT_DESC_MAX_CHARS,
  ROUTE_START_MAX_CHARS,
} from '../config/limits';
import type { RouteContent } from '../contracts/adminDtos';
import { normalizeRouteContent, routeSaveIssues, type RouteSaveContext } from './route';

const ID = 'r1';
const base: RouteContent = { noSafetyWarningConfirmed: false, offlineRouteMapRequired: false };
const context: RouteSaveContext = { checkpointName: (id) => `Điểm ${id}` };
const keys = (content: RouteContent) => routeSaveIssues(ID, content, context).map((issue) => issue.messageKey);
const fields = (content: RouteContent) => routeSaveIssues(ID, content, context).map((issue) => issue.targetFieldKey);
const text = (n: number) => 'a'.repeat(n);

describe('lưu tuyến — BLOCKS_SAVE (BR-M03-C02, C03, L01; spec-M03 §5.3)', () => {
  it('tuyến trống vẫn lưu được: thiếu nội dung chỉ chặn xuất bản (BR-M03-C03)', () => {
    expect(routeSaveIssues(ID, base, context)).toEqual([]);
  });

  it.each([
    ['name', NAME_MAX_CHARS],
    ['shortDescription', ROUTE_SHORT_DESC_MAX_CHARS],
    ['description', ROUTE_DESC_MAX_CHARS],
    ['startingPoint', ROUTE_START_MAX_CHARS],
    ['participationRequirements', ROUTE_PARTICIPATION_MAX_CHARS],
    ['preparation', ROUTE_PREPARATION_MAX_CHARS],
    ['bestTime', ROUTE_BEST_TIME_MAX_CHARS],
    ['safetyWarning', ROUTE_SAFETY_WARNING_MAX_CHARS],
  ] as const)('%s tối đa %i ký tự mỗi ngôn ngữ (biên max/max+1)', (field, max) => {
    expect(routeSaveIssues(ID, { ...base, [field]: { vi: text(max), en: text(max) } }, context)).toEqual([]);
    const issues = routeSaveIssues(ID, { ...base, [field]: { vi: 'x', en: text(max + 1) } }, context);
    expect(issues.map((issue) => [issue.messageKey, issue.targetFieldKey])).toEqual([['MSG-LIMIT-TEXT', `${field}.en`]]);
  });

  it(`chú thích ảnh và sơ đồ tối đa ${CAPTION_MAX_CHARS} ký tự`, () => {
    const content: RouteContent = {
      ...base,
      galleryItems: [{ mediaId: 'g1', caption: { vi: text(CAPTION_MAX_CHARS + 1) } }],
      routeMapCaption: { en: text(CAPTION_MAX_CHARS + 1) },
    };
    expect(fields(content)).toEqual(['galleryCaption.0.vi', 'routeMapCaption.en']);
  });

  it(`quãng đường > 0, ≤ ${ROUTE_DISTANCE_MAX_KM} km, tối đa một chữ số thập phân`, () => {
    expect(keys({ ...base, distanceKm: 0 })).toEqual(['MSG-NUMBER-POSITIVE']);
    expect(keys({ ...base, distanceKm: ROUTE_DISTANCE_MAX_KM })).toEqual([]);
    expect(keys({ ...base, distanceKm: ROUTE_DISTANCE_MAX_KM + 0.1 })).toEqual(['MSG-NUMBER-TOO-BIG']);
    expect(keys({ ...base, distanceKm: 2.5 })).toEqual([]);
    expect(keys({ ...base, distanceKm: 2.55 })).toEqual(['MSG-NUMBER-DECIMALS']);
  });

  it(`thời lượng > 0, ≤ ${ROUTE_DURATION_MAX_MIN} phút`, () => {
    expect(keys({ ...base, durationMin: ROUTE_DURATION_MAX_MIN })).toEqual([]);
    expect(routeSaveIssues(ID, { ...base, durationMin: ROUTE_DURATION_MAX_MIN + 1 }, context)[0]?.message).toBe(
      `Thời lượng dự kiến (phút) không được lớn hơn ${ROUTE_DURATION_MAX_MIN} phút.`,
    );
    expect(keys({ ...base, durationMin: 0 })).toEqual(['MSG-NUMBER-POSITIVE']);
  });

  it('độ khó Khó + "Gia đình có trẻ nhỏ" hoặc "Cần đi dễ dàng" → MSG-TAG-CONFLICT khi lưu (BR-M03-C12)', () => {
    const issues = routeSaveIssues(ID, { ...base, difficulty: 'KHO', groupTags: ['GROUP_GIA_DINH_CO_TRE'] }, context);
    expect(issues[0]).toMatchObject({
      severity: 'BLOCKS_SAVE',
      messageKey: 'MSG-TAG-CONFLICT',
      targetFieldKey: 'groupTags',
      message: 'Tuyến độ khó Khó không thể gắn nhãn Gia đình có trẻ nhỏ. Hãy đổi độ khó hoặc bỏ nhãn.',
    });
    expect(keys({ ...base, difficulty: 'KHO', groupTags: ['GROUP_CAN_DE_DANG'] })).toEqual(['MSG-TAG-CONFLICT']);
    expect(keys({ ...base, difficulty: 'KHO', groupTags: ['GROUP_CA_NHAN_NGUOI_LON'] })).toEqual([]);
    expect(keys({ ...base, difficulty: 'TRUNG_BINH', groupTags: ['GROUP_GIA_DINH_CO_TRE'] })).toEqual([]);
  });

  it('điểm dừng lặp trong danh sách → MSG-CHECKPOINT-DUPLICATE nêu tên (BR-M03-T09)', () => {
    const issues = routeSaveIssues(ID, { ...base, checkpointList: [{ checkpointId: 'c1' }, { checkpointId: 'c2' }, { checkpointId: 'c1' }] }, context);
    expect(issues.map((issue) => issue.message)).toEqual(['Điểm dừng "Điểm c1" đã có trong danh sách của tuyến.']);
  });

  it(`quá ${ROUTE_CHECKPOINTS_MAX_ITEMS} điểm dừng → MSG-LIMIT-CHECKPOINTS`, () => {
    const list = (n: number) => Array.from({ length: n }, (_, i) => ({ checkpointId: `c${i}` }));
    expect(keys({ ...base, checkpointList: list(ROUTE_CHECKPOINTS_MAX_ITEMS) })).toEqual([]);
    expect(keys({ ...base, checkpointList: list(ROUTE_CHECKPOINTS_MAX_ITEMS + 1) })).toEqual(['MSG-LIMIT-CHECKPOINTS']);
  });

  it(`ảnh chi tiết tối đa ${ROUTE_GALLERY_MAX_IMAGES} → quá thì MSG-COUNT-IMAGES`, () => {
    const gallery = (n: number) => Array.from({ length: n }, (_, i) => ({ mediaId: `g${i}` }));
    expect(keys({ ...base, galleryItems: gallery(ROUTE_GALLERY_MAX_IMAGES) })).toEqual([]);
    const issues = routeSaveIssues(ID, { ...base, name: { vi: 'Đường lên Mả Tổ' }, galleryItems: gallery(ROUTE_GALLERY_MAX_IMAGES + 1) }, context);
    expect(issues[0]?.message).toBe(`Đường lên Mả Tổ đã đủ ${ROUTE_GALLERY_MAX_IMAGES} ảnh. Hãy xóa bớt ảnh trước khi thêm.`);
  });

  it(`điểm nổi bật mỗi mục tối đa ${ROUTE_HIGHLIGHT_MAX_CHARS} ký tự`, () => {
    const issues = routeSaveIssues(ID, { ...base, highlights: [{ vi: 'ok' }, { vi: 'ok', en: text(ROUTE_HIGHLIGHT_MAX_CHARS + 1) }] }, context);
    expect(issues.map((issue) => issue.targetFieldKey)).toEqual(['highlights.1.en']);
  });
});

describe('chuẩn hóa trước khi lưu (BR-M03-C12, C16, C09)', () => {
  it('trường một dòng không nhận CR/LF: thay bằng khoảng trắng', () => {
    const content = normalizeRouteContent({
      ...base,
      name: { vi: 'Đường\r\nlên Mả Tổ' },
      shortDescription: { en: 'one\nline' },
      highlights: [{ vi: 'a\nb', en: 'c' }],
      routeMapCaption: { vi: 'x\ny' },
      description: { vi: 'đoạn 1\nđoạn 2' },
    });
    expect(content.name?.vi).toBe('Đường lên Mả Tổ');
    expect(content.shortDescription?.en).toBe('one line');
    expect(content.highlights?.[0]?.vi).toBe('a b');
    expect(content.routeMapCaption?.vi).toBe('x y');
    // Văn bản nhiều dòng giữ xuống dòng
    expect(content.description?.vi).toBe('đoạn 1\nđoạn 2');
  });

  it('nhãn trong một nhóm là tập phân biệt', () => {
    const content = normalizeRouteContent({
      ...base,
      groupTags: ['GROUP_CA_NHAN_NGUOI_LON', 'GROUP_CA_NHAN_NGUOI_LON'],
      experienceTags: ['INTEREST_KHAM_PHA', 'INTEREST_TIM_HIEU', 'INTEREST_KHAM_PHA'],
    });
    expect(content.groupTags).toEqual(['GROUP_CA_NHAN_NGUOI_LON']);
    expect(content.experienceTags).toEqual(['INTEREST_KHAM_PHA', 'INTEREST_TIM_HIEU']);
  });

  it('không còn sơ đồ thì tick "dùng sơ đồ khi không có mạng" bị bỏ (BR-M03-C16)', () => {
    expect(normalizeRouteContent({ ...base, offlineRouteMapRequired: true }).offlineRouteMapRequired).toBe(false);
    expect(normalizeRouteContent({ ...base, routeMapMediaId: 'm', offlineRouteMapRequired: true }).offlineRouteMapRequired).toBe(true);
  });

  it('có cảnh báo an toàn thì tick "không có cảnh báo" về false (BR-M03-C09)', () => {
    expect(normalizeRouteContent({ ...base, noSafetyWarningConfirmed: true, safetyWarning: { vi: 'Dốc trơn' } }).noSafetyWarningConfirmed).toBe(false);
    expect(normalizeRouteContent({ ...base, noSafetyWarningConfirmed: true }).noSafetyWarningConfirmed).toBe(true);
  });
});
