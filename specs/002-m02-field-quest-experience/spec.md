# Feature Specification: M02 — Field Quest Experience

**Feature Branch**: `002-m02-field-quest-experience` *(định danh thư mục; chưa tạo git branch)*

**Created**: 2026-10-29

**Status**: Draft — bản dẫn xuất (Layer 3) từ [docs/spec/spec-M02.md](../../docs/spec/spec-M02.md) v3.3

**Input**: Change Brief CHG-M02-2026-10-29-01. Nguồn chuẩn: spec-M02 v3.3; ranh giới priority: [MVP-Scope.md](../../MVP-Scope.md) §3.2, §3.4. Producer đầu vào: spec-M01 v3.2 và spec-M03 v3.7. Consumer đầu ra: M03.

> **Quy tắc dẫn xuất.** File này không phải nguồn sự thật. Mọi hành vi và contract lấy từ spec-M02; nếu mâu thuẫn, spec canonical thắng. Không thêm requirement, không đổi tên contract (`LanguagePreference`, `SelectedRouteContext v3`, `OfflinePackage`, `LiveQrLookupResult`, `LiveStationContent`, `SessionSyncRecord`). `SessionSyncRecord` (transport) khác `SessionRecord` (entity canonical của M03). Không có chi tiết kỹ thuật (tech stack thuộc plan).

## Ranh giới Producer → Consumer

| Hướng | Contract | Ghi chú (nguồn: spec-M02 §1, §5.1, §11) |
|---|---|---|
| M01 → M02 | `LanguagePreference` | M02 chỉ đọc; M01 là writer duy nhất, kể cả nút VI/EN trên trang link QR. |
| M01 → M02 | `SelectedRouteContext v3` | Phải là version 3, `AUTHORIZED`, chưa dùng, trước `expiresAt`; v2 bị từ chối, không chuyển đổi. |
| M01 → M02 | `OfflinePackage` active `SAN_SANG` | Chỉ đọc; không đọc staging/partial; bỏ qua `offlineRouteMap` và `routeEssentials`. |
| M03 → M02 | `LiveQrLookupResult` với `LiveStationContent` | Request mang `qrIdentifier` và, khi có phiên, `routeId`; kết quả `VALID` / `TEMPORARILY_CLOSED` / `INVALID`; lỗi nguồn khác `INVALID`. |
| M02 → M03 | `SessionSyncRecord` terminal ẩn danh | Bất biến; thử lại giống hệt thì idempotent; đổi nội dung thì conflict. |

M02 không bao giờ ghi dữ liệu do M01 hoặc M03 sở hữu (FR-M02-020).

## User Scenarios & Testing *(mandatory)*

Priority theo MVP-Scope §3.2. Quyết định người dùng (2026-10-29): build toàn bộ chức năng, kể cả Terminal Sync (Should). MVP-Scope §1 yêu cầu Terminal Sync (M02) và Session Intake (M03) nằm cùng một increment.

### User Story 1 - Start and restore a field session — US-M02-01 (Priority: P1)

Du khách bắt đầu từ handoff hợp lệ; phiên được lưu và khôi phục sau reload hoặc khi offline.

**Why this priority**: FN-M02-001, FN-M02-002 là Must; điểm vào của mọi phiên.

**Independent Test**: Dùng context v3 hợp lệ, v2, đã dùng, `REVOKED`, quá hạn; reload giữa phiên.

**Acceptance Scenarios**:

1. **Given** context v3 `AUTHORIZED` với manifest hợp lệ, handoff chưa dùng và còn trước `expiresAt`, **When** bắt đầu, **Then** tạo đúng một phiên `DANG_DIEN_RA` với `sessionId` là UUID duy nhất toàn cục.
2. **Given** handoff đã tạo phiên, đã `REVOKED` hoặc quá `expiresAt`, **Then** không tạo phiên mới và yêu cầu du khách bắt đầu lại từ M01.
3. **Given** context version 2, **Then** bị từ chối với thông báo rõ và không chuyển đổi ngầm.
4. **Given** có phiên đang chạy sau reload, **Then** khôi phục đúng phiên và các lượt ghé; hạn handoff không bao giờ kết thúc phiên đã tạo (chỉ BR-M02-022 mới tự đóng phiên).

