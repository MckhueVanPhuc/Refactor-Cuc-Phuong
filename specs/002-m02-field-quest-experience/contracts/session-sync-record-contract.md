# Contract — SessionSyncRecord (M02 → M03)

| Mục | Giá trị |
|---|---|
| Producer | M02 (FN-M02-006, 007; FR-M02-018, 024; BR-M02-010, 011) |
| Consumer | M03 (plan đã duyệt: [session-intake-contract.md](../../003-m03-operations-content-administration/contracts/session-intake-contract.md)); M03 lưu thành canonical **`SessionRecord`** |
| Tên | **`SessionSyncRecord`** — transport contract. Không hợp nhất với `SessionRecord` (AGENTS.md §3.2, §5; constitution II) |
| Nguồn hình dạng | [spec-M02](../../../docs/spec/spec-M02.md) §5.1 "SessionSyncRecord output" = spec-M03 §5.1 "SessionSyncRecord input"; S4 PendingSyncItem.record; DAC-M02-007…010 |
| Transport | POST tới Edge Function `session-intake` qua `supabase.functions.invoke` (Physical §7.2; tech-stack §5) |
| Schema dùng chung | `src/shared/contracts/sessionSyncRecord.ts` (Zod `.strict()`) — **đồng sở hữu** M02/M03 ([research.md](../research.md) R-04, §5 L-01) |

## 1. Hình dạng

| Field path | Logical type | Presence | Constraints |
|---|---|---|---|
| `sessionId` | UUID | Required | duy nhất toàn cục; định danh bất biến |
| `routeId` | String | Required | tuyến đóng băng trong phiên |
| `contentVersion` | Integer | Required | version journey đóng băng |
| `startedAt` | DateTime | Required | UTC |
| `endedAt` | DateTime | Required | UTC; không sớm hơn `startedAt` |
| `status` | Enum(`HOAN_TAT`, `BO_DO`) | Required | chỉ terminal |
| `visitedCheckpoints` | Array&lt;Object&gt; | Required | có thể rỗng khi bỏ dở; `checkpointId` duy nhất |
| `visitedCheckpoints[].checkpointId` | String | Required | checkpoint của journey đóng băng |
| `visitedCheckpoints[].checkpointName` | String | Required | nhánh `vi` của tên đóng băng, dạng chuỗi |
| `visitedCheckpoints[].sequence` | Integer | Required | `sequence` đóng băng |
| `visitedCheckpoints[].checkedInAt` | DateTime | Required | UTC; trong khoảng phiên |

Không có trường nào khác (schema strict, cả cấp gốc lẫn phần tử): không tên, tài khoản, định danh thiết bị, GPS (SC-M02-007; M03 BR-M03-J01).

## 2. Dựng bản ghi (chỉ M02)

Trong **cùng transaction** chuyển phiên sang terminal ([data-model.md](../data-model.md) §3):

| Field | Lấy từ |
|---|---|
| `sessionId`, `routeId`, `contentVersion`, `startedAt`, `status` | `PlaySession` |
| `endedAt` | xác nhận/thay phiên: `max(now, checkedInAt mới nhất, startedAt)`; tự đóng: `checkedInAt` mới nhất hoặc `startedAt` (BR-M02-022; [research.md](../research.md) R-10) |
| `visitedCheckpoints[]` | mọi `CheckpointVisit` của phiên, nối `journeyCheckpoints` theo `checkpointId` để lấy `checkpointName.vi` và `sequence`; sắp theo `sequence` |

Validate bằng schema strict rồi ghi `PendingSyncItem { sessionId, record, syncStatus: 'PENDING' }`. Sau đó `record` không bao giờ được ghi lại (BR-M02-010). Vì mọi lượt ghé thuộc journey đóng băng (sao từ snapshot), giá trị luôn khớp kiểm tra snapshot của M03 (spec-M02 §5.1).

## 3. Gửi

| Mục | Quy tắc | Nguồn |
|---|---|---|
| Khi nào | shell khởi động; trang hiện lại; sự kiện `online`; ngay sau commit terminal; thử lại 30 s → 1 → 2 → 5 phút khi trang đang hiện | FR-M02-018; [research.md](../research.md) R-11 |
| Một người gửi | Web Lock `cpq:m02:sync` (exclusive, `ifAvailable`); gửi tuần tự các mục `PENDING` | R-11 |
| Timeout | `SYNC_REQUEST_TIMEOUT_SECONDS` = 30 — hằng kỹ thuật, không phải business rule | R-11 |
| Không gửi | phiên `DANG_DIEN_RA`; mục `SYNCED` hoặc `CONFLICT`; sau khi đóng trình duyệt | US-M02-06; constitution VI |

## 4. Ánh xạ response → `syncStatus`

| Response của M03 (session-intake §3) | `syncStatus` | Nguồn |
|---|---|---|
| `{ result: ACCEPTED }` hoặc `{ result: IDENTICAL }` | `SYNCED` | SC-M02-006 |
| `{ result: CONFLICT }` (409) | `CONFLICT`, dừng tự gửi | BR-M02-011 |
| `{ result: INVALID }` (422, 413) | `CONFLICT`, dừng tự gửi | US-M02-06 mục 5 |
| Mạng lỗi, timeout, 5xx, 429, 4xx khác, body không đọc được | giữ `PENDING` | spec-M02 §6.4; §5 L-02 của research |

Không có thao tác nào của du khách để thử lại, sửa hay xóa mục `CONFLICT`; UI chỉ hiện trạng thái (BR-M02-011; SCR-M02-003; E-SCR-M02-001-22).

## 5. Truy vết test

| Kiểm thử | FR / BR / SC / DAC |
|---|---|
| Phiên đang chạy không bao giờ tạo bản ghi | US-M02-06 mục 1 |
| Bản ghi có đúng 6 trường gốc + 4 trường mỗi lượt ghé; `checkpointName` là chuỗi `vi` | DAC-M02-008, 009; SC-M02-007 |
| Gửi lại sau `ACCEPTED` (giả lập mất response) → `IDENTICAL` → `SYNCED`, một bản ghi | SC-M02-006 |
| 409 hoặc 422 → `CONFLICT`, không gửi lại sau đó | BR-M02-011; DAC-M02-010 |
| 503, timeout, offline → `PENDING`, gửi lại khi trang hiện lại | FR-M02-018 |
| Hai tab mở cùng lúc → mỗi mục chỉ được gửi bởi một tab tại một thời điểm | R-11 |
| Đồng hồ lùi giữa chuyến → `endedAt ≥ checkedInAt ≥ startedAt` | R-10; DAC-M02-008, 009 |
| `record` giữ nguyên byte-by-byte sau mọi thay đổi `syncStatus` | BR-M02-010; DAC-M02-007 |
