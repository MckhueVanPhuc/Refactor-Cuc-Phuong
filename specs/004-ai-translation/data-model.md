# Data Model: AI Integration — Dịch theo yêu cầu cho editor M03

**Feature**: [spec.md](spec.md) | **Date**: 2026-11-03

## 1. Không có dữ liệu bền vững mới

spec-AI §6 và BR-AI-12: không entity canonical, bảng, cột, migration, bucket hay dữ liệu trình duyệt mới. `data/01…06` không đổi. Bản dịch chỉ đi vào form đang mở; được lưu khi admin bấm "Lưu bản nháp", như chữ admin tự gõ, vào đúng các trường song ngữ đã có của `Revision` (spec-M03 §6.3).

## 2. Contract transport

Định nghĩa logic: spec-AI §5.2. Hình dạng wire: [contracts/translate-contract.md](contracts/translate-contract.md).

### TranslationRequest

| Trường | Kiểu | Bắt buộc | Ràng buộc | Nguồn |
|---|---|---|---|---|
| `sourceLanguage` | `"vi"` | Có | Chỉ `vi` | spec-AI §5.2 |
| `targetLanguage` | `"en"` | Có | Chỉ `en` | spec-AI §5.2 |
| `text` | string | Có | Sau khi trim không rỗng; client: ≤ giới hạn của trường (spec-M03 §5.3); server: ≤ 2000 code point (R-04) | spec-AI §5.2, BR-AI-01 |
| `lineBreaks` | `"ALLOWED"` \| `"NOT_ALLOWED"` | Có | `NOT_ALLOWED` cho trường một dòng | spec-AI §5.2, BR-AI-11 |

Client gửi `text` là giá trị ô tiếng Việt **đã trim**. Không gửi tên trường, id, tài khoản hay dữ liệu khác (BR-AI-10).

### TranslationResult

| Trường | Kiểu | Bắt buộc | Ràng buộc | Nguồn |
|---|---|---|---|---|
| `translatedText` | string | Có | Không rỗng; chữ thuần; không xuống dòng khi `NOT_ALLOWED`; không cắt theo giới hạn trường | spec-AI §5.2, BR-AI-06, BR-AI-11 |

### Tín hiệu lỗi

Không phải `TranslationResult`. Mọi lỗi (mạng, quá thời gian, 401/403/400/405/502) gộp thành một kết quả `failed` ở client (R-05).

## 3. Trạng thái tạm thời của một trường (UI state, không lưu)

Kiểu ở client: `TranslationOutcome = { ok: true; text: string } | { ok: false }`.

| Trạng thái | Hiển thị | Nút "→" | Vào trạng thái khi | Rời trạng thái khi |
|---|---|---|---|---|
| `idle` | Không gì | Bấm được nếu ô tiếng Việt có chữ (sau trim) và form sửa được | Mặc định; kết quả bị bỏ; thông báo lỗi bị xóa | Bấm "→" |
| `translating` | MSG-AI-TRANSLATING | Không bấm được | Bấm "→" hoặc "Thử lại" | Có kết quả hoặc lỗi |
| `failed` | MSG-AI-FAILED + "Thử lại" | Bấm được (như `idle`) | Lỗi về khi nguồn chưa đổi và admin chưa gõ ô tiếng Anh | Bấm "Thử lại" / "→" (→ `translating`); gõ ô tiếng Anh (→ `idle`) |

Ref kèm theo một lượt dịch: `sentSource` (text đã gửi), `typedSinceRequest` (admin đã gõ ô tiếng Anh từ lúc bấm). Kết quả chỉ được ghi khi `sentSource === trim(ô tiếng Việt hiện tại)` và `typedSinceRequest === false` (BR-AI-04); ngược lại bỏ và về `idle`.

Không có trạng thái "đã dịch" hay dấu "máy dịch" (BR-AI-12): sau khi ghi, ô tiếng Anh như chữ admin tự gõ.

## 4. Trường trong phạm vi và `lineBreaks`

| Editor | Trường (`fieldKey` gốc) | Giới hạn (spec-M03 §5.3) | `lineBreaks` |
|---|---|---|---|
| Tuyến | `name` | 100 | NOT_ALLOWED |
| Tuyến | `shortDescription` | 160 | NOT_ALLOWED |
| Tuyến | `description` | 2000 | ALLOWED |
| Tuyến | `startingPoint` | 500 | ALLOWED |
| Tuyến | `participationRequirements` | 300 | ALLOWED |
| Tuyến | `preparation` | 500 | ALLOWED |
| Tuyến | `bestTime` | 200 | ALLOWED |
| Tuyến | `safetyWarning` | 500 | ALLOWED |
| Tuyến | `highlights.{i}` | 80 | NOT_ALLOWED |
| Tuyến | `galleryCaption.{i}` | 200 | NOT_ALLOWED |
| Tuyến | `routeMapCaption` | 200 | NOT_ALLOWED |
| Điểm dừng | `checkpointName` | 100 | NOT_ALLOWED |
| Điểm tham quan | `objectName` | 100 | NOT_ALLOWED |
| Điểm tham quan | `introductionText` | 2000 (tối thiểu 30) | ALLOWED |

`lineBreaks` suy từ `multiline` của `BilingualField` (R-08): ô một dòng → `NOT_ALLOWED`.