---

### User Story 2 - Scan and check in — US-M02-02 (Priority: P1)

Du khách quét QR bằng nút Quét trong app hoặc mở link QR bằng camera; lượt ghé được ghi một lần cho mỗi `(sessionId, checkpointId)` chỉ khi lần quét được chấp nhận, trước khi hiện nội dung. Journey Map hiển thị hành trình cố định từ manifest cùng trạng thái đã quét.

**Why this priority**: FN-M02-003, FN-M02-004 là Must; đường đi tối thiểu của MVP.

**Independent Test**: Quét QR trong hành trình (online/offline), QR thứ hai của cùng điểm dừng, QR thêm sau khi phiên bắt đầu, QR ngoài hành trình.

**Acceptance Scenarios**:

1. **Given** lần quét được chấp nhận cho điểm dừng của hành trình (BR-M02-005), **When** quét lần đầu, **Then** ghi một lượt ghé trước khi hiện nội dung.
2. **Given** quét QR khác của cùng điểm dừng, **Then** không tạo lượt ghé thứ hai nhưng hiện nội dung của QR đó.
3. **Given** điểm dừng hợp lệ bất kỳ, **Then** được ghé theo thứ tự tùy ý.
4. **Given** lỗi nội dung, **Then** lượt ghé đã ghi không bị rollback; câu trả lời `INVALID` hoặc `TEMPORARILY_CLOSED` online không ghi lượt ghé.
5. **Given** lượt ghé đã ghi, **Then** hiển thị là "Đã quét QR" và không bao giờ là bằng chứng đã đến nơi.
6. **Given** QR M03 thêm vào điểm dừng của hành trình sau khi phiên bắt đầu (không có trong frozen journey), **When** quét online và lookup trả `VALID` với `checkpointId` thuộc hành trình, **Then** ghi lượt ghé của điểm dừng đó trước khi hiện nội dung (BR-M02-020); offline thì cần kết nối trước.

---

### User Story 3 - Read the content of the scanned QR — US-M02-03 (Priority: P1)

Du khách đọc nội dung của đúng QR đã quét: online dùng kết quả lookup `VALID`; offline hoặc lookup lỗi dùng package; audio/video chỉ phát khi có hành động và chỉ hiện tệp đúng ngôn ngữ hoặc không lời.

**Why this priority**: FN-M02-005 là Must.

**Independent Test**: Quét cùng một QR ở chế độ online `VALID`, offline có package, offline thiếu resource, điểm dừng `ONLINE_AVAILABLE` offline; đổi VI/EN khi có media.

**Acceptance Scenarios**:

1. **Given** QR đã quét, **Then** nội dung là của QR (tên đối tượng, giới thiệu, ảnh, và audio/video nếu có), không bao giờ là nội dung dùng chung của cả điểm dừng.
2. **Given** online, **When** lookup trả `VALID`, **Then** hiển thị nội dung trả về (mới nhất) cho cả hai connectivity mode.
3. **Given** offline hoặc lookup lỗi, **Then** điểm dừng `OFFLINE_REQUIRED` đọc văn bản/ảnh song ngữ từ resource của package theo `qrIdentifier`; điểm dừng `ONLINE_AVAILABLE` hiện thông báo không có nội dung.
4. **Given** nội dung có audio/video, **Then** chỉ phát khi du khách chủ động; chỉ liệt kê tệp có `spokenLanguage` bằng ngôn ngữ hiện tại cộng tệp `NONE`; đổi VI/EN đổi danh sách ngay (BR-M02-026); không có tệp khớp thì không hiện điều khiển media.
5. **Given** thiếu nội dung: giữ lượt ghé và hiện thông báo không có nội dung; package thiếu resource mà đang online thì hỏi M03 cho riêng QR đó và không đổi package; offline thì hiện "Chưa có nội dung offline cho điểm này". Resource thiếu không phải QR không hợp lệ.

---

