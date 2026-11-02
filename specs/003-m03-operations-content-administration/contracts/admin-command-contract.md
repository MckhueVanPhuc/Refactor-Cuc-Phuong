# Contract — Command và query quản trị (M03 UI ↔ M03 backend)

| Mục | Giá trị |
|---|---|
| Producer | Backend M03: function `SECURITY DEFINER` trong schema `api` (Physical §7.3, PT-07) |
| Consumer | Frontend M03 (`src/modules/m03/api/`); không module nào khác gọi |
| Loại | Contract nội bộ M03, không phải contract cross-module. Hai shape logic `ValidationIssue` và `PublicationReview` lấy nguyên từ spec-M03 §5.1 "Administrative contracts (logical)" |
| Transport | `supabase.rpc(name, args)` với JWT của người đăng nhập; mỗi command chạy trong một transaction (Physical §7.3, §8) |
| Phân quyền | trong function: `app.current_admin()` phải trả tài khoản `ACTIVE` với phiên còn sống ([research.md](../research.md) R-15); role theo bảng §7. Ẩn nút trên UI chỉ là tiện ích (constitution V) |
| Trạng thái tên | Tên function `api.*` dưới đây là **đề xuất** (Physical §7.3: "Names are proposals"). Migration bước 3 chốt tên; adapter giữ bảng ánh xạ một chỗ |

## 1. Quy ước chung

- Input/output là JSON camelCase; adapter ánh xạ sang tham số `p_*` snake_case.
- Mọi command ghi nhận `expectedConcurrencyRevision` của từng bản ghi nó sửa (BR-M03-F06; DAC-M03-016). Thao tác tạo mới (lần lưu đầu) không có giá trị này.
- Mọi command ghi **đúng một** dòng audit, kể cả khi thất bại ([research.md](../research.md) R-07; BR-M03-F08). Query không ghi audit.
- Lý do và ghi chú: không rỗng sau khi trim, ≤ `NOTE_MAX_CHARS` (provisional).
- Identifier không bao giờ là input của thao tác tạo (BR-M03-B01). Thao tác sửa nhận id của bản ghi đã có.
- Thời gian luôn ở UTC; UI hiển thị theo `Asia/Ho_Chi_Minh`.

## 2. `CommandResult` (plan decision R-06)

```text
CommandResult<T> =
  | { ok: true,  messageKey: MessageKey, data: T }
  | { ok: false, reason: 'VALIDATION', messageKey: MessageKey, issues: ValidationIssue[] }
  | { ok: false, reason: 'STALE',      messageKey: 'MSG-STALE', stale: { editorEmail: string, editedAt: DateTime } }
  | { ok: false, reason: 'BUSY',       messageKey: 'MSG-ROUTE-BUSY', busy: { itemName: string } }
  | { ok: false, reason: 'FORBIDDEN',  messageKey: 'MSG-NO-PERMISSION' }
  | { ok: false, reason: 'BLOCKED',    messageKey: MessageKey, values: Record<string, string|number>, issues?: ValidationIssue[] }
  | { ok: false, reason: 'FAILED',     messageKey: 'MSG-PUBLISH-FAILED' | 'MSG-CLOSE-FAILED' | 'MSG-GENERIC' }
```

- `BLOCKED` dùng cho chặn nghiệp vụ không gắn trường, ví dụ MSG-LAST-QR, MSG-LAST-REVIEWER, MSG-CHECKPOINT-IN-USE, MSG-DRAFT-EXISTS, MSG-REOPEN-BLOCKED, MSG-OFFLINE-TOO-BIG, MSG-ROUTE-LAST-CHECKPOINT.
- `values` chỉ chứa giá trị hiển thị thường (tên như trên UI, số kèm đơn vị, hh:mm, dd/mm/yyyy), không bao giờ là id hay mã (BR-M03-L10, L13).
- Lỗi transport do adapter tạo ra, không có trong union: MSG-NETWORK-FAILED, MSG-SESSION-EXPIRED, MSG-GENERIC.

## 3. `ValidationIssue` (spec-M03 §5.1; BR-M03-L08)

