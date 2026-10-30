// Giới hạn của M03 — spec-M03 §5.3. Nơi DUY NHẤT phía client giữ các giá trị này (research R-19).
// Mọi giá trị là **provisional**: cần kiểm trên giao diện và thiết bị thật, không phải quy tắc nghiệp vụ đã chốt.
// Đổi giá trị thì đổi đồng thời ở đây và `app.limit` phía DB.
// Ký tự đếm sau khi trim hai đầu; 1 MB = 1 048 576 byte.

/** provisional — §5.3: tên tuyến, điểm dừng, đối tượng QR (mỗi ngôn ngữ) */
export const NAME_MAX_CHARS = 100;
/** provisional — §5.3: mô tả ngắn của tuyến */
export const ROUTE_SHORT_DESC_MAX_CHARS = 160;
/** provisional — §5.3: mô tả đầy đủ của tuyến */
export const ROUTE_DESC_MAX_CHARS = 2000;
/** provisional — §5.3: điểm xuất phát và cách đến */
export const ROUTE_START_MAX_CHARS = 500;
/** provisional — §5.3: yêu cầu và điều kiện tham gia */
export const ROUTE_PARTICIPATION_MAX_CHARS = 300;
/** provisional — §5.3: cần chuẩn bị */
export const ROUTE_PREPARATION_MAX_CHARS = 500;
/** provisional — §5.3: thời điểm phù hợp */
export const ROUTE_BEST_TIME_MAX_CHARS = 200;
/** provisional — §5.3: cảnh báo an toàn */
export const ROUTE_SAFETY_WARNING_MAX_CHARS = 500;
/** provisional — §5.3: số mục điểm nổi bật */
export const ROUTE_HIGHLIGHTS_MAX_ITEMS = 5;
/** provisional — §5.3: độ dài một điểm nổi bật */
export const ROUTE_HIGHLIGHT_MAX_CHARS = 80;
/** provisional — §5.3: chú thích ảnh và sơ đồ */
export const CAPTION_MAX_CHARS = 200;
/** provisional — §5.3: ghi chú vị trí, ghi chú lắp đặt, mọi lý do quản trị */
export const NOTE_MAX_CHARS = 300;
/** provisional — §5.3: giới thiệu đối tượng QR, tối thiểu (mỗi ngôn ngữ) */
export const QR_INTRO_MIN_CHARS = 30;
/** provisional — §5.3: giới thiệu đối tượng QR, tối đa (mỗi ngôn ngữ) */
export const QR_INTRO_MAX_CHARS = 2000;
/** provisional — §5.3: ảnh chi tiết của tuyến (ảnh đại diện và sơ đồ tính riêng) */
export const ROUTE_GALLERY_MAX_IMAGES = 8;
/** provisional — §5.3: quãng đường, km, tối đa một chữ số thập phân */
export const ROUTE_DISTANCE_MAX_KM = 100;
/** provisional — §5.3: thời lượng, phút (tuyến đi trong ngày) */
export const ROUTE_DURATION_MAX_MIN = 1440;
/** provisional — §5.3: số mục trong danh sách điểm dừng của tuyến (kể cả điểm đang đóng) */
export const ROUTE_CHECKPOINTS_MAX_ITEMS = 30;
/** provisional — §5.3: số đối tượng QR chưa `THU_HOI` của một điểm dừng */
export const CHECKPOINT_QR_MAX_ITEMS = 20;
/** provisional — §5.3: khoảng báo cáo tối đa, tính cả hai ngày */
export const REPORT_MAX_SPAN_DAYS = 366;
/** §5.1 Report outputs: mặc định 30 ngày gần nhất — không phải mức tối đa */
export const REPORT_DEFAULT_SPAN_DAYS = 30;
/** provisional — §5.3: ảnh mỗi đối tượng QR */
export const QR_MAX_IMAGES = 5;
/** provisional — §5.3: tệp âm thanh/video mỗi đối tượng QR (tổng) */
export const QR_MAX_AV_FILES = 3;
/** provisional — §5.3: dung lượng ảnh, MB */
export const IMAGE_MAX_MB = 2;
/** provisional — §5.3: dung lượng âm thanh, MB */
export const AUDIO_MAX_MB = 5;
/** provisional — §5.3: dung lượng video, MB */
export const VIDEO_MAX_MB = 30;
/** provisional — §5.3: dung lượng tải trước ước tính của một hành trình tuyến, MB */
export const OFFLINE_PACKAGE_MAX_MB = 50;
/** provisional — §5.3: email quản trị sau chuẩn hóa */
export const EMAIL_MAX_CHARS = 254;
/** provisional — §5.3: số ký tự cuối của mã QR hiện cho nhân viên */
export const QR_CODE_DISPLAY_SUFFIX_CHARS = 6;
/** provisional — §5.3: mức sửa lỗi của mã in */
export const QR_PRINT_ERROR_CORRECTION = 'Q';
/** provisional — §5.3: độ rộng PNG tối thiểu của mã in, px */
export const QR_PRINT_PNG_MIN_PX = 1024;
/** provisional — §5.3: lề trống quanh mã in, module */
export const QR_PRINT_QUIET_ZONE_MODULES = 4;
/** provisional — §5.3: độ rộng in tối thiểu ghi trên màn tải xuống, cm */
export const QR_PRINT_MIN_SIZE_CM = 3;

/** §5.3: 1 MB = 1 048 576 byte */
export const BYTES_PER_MB = 1_048_576;

export function megabytesToBytes(megabytes: number): number {
  return megabytes * BYTES_PER_MB;
}

export type MediaType = 'IMAGE' | 'AUDIO' | 'VIDEO';

/** Dung lượng tối đa mỗi tệp theo loại, byte */
export const MAX_FILE_BYTES: Readonly<Record<MediaType, number>> = {
  IMAGE: megabytesToBytes(IMAGE_MAX_MB),
  AUDIO: megabytesToBytes(AUDIO_MAX_MB),
  VIDEO: megabytesToBytes(VIDEO_MAX_MB),
};

export const OFFLINE_PACKAGE_MAX_BYTES = megabytesToBytes(OFFLINE_PACKAGE_MAX_MB);

/** §5.3 "Supported file types": giá trị `Media.mimeType` */
export const SUPPORTED_MIME_TYPES: Readonly<Record<MediaType, readonly string[]>> = {
  IMAGE: ['image/jpeg', 'image/png', 'image/webp'],
  AUDIO: ['audio/mpeg', 'audio/mp4'],
  VIDEO: ['video/mp4'],
};

/** Tên định dạng hiện cho nhân viên trong MSG-FILE-TYPE */
export const SUPPORTED_FORMAT_NAMES: Readonly<Record<MediaType, string>> = {
  IMAGE: 'JPEG, PNG, WebP',
  AUDIO: 'MP3, M4A',
  VIDEO: 'MP4',
};