### User Story 4 - Scan outside the journey / closed area — US-M02-04, US-M02-08 (Priority: P1)

QR ngoài hành trình có thể hiện nội dung live nhưng không bao giờ tạo lượt ghé hay đổi tuyến; QR ở khu vực tạm đóng hiện thông báo đóng cố định.

**Why this priority**: FN-M02-004, FN-M02-005 là Must; an toàn thực địa.

**Independent Test**: Lookup trả `VALID` (ngoài hành trình), `INVALID`, `TEMPORARILY_CLOSED` (phạm vi checkpoint và route), lỗi mạng, offline.

**Acceptance Scenarios**:

1. **Given** QR có điểm dừng ngoài hành trình, **When** lookup `VALID`, **Then** hiện nội dung live và không tạo lượt ghé.
2. **Given** `INVALID`, **Then** hiện "Mã không còn hiệu lực hoặc không tồn tại".
3. **Given** `TEMPORARILY_CLOSED` (thiết bị online, QR thuộc điểm dừng của hành trình hoặc ngoài hành trình), **Then** không ghi lượt ghé, không hiện nội dung, hiện thông báo "Khu vực này đang tạm đóng. Vui lòng dừng lại hoặc quay về theo hướng dẫn của Ban Quản lý." (tiếng Anh: "This area is temporarily closed. Please stop here or return as directed by Park Management."); thông báo giống nhau cho phạm vi checkpoint và route, kể cả route bị archive sau khi chuyến bắt đầu.
4. **Given** lỗi mạng, **Then** báo lỗi kết nối, không báo QR không hợp lệ; offline với QR ngoài frozen journey thì báo cần kết nối.
5. **Given** offline, **Then** M02 không biết về việc đóng và không hiện thông báo; an toàn thực địa xử lý ngoài app.

---

### User Story 5 - Complete or abandon a session — US-M02-05 (Priority: P1)

Hoàn tất khi đã quét điểm cuối và xác nhận (Finish hoặc câu hỏi "Kết thúc chuyến đi?"), thay thế phiên khi Start tuyến khác, và tự đóng phiên bị bỏ quên sau 24 giờ.

**Why this priority**: FN-M02-006 là Must.

**Independent Test**: Quét điểm cuối; chọn Kết thúc / Đi tiếp; Start handoff mới giữa phiên; mở lại app sau hơn 24 giờ.

**Acceptance Scenarios**:

1. **Given** điểm dừng có `sequence` lớn nhất đã được ghé, **Then** Finish khả dụng.
2. **Given** du khách xác nhận, **Then** phiên thành `HOAN_TAT` kể cả khi bỏ qua các điểm trước.
3. **Given** handoff mới hợp lệ khi có phiên chạy, **Then** tạo phiên thay thế và đổi phiên cũ thành `BO_DO` như một thao tác logic; nếu tạo phiên mới lỗi thì phiên cũ vẫn chạy.
4. **Given** lượt ghé điểm cuối ghi lần đầu, **Then** M02 hỏi "Bạn đã quét điểm cuối. Kết thúc chuyến đi?" với [Kết thúc] và [Đi tiếp]; [Kết thúc] thành `HOAN_TAT`, [Đi tiếp] giữ phiên và Finish vẫn khả dụng (BR-M02-021).
5. **Given** mở/đưa app lên màn hình và phiên đang chạy đã bắt đầu quá 24 giờ, **Then** tự kết thúc: `HOAN_TAT` nếu đã ghé điểm cuối, ngược lại `BO_DO`; `endedAt` là `checkedInAt` mới nhất của phiên hoặc `startedAt` khi chưa quét; xếp hàng đồng bộ và hiện thông báo ngắn (BR-M02-022).

---

### User Story 6 - Free visitor scan and phone-camera link — US-M02-07, US-M02-09 (Priority: P1)

Bất kỳ ai quét QR bằng camera điện thoại (kể cả chưa từng mở app) mở được trang `/q/{qrIdentifier}` để xem nội dung mà không tạo tiến độ hay dữ liệu báo cáo.

**Why this priority**: FN-M02-008 và năng lực "Trang mở từ mã QR bằng camera điện thoại" là Must (MVP-Scope §3.4).