| Field | Kiểu | Presence | Ghi chú |
|---|---|---|---|
| `severity` | Enum(`BLOCKS_SAVE`, `BLOCKS_PUBLISH`) | Required | `BLOCKS_SAVE` chỉ cho giá trị sai rõ ràng (BR-M03-L01) |
| `fieldLabel` | String | Required | nhãn tiếng Việt trên editor, không phải tên trường nội bộ |
| `message` | String | Required | câu từ danh mục §5.6 đã điền placeholder |
| `messageKey` | String | Required | khóa danh mục; không hiển thị |
| `targetItemType` | Enum(`ROUTE`, `CHECKPOINT`, `QRCODE`) | Required | |
| `targetItemId` | String | Required | không hiển thị |
| `targetFieldKey` | String | Required | chỉ để focus trường; không hiển thị |

Cùng một hàm tạo issue chạy ở client (panel, phản hồi ngay) và ở server (chuẩn); server thắng ([research.md](../research.md) R-19, R-26).

## 4. `PublicationReview` (spec-M03 §5.1; BR-M03-F02)

Trả về bởi `open_publication_review`. Các field: `unitType` (`ROUTE_FIRST_PUBLICATION` | `ROUTE_INFORMATION` | `CHECKPOINT_FIRST_PUBLICATION` | `CHECKPOINT_REVISION` | `QR_OBJECT`), `blockingIssues: ValidationIssue[]`, `changes[] {fieldLabel, before, after}`, `sensitiveChanges[]` (cảnh báo an toàn, yêu cầu tham gia, tick sơ đồ offline — BR-M03-C10), `affectedRoutes[] {routeId, routeName, routeStatus, createsNewJourneyVersion, estimatedOfflineSizeBytes, closesAutomatically}`, `leftOutCheckpoints[]`, `leftOutQrObjects[]`, `impactNotes[]`, `noSafetyWarningConfirmationRequired`, `reviewedConcurrencyRevision`. Ý nghĩa và presence: đúng như spec-M03 §5.1; file này không định nghĩa lại.

Tính trên **dữ liệu đã lưu** (BR-M03-D04). `affectedRoutes` = các tuyến `HOAT_DONG`/`TAM_DONG` có danh sách đã xuất bản chứa điểm dừng (BR-M03-X02, X03); với `CHECKPOINT_FIRST_PUBLICATION` thì rỗng. `createsNewJourneyVersion` và `estimatedOfflineSizeBytes` lấy từ snapshot ứng viên dựng thử trong một transaction chỉ đọc ([research.md](../research.md) R-10). `impactNotes` dùng từ vựng §5.4 ("gói tải trước của du khách cần cập nhật"), không bao giờ dùng "snapshot" hay "journey version".

## 5. Command

Cột "Roles": **B** = cả hai role (BR-M03-A02); **R** = chỉ `REVIEWER` (BR-M03-A03). Cột "Khóa tập": **có** = lấy advisory lock trên tập kết nối ([research.md](../research.md) R-08).

