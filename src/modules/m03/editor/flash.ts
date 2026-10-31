// Thông báo thành công mang sang trang kế tiếp qua `location.state` (ví dụ lưu lần đầu chuyển sang URL có id,
// xuất bản xong quay về editor). Chỉ khóa danh mục và giá trị hiển thị, không bao giờ là id.
import { useState } from 'react';
import { useLocation } from 'react-router';
import { formatMessageFromServer, type MessageKey } from '../messages/catalog';

export type Flash = { messageKey: MessageKey; values?: Record<string, string | number> };

export type FlashState = {
  flash?: Flash;
  /** điểm tham quan vừa lưu, tô sáng trong danh sách của điểm dừng (BR-M03-E16) */
  highlightQr?: string;
};

/** Câu thông báo mang sang, đọc một lần lúc mở trang */
export function useFlash(): [string | null, () => void] {
  const location = useLocation();
  const [message, setMessage] = useState(() => {
    const flash = (location.state as FlashState | null)?.flash;
    return flash ? formatMessageFromServer(flash.messageKey, flash.values) : null;
  });
  return [message, () => setMessage(null)];
}

export function useHighlightedQr(): string | undefined {
  return (useLocation().state as FlashState | null)?.highlightQr;
}
