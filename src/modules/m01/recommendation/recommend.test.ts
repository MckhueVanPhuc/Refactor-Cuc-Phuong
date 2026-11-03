// Gợi ý exact-match (tasks T088; FR-M01-004; BR-M01-002, 003; SC-M01-002; DAC-M01-018).
import { describe, expect, it } from 'vitest';
import { publicationFixture } from '../../../shared/contracts/__fixtures__/publication';
import type { PublishedRoute } from '../../../shared/contracts/publishedRoute';
import { recommend } from './recommend';

const base = () => publicationFixture().routes.B;
function route(
  id: string,
  vi: string,
  tags: Partial<Pick<PublishedRoute, 'timeTags' | 'groupTags' | 'experienceTags' | 'status'>>,
): PublishedRoute {
  return { ...base(), routeId: id, name: { vi, en: vi }, ...tags };
}

const routes = [
  route('r1', 'Bờ suối', { timeTags: ['TIME_VUA'], groupTags: ['GROUP_GIA_DINH_CO_TRE'], experienceTags: ['INTEREST_KHAM_PHA'] }),
  route('r2', 'An toàn', {
    timeTags: ['TIME_VUA'],
    groupTags: ['GROUP_GIA_DINH_CO_TRE', 'GROUP_CAN_DE_DANG'],
    experienceTags: ['INTEREST_KHAM_PHA', 'INTEREST_TIM_HIEU'],
  }),
  route('r3', 'Cây cổ', { timeTags: ['TIME_DAI'], groupTags: ['GROUP_GIA_DINH_CO_TRE'], experienceTags: ['INTEREST_KHAM_PHA'] }),
  route('r4', 'Đóng', {
    status: 'TAM_DONG',
    timeTags: ['TIME_VUA'],
    groupTags: ['GROUP_GIA_DINH_CO_TRE'],
    experienceTags: ['INTEREST_KHAM_PHA'],
  }),
];

const full = { time: 'TIME_VUA', group: 'GROUP_GIA_DINH_CO_TRE', experience: 'INTEREST_KHAM_PHA' };

describe('recommend', () => {
  it('mọi kết quả chứa cả ba tag đã chọn; chỉ tuyến chọn được; sắp A→Z', () => {
    expect(recommend(routes, full, 'vi')).toEqual({ kind: 'results', routes: [routes[1], routes[0]] });
  });

  it('0 kết quả là hợp lệ, không nới tiêu chí', () => {
    expect(recommend(routes, { ...full, experience: 'INTEREST_THIEN_NHIEN_CHUP_ANH' }, 'vi')).toEqual({
      kind: 'results',
      routes: [],
    });
  });

  it.each([
    ['thiếu thời gian', { group: full.group, experience: full.experience }],
    ['thiếu đối tượng', { time: full.time, experience: full.experience }],
    ['thiếu trải nghiệm', { time: full.time, group: full.group }],
    ['sai enum', { ...full, time: 'TIME_RAT_DAI' }],
    ['nhóm lẫn giá trị của nhóm khác', { ...full, group: 'INTEREST_KHAM_PHA' }],
  ])('%s → không chạy so khớp', (_label, criteria) => {
    expect(recommend(routes, criteria, 'vi')).toEqual({ kind: 'incomplete' });
  });

  it('thời gian không tự nới sang nhóm lân cận (TIME_DAI chỉ khớp TIME_DAI)', () => {
    const result = recommend(routes, { ...full, time: 'TIME_DAI' }, 'vi');
    expect(result.kind === 'results' && result.routes.map((r) => r.routeId)).toEqual(['r3']);
  });
});
