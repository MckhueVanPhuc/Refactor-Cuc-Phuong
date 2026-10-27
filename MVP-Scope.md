# MVP Scope — Cúc Phương Quest

## 1. Trạng thái và nguyên tắc

| Thuộc tính | Giá trị |
|---|---|
| Phạm vi | MVP cho M01–M03 |
| Trạng thái | Implementation baseline — đồng bộ Spec M01 v3.2, M02 v3.2, M03 v3.6 |
| Cập nhật | 2026-10-27 |
| Nguồn hành vi và contract | Ba module spec |

Tài liệu này chỉ tóm tắt ranh giới MVP. Khi có khác biệt, module spec tương ứng là nguồn sự thật duy nhất.

- **Must:** điều kiện phát hành tối thiểu; thiếu chức năng này thì luồng cốt lõi không hoàn chỉnh hoặc dữ liệu/phân quyền/an toàn không đảm bảo.
- **Should:** thuộc functional baseline và nên có trong MVP, nhưng có thể lùi sau bản phát hành tối thiểu nếu đã có fallback rõ ràng.
- **Could:** chức năng bổ sung có giá trị nhưng không chặn luồng cốt lõi và chỉ thực hiện sau `Must`/`Should`.
- **Won't:** chủ động không triển khai trong baseline hiện tại.
- Ba spec và function list mô tả toàn bộ functional baseline. Priority trong tài liệu này chỉ quyết định thứ tự và release gate, không xóa requirement hay cho phép triển khai sai contract.
- Sub-function kế thừa priority của function cha, trừ các năng lực được ghi riêng ở §3.4.
- Các function phụ thuộc nhau phải được đưa vào cùng một increment; ví dụ Terminal Sync phía M02 và Session Intake & Reporting phía M03.

## 2. Mục tiêu functional baseline

1. M03 cho phép nhân viên công viên tạo **thư viện điểm dừng dùng chung**, mỗi điểm dừng gồm các **điểm tham quan (mã QR)** có nội dung song ngữ riêng; tuyến chọn và sắp xếp các điểm dừng đã xuất bản. Mọi thay đổi được xuất bản qua **màn review bắt buộc** (người soạn tự xuất bản, không có người duyệt thứ hai), kèm lịch sử, khôi phục bản cũ và audit; dữ liệu công khai và `JourneySnapshot` bất biến được cập nhật đồng thời cho mọi tuyến liên quan.
2. M01 cho phép du khách chọn ngôn ngữ, xem thẻ và trang chi tiết tuyến, tìm tuyến phù hợp, chuẩn bị gói offline khi cần và Start bằng dữ liệu online hiện hành hoặc gói `SAN_SANG` khi offline; mỗi handoff `SelectedRouteContext v3` có hạn 24 giờ.
3. M02 tạo một phiên từ handoff hợp lệ; du khách quét QR bằng nút Quét trong app hoặc mở link QR bằng camera điện thoại; lượt ghé chỉ được ghi khi lần quét được chấp nhận; hiển thị nội dung của đúng mã đã quét, thông báo khu vực tạm đóng; kết thúc phiên bằng Finish, câu hỏi "Kết thúc chuyến đi?" hoặc tự đóng sau 24 giờ.
4. Bất kỳ ai cũng có thể quét mã QR bằng camera điện thoại để xem nội dung điểm tham quan mà không cần chọn tuyến (khách tự do); việc này không tạo phiên hay dữ liệu báo cáo.
5. M02 đồng bộ bản ghi terminal ẩn danh sang M03; M03 kiểm tra bản ghi theo snapshot và cung cấp hai báo cáo vận hành cơ bản.

Đường đi tối thiểu của nhóm `Must` là: M03 xuất bản điểm dừng, điểm tham quan và tuyến → M01 cho phép duyệt và Start → M02 tạo phiên, quét QR (trong app hoặc từ camera), hiển thị nội dung và kết thúc phiên; đồng thời khách tự do mở được nội dung từ mã QR. Gợi ý tuyến, gói offline, đồng bộ/báo cáo và màn nhật ký toàn hệ thống không chặn đường đi này.

## 3. Chức năng trong MVP

### 3.1 M01 — Route Planning & Preparation

