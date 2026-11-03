// Namespace `m02` của `window.__cpqTestHooks` (tasks T023). Chỉ được nạp bằng import() động trong nhánh MODE e2e/fake
// của src/app/App.tsx, nên không vào bundle production. Hook được thêm cùng task tạo hàm mà nó gọi:
// `failNextCreateSession` (V18) ở T030, `scan(text)` (đưa chuỗi qua parseQrLink → processScan như scanner) ở US2.
import { registerTestHooks, type TestHooks } from '../../../shared/testing/e2eHooks';

const hooks: TestHooks = {};

export function registerM02TestHooks(): void {
  registerTestHooks('m02', hooks);
}
