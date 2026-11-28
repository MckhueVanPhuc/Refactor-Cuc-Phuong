// Lời thoại tiếng Việt của Mila. Chép nguyên văn spec-Mascot §5.6 và bảng copy screen spec SCR-M01-001…004,
// SCR-M02-001…004 (đã đồng bộ 2026-11-21). Không chuỗi nào nói "đã đến/có mặt" (SC-M02-013).
/** `cheer`: chỉ số trong `cheers` của ngôn ngữ đang hiển thị (đổi VI/EN không ra câu lai). */
/** `r`: số điểm còn lại (n − k) cho câu chạm giữa chặng. */
/** `next`: tên hai ngôn ngữ của điểm gợi ý kế tiếp (v1.7, `{next}` của spec-Mascot §5.6); câu chọn nhánh của mình. */
export type BilingualName = { vi: string; en: string };
export type MessageParams = { k?: number; n?: number; r?: number; count?: number; cheer?: number; next?: BilingualName };
type Text = string | ((p: MessageParams) => string);

/** Giới hạn bong bóng sau khi thay tham số (spec-Mascot §5.4) */
export const MASCOT_BUBBLE_MAX_CHARS = 90;

/**
 * Câu có `{next}` (spec-Mascot §5.6 v1.7): cả câu nếu ≤ 90 ký tự, không thì chỉ câu đầu; câu đầu cũng quá 90 ký tự →
 * chuỗi rỗng, luật không cho nói (tên điểm rất dài). Luật chỉ phát câu khi có điểm tiếp theo.
 */
export function nextStopText(first: string, rest: string): string {
  const full = `${first} ${rest}`;
  if ([...full].length <= MASCOT_BUBBLE_MAX_CHARS) return full;
  return [...first].length <= MASCOT_BUBBLE_MAX_CHARS ? first : '';
}

const NAME = 'Mila';
const CHEERS = ['Tuyệt!', 'Hay quá!', 'Thêm một điểm nữa!'];