| Function ID | Function | Phạm vi MVP | Priority |
|---|---|---|---|
| FN-M01-001 | Language Preference | Chọn, lưu và chia sẻ ngôn ngữ `vi/en`; nút đổi ngôn ngữ có trên mọi màn du khách; vào từ link QR thì dùng ngôn ngữ của máy, không chặn. | Must |
| FN-M01-002 | Route Discovery | Thẻ tuyến và trang chi tiết tuyến (ảnh, mô tả, điểm xuất phát, yêu cầu, cảnh báo an toàn, tên các điểm dừng theo thứ tự) của các tuyến đang hoạt động. | Must |
| FN-M01-003 | Route Recommendation | Exact-match đồng thời ba nhóm tag và trả `0..N` kết quả; nhãn thời gian do M03 suy ra. | Should |
| FN-M01-004 | Offline Need & Decision | Xác định nhu cầu offline (điểm dừng cần tải trước hoặc sơ đồ tuyến offline), hiện dung lượng ước tính, cho phép Download, Continue hoặc Back và hướng dẫn quét bằng nút trong app khi không có mạng. | Should* |
| FN-M01-005 | Offline Package Lifecycle | Tải gói theo từng mã QR, sơ đồ tuyến offline và chữ cốt lõi của tuyến; kiểm tra, publish atomic, cập nhật và xóa gói local; giữ bản cũ nếu cập nhật lỗi. | Should* |
| FN-M01-006 | Route Start & Handoff | Kiểm tra điều kiện Start online/offline và tạo `SelectedRouteContext v3` dùng một lần, hạn 24 giờ. | Must |
| FN-M01-007 | Shared Contract Publication | Chỉ công bố language, context hoàn chỉnh và package active `SAN_SANG` cho M02. | Must |

\* Gói offline là `Should`, nhưng phải nâng lên `Must` nếu increment phát hành có điểm dừng `OFFLINE_REQUIRED` hoặc sơ đồ tuyến cần dùng offline.

### 3.2 M02 — Field Quest Experience

| Function ID | Function | Phạm vi MVP | Priority |
|---|---|---|---|
| FN-M02-001 | Handoff Validation & Session Start | Một handoff v3 hợp lệ, chưa dùng, chưa hết hạn tạo tối đa một phiên; từ chối handoff v2 hoặc hết hạn với thông báo rõ. | Must |
| FN-M02-002 | Session Lifecycle & Recovery | Lưu, khôi phục và chuyển trạng thái phiên nhất quán; tối đa một phiên đang chạy trên mỗi trình duyệt. | Must |
| FN-M02-003 | Journey Map | Hiển thị journey cố định từ manifest cùng trạng thái đã quét. | Must |
| FN-M02-004 | QR Resolution & Check-in | Quét bằng nút trong app hoặc mở link QR từ camera; ghi một lượt ghé cho mỗi `(sessionId, checkpointId)` chỉ khi lần quét được chấp nhận; nhận diện mã thêm sau khi chuyến bắt đầu. | Must |
| FN-M02-005 | Content Delivery | Hiển thị nội dung của đúng mã đã quét: online dùng kết quả tra QR, offline dùng gói; thông báo khu vực tạm đóng. | Must |
| FN-M02-006 | Completion & Route Replacement | Hoàn tất khi đã quét điểm cuối và xác nhận (Finish hoặc câu hỏi kết thúc); tự đóng phiên bị bỏ quên sau 24 giờ; thay tuyến theo transaction bỏ phiên cũ/tạo phiên mới. | Must |
| FN-M02-007 | Terminal Sync | Lưu và retry `SessionSyncRecord` terminal, ẩn danh, bất biến. | Should |
| FN-M02-008 | Free Visitor Experience | Cho phép bất kỳ ai quét mã QR (kể cả bằng camera điện thoại) để xem nội dung mà không tạo tiến độ hoặc dữ liệu báo cáo. | Must |

### 3.3 M03 — Operations & Content Administration