| ID | Command (logic) | RPC đề xuất | Roles | Input chính | Kết quả thành công | Từ chối thường gặp | Khóa tập | BR / FR |
|---|---|---|---|---|---|---|---|---|
| C-01 | Lưu nháp tuyến | `api.save_route_draft` | B | `routeId?`, `expectedConcurrencyRevision?` (route + revision), `content` (Route content S4) | `MSG-SAVED`; `routeId`, revision mới; lần đầu tạo Route `NHAP` | VALIDATION (L01: số, độ dài, tag mâu thuẫn MSG-TAG-CONFLICT, trùng điểm dừng MSG-CHECKPOINT-DUPLICATE, vượt MSG-LIMIT-CHECKPOINTS); STALE | không | C02, C03, C09, C12, C16, T01, T03, T09, F06, F11; FR-M03-001 |
| C-02 | Lưu nháp điểm dừng | `api.save_checkpoint_draft` | B | `checkpointId?`, expected revisions, `content` (Checkpoint content), `locationNote?` | `MSG-SAVED`; lần đầu tạo Checkpoint `NHAP` | VALIDATION (MSG-CHECKPOINT-NAME-TAKEN, MSG-MODE-HAS-AV, MSG-ONLINE-NOT-VERIFIED); STALE | khóa tên (O-1) | D01–D03, D11, F11; FR-M03-002 |
| C-03 | Lưu nháp điểm tham quan | `api.save_visit_point_draft` | B | `checkpointId`, `qrIdentifier?`, expected revisions, `content` (QR content), `installationLabel?`, `mediaSettings[] {mediaId, usageRightsConfirmed, spokenLanguage?}` | `MSG-SAVED`, lần đầu thêm `MSG-QR-CREATED`; lần đầu tạo QRCode `NHAP` + `qrIdentifier` + revision 1 cùng lúc | VALIDATION (độ dài, số ảnh/AV MSG-COUNT-IMAGES/MSG-COUNT-AV, MSG-AV-OFFLINE); BLOCKED MSG-MODE-REQUIRED-FIRST, MSG-LIMIT-QR; STALE | không | E02–E04, E14–E17, F11, B02, B03; FR-M03-003, 004 |
| C-04 | Đăng ký media đã tải | `api.register_media` | B | `ownerType`, `ownerId`, `usage`, `type`, `objectPath`, `spokenLanguage?` | `data.mediaId`, `sourceRef` | VALIDATION MSG-FILE-TOO-BIG, MSG-FILE-TYPE; FAILED nếu object không tồn tại | không | C14, E04, E14; [media-storage-contract.md](media-storage-contract.md) |
| C-05 | Xuất bản một đơn vị | `api.publish_unit` | B | `unitType`, `subjectId`, `reviewedConcurrencyRevision`, `noSafetyWarningConfirmed?` | `MSG-PUBLISHED`; revision → `PHAT_HANH`, bản cũ → `LUU_TRU`; trạng thái thực thể; snapshot cho mọi tuyến bị ảnh hưởng; audit có `selfPublished` | VALIDATION (guard); STALE (review mở lại); BUSY; BLOCKED MSG-OFFLINE-TOO-BIG, MSG-ROUTE-LAST-CHECKPOINT, MSG-SAFETY-CONFIRM, MSG-RIGHTS-NOT-CONFIRMED, MSG-AV-LANGUAGE-MISSING, MSG-IMAGE-NOT-READABLE; FAILED MSG-PUBLISH-FAILED | có | F01–F05, C04, C17, D04, D05, E05, E06, E13, G01–G07, G10, T04–T06, X02; FR-M03-006, 008, 009 |
| C-06 | Bỏ thay đổi (bỏ bản nháp chờ) | `api.discard_draft` | B | `subjectType`, `subjectId`, expected | revision → `DA_BO` | STALE | không | F10; FR-M03-007 |
| C-07 | Hủy mục chưa từng xuất bản | `api.discard_unpublished` | B | `subjectType` ∈ ROUTE/CHECKPOINT/QRCODE, `subjectId`, `reason` (bắt buộc với tuyến và điểm dừng; tùy chọn với QR), expected | tuyến/điểm dừng → `LUU_TRU` (QR `NHAP` của điểm dừng → `THU_HOI`); QR → `THU_HOI` | BLOCKED nếu đã từng xuất bản; STALE | không | C01, D09, E10 |
| C-08 | Khôi phục bản đã xuất bản trước đó | `api.restore_revision` | B | `subjectType`, `subjectId`, `revisionNumber` | revision `NHAP` mới, `basedOnRevisionNumber` = bản được khôi phục | BLOCKED MSG-DRAFT-EXISTS; BLOCKED MSG-RESTORE-BLOCKED (nội dung bản cũ vi phạm giới hạn hiện hành; `values` là danh sách chỗ cần sửa, không tạo gì); STALE | không | F07; FR-M03-007 |
| C-09 | Đóng tạm tuyến | `api.close_route` | B | `routeId`, `reason`, expected | `TAM_DONG`, `closureSource = MANUAL`; không có version mới | BLOCKED nếu không `HOAT_DONG`; BUSY; STALE | có | H01, H03 |
| C-10 | Đóng tạm điểm dừng | `api.close_checkpoint` | B | `checkpointId`, `reason`, expected | `TAM_DONG`; snapshot thay thế cho mọi tuyến liệt kê; tuyến nào hết điểm dừng hoạt động → `TAM_DONG` với `AUTO_NO_ACTIVE_CHECKPOINT` | BUSY; STALE; FAILED MSG-CLOSE-FAILED (kèm hành động C-11). Không bao giờ bị trần offline chặn | có | H01, H02, H04, H05, T05, X02, G10 |
| C-11 | Đóng tạm các tuyến liên quan (khi C-10 lỗi) | `api.close_routes_listing_checkpoint` | B | `checkpointId`, `reason` | mọi tuyến `HOAT_DONG` liệt kê điểm dừng → `TAM_DONG` `MANUAL`; điểm dừng vẫn hoạt động; một dòng audit trên điểm dừng nêu tên các tuyến (BR-M03-X06) | BUSY | có | H04 |
| C-12 | Mở lại tuyến | `api.reopen_route` | R | `routeId`, `safetyNote`, expected | `HOAT_DONG` | BLOCKED MSG-REOPEN-BLOCKED (kèm danh sách cần sửa), MSG-NO-ACTIVE-CHECKPOINT; FORBIDDEN; BUSY | có | H07 |
| C-13 | Mở lại điểm dừng | `api.reopen_checkpoint` | R | `checkpointId`, `safetyNote`, expected | `HOAT_DONG`; snapshot mới cho mọi tuyến liệt kê; tuyến đã tự đóng **không** mở lại | BLOCKED MSG-REOPEN-BLOCKED, MSG-OFFLINE-TOO-BIG; FORBIDDEN; BUSY; FAILED | có | H06, H07, G10, X02 |
| C-14 | Lưu trữ tuyến | `api.archive_route` | R | `routeId`, `reason`, expected | `LUU_TRU` (terminal) | BLOCKED nếu không `TAM_DONG`; FORBIDDEN | có | H09, T07 |
| C-15 | Lưu trữ điểm dừng | `api.archive_checkpoint` | R | `checkpointId`, `reason`, expected | `LUU_TRU`; QR → `THU_HOI`; không có version mới | BLOCKED MSG-CHECKPOINT-IN-USE (nêu tên tuyến), không `TAM_DONG`; FORBIDDEN | có | D10, G05 |
| C-16 | Thu hồi mã QR | `api.revoke_visit_point` | B | `qrIdentifier`, `reason`, expected | `THU_HOI`; snapshot mới cho mọi tuyến liệt kê điểm dừng; không bị trần chặn | BLOCKED MSG-LAST-QR; BUSY; FAILED | có | E09, E11, X02, G10 |
| C-17 | Ghi nhận in lại | `api.record_reprint` | B | `qrIdentifier` | chỉ một dòng audit; identifier và nội dung không đổi | — | không | E07 |
| C-18 | Đổi role tài khoản | `api.change_account_role` | R | `email`, `role`, expected | role mới | BLOCKED MSG-LAST-REVIEWER; STALE | khóa bảng (Physical §8) | K03; [auth-account-contract.md](auth-account-contract.md) |
| C-19 | Khóa / mở khóa tài khoản | `api.set_account_status` | R | `email`, `status` ∈ `ACTIVE`/`DEACTIVATED`, expected | status mới | BLOCKED MSG-LAST-REVIEWER; STALE | khóa bảng | K03 |

