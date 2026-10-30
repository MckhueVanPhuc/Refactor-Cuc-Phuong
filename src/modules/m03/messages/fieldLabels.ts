// Nhãn tiếng Việt trên editor cho từng `targetFieldKey` (BR-M03-L04). `ValidationIssue.fieldLabel` và các dòng
// trước/sau của lịch sử dùng chung bảng này. Nhãn lấy từ screen spec SCR-M03-002, 003, 008.
// Khóa trường song ngữ có đuôi `.vi` / `.en`; nhãn của chúng thêm "(tiếng Việt)" / "(tiếng Anh)".

export type ItemType = 'ROUTE' | 'CHECKPOINT' | 'QRCODE';

export const FIELD_LABELS = {
  ROUTE: {
    name: 'Tên tuyến',
    shortDescription: 'Mô tả ngắn',
    description: 'Mô tả đầy đủ',
    startingPoint: 'Điểm xuất phát và cách đến',
    participationRequirements: 'Yêu cầu và điều kiện tham gia',
    preparation: 'Cần chuẩn bị',
    bestTime: 'Thời điểm phù hợp',
    safetyWarning: 'Cảnh báo an toàn',
    noSafetyWarningConfirmed: 'Xác nhận tuyến không có cảnh báo an toàn cần nêu',
    distanceKm: 'Quãng đường (km)',
    durationMin: 'Thời lượng dự kiến (phút)',
    difficulty: 'Độ khó',
    groupTags: 'Nhóm đối tượng',
    experienceTags: 'Trải nghiệm',
    thumbnailMediaId: 'Ảnh đại diện',
    galleryItems: 'Ảnh chi tiết',
    galleryCaption: 'Chú thích ảnh',
    routeMapMediaId: 'Ảnh sơ đồ tuyến',
    routeMapCaption: 'Chú thích sơ đồ tuyến',
    offlineRouteMapRequired: 'Sơ đồ này cần để định hướng khi không có mạng',
    highlights: 'Điểm nổi bật',
    checkpointList: 'Danh sách điểm dừng của tuyến',
  },
  CHECKPOINT: {
    checkpointName: 'Tên điểm dừng',
    connectivityMode: 'Loại kết nối',
    fieldVerificationConfirmed: 'Đã khảo sát thực địa, có sóng ổn định',
    locationNote: 'Ghi chú vị trí',
  },
  QRCODE: {
    objectName: 'Tên đối tượng',
    introductionText: 'Giới thiệu',
    images: 'Ảnh của điểm tham quan',
    avFiles: 'Âm thanh/video',
    usageRights: 'Xác nhận quyền sử dụng',
    spokenLanguage: 'Ngôn ngữ của tệp',
    installationLabel: 'Ghi chú lắp đặt',
  },
} as const;

export type FieldKey<T extends ItemType> = keyof (typeof FIELD_LABELS)[T];

const LANGUAGE_SUFFIX = { vi: ' (tiếng Việt)', en: ' (tiếng Anh)' } as const;

/**
 * Nhãn hiển thị của một `targetFieldKey`. Khóa song ngữ dạng `name.vi`; khóa phần tử danh sách có thể
 * kèm chỉ số, ví dụ `highlights.2.en` — chỉ số bị bỏ khi tra nhãn. Khóa lạ trả `undefined`.
 */
export function fieldLabel(itemType: ItemType, targetFieldKey: string): string | undefined {
  const parts = targetFieldKey.split('.').filter((part) => !/^\d+$/.test(part));
  const language = parts.at(-1);
  const isLanguage = language === 'vi' || language === 'en';
  const base = (isLanguage ? parts.slice(0, -1) : parts).join('.');
  const labels: Record<string, string> = FIELD_LABELS[itemType];
  const label = labels[base];
  if (label === undefined) return undefined;
  return isLanguage ? label + LANGUAGE_SUFFIX[language] : label;
}
