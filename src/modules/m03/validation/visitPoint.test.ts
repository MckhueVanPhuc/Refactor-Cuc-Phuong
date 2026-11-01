import { describe, expect, it } from 'vitest';
import { NAME_MAX_CHARS, NOTE_MAX_CHARS, QR_INTRO_MAX_CHARS, QR_INTRO_MIN_CHARS, QR_MAX_AV_FILES, QR_MAX_IMAGES } from '../config/limits';
import {
  mediaLabel,
  readinessOf,
  visitPointName,
  visitPointPublishIssues,
  visitPointSaveIssues,
  type VisitPointCheckInput,
  type VisitPointMediaItem,
} from './visitPoint';

const intro = 'x'.repeat(QR_INTRO_MIN_CHARS);
const image = (n: number, extra: Partial<VisitPointMediaItem> = {}): VisitPointMediaItem => ({
  mediaId: `img-${n}`,
  type: 'IMAGE',
  usageRightsConfirmed: true,
  ...extra,
});
const audio = (n: number, extra: Partial<VisitPointMediaItem> = {}): VisitPointMediaItem => ({
  mediaId: `av-${n}`,
  type: 'AUDIO',
  usageRightsConfirmed: true,
  spokenLanguage: 'vi',
  ...extra,
});

function input(change: Partial<VisitPointCheckInput> = {}): VisitPointCheckInput {
  return {
    qrIdentifier: 'q1',
    displayName: 'Cây chò',
    checkpointName: 'Rừng chò',
    checkpointMode: 'ONLINE_AVAILABLE',
    content: { objectName: { vi: 'Cây chò', en: 'Cho tree' }, introductionText: { vi: intro, en: intro } },
    media: [image(1)],
    ...change,
  };
}

const keys = (issues: { messageKey: string }[]) => issues.map((issue) => issue.messageKey);

describe('tên hiển thị (BR-M03-E16)', () => {
  it('tên tiếng Việt, hoặc "Điểm tham quan chưa đặt tên {số}" theo thứ tự tạo', () => {
    expect(visitPointName('  Cây chò ', 3)).toBe('Cây chò');
    expect(visitPointName(undefined, 3)).toBe('Điểm tham quan chưa đặt tên 3');
    expect(visitPointName('   ', 2)).toBe('Điểm tham quan chưa đặt tên 2');
  });

  it('nhãn tệp: tên tệp gốc nếu còn biết, không thì nhãn thay thế (validation-report D-3)', () => {
    expect(mediaLabel('Cây chò', image(1, { fileName: 'cho.jpg' }), 0)).toBe('cho.jpg');
    expect(mediaLabel('Cây chò', image(1), 1)).toBe('Cây chò – ảnh 2');
    expect(mediaLabel('Cây chò', audio(1), 0)).toBe('Cây chò – âm thanh/video 1');
  });
});

describe('lưu điểm tham quan — BLOCKS_SAVE (BR-M03-E02–E04, L01)', () => {
  it('hợp lệ → không có lỗi', () => {
    expect(visitPointSaveIssues(input())).toEqual([]);
  });

  it(`tên ≤ ${NAME_MAX_CHARS}, giới thiệu ≤ ${QR_INTRO_MAX_CHARS}, ghi chú lắp đặt ≤ ${NOTE_MAX_CHARS}`, () => {
    const issues = visitPointSaveIssues(
      input({
        content: { objectName: { vi: 'a'.repeat(NAME_MAX_CHARS + 1) }, introductionText: { en: 'b'.repeat(QR_INTRO_MAX_CHARS + 1) } },
        installationLabel: 'c'.repeat(NOTE_MAX_CHARS + 1),
      }),
    );
    expect(issues.map((issue) => issue.targetFieldKey)).toEqual(['objectName.vi', 'introductionText.en', 'installationLabel']);
    expect(new Set(keys(issues))).toEqual(new Set(['MSG-LIMIT-TEXT']));
  });

  it('giới thiệu đúng mức tối đa vẫn lưu được; ngắn hơn mức tối thiểu không chặn lưu', () => {
    const content = { introductionText: { vi: 'b'.repeat(QR_INTRO_MAX_CHARS), en: 'ngắn' } };
    expect(visitPointSaveIssues(input({ content }))).toEqual([]);
  });

  it(`quá ${QR_MAX_IMAGES} ảnh → MSG-COUNT-IMAGES; quá ${QR_MAX_AV_FILES} âm thanh/video → MSG-COUNT-AV`, () => {
    const images = Array.from({ length: QR_MAX_IMAGES + 1 }, (_, i) => image(i));
    const av = Array.from({ length: QR_MAX_AV_FILES + 1 }, (_, i) => audio(i));
    const issues = visitPointSaveIssues(input({ media: [...images, ...av] }));
    expect(keys(issues)).toEqual(['MSG-COUNT-IMAGES', 'MSG-COUNT-AV']);
    expect(issues[0]?.message).toBe('Cây chò đã đủ 5 ảnh. Hãy xóa bớt ảnh trước khi thêm.');
    expect(issues[1]?.targetFieldKey).toBe('avFiles');
    const atLimit = visitPointSaveIssues(input({ media: [...images.slice(1), ...av.slice(1)] }));
    expect(atLimit).toEqual([]);
  });

  it('âm thanh/video ở điểm dừng "Cần tải trước" → MSG-AV-OFFLINE', () => {
    const issues = visitPointSaveIssues(input({ checkpointMode: 'OFFLINE_REQUIRED', media: [image(1), audio(1)] }));
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      messageKey: 'MSG-AV-OFFLINE',
      message:
        'Điểm dừng "Rừng chò" là loại cần tải trước nên chỉ nhận chữ và ảnh. Âm thanh và video chỉ dùng cho điểm dừng có mạng.',
    });
  });
});