**Independent Test**: Mở link không có phiên, có phiên cùng trình duyệt, chưa chọn ngôn ngữ, offline với trình duyệt đã/chưa từng mở app, link sai base.

**Acceptance Scenarios**:

1. **Given** quét bằng camera khi online, **When** trình duyệt mở `/q/{qrIdentifier}`, **Then** hiện điểm tham quan mà không có bước nào trước đó (không chọn ngôn ngữ, không chọn tuyến) (BR-M02-024).
2. **Given** chưa từng chọn ngôn ngữ, **Then** dùng ngôn ngữ thiết bị (tiếng Việt nếu thiết bị là tiếng Việt, ngược lại tiếng Anh); nút VI/EN đổi ngay và giữ lựa chọn.
3. **Given** có phiên đang chạy trong cùng trình duyệt, **Then** link được xử lý y như quét trong app (lượt ghé, thông báo đóng, câu hỏi kết thúc).
4. **Given** không có phiên chạy trong trình duyệt đó, **Then** trang ở chế độ khách tự do: không gửi `routeId`, không ghi gì, hiện gợi ý một dòng rằng lượt quét này không được ghi vào chuyến đi kèm liên kết tới danh mục tuyến; không bao giờ tạo phiên và không tạo `PlaySession`, `CheckpointVisit`, `SessionSyncRecord`.
5. **Given** offline, **Then** trang chỉ mở khi trình duyệt này từng mở app (app shell đã cache) và hành xử như quét offline trong app; nếu chưa từng mở thì trình duyệt tự hiện trang offline mà app không điều khiển được (BR-M02-025).
6. **Given** trình quét trong app đọc mã không phải public QR link của môi trường hiện tại (`QR_PUBLIC_BASE_URL`), **Then** hiện thông báo QR không hợp lệ mà không lookup (FR-M02-026).

---

### User Story 7 - Synchronize terminal data — US-M02-06 (Priority: P2)

Chỉ phiên `HOAN_TAT` hoặc `BO_DO` được đồng bộ, dạng `SessionSyncRecord` ẩn danh, bất biến, thử lại khi app mở.

**Why this priority**: FN-M02-007 là Should; phải cùng increment với M03 Session Intake (MVP-Scope §1). Phiên tự đóng (FR-M02-024) cũng cần hàng đợi này.

**Independent Test**: Phiên kết thúc khi online/offline; thử lại giống hệt; thử lại khác nội dung; bản ghi bị M03 từ chối.

**Acceptance Scenarios**:

1. **Given** phiên chưa kết thúc, **Then** không được đồng bộ; chỉ phiên `HOAN_TAT` hoặc `BO_DO`.
2. **Given** thử lại cùng `sessionId` với dữ liệu giống hệt, **Then** thành công, không tạo bản sao.
3. **Given** cùng `sessionId` nhưng dữ liệu khác, **Then** bị từ chối là conflict và dừng thử lại tự động.
4. **Given** đồng bộ lỗi hoặc offline, **Then** giữ trong hàng đợi để thử sau (chỉ khi app mở hoặc quay lại; không đồng bộ nền sau khi đóng trình duyệt).
5. **Given** M03 từ chối bản ghi không hợp lệ, **Then** dừng thử lại tự động và hiện lỗi như conflict.

---

### Edge Cases

Nguồn: spec-M02 §4, §5.2, §9, §10.

