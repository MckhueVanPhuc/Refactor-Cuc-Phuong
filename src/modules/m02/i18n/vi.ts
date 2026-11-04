// Chữ tiếng Việt của M02 (research R-14). Nhóm `notice` và `endPrompt` chép nguyên văn spec-M02 §5.1 "Fixed visitor
// messages"; các nhóm còn lại chép nguyên văn bảng copy của screen spec SCR-M02-001…004.
// Không chuỗi nào được nói "đã đến"/"có mặt": lượt ghé chỉ nghĩa là đã quét QR (BR-M02-005; SC-M02-013).

export const vi = {
  // Tiêu đề màn: SCR-M02-001 lấy từ mockup-SCR-M02-001 (bảng copy chưa có); chủ dự án duyệt 2026-11-04
  screenTitle: {
    trip: 'Chuyến đi',
    // SCR-M02-004: tên sản phẩm trên mockup-SCR-M02-004, giữ nguyên ở hai ngôn ngữ; chờ chủ dự án duyệt
    qrLink: 'Cúc Phương Quest',
  },
  // spec-M02 §5.1 "Fixed visitor messages"
  notice: {
    temporarilyClosed: 'Khu vực này đang tạm đóng. Vui lòng dừng lại hoặc quay về theo hướng dẫn của Ban Quản lý.',
    invalid: 'Mã không còn hiệu lực hoặc không tồn tại.',
    noOfflineResource: 'Chưa có nội dung offline cho điểm này.',
    sourceFailureInJourney: 'Chưa tải được nội dung mới. Đang dùng nội dung đã lưu nếu có.',
    connectionNeeded: 'Cần có kết nối mạng để kiểm tra mã QR này.',
    autoEndedCompleted: 'Chuyến đi trước đã tự kết thúc và được ghi là hoàn thành.',
    autoEndedAbandoned: 'Chuyến đi trước đã tự kết thúc vì đã quá 24 giờ.',
    freeVisitor:
      'Bạn đang xem tự do, lượt quét này không được ghi vào chuyến đi. Muốn ghi lại hành trình, hãy chọn tuyến.',
    cameraUnavailable:
      'Không dùng được camera. Hãy cho phép truy cập camera hoặc quét mã bằng ứng dụng máy ảnh của điện thoại.',
    sessionStartHint: 'Trong chuyến đi, hãy quét bằng nút Quét trong ứng dụng để lượt ghé được ghi lại.',
  },
  // spec-M02 §5.1: câu hỏi cuối chuyến và hai nút
  endPrompt: {
    question: 'Bạn đã quét điểm cuối. Kết thúc chuyến đi?',
    end: 'Kết thúc',
    continue: 'Đi tiếp',
  },
  // SCR-M02-001
  trip: {
    scan: 'Quét',
    scanned: 'Đã quét QR',
    lookingUp: 'Đang kiểm tra mã QR…',
    visitRecorded: 'Đã ghi nhận lượt quét.',
    replaceFailed: 'Chưa bắt đầu được chuyến mới. Chuyến hiện tại vẫn đang chạy.',
    previousTripSyncError: 'Chuyến đi trước không gửi được về hệ thống. Chuyến đi vẫn được lưu trên thiết bị này.',
    // Nút Finish: chữ lấy từ mockup-SCR-M02-001 (bảng copy chưa có); chủ dự án duyệt 2026-11-04
    finish: 'Kết thúc chuyến',
  },
  // SCR-M02-001: journey và scanner — chữ lấy từ mockup-SCR-M02-001 (bảng copy chưa có); chủ dự án duyệt 2026-11-04
  journey: {
    heading: 'Hành trình',
    notScanned: 'Chưa quét',
    progress: ({ scanned, total }: { scanned: number; total: number }) => `Đã quét QR: ${scanned}/${total} điểm`,
  },
  scanner: {
    title: 'Quét mã QR',
    instruction: 'Đưa mã QR của điểm dừng vào khung.',
    close: 'Đóng camera',
    retry: 'Thử lại',
  },
  // SCR-M02-001: handoff không dùng được
  handoff: {
    outdatedVersion: 'Dữ liệu chuyến đi này thuộc phiên bản cũ. Hãy chọn tuyến và bắt đầu lại.',
    alreadyUsed: 'Chuyến đi này đã được bắt đầu trước đó. Muốn đi lại, hãy chọn tuyến và bắt đầu lại.',
    expired: 'Lượt bắt đầu này đã hết hạn (quá 24 giờ). Hãy bắt đầu lại từ danh sách tuyến.',
    revoked: 'Tuyến này không còn nhận chuyến mới. Hãy chọn tuyến khác.',
    none: 'Chưa có chuyến đi để bắt đầu. Hãy chọn một tuyến.',
  },
  // SCR-M02-002
  content: {
    outdatedPackage: 'Nội dung này lấy từ gói tải trước đã cũ, có thể chưa phải bản mới nhất.',
    needsNetwork: 'Điểm này cần có mạng để xem nội dung.',
    mediaError: 'Không phát được tệp này.',
    play: 'Phát',
    pause: 'Dừng',
    scannedAt: ({ time }: { time: string }) => `Quét lúc ${time}`,
    back: 'Quay lại',
    audioLabel: ({ n }: { n: number }) => `Âm thanh ${n}`,
    videoLabel: ({ n }: { n: number }) => `Video ${n}`,
  },
  // SCR-M02-003
  end: {
    title: 'Chuyến đi đã kết thúc.',
    listTitle: 'Các điểm đã quét',
    syncPending: 'Chờ gửi về hệ thống',
    syncSynced: 'Đã gửi về hệ thống',
    syncConflict: 'Chuyến đi này không gửi được về hệ thống. Chuyến đi vẫn được lưu trên thiết bị này.',
    backToRoutes: 'Về danh sách tuyến',
  },
  // SCR-M02-004 (nút VI/EN là LanguageControl của M01; "Đang kiểm tra mã QR…" dùng `trip.lookingUp`)
  qrLink: {
    chooseRoute: 'Chọn tuyến',
  },
};

export type M02Messages = typeof vi;
