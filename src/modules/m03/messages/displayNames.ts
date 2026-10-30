// Tên hiển thị — spec-M03 §5.4. Màn hình quản trị chỉ hiện các tên này; mã enum không bao giờ hiện
// trên màn hình, trong thông báo, lịch sử hay nhật ký. Tên độ khó và nhãn lấy từ spec-M03 §5.1.

const STATUS_NAMES = {
  NHAP: 'Nháp',
  HOAT_DONG: 'Đang hoạt động',
  TAM_DONG: 'Tạm đóng',
  LUU_TRU: 'Đã lưu trữ',
} as const;

export const DISPLAY_NAMES = {
  routeStatus: STATUS_NAMES,
  checkpointStatus: STATUS_NAMES,
  qrStatus: { NHAP: 'Nháp', HOAT_DONG: 'Đang hoạt động', THU_HOI: 'Đã thu hồi' },
  revisionStatus: { NHAP: 'Bản nháp', PHAT_HANH: 'Đã xuất bản', LUU_TRU: 'Bản cũ', DA_BO: 'Đã bỏ' },
  connectivityMode: { OFFLINE_REQUIRED: 'Cần tải trước', ONLINE_AVAILABLE: 'Dùng được khi có mạng' },
  role: { REVIEWER: 'Quản lý', CONTENT_STAFF: 'Nhân viên nội dung' },
  accountStatus: { INVITATION_PENDING: 'Chờ nhận lời mời', ACTIVE: 'Đang hoạt động', DEACTIVATED: 'Đã khóa' },
  sessionStatus: { HOAN_TAT: 'Hoàn thành', BO_DO: 'Bỏ dở' },
  actionResult: { SUCCESS: 'Thành công', FAILURE: 'Không thành công' },
  closureSource: {
    MANUAL: 'Đóng thủ công',
    AUTO_NO_ACTIVE_CHECKPOINT: 'Tự đóng vì không còn điểm dừng hoạt động',
  },
  mediaType: { IMAGE: 'Ảnh', AUDIO: 'Âm thanh', VIDEO: 'Video' },
  spokenLanguage: { vi: 'Tiếng Việt', en: 'Tiếng Anh', NONE: 'Không lời' },
  uploadState: { uploading: 'Đang tải', uploaded: 'Đã tải', failed: 'Không tải được' },
  publicationUnit: {
    ROUTE_FIRST_PUBLICATION: 'Xuất bản tuyến lần đầu',
    ROUTE_INFORMATION: 'Thông tin tuyến và danh sách điểm dừng',
    CHECKPOINT_FIRST_PUBLICATION: 'Xuất bản điểm dừng lần đầu',
    CHECKPOINT_REVISION: 'Thông tin điểm dừng',
    QR_OBJECT: 'Điểm tham quan (một mã QR)',
  },
  difficulty: { NHE: 'Nhẹ', TRUNG_BINH: 'Trung bình', KHO: 'Khó' },
  timeTag: { TIME_NGAN: 'Ngắn', TIME_VUA: 'Vừa', TIME_DAI: 'Dài' },
  groupTag: {
    GROUP_CA_NHAN_NGUOI_LON: 'Cá nhân/người lớn',
    GROUP_GIA_DINH_CO_TRE: 'Gia đình có trẻ nhỏ',
    GROUP_CAN_DE_DANG: 'Cần đi dễ dàng',
  },
  experienceTag: {
    INTEREST_THIEN_NHIEN_CHUP_ANH: 'Thiên nhiên, chụp ảnh',
    INTEREST_TIM_HIEU: 'Tìm hiểu',
    INTEREST_KHAM_PHA: 'Khám phá',
  },
} as const;

type Names = typeof DISPLAY_NAMES;

export const routeStatusName = (code: keyof Names['routeStatus']) => DISPLAY_NAMES.routeStatus[code];
export const checkpointStatusName = (code: keyof Names['checkpointStatus']) => DISPLAY_NAMES.checkpointStatus[code];
export const qrStatusName = (code: keyof Names['qrStatus']) => DISPLAY_NAMES.qrStatus[code];
export const revisionStatusName = (code: keyof Names['revisionStatus']) => DISPLAY_NAMES.revisionStatus[code];

/** Readiness suy ra, không lưu: "Sẵn sàng" hoặc "Chưa đủ: {điều còn thiếu}" (§5.4). */
export function readinessLabel(missing: readonly string[]): string {
  return missing.length === 0 ? 'Sẵn sàng' : `Chưa đủ: ${missing.join(', ')}`;
}

/** §5.4 "Words never shown to staff" (mã enum cũng thuộc nhóm này). */
export const NEVER_SHOWN_WORDS = [
  'snapshot',
  'journey version',
  'contentVersion',
  'revision',
  'concurrency',
  'payload',
  'JSON',
  'null',
  'undefined',
  'token',
  'endpoint',
  'status code',
  'ingestion',
  'ingest',
  'đồng bộ',
  'xung đột trạng thái',
] as const;