- Hết hạn handoff không bao giờ kết thúc phiên đã tạo (BR-M02-017, SC-M02-010).
- Lookup không trả lời trong `LOOKUP_TIMEOUT_SECONDS` (provisional: 8 giây) tính là lookup lỗi (BR-M02-005).
- Lỗi nội dung không gỡ lượt ghé đã ghi; online `INVALID` / `TEMPORARILY_CLOSED` không ghi lượt ghé (BR-M02-005, SC-M02-004, SC-M02-009).
- QR thứ hai của cùng điểm dừng: một lượt ghé nhưng nội dung riêng (BR-M02-014, SC-M02-002, SC-M02-008).
- `sequence` có thể có khoảng trống; số hiển thị cho du khách đếm liên tục (BR-M02-006).
- Mã bị hỏng in lại cùng identifier (spec-M03 BR-M03-E07); mã thêm sau khi chuyến bắt đầu chỉ giải quyết được khi online (BR-M02-020).
- Điểm dừng đổi mode giữa chuyến: điều khiển media theo nội dung đang hiển thị (BR-M02-016).
- Phiên không bao giờ được mở lại trên thiết bị thì không bao giờ được kết thúc hay đồng bộ; chấp nhận cho MVP (BR-M02-022).
- Phiên ở trình duyệt khác hoặc app đã cài mà camera không mở thì không nhìn thấy; chấp nhận (BR-M02-024).
- Tối đa một phiên `DANG_DIEN_RA` mỗi trình duyệt; hai tab cùng trình duyệt dùng chung một phiên (FR-M02-002, BR-M02-002).
- Camera không dùng được trong trình quét trong app → thông báo cố định, du khách quét bằng camera điện thoại (BR-M02-023).
- Bản ghi `CONFLICT` không có thao tác nào của du khách để thử lại hay xóa (BR-M02-011).
- Thay phiên là all-or-nothing (BR-M02-013).
- Đồng hồ thiết bị đủ chính xác để so với `expiresAt` và mốc 24 giờ (§9).
- Dữ liệu cục bộ có thể mất khi xóa dữ liệu trình duyệt (§9).
- Thiết bị offline có thể chưa biết route/checkpoint vừa đóng (§9, BR-M02-015).
- `sourceHandoffId` phải duy nhất (FR-M02-003).
- Payload đồng bộ không chứa PII (SC-M02-007).

## Requirements *(mandatory)*

### Functional Requirements

Mỗi dòng giữ nguyên ID; chi tiết lấy từ spec-M02 §5 và BR §5.2. Thông báo cố định song ngữ cho du khách nằm ở spec-M02 §5.1 "Fixed visitor messages"; không viết lại ở đây.

