// Chỉ cho test: nạp sẵn các màn lazy của M02 (routes.tsx) trước ca đầu tiên của tệp. Lần nạp đầu phải biến đổi cả cây
// module của màn; trên máy chậm việc đó có lúc quá `asyncUtilTimeout` (3 s) của ca đầu tiên dù màn vẫn đúng
// (validation report specs/005 DV-100). Gọi trong `beforeAll`, sau các `vi.mock` của tệp.
export async function preloadM02Routes(): Promise<void> {
  await Promise.all([
    import('../session/TripPage'),
    import('../content/ContentPage'),
    import('../end/EndPage'),
    import('../qr-link/QrLinkPage'),
    import('../scan/ScanPage'),
    import('../scanner/QrScanner'),
  ]);
}

/** Thời gian cho `beforeAll` nạp sẵn: rộng vì chỉ chạy một lần mỗi tệp */
export const PRELOAD_TIMEOUT_MS = 60_000;
