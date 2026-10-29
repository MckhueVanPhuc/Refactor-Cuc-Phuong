# Contract — SessionSyncRecord intake (M02 → M03, lưu thành SessionRecord)

| Mục | Giá trị |
|---|---|
| Producer | M02 (spec-M02 §5.1; hàng đợi `PendingSyncItem`) |
| Consumer | M03 (FN-M03-010; FR-M03-014; BR-M03-J01…J04), nơi lưu canonical `SessionRecord` |
| Tên | **`SessionSyncRecord`** (transport contract) → **`SessionRecord`** (canonical entity M03). Hai khái niệm tách biệt, không hợp nhất (AGENTS.md §5; constitution II) |
| Nguồn hình dạng | [spec-M03](../../../docs/spec/spec-M03.md) §5.1 "SessionSyncRecord input"; §5.2.J; [Physical Schema](../../../data/06-physical-schema.md) §5.9, §7.2 |
| Transport | HTTPS POST tới Edge Function `session-intake` (Deno). Edge validate rồi gọi `api.ingest_session(p_record jsonb)`, function chỉ `service_role` được chạy. Không có RPC ghi terminal mở cho `anon` (tech-stack §5) |
| Schema dùng chung | `src/shared/contracts/sessionSyncRecord.ts` (Zod `.strict()`); Edge import cùng schema |

## 1. Request

Body JSON là đúng một `SessionSyncRecord`:

| Field | Kiểu | Presence | Ràng buộc |
|---|---|---|---|
| `sessionId` | UUID | Required | duy nhất toàn hệ thống |
| `routeId` | String | Required | phải là tuyến M03 biết |
| `contentVersion` | Integer | Required | phải là version snapshot đã xuất bản của `routeId` |
| `startedAt` | DateTime UTC | Required | |
| `endedAt` | DateTime UTC | Required | `endedAt >= startedAt` |
| `status` | Enum(`HOAN_TAT`, `BO_DO`) | Required | chỉ trạng thái terminal |
| `visitedCheckpoints[]` | Array | Required (có thể rỗng) | `checkpointId` duy nhất trong phiên |
| `…[].checkpointId` | String | Required | thuộc snapshot `(routeId, contentVersion)` |
| `…[].checkpointName` | String | Required | bằng `checkpointName.vi` của snapshot |
| `…[].sequence` | Integer | Required | bằng `sequence` của snapshot |
| `…[].checkedInAt` | DateTime UTC | Required | nằm trong `[startedAt, endedAt]` |

**Allowlist:** mọi khóa khác bị từ chối, ở cả cấp gốc và cấp phần tử. Không có tên, tài khoản, định danh thiết bị hay GPS (BR-M03-J01; constitution V). Body vượt 64 KiB bị từ chối trước khi parse ([research.md](../research.md) R-25; đây là trần kỹ thuật).

## 2. Xử lý (theo thứ tự)

1. **Edge:** từ chối method ≠ POST; từ chối body quá cỡ; parse JSON; chạy Zod strict. Hỏng → `INVALID`.
2. **`api.ingest_session` (một transaction):** kiểm tra lại allowlist và `endedAt >= startedAt`, visit duy nhất, `checkedInAt` trong khoảng; tuyến đã biết; `(route_id, content_version)` là một snapshot tồn tại, **bất kể trạng thái hiện tại của tuyến** (BR-M03-J04); mỗi visit khớp snapshot theo `checkpointId`, `checkpointName` (vi) và `sequence` (BR-M03-J02, SC-M03-038).
3. Chưa có `session_id` → chèn một lần, `ingested_at = now()` → `ACCEPTED`.
4. Đã có `session_id` → so sánh payload đã chuẩn hóa: bỏ qua thứ tự khóa JSON; so timestamp như thời điểm UTC; so `visitedCheckpoints` như tập theo khóa `checkpointId` (BR-M03-J03; Physical §14 O-3). Bằng nhau → `IDENTICAL`, không ghi. Khác → `CONFLICT`, không ghi, bản ghi đầu được giữ.
5. Không hợp lệ ở bất kỳ bước nào → `INVALID`, không lưu gì.

Intake không ghi audit: đây không phải thao tác quản trị (BR-M03-F08 nói về "administrative action"), và hệ thống không lưu gì từ bản ghi bị từ chối.

## 3. Response

| HTTP | Body `result` | Ý nghĩa với M02 (spec-M02 §6.4) |
|---|---|---|
| 200 | `ACCEPTED` | `syncStatus → SYNCED` |
| 200 | `IDENTICAL` | `syncStatus → SYNCED` (retry giống hệt là idempotent) |
| 409 | `CONFLICT` | `syncStatus → CONFLICT`, dừng tự gửi lại |
| 422 | `INVALID` | `syncStatus → CONFLICT` (spec-M02: bản ghi không hợp lệ cũng dừng retry) |
| 413 | `INVALID` | như trên (quá cỡ) |
| 5xx / mạng lỗi | — | giữ `PENDING`, retry khi app mở hoặc resume |

Body: `{ "result": "ACCEPTED" | "IDENTICAL" | "CONFLICT" | "INVALID" }`. Không trả chi tiết lỗi kỹ thuật hay dữ liệu đã lưu. Mã HTTP là quyết định của plan cho transport và không đổi ý nghĩa của các kết quả trong spec. Nếu spec-M02 cần tín hiệu khác, spec-M02 thắng; khi đó cập nhật file này.

## 4. Lưu trữ

`SessionRecord` = các trường nghiệp vụ được chấp nhận + `ingestedAt` (data-model §2.9). Append-only, không update, không xóa, không purge (DEC-S6-002). Phần tử trong `visited_checkpoints` là giá trị lịch sử, không phải FK tới điểm dừng live.

## 5. Lỗi và giới hạn đã chấp nhận

- Một bản ghi giả nhưng đúng định dạng có thể vào báo cáo; MVP chấp nhận rủi ro này (spec-M03 §9).
- Phiên không bao giờ được gửi thì không có trong báo cáo (BR-M03-J05: chỉ phiên đã đồng bộ).
- Snapshot luôn được giữ (BR-M03-G08), nên một phiên của version cũ vẫn kiểm tra được (checklist CHK024).

## 6. Versioning

Hình dạng không đổi kể từ v2.0; chỉ phần kiểm tra lúc nhận là tăng thêm (spec-M03 §5.1). Đổi trường cần đổi spec-M02 và spec-M03 trước.

## 7. Truy vết test

| Kiểm thử | BR / SC |
|---|---|
| Chấp nhận lần đầu; retry giống hệt → `IDENTICAL`, không có dòng thứ hai; đổi thứ tự visits hoặc khóa vẫn `IDENTICAL` | SC-M03-007, BR-M03-J03 |
| Cùng `sessionId`, khác nội dung → `CONFLICT`, bản ghi đầu nguyên vẹn | SC-M03-007 |
| `routeId` không tồn tại; version chưa có; visit không khớp tên/sequence/id → `INVALID`, không lưu | SC-M03-038, BR-M03-J02 |
| Tuyến `TAM_DONG`/`LUU_TRU` vẫn nhận | BR-M03-J04 |
| Khóa lạ (ví dụ `deviceId`) → `INVALID` | BR-M03-J01 |
| `status = DANG_DIEN_RA` → `INVALID` | BR-M03-J01 |
| `anon` gọi thẳng `api.ingest_session` bị từ chối (grant) | constitution V |
