// Tiêm lỗi cho kiểm thử: lần kích hoạt gói kế tiếp thất bại như hết quota (quickstart V12; tasks T031, T079).
// Chỉ được bật qua hook E2E (MODE e2e/fake) hoặc unit test; packageWriter (US6) đọc cờ trong transaction kích hoạt.
let failNext = false;

export function failNextActivation(): void {
  failNext = true;
}

/** Trả `true` đúng một lần sau mỗi lần `failNextActivation()`. */
export function consumeActivationFailure(): boolean {
  const value = failNext;
  failNext = false;
  return value;
}