- **FR-M02-001**: Kiểm tra context v3 và tạo phiên từ handoff `AUTHORIZED` chưa dùng, chưa hết hạn; từ chối v2 và handoff hết hạn bằng thông báo rõ. (BR-M02-001, BR-M02-017)
- **FR-M02-002**: Tối đa một phiên `DANG_DIEN_RA` mỗi trình duyệt trên một thiết bị. (BR-M02-002)
- **FR-M02-003**: Sinh `sessionId` UUID duy nhất toàn cục; `sourceHandoffId` phải duy nhất.
- **FR-M02-004**: Sao chép toàn bộ manifest của handoff vào dữ liệu hành trình bất biến của phiên. (BR-M02-003)
- **FR-M02-005**: Khôi phục phiên đang chạy và các lượt ghé sau reload/offline.
- **FR-M02-006**: Lấy `qrIdentifier` từ public QR link đã quét và giải quyết thành `checkpointId` qua kết quả lookup online hoặc, khi offline, qua frozen journey. (BR-M02-005, BR-M02-023)
- **FR-M02-007**: Ghi một lượt ghé cho mỗi `(sessionId, checkpointId)` với lần quét được chấp nhận, trước khi hiện nội dung. (BR-M02-004, BR-M02-005)
- **FR-M02-008**: Chấp nhận check-in theo thứ tự bất kỳ và đánh dấu điểm đã ghé. (BR-M02-006)
- **FR-M02-009**: Quét lại (cùng QR hoặc QR khác của điểm dừng) hiện nội dung của QR đó và thời điểm ghé ban đầu, không thêm bản sao. (BR-M02-014)
- **FR-M02-010**: Đọc nội dung offline từ resource package sẵn sàng khớp `qrIdentifier` khi offline hoặc lookup lỗi. (BR-M02-009, BR-M02-018)
- **FR-M02-011**: Lookup QR đã quét tại M03 mỗi khi online, hiện nội dung trả về của QR đó và phát media theo yêu cầu. (BR-M02-009, BR-M02-016)
- **FR-M02-012**: Xử lý QR ngoài hành trình mà không ghi tiến độ. (BR-M02-008)
- **FR-M02-013**: Phân biệt kết quả `INVALID` và `TEMPORARILY_CLOSED` với lỗi kết nối/nguồn.
- **FR-M02-014**: Áp `LanguagePreference` hiện tại cho nội dung có sẵn, gồm cả việc tệp audio/video nào được hiện. (BR-M02-026)
- **FR-M02-015**: Bật Finish sau khi điểm dừng có `sequence` lớn nhất đã được ghé.
- **FR-M02-016**: Hoàn tất khi xác nhận; không yêu cầu mọi điểm trước đó. (BR-M02-007)
- **FR-M02-017**: Tạo nguyên tử phiên thay thế và đổi phiên chạy trước đó thành `BO_DO` khi chấp nhận handoff mới. (BR-M02-013)
- **FR-M02-018**: Lưu dữ liệu đồng bộ terminal bất biến và thử lại đến khi được xác nhận, conflict hoặc bị từ chối. (BR-M02-010, BR-M02-011)
- **FR-M02-019**: Ngăn khách tự do tạo dữ liệu tiến độ/báo cáo. (BR-M02-012, BR-M02-019)
- **FR-M02-020**: Không bao giờ ghi dữ liệu nguồn do M01/M03 sở hữu.
- **FR-M02-021**: Hiện thông báo đóng cho câu trả lời `TEMPORARILY_CLOSED`, không ghi lượt ghé và không hiện nội dung ghé. (BR-M02-015)
- **FR-M02-022**: Ghi lượt ghé cho QR không có trong frozen journey khi lookup online trả `VALID` với `checkpointId` của hành trình; không đổi frozen journey. (BR-M02-020)
- **FR-M02-023**: Hỏi du khách kết thúc chuyến ngay khi lượt ghé điểm cuối được ghi lần đầu. (BR-M02-021)
- **FR-M02-024**: Tự kết thúc phiên đang chạy khi mở app quá 24 giờ sau khi phiên bắt đầu (`HOAN_TAT` nếu đã ghé điểm cuối, ngược lại `BO_DO`) và xếp hàng đồng bộ. (BR-M02-022)
- **FR-M02-025**: Phục vụ trang link QR công khai `/q/{qrIdentifier}` mở từ camera: không bước chặn, ngôn ngữ từ preference đã lưu hoặc từ thiết bị, xử lý như quét trong app khi có phiên cùng trình duyệt, ngược lại ở chế độ khách tự do. (BR-M02-023, 024, 025)
- **FR-M02-026**: Trình quét trong app chỉ chấp nhận mã là public QR link của môi trường hiện tại (`QR_PUBLIC_BASE_URL`) và lấy `qrIdentifier` từ đó; nội dung khác hiện thông báo QR không hợp lệ mà không lookup. (BR-M02-023)

### Key Entities *(include if feature involves data)*

Nguồn: spec-M02 §6. Chỉ mô tả vai trò; kiểu dữ liệu thuộc plan/data-model.

- **PlaySession**: phiên thực địa; `journeyCheckpoints` là bản sao giá trị đóng băng của manifest handoff, không cập nhật sau khi tạo (BR-M02-003).
- **CheckpointVisit**: một lượt ghé cho mỗi `(sessionId, checkpointId)`; nghĩa là đã quét QR, không phải bằng chứng hiện diện.
- **Frozen journey representation**: view đọc của hành trình đóng băng (không phải entity riêng).
- **Pending sync queue (`PendingSyncItem`)**: hàng đợi cục bộ chứa `SessionSyncRecord` terminal; trạng thái đồng bộ `PENDING` / `SYNCED` / `CONFLICT`.
- **SessionSyncRecord**: contract transport gửi M03; không đồng nghĩa với `SessionRecord` của M03.

## Success Criteria *(mandatory)*

### Measurable Outcomes

Giữ nguyên SC-M02-001…019 (spec-M02 §8):

