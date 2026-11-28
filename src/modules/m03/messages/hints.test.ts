import { describe, expect, it } from 'vitest';
import { HINTS } from './hints';

// Chép từ spec-M03 §5.5 — chỉ sáu trường này có gợi ý (v3.8 thêm Hướng dẫn viên) (BR-M03-L12)
const SPEC_HINTS = {
  participationRequirements:
    'Ai đi được và điều kiện để đi: thể lực, hướng dẫn viên, đăng ký trước, giờ hoặc khu vực giới hạn.',
  preparation: 'Vật dụng và trang phục nên mang.',
  bestTime: 'Gợi ý mùa hoặc buổi trong ngày, không phải giờ được phép đi.',
  safetyWarning:
    'Rủi ro và cách phòng tránh khi tuyến vẫn mở. Nếu có đoạn không còn an toàn, hãy dùng Đóng tạm.',
  offlineCheckpointMedia: 'Điểm dừng cần tải trước chỉ nhận chữ và ảnh.',
  guideTags: 'Tuyến bắt buộc có hướng dẫn viên: chỉ chọn "Đi cùng hướng dẫn viên".',
};

describe('câu gợi ý (spec-M03 §5.5; BR-M03-L12)', () => {
  it('đúng và chỉ đúng sáu câu của spec', () => {
    expect(HINTS).toEqual(SPEC_HINTS);
  });

  it('mỗi câu một dòng', () => {
    for (const hint of Object.values(HINTS)) expect(hint).not.toMatch(/\n/);
  });
});
