# Feature Specification: M03 — Operations & Content Administration

**Feature Branch**: `003-m03-operations-content-administration` *(định danh thư mục; chưa tạo git branch)*

**Created**: 2026-10-29

**Status**: Draft — bản dẫn xuất (Layer 3) từ [docs/spec/spec-M03.md](../../docs/spec/spec-M03.md) v3.7

**Input**: Change Brief CHG-M03-2026-10-29-01. Nguồn chuẩn: spec-M03 v3.7; ranh giới priority: [MVP-Scope.md](../../MVP-Scope.md) §3.3, §3.4. Consumer: M01 v3.2 (Published Route, `JourneySnapshot`) và M02 v3.3 (`LiveQrLookupResult`, `LiveStationContent`). Producer đầu vào: M02 (`SessionSyncRecord`).

> **Quy tắc dẫn xuất.** File này không phải nguồn sự thật. Mọi hành vi và contract lấy từ spec-M03; nếu mâu thuẫn, spec canonical thắng. Không thêm requirement, không đổi tên contract hay entity (`Revision`, `JourneySnapshot`, `SessionRecord`, `SessionSyncRecord`, `LiveQrLookupResult`, `LiveStationContent`). `SessionSyncRecord` là contract transport; `SessionRecord` là entity canonical của M03 — không hợp nhất. Mọi giao diện quản trị và thông báo là tiếng Việt giản dị theo spec-M03 §5.4–5.6. Không có chi tiết kỹ thuật (tech stack, tên bảng, endpoint thuộc plan).
>
> ID đã retire, không dùng lại: US-M03-07, FR-M03-017, BR-M03-C13, BR-M03-E08, SC-M03-018, SC-M03-027.

## Ranh giới Producer → Consumer

| Hướng | Contract | Ghi chú (nguồn: spec-M03 §1, §5.1, §11) |
|---|---|---|
| M03 → M01 | Published Route projection | `activeContentVersion` luôn có; tuyến `HOAT_DONG`, `TAM_DONG` hoặc `LUU_TRU` đều có thể xuất hiện; chỉ `HOAT_DONG` có phiên bản hợp lệ mới chọn được. |
| M03 → M01 | `JourneySnapshot` | Bất biến, đánh số liên tục `contentVersion`, có `offlineResources[]`, `offlineRouteMap` tùy chọn, `estimatedOfflineSizeBytes` tùy chọn; không có audio/video. |
| M03 → M02 | `LiveQrLookupResult` với `LiveStationContent` | Kết quả `VALID` / `TEMPORARILY_CLOSED` / `INVALID`; chỉ `VALID` mang nội dung; không mang route identifier; `mediaResources[].spokenLanguage` = `vi` / `en` / `NONE`. |
| M02 → M03 | `SessionSyncRecord` | Terminal, ẩn danh, bất biến; M03 lưu thành `SessionRecord`. |

## User Scenarios & Testing *(mandatory)*

Priority theo MVP-Scope §3.3, §3.4. Quyết định người dùng (2026-10-29): giữ M03 là một package và build toàn bộ chức năng, kể cả các mục Should; nếu quá nặng khi plan thì tách sau. Ba phần chia sẻ `Revision`, audit và auth.

### User Story 1 - Manage administrative access — US-M03-05 (Priority: P1)

Quản trị viên đăng nhập bằng danh tính do nhà cung cấp xác thực; mọi request được bảo vệ phải có danh tính hợp lệ và `AdminAccount` đang hoạt động với role cố định. Reviewer mời, đổi role, kích hoạt/vô hiệu tài khoản.

**Why this priority**: FN-M03-008 là Must; mọi chức năng quản trị khác phụ thuộc.

**Independent Test**: Đăng nhập với/không có `AdminAccount` active; mời, quên mật khẩu, vô hiệu Reviewer cuối; đăng xuất.

**Acceptance Scenarios**:

1. **Given** không có đăng ký công khai, **When** quản trị viên vào bằng màn đăng nhập M03, **Then** danh tính nhà cung cấp đơn lẻ không cấp quyền; phải có `AdminAccount` active với `CONTENT_STAFF` hoặc `REVIEWER` (BR-M03-A04, K05).
2. **Given** chỉ Reviewer, **When** mời bằng email chuẩn hóa duy nhất và một role cố định, **Then** nhà cung cấp gửi lời mời và M03 tạo `AdminAccount` `INVITATION_PENDING`; người nhận tự đặt mật khẩu; lời mời hết hạn/không hợp lệ không tạo quyền, tài khoản vẫn ở `INVITATION_PENDING`; có thể gửi lại cho cùng tài khoản mà không tạo bản sao (BR-M03-K01).
3. **Given** quên mật khẩu, **Then** phản hồi không tiết lộ email có tồn tại hay không; khôi phục không bao giờ tạo `AdminAccount`, đổi role/status hay bỏ qua kiểm tra server; tài khoản bị vô hiệu vẫn bị từ chối (BR-M03-K02).
4. **Given** Reviewer cuối cùng đang hoạt động, **When** bị vô hiệu hoặc hạ role, **Then** bị chặn trong transaction (BR-M03-K03).
5. **Given** môi trường chưa có tài khoản quản trị, **Then** Reviewer đầu tiên chỉ được tạo bằng thủ tục phía server, một lần, idempotent theo email chuẩn hóa, không có từ trình duyệt/API công khai (BR-M03-K04); sau lần truy cập đầu mời ít nhất một Reviewer dự phòng.
6. **Given** đã đăng nhập, **When** đăng xuất từ bất kỳ màn nào, **Then** phiên nhà cung cấp kết thúc, mọi request bảo vệ cần đăng nhập lại; request đã tới server trước đó chạy trọn vẹn hoặc rollback, không hiện cho người dùng; có thay đổi chưa lưu thì hiện MSG-UNSAVED-CHANGES trước (BR-M03-K06).

---

### User Story 2 - Create and manage checkpoints and visit points — US-M03-03 (Priority: P1)

Tạo điểm dừng trong thư viện dùng chung, độc lập với tuyến, với tên song ngữ, chế độ kết nối bắt buộc chọn và các điểm tham quan (QR object) có nội dung song ngữ, ảnh và (chỉ điểm dừng có mạng) audio/video riêng.

