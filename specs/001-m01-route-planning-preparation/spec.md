# Feature Specification: M01 — Route Planning & Preparation

**Feature Branch**: `001-m01-route-planning-preparation` *(định danh thư mục; chưa tạo git branch)*

**Created**: 2026-10-29

**Status**: Draft — bản dẫn xuất (Layer 3) từ [docs/spec/spec-M01.md](../../docs/spec/spec-M01.md) v3.2

**Input**: Change Brief CHG-M01-2026-10-29-01. Nguồn chuẩn: spec-M01 v3.2; ranh giới priority: [MVP-Scope.md](../../MVP-Scope.md) §3.1, §3.4. Producer: spec-M03 v3.7. Consumer: spec-M02 v3.3.

> **Quy tắc dẫn xuất.** File này không phải nguồn sự thật. Mọi hành vi và contract lấy từ spec-M01; nếu mâu thuẫn, spec canonical thắng. Không thêm requirement, không đổi tên contract (`LanguagePreference`, `SelectedRouteContext v3`, `OfflinePackage`, Published Route, `JourneySnapshot`). Không có chi tiết kỹ thuật (tech stack thuộc plan).

## Ranh giới Producer → Consumer

| Hướng | Contract | Ghi chú (nguồn: spec-M01 §1.4, §5.3, §11.2) |
|---|---|---|
| M03 → M01 | Published Route projection | M01 chỉ đọc; không sửa dữ liệu M03. |
| M03 → M01 | `JourneySnapshot` | Bất biến; M01 sao chép, không dựng lại hành trình. |
| M01 → M02 | `LanguagePreference` | M01 là writer duy nhất. |
| M01 → M02 | `SelectedRouteContext v3` | Một lần dùng, `expiresAt` = `authorizedAt` + 24 giờ, ghi atomic. |
| M01 → M02 | `OfflinePackage` đang active, `SAN_SANG` | Có thể `OUTDATED`; không bao giờ lộ staging/partial. |

## User Scenarios & Testing *(mandatory)*

Priority theo MVP-Scope. Quyết định người dùng (2026-10-29): build toàn bộ chức năng; vì increment có điểm dừng `OFFLINE_REQUIRED`, nhóm gói offline (FN-M01-004/005) được xử lý như **Must** theo chú thích `*` của MVP-Scope §3.1.

### User Story 1 - Choose language — US-M01-01 (Priority: P1)

Du khách chọn `vi` hoặc `en`; lựa chọn được lưu và chia sẻ với M02. Nút VI/EN có trên mọi màn hình du khách, kể cả trang link QR của M02.

**Why this priority**: FN-M01-001 là Must; M02 dùng chung `LanguagePreference`.

**Independent Test**: Mở app lần đầu, chọn ngôn ngữ, đổi ngôn ngữ offline; kiểm tra giá trị được lưu và UI đổi ngay.

**Acceptance Scenarios**:

1. **Given** chưa chọn ngôn ngữ, **When** vào bằng lối vào thông thường, **Then** M01 yêu cầu chọn `vi` hoặc `en` trước khi tiếp tục; vào bằng link QR công khai (BR-M02-024) thì không hiện bước này và dùng ngôn ngữ thiết bị (tiếng Việt nếu thiết bị là tiếng Việt, ngược lại tiếng Anh) cho đến khi du khách đổi.
2. **Given** đã có ngôn ngữ, **When** đổi ngôn ngữ khi offline, **Then** UI đóng gói và nội dung có sẵn cục bộ đổi ngôn ngữ mà không đổi trạng thái package.
3. **Given** bất kỳ màn hình du khách nào, **When** bấm nút VI/EN, **Then** `LanguagePreference` cập nhật ngay.

---

### User Story 2 - Browse routes — US-M01-02, phần duyệt (Priority: P1)

Du khách xem danh mục tuyến dạng thẻ (thumbnail, tên và mô tả ngắn theo ngôn ngữ, quãng đường, thời lượng, độ khó, số điểm dừng, dấu "cần tải trước").

**Why this priority**: FN-M01-002 là Must và là điểm vào của đường đi tối thiểu.

**Independent Test**: Với dữ liệu Published Route mẫu gồm tuyến `HOAT_DONG`, `TAM_DONG`, `LUU_TRU`; chỉ tuyến `HOAT_DONG` có `activeContentVersion` hợp lệ xuất hiện.

