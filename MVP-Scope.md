# MVP Scope — Cúc Phương Quest

## 1. Trạng thái và nguyên tắc

| Thuộc tính | Giá trị |
|---|---|
| Phạm vi | MVP cho M01–M03 |
| Trạng thái | Implementation baseline |
| Cập nhật | 2026-09-27 |
| Nguồn hành vi và contract | Ba module spec |

Tài liệu này chỉ tóm tắt ranh giới MVP. Khi có khác biệt, module spec tương ứng là nguồn sự thật duy nhất.

- **Must:** điều kiện phát hành tối thiểu; thiếu chức năng này thì luồng cốt lõi không hoàn chỉnh hoặc dữ liệu/phân quyền không an toàn.
- **Should:** thuộc functional baseline và nên có trong MVP, nhưng có thể lùi sau bản phát hành tối thiểu nếu đã có fallback rõ ràng.
- **Could:** chức năng bổ sung có giá trị nhưng không chặn luồng cốt lõi và chỉ thực hiện sau `Must`/`Should`.
- **Won't:** chủ động không triển khai trong baseline hiện tại.
- Ba spec và function list mô tả toàn bộ functional baseline. Priority trong tài liệu này chỉ quyết định thứ tự và release gate, không xóa requirement hay cho phép triển khai sai contract.
- Các function phụ thuộc nhau phải được đưa vào cùng một increment; ví dụ Terminal Sync phía M02 và Session Intake & Reporting phía M03.

## 2. Mục tiêu functional baseline

1. M03 cho phép nhân sự công viên soạn, kiểm duyệt và phát hành dữ liệu tuyến, checkpoint, QR và nội dung song ngữ thành public projection cùng `JourneySnapshot` bất biến.
2. M01 cho phép du khách chọn ngôn ngữ, tìm/chọn tuyến, chuẩn bị package khi cần và Start bằng dữ liệu online hiện hành hoặc package `SAN_SANG` khi offline.
3. M02 tạo một phiên từ handoff hợp lệ, lưu tiến độ QR tại thiết bị, hiển thị đúng nguồn nội dung và kết thúc phiên theo quy tắc checkpoint cuối.
4. M02 đồng bộ bản ghi terminal ẩn danh sang M03; M03 cung cấp hai báo cáo vận hành cơ bản từ dữ liệu đã đồng bộ.

Đường đi tối thiểu của nhóm `Must` là: M03 phát hành route/journey/content → M01 cho phép duyệt và Start → M02 tạo phiên, quét QR, hiển thị nội dung và Finish. Recommendation, offline package, đồng bộ báo cáo, free-visitor flow và emergency operations không chặn đường đi này.

## 3. Chức năng trong MVP

### 3.1 M01 — Route Planning & Preparation

| Function ID | Function | Phạm vi MVP | Priority |
|---|---|---|---|
| FN-M01-001 | Language Preference | Chọn, lưu và chia sẻ ngôn ngữ `vi/en`. | Must |
| FN-M01-002 | Route Discovery | Xem danh mục và chi tiết các tuyến public đang hoạt động. | Must |
| FN-M01-003 | Route Recommendation | Exact-match đồng thời ba nhóm tag và trả `0..N` kết quả. | Should |
| FN-M01-004 | Offline Need & Decision | Xác định nhu cầu offline và cho phép Download, Continue hoặc Back. | Should |
| FN-M01-005 | Offline Package Lifecycle | Tải, kiểm tra, publish atomic, cập nhật và xóa package local; giữ bản cũ nếu cập nhật lỗi. | Should |
| FN-M01-006 | Route Start & Handoff | Kiểm tra điều kiện Start online/offline và tạo `SelectedRouteContext v2` dùng một lần. | Must |
| FN-M01-007 | Shared Contract Publication | Chỉ công bố language, context hoàn chỉnh và package active `SAN_SANG` cho M02. | Must |

### 3.2 M02 — Field Quest Experience

| Function ID | Function | Phạm vi MVP | Priority |
|---|---|---|---|
| FN-M02-001 | Handoff Validation & Session Start | Một handoff hợp lệ, chưa dùng tạo tối đa một phiên. | Must |
| FN-M02-002 | Session Lifecycle & Recovery | Lưu, khôi phục và chuyển trạng thái phiên nhất quán trên thiết bị. | Must |
| FN-M02-003 | Journey Map | Hiển thị journey cố định từ manifest cùng trạng thái đã ghé. | Must |
| FN-M02-004 | QR Resolution & Check-in | Phân giải QR và ghi một visit cho mỗi `(sessionId, checkpointId)`. | Must |
| FN-M02-005 | Content Delivery | Đọc nội dung offline hoặc live đúng theo connectivity mode và ngôn ngữ. | Must |
| FN-M02-006 | Completion & Route Replacement | Hoàn tất khi checkpoint cuối được ghé và xác nhận; thay route theo transaction bỏ phiên cũ/tạo phiên mới. | Must |
| FN-M02-007 | Terminal Sync | Lưu và retry `SessionSyncRecord` terminal, ẩn danh, bất biến. | Should |
| FN-M02-008 | Free Visitor Experience | Cho phép xem nội dung từ QR hợp lệ mà không tạo tiến độ hoặc dữ liệu báo cáo. | Could |