**Why this priority**: FN-M03-002, 003, 004 là Must; tuyến chỉ chọn được điểm dừng đã xuất bản.

**Independent Test**: Tạo điểm dừng `OFFLINE_REQUIRED` và `ONLINE_AVAILABLE`, thêm điểm tham quan, upload nhiều tệp, in lại/thu hồi mã, tải ảnh mã in.

**Acceptance Scenarios**:

1. **Given** một điểm dừng là khu vực thực, **Then** nó chứa một hoặc nhiều điểm tham quan (mỗi cái một QR), không thuộc tuyến nào, và nhiều tuyến có thể liệt kê nó.
2. **Given** chọn chế độ kết nối rõ ràng, **Then** với "Cần tải trước" điểm tham quan chỉ nhận chữ và ảnh; với "Dùng được khi có mạng" nhận thêm audio và video; chế độ lưu trên điểm dừng (BR-M03-D02).
3. **Given** mỗi điểm tham quan, **Then** có tên, giới thiệu, ảnh và (khi được phép) audio/video riêng; quét QR chỉ trả nội dung của điểm tham quan đó (BR-M03-E01).
4. **Given** mỗi điểm tham quan và điểm dừng, **Then** hiện "Sẵn sàng" hoặc "Chưa đủ: ..."; xuất bản điểm dừng đi qua màn review: điểm dừng và các điểm tham quan sẵn sàng cùng thành hoạt động, điểm chưa sẵn sàng giữ `NHAP` và được liệt kê (BR-M03-D05).
5. **Given** sau khi xuất bản điểm dừng, **Then** mỗi điểm tham quan mới được xuất bản riêng (BR-M03-E13); điểm dừng đang hoạt động luôn có ít nhất một điểm tham quan hoạt động (BR-M03-E11).
6. **Given** sửa điểm dừng/điểm tham quan đã xuất bản ảnh hưởng nhiều tuyến, **Then** màn review nêu mọi tuyến bị ảnh hưởng (BR-M03-X03).
7. **Given** "Thêm điểm tham quan" chỉ có sau khi điểm dừng đã lưu với chế độ kết nối; **Then** mở form rỗng và QR, `qrIdentifier`, bản nháp đầu được tạo cùng lúc ở lần "Lưu bản nháp" đầu tiên (BR-M03-E15).
8. **Given** mỗi lần lưu, **Then** danh sách cập nhật ngay, mục vừa lưu được tô sáng, editor nêu đang sửa điểm tham quan nào và đang hiện bản nháp hay bản đã xuất bản (BR-M03-E16).
9. **Given** chọn nhiều tệp trong một thao tác, **Then** mỗi tệp được kiểm tra và tải riêng, hiện trạng thái riêng; tệp tải thành công được giữ khi tệp khác lỗi; quyền sử dụng xác nhận từng tệp; tệp đã tải nhưng chưa bao giờ được lưu vào bản nháp không công khai và không được dọn tự động (BR-M03-E14).
10. **Given** trước khi xuất bản, **Then** có thể "Xem trước như du khách" bản nháp ở cả hai ngôn ngữ (BR-M03-F12) — thuộc nhóm Should theo MVP-Scope §3.4.
11. **Given** mỗi mã in là link công khai cố định `{QR_PUBLIC_BASE_URL}/q/{qrIdentifier}`, **Then** ảnh in tải xuống được bất cứ lúc nào (SVG/PNG), cảnh báo khi điểm tham quan chưa xuất bản, và điểm dừng `OFFLINE_REQUIRED` mang dòng cảnh báo song ngữ; ảnh ngoài Production mang nhãn "BẢN THỬ — KHÔNG DÁN RA THỰC ĐỊA" (BR-M03-B04, B05).
12. **Given** in lại (mã hỏng/mờ), **Then** giữ identifier và nội dung, chỉ ghi audit (BR-M03-E07); thu hồi (revoke) cần lý do và bị chặn nếu là QR hoạt động cuối của điểm dừng hoạt động (BR-M03-E09); lưu trữ điểm dừng chỉ Reviewer, chỉ khi `TAM_DONG` và không tuyến nào chưa lưu trữ liệt kê nó (BR-M03-D10).

---

### User Story 3 - Create and publish a route — US-M03-01 (Priority: P1)

Nhân viên tạo tuyến (thông tin song ngữ, ảnh, tag, chọn và sắp xếp các điểm dừng đã xuất bản) và tự xuất bản qua màn review bắt buộc; lần xuất bản đầu atomic với journey version 1.

**Why this priority**: FN-M03-001, FN-M03-005, FN-M03-006 là Must; tạo ra Published Route và `JourneySnapshot` cho M01.

**Independent Test**: Lưu nháp thiếu nội dung, xem panel "Còn thiếu để xuất bản", xuất bản tuyến đủ điều kiện, mô phỏng lỗi xuất bản.

**Acceptance Scenarios**:

1. **Given** giá trị nhập không hiển nhiên sai, **Then** lưu nháp luôn được; thiếu nội dung không chặn lưu (BR-M03-L01, C03).
2. **Given** editor, **Then** panel "Còn thiếu để xuất bản" luôn hiện và mỗi dòng nhảy tới trường cần sửa (BR-M03-L03).
3. **Given** không có ô nhập identifier; `routeId` do hệ thống sinh (BR-M03-B01).
4. **Given** bước 4, **Then** tác giả chọn điểm dừng từ thư viện điểm dừng đã xuất bản, kéo thả sắp xếp, mở chức năng điểm dừng để tạo mới rồi quay lại; mỗi dòng nêu tên, chế độ, số điểm tham quan và các tuyến khác đang dùng (BR-M03-T01, T02).
5. **Given** bấm Xuất bản, **Then** mở màn review bắt buộc: thay đổi, tác động, điểm dừng đóng bị loại khỏi hành trình, ước tính dung lượng gói offline (BR-M03-F02).
6. **Given** đủ điều kiện xuất bản (BR-M03-C04, T04) và xác nhận một lần, **Then** không cần người thứ hai (BR-M03-A05).
7. **Given** lần xuất bản đầu, **Then** atomic: tuyến, journey version 1 và trạng thái `HOAT_DONG`; không bao giờ xuất bản điểm dừng (BR-M03-C17, F04).
8. **Given** xuất bản lỗi, **Then** dữ liệu công khai nguyên vẹn và tác giả được báo rõ bằng tiếng Việt giản dị (BR-M03-F03, G07).
9. **Given** thời gian suy ra: nhãn thời gian suy từ `durationMin` (BR-M03-C11); tổ hợp tag mâu thuẫn bị chặn khi lưu nháp (BR-M03-C12); ước tính offline vượt trần chặn xuất bản (BR-M03-G10); cảnh báo an toàn trống cần tick xác nhận (BR-M03-C09); thay đổi cảnh báo, yêu cầu tham gia và tick sơ đồ offline được tô sáng trong review (BR-M03-C10).