- **SC-M02-001**: Dùng lại handoff không bao giờ tạo phiên thứ hai.
- **SC-M02-002**: Quét nhiều QR của một điểm dừng tạo một lượt ghé.
- **SC-M02-003**: Reload/offline không làm mất lượt ghé đã ghi.
- **SC-M02-004**: Lỗi nội dung không hoàn tác check-in hợp lệ.
- **SC-M02-005**: Hoàn tất và độ phủ lượt ghé phân biệt được trong dữ liệu/báo cáo.
- **SC-M02-006**: Đồng bộ lặp giống hệt không tạo phiên hay lượt ghé trùng.
- **SC-M02-007**: Payload đồng bộ không chứa PII của du khách.
- **SC-M02-008**: Quét hai QR khác nhau của một điểm dừng hiện hai nội dung khác nhau và ghi một lượt ghé.
- **SC-M02-009**: QR ở điểm dừng/tuyến tạm đóng không bao giờ hiện nội dung ghé; `TEMPORARILY_CLOSED` hoặc `INVALID` online không ghi lượt ghé.
- **SC-M02-010**: Handoff hết hạn hoặc v2 không tạo phiên; phiên đã có không bị kết thúc vì handoff hết hạn.
- **SC-M02-011**: Điều khiển audio/video không bao giờ hiện cho điểm dừng offline-required hay nội dung package.
- **SC-M02-012**: Resource offline thiếu không bao giờ bị báo là QR không hợp lệ.
- **SC-M02-013**: Không màn hình nào diễn đạt lượt ghé là bằng chứng đã có mặt thực tế: lượt ghé chỉ được gắn nhãn "Đã quét QR" / "QR scanned", và không thông báo hay nhãn cố định nào nêu hoặc ngụ ý đã đến/có mặt (ví dụ "đã đến", "có mặt", "arrived").
- **SC-M02-014**: Online, mã thêm sau ghi lượt ghé điểm dừng một lần, nên đổi mã giữa chuyến không chặn Finish khi online.
- **SC-M02-015**: Ghi lượt ghé điểm cuối luôn hiện câu hỏi kết thúc một lần.
- **SC-M02-016**: Sau khi mở app, không phiên nào quá 24 giờ còn đang chạy; nó thành `HOAN_TAT` hoặc `BO_DO` theo BR-M02-022 và được đồng bộ như phiên terminal khác.
- **SC-M02-017**: Mã in quét bằng camera điện thoại khi online luôn mở điểm tham quan, không có bước ngôn ngữ hay tuyến trước đó (trừ khi điện thoại không mở được link trong trình duyệt, ví dụ app cài trên màn hình chính iPhone; BR-M02-024, §9).
- **SC-M02-018**: Mở link QR không bao giờ tạo phiên; chỉ ghi lượt ghé khi có phiên đang chạy trong cùng trình duyệt và lần quét được chấp nhận.
- **SC-M02-019**: Đổi VI/EN đổi văn bản và audio/video hiện ngay; ảnh và tệp không lời giữ nguyên.

## Assumptions

Nguồn: spec-M02 §9, §10.

- Tuyến một ngày, tuyến tính, có một điểm cuối `sequence` lớn nhất.
- M03 chỉ đánh dấu `ONLINE_AVAILABLE` sau khi khảo sát thực địa; M02 không có fallback offline cho điểm bị phân loại sai.
- Trình duyệt/camera và quyền truy cập sẵn có; app dùng trong trình duyệt; không khuyến khích cài lên màn hình chính iPhone.
- Đồng hồ thiết bị đủ chính xác cho `expiresAt` và mốc 24 giờ.
- Du khách quên kết thúc thường mở lại app trên cùng thiết bị; phiên không bao giờ mở lại thì không được báo cáo.
- Dữ liệu cục bộ có thể mất khi xóa dữ liệu trình duyệt; không đồng bộ tiến độ giữa thiết bị/trình duyệt.
- Không có tài khoản khách hay định danh thiết bị; không GPS/geofence; không gợi ý, điểm, huy hiệu.
- Dependency M01: `LanguagePreference`, `SelectedRouteContext v3`, `OfflinePackage`, nút VI/EN và app shell phục vụ trang link QR offline (spec-M01 §9.3).
- Dependency M03: lookup live cho mọi QR và nhận bản ghi terminal; M03 in link công khai `{QR_PUBLIC_BASE_URL}/q/{qrIdentifier}` (BR-M03-B04).
- Quyết định người dùng 2026-10-29: build toàn bộ M02 kể cả Terminal Sync; FR-M02-024 phụ thuộc hàng đợi đồng bộ của FN-M02-007.