### 3.3 M03 — Operations & Content Administration

| Function ID | Function | Phạm vi MVP | Priority |
|---|---|---|---|
| FN-M03-001 | Route Administration | Quản lý draft, metadata song ngữ, tag và lifecycle tuyến. | Must |
| FN-M03-002 | Checkpoint Administration | Quản lý checkpoint ổn định, thứ tự duy nhất và connectivity mode. | Must |
| FN-M03-003 | QR Administration | Quản lý nhiều QR/checkpoint, reprint, replacement và withdrawal an toàn. | Must |
| FN-M03-004 | Bilingual Content & Media | Quản lý revision nội dung `vi/en`, ảnh và media online. | Must |
| FN-M03-005 | Review & Publication | Maker-checker, validation và phát hành public state nguyên tử. | Must |
| FN-M03-006 | Journey Snapshot | Tạo và duy trì full-journey snapshot bất biến theo version. | Must |
| FN-M03-007 | Emergency Operations | Đóng/mở lại route hoặc checkpoint theo quyền, kết quả xác định và có audit. | Should |
| FN-M03-008 | Authentication, Accounts, Authorization & Concurrency | Login/invite/recovery, bootstrap Reviewer đầu tiên, hai role cố định, bảo vệ Reviewer cuối và từ chối stale write. | Must |
| FN-M03-009 | Live QR & Content Service | Cung cấp QR lookup và live content public cho M02. | Must |
| FN-M03-010 | Session Intake & Reporting | Nhận terminal session bất biến và cung cấp RPT-01/RPT-02. | Should |

## 5. Won't — ngoài MVP

| Capability | Phạm vi | Ghi chú |
|---|---|---|
| AI/ML recommendation, scoring hoặc relevance ranking | M01 | MVP chỉ exact-match ba nhóm tag. |
| Ép tải package hoặc offline audio/video | M01 | Du khách có thể tiếp tục khi online; package chỉ gồm text và ảnh tĩnh cần thiết. |
| Đồng bộ/recovery package hoặc tiến độ qua tài khoản, thiết bị khác | M01/M02 | Dữ liệu visitor chỉ lưu trên trình duyệt hiện tại. |
| GPS tracking, geofence hoặc turn-by-turn navigation | Cross-module | QR là cơ chế check-in duy nhất. |
| Bắt buộc ghé checkpoint theo thứ tự hoặc đủ 100% để hoàn tất | M02 | Chỉ cần ghé checkpoint có sequence cao nhất rồi xác nhận Finish. |
| Hint chain, hidden message, điểm, huy hiệu hoặc leaderboard | M02 | Không thuộc hành trình MVP. |
| Visitor account hoặc thu thập PII/device identifier | M02/M03 | Session đồng bộ là ẩn danh. |
| Cảnh báo real-time hoặc ngắt phiên đang chạy khi route đóng | M03 → M02 | An toàn thực địa được bổ trợ bằng biện pháp ngoài hệ thống. |
| Offline admin hoặc đồng bộ draft quản trị | M03 | M03 hoạt động online-only. |
| Custom role, temporary delegation hoặc public admin sign-up | M03 | Chỉ `CONTENT_STAFF` và `REVIEWER`, cấp tài khoản theo invite. |
| Auto-merge thay đổi quản trị đồng thời | M03 | Stale write bị từ chối và yêu cầu reload. |
| Advanced analytics, realtime dashboard hoặc export báo cáo | M03 | MVP chỉ có RPT-01 và RPT-02 theo yêu cầu. |
| Visitor báo QR lắp sai vị trí | M02/M03 | Không có workflow xử lý trong MVP. |
| Xóa vật lý snapshot đã phát hành hoặc audit/history theo thao tác nghiệp vụ | M03 | Retention và archival do thiết kế dữ liệu/vận hành kiểm soát. |

## 6. Ràng buộc chung

- Tuyến là hành trình trong ngày và có một checkpoint cuối theo sequence cao nhất.
- Offline Start chỉ được phép khi có package `SAN_SANG`; package cũ nhưng hoàn chỉnh vẫn dùng được với cảnh báo khi biết đã outdated.
- Journey của phiên M02 được đóng băng từ handoff và không dựng lại từ dữ liệu live.
- Đóng route/checkpoint ảnh hưởng lượt đọc và Start mới, không sửa package hoặc phiên đã có trên thiết bị.
- M03 là online-only; write phải kiểm tra quyền phía server và publication quan trọng phải atomic.
- Timestamp lưu UTC; báo cáo lọc và nhóm ngày theo `Asia/Ho_Chi_Minh`.
- Physical schema, API path, UI layout và deployment topology thuộc tài liệu thiết kế, không được thay đổi ý nghĩa contract trong spec.

## 7. Tài liệu nguồn

- [Specification M01](docs/spec/spec-M01.md)
- [Specification M02](docs/spec/spec-M02.md)
- [Specification M03](docs/spec/spec-M03.md)
- [Function List M01](docs/function%20list/function-list-M01.md)
- [Function List M02](docs/function%20list/function-list-M02.md)
- [Function List M03](docs/function%20list/function-list-M03.md)