export const vi = {
  messages: {
    // v1.3: một bong bóng trong lớp phủ giới thiệu, dài hơn 90 ký tự theo quyết định 2026-11-23 (spec-Mascot §5.4)
    'MSG-MAS-001': `Chào bạn! Mình là ${NAME}, rái cá thám hiểm của Cúc Phương. Mình sẽ đồng hành cùng bạn trong suốt chuyến tham quan này. Cùng chọn một tuyến nhé!`,
    'MSG-MAS-004': 'Chào mừng bạn quay lại! Hôm nay mình đi tuyến nào đây?',
    'MSG-MAS-005': 'Mình đang mở bản đồ các tuyến…',
    'MSG-MAS-012': 'Bấm Gợi ý tuyến, mình chọn giúp theo thời gian và sở thích của bạn.',
    'MSG-MAS-008': 'Chưa biết chọn tuyến nào? Để mình gợi ý cho.',
    'MSG-MAS-009': 'Chạm vào một tuyến để xem chi tiết, hoặc thử Gợi ý tuyến.',
    'MSG-MAS-010': 'Bạn có bao lâu, đi cùng ai, thích gì? Chọn mỗi nhóm một ý nhé.',
    'MSG-MAS-011': 'Đây là những tuyến hợp với bạn!',
    'MSG-MAS-013': 'Thử xem tất cả tuyến, biết đâu có tuyến bạn thích.',
    'MSG-MAS-014': 'Trước khi đi, bạn đọc kỹ phần Cảnh báo an toàn giúp mình nhé.',
    // v1.6 (CHG-MASCOT-2026-11-25-06 D2): câu chạm Mila theo từng màn M01 (BR-MAS-12)
    'MSG-MAS-015': 'Chọn đủ ba mục rồi bấm Xem tuyến phù hợp nhé.',
    'MSG-MAS-016': 'Chạm vào một tuyến để xem chi tiết, hoặc bấm Đổi tiêu chí.',
    'MSG-MAS-017': 'Đọc kỹ Cảnh báo an toàn, tải gói nếu cần, rồi bấm Bắt đầu nhé.',
    'MSG-MAS-019': 'Tải gói nếu cần, rồi bấm Bắt đầu nhé.',
    'MSG-MAS-018': 'Tải gói trước khi vào rừng để xem tuyến khi mất sóng.',
    'MSG-MAS-020': 'Mình đang xếp nội dung vào ba lô. Giữ trang này mở nhé.',
    'MSG-MAS-021': 'Giờ các điểm này xem được cả khi mất sóng.',
    'MSG-MAS-024': 'Tải chưa xong. Ra chỗ sóng mạnh hơn rồi thử lại nhé.',
    'MSG-MAS-025': 'Máy chưa cho mình lưu. Xem lại bộ nhớ trống hoặc chế độ ẩn danh nhé.',
    'MSG-MAS-026': 'Vẫn chưa được. Có mạng thì bạn vẫn đi được, chỉ vài điểm cần sóng để xem.',
    // v1.7 (CHG-MASCOT-2026-11-27-07): nói điểm tiếp theo thay vì lặp câu gợi ý bắt đầu phiên
    'MSG-MAS-030': ({ next }) => nextStopText(`Điểm tiếp theo: ${next?.vi ?? ''}.`, 'Tìm tem QR ở đó rồi bấm Quét QR nhé!'),
    'MSG-MAS-032': 'Thấy tem thì bấm Quét QR. Chạm điểm đã quét để đọc lại nhé.',
    // v1.7: thẻ tuyến đã hiện số điểm còn lại
    'MSG-MAS-033': 'Chạm điểm đã quét để đọc lại, hoặc quét tem QR ở điểm tiếp theo nhé.',
    'MSG-MAS-043': 'Lại gần tem hơn và tránh chỗ chói nắng nhé.',
    'MSG-MAS-034': 'Chào mừng quay lại! Hành trình của bạn vẫn còn nguyên.',
    'MSG-MAS-040': 'Đưa tem QR vào giữa khung và giữ máy yên một chút.',
    'MSG-MAS-042': 'Chưa quét được? Thử lại gần hơn và tránh chỗ chói nắng.',
    'MSG-MAS-044': 'Sóng hơi yếu, mình vẫn đang kiểm tra…',
    'MSG-MAS-046': 'Hãy quét tem QR của Vườn ở điểm dừng. Tem cũ thì thử tem khác nếu có.',
    'MSG-MAS-048': 'Mã này cần có sóng để kiểm tra. Điểm trong tuyến vẫn quét được khi mất sóng.',
    'MSG-MAS-049': 'Mình tắt camera cho đỡ tốn pin nhé?',
    'MSG-MAS-050': ({ cheer = 0, k = 0, n = 0 }) => `${CHEERS[cheer % CHEERS.length]} Đã ghi nhận lượt quét: ${k}/${n} điểm.`,
    'MSG-MAS-051': 'Đã ghi nhận mã QR đầu tiên! Đọc thử câu chuyện của điểm này nhé.',
    'MSG-MAS-052': 'Điểm này không thuộc tuyến của bạn nên không tính vào hành trình. Cứ xem nhé!',
    'MSG-MAS-054': 'Mất sóng cũng không sao, mình mở bản đã tải sẵn cho bạn.',
    'MSG-MAS-055': 'Đã ghi nhận! Bạn đã quét được nửa số điểm rồi đó!',
    'MSG-MAS-058': 'Đã ghi nhận! Chỉ còn một điểm nữa thôi!',
    'MSG-MAS-056': ({ next }) => nextStopText(`Điểm tiếp theo: ${next?.vi ?? ''}.`, 'Tham quan xong thì đi tiếp và quét mã nhé!'),
    'MSG-MAS-057a': 'Đi nhẹ, nói khẽ để nghe được tiếng rừng nhé.',
    'MSG-MAS-057b': 'Ngắm thôi, đừng hái hay mang gì ra khỏi rừng nhé.',
    'MSG-MAS-057c': 'Giữ rác trong ba lô cho tới khi gặp thùng rác nhé.',
    'MSG-MAS-057d': 'Đi đúng đường mòn để an toàn cho bạn và cho rừng.',
    'MSG-MAS-057e': 'Đừng cho thú ăn nhé, đồ ăn của người không tốt cho chúng.',
    'MSG-MAS-059': 'Vuốt ảnh để xem thêm, kéo xuống để đọc phần giới thiệu.',
    'MSG-MAS-065': 'Cảm ơn bạn đã đi cùng mình hôm nay!',
    'MSG-MAS-085': 'Ui, chóng mặt quá!',
    'MSG-MAS-061': 'Được thôi! Khi sẵn sàng, nút Kết thúc chuyến vẫn ở đây.',
    'MSG-MAS-070': 'Chuyến đi đã lưu trên máy. Lần tới có sóng và mở app, mình sẽ gửi đi.',
    'MSG-MAS-074': 'Mất sóng rồi. Đừng lo, các điểm trong tuyến vẫn quét được.',
    'MSG-MAS-075': 'Có sóng lại rồi!',
  } satisfies Record<string, Text>,
  cheers: CHEERS,
  labels: {
    /** Dòng tên trên bong bóng (design-system §9.3) */
    name: NAME,
    ask: `Hỏi ${NAME}`,
    /** Công tắc "Hiệu ứng chuyển động" ở màn Tài nguyên (v1.3; nhãn v1.4, BR-MAS-21) */
    motion: 'Hiệu ứng chuyển động',
    motionHint: `Tắt để ${NAME} và hiệu ứng trang trí đứng yên.`,
    /** Dòng gợi ý dưới Mila trong lớp phủ giới thiệu (v1.3, US-MAS-01) */
    introHint: 'Chạm để bắt đầu',
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
