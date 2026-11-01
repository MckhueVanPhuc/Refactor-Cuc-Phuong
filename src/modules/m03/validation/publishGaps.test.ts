import { describe, expect, it } from 'vitest';
import type { RouteContent } from '../contracts/adminDtos';
import { routePublishIssues, type RoutePublishContext } from './publishGaps';

const ID = 'r1';
const pair = (vi: string, en = `${vi} (en)`) => ({ vi, en });

const complete: RouteContent = {
  name: pair('Đường lên Mả Tổ'),
  shortDescription: pair('Rừng nguyên sinh'),
  description: pair('Mô tả đầy đủ'),
  startingPoint: pair('Trung tâm du khách'),
  safetyWarning: pair('Dốc trơn khi mưa'),
  noSafetyWarningConfirmed: false,
  distanceKm: 4.5,
  durationMin: 150,
  difficulty: 'TRUNG_BINH',
  groupTags: ['GROUP_CA_NHAN_NGUOI_LON'],
  experienceTags: ['INTEREST_KHAM_PHA'],
  thumbnailMediaId: 'thumb',
  galleryItems: [{ mediaId: 'g1' }],
  offlineRouteMapRequired: false,
  checkpointList: [{ checkpointId: 'c1' }],
};

const ctx = (change: Partial<RoutePublishContext> = {}): RoutePublishContext => ({
  media: new Map([
    ['thumb', { usageRightsConfirmed: true }],
    ['g1', { usageRightsConfirmed: true }],
  ]),
  checkpoints: new Map([['c1', { name: 'Hang Con Moong', status: 'HOAT_DONG' }]]),
  ...change,
});

const messages = (content: RouteContent, context = ctx()) => routePublishIssues(ID, content, context).map((issue) => issue.message);

describe('panel "Còn thiếu để xuất bản" của tuyến (BR-M03-C04, C06, C09, C14, T04, L03; SC-M03-001)', () => {
  it('tuyến đủ điều kiện → không còn thiếu', () => {
    expect(routePublishIssues(ID, complete, ctx())).toEqual([]);
  });

  it('tuyến trống liệt kê từng trường bắt buộc, theo thứ tự các bước', () => {
    expect(messages({ noSafetyWarningConfirmed: false, offlineRouteMapRequired: false })).toEqual([
      'Còn thiếu: Ảnh đại diện.',
      'Còn thiếu: Tên tuyến.',
      'Còn thiếu: Mô tả ngắn.',
      'Còn thiếu: Quãng đường (km).',
      'Còn thiếu: Thời lượng dự kiến (phút).',
      'Còn thiếu: Độ khó.',
      'Còn thiếu: Mô tả đầy đủ.',
      'Còn thiếu: Điểm xuất phát và cách đến.',
      'Hãy nhập cảnh báo an toàn, hoặc tick xác nhận tuyến không có cảnh báo an toàn cần nêu.',
      'Còn thiếu: Nhóm đối tượng.',
      'Còn thiếu: Trải nghiệm.',
      'Tuyến cần ít nhất một điểm dừng đang hoạt động trong danh sách thì mới xuất bản được.',
    ]);
  });

  it('thiếu một ngôn ngữ của trường bắt buộc và của trường both-or-none', () => {
    const issues = routePublishIssues(
      ID,
      { ...complete, name: { vi: 'Đường lên Mả Tổ' }, preparation: { en: 'Water' } },
      ctx(),
    );
    expect(issues.map((issue) => [issue.message, issue.targetFieldKey])).toEqual([
      ['Tên tuyến: còn thiếu bản tiếng Anh.', 'name.en'],
      ['Cần chuẩn bị: còn thiếu bản tiếng Việt.', 'preparation.vi'],
    ]);
  });

  it('chú thích ảnh, chú thích sơ đồ và điểm nổi bật cũng both-or-none (BR-M03-C06)', () => {
    const content: RouteContent = {
      ...complete,
      galleryItems: [{ mediaId: 'g1', caption: { vi: 'Cây chò' } }],
      routeMapMediaId: 'map',
      routeMapCaption: { en: 'Map' },
      highlights: [pair('Cây chò ngàn năm'), { vi: 'Hang động' }],
    };
    const media = new Map([...ctx().media, ['map', { usageRightsConfirmed: true }]]);
    expect(routePublishIssues(ID, content, ctx({ media })).map((issue) => issue.targetFieldKey)).toEqual([
      'galleryCaption.0.en',
      'routeMapCaption.vi',
      'highlights.1.en',
    ]);
  });

  it('ảnh chưa xác nhận quyền sử dụng → MSG-RIGHTS-NOT-CONFIRMED cho từng ảnh (BR-M03-C14)', () => {
    const media = new Map([
      ['thumb', { usageRightsConfirmed: false }],
      ['g1', { usageRightsConfirmed: false, fileName: 'cho.jpg' }],
    ]);
    expect(messages(complete, ctx({ media }))).toEqual([
      'Hãy xác nhận quyền sử dụng cho "Ảnh đại diện" trước khi xuất bản.',
      'Hãy xác nhận quyền sử dụng cho "cho.jpg" trước khi xuất bản.',
    ]);
  });

  it('danh sách chỉ có điểm dừng đang tạm đóng → MSG-NO-ACTIVE-CHECKPOINT (BR-M03-T04)', () => {
    const checkpoints = new Map([['c1', { name: 'Hang Con Moong', status: 'TAM_DONG' as const }]]);
    expect(messages(complete, ctx({ checkpoints }))).toEqual([
      'Tuyến cần ít nhất một điểm dừng đang hoạt động trong danh sách thì mới xuất bản được.',
    ]);
  });

  it('cảnh báo an toàn trống: cần tick xác nhận; đã tick thì hết (BR-M03-C09)', () => {
    const { safetyWarning: _removed, ...empty } = complete;
    expect(routePublishIssues(ID, empty, ctx()).map((issue) => [issue.messageKey, issue.targetFieldKey])).toEqual([
      ['MSG-SAFETY-CONFIRM', 'safetyWarning.vi'],
    ]);
    expect(routePublishIssues(ID, { ...empty, noSafetyWarningConfirmed: true }, ctx())).toEqual([]);
  });

  it('mọi khoảng trống là BLOCKS_PUBLISH và trỏ về tuyến', () => {
    const issues = routePublishIssues(ID, { noSafetyWarningConfirmed: false, offlineRouteMapRequired: false }, ctx());
    expect(issues.every((issue) => issue.severity === 'BLOCKS_PUBLISH' && issue.targetItemType === 'ROUTE')).toBe(true);
  });
});
