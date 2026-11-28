// Gợi ý theo bốn nhóm tag, chọn 0..N mỗi nhóm (tasks T088; FR-M01-004; BR-M01-002, 003; SC-M01-002; DAC-M01-018;
// spec-M01 v3.3, CHG-REC-2026-11-28-01): HOẶC trong nhóm, VÀ giữa nhóm, nhóm bỏ trống không lọc.
import { describe, expect, it } from 'vitest';
import { publicationFixture } from '../../../shared/contracts/__fixtures__/publication';
import type { PublishedRoute } from '../../../shared/contracts/publishedRoute';
import { hasAnyChoice, recommend, type RecommendationCriteria } from './recommend';

const base = () => publicationFixture().routes.B;
function route(
  id: string,
  vi: string,
  tags: Partial<Pick<PublishedRoute, 'timeTags' | 'groupTags' | 'experienceTags' | 'guideTags' | 'status'>>,
): PublishedRoute {
  return { ...base(), routeId: id, name: { vi, en: vi }, ...tags };
}

const routes = [
  route('r1', 'Bờ suối', {
    timeTags: ['TIME_VUA'],
    groupTags: ['GROUP_GIA_DINH_CO_TRE'],
    experienceTags: ['INTEREST_KHAM_PHA'],
    guideTags: ['GUIDE_TU_THAM_QUAN'],
  }),
  route('r2', 'An toàn', {
    timeTags: ['TIME_VUA'],
    groupTags: ['GROUP_GIA_DINH_CO_TRE', 'GROUP_DI_THEO_DOAN'],
    experienceTags: ['INTEREST_KHAM_PHA', 'INTEREST_TIM_HIEU'],
    guideTags: ['GUIDE_CO_HUONG_DAN_VIEN', 'GUIDE_TU_THAM_QUAN'],
  }),
  route('r3', 'Cây cổ', {
    timeTags: ['TIME_DAI'],
    groupTags: ['GROUP_DI_THEO_DOAN'],
    experienceTags: ['INTEREST_THIEN_NHIEN_CHUP_ANH'],
    guideTags: ['GUIDE_CO_HUONG_DAN_VIEN'],
  }),
  route('r4', 'Đóng', {
    status: 'TAM_DONG',
    timeTags: ['TIME_VUA'],
    groupTags: ['GROUP_GIA_DINH_CO_TRE'],
    experienceTags: ['INTEREST_KHAM_PHA'],
    guideTags: ['GUIDE_TU_THAM_QUAN'],
  }),
  route('r5', 'Ngắn', {
    timeTags: ['TIME_NGAN'],
    groupTags: ['GROUP_CA_NHAN_NGUOI_LON'],
    experienceTags: ['INTEREST_TIM_HIEU'],
    // Tuyến chưa có guideTags trong lúc chuyển giao (brief D9)
    guideTags: [],
  }),
];

const ids = (criteria: RecommendationCriteria) => recommend(routes, criteria, 'vi').routes.map((r) => r.routeId);

describe('recommend', () => {
  it('không chọn gì → mọi tuyến chọn được, sắp A→Z (bỏ tuyến tạm đóng)', () => {
    expect(ids({})).toEqual(['r2', 'r1', 'r3', 'r5']);
  });

  it('một ý mỗi nhóm → mọi kết quả chứa đủ các ý đã chọn', () => {
    expect(
      ids({ time: ['TIME_VUA'], group: ['GROUP_GIA_DINH_CO_TRE'], experience: ['INTEREST_KHAM_PHA'], guide: ['GUIDE_TU_THAM_QUAN'] }),
    ).toEqual(['r2', 'r1']);
  });

  it('nhiều ý trong một nhóm là HOẶC', () => {
    expect(ids({ time: ['TIME_NGAN', 'TIME_DAI'] })).toEqual(['r3', 'r5']);
    expect(ids({ group: ['GROUP_CA_NHAN_NGUOI_LON', 'GROUP_DI_THEO_DOAN'] })).toEqual(['r2', 'r3', 'r5']);
  });

  it('giữa các nhóm là VÀ; nhóm bỏ trống không lọc', () => {
    expect(ids({ time: ['TIME_VUA', 'TIME_DAI'], guide: ['GUIDE_CO_HUONG_DAN_VIEN'] })).toEqual(['r2', 'r3']);
    expect(ids({ experience: ['INTEREST_TIM_HIEU'], guide: [] })).toEqual(['r2', 'r5']);
  });

  it('tuyến chưa có guideTags chỉ khớp khi nhóm Hướng dẫn viên bỏ trống', () => {
    expect(ids({ guide: ['GUIDE_TU_THAM_QUAN', 'GUIDE_CO_HUONG_DAN_VIEN'] })).not.toContain('r5');
    expect(ids({ time: ['TIME_NGAN'] })).toEqual(['r5']);
  });

  it('0 kết quả là hợp lệ, không nới tiêu chí', () => {
    expect(ids({ time: ['TIME_NGAN'], group: ['GROUP_GIA_DINH_CO_TRE'] })).toEqual([]);
  });

  it('giá trị lạ hoặc của nhóm khác bị bỏ qua, như không chọn', () => {
    expect(ids({ time: ['TIME_RAT_DAI'] })).toEqual(ids({}));
    expect(ids({ group: ['INTEREST_KHAM_PHA'] })).toEqual(ids({}));
  });

  it('thời gian không tự nới sang nhóm lân cận (TIME_DAI chỉ khớp TIME_DAI)', () => {
    expect(ids({ time: ['TIME_DAI'] })).toEqual(['r3']);
  });

  it('hasAnyChoice: có ít nhất một ý ở bất kỳ nhóm nào', () => {
    expect(hasAnyChoice({})).toBe(false);
    expect(hasAnyChoice({ time: [], guide: [] })).toBe(false);
    expect(hasAnyChoice({ guide: ['GUIDE_TU_THAM_QUAN'] })).toBe(true);
  });
});
