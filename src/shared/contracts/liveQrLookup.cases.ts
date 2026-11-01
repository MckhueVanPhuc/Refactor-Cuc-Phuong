// Bảng sự thật synthetic của live lookup (tasks T142; live-qr-lookup-contract §3–§4; BR-M03-I01–I04).
// Mỗi ca: trạng thái của QR, điểm dừng và tuyến (nếu người gọi gửi routeId) → output kỳ vọng.
// Dùng làm oracle cho pgTAP/E2E của `api.lookup_qr` ở giai đoạn B (T190–T191) và cho test consumer của M02.
// Bảng chỉ ghi kết quả, không cài lại luật: nơi dùng dựng dữ liệu theo `input` rồi so output với `expected`.
// Lỗi nguồn (DB lỗi) không có trong bảng: nó là lỗi transport, không bao giờ là `INVALID` (SC-M03-017).
import type { LiveQrLookupResult, LiveStationContent } from './liveQrLookup';

type QrState = 'HOAT_DONG' | 'NHAP' | 'THU_HOI' | 'KHONG_CO';
type CheckpointState = 'NHAP' | 'HOAT_DONG' | 'TAM_DONG' | 'LUU_TRU';
type RouteState = 'NHAP' | 'HOAT_DONG' | 'TAM_DONG' | 'LUU_TRU' | 'KHONG_CO';

export type LiveQrLookupCase = {
  name: string;
  input: {
    /** `qrIdentifier` gửi lên đúng như người gọi lấy từ link (có thể có khoảng trắng hai đầu) */
    qrIdentifier: string;
    qr: QrState;
    checkpoint: CheckpointState;
    connectivityMode: LiveStationContent['connectivityMode'];
    /** vắng = khách tự do, không gửi routeId; `KHONG_CO` = gửi routeId không tồn tại */
    route?: RouteState;
    /** tuyến gửi lên có liệt kê điểm dừng hay không; M03 không kiểm (BR-M03-I01) */
    routeListsCheckpoint?: boolean;
  };
  /** bước của BR-M03-I02 quyết định kết quả */
  decidedAtStep: 1 | 2 | 3 | 4 | 5 | 6;
  expected: LiveQrLookupResult;
};

const QR_1 = 'Qa1b2c3d4e5f6g7h8';
const QR_2 = 'Qz9y8x7w6v5u4t3s2';
const CHECKPOINT = 'Ck1m2n3p4q5r6s7t8';

const checkpointName = { vi: 'Hang Con Moong', en: 'Con Moong Cave' };

/** Nội dung đã xuất bản của QR thứ nhất: điểm dừng dùng được khi có mạng, có âm thanh và video */
const contentQr1: LiveStationContent = {
  qrIdentifier: QR_1,
  checkpointId: CHECKPOINT,
  checkpointName,
  connectivityMode: 'ONLINE_AVAILABLE',
  objectName: { vi: 'Cây chò ngàn năm', en: 'Thousand-year chò tree' },
  localizedContent: {
    vi: { introductionText: 'Cây chò cao hơn bốn mươi mét, thân thẳng, tán rộng.' },
    en: { introductionText: 'The chò tree is over forty metres tall with a straight trunk.' },
  },
  staticImages: ['checkpoints/Ck1m2n3p4q5r6s7t8/cho-1.jpg'],
  mediaResources: [
    { type: 'AUDIO', sourceRef: 'checkpoints/Ck1m2n3p4q5r6s7t8/cho-vi.mp3', spokenLanguage: 'vi' },
    { type: 'VIDEO', sourceRef: 'checkpoints/Ck1m2n3p4q5r6s7t8/cho.mp4', spokenLanguage: 'NONE' },
  ],
};

/** QR thứ hai của cùng điểm dừng: nội dung riêng của vật đó (BR-M03-E01) */
const contentQr2: LiveStationContent = {
  qrIdentifier: QR_2,
  checkpointId: CHECKPOINT,
  checkpointName,
  connectivityMode: 'ONLINE_AVAILABLE',
  objectName: { vi: 'Bộ xương người tiền sử', en: 'Prehistoric skeleton' },
  localizedContent: {
    vi: { introductionText: 'Di cốt được tìm thấy trong lớp đất sâu của hang.' },
    en: { introductionText: 'The remains were found in a deep layer of the cave floor.' },
  },
  staticImages: ['checkpoints/Ck1m2n3p4q5r6s7t8/xuong-1.jpg', 'checkpoints/Ck1m2n3p4q5r6s7t8/xuong-2.jpg'],
  mediaResources: [{ type: 'AUDIO', sourceRef: 'checkpoints/Ck1m2n3p4q5r6s7t8/xuong-en.mp3', spokenLanguage: 'en' }],
};

/** Cùng QR thứ nhất nhưng điểm dừng cần tải trước: chỉ chữ và ảnh, không có âm thanh/video (BR-M03-I03) */
const contentOffline: LiveStationContent = { ...contentQr1, connectivityMode: 'OFFLINE_REQUIRED', mediaResources: [] };

const invalid: LiveQrLookupResult = { outcome: 'INVALID' };
const closedRoute: LiveQrLookupResult = { outcome: 'TEMPORARILY_CLOSED', closedScope: 'ROUTE' };
const closedCheckpoint: LiveQrLookupResult = { outcome: 'TEMPORARILY_CLOSED', closedScope: 'CHECKPOINT' };
const valid = (content: LiveStationContent): LiveQrLookupResult => ({ outcome: 'VALID', content });