---

### User Story 4 - Revise published data (Priority: P1)

Sửa dữ liệu đã xuất bản tạo hoặc tiếp tục một bản nháp chờ chung; bản xuất bản không đổi đến khi xuất bản; thay đổi ảnh hưởng hành trình tạo snapshot mới cho từng tuyến liên quan và chuyển tất cả cùng lúc.

**Why this priority**: FN-M03-005, FN-M03-006 là Must; US-M03-02.

**Independent Test**: Hai quản trị viên sửa cùng mục; sửa điểm dừng dùng chung bởi hai tuyến; đổi danh sách điểm dừng của tuyến.

**Acceptance Scenarios**:

1. **Given** sửa dữ liệu đã xuất bản, **Then** tạo/tiếp tục đúng một bản nháp chờ chung; phiên bản công khai giữ nguyên (BR-M03-F06).
2. **Given** lưu hoặc xuất bản với dữ liệu cũ (stale), **Then** bị từ chối bằng thông báo nêu ai sửa và khi nào, người dùng tải lại, không tự gộp, chữ đang gõ còn trên màn hình (BR-M03-F06, L05).
3. **Given** xuất bản, **Then** màn review nêu mọi tuyến bị ảnh hưởng; thay đổi làm đổi hành trình dựng snapshot mới cho từng tuyến và chuyển tất cả cùng lúc với thay đổi; thay đổi không đổi hành trình thì không tạo version mới (BR-M03-X02, G04, G05).
4. **Given** đổi danh sách hoặc thứ tự điểm dừng của tuyến đã xuất bản, **Then** đi qua màn review và tạo journey version mới chỉ cho tuyến đó (BR-M03-T06).
5. **Given** thao tác trên một tập kết nối (điểm dừng và các tuyến liệt kê nó), **Then** hai thao tác chia sẻ điểm dừng/tuyến không chạy cùng lúc; thao tác đến sau bị từ chối MSG-ROUTE-BUSY, không xếp hàng (BR-M03-F05).
6. **Given** version snapshot, **Then** `contentVersion` bắt đầu `1`, tăng `+1`, không bỏ số, nhận số trong switch atomic; snapshot cũ không đổi (BR-M03-G01, G03).
7. **Given** kích thước, **Then** không xuất bản/mở lại nếu ước tính offline vượt 50 MB (provisional); đóng điểm dừng và thu hồi QR không bị chặn bởi trần (BR-M03-G10).

---

### User Story 5 - Clear validation feedback — US-M03-09 (Priority: P1)

Mọi vấn đề hiện ngay dưới trường liên quan bằng tiếng Việt giản dị; một nút "Lưu bản nháp" lưu cả form hoặc không gì cả.

**Why this priority**: FN-M03-005 là Must.

**Independent Test**: Nhập giá trị sai, để thiếu nội dung, lưu lỗi/stale, kiểm tra không có thuật ngữ kỹ thuật hay dữ liệu thô.

**Acceptance Scenarios**:

1. **Given** giá trị có vấn đề, **Then** thông báo dưới đúng trường, dùng nhãn trong UI và chỉ cách sửa (BR-M03-L02, L04).
2. **Given** vấn đề sẽ chặn xuất bản nhưng đã phát hiện được khi lưu, **Then** báo ngay khi lưu.
3. **Given** panel "Còn thiếu để xuất bản", **Then** luôn hiện, mỗi dòng nhảy tới trường (BR-M03-L03).
4. **Given** lưu lỗi, **Then** không mất những gì người dùng đã gõ (BR-M03-L06).
5. **Given** lưu stale, **Then** nêu ai sửa và khi nào, kèm hành động Tải lại.
6. **Given** "Lưu bản nháp", **Then** lưu mọi thứ trong form (cả hai ngôn ngữ, danh sách media) hoặc không gì; "Đã lưu bản nháp" chỉ hiện khi tất cả được lưu; không autosave (BR-M03-F11).
7. **Given** mọi màn hình, **Then** không hiện JSON, tên trường, mã trạng thái, mã HTTP hay identifier nội bộ (ngoại lệ: 6 ký tự cuối của mã QR); mọi thông báo lấy từ danh mục §5.6 (BR-M03-L10, L11, L13).

---

### User Story 6 - Close and reopen — US-M03-04 (Priority: P1)

Đóng khẩn cấp tuyến hoặc điểm dừng (cả hai role), mở lại có kiểm soát và lưu trữ (chỉ Reviewer), kết quả xác định và có audit.

**Why this priority**: FN-M03-007 là Must; an toàn thực địa.

**Independent Test**: Đóng điểm dừng chia sẻ bởi nhiều tuyến; điểm dừng cuối của tuyến; mô phỏng lỗi tạo snapshot; mở lại bởi từng role.

**Acceptance Scenarios**:

1. **Given** cả hai role, **When** đóng tuyến hoặc điểm dừng, **Then** hộp thoại nêu hậu quả và yêu cầu lý do; với điểm dừng nêu mọi tuyến liệt kê và tuyến nào sẽ tự đóng (BR-M03-H01).
2. **Given** đóng khẩn cấp, **Then** không cần màn review, hiệu lực khi hoàn tất; đóng điểm dừng chỉ hoàn tất khi trạng thái điểm dừng và các snapshot thay thế của mọi tuyến liên quan được xuất bản atomic (BR-M03-H02).
3. **Given** tuyến không còn điểm dừng hoạt động, **Then** tự thành `TAM_DONG`; tuyến không bao giờ tự mở lại (BR-M03-H02, H07, T05).
4. **Given** chỉ Reviewer, **When** mở lại, **Then** cần ghi chú xác nhận an toàn và các kiểm tra kỹ thuật (BR-M03-H06, H07).
5. **Given** không hành động nào cố dừng/thông báo phiên M02 đang chạy; hệ thống không bảo đảm cảnh báo tức thì cho người đang offline; Ban Quản lý xử lý cảnh báo tại chỗ (BR-M03-H05).
6. **Given** đóng điểm dừng không hoàn tất, **Then** báo lỗi, giữ nguyên trạng thái, không bao giờ báo thành công giả; thông báo đề nghị "Đóng tạm các tuyến liên quan" (BR-M03-H04).
7. **Given** lưu trữ tuyến (chỉ Reviewer, khi `TAM_DONG`) là terminal (BR-M03-H09).

---

### User Story 7 - Live QR lookup — US-M03-04 mục 7, FR-M03-012 (Priority: P1)

M03 trả cho M02 kết quả tra cứu QR công khai (`VALID`, `TEMPORARILY_CLOSED`, `INVALID`) kèm nội dung của chính mã đó.

**Why this priority**: FN-M03-009 là Must; M02 và khách tự do phụ thuộc.

**Independent Test**: Gọi lookup với QR hoạt động/nháp/thu hồi, điểm dừng đóng, route đóng/lưu trữ/không rõ, có/không `routeId`, lỗi nguồn.

**Acceptance Scenarios**:

1. **Given** request có `qrIdentifier` (khớp chính xác sau trim) và `routeId` tùy chọn, **Then** lookup dùng dữ liệu công khai hiện hành, không dùng snapshot, cho cả hai connectivity mode (BR-M03-I01).
2. **Given** thứ tự đánh giá của BR-M03-I02, **Then** kết quả tất định: `INVALID`, `TEMPORARILY_CLOSED` (scope `ROUTE` hoặc `CHECKPOINT`) hoặc `VALID`; lỗi kiểm tra được báo riêng, không bao giờ là `INVALID`.
3. **Given** `VALID`, **Then** trả tên điểm dừng (vi/en), chế độ kết nối, tên đối tượng, giới thiệu (vi/en), ảnh và audio/video (chỉ `ONLINE_AVAILABLE`) của riêng điểm tham quan đó; không có dữ liệu route (BR-M03-I03).
4. **Given** `TEMPORARILY_CLOSED`, **Then** không trả nội dung ghé để M02 hiện hướng dẫn an toàn; chỉ nội dung đã xuất bản được trả, bản nháp không rò rỉ; lookup không ghi dữ liệu du khách (BR-M03-I04).

---

### User Story 8 - History, restore and audit — US-M03-08 (Priority: P1; màn nhật ký toàn hệ thống: P2)

Mỗi tuyến/điểm dừng/QR object có lịch sử xuất bản; quản trị viên khôi phục bản cũ thành bản nháp, bỏ bản nháp; mọi thao tác được audit.

**Why this priority**: FN-M03-011 là Must; riêng màn nhật ký toàn hệ thống cho Reviewer là Should (MVP-Scope §3.4).

**Independent Test**: Xuất bản hai lần, khôi phục bản đầu, thử khôi phục khi đã có bản nháp, bỏ bản nháp, đọc audit của lần tự xuất bản.

**Acceptance Scenarios**:

1. **Given** mỗi mục, **Then** hiện lịch sử đã xuất bản (BR-M03-F09).
2. **Given** khôi phục, **Then** bản cũ thành bản nháp chờ mới (bị chặn khi đã có bản nháp) và đi qua review như thường; nếu nội dung vi phạm giới hạn hiện hành thì bị từ chối với MSG-RESTORE-BLOCKED và không tạo gì; lịch sử không bị xóa (BR-M03-F07).
3. **Given** "Bỏ thay đổi", **Then** bản nháp thành `DA_BO`, bản xuất bản không đổi và có dòng audit (BR-M03-F10).
4. **Given** mọi thao tác quản trị, **Then** ghi đúng một dòng audit: ai, khi nào, đối tượng, trước/sau, kết quả, lý do khi cần; thay đổi tự xuất bản được gắn cờ "tự xuất bản"; không có mật khẩu/secret (BR-M03-F08).
5. **Given** Reviewer, **Then** có nhật ký toàn hệ thống bằng ngôn ngữ giản dị, append-only (BR-M03-F09, A03).

---

### User Story 9 - Ingest sessions and report — US-M03-06 (Priority: P2)

M03 nhận bản ghi phiên terminal ẩn danh bất biến từ M02, kiểm tra theo snapshot và cung cấp hai báo cáo vận hành.

**Why this priority**: FN-M03-010 là Should; phải cùng increment với M02 Terminal Sync (MVP-Scope §1).

**Independent Test**: Gửi bản ghi hợp lệ; gửi lại giống hệt; gửi khác nội dung; `routeId`/`contentVersion` không rõ; xem RPT-01/RPT-02 theo khoảng ngày.

**Acceptance Scenarios**:

1. **Given** chỉ bản ghi terminal `HOAN_TAT` hoặc `BO_DO` ẩn danh được chấp nhận (BR-M03-J01).
2. **Given** bản ghi đầu tiên cho một UUID, **Then** tạo bản ghi; gửi lại giống hệt thành công idempotent (BR-M03-J03).
3. **Given** cùng `sessionId` nhưng nội dung khác, **Then** từ chối là conflict và giữ bản ghi đầu.
4. **Given** `routeId` không biết hoặc `contentVersion` không phải snapshot đã xuất bản của tuyến đó, **Then** từ chối là không hợp lệ; mọi điểm dừng đã ghé phải khớp snapshot (BR-M03-J02, SC-M03-038).
5. **Given** tuyến ở mọi trạng thái (kể cả `TAM_DONG`, `LUU_TRU`), **Then** vẫn nhận phiên (BR-M03-J04).
6. **Given** RPT-01 và RPT-02 dùng `endedAt` và `Asia/Ho_Chi_Minh`, mặc định 30 ngày, tối đa 366 ngày, không real-time; RPT-02 kèm tên tuyến (BR-M03-J05, J06, J07).
7. **Given** trang báo cáo, **Then** nêu bằng ghi chú một dòng thời điểm cập nhật, rằng chỉ tính các chuyến đã kết thúc và gửi về hệ thống, và rằng lượt ghé là một lượt quét QR chứ không phải bằng chứng có mặt (BR-M03-J08).