describe('khoảng trống xuất bản — BLOCKS_PUBLISH (BR-M03-E05, E17; SC-M03-039)', () => {
  it('đủ nội dung → sẵn sàng', () => {
    expect(visitPointPublishIssues(input())).toEqual([]);
    expect(readinessOf(visitPointPublishIssues(input()))).toEqual({ ready: true, missing: [] });
  });

  it('thiếu song ngữ: thiếu hẳn → MSG-MISSING-FIELD; thiếu một ngôn ngữ → MSG-MISSING-LANGUAGE', () => {
    const issues = visitPointPublishIssues(input({ content: { introductionText: { vi: intro } } }));
    expect(issues.map((issue) => issue.message)).toEqual([
      'Còn thiếu: Tên đối tượng.',
      'Giới thiệu: còn thiếu bản tiếng Anh.',
    ]);
  });

  it(`giới thiệu ngắn hơn ${QR_INTRO_MIN_CHARS} ký tự sau trim chặn xuất bản (biên min-1/min)`, () => {
    const short = ` ${'y'.repeat(QR_INTRO_MIN_CHARS - 1)} `;
    const issues = visitPointPublishIssues(
      input({ content: { objectName: { vi: 'a', en: 'b' }, introductionText: { vi: short, en: intro } } }),
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      severity: 'BLOCKS_PUBLISH',
      targetFieldKey: 'introductionText.vi',
      message: `Còn thiếu: Giới thiệu (tiếng Việt) (ít nhất ${QR_INTRO_MIN_CHARS} ký tự).`,
    });
  });

  it('chưa tick quyền sử dụng → MSG-RIGHTS-NOT-CONFIRMED cho từng tệp', () => {
    const issues = visitPointPublishIssues(
      input({ media: [image(1, { usageRightsConfirmed: false, fileName: 'cho.jpg' }), image(2, { usageRightsConfirmed: false })] }),
    );
    expect(issues.map((issue) => [issue.messageKey, issue.targetFieldKey, issue.message])).toEqual([
      ['MSG-RIGHTS-NOT-CONFIRMED', 'usageRights.0', 'Hãy xác nhận quyền sử dụng cho "cho.jpg" trước khi xuất bản.'],
      ['MSG-RIGHTS-NOT-CONFIRMED', 'usageRights.1', 'Hãy xác nhận quyền sử dụng cho "Cây chò – ảnh 2" trước khi xuất bản.'],
    ]);
  });

  it('âm thanh/video thiếu ngôn ngữ nói → MSG-AV-LANGUAGE-MISSING; ảnh không cần', () => {
    const issues = visitPointPublishIssues(input({ media: [image(1), audio(1, { spokenLanguage: undefined })] }));
    expect(keys(issues)).toEqual(['MSG-AV-LANGUAGE-MISSING']);
    expect(issues[0]?.targetFieldKey).toBe('spokenLanguage.1');
  });

  it('readiness liệt kê điều còn thiếu bằng nhãn tiếng Việt, không lặp', () => {
    const issues = visitPointPublishIssues(
      input({
        content: { objectName: { vi: 'Cây chò' } },
        media: [image(1, { usageRightsConfirmed: false }), image(2, { usageRightsConfirmed: false })],
      }),
    );
    expect(readinessOf(issues)).toEqual({
      ready: false,
      missing: ['Tên đối tượng (tiếng Anh)', 'Giới thiệu', 'Xác nhận quyền sử dụng'],
    });
  });
});
