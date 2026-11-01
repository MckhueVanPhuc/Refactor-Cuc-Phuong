// Câu gợi ý — spec-M03 §5.5. Chỉ năm trường này có gợi ý, mỗi câu một dòng dưới ô (BR-M03-L12).
export const HINTS = {
  participationRequirements:
    'Ai đi được và điều kiện để đi: thể lực, hướng dẫn viên, đăng ký trước, giờ hoặc khu vực giới hạn.',
  preparation: 'Vật dụng và trang phục nên mang.',
  bestTime: 'Gợi ý mùa hoặc buổi trong ngày, không phải giờ được phép đi.',
  safetyWarning:
    'Rủi ro và cách phòng tránh khi tuyến vẫn mở. Nếu có đoạn không còn an toàn, hãy dùng Đóng tạm.',
  offlineCheckpointMedia: 'Điểm dừng cần tải trước chỉ nhận chữ và ảnh.',
} as const;

export type HintKey = keyof typeof HINTS;