---

### Edge Cases

Nguồn: spec-M03 §4, §5.2, §9, §10.

- Lưu nháp thiếu nội dung vẫn được; xuất bản bị chặn và liệt kê từng thiếu sót (BR-M03-C03, C04).
- Trường song ngữ tùy chọn chỉ có một ngôn ngữ: lưu nháp được, chặn xuất bản (BR-M03-C06).
- Xóa ảnh sơ đồ tuyến khi tick sơ đồ offline đang bật: tick bị tự bỏ và báo cho tác giả (BR-M03-C16).
- Điểm dừng xuất hiện hai lần trong một tuyến; vượt 30 điểm dừng; vượt 20 QR; tên điểm dừng trùng (so sánh bản nháp và bản xuất bản, không phân biệt hoa/thường): chặn khi lưu (BR-M03-T09, E02, D03).
- Đổi điểm dừng từ `ONLINE_AVAILABLE` sang `OFFLINE_REQUIRED` khi còn audio/video: chặn khi lưu (MSG-MODE-HAS-AV, BR-M03-D02).
- Audio/video thiếu `spokenLanguage`: điểm tham quan chưa sẵn sàng; chỉ có một ngôn ngữ: cảnh báo ở review, không chặn (BR-M03-E05, E17).
- Collision identifier khi sinh: tự sinh lại, người dùng không thấy lỗi trùng (BR-M03-B03).
- Một route `HOAT_DONG` luôn có ít nhất một điểm dừng hoạt động; xuất bản làm tuyến hết điểm dừng hoạt động bị chặn (BR-M03-T05).
- Điểm dừng đóng vẫn giữ vị trí trong danh sách của tuyến nhưng không thuộc hành trình (BR-M03-T02).
- Lỗi dựng snapshot của bất kỳ tuyến nào: toàn bộ thao tác thất bại, dữ liệu công khai nguyên vẹn, không tự thử lại, có audit (BR-M03-G07).
- Tuyến `TAM_DONG` vẫn sửa và xuất bản được nhưng không tự mở lại (BR-M03-H08).
- Ảnh/media đã xuất bản không bị ghi đè; đối tượng còn được snapshot lưu giữ không bị xóa (constitution IV; BR-M03-G08).
- Không có xóa vật lý bất kỳ bản ghi đã lưu (BR-M03-D12).
- Offline: M03 chỉ online; không có đồng bộ nháp offline (spec-M03 §1 Out of scope).
- Phiên không bao giờ gửi hoặc bản ghi giả đúng định dạng: chấp nhận rủi ro trong MVP (spec-M03 §9).

## Requirements *(mandatory)*

### Functional Requirements

Mỗi dòng giữ nguyên ID; BR/§ là tham chiếu nguồn, chi tiết đầy đủ nằm ở spec-M03 §5.2.

- **FR-M03-001**: Tạo/cập nhật bản nháp tuyến: thông tin song ngữ, ảnh, yêu cầu tham gia, cảnh báo an toàn, điểm xuất phát, hai nhóm tag chọn được, giá trị hệ thống suy ra (nhãn thời gian, số điểm dừng, cờ offline), lựa chọn đưa sơ đồ tuyến vào gói offline, và thứ tự các điểm dừng đã xuất bản. (BR-M03-C01…C17, T01…T09)
- **FR-M03-002**: Tạo/cập nhật điểm dừng độc lập với tuyến trong thư viện dùng chung: định danh do hệ thống sinh, tên song ngữ, tên tiếng Việt duy nhất, chế độ kết nối; một điểm dừng có thể được nhiều tuyến liệt kê. (BR-M03-D01…D12)
- **FR-M03-003**: Quản lý nhiều QR object cho mỗi điểm dừng với identifier do hệ thống sinh không đoán được, link QR công khai cố định mã hóa trong ảnh mã tải xuống được. (BR-M03-B01…B05, E07, E09, E10, E15, E16)
- **FR-M03-004**: Quản lý nội dung song ngữ riêng từng QR (tên đối tượng, giới thiệu), ảnh và, chỉ cho điểm dừng có mạng, audio/video tùy chọn với giới hạn kích thước/số lượng và xác nhận quyền sử dụng. (BR-M03-E01…E06, E14, E17)
- **FR-M03-005**: Kiểm tra hai mức (khi lưu và khi xuất bản) với thông báo cấp trường bằng tiếng Việt giản dị và panel "Còn thiếu để xuất bản". (BR-M03-L01…L13, F11)
- **FR-M03-006**: Cung cấp màn review xuất bản bắt buộc; cho phép bất kỳ quản trị viên nào xuất bản; áp quyền theo role phía server. (BR-M03-A01…A05, F01, F02)
- **FR-M03-007**: Duy trì Revision: một bản nháp chờ mỗi mục, lịch sử phiên bản, khôi phục, bỏ bản nháp; từ chối stale write không tự gộp; tuần tự hóa thao tác trên mỗi tập tuyến/điểm dừng kết nối. (BR-M03-F05, F06, F07, F10)
- **FR-M03-008**: Xuất bản trạng thái đầu của tuyến atomic với journey version 1; xuất bản điểm dừng cùng các điểm tham quan sẵn sàng độc lập với tuyến. (BR-M03-C17, D05, E13, F03, F04)
- **FR-M03-009**: Xuất bản snapshot bất biến mới cho mọi tuyến bị ảnh hưởng, chuyển tất cả cùng lúc; số version liên tục theo tuyến; trần dung lượng offline và ước tính dung lượng tùy chọn. (BR-M03-G01…G10, X02)
- **FR-M03-010**: Giữ các phiên bản snapshot mà không cần M01 xác nhận. (BR-M03-G08)
- **FR-M03-011**: Đóng, mở lại và lưu trữ tuyến/điểm dừng; đóng/mở lại điểm dừng áp dụng cho mọi tuyến liệt kê nó; kết quả tuyến tất định; chuyển snapshot atomic; thu hồi và in lại QR. (BR-M03-H01…H09, D10, E07, E09)
- **FR-M03-012**: Tra cứu QR (kèm route tùy chọn) ra kết quả live `VALID` / `TEMPORARILY_CLOSED` / `INVALID` với nội dung của chính QR đó và báo riêng lỗi nguồn. (BR-M03-I01…I06)
- **FR-M03-013**: Xác thực truy cập quản trị; quản lý lời mời, khôi phục mật khẩu và hai role cố định; đăng xuất; khởi tạo và bảo vệ Reviewer đang hoạt động. (BR-M03-A01…A04, K01…K06)
- **FR-M03-014**: Nhận bản ghi phiên terminal ẩn danh bất biến một cách idempotent, kiểm tra route và version. (BR-M03-J01…J04)
- **FR-M03-015**: Cung cấp RPT-01 (phiên theo tuyến/trạng thái/ngày). (BR-M03-J05, J06, J08)
- **FR-M03-016**: Cung cấp RPT-02 (lượt ghé điểm dừng duy nhất theo tuyến/ngày). (BR-M03-J05, J07, J08)
- **FR-M03-018**: Ghi audit log chỉ nối thêm và hiển thị lịch sử từng mục cùng nhật ký toàn hệ thống cho Reviewer. (BR-M03-F08, F09)
- **FR-M03-019**: Chỉ hiện cho nhân viên tiếng Việt giản dị: tên hiển thị của mọi trạng thái, thông báo từ danh mục cố định, không bao giờ dữ liệu thô hay mã kỹ thuật. (BR-M03-L04, L09…L13; §5.4–5.6)

