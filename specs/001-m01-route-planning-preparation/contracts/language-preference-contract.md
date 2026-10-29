# Contract — LanguagePreference (M01 → M02)

| Mục | Giá trị |
|---|---|
| Producer | M01 (FN-M01-001, FN-M01-007; FR-M01-001, 013; BR-M01-001) — **writer duy nhất** |
| Consumer | M01 (mọi màn du khách), M02 (spec-M02 §5.1 "Content inputs", BR-M02-024, FR-M02-014) |
| Tên contract | **`LanguagePreference`** (AGENTS.md §3.2; giữ nguyên tên) |
| Nguồn hình dạng | [spec-M01](../../../docs/spec/spec-M01.md) §5.3 "LanguagePreference output"; S4 LanguagePreference; DAC-M01-001 |
| Transport | giá trị dùng chung trong IndexedDB, store `languagePreference`, slot `current` (Physical §11) |
| Schema dùng chung | `src/shared/contracts/languagePreference.ts` (Zod; M01 sở hữu) |

## 1. Hình dạng

| Field path | Logical type | Presence | Constraints |
|---|---|---|---|
| `languageCode` | Enum(`vi`, `en`) | Required | Singleton hiện tại; thay giá trị không đổi trạng thái gói hay phiên |

Dòng Dexie = `{ slot: 'current', languageCode }`. `slot` là biểu diễn vật lý, không thuộc contract; hàm đọc bỏ `slot` trước khi trả.

## 2. Ghi (chỉ M01)

| Khi | Hành vi | Lỗi |
|---|---|---|
| Du khách chọn ở bước chọn ngôn ngữ (entry thường, SCR-M01-001) hoặc bấm VI/EN trên bất kỳ màn du khách nào, kể cả trang link QR của M02 | một transaction `put` slot `current`; UI và nội dung có sẵn đổi ngay; không đụng gói, context, phiên | giá trị ngoài `vi`/`en` bị từ chối, không ghi (FR-M01-001) |

Không có lần ghi tự động: vào bằng link QR khi chưa có giá trị thì dùng ngôn ngữ thiết bị để **hiển thị** nhưng không ghi (BR-M02-024; [research.md](../research.md) R-12).

## 3. Bề mặt cho M02 (`src/modules/m01/index.ts`)

| Export | Kiểu trả | Hành vi |
|---|---|---|
| `readLanguagePreference()` | `Promise<LanguagePreference \| null>` | đọc slot `current`, validate; không có hoặc không hợp lệ → `null` |
| `useLanguagePreference()` | `LanguagePreference \| null` | hook phản ứng theo thay đổi (Dexie `liveQuery`), cả giữa các tab |
| `resolveDisplayLanguage(stored, deviceLanguage)` | `'vi' \| 'en'` | `stored?.languageCode`, nếu không có: `deviceLanguage` bắt đầu bằng `vi` → `vi`, ngược lại `en` |
| `LanguageControl` | React component | control VI/EN dùng chung; khi bấm, gọi writer nội bộ của M01 |

M02 không nhận hàm ghi nào. M02 không ghi store `languagePreference` (spec-M02 §5.1: "M02 reads but never writes it").

## 4. Truy vết test

| Kiểm thử | BR / SC / DAC |
|---|---|
| Chỉ `vi`/`en` được ghi; giá trị khác bị từ chối | BR-M01-001; DAC-M01-001 |
| Entry thường chưa có giá trị → bước chọn ngôn ngữ chặn trang; entry link QR → không có bước này, hiển thị theo thiết bị, không ghi | US-M01-01 mục 1; BR-M02-024 |
| Đổi ngôn ngữ khi offline: UI đổi; gói, context không đổi | US-M01-01 mục 2; SF-M01-001-03 |
| Đổi ở tab A, tab B thấy ngay | FR-M01-001 ("update … immediately") |
| `LanguageControl` trên trang M02 ghi qua M01; M02 không có đường ghi | BR-M01-001; SF-M01-001-04 |