**Acceptance Scenarios**:

1. **Given** dữ liệu đã xuất bản, **When** mở danh mục, **Then** chỉ hiện tuyến `status = HOAT_DONG` có `activeContentVersion` hợp lệ, mỗi tuyến là một thẻ đủ các trường trên.
2. **Given** ảnh thẻ không tải được, **Then** hiện placeholder trung tính và thẻ vẫn dùng được.
3. **Given** offline, **Then** giữ view cục bộ gần nhất và không khẳng định đó là bản hiện hành (FR-M01-002).

---

### User Story 3 - View route details — US-M01-06 (Priority: P1)

Du khách xem trang chi tiết tuyến: gallery (ảnh đầu là ảnh bìa), mô tả đầy đủ, điểm xuất phát và cách đến, quãng đường, thời lượng, độ khó, điểm nhấn, tên các điểm dừng theo thứ tự; khi có thì thêm yêu cầu tham gia, chuẩn bị, thời điểm phù hợp, sơ đồ tuyến, cảnh báo an toàn (nổi bật).

**Why this priority**: FN-M01-002 (Must); US-M01-06 mục 3–4 dùng essential texts của FR-M01-014.

**Independent Test**: Mở một tuyến online và một tuyến offline có package; so sánh các trường hiển thị và thông báo "Thông tin được lưu lúc …".

**Acceptance Scenarios**:

1. **Given** một tuyến được chọn, **Then** hiện đủ các trường bắt buộc theo ngôn ngữ đã chọn; trường tùy chọn vắng thì không hiện và không có placeholder chữ.
2. **Given** offline và package sẵn sàng, **Then** hiện essential texts đã lưu (tên, cảnh báo an toàn, điểm xuất phát, yêu cầu tham gia) kèm thông báo thời điểm lưu và rằng có thể không phải bản mới nhất; ảnh chưa lưu hiện placeholder.
3. **Given** online và đọc nguồn thành công, **Then** chi tiết hiển thị và essential texts đã lưu được làm mới.

---

### User Story 4 - Start a route — US-M01-04 (Priority: P1)

Du khách bấm Start: online dùng snapshot hiện hành; offline dùng manifest của package `SAN_SANG`. M01 tạo `SelectedRouteContext v3` một lần dùng, hạn 24 giờ.

**Why this priority**: FN-M01-006 và FN-M01-007 là Must; là cầu nối sang M02.

**Independent Test**: Start online với tuyến không cần package; Start offline có/không có package `SAN_SANG`; kiểm tra context ghi atomic và `expiresAt`.

**Acceptance Scenarios**:

1. **Given** online, **When** Start, **Then** M01 xác nhận tuyến/snapshot hiện hành và tạo handoff từ snapshot hiện hành.
2. **Given** offline và package `SAN_SANG`, **When** Start, **Then** tạo handoff từ manifest của package đó.
3. **Given** offline và không có package `SAN_SANG`, **Then** Start bị chặn.
4. **Given** mỗi lần Start thành công, **Then** có `handoffId` mới, `expiresAt` = `authorizedAt` + 24 giờ; Start lại thay context trước; nếu lỗi thì context trước giữ nguyên (FR-M01-012).

---

### User Story 5 - Route becomes unavailable — US-M01-05 (Priority: P1)

Sau khi làm mới nguồn thành công và thấy tuyến `TAM_DONG` hoặc `LUU_TRU`, tuyến biến mất khỏi lựa chọn mới.

**Why this priority**: BR-M01-011 là điều kiện an toàn của Start.

**Independent Test**: Mô phỏng nguồn trả tuyến `TAM_DONG`; kiểm tra tuyến bị ẩn, context hiện tại thành `REVOKED`, phiên đã tạo không bị đụng.

**Acceptance Scenarios**:

1. **Given** làm mới nguồn thành công báo tuyến đóng/lưu trữ, **Then** tuyến không còn trong lựa chọn mới và Start mới bị chặn.
2. **Given** context hiện tại của tuyến đó, **Then** nó thành `REVOKED`; M01 không cần biết M02 đã dùng hay chưa.
3. **Given** một phiên M02 đã được tạo từ context đó, **Then** M01 không xóa hay kết thúc phiên.

---