Mời, gửi lại lời mời và nối danh tính đi qua Edge `admin-accounts` ([auth-account-contract.md](auth-account-contract.md)), không đi qua RPC từ trình duyệt.

**Giá trị `audit_records.action`** (văn bản tự do, Physical §5.8; UI hiện qua bảng tên hiển thị): `ROUTE_DRAFT_SAVED`, `CHECKPOINT_DRAFT_SAVED`, `VISIT_POINT_DRAFT_SAVED`, `MEDIA_REGISTERED`, `PUBLISHED`, `DRAFT_DISCARDED`, `ITEM_DISCARDED`, `REVISION_RESTORED`, `ROUTE_CLOSED`, `ROUTE_AUTO_CLOSED`, `CHECKPOINT_CLOSED`, `RELATED_ROUTES_CLOSED`, `ROUTE_REOPENED`, `CHECKPOINT_REOPENED`, `ROUTE_ARCHIVED`, `CHECKPOINT_ARCHIVED`, `QR_REVOKED`, `QR_REPRINTED`, `ACCOUNT_INVITED`, `ACCOUNT_INVITE_RESENT`, `ACCOUNT_LINKED`, `ACCOUNT_ROLE_CHANGED`, `ACCOUNT_STATUS_CHANGED`, `INITIAL_REVIEWER_PROVISIONED`. Tự đóng tuyến có dòng audit riêng cho từng tuyến (BR-M03-H02 "with an audit line"). Đây là kết quả kèm theo, không phải thao tác thứ hai của người dùng.

