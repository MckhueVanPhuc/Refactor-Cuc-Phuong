# Screen Spec: Chi tiết tuyến & Chuẩn bị

| Field | Value |
|---|---|
| Screen ID | `SCR-M01-003` |
| Screen name | Chi tiết tuyến & Chuẩn bị |
| Module | `M01` |
| Actor | Visitor |
| Priority | Must; offline capability Should* |
| Mockup | `screens/M01/mockups/SCR-M01-003-detail.png` |
| Status | Draft |

*Offline capability Should theo MVP Scope §3.4, nhưng phải nâng lên Must nếu increment phát hành có checkpoint OFFLINE_REQUIRED.

Nguồn hành vi/contract: [Spec M01](../../../docs/spec/spec-M01.md). Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu; bố cục/visual direction tham khảo [DESIGN.md](../../../DESIGN.md). Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline.

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Trong §9: **Confirmed** có nguồn baseline, **Proposed** chờ UX review, **Open** có clarification chưa được nguồn xác nhận. Draft không đồng nghĩa frontend/prototype đã được nghiệm thu.

## 1. Purpose

**Shown when:** Visitor chọn tuyến từ SCR-M01-001 (danh mục) hoặc SCR-M01-002 (gợi ý), HOẶC mở lại từ SCR-M01-004 (package đã tải) để Start offline.

**The user leaves when:** Quay lại danh mục, mở quản lý offline, hoặc Start thành công và chuyển sang SCR-M02-001.

## 2. Mockup

Mockup: `screens/M01/mockups/SCR-M01-003-detail.png`. Đây là target asset tham khảo; cần kiểm tra asset và design sign-off, không dùng ảnh mockup để suy ngược business rule.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M01-003-01 | Language selector | Header control | `vi` / `en`; đọc từ LanguagePreference | Yes | Chỉ chấp nhận `vi` hoặc `en` |
| 2 | E-SCR-M01-003-02 | Route name | Header text | Published Route `name.vi/en` từ source hoặc local view riêng; package manifest không chứa tên tuyến | Conditional | Khi thiếu metadata, hiển thị routeId; không synthesize tên |
| 3 | E-SCR-M01-003-03 | Route image | Image | Asset minh họa tùy chọn đã được duyệt; Published Route không có field ảnh tuyến | No | Không dùng ảnh sai ngữ cảnh hoặc tự thêm field vào contract |
| 4 | E-SCR-M01-003-04 | Route description | Text | Published Route `description.vi/en` nếu có metadata source/local view | Conditional | Không tạo description giả khi chỉ còn package manifest |
| 5 | E-SCR-M01-003-05 | Safety warning | Banner/text | `safetyWarning.vi/en` nếu có; hiển thị nếu present | No | Both-or-none với tiếng còn lại |
| 6 | E-SCR-M01-003-06 | Route metadata | Text | Published Route distanceKm, durationMin, difficulty, tags nếu có; không nằm trong package/handoff | Conditional | Không suy đoán giá trị thiếu; phân biệt local view cũ với current source |
| 7 | E-SCR-M01-003-07 | Checkpoint count | Text | Tổng số checkpoint và số checkpoint offline-required | Yes | None |
| 8 | E-SCR-M01-003-08 | Offline status panel | Panel | Readiness/freshness của active package và tiến trình candidate riêng | Yes | Candidate đang tải/lỗi không đổi active package SAN_SANG thành DANG_TAI/CHUA_HOAN_TAT |
| 9 | E-SCR-M01-003-09 | Outdated warning | Banner | "Gói dữ liệu đã cũ" khi package SAN_SANG + OUTDATED | No | Chỉ khi OUTDATED |
| 10 | E-SCR-M01-003-10 | Action: Tải xuống / Thử lại | Button | Tải hoặc retry khi chưa có ready package; retry candidate update nếu cần | Conditional | Cần source hiện hành truy cập được; không chạy thêm operation cùng route |
| 11 | E-SCR-M01-003-11 | Action: Tiếp tục không tải | Button | Lựa chọn rõ ràng sau cảnh báo khi tuyến có OFFLINE_REQUIRED nhưng thiếu ready package | Conditional | Chỉ tiếp tục online khi current route/snapshot hợp lệ; không chỉ xét CHUA_TAI |
| 12 | E-SCR-M01-003-13 | Action: Quản lý offline | Button | Mở SCR-M01-004 để xem chi tiết package | Yes | None |
| 13 | E-SCR-M01-003-14 | Action: Quay lại | Button | Trở về SCR-M01-001 | Yes | None |
| 14 | E-SCR-M01-003-15 | Action: Start | Button | Validate nguồn hoặc ready package, rồi tạo SelectedRouteContext v2 | Yes | Nếu có OFFLINE_REQUIRED nhưng thiếu ready package, yêu cầu explicit preparation choice trước; block khi known route unavailable hoặc không có manifest; serialize Start |
| 15 | E-SCR-M01-003-16 | Loading spinner | Indicator | Hiển thị khi đang tải package hoặc validate source | Conditional | Not applicable khi không có network activity |
| 17 | E-SCR-M01-003-17 | Source unavailable banner | Banner | "Không thể kết nối nguồn dữ liệu" khi online nhưng source fails | Conditional | Hiển thị khi source unavailable |
| 18 | E-SCR-M01-003-18 | Route unavailable banner | Banner | "Tuyến này không còn khả dụng" khi route revoked/closed | Conditional | Hiển thị khi route không còn active |
| 19 | E-SCR-M01-003-19 | Download progress panel | Panel | Tiến trình candidate tách khỏi active package; % chỉ khi đo được | Conditional | Không fabricate tiến độ khi tổng lượng tải chưa biết |
| 20 | E-SCR-M01-003-20 | Preparation decision panel | Panel/control | Cảnh báo nội dung offline có thể thiếu; Download / Continue without download / Back | Conditional | Không implicit choice; tiếp tục vẫn phải qua Start guards |
| 21 | E-SCR-M01-003-21 | Action: Làm mới / Thử lại source | Button | Đọc lại route/snapshot và kiểm tra freshness | Conditional | Request lỗi không được coi là route đã đóng |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| Default | Route metadata đầy đủ, offline status panel, action buttons | Route loaded, package state known |
| Loading | Spinner tại metadata hoặc package section | Đang validate source hoặc load route |
| Route unavailable | Banner "Tuyến không còn khả dụng"; Start disabled | Route closed/archived/revoked discovered |
| Source unavailable | Banner kết nối; có thể Start bằng ready package nếu có; block nếu không có manifest dùng được | Source fails, kể cả browser báo online |
| Package CHUA_TAI | Panel "Chưa tải", các action tải/tiếp tục/Start | No package exists |
| Package DANG_TAI, no old ready package | Báo đang tải; online Start vẫn có thể sau quyết định không tải và validate source; offline Start blocked | First candidate in progress |
| Package SAN_SANG + CURRENT | Panel sẵn sàng; Start vẫn áp dụng current-source/route guards | Ready active package |
| Package SAN_SANG + OUTDATED | Cảnh báo cũ; vẫn dùng được khi source unavailable; online Start dùng current snapshot | Ready package, newer version known |
| Updating with old ready package | Active package vẫn SAN_SANG + OUTDATED; tiến trình candidate riêng, không khóa Start chỉ vì update | New candidate being prepared |
| Update failed with old ready package | Giữ SAN_SANG + OUTDATED; báo lỗi candidate và cho retry | Candidate failed, old ready package intact |
| Package CHUA_HOAN_TAT, no old ready package | Báo tải thất bại; retry hoặc explicit Continue online; offline Start blocked | Candidate failed without old ready package |
| Package-only detail | routeId, version, checkpoint counts từ manifest; ghi rõ thiếu metadata tuyến nếu local view mất | Offline mở package nhưng không có Published Route metadata |
| Confirmation dialog | Panel xác nhận "Tiếp tục không tải?" với cảnh báo | Visitor chọn "Tiếp tục không tải" |
| Start failure | Banner lỗi; context cũ được giữ nguyên | Start validation fails |