### User Story 6 - Prepare offline content — US-M01-03 (Priority: P1, nâng từ Should* theo MVP-Scope §3.1)

Với tuyến cần gói offline (`hasOfflineRequiredCheckpoint` hoặc `hasOfflineRouteMap` là `true`), M01 giải thích nội dung nào có thể không có, nêu ước tính dung lượng, cho Download / Continue without download / Back; quản lý vòng đời gói (tải, kiểm tra, publish atomic, cập nhật, xóa).

**Why this priority**: Increment có điểm dừng `OFFLINE_REQUIRED` (quyết định 2026-10-29) nên theo chú thích `*` gói offline là Must; Start offline (US-M01-04 mục 2) phụ thuộc vào đây.

**Independent Test**: Tải gói thành công, tải lỗi giữa chừng, cập nhật lỗi khi đã có gói cũ; xác nhận chỉ gói đầy đủ mới `SAN_SANG`.

**Acceptance Scenarios**:

1. **Given** tuyến cần package và chưa có package sẵn sàng, **When** du khách tiếp tục, **Then** M01 nêu tên các điểm dừng có thể thiếu nội dung theo ngôn ngữ du khách, hiện dung lượng ước tính (ghi rõ là ước tính) hoặc "size not available" khi M03 không cung cấp, và đưa ba lựa chọn Download, Continue without download, Go back.
2. **Given** tải thành công đầy đủ, **Then** package thành `SAN_SANG + CURRENT` và giữ essential texts cùng thời điểm lưu.
3. **Given** cập nhật lỗi, **Then** package đã sẵn sàng trước đó vẫn dùng được ở `SAN_SANG + OUTDATED`.
4. **Given** thiếu ước tính dung lượng, **Then** Download vẫn khả dụng (BR-M01-016).
5. **Given** màn quyết định offline và trạng thái package sẵn sàng, **Then** nêu một dòng rằng khi không có mạng, check-in dùng nút Quét trong app vì camera điện thoại có thể không mở được app.

---

### User Story 7 - Recommend routes — US-M01-02, phần gợi ý (Priority: P2)

Du khách chọn một giá trị trong mỗi nhóm trong ba nhóm tag; M01 trả mọi tuyến khớp cả ba nhóm (exact-match), `0..N` kết quả.

**Why this priority**: FN-M01-003 là Should; không chặn đường đi Must.

**Independent Test**: Với dữ liệu tag mẫu, mọi kết quả chứa cả ba tag đã chọn; không khớp thì ra kết quả rỗng, không nới tiêu chí.

**Acceptance Scenarios**:

1. **Given** một giá trị hợp lệ mỗi nhóm, **When** chạy gợi ý, **Then** mọi tuyến trả về chứa cả ba tag đã chọn.
2. **Given** không tuyến nào khớp, **Then** hiện kết quả rỗng và không nới lỏng tiêu chí (BR-M01-003).

---

### Edge Cases

Nguồn: spec-M01 §5.4 "Existing Edge Cases", §9, §10.

- Trình duyệt báo online nhưng request nguồn lỗi hoặc không trả lời trong `SOURCE_REQUEST_TIMEOUT_SECONDS` (provisional: 8 giây) → coi nguồn không khả dụng (§9.3).
- Package `SAN_SANG` nhưng `OUTDATED` → vẫn dùng được, hiện cảnh báo khi biết.
- Tuyến đóng khi thiết bị offline → package cục bộ vẫn có thể Start; an toàn thực địa xử lý ngoài app (BR-M01-011, §9).
- Tuyến không có điểm dừng `OFFLINE_REQUIRED` và không có sơ đồ offline → Start online không cần package (SC-M01-010).
- Ảnh khai báo bị thiếu (ảnh QR hoặc sơ đồ offline) → package không thể `SAN_SANG`; không khai báo ảnh nào → package vẫn có thể `SAN_SANG`.
- Lỗi lưu trữ → bỏ candidate, giữ package sẵn sàng hiện có (BR-M01-006); du khách được báo tải chưa hoàn tất và có thể thử lại.
- Dữ liệu trình duyệt bị xóa → preference, context, package có thể mất (§5.4).
- Ước tính dung lượng vắng → Download vẫn khả dụng, màn hình nói dung lượng không có.
- Không làm mới được essential texts → giữ bản cũ và thời điểm lưu cũ (FR-M01-010).
- Handoff quá `expiresAt` → M02 từ chối; du khách Start lại từ M01 (BR-M01-015).
- Snapshot khác cờ của Published Route → snapshot là chuẩn (BR-M01-012).
- Không có nguồn lẫn package sẵn sàng để lấy manifest → chặn Start (FR-M01-011).
- Thao tác lặp (Download/Delete) không được tạo công việc đồng thời (FR-M01-009).
- Thiếu ngôn ngữ ở trường tùy chọn: M01 không tự bổ sung, không "sửa" dữ liệu công khai thiếu (§11.2).