## 6. Query

| ID | Query | RPC/View đề xuất | Roles | Trả về | BR / FR / SCR |
|---|---|---|---|---|---|
| Q-01 | Thông tin người đăng nhập | `api.get_current_admin` | mọi authenticated | `{ email, role, status }` của chính mình, hoặc rỗng | A04, K05; SCR-M03-000 |
| Q-02 | Danh sách tuyến | `api.list_routes` | B | mỗi dòng: tên vi (bản nháp nếu có, ngược lại bản xuất bản), trạng thái, có bản nháp chờ, lần sửa cuối; tìm/lọc | SCR-M03-001 |
| Q-03 | Mở editor tuyến | `api.get_route_editor` | B | state tuyến, revision nháp/xuất bản, media của tuyến (kèm cờ đã xác nhận quyền), `concurrencyRevision`, issue đã lưu | SCR-M03-002 |
| Q-04 | Điểm dừng chọn được cho tuyến | `api.list_selectable_checkpoints` | B | chỉ `HOAT_DONG`: tên, mode, số điểm tham quan, các tuyến khác đang liệt kê | T01; SCR-M03-002 bước 4 |
| Q-05 | Thư viện điểm dừng | `api.list_checkpoints` | B | trạng thái, mode, số điểm tham quan, tuyến đang dùng, Sẵn sàng/Chưa đủ | D, SF-M03-002-11; SCR-M03-008 |
| Q-06 | Mở editor điểm dừng | `api.get_checkpoint_editor` | B | revision, ghi chú vị trí, danh sách điểm tham quan (tên hoặc "chưa đặt tên {số}", trạng thái, readiness, 6 ký tự cuối) | E16; SCR-M03-008 |
| Q-07 | Mở editor điểm tham quan | `api.get_visit_point_editor` | B | revision nháp/xuất bản, media, readiness, mode của điểm dừng, `qrIdentifier` (để dựng link và ảnh in; UI chỉ hiện 6 ký tự cuối) | E15–E17, B02; SCR-M03-003 |
| Q-08 | Mở màn review | `api.open_publication_review` | B | `PublicationReview` (§4) | F02; SCR-M03-004 |
| Q-09 | Tác động khi đóng/mở lại | `api.get_operation_impact` | B (mở lại: R) | các tuyến bị ảnh hưởng, tuyến sẽ tự đóng, kết quả kiểm tra kỹ thuật khi mở lại | H01, H06, X03 |
| Q-10 | Lịch sử một mục | `api.get_item_history` | B | các revision đã xuất bản (số, người, thời gian, cờ tự xuất bản) + dòng audit của mục | F09; SCR-M03-001/002/003/008 |
| Q-11 | Nhật ký toàn hệ thống | `api.list_audit_log` | R | dòng audit phân trang, lọc theo thời gian, người, loại mục; mỗi dòng kèm `subjectId` của mục (nếu có) chỉ để dựng link "Mở mục liên quan" (SCR-M03-009 E-08), không bao giờ hiển thị (BR-M03-L10) | F09, A03; SCR-M03-009 |
| Q-12 | RPT-01 | `api.report_rpt01` | B | RPT-01 output (spec-M03 §5.1) | J05, J06, J08; SCR-M03-005 |
| Q-13 | RPT-02 | `api.report_rpt02` | B | RPT-02 output, có `items[].routeName` | J05, J07, J08 |
| Q-14 | Danh sách tài khoản | `api.list_accounts` | R | email, role, status (tên hiển thị) | K01–K03; SCR-M03-006 |

**Input báo cáo** (spec-M03 §5.1): `routeId?`, `fromDate?`, `toDate?` (Date `YYYY-MM-DD`). Hai ngày phải có cùng nhau, `fromDate ≤ toDate`, khoảng ≤ `REPORT_MAX_SPAN_DAYS` (provisional). Thiếu cả hai thì mặc định 30 ngày lịch kết thúc hôm nay tại `Asia/Ho_Chi_Minh`. Lỗi: MSG-REPORT-DATES-INVALID, MSG-REPORT-SPAN. Filter: `ended_at` trong `[fromDate 00:00, toDate+1 00:00)` theo giờ `Asia/Ho_Chi_Minh` (Physical §7.3). RPT-02 đếm `session_id` phân biệt theo `(route_id, checkpointId)`; tên và sequence lấy từ bản ghi có `ended_at` mới nhất trong kỳ, hòa thì phân định bằng `session_id`. `lastSuccessfulIngestionAt` = `max(ingested_at)`.