const active = { qrIdentifier: QR_1, qr: 'HOAT_DONG', checkpoint: 'HOAT_DONG', connectivityMode: 'ONLINE_AVAILABLE' } as const;

export const LIVE_QR_LOOKUP_CASES: readonly LiveQrLookupCase[] = [
  // Bước 1: QR không tìm thấy hoặc không HOAT_DONG
  { name: 'QR không tồn tại', input: { ...active, qr: 'KHONG_CO' }, decidedAtStep: 1, expected: invalid },
  { name: 'QR còn Nháp', input: { ...active, qr: 'NHAP' }, decidedAtStep: 1, expected: invalid },
  { name: 'QR đã thu hồi', input: { ...active, qr: 'THU_HOI', route: 'HOAT_DONG' }, decidedAtStep: 1, expected: invalid },
  {
    name: 'QR đã thu hồi, điểm dừng và tuyến đều tạm đóng',
    input: { ...active, qr: 'THU_HOI', checkpoint: 'TAM_DONG', route: 'TAM_DONG' },
    decidedAtStep: 1,
    expected: invalid,
  },
  { name: 'identifier rỗng sau khi trim', input: { ...active, qrIdentifier: '   ', qr: 'KHONG_CO' }, decidedAtStep: 1, expected: invalid },
  { name: 'identifier khác hoa/thường', input: { ...active, qrIdentifier: QR_1.toLowerCase(), qr: 'KHONG_CO' }, decidedAtStep: 1, expected: invalid },

  // Bước 2: điểm dừng NHAP hoặc LUU_TRU
  { name: 'điểm dừng còn Nháp', input: { ...active, checkpoint: 'NHAP' }, decidedAtStep: 2, expected: invalid },
  { name: 'điểm dừng đã lưu trữ', input: { ...active, checkpoint: 'LUU_TRU' }, decidedAtStep: 2, expected: invalid },
  { name: 'điểm dừng đã lưu trữ, tuyến tạm đóng', input: { ...active, checkpoint: 'LUU_TRU', route: 'TAM_DONG' }, decidedAtStep: 2, expected: invalid },

  // Bước 3: có routeId, tuyến không tồn tại hoặc NHAP
  { name: 'tuyến không tồn tại', input: { ...active, route: 'KHONG_CO' }, decidedAtStep: 3, expected: invalid },
  { name: 'tuyến còn Nháp', input: { ...active, route: 'NHAP' }, decidedAtStep: 3, expected: invalid },
  { name: 'tuyến Nháp, điểm dừng tạm đóng', input: { ...active, checkpoint: 'TAM_DONG', route: 'NHAP' }, decidedAtStep: 3, expected: invalid },

  // Bước 4: có routeId, tuyến TAM_DONG hoặc LUU_TRU — kể cả khi điểm dừng vẫn hoạt động
  { name: 'tuyến tạm đóng, điểm dừng hoạt động', input: { ...active, route: 'TAM_DONG' }, decidedAtStep: 4, expected: closedRoute },
  { name: 'tuyến đã lưu trữ', input: { ...active, route: 'LUU_TRU' }, decidedAtStep: 4, expected: closedRoute },
  { name: 'tuyến tạm đóng, điểm dừng cũng tạm đóng', input: { ...active, checkpoint: 'TAM_DONG', route: 'TAM_DONG' }, decidedAtStep: 4, expected: closedRoute },

  // Bước 5: điểm dừng TAM_DONG
  { name: 'điểm dừng tạm đóng, không có tuyến', input: { ...active, checkpoint: 'TAM_DONG' }, decidedAtStep: 5, expected: closedCheckpoint },
  { name: 'điểm dừng tạm đóng, tuyến hoạt động', input: { ...active, checkpoint: 'TAM_DONG', route: 'HOAT_DONG' }, decidedAtStep: 5, expected: closedCheckpoint },

  // Bước 6: còn lại → VALID với nội dung đã xuất bản của đúng QR được quét
  { name: 'mọi thứ hoạt động, không có tuyến', input: active, decidedAtStep: 6, expected: valid(contentQr1) },
  { name: 'mọi thứ hoạt động, có tuyến', input: { ...active, route: 'HOAT_DONG', routeListsCheckpoint: true }, decidedAtStep: 6, expected: valid(contentQr1) },
  {
    name: 'tuyến đang hoạt động nhưng không liệt kê điểm dừng',
    input: { ...active, route: 'HOAT_DONG', routeListsCheckpoint: false },
    decidedAtStep: 6,
    expected: valid(contentQr1),
  },
  { name: 'identifier có khoảng trắng hai đầu', input: { ...active, qrIdentifier: `  ${QR_1}\t` }, decidedAtStep: 6, expected: valid(contentQr1) },
  { name: 'QR thứ hai của cùng điểm dừng', input: { ...active, qrIdentifier: QR_2 }, decidedAtStep: 6, expected: valid(contentQr2) },
  { name: 'điểm dừng cần tải trước', input: { ...active, connectivityMode: 'OFFLINE_REQUIRED' }, decidedAtStep: 6, expected: valid(contentOffline) },
];
