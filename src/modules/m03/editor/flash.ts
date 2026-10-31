// Thông báo thành công mang sang trang kế tiếp qua `location.state` (ví dụ lưu lần đầu chuyển sang URL có id,
// xuất bản xong quay về editor). Chỉ khóa danh mục và giá trị hiển thị, không bao giờ là id.
import { useState } from 'react';
import { useLocation } from 'react-router';
import { formatMessageFromServer, type MessageKey } from '../messages/catalog';

export type Flash = { messageKey: MessageKey; values?: Record<string, string | number> };

export type FlashState = {
  flash?: Flash;
  /** câu cảnh báo đi kèm (ví dụ MSG-UPLOAD-SUMMARY khi có ảnh không tải được ở lần lưu đầu) */
  warning?: Flash;
  /** điểm tham quan vừa lưu, tô sáng trong danh sách của điểm dừng (BR-M03-E16) */
  highlightQr?: string;
};

const render = (flash: Flash | undefined) => (flash ? formatMessageFromServer(flash.messageKey, flash.values) : null);

/** Câu thông báo (và cảnh báo đi kèm, nếu có) mang sang, đọc một lần lúc mở trang */
export function useFlash(): [string | null, () => void, string | null] {
  const location = useLocation();
  const [messages, setMessages] = useState(() => {
    const state = location.state as FlashState | null;
    return { message: render(state?.flash), warning: render(state?.warning) };
  });
  return [messages.message, () => setMessages({ message: null, warning: null }), messages.warning];
}

export function useHighlightedQr(): string | undefined {
  return (useLocation().state as FlashState | null)?.highlightQr;
}
