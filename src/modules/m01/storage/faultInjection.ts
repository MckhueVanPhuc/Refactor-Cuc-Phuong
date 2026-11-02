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

let failNextContext = false;

/** Lần ghi context kế tiếp thất bại trong transaction (quickstart V21; tasks T058, T060). */
export function failNextContextWrite(): void {
  failNextContext = true;
}

export function consumeContextWriteFailure(): boolean {
  const value = failNextContext;
  failNextContext = false;
  return value;
}
