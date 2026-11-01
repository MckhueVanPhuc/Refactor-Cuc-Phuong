import { describe, expect, it } from 'vitest';
import { NAME_MAX_CHARS, NOTE_MAX_CHARS } from '../config/limits';
import {
  checkpointNameTaken,
  checkpointPublishIssues,
  checkpointSaveIssues,
  modeHasAvIssues,
  normalizeCheckpointName,
} from './checkpoint';

const ID = 'cp1';
const keys = (issues: { messageKey: string }[]) => issues.map((issue) => issue.messageKey);

describe('lưu điểm dừng — BLOCKS_SAVE (BR-M03-D01, D02, L01)', () => {
  it(`tên mỗi ngôn ngữ tối đa ${NAME_MAX_CHARS} ký tự sau trim (biên max/max+1)`, () => {
    const atMax = 'a'.repeat(NAME_MAX_CHARS);
    expect(checkpointSaveIssues(ID, { content: { checkpointName: { vi: `  ${atMax}  `, en: atMax } } })).toEqual([]);
    const issues = checkpointSaveIssues(ID, { content: { checkpointName: { vi: 'Hang', en: `${atMax}b` } } });
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      severity: 'BLOCKS_SAVE',
      messageKey: 'MSG-LIMIT-TEXT',
      fieldLabel: 'Tên điểm dừng (tiếng Anh)',
      targetItemType: 'CHECKPOINT',
      targetFieldKey: 'checkpointName.en',
    });
  });

  it(`ghi chú vị trí tối đa ${NOTE_MAX_CHARS} ký tự`, () => {
    const issues = checkpointSaveIssues(ID, { content: {}, locationNote: 'x'.repeat(NOTE_MAX_CHARS + 1) });
    expect(issues[0]).toMatchObject({ messageKey: 'MSG-LIMIT-TEXT', targetFieldKey: 'locationNote' });
  });

  it('chưa chọn loại kết nối vẫn lưu được (không có mặc định, chỉ chặn xuất bản)', () => {
    expect(checkpointSaveIssues(ID, { content: { checkpointName: { vi: 'Hang Con Moong' } } })).toEqual([]);
  });

  it('"Dùng được khi có mạng" cần tick khảo sát → MSG-ONLINE-NOT-VERIFIED', () => {
    const content = { checkpointName: { vi: 'Cây chò ngàn năm' }, connectivityMode: 'ONLINE_AVAILABLE' as const };
    const issues = checkpointSaveIssues(ID, { content });
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      severity: 'BLOCKS_SAVE',
      messageKey: 'MSG-ONLINE-NOT-VERIFIED',
      targetFieldKey: 'fieldVerificationConfirmed',
      message: 'Hãy tick xác nhận đã khảo sát thực địa, có sóng ổn định, cho điểm dừng "Cây chò ngàn năm".',
    });
    expect(checkpointSaveIssues(ID, { content: { ...content, fieldVerificationConfirmed: true } })).toEqual([]);
  });

  it('"Cần tải trước" không cần xác nhận', () => {
    expect(checkpointSaveIssues(ID, { content: { connectivityMode: 'OFFLINE_REQUIRED' } })).toEqual([]);
  });
});

describe('quy tắc liên dòng khi lưu (BR-M03-D02, D03)', () => {
  it('tên trùng không phân biệt hoa/thường và khoảng trắng hai đầu → MSG-CHECKPOINT-NAME-TAKEN', () => {
    expect(normalizeCheckpointName('  Hang ĐỘNG Người Xưa ')).toBe(normalizeCheckpointName('hang động người xưa'));
    const issues = checkpointNameTaken(ID, ' hang con moong ', ['Vườn thực vật', 'Hang Con Moong']);
    expect(issues[0]).toMatchObject({
      severity: 'BLOCKS_SAVE',
      messageKey: 'MSG-CHECKPOINT-NAME-TAKEN',
      targetFieldKey: 'checkpointName.vi',
      message: 'Đã có điểm dừng tên "hang con moong". Hãy dùng tên khác, hoặc chọn điểm dừng đó trong tuyến.',
    });
    expect(checkpointNameTaken(ID, 'Hang mới', ['Hang Con Moong'])).toEqual([]);
    expect(checkpointNameTaken(ID, undefined, ['Hang Con Moong'])).toEqual([]);
  });

  it('đổi sang "Cần tải trước" khi còn âm thanh/video → MSG-MODE-HAS-AV nêu các điểm tham quan', () => {
    const issues = modeHasAvIssues(ID, 'OFFLINE_REQUIRED', ['Cây chò', 'Điểm tham quan chưa đặt tên 2']);
    expect(issues[0]).toMatchObject({
      severity: 'BLOCKS_SAVE',
      messageKey: 'MSG-MODE-HAS-AV',
      targetFieldKey: 'connectivityMode',
      message:
        'Chưa đổi được sang "Cần tải trước" vì còn âm thanh/video ở: Cây chò, Điểm tham quan chưa đặt tên 2. Hãy xóa chúng trước.',
    });
    expect(modeHasAvIssues(ID, 'OFFLINE_REQUIRED', [])).toEqual([]);
    expect(modeHasAvIssues(ID, 'ONLINE_AVAILABLE', ['Cây chò'])).toEqual([]);
  });
});

describe('khoảng trống xuất bản — BLOCKS_PUBLISH (BR-M03-D04 điều 1–3)', () => {
  it('thiếu tên, thiếu loại kết nối, chưa có điểm tham quan sẵn sàng', () => {
    const issues = checkpointPublishIssues(ID, {}, 0);
    expect(issues.every((issue) => issue.severity === 'BLOCKS_PUBLISH')).toBe(true);
    expect(issues.map((issue) => issue.message)).toEqual([
      'Còn thiếu: Tên điểm dừng.',
      'Còn thiếu: Loại kết nối.',
      'Còn thiếu: ít nhất một điểm tham quan sẵn sàng.',
    ]);
  });

  it('thiếu một ngôn ngữ của tên → MSG-MISSING-LANGUAGE trỏ tới ô còn thiếu', () => {
    const issues = checkpointPublishIssues(ID, { checkpointName: { vi: 'Hang' }, connectivityMode: 'OFFLINE_REQUIRED' }, 1);
    expect(keys(issues)).toEqual(['MSG-MISSING-LANGUAGE']);
    expect(issues[0]?.targetFieldKey).toBe('checkpointName.en');
  });

  it('đủ điều kiện → không có khoảng trống', () => {
    const content = { checkpointName: { vi: 'Hang', en: 'Cave' }, connectivityMode: 'OFFLINE_REQUIRED' as const };
    expect(checkpointPublishIssues(ID, content, 1)).toEqual([]);
  });
});
