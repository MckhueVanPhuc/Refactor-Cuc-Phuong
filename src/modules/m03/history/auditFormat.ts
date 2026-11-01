// Hiển thị dòng audit bằng chữ thường ngày (tasks T149; BR-M03-F08, L10, L11; admin-command §5 "Giá trị
// audit_records.action"; SCR-M03-009). Mã hành động, loại mục và kết quả không bao giờ hiện ra; trước/sau là
// các dòng "{nhãn trường}: {trước} → {sau}" dùng nhãn của fieldLabels.ts và tên hiển thị của displayNames.ts.
import type { AuditRow } from '../contracts/adminDtos';
import { DISPLAY_NAMES } from '../messages/displayNames';

/** Tên hiển thị của mọi giá trị `action` (admin-command §5); từ vựng §5.4 */
export const ACTION_NAMES = {
  ROUTE_DRAFT_SAVED: 'Lưu bản nháp tuyến',
  CHECKPOINT_DRAFT_SAVED: 'Lưu bản nháp điểm dừng',
  VISIT_POINT_DRAFT_SAVED: 'Lưu bản nháp điểm tham quan',
  MEDIA_REGISTERED: 'Tải tệp lên',
  PUBLISHED: 'Xuất bản',
  DRAFT_DISCARDED: 'Bỏ thay đổi',
  ITEM_DISCARDED: 'Hủy',
  REVISION_RESTORED: 'Khôi phục bản đã xuất bản trước đó',
  ROUTE_CLOSED: 'Đóng tạm tuyến',
  ROUTE_AUTO_CLOSED: 'Tuyến tự đóng tạm',
  CHECKPOINT_CLOSED: 'Đóng tạm điểm dừng',
  RELATED_ROUTES_CLOSED: 'Đóng tạm các tuyến liên quan',
  ROUTE_REOPENED: 'Mở lại tuyến',
  CHECKPOINT_REOPENED: 'Mở lại điểm dừng',
  ROUTE_ARCHIVED: 'Lưu trữ tuyến',
  CHECKPOINT_ARCHIVED: 'Lưu trữ điểm dừng',
  QR_REVOKED: 'Thu hồi mã QR',
  QR_REPRINTED: 'In lại mã QR',
  ACCOUNT_INVITED: 'Mời tài khoản',
  ACCOUNT_INVITE_RESENT: 'Gửi lại lời mời',
  ACCOUNT_LINKED: 'Nhận lời mời',
  ACCOUNT_ROLE_CHANGED: 'Đổi vai trò',
  ACCOUNT_STATUS_CHANGED: 'Khóa hoặc mở khóa tài khoản',
  INITIAL_REVIEWER_PROVISIONED: 'Cấp quyền Quản lý đầu tiên',
} as const;

/** Giá trị lạ (ví dụ phiên bản backend mới hơn) vẫn hiện bằng chữ, không bao giờ hiện mã */
const UNKNOWN_ACTION = 'Thao tác quản trị';

export function actionName(action: string): string {
  return Object.hasOwn(ACTION_NAMES, action) ? ACTION_NAMES[action as keyof typeof ACTION_NAMES] : UNKNOWN_ACTION;
}

export const SUBJECT_TYPE_NAMES: Record<AuditRow['subjectType'], string> = {
  ROUTE: 'Tuyến',
  CHECKPOINT: 'Điểm dừng',
  QRCODE: 'Điểm tham quan',
  ACCOUNT: 'Tài khoản',
  MEDIA: 'Tệp',
};

/** "Tuyến: Đường lên Mả Tổ"; mục chưa có tên thì chỉ loại mục */
export function subjectLabel(row: Pick<AuditRow, 'subjectType' | 'subjectName'>): string {
  const type = SUBJECT_TYPE_NAMES[row.subjectType];
  return row.subjectName ? `${type}: ${row.subjectName}` : type;
}

export const resultName = (result: AuditRow['result']) => DISPLAY_NAMES.actionResult[result];

/** Một dòng trước/sau; ô trống hiện "—" như màn xem lại */
export function changeLine(change: { fieldLabel: string; before: string; after: string }): string {
  return `${change.fieldLabel}: ${change.before || '—'} → ${change.after || '—'}`;
}

/** Dòng nêu các tuyến bị ảnh hưởng của một thao tác trên điểm dừng (BR-M03-X06) */
export function affectedRoutesLine(routeNames: readonly string[]): string {
  return `Tuyến bị ảnh hưởng: ${routeNames.join(', ')}`;
}