## Requirements *(mandatory)*

### Functional Requirements

Mỗi dòng giữ nguyên ID; chi tiết và điều kiện lỗi lấy từ spec-M01 §5.2 và BR §5.5.

- **FR-M01-001**: Quản lý `LanguagePreference` (`vi`/`en`) trên mọi màn du khách, kể cả trang link QR của M02; lưu và công bố ngay; từ chối giá trị không hỗ trợ. (BR-M01-001)
- **FR-M01-002**: Mở/làm mới danh mục, chỉ tuyến `HOAT_DONG` có snapshot xuất bản hợp lệ; thẻ gồm thumbnail, tên và mô tả ngắn theo ngôn ngữ, quãng đường, thời lượng, độ khó, số điểm dừng, dấu cần tải trước. (BR-M01-002)
- **FR-M01-003**: Hiện thông tin chi tiết tuyến; không tự tạo trường công khai bị thiếu, ẩn trường tùy chọn vắng; khi offline dùng essential texts (FR-M01-014). (BR-M01-013, BR-M01-014)
- **FR-M01-004** *(P2)*: Gợi ý xác định: trả mọi tuyến đang hoạt động khớp cả ba nhóm tag, hỗ trợ kết quả rỗng; đầu vào thiếu/không hợp lệ thì không so khớp. (BR-M01-002, BR-M01-003)
- **FR-M01-005**: Đánh giá nhu cầu chuẩn bị offline: tuyến cần package khi `hasOfflineRequiredCheckpoint` hoặc `hasOfflineRouteMap` là `true`; kiểm tra độ sẵn sàng/phiên bản package; package không đọc được coi như chưa sẵn sàng; snapshot tải về thắng cờ. (BR-M01-012)
- **FR-M01-006**: Hỗ trợ quyết định offline: Download / Continue without download / Back; nêu điểm dừng có thể thiếu nội dung, dung lượng ước tính hoặc "size not available"; Continue vẫn theo các điều kiện Start; nêu rằng khi không có mạng check-in dùng nút Quét trong app. (BR-M01-007, BR-M01-016)
- **FR-M01-007**: Tải package khi online: snapshot bất biến hiện hành, offline resource của mọi QR của các điểm dừng `OFFLINE_REQUIRED`, sơ đồ offline nếu có, essential texts; không publish dữ liệu dở dang. (BR-M01-004, BR-M01-013)
- **FR-M01-008**: Kiểm tra candidate (manifest, văn bản song ngữ của mọi QR resource, ảnh khai báo, sơ đồ offline, essential texts) rồi publish atomic thành sẵn sàng; lỗi thì bỏ candidate và giữ package sẵn sàng cũ. (BR-M01-005, BR-M01-006)
- **FR-M01-009**: Xem/Tải/Xóa package: hiện tuyến, phiên bản, độ sẵn sàng, thời điểm lưu essential texts; xóa phải xác nhận. (BR-M01-005)
- **FR-M01-010**: Cập nhật lười: khi mở tuyến đã có package online, so sánh phiên bản và chuẩn bị candidate mới mà không ẩn package cũ; làm mới độc lập essential texts sau khi đọc nguồn thành công. (BR-M01-006, BR-M01-014)
- **FR-M01-011**: Xử lý Start online/offline: online xác nhận tuyến/snapshot hiện hành; offline cần package sẵn sàng và dùng manifest của nó. (BR-M01-008, BR-M01-011)
- **FR-M01-012**: Tạo `SelectedRouteContext v3`: handoff UUID mới, `expiresAt` = `authorizedAt` + 24 giờ, ghi atomic; lỗi thì giữ context trước; Start lặp khi một Start đang chạy không tạo context thứ hai; M01 không đổi `authorizationStatus` khi hết hạn, hạn do M02 thực thi. (BR-M01-009, BR-M01-015)
- **FR-M01-013**: Công bố dữ liệu dùng chung cho M02: ngôn ngữ độc lập; chỉ package active `SAN_SANG`; chỉ context hoàn chỉnh; không bao giờ lộ staging/partial. (BR-M01-010)
- **FR-M01-014**: Giữ essential route texts (tên, điểm xuất phát, yêu cầu tham gia, cảnh báo an toàn) cùng thời điểm lưu; khi hiển thị từ bản lưu, nêu thời điểm và rằng có thể không mới nhất; thiếu bản lưu thì mở tuyến bằng thông tin hiện có, không khẳng định là mới nhất. (BR-M01-014)

