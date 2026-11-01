// Danh sách khép kín hộp xác nhận của M03 (BR-M03-L12; spec-M03 3.7 clarification 7 thêm Hủy mục chưa từng xuất
// bản): đóng, mở lại, lưu trữ, thu hồi, hủy mục chưa từng xuất bản, xuất bản, rời trang có thay đổi chưa lưu.
// Mỗi hộp: một câu hậu quả từ danh mục §5.6 và hai nút. Không màn nào tự dựng hộp xác nhận ngoài danh sách này.
import { formatMessage, type MessageKey, type MessageValues } from '../messages/catalog';

type ConfirmationSpec = {
  /** Câu hậu quả (tiêu đề hộp thoại) */
  messageKey: MessageKey;
  /** Chỉ đóng điểm dừng: câu nêu các tuyến sẽ tự đóng tạm, hiện khi có tuyến như vậy */
  autoCloseMessageKey?: MessageKey;
  /** Nút an toàn: focus ban đầu, phím Esc */
  safeLabel: string;
  confirmLabel: string;
};

export const CONFIRMATIONS = {
  CLOSE_ROUTE: { messageKey: 'MSG-CONFIRM-CLOSE-ROUTE', safeLabel: 'Không đóng', confirmLabel: 'Đóng tạm' },
  REOPEN_ROUTE: { messageKey: 'MSG-CONFIRM-REOPEN-ROUTE', safeLabel: 'Không mở lại', confirmLabel: 'Mở lại' },
  ARCHIVE_ROUTE: { messageKey: 'MSG-CONFIRM-ARCHIVE-ROUTE', safeLabel: 'Không lưu trữ', confirmLabel: 'Lưu trữ' },
  DISCARD_ROUTE: { messageKey: 'MSG-CONFIRM-DISCARD-ROUTE', safeLabel: 'Không hủy', confirmLabel: 'Hủy tuyến' },
  CLOSE_CHECKPOINT: {
    messageKey: 'MSG-CLOSE-AFFECTS-ROUTES',
    autoCloseMessageKey: 'MSG-CLOSE-ROUTE-AUTO',
    safeLabel: 'Không đóng',
    confirmLabel: 'Đóng tạm',
  },
  REOPEN_CHECKPOINT: { messageKey: 'MSG-CONFIRM-REOPEN-CHECKPOINT', safeLabel: 'Không mở lại', confirmLabel: 'Mở lại' },
  ARCHIVE_CHECKPOINT: { messageKey: 'MSG-CONFIRM-ARCHIVE-CHECKPOINT', safeLabel: 'Không lưu trữ', confirmLabel: 'Lưu trữ' },
  DISCARD_CHECKPOINT: { messageKey: 'MSG-CONFIRM-DISCARD-CHECKPOINT', safeLabel: 'Không hủy', confirmLabel: 'Hủy điểm dừng' },
  REVOKE_QR: { messageKey: 'MSG-CONFIRM-REVOKE-QR', safeLabel: 'Không thu hồi', confirmLabel: 'Thu hồi' },
  DISCARD_QR: { messageKey: 'MSG-CONFIRM-DISCARD-QR', safeLabel: 'Không hủy', confirmLabel: 'Hủy điểm tham quan' },
  PUBLISH: { messageKey: 'MSG-CONFIRM-PUBLISH', safeLabel: 'Quay lại', confirmLabel: 'Xuất bản' },
  UNSAVED_CHANGES: { messageKey: 'MSG-UNSAVED-CHANGES', safeLabel: 'Ở lại', confirmLabel: 'Rời đi' },
} as const satisfies Record<string, ConfirmationSpec>;

export type ConfirmationKind = keyof typeof CONFIRMATIONS;

export const CONFIRMATION_KINDS = Object.keys(CONFIRMATIONS) as ConfirmationKind[];

type KeyOf<K extends ConfirmationKind> = (typeof CONFIRMATIONS)[K]['messageKey'];

/** Props cho `Dialog`/`ReasonDialog`: câu hậu quả đã điền giá trị thường và hai nhãn nút */
export type ConfirmationProps = { title: string; safeLabel: string; confirmLabel: string };

export function confirmation<K extends ConfirmationKind>(
  kind: K,
  ...[values]: [MessageValues<KeyOf<K>>] extends [Record<string, never>] ? [values?: MessageValues<KeyOf<K>>] : [values: MessageValues<KeyOf<K>>]
): ConfirmationProps {
  const spec: ConfirmationSpec = CONFIRMATIONS[kind];
  const render = formatMessage as (key: MessageKey, values?: Record<string, string | number>) => string;
  return {
    title: render(spec.messageKey, values as Record<string, string | number> | undefined),
    safeLabel: spec.safeLabel,
    confirmLabel: spec.confirmLabel,
  };
}

/** Câu "các tuyến sẽ tự đóng tạm" của hộp đóng điểm dừng (MSG-CLOSE-ROUTE-AUTO) */
export function autoCloseSentence(routeNames: readonly string[]): string {
  return formatMessage(CONFIRMATIONS.CLOSE_CHECKPOINT.autoCloseMessageKey, { 'danh sách': routeNames.join(', ') });
}