Audit view và lịch sử hiện tên hiển thị §5.4 (Thành công/Không thành công, tên trạng thái), không hiện JSON `beforeState`/`afterState` thô. Trước/sau được render thành các dòng "{nhãn trường}: {trước} → {sau}" (BR-M03-L10, L11).

## 7. Ma trận quyền (spec-M03 §2.1; Physical §9)

| Actor | Q-01 | Q-02…Q-10, Q-12, Q-13 | Q-11, Q-14 | C-01…C-11, C-16, C-17 | C-12…C-15, C-18, C-19 |
|---|---|---|---|---|---|
| `anon` | ✗ | ✗ | ✗ | ✗ | ✗ |
| authenticated, không có tài khoản active | chỉ dòng của mình (rỗng) | ✗ | ✗ | ✗ | ✗ |
| `CONTENT_STAFF` active | ✓ | ✓ | ✗ | ✓ | ✗ (FORBIDDEN) |
| `REVIEWER` active | ✓ | ✓ | ✓ | ✓ | ✓ |

## 8. Lỗi và chuyển trạng thái trên UI

| Kết quả | UI làm | BR |
|---|---|---|
| `VALIDATION` | hiện issue dưới đúng trường; cập nhật panel; giữ nguyên state form | L02, L06 |
| `STALE` | MSG-STALE với email người sửa và giờ; nút "Tải lại"; chữ đang gõ vẫn còn | F06, L05 |
| `BUSY` | MSG-ROUTE-BUSY với tên tuyến hoặc điểm dừng; không thử lại tự động | F05, L07 |
| `BLOCKED` | thông báo theo `messageKey`, nêu lý do và cách làm | L07 |
| `FAILED` | MSG-PUBLISH-FAILED / MSG-CLOSE-FAILED; dữ liệu công khai không đổi; với đóng điểm dừng, nút "Đóng tạm các tuyến liên quan" | G07, H04 |
| `FORBIDDEN` | MSG-NO-PERMISSION | A04 |
| Transport | MSG-NETWORK-FAILED / MSG-SESSION-EXPIRED (chuyển về đăng nhập sau khi giữ form) / MSG-GENERIC | L10 |

## 9. Truy vết test (dành cho tasks)

| Kiểm thử | BR / SC |
|---|---|
| Lưu thiếu nội dung vẫn được; chỉ giá trị sai rõ ràng chặn lưu | C03, L01; SC-M03-016 |
| Lưu một lần ghi mọi thứ hoặc không gì (test rollback với media lỗi) | F11; SC-M03-033 |
| Stale không ghi đè; hai phiên sửa song song | F06; SC-M03-005 |
| Hai thao tác trên tập giao nhau → một bị BUSY; tập rời nhau → cả hai chạy | F05 |
| Publish lỗi ở một tuyến → mọi tuyến không đổi, có audit FAILURE | G07, F03; SC-M03-002, 029 |
| QR hoạt động cuối không thu hồi được; Reviewer cuối không hạ được | E09, K03; SC-M03-004, 008 |
| Tuyến không bao giờ tự mở lại | H07; SC-M03-019 |
| Trần offline chặn publish/reopen, không chặn close/revoke | G10; SC-M03-020 |
| Khôi phục tạo bản nháp; chặn khi đã có bản nháp; bản cũ vi phạm giới hạn hiện hành → MSG-RESTORE-BLOCKED, không tạo bản nháp | F07; SC-M03-021 |
| Mỗi command đúng một dòng audit; tự xuất bản có cờ | F08; SC-M03-014 |
| `CONTENT_STAFF` gọi C-12…C-15, Q-11 bị FORBIDDEN; authenticated không có tài khoản bị từ chối | A03, K05; SC-M03-009 |
| Đếm theo `endedAt` + múi giờ, mặc định 30 ngày, khoảng 367 ngày bị từ chối | J05; SC-M03-035 |
