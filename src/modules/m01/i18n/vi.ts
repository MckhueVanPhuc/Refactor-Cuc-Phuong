// Chữ tiếng Việt của M01 (research R-12). Câu chép nguyên văn bảng copy của screen spec SCR-M01-001…004;
// nhóm `nav`, `screenTitle`, `language.groupLabel` lấy theo tên màn ở screen list và mockup (validation-report DV-13).
// Mã enum chỉ làm khóa, không bao giờ là chữ hiển thị (visitor-ui-flow §4).

export type StatsParams = { n: number; km: string; min: number };

export const vi = {
  // Tên màn và nhãn điều hướng (screen-list-M01; mockup-SCR-M01-003) — DV-13
  nav: {
    catalog: 'Danh mục tuyến',
    recommend: 'Gợi ý tuyến',
    offline: 'Tài nguyên offline',
  },
  screenTitle: {
    catalog: 'Danh mục tuyến',
    recommend: 'Gợi ý tuyến',
    routeDetail: 'Chi tiết tuyến & Chuẩn bị',
    offline: 'Quản lý tài nguyên offline',
  },
  language: {
    groupLabel: 'Ngôn ngữ',
    // SCR-M01-001: bước chọn ngôn ngữ
    chooseTitle: 'Chọn ngôn ngữ (Tiếng Việt / English)',
  },

  // SCR-M01-001
  catalog: {
    offlineNeeded: 'Cần tải trước',
    stats: ({ n, km, min }: StatsParams) => `${n} điểm dừng · ${km} km · ${min} phút`,
    empty: 'Hiện chưa có tuyến nào để chọn.',
    stale: 'Dữ liệu đã lưu, có thể chưa phải bản mới nhất.',
    sourceUnavailable: 'Chưa tải được danh sách tuyến. Hãy kiểm tra kết nối và thử lại.',
  },
  // SCR-M01-001: lời nhắc cập nhật ứng dụng (shell dùng chung cho màn du khách M01/M02)
  update: {
    available: 'Đã có phiên bản mới của ứng dụng.',
    apply: 'Cập nhật',
    later: 'Để sau',
  },

  // SCR-M01-002: bảng nhãn dùng cho mọi màn du khách của M01
  labels: {
    difficulty: { NHE: 'Nhẹ', TRUNG_BINH: 'Trung bình', KHO: 'Khó' },
    timeTag: {
      TIME_NGAN: 'Ngắn (đến 90 phút)',
      TIME_VUA: 'Vừa (trên 90 đến 180 phút)',
      TIME_DAI: 'Dài (trên 180 phút)',
    },
    groupTag: {
      GROUP_CA_NHAN_NGUOI_LON: 'Cá nhân/người lớn',
      GROUP_GIA_DINH_CO_TRE: 'Gia đình có trẻ nhỏ',
      GROUP_CAN_DE_DANG: 'Cần đi dễ dàng',
    },
    experienceTag: {
      INTEREST_THIEN_NHIEN_CHUP_ANH: 'Thiên nhiên, chụp ảnh',
      INTEREST_TIM_HIEU: 'Tìm hiểu',
      INTEREST_KHAM_PHA: 'Khám phá',
    },
  },

  // SCR-M01-002
  recommend: {
    submit: 'Xem tuyến phù hợp',
    noMatch: 'Chưa có tuyến phù hợp với lựa chọn của bạn. Bạn có thể đổi tiêu chí hoặc xem tất cả tuyến.',
    changeChoices: 'Đổi tiêu chí',
    seeAllRoutes: 'Xem tất cả tuyến',
    sourceUnavailable: 'Chưa tải được danh sách tuyến. Hãy kiểm tra kết nối và thử lại.',
    groupTitle: { time: 'Thời gian', group: 'Đối tượng', experience: 'Trải nghiệm' },
  },

  // SCR-M01-003
  routeDetail: {
    start: 'Bắt đầu',
    offlineDecisionTitle: 'Tuyến này nên tải trước',
    stopsMayLackContent: ({ list }: { list: string }) =>
      `Một số điểm dừng có thể không có nội dung nếu bạn không tải trước: ${list}.`,
    estimatedSize: ({ n }: { n: string }) => `Dung lượng ước tính: khoảng ${n} MB.`,
    sizeUnavailable: 'Chưa có thông tin dung lượng.',
    scanHint:
      'Khi không có mạng, hãy quét mã bằng nút Quét trong ứng dụng, vì camera điện thoại có thể không mở được ứng dụng nếu không có mạng.',
    download: 'Tải về',
    continueWithoutDownload: 'Tiếp tục không tải',
    goBack: 'Quay lại',
    savedAt: ({ time }: { time: string }) => `Thông tin được lưu lúc ${time}, có thể không phải bản mới nhất`,
    outdated: 'Gói tải trước này đã cũ nhưng vẫn dùng được.',
    incomplete: 'Tải chưa hoàn tất. Hãy thử tải lại.',
    startBlockedOffline: 'Chưa bắt đầu được vì không có mạng và tuyến này chưa được tải trước.',
    startFailed: 'Chưa bắt đầu được. Hãy thử lại.',
    routeUnavailable: 'Tuyến này hiện không nhận chuyến mới.',
    sourceErrorUsingSaved: 'Chưa tải được thông tin mới. Đang hiển thị thông tin đã lưu.',
  },

  // SCR-M01-004
  offline: {
    status: {
      notDownloaded: 'Chưa tải',
      downloading: 'Đang tải',
      readyCurrent: 'Sẵn sàng – mới nhất',
      readyOutdated: 'Sẵn sàng – có bản mới',
      incomplete: 'Chưa hoàn tất',
    },
    essentialsSavedAt: ({ time }: { time: string }) => `Thông tin tuyến lưu lúc ${time}`,
    hasOfflineRouteMap: 'Có sơ đồ tuyến offline',
    updateFailed: 'Chưa cập nhật được. Vẫn dùng bản đã tải.',
    storageError:
      'Không lưu được dữ liệu trên thiết bị nên chưa tải xong. Bản đã tải trước đó không bị ảnh hưởng. Bạn có thể thử lại.',
    deleteConfirm: ({ name }: { name: string }) =>
      `Xóa gói tải trước của tuyến "${name}"? Chuyến đi đang diễn ra không bị ảnh hưởng.`,
    deleteConfirmAction: 'Xóa',
    deleteKeepAction: 'Giữ lại',
    empty: 'Bạn chưa tải tuyến nào.',
    outdatedWarning: 'Gói tải trước này đã cũ nhưng vẫn dùng được.',
    unreadable: 'Gói tải trước không đọc được',
    downloadAgain: 'Tải lại',
    delete: 'Xóa',
  },
};

export type M01Messages = typeof vi;