| Function ID | Function | Phạm vi MVP | Priority |
|---|---|---|---|
| FN-M03-001 | Route Administration | Thông tin tuyến song ngữ, ảnh, tag (nhãn thời gian tự suy), chọn và sắp xếp các điểm dừng đã xuất bản, lifecycle tuyến. | Must |
| FN-M03-002 | Checkpoint Administration | Thư viện điểm dừng dùng chung, độc lập với tuyến; tên tiếng Việt không trùng; loại kết nối bắt buộc chọn. | Must |
| FN-M03-003 | QR Administration | Điểm tham quan với mã QR do hệ thống sinh; link QR công khai cố định; ảnh in; in lại và thu hồi an toàn. | Must |
| FN-M03-004 | Bilingual Content & Media | Nội dung `vi/en` riêng của từng mã QR, ảnh và audio/video (chỉ cho điểm dừng có mạng), upload nhiều tệp, xác nhận quyền sử dụng từng tệp. | Must |
| FN-M03-005 | Publication Review & Self-Publish | Kiểm tra hai mức, một nút "Lưu bản nháp", màn review bắt buộc trước khi tự xuất bản, giao diện tiếng Việt dễ hiểu với danh mục thông báo cố định. | Must |
| FN-M03-006 | Journey Snapshot | Snapshot bất biến, đánh số liên tục, cập nhật đồng thời mọi tuyến liên quan, trần dung lượng offline. | Must |
| FN-M03-007 | Emergency Operations | Đóng/mở lại/lưu trữ tuyến và điểm dừng theo quyền, tuyến tự đóng khi hết điểm dừng hoạt động, kết quả xác định và có audit. | Must |
| FN-M03-008 | Authentication, Accounts, Authorization & Concurrency | Login/invite/recovery, bootstrap Reviewer đầu tiên, hai role cố định, bảo vệ Reviewer cuối và từ chối stale write. | Must |
| FN-M03-009 | Live QR & Content Service | Tra QR công khai trả `VALID`, `TEMPORARILY_CLOSED` hoặc `INVALID` kèm nội dung của mã. | Must |
| FN-M03-010 | Session Intake & Reporting | Nhận terminal session bất biến, kiểm tra theo snapshot và cung cấp RPT-01/RPT-02 kèm ghi chú dữ liệu. | Should |
| FN-M03-011 | History, Restore & Audit Log | Lịch sử bản đã xuất bản, khôi phục bản cũ thành bản nháp, bỏ bản nháp, audit mọi thao tác; màn nhật ký toàn hệ thống cho Reviewer. | Must |

### 3.4 Priority của các năng lực bổ sung theo spec v3

| Năng lực | Function | Priority |
|---|---|---|
| Link QR công khai cố định và ảnh in | FN-M03-003 | Must |
| Lịch sử bản đã xuất bản và khôi phục bản cũ | FN-M03-011 | Must |
| Ghi audit cho mọi thao tác quản trị | FN-M03-011 | Must |
| Màn nhật ký toàn hệ thống cho Reviewer | FN-M03-011 | Should |
| Upload nhiều tệp trong một lần chọn | FN-M03-004 | Must |
| Một nút "Lưu bản nháp" cho cả form | FN-M03-005 | Must |
| Xem trước như du khách | FN-M03-005 | Should |
| Sơ đồ tuyến dùng offline | FN-M03-001, FN-M03-006, FN-M01-005 | Should |
| Ước tính dung lượng gói offline | FN-M03-006, FN-M01-004 | Should |
| Lưu chữ cốt lõi của tuyến để xem offline | FN-M01-005 | Should |
| Hạn handoff 24 giờ | FN-M01-006, FN-M02-001 | Must |
| Câu hỏi "Kết thúc chuyến đi?" và tự đóng phiên sau 24 giờ | FN-M02-006 | Must |
| Trang mở từ mã QR bằng camera điện thoại | FN-M02-004, FN-M02-008 | Must |

## 4. Won't — ngoài MVP

