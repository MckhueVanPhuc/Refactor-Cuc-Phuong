// Namespace `m02` của `window.__cpqTestHooks` (tasks T023). Chỉ được nạp bằng import() động trong nhánh MODE e2e/fake
// của src/app/App.tsx, nên không vào bundle production. Hook được thêm cùng task tạo hàm mà nó gọi:
// `scan(text)` (US2, T039) và `failNextCreateSession` (V18, nhánh thay phiên lỗi, T071).
import { registerTestHooks, type TestHooks } from '../../../shared/testing/e2eHooks';
import { handleScannedText } from '../scan/scanBridge';
import { failNextCreateSession } from '../storage/faultInjection';

const hooks: TestHooks = {
  // Đưa chuỗi vào đúng đường của trình quét trên màn đang mở: parseQrLink → processScan (T039)
  scan: (text: string) => handleScannedText(text),
  // V18: lần tạo phiên kế tiếp lỗi ngay trước khi chèn phiên mới (T071)
  failNextCreateSession: () => failNextCreateSession(),
};

export function registerM02TestHooks(): void {
  registerTestHooks('m02', hooks);
}