> FR-M03-017 đã retire (xóa cùng US-M03-07), không dùng lại.

### Key Entities *(include if feature involves data)*

Nguồn: spec-M03 §6. Chỉ mô tả vai trò; kiểu dữ liệu và ràng buộc vật lý thuộc plan/data-model.

- **Route**: hành trình trong ngày; vòng đời `NHAP → HOAT_DONG → TAM_DONG → LUU_TRU`; thứ tự điểm dừng thuộc về tuyến.
- **Checkpoint**: khu vực thực trong thư viện dùng chung, song ngữ, có chế độ kết nối; không có thứ tự và không có giới thiệu riêng.
- **QRCode (QR object / visit point)**: một mã gắn một thứ; sở hữu nội dung song ngữ; vòng đời `NHAP → HOAT_DONG → THU_HOI`.
- **Revision**: một phiên bản nội dung chỉnh sửa được của tuyến, điểm dừng hoặc QR object (thay cho `CheckpointContent`); trạng thái gồm `NHAP`, `PHAT_HANH`, `LUU_TRU` (bản cũ), `DA_BO`. Nội dung đã xuất bản hiện hành là projection của revision `PHAT_HANH`, không phải entity mới.
- **Media**: ảnh/audio/video thuộc điểm dừng, mang `spokenLanguage` (`vi` / `en` / `NONE`) cho audio/video.
- **JourneySnapshot**: ảnh bất biến của hành trình một tuyến, định danh bởi `(routeId, contentVersion)`.
- **AdminAccount**: role cố định `CONTENT_STAFF` hoặc `REVIEWER`, trạng thái gồm `INVITATION_PENDING`.
- **SessionRecord**: entity canonical lưu bản ghi phiên terminal đã chấp nhận cộng `ingestedAt`; khác `SessionSyncRecord`.
- **AuditRecord**: bản ghi audit chỉ nối thêm.

## Success Criteria *(mandatory)*

### Measurable Outcomes

Giữ nguyên SC-M03-001…040 (spec-M03 §7), trừ SC-M03-018 và SC-M03-027 đã retire:

- **SC-M03-001**: Không tuyến nào chọn được nếu thiếu metadata song ngữ, ảnh/thông tin bắt buộc, tag hợp lệ, ít nhất một điểm dừng hoạt động và snapshot đã xuất bản.
- **SC-M03-002**: Consumer không bao giờ thấy snapshot hay trạng thái công khai mới ở dạng dở dang.
- **SC-M03-003**: Mọi lần xuất bản ảnh hưởng hành trình tạo version đánh số liên tục và giữ nguyên snapshot cũ.
- **SC-M03-004**: Thay mã của điểm tham quan không bao giờ để điểm dừng hoạt động không còn identifier dùng được: QR hoạt động cuối không thu hồi được.
- **SC-M03-005**: Stale save không bao giờ ghi đè dữ liệu quản trị mới hơn.
- **SC-M03-006**: Đóng điểm dừng cập nhật tất định các hành trình mới của mọi tuyến liệt kê nó; không bị chặn bởi trần dung lượng và không báo thành công giả.
- **SC-M03-007**: Gửi lại phiên giống hệt không tạo trùng phiên hay lượt ghé; gửi lại khác nội dung bị từ chối.
- **SC-M03-008**: Reviewer hoạt động cuối không thể bị gỡ hay hạ role.
- **SC-M03-009**: Danh tính nhà cung cấp không có `AdminAccount` hoạt động tương ứng không truy cập được thao tác M03 được bảo vệ nào.
- **SC-M03-010**: Môi trường trống nhận đúng một Reviewer đầu tiên mà không lộ việc khởi tạo qua trình duyệt/API công khai.
- **SC-M03-011**: Lời mời hay khôi phục mật khẩu không bao giờ cấp hay đổi role ứng dụng.
- **SC-M03-012**: Quét hai QR object khác của cùng điểm dừng trả hai nội dung khác nhau; không bao giờ trả nội dung dùng chung cấp điểm dừng.
- **SC-M03-013**: Không quản trị viên nào gõ hay đổi được identifier; identifier duy nhất, không đoán được và không dùng lại.
- **SC-M03-014**: Mọi quản trị viên xuất bản bản nháp của mình chỉ qua màn review; mọi lần xuất bản được audit với người thực hiện và giá trị trước/sau, gắn cờ khi tự xuất bản.
- **SC-M03-015**: Nhãn thời gian luôn bằng nhãn suy từ thời lượng; tổ hợp tag mâu thuẫn không lưu được.
- **SC-M03-016**: Thông báo kiểm tra hiện tại trường bằng tiếng Việt giản dị không có thuật ngữ kỹ thuật; lưu lỗi không mất chữ đã gõ.
- **SC-M03-017**: Lookup phân biệt `VALID`, `TEMPORARILY_CLOSED`, `INVALID`; không bao giờ báo lỗi nguồn là `INVALID`.
- **SC-M03-019**: Tuyến không bao giờ tự mở lại.
- **SC-M03-020**: Không xuất bản hay mở lại nào tạo snapshot có ước tính offline vượt trần (provisional 50 MB); đóng điểm dừng và thu hồi QR được miễn.
- **SC-M03-021**: Khôi phục bản cũ trả về bản nháp chờ phải qua review; không mất lịch sử.
- **SC-M03-022**: Bật/tắt hoặc đổi sơ đồ offline tạo journey version mới; sơ đồ không được đánh dấu không bao giờ vào snapshot.
- **SC-M03-023**: Lookup QR trong điểm dừng/tuyến đóng trả `TEMPORARILY_CLOSED` và không có nội dung ghé.
- **SC-M03-024**: Ước tính dung lượng snapshot không tính audio/video; thiếu ước tính không chặn tải.
- **SC-M03-025**: Audio/video không bao giờ gắn vào QR object của điểm dừng `OFFLINE_REQUIRED`; điểm dừng không đổi sang offline khi còn audio/video.
- **SC-M03-026**: Không màn hình nào hiện JSON, tên trường, mã trạng thái, mã HTTP hay identifier nội bộ (trừ 6 ký tự cuối của mã QR); mọi thông báo từ danh mục.
- **SC-M03-028**: Điểm dừng được tạo và xuất bản một lần, nhiều tuyến liệt kê được; nội dung không bị nhân bản theo tuyến.
- **SC-M03-029**: Một thay đổi trên điểm dừng dùng chung cập nhật mọi tuyến liệt kê nó cùng lúc hoặc không tuyến nào.
- **SC-M03-030**: Tuyến `HOAT_DONG` luôn có ít nhất một điểm dừng hoạt động; ngược lại bị đóng.
- **SC-M03-031**: Điểm dừng mà tuyến chưa lưu trữ liệt kê thì không lưu trữ được.
- **SC-M03-032**: Có thể luôn xem trước bản nháp điểm tham quan như du khách trước khi xuất bản; bản xem trước không bao giờ hiện cho du khách hay bị nhầm với bản đã xuất bản.
- **SC-M03-033**: Một "Lưu bản nháp" lưu cả form hoặc không gì; upload hay lưu lỗi không xóa tệp đã tải thành công.
- **SC-M03-034**: Chỉ thêm được điểm tham quan vào điểm dừng đã lưu có chế độ kết nối; không có identifier QR trước lần lưu đầu của form.
- **SC-M03-035**: Trang báo cáo luôn nêu thời điểm cập nhật, rằng số liệu không real-time và lượt ghé là lượt quét QR, bằng ghi chú một dòng từ danh mục.
- **SC-M03-036**: Mọi mã in quét bằng camera điện thoại mở app du khách tại link QR công khai, và link còn hiệu lực suốt đời mã.
- **SC-M03-037**: Ảnh mã tạo ngoài Production luôn đánh dấu là mã thử; mã của điểm dừng offline-required luôn mang cảnh báo tải trước.
- **SC-M03-038**: Bản ghi phiên có điểm dừng đã ghé không khớp snapshot nó nêu (identity, tên tiếng Việt hoặc sequence) bị từ chối và không bao giờ vào báo cáo.
- **SC-M03-039**: Mọi tệp audio/video đã xuất bản mang ngôn ngữ nói; du khách chỉ thấy tệp của ngôn ngữ đã chọn cộng tệp không lời.
- **SC-M03-040**: Sau đăng xuất không request M03 nào được bảo vệ thành công đến khi đăng nhập lại; đăng xuất không đổi role hay status.

## Assumptions

Nguồn: spec-M03 §9, §10. Quyết định người dùng 2026-10-29: build toàn bộ M03 kể cả mục Should; giữ một package.

- Tồn tại ít nhất một Reviewer dự phòng ngoài Reviewer đầu tiên.
- Vận hành công viên khảo sát thực địa kết nối, triển khai biện pháp an toàn vật lý và cảnh báo người đang trên tuyến; Ban Quản lý quyết định sơ đồ tuyến nào cần khi không có mạng.
- Tuyến là hành trình trong ngày; thứ tự điểm dừng ít đổi; nhân viên hiểu một điểm dừng có thể dùng chung và sửa nó đổi mọi tuyến liệt kê.
- Nhà cung cấp xác thực lo mật khẩu, token lời mời/khôi phục và phiên; M03 lo role ứng dụng và trạng thái hoạt động.
- Chấp nhận rủi ro: vì mọi quản trị viên tự xuất bản, một lỗi có thể thành công khai ngay; kiểm soát bù là màn review bắt buộc, khôi phục phiên bản và audit.
- Lookup công khai và intake phiên mở cho bất kỳ ai, không cần tài khoản.
- Domain Production cố định được bảo đảm trước khi in mã thật.
- Dependency: M03 là producer của Published Route, `JourneySnapshot`, `LiveQrLookupResult`/`LiveStationContent`; M02 là producer của `SessionSyncRecord`. Không có hàng đợi duyệt, không có người duyệt thứ hai (BR-M03-A05).
- Không có message broker, cron hay scheduler trong backend MVP; báo cáo truy vấn theo yêu cầu (constitution VII). Không hard-delete hay purge tự động thực thể canonical M03 (DEC-S6-002).

### Giới hạn provisional (spec-M03 §5.3)