Các điều kiện ràng buộc khác lấy từ BR-M01-001…016 và spec-M01 §5.4 (Validation); không lặp lại ở đây.

### Key Entities *(include if feature involves data)*

Nguồn: spec-M01 §6. Chỉ mô tả vai trò; kiểu dữ liệu thuộc plan/data-model.

- **LanguagePreference**: ngôn ngữ hiện tại `vi`/`en`; M01 là writer duy nhất; chia sẻ cho M02.
- **Route (Published Route projection)**: dữ liệu M03 xuất bản, M01 chỉ đọc.
- **RecommendationContext**: ba lựa chọn tag của lần gợi ý.
- **JourneySnapshot**: ảnh bất biến của hành trình theo `(routeId, contentVersion)`; M03 là producer.
- **OfflinePackage / OfflineResource**: gói của một tuyến/phiên bản; chứa manifest, một resource cho mỗi QR của điểm dừng `OFFLINE_REQUIRED`; `OfflineRouteMap` và `RouteEssentials` là giá trị nhúng (không phải entity, spec-M01 §12 clarification).
- **SelectedRouteContext (v3)**: handoff một lần dùng kèm manifest hành trình đầy đủ.

## Success Criteria *(mandatory)*

### Measurable Outcomes

Giữ nguyên SC-M01-001…010 (spec-M01 §8):

- **SC-M01-001**: Mọi tuyến có thể chọn đều đang hoạt động và có snapshot xuất bản.
- **SC-M01-002**: Mọi kết quả gợi ý khớp cả ba nhóm tag đã chọn.
- **SC-M01-003**: Package chỉ được công bố sẵn sàng khi đầy đủ theo manifest.
- **SC-M01-004**: Cập nhật lỗi không bao giờ xóa package sẵn sàng trước đó.
- **SC-M01-005**: Mỗi Start thành công ghi một context v3 hoàn chỉnh, handoff UUID mới, hạn 24 giờ sau authorization.
- **SC-M01-006**: Offline Start chỉ thành công từ package sẵn sàng; ngược lại bị chặn.
- **SC-M01-007**: Package sẵn sàng chỉ khi mọi QR của mọi điểm dừng offline-required, sơ đồ offline (nếu có) và essential texts đều đầy đủ.
- **SC-M01-008**: Offline, chi tiết tuyến hiện essential texts đã lưu kèm thời điểm lưu, không khẳng định là mới nhất.
- **SC-M01-009**: Download không bao giờ bị chặn vì thiếu ước tính dung lượng.
- **SC-M01-010**: Tuyến không cần package có thể Start online mà không cần package.

## Assumptions

Nguồn: spec-M01 §9.

- Tuyến là hành trình trong ngày; M03 duy trì tag và nội dung xuất bản hợp lệ và suy ra time tag từ thời lượng.
- Ban Quản lý quyết định sơ đồ tuyến nào cần khi không có mạng; vận hành công viên lo biện pháp an toàn vật lý cho thiết bị offline không nhận được thông báo đóng.
- Không xếp hạng/AI, không ép tải, không đảm bảo đóng tuyến real-time cho thiết bị offline, không đồng bộ dữ liệu cục bộ giữa các thiết bị.
- Không khuyến khích cài app lên màn hình chính iPhone (app đã cài trên iOS không nhận link từ camera và có dữ liệu riêng).
- Truy cập khách tới dữ liệu M03 chỉ đọc (do server bảo đảm); khả năng cache app shell và i18n phục vụ chuyển ngôn ngữ offline là ràng buộc kỹ thuật đã duyệt (§9.3), cách thực hiện thuộc plan; dữ liệu API không được cache runtime (constitution VI).
- Dependency M03 → M01: hình dạng Published Route và `JourneySnapshot` phản chiếu spec-M03 v3.7 §5.1; M01 không sửa dữ liệu thiếu.
- Dependency M01 → M02: hình dạng `SelectedRouteContext v3`, `LanguagePreference`, `OfflinePackage` đúng như spec-M01 §5.3.
- Quyết định người dùng 2026-10-29: build toàn bộ M01 trong một lần; gói offline xử lý như Must.