## 5. Interactions and navigation

| # | Element | User action | System response | Destination screen / result |
|---|---|---|---|---|
| 1 | Language selector | Tap / change | Cập nhật LanguagePreference, chuyển ngôn ngữ UI và content | Stays; label update |
| 2 | Tải xuống | Tap | Bắt đầu candidate; giữ old ready package đọc được; validate trước atomic publish | Update offline status panel |
| 3 | Tiếp tục không tải | Tap | Hiện confirmation dialog với warning | Show confirmation panel |
| 4 | Confirm continue | Tap confirm | Chuyển state; cho phép online Start | State update |
| 5 | Quản lý offline | Tap | Mở SCR-M01-004 | `SCR-M01-004` |
| 6 | Quay lại | Tap | Trở về danh mục | `SCR-M01-001` |
| 7 | Start | Tap | Nếu cần preparation decision thì hiện Download/Continue/Back trước; sau guard, validate current source hoặc dùng ready manifest khi source unavailable; atomic write context trước mở M02 | Preparation panel / `SCR-M02-001` / lỗi không thay context cũ |
| 8 | Retry download | Tap | Thử lại download package | Retry DANG_TAI |
| 9 | Làm mới / Thử lại source | Tap; pull-to-refresh nếu được chọn | Re-validate route source và package freshness | Reload state |
| 10 | Hủy confirmation / Back | Tap | Không implicit Continue; đóng panel hoặc quay về danh mục | Stays / `SCR-M01-001` |

## 6. Screen-level rules