Tất cả là hằng cấu hình **provisional**, phải kiểm chứng trên giao diện và thiết bị thật; không phải business rule đã xác nhận. Chủ dự án chịu trách nhiệm kiểm chứng trước lần phát hành thật đầu tiên (spec-M03 §9). Giá trị giữ nguyên theo nguồn:

- Tên (tuyến, điểm dừng, QR object, mỗi ngôn ngữ): `NAME_MAX_CHARS` = 100. Mô tả ngắn: 160. Mô tả đầy đủ: 2000. Điểm xuất phát: 500. Yêu cầu tham gia: 300. Chuẩn bị: 500. Thời điểm phù hợp: 200. Cảnh báo an toàn: 500. Điểm nhấn: 5 mục × 80 ký tự. Chú thích: 200. Ghi chú/lý do: `NOTE_MAX_CHARS` = 300. Giới thiệu QR: 30 đến 2000.
- Ảnh gallery tối đa 8; quãng đường tối đa 100 km (một chữ số thập phân); thời lượng tối đa 1440 phút; điểm dừng mỗi tuyến tối đa 30; QR mỗi điểm dừng (không `THU_HOI`) tối đa 20; ảnh/QR tối đa 5; tệp audio-video/QR tối đa 3; khoảng báo cáo tối đa 366 ngày.
- Kích thước tệp: ảnh 2 MB, audio 5 MB, video 30 MB (1 MB = 1 048 576 byte). `OFFLINE_PACKAGE_MAX_MB` = 50. Email tối đa 254 ký tự sau chuẩn hóa. `QR_CODE_DISPLAY_SUFFIX_CHARS` = 6.
- In mã: sửa lỗi mức `Q`, PNG tối thiểu 1024 px, quiet zone 4 module, rộng tối thiểu in 3 cm. Loại tệp hỗ trợ: JPEG, PNG, WebP; MP3, M4A; MP4.
- `QR_PUBLIC_BASE_URL` là cấu hình môi trường (xem NEEDS CLARIFICATION bên dưới).

### Open clarifications

Không còn mục `[NEEDS CLARIFICATION]` mở. Các quyết định (người dùng, 2026-10-29):

- **`QR_PUBLIC_BASE_URL` Production**: giữ nguyên như spec-M03 BR-M03-B04 và §9: là cấu hình môi trường; domain vĩnh viễn do dự án sở hữu phải được chốt **trước khi in tem thật** (release gate của chủ dự án, MVP-Scope §5). Không chặn build, dev và staging dùng giá trị theo môi trường; mã tạo ngoài Production luôn có nhãn "BẢN THỬ — KHÔNG DÁN RA THỰC ĐỊA" (BR-M03-B05).
- **Chống lạm dụng (rate limiting) cho lookup công khai và intake phiên**: giao cho tài liệu architecture (spec-M03 §9); không phải requirement hành vi. MVP chấp nhận rủi ro đã nêu: bản ghi giả đúng định dạng có thể vào báo cáo.
- **Phiên bản M02 chuẩn**: v3.3. spec-M03 đã được sửa thành v3.3 ở §11 và Completion checklist (change note 3.7 clarification 5).

## Traceability (ID → section nguồn)

Tất cả ID bên dưới tồn tại trong [docs/spec/spec-M03.md](../../docs/spec/spec-M03.md). Cột Function/Priority lấy từ MVP-Scope §3.3, §3.4 và [function-list-M03.md](../../docs/function%20list/function-list-M03.md). BR viết tắt bỏ tiền tố `BR-M03-` theo quy ước spec-M03 §11.1.

| User story | US (spec §) | FR | BR | SC | Function / Priority |
|---|---|---|---|---|---|
| Story 1 | US-M03-05 (§3) | FR-M03-013 | A01–A04, K01–K06 | SC-M03-008, 009, 010, 011, 040 | FN-M03-008 / Must |
| Story 2 | US-M03-03 (§3) | FR-M03-002, 003, 004 | B01–B05, D01–D12, E01–E17 (E08 retired), F11, F12 | SC-M03-004, 012, 013, 025, 028, 031, 032, 033, 034, 036, 037, 039 | FN-M03-002, 003, 004 / Must; F12 (xem trước) Should |
| Story 3 | US-M03-01 (§3) | FR-M03-001, 005, 006, 008 | C01–C17, T01–T09, F01–F04, G01–G03 | SC-M03-001, 002, 015, 022, 030 | FN-M03-001, 005, 006 / Must |
| Story 4 | US-M03-02 (§3) | FR-M03-007, 009 | F02–F07, F10, X01–X03, G04–G07 | SC-M03-003, 005, 020, 021, 024, 029 | FN-M03-005, 006 / Must |
| Story 5 | US-M03-09 (§3) | FR-M03-005, 019 | L01–L13 | SC-M03-016, 026 | FN-M03-005 / Must |
| Story 6 | US-M03-04 (§3) | FR-M03-011 | H01–H09 | SC-M03-006, 019, 023 | FN-M03-007 / Must |
| Story 7 | US-M03-04 mục 7 (§3), flow §4.6 | FR-M03-012 | I01–I06 | SC-M03-017, 023 | FN-M03-009 / Must |
| Story 8 | US-M03-08 (§3) | FR-M03-007, 018 | A05, F07–F10 | SC-M03-014, 021 | FN-M03-011 / Must; nhật ký toàn hệ thống Should |
| Story 9 | US-M03-06 (§3) | FR-M03-014, 015, 016 | J01–J08 | SC-M03-007, 035, 038 | FN-M03-010 / Should |
| Không có user story | — | FR-M03-010 | G08 | — | FN-M03-006 |

| Mục trong file này | Section nguồn |
|---|---|
| Ranh giới Producer → Consumer | spec-M03 §1, §5.1, §11; AGENTS.md §3.2 |
| Edge Cases | spec-M03 §4, §5.2, §9, §10 |
| Key Entities | spec-M03 §6.1–6.4 |
| Giới hạn provisional | spec-M03 §5.3 |
| Priority | MVP-Scope §3.3, §3.4 |
| Traceability gốc | spec-M03 §11.1 (US → FR → BR → SC) |
