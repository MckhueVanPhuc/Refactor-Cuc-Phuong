// Tiêm lỗi cho test và E2E (quickstart V18): lần tạo phiên kế tiếp ném lỗi NGAY TRƯỚC khi chèn phiên mới, sau khi phiên
// cũ đã được đặt `BO_DO` trong cùng transaction — kiểm rollback all-or-nothing (BR-M02-013). Chỉ được bật qua hook E2E
// (src/modules/m02/testing/e2eHooks.ts) hoặc test.
let failNext = false;

export function failNextCreateSession(): void {
  failNext = true;
}

export function consumeCreateSessionFault(): boolean {
  const fail = failNext;
  failNext = false;
  return fail;
}
