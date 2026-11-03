// Đường vào chung cho chuỗi trình quét đọc được: màn đang mở scanner đăng ký handler, và hook E2E `m02.scan(text)`
// (src/modules/m02/testing/e2eHooks.ts) gọi đúng handler đó, nên E2E đi qua cùng đường parseQrLink → processScan.
type ScanHandler = (text: string) => Promise<void>;

let handler: ScanHandler | null = null;

/** Đăng ký handler của màn hiện tại; trả hàm gỡ đăng ký. */
export function setScanHandler(next: ScanHandler): () => void {
  handler = next;
  return () => {
    if (handler === next) handler = null;
  };
}

export async function handleScannedText(text: string): Promise<void> {
  if (!handler) throw new Error('Không có màn nào đang nhận mã quét');
  await handler(text);
}
