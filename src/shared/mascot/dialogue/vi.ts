// Lời thoại tiếng Việt của Mila. Chép nguyên văn spec-Mascot §5.6 và bảng copy screen spec SCR-M01-001…004,
// SCR-M02-001…004 (đã đồng bộ 2026-11-21). Không chuỗi nào nói "đã đến/có mặt" (SC-M02-013).
/** `cheer`: chỉ số trong `cheers` của ngôn ngữ đang hiển thị (đổi VI/EN không ra câu lai). */
export type MessageParams = { k?: number; n?: number; count?: number; cheer?: number };
type Text = string | ((p: MessageParams) => string);

const NAME = 'Mila';
const CHEERS = ['Tuyệt!', 'Hay quá!', 'Thêm một điểm nữa!'];

export const vi = {
  messages: {
    'MSG-MAS-001': `Chào bạn! Mình là ${NAME}, rái cá thám hiểm của Cúc Phương.`,
    'MSG-MAS-002': 'Mình sẽ đi cùng bạn suốt hành trình. Chọn một tuyến nhé!',
    'MSG-MAS-004': 'Chào mừng bạn quay lại! Hôm nay mình đi tuyến nào đây?',
    'MSG-MAS-005': 'Mình đang mở bản đồ các tuyến…',
    'MSG-MAS-008': 'Chưa biết chọn tuyến nào? Để mình gợi ý cho.',
    'MSG-MAS-009': 'Chạm vào một tuyến để xem chi tiết, hoặc thử Gợi ý tuyến.',
    'MSG-MAS-010': 'Bạn có bao lâu, đi cùng ai, thích gì? Chọn mỗi nhóm một ý nhé.',
    'MSG-MAS-011': ({ count = 0 }) => `Có ${count} tuyến hợp với bạn đây!`,
    'MSG-MAS-013': 'Thử xem tất cả tuyến, biết đâu có tuyến bạn thích.',
    'MSG-MAS-014': 'Trước khi đi, bạn đọc kỹ phần Cảnh báo an toàn giúp mình nhé.',
    'MSG-MAS-020': 'Mình đang xếp nội dung vào ba lô. Giữ trang này mở nhé.',
    'MSG-MAS-021': 'Xếp xong rồi! Các điểm cần tải trước giờ xem được cả khi mất sóng.',
    'MSG-MAS-024': 'Tải chưa xong. Ra chỗ sóng mạnh hơn rồi thử lại nhé.',
    'MSG-MAS-025': 'Máy chưa cho mình lưu. Xem lại bộ nhớ trống hoặc chế độ ẩn danh nhé.',
    'MSG-MAS-026': 'Vẫn chưa được. Có mạng thì bạn vẫn đi được, chỉ vài điểm cần sóng để xem.',
    'MSG-MAS-030': 'Ở mỗi điểm dừng, tìm tem QR rồi bấm Quét QR nhé.',
    'MSG-MAS-032': 'Thấy tem thì bấm Quét QR. Chạm điểm đã quét để đọc lại nhé.',
    'MSG-MAS-034': 'Chào mừng quay lại! Hành trình của bạn vẫn còn nguyên.',
    'MSG-MAS-040': 'Đưa tem QR vào giữa khung và giữ máy yên một chút.',
    'MSG-MAS-042': 'Chưa quét được? Thử lại gần hơn và tránh chỗ chói nắng.',
    'MSG-MAS-044': 'Sóng hơi yếu, mình vẫn đang kiểm tra…',
    'MSG-MAS-046': 'Hãy quét tem QR của Vườn ở điểm dừng. Tem cũ thì thử tem khác nếu có.',
    'MSG-MAS-048': 'Mã này cần có sóng để kiểm tra. Điểm trong tuyến vẫn quét được khi mất sóng.',
    'MSG-MAS-049': 'Mình tắt camera cho đỡ tốn pin nhé?',
    'MSG-MAS-050': ({ cheer = 0, k = 0, n = 0 }) => `${CHEERS[cheer % CHEERS.length]} Bạn đã quét ${k}/${n} điểm.`,
    'MSG-MAS-051': 'Mã QR đầu tiên xong rồi! Đọc thử câu chuyện của điểm này nhé.',
    'MSG-MAS-052': 'Điểm này không thuộc tuyến của bạn nên không tính vào hành trình. Cứ xem nhé!',
    'MSG-MAS-054': 'Mất sóng cũng không sao, mình mở bản đã tải sẵn cho bạn.',
    'MSG-MAS-055': 'Bạn đã quét được nửa số điểm rồi đó!',
    'MSG-MAS-056': 'Giờ cất máy và ngắm rừng thôi! Ở điểm sau nhớ quét mã nhé.',
    'MSG-MAS-057a': 'Đi nhẹ, nói khẽ để nghe được tiếng rừng nhé.',
    'MSG-MAS-057b': 'Ngắm thôi, đừng hái hay mang gì ra khỏi rừng nhé.',
    'MSG-MAS-057c': 'Giữ rác trong ba lô cho tới khi gặp thùng rác nhé.',
    'MSG-MAS-057d': 'Đi đúng đường mòn để an toàn cho bạn và cho rừng.',
    'MSG-MAS-057e': 'Đừng cho thú ăn nhé, đồ ăn của người không tốt cho chúng.',
    'MSG-MAS-059': 'Vuốt ảnh để xem thêm, kéo xuống để đọc phần giới thiệu.',
    'MSG-MAS-061': 'Được thôi! Khi sẵn sàng, nút Kết thúc chuyến vẫn ở đây.',
    'MSG-MAS-062': ({ k = 0 }) => `Hôm nay mình đã cùng bạn quét ${k} điểm. Vui ghê!`,
    'MSG-MAS-070': 'Chuyến đi đã lưu trên máy. Lần tới có sóng và mở app, mình sẽ gửi đi.',
    'MSG-MAS-074': 'Mất sóng rồi. Đừng lo, các điểm trong tuyến vẫn quét được.',
    'MSG-MAS-075': 'Có sóng lại rồi!',
  } satisfies Record<string, Text>,
  cheers: CHEERS,
  labels: {
    ask: `Hỏi ${NAME}`,
    dismiss: 'Đóng lời nhắn',
    notNow: 'Chưa',
    ctaRecommend: 'Gợi ý tuyến',
    ctaSeeAll: 'Xem tất cả tuyến',
    ctaCloseCamera: 'Đóng camera',
  },
};

export type MascotDialogue = {
  messages: { [K in keyof typeof vi.messages]: Text };
  cheers: readonly string[];
  labels: { [K in keyof typeof vi.labels]: string };
};