### Open clarifications

Không còn mục `[NEEDS CLARIFICATION]` mở. Wireframe, accessibility, mã lỗi API vật lý, schema/quota lưu trữ trình duyệt, chi tiết tiến độ tải, định dạng hiển thị dung lượng ước tính, wording thông báo cố định, mục tiêu hiệu năng và telemetry là "Deferred Design Work" theo spec-M01 §10.2: thuộc tài liệu thiết kế/plan, không phải requirement hành vi, và không được đổi contract hay chuyển trạng thái đã định nghĩa.

Giá trị provisional của M01: `SOURCE_REQUEST_TIMEOUT_SECONDS` = 8 (spec-M01 §9.3, áp dụng cho các lần đọc danh mục, chi tiết tuyến và Start); giữ nguyên giá trị, phải kiểm chứng trên thiết bị thực địa, chủ dự án chịu trách nhiệm trước lần phát hành thật đầu tiên; không phải business rule đã xác nhận. Các hằng provisional của M03 (§5.3 spec-M03, ví dụ `OFFLINE_PACKAGE_MAX_MB` = 50) ảnh hưởng đến M01 gián tiếp qua `estimatedOfflineSizeBytes` và được ghi ở [specs/003-m03-operations-content-administration/spec.md](../003-m03-operations-content-administration/spec.md).

## Traceability (ID → section nguồn)

Tất cả ID bên dưới tồn tại trong [docs/spec/spec-M01.md](../../docs/spec/spec-M01.md). Cột Function/Priority lấy từ MVP-Scope §3.1 và [function-list-M01.md](../../docs/function%20list/function-list-M01.md).

| User story | US (spec §) | FR | BR | SC | Function / Priority |
|---|---|---|---|---|---|
| Story 1 | US-M01-01 (§3) | FR-M01-001 | BR-M01-001 | — | FN-M01-001 / Must |
| Story 2 | US-M01-02 mục 1, 4 (§3) | FR-M01-002 | BR-M01-002 | SC-M01-001 | FN-M01-002 / Must |
| Story 3 | US-M01-06 (§3) | FR-M01-003, FR-M01-014 | BR-M01-013, BR-M01-014 | SC-M01-008 | FN-M01-002 / Must |
| Story 4 | US-M01-04 (§3) | FR-M01-011, FR-M01-012, FR-M01-013 | BR-M01-008, 009, 010, 015 | SC-M01-005, SC-M01-006 | FN-M01-006, FN-M01-007 / Must |
| Story 5 | US-M01-05 (§3) | FR-M01-002, FR-M01-011, FR-M01-012 | BR-M01-011 | — | FN-M01-006 / Must |
| Story 6 | US-M01-03 (§3) | FR-M01-005 … FR-M01-010 | BR-M01-004, 005, 006, 007, 012, 013, 016 | SC-M01-003, 004, 007, 009, 010 | FN-M01-004, FN-M01-005 / Should* → Must (quyết định 2026-10-29) |
| Story 7 | US-M01-02 mục 2, 3 (§3) | FR-M01-004 | BR-M01-002, BR-M01-003 | SC-M01-002 | FN-M01-003 / Should |

| Mục trong file này | Section nguồn |
|---|---|
| Ranh giới Producer → Consumer | spec-M01 §1.4, §5.3, §11.2; AGENTS.md §3.2 |
| Edge Cases | spec-M01 §5.4 (Existing Edge Cases), §9, §10 |
| Key Entities | spec-M01 §6.1–6.4 |
| Priority | MVP-Scope §3.1, §3.4 |
| FR → Flow/Entity coverage | spec-M01 §11.1 |