### Open clarifications

- `LOOKUP_TIMEOUT_SECONDS` = 8 (**provisional**, spec-M02 §5.2 BR-M02-005 và §9): giá trị phải được kiểm chứng trên thiết bị thực địa; giữ nguyên giá trị, không phải business rule đã xác nhận. Chủ dự án chịu trách nhiệm kiểm chứng trước lần phát hành thật đầu tiên.
Không còn mục `[NEEDS CLARIFICATION]` mở. Các quyết định (người dùng, 2026-10-29):

- **`QR_PUBLIC_BASE_URL`**: là cấu hình theo môi trường (FR-M02-026, BR-M02-023); domain Production vĩnh viễn do chủ dự án chốt trước khi in tem thật (MVP-Scope §5, spec-M03 §9). Không chặn build.
- **Chống lạm dụng cho lookup và intake công khai**: giao cho tài liệu architecture (spec-M03 §9); không phải requirement hành vi của M02.
- **Hiệu năng mở trang `/q/…` và dung lượng lưu cục bộ**: không có requirement hành vi trong spec-M02; để lại cho plan.

## Traceability (ID → section nguồn)

Tất cả ID bên dưới tồn tại trong [docs/spec/spec-M02.md](../../docs/spec/spec-M02.md). Cột Function/Priority lấy từ MVP-Scope §3.2 và [function-list-M02.md](../../docs/function%20list/function-list-M02.md).

| User story | US (spec §) | FR | BR | SC | Function / Priority |
|---|---|---|---|---|---|
| Story 1 | US-M02-01 (§3) | FR-M02-001 … FR-M02-005 | BR-M02-001, 002, 003, 017 | SC-M02-001, 003, 010 | FN-M02-001, FN-M02-002 / Must |
| Story 2 | US-M02-02 (§3) | FR-M02-006 … FR-M02-009, FR-M02-022 | BR-M02-004, 005, 006, 014, 020 | SC-M02-002, 008, 013, 014 | FN-M02-003, FN-M02-004 / Must |
| Story 3 | US-M02-03 (§3) | FR-M02-010, FR-M02-011, FR-M02-014 | BR-M02-009, 016, 018, 026 | SC-M02-004, 011, 012, 019 | FN-M02-005 / Must |
| Story 4 | US-M02-04, US-M02-08 (§3) | FR-M02-012, FR-M02-013, FR-M02-021 | BR-M02-008, 015 | SC-M02-009 | FN-M02-004, FN-M02-005 / Must |
| Story 5 | US-M02-05 (§3) | FR-M02-015, 016, 017, 023, 024 | BR-M02-007, 013, 021, 022 | SC-M02-005, 015, 016 | FN-M02-006 / Must |
| Story 6 | US-M02-07, US-M02-09 (§3) | FR-M02-019, FR-M02-025, FR-M02-026 | BR-M02-012, 019, 023, 024, 025 | SC-M02-017, 018 | FN-M02-008 / Must |
| Story 7 | US-M02-06 (§3) | FR-M02-018 | BR-M02-010, 011 | SC-M02-006, 007 | FN-M02-007 / Should |
| Xuyên suốt | — | FR-M02-020 | — | — | — |

| Mục trong file này | Section nguồn |
|---|---|
| Ranh giới Producer → Consumer | spec-M02 §1, §5.1, §11; AGENTS.md §3.2 |
| Edge Cases | spec-M02 §4, §5.2, §9, §10 |
| Key Entities | spec-M02 §6.1–6.4 |
| Priority | MVP-Scope §3.2, §3.4 |
| Traceability gốc | spec-M02 §11 (Traceability US → FR → BR → SC) |