| Rule ID | Rule | Related requirement |
|---|---|---|
| SR-SCR-M01-003-001 | Online Start: validate current route và snapshot từ M03; tạo handoff từ current snapshot | FR-M01-011, BR-M01-008 |
| SR-SCR-M01-003-002 | Offline Start: yêu cầu package SAN_SANG; tạo handoff từ package manifest | FR-M01-011, BR-M01-008 |
| SR-SCR-M01-003-003 | Source unavailable + no SAN_SANG: Start bị block; browser online không thay cho source response | FR-M01-011; spec-M01 §5.4 |
| SR-SCR-M01-003-004 | Mỗi Start tạo handoffId mới; Start lại thay thế context trước nguyên tử | BR-M01-009 |
| SR-SCR-M01-003-005 | Thất bại Start KHÔNG thay đổi context cũ | FR-M01-012 |
| SR-SCR-M01-003-006 | Visitor có thể tiếp tục không tải khi online sau khi thấy warning rõ ràng | BR-M01-007 |
| SR-SCR-M01-003-007 | Lazy update: khi mở packaged route và source truy cập được, kiểm tra version và chuẩn bị candidate mới; giữ old ready package nếu đang tải hoặc thất bại | FR-M01-010, BR-M01-006 |
| SR-SCR-M01-003-008 | Successful source refresh phát hiện closed/archived/deleted: unavailable và revoke current context của tuyến; không cần biết đã consumed, không ngắt session đã tạo | BR-M01-011; spec-M01 US-M01-05 |
| SR-SCR-M01-003-009 | Download validation: manifest, bilingual text, declared images phải hợp lệ trước khi publish SAN_SANG | FR-M01-008 |

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M01-001 | Control M01 cập nhật LanguagePreference độc lập với package/session |
| FR-M01-003 | Hiển thị route metadata theo ngôn ngữ đã chọn |
| FR-M01-005 | Đếm offline-required checkpoints và kiểm tra package readiness |
| FR-M01-006 | Cảnh báo và ba lựa chọn chuẩn bị (Download / Continue / Back) |
| FR-M01-007 | Download full manifest và offline resource subset |
| FR-M01-008 | Validate đầy đủ và atomic publish |
| FR-M01-009 | View/download; delete và confirmation tại SCR-M01-004 |
| FR-M01-010 | Lazy update giữ active package cũ |
| FR-M01-011 | Online Start xác nhận source; offline Start cần SAN_SANG |
| FR-M01-012 | Context v2 mới, atomic; refresh phát hiện closure/revoke |
| FR-M01-013 | Shared data chỉ expose complete context và active ready package; không expose candidate/staging |

## 8. Responsive and accessibility notes

- Định hướng mobile-first: ưu tiên nội dung/action chính, wrap text/tags và stack panels theo chiều rộng thực tế; tránh chiều rộng cố định gây tràn ngang. 360px, 768px và 1280px là kích thước tham khảo để review, không phải hard breakpoint hoặc điều kiện bật/tắt tính năng.
- Review text dài vi/en, loading/empty/error, phóng to chữ, focus và thao tác một tay trên điện thoại. Bố cục cuối cùng cần prototype/usability review trước sign-off.
- Mục tiêu review accessibility: keyboard access, visible focus, semantic labels, error liên kết với field, status không chỉ biểu đạt bằng màu và reduced motion. Tham khảo WCAG 2.1 AA, touch target khoảng 44×44px và contrast 4.5:1 cho normal text; đây là định hướng cần kiểm chứng trên frontend, không phải tuyên bố đã đạt chuẩn.

## 9. Open questions

| ID | Question | Blocking | Status | Resolution |
|---|---|---|---|---|
| OQ-SCR-M01-003-001 | Chi tiết confirmation dialog (tiếp tục không tải) — modal, inline panel, hay bottom sheet? | No | Proposed | Đề xuất inline panel, bottom sheet hoặc modal chứa explicit Continue/Cancel; Download/Continue/Back phải đủ trong preparation flow (FR-M01-006). |
| OQ-SCR-M01-003-002 | Cơ chế lazy update: check khi nào (mỗi lần mở route hay chỉ khi online)? | No | Confirmed | Khi packaged route được mở/selected và source access thành công: check version, chuẩn bị newer candidate riêng; không chỉ dựa browser online (spec-M01 §4.4, FR-M01-010). |
| OQ-SCR-M01-003-003 | UI cho outdated warning có cần action không (auto-update hay manual)? | No | Proposed | Cảnh báo OUTDATED phải rõ; vị trí/action retry còn là UX proposal. Lazy update vẫn chuẩn bị newer candidate và giữ old ready package; không cấm update hoặc bắt user manual-only (FR-M01-010, BR-M01-006). |
| OQ-SCR-M01-003-004 | Kích thước trang tối thiểu | No | Proposed | Mobile-first, co giãn theo content; xem §8, chưa chốt minimum/breakpoints. |

## Completion checklist

- [x] Required behavioral controls and feedback are described in the inventory.
- [x] Each input has a validation rule or explicit `None`.
- [x] Behavioral success/failure states in this screen scope are described.
- [x] Navigation screen IDs and requirement references resolve; behavioral mappings follow canonical sources.
- [ ] Final layout, copy, assets and UX choices are signed off.
- [ ] Responsive/accessibility and real interactions are verified on the frontend.