| Capability | Phạm vi | Ghi chú |
|---|---|---|
| AI/ML recommendation, scoring hoặc relevance ranking | M01 | MVP chỉ exact-match ba nhóm tag. |
| Ép tải package hoặc offline audio/video | M01 | Du khách có thể tiếp tục khi online; package chỉ gồm chữ, ảnh tĩnh và sơ đồ tuyến khi được đánh dấu. |
| Đồng bộ/recovery package hoặc tiến độ qua tài khoản, thiết bị hay trình duyệt khác | M01/M02 | Dữ liệu visitor chỉ lưu trên trình duyệt hiện tại. |
| Khuyến khích cài app lên màn hình chính iPhone | M01/M02 | App đã cài trên iOS không nhận link mở từ camera và có dữ liệu riêng. |
| GPS tracking, geofence hoặc turn-by-turn navigation | Cross-module | QR là cơ chế check-in duy nhất. |
| Bắt buộc ghé checkpoint theo thứ tự hoặc đủ 100% để hoàn tất | M02 | Chỉ cần quét điểm dừng có sequence cao nhất rồi xác nhận kết thúc, hoặc phiên tự đóng sau 24 giờ. |
| Hint chain, hidden message, điểm, huy hiệu hoặc leaderboard | M02 | Không thuộc hành trình MVP. |
| Visitor account hoặc thu thập PII/device identifier | M02/M03 | Session đồng bộ là ẩn danh. |
| Cảnh báo real-time hoặc ngắt phiên đang chạy khi route đóng | M03 → M02 | An toàn thực địa được bổ trợ bằng biện pháp ngoài hệ thống. |
| Offline admin hoặc đồng bộ draft quản trị | M03 | M03 hoạt động online-only. |
| Custom role, temporary delegation hoặc public admin sign-up | M03 | Chỉ `CONTENT_STAFF` và `REVIEWER`, cấp tài khoản theo invite. |
| Duyệt bởi người thứ hai hoặc hàng đợi duyệt | M03 | Thay bằng màn review bắt buộc, khôi phục bản cũ và audit. |
| Thay mã QR hai bước (tạo mã thay thế rồi kích hoạt) | M03 | Tem hỏng thì in lại giữ mã; đổi mã thì thêm điểm tham quan mới rồi thu hồi mã cũ. |
| Xuất bản nhiều điểm tham quan theo lô | M03 | Chỉ lần xuất bản đầu của điểm dừng mới đưa mọi điểm tham quan đã sẵn sàng lên cùng lúc. |
| Auto-merge thay đổi quản trị đồng thời và cảnh báo "người khác vừa sửa" | M03 | Stale write bị từ chối và yêu cầu tải lại. |
| Tự thử lại khi tạo snapshot lỗi | M03 | Báo lỗi một lần, giữ nguyên dữ liệu công khai; người dùng thử lại. |
| Danh bạ hoặc trường liên hệ khẩn cấp có cấu trúc | M03 | Số điện thoại cần thiết được viết trong các trường chữ của tuyến. |
| Advanced analytics, realtime dashboard hoặc export báo cáo | M03 | MVP chỉ có RPT-01 và RPT-02. |
| Thống kê lượt quét tự do và báo cáo theo từng mã QR | M02/M03 | Báo cáo chỉ ở mức điểm dừng, từ các phiên đã đồng bộ. |
| Visitor báo QR lắp sai vị trí | M02/M03 | Không có workflow xử lý trong MVP. |
| Xóa vật lý bất kỳ bản ghi đã lưu | M03 | Dùng các trạng thái lưu trữ, thu hồi, bỏ và khóa. |

## 5. Ràng buộc chung

- Tuyến là hành trình trong ngày và có một checkpoint cuối theo sequence cao nhất.
- Offline Start chỉ được phép khi có package `SAN_SANG`; package cũ nhưng hoàn chỉnh vẫn dùng được với cảnh báo khi biết đã outdated.
- Journey của phiên M02 được đóng băng từ handoff và không dựng lại từ dữ liệu live.
- Đóng route/checkpoint ảnh hưởng lượt đọc và Start mới, không sửa package hoặc phiên đã có trên thiết bị.
- M03 là online-only; write phải kiểm tra quyền phía server và publication quan trọng phải atomic, cho mọi tuyến liên quan cùng lúc.
- Mã QR in ra là link công khai cố định `{QR_PUBLIC_BASE_URL}/q/{qrIdentifier}`; domain Production phải được chốt trước khi in tem thật.
- Phiên chỉ được nhận diện trong cùng trình duyệt; khi không có mạng, chỉ nút Quét trong app được cam kết hoạt động.
- Timestamp lưu UTC; báo cáo lọc và nhóm ngày theo `Asia/Ho_Chi_Minh`.
- Physical schema, API path, UI layout và deployment topology thuộc tài liệu thiết kế, không được thay đổi ý nghĩa contract trong spec.

## 6. Tài liệu nguồn

- [Specification M01](docs/spec/spec-M01.md) v3.2
- [Specification M02](docs/spec/spec-M02.md) v3.2
- [Specification M03](docs/spec/spec-M03.md) v3.6
- [Function List M01](docs/function%20list/function-list-M01.md)
- [Function List M02](docs/function%20list/function-list-M02.md)
- [Function List M03](docs/function%20list/function-list-M03.md)
