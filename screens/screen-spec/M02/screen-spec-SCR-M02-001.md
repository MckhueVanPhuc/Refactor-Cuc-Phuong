# Screen Spec: Phiên trải nghiệm & Quét QR

| Field | Value |
|---|---|
| Screen ID | `SCR-M02-001` |
| Screen name | Phiên trải nghiệm & Quét QR |
| Module | `M02` |
| Actor | Visitor có phiên; khách tự do dùng nút Quét |
| Priority | Must; đồng bộ Should |
| Mockup | [mockup-SCR-M02-001.html](../../html/mockup-SCR-M02-001.html) (HTML tĩnh, chưa sign-off UX) |
| Status | Draft — đồng bộ [Spec M02 v3.3](../../../docs/spec/spec-M02.md) và [Spec Mascot v1.4](../../../docs/spec/spec-Mascot.md) cho Mila; thanh tiến trình hành trình theo design-system §5.3 (v1.4, CHG-MOTION-2026-11-24-01); thẻ tuyến, điểm tiếp theo và hàng đã quét theo [Spec M02 v3.5](../../../docs/spec/spec-M02.md) §7 và Spec Mascot v1.7 (CHG-MASCOT-2026-11-27-07); scanner, màn lỗi camera, khối dưới khi quét đủ theo Spec Mascot v1.8 (CHG-MASCOT-2026-11-27-08); thông báo kết quả quét theo Spec Mascot v1.9 (CHG-MASCOT-2026-11-27-09) |

Nguồn hành vi/contract: [Spec M02](../../../docs/spec/spec-M02.md) (handoff theo [Spec M01 v3.2](../../../docs/spec/spec-M01.md), lookup theo [Spec M03 v3.7](../../../docs/spec/spec-M03.md)). Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu. Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline. Mascot Mila theo [Spec Mascot](../../../docs/spec/spec-Mascot.md) v1.0 (slot §5.1, BR-MAS-01 đến BR-MAS-19, câu §5.6); Mila không thay, không che câu nào của màn này.

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Trong §9: **Confirmed** có nguồn baseline, **Proposed** chờ UX review, **Open** có clarification chưa được nguồn xác nhận. Draft không đồng nghĩa frontend/prototype đã được nghiệm thu. Chữ hiển thị cho người dùng chỉ là các câu trong ngoặc kép, câu của khóa MSG-* và bảng copy; tên trường, mã enum/trạng thái, định danh và khóa MSG-* trong tài liệu này chỉ để truy vết cho người phát triển, không bao giờ hiện trên giao diện.

## 1. Purpose

**Shown when:** M01 Start thành công và mở M02 với `SelectedRouteContext v3`; visitor mở lại ứng dụng/reload khi có phiên `DANG_DIEN_RA`; khách tự do mở nút Quét khi không có phiên. Mỗi lần mở app hoặc quay lại màn hình, phiên đã bắt đầu quá 24 giờ được tự đóng trước khi xử lý bất kỳ handoff nào (BR-M02-022).

**The user leaves when:** Mở nội dung điểm tham quan (SCR-M02-002); lượt ghé điểm cuối được ghi lần đầu hoặc chọn Finish (mở SCR-M02-003); hoặc quay về danh mục (SCR-M01-001) sau khi phiên kết thúc.

## 2. Mockup

Mockup HTML tĩnh: [mockup-SCR-M02-001.html](../../html/mockup-SCR-M02-001.html). Không dùng mockup để suy ngược business rule.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M02-001-01 | Language control VI/EN | Toggle (control của M01) | `LanguagePreference`; M02 chỉ đọc, không ghi. Có ở thanh đầu trang và ở hàng tiêu đề của scanner, kể cả màn lỗi camera (2026-11-27, BUG-020) | Yes | Đổi có hiệu lực ngay cho nội dung có sẵn; M01 là nơi ghi duy nhất (BR-M01-001) |
| 2 | E-SCR-M02-001-02 | Screen title | Header text | Tên màn hình theo ngôn ngữ | Yes | Non-empty |
| 3 | E-SCR-M02-001-03 | Handoff rejection message | Banner | Thông báo rõ khi handoff không dùng được: version 2, đã dùng, hết hạn (`expiresAt`), `REVOKED`, thiếu; kèm hướng dẫn bắt đầu lại từ M01 | Conditional | Chỉ `contractVersion = 3`, `AUTHORIZED`, chưa dùng, trước `expiresAt` (theo giờ thiết bị) mới tạo phiên; version 2 không bao giờ bị chuyển đổi ngầm (BR-M02-017) |
| 4 | E-SCR-M02-001-04 | Session start hint | Text | VI: "Trong chuyến đi, hãy quét bằng nút Quét trong ứng dụng để lượt ghé được ghi lại." (EN theo Spec M02 §5.1) | Conditional | Hiện khi bắt đầu phiên |
| 5 | E-SCR-M02-001-05 | Auto-end notice | Banner | VI: "Chuyến đi trước đã tự kết thúc và được ghi là hoàn thành." hoặc "Chuyến đi trước đã tự kết thúc vì đã quá 24 giờ." (EN theo Spec M02 §5.1) | Conditional | Chọn câu theo `HOAN_TAT` (đã thăm điểm cuối) hoặc `BO_DO`; hiện sau khi tự đóng phiên quá 24 giờ |
| 6 | E-SCR-M02-001-06 | Route journey map | Ordered list | `PlaySession.journeyCheckpoints` (frozen từ handoff), sắp theo `sequence` | Yes | Không dựng lại từ M03; số thứ tự hiển thị đếm liên tục dù `sequence` có khoảng trống (BR-M02-006) |
| 7 | E-SCR-M02-001-07 | Journey item | List item | Số thứ tự hiển thị, `checkpointName` theo ngôn ngữ hiện tại, trạng thái đã quét. v3.5: điểm đã quét có vòng ✓ thay số (danh sách có thứ tự vẫn đọc số cho trình đọc màn hình) và mũi tên › báo chạm được (E-20); điểm chưa quét đầu tiên theo thứ tự hiển thị là **điểm tiếp theo**: viền amber, nhãn "Tiếp theo" | Yes | Nhãn "Đã quét QR", không bao giờ diễn đạt là "đã đến" (BR-M02-005, SC-M02-013). "Tiếp theo" chỉ là gợi ý: điểm nào cũng quét được, không khóa điểm (BR-M02-006); quét hết thì không có điểm tiếp theo |
| 8 | E-SCR-M02-001-08 | Item visited time | Text | `CheckpointVisit.checkedInAt` đầu tiên | Conditional | Giá trị đầu tiên bất biến; chỉ hiện với điểm đã quét |
| 9 | E-SCR-M02-001-09 | Action: Quét | Button | Mở scanner trong app; khách tự do dùng cùng nút khi không có phiên. Nút chính; khi mọi điểm đã quét (E-27) thành nút phụ dưới "Kết thúc chuyến" | Yes | Luôn khả dụng khi không có thao tác chặn |
| 10 | E-SCR-M02-001-10 | QR scanner | Camera view (vùng hoặc toàn màn hình) | Đọc nội dung mã QR. Hàng tiêu đề "Quét mã QR" (serif) với E-01; khi có phiên và còn điểm chưa quét: nhãn "Đang tìm điểm {i} · {tên}" của điểm tiếp theo (E-07; chỉ gợi ý); khung bốn góc với vạch quét chạy lên xuống (2026-11-27) | Conditional | Chỉ nhận link `{QR_PUBLIC_BASE_URL}/q/{qrIdentifier}` của môi trường hiện tại; mã khác hoặc base khác → thông báo mã không hợp lệ, không tra cứu (FR-M02-026, BR-M02-023) |
| 11 | E-SCR-M02-001-11 | Camera permission / unavailable state | Panel | Giải thích trạng thái quyền camera và cách thử lại, gồm lựa chọn quét bằng camera điện thoại. 2026-11-27: icon camera gạch chéo; câu cố định; khung "Cách bật camera" ba bước (bảng copy); "Thử lại" là nút chính, "Đóng camera" nút phụ; không có Mila (Spec Mascot v1.8 §5.1). 2026-11-28: ba bước là một bộ chung cho mọi máy, không nhắc thanh địa chỉ web (bảng copy); "Thử lại" xin lại quyền camera ngay trong lần bấm, trình duyệt quyết định có hỏi lại hay không; khi quyền đổi sang cho phép lúc đang ở trạng thái này thì camera tự mở lại | Conditional | Quyền do trình duyệt cấp; UI chỉ giải thích (Screen list M02 §4; BR-M02-023) |
| 12 | E-SCR-M02-001-12 | Lookup in progress | Spinner | Đang tra cứu mã QR: icon lá xoay cạnh dòng "Đang kiểm tra mã QR…" (giảm chuyển động: đứng yên) | Conditional | Không có phản hồi trong 8 giây (`LOOKUP_TIMEOUT_SECONDS`) = lỗi tra cứu (BR-M02-005) |
| 13 | E-SCR-M02-001-13 | Check-in feedback | Toast (design-system §5.3: 6 giây, nút đóng, không đẩy nội dung; 2026-11-21). v1.2: khi Mila hoạt động, bong bóng xác nhận của Mila thay toast; toast là dự phòng; điểm cuối không có toast (Spec Mascot BR-MAS-24) | Xác nhận lượt ghé đã được ghi (kể cả mã thêm sau khi phiên bắt đầu) | Conditional | Ghi một lượt ghé theo `(sessionId, checkpointId)` trước khi hiện nội dung; quét lặp không tạo bản ghi mới (FR-M02-007, FR-M02-009) |
| 14 | E-SCR-M02-001-14 | Closure notice | Banner | VI: "Khu vực này đang tạm đóng. Vui lòng dừng lại hoặc quay về theo hướng dẫn của Ban Quản lý." | Conditional | Cùng một thông báo cho `closedScope` `ROUTE` và `CHECKPOINT`; không nội dung, không lượt ghé (BR-M02-015) |
| 15 | E-SCR-M02-001-15 | Invalid QR message | Banner | VI: "Mã không còn hiệu lực hoặc không tồn tại." Có nút × đóng thông báo (2026-11-27) | Conditional | Cho `INVALID` hoặc mã không phải link QR của môi trường; không ghi lượt ghé |
| 16 | E-SCR-M02-001-16 | Connection-needed message | Banner | Tiêu đề "Chưa kiểm tra được mã này"; câu cố định VI: "Cần có kết nối mạng để kiểm tra mã QR này."; khi có phiên: "Lượt quét chưa được tính. Hành trình bên dưới giữ nguyên."; nút "Thử lại" (tra lại đúng mã) và × đóng thông báo (2026-11-27, CHG-MASCOT-2026-11-27-09). Không có hình Mila (Spec Mascot v1.9) | Conditional | Offline hoặc lỗi tra cứu với mã không thuộc journey đóng băng; không phải mã không hợp lệ |
| 17 | E-SCR-M02-001-17 | Source failure notice | Text | VI: "Chưa tải được nội dung mới. Đang dùng nội dung đã lưu nếu có." | Conditional | Lỗi nguồn với mã thuộc journey; khác `INVALID` và khác tạm đóng (FR-M02-013) |
| 18 | E-SCR-M02-001-18 | Free-visitor hint | Text | VI: "Bạn đang xem tự do, lượt quét này không được ghi vào chuyến đi. Muốn ghi lại hành trình, hãy chọn tuyến." | Conditional | Hiện cho mọi lượt quét khi không có phiên; không tạo phiên/lượt ghé/bản ghi đồng bộ (FR-M02-019) |
| 19 | E-SCR-M02-001-19 | Action: Finish | Button | Mở xác nhận kết thúc chuyến (E-SCR-M02-003-01…04). Nút phụ dưới "Quét QR"; khi mọi điểm đã quét là nút chính trong E-27 (2026-11-27) | Conditional | spec-M02 v3.4: khả dụng mọi lúc khi có phiên `DANG_DIEN_RA`; vẫn còn sau khi chọn "Đi tiếp" (FR-M02-015, BR-M02-021). Xác nhận trước khi quét điểm cuối → `BO_DO` (BR-M02-007) |
| 20 | E-SCR-M02-001-20 | Action: Mở nội dung điểm đã quét | Tap item | Mở SCR-M02-002 cho đúng mã đã quét | Conditional | Quét lại hiển thị nội dung mã đó và thời điểm ghé cũ |
| 21 | E-SCR-M02-001-21 | Replace-session failure message | Banner | Không tạo được phiên thay thế; phiên cũ vẫn chạy | Conditional | Tạo phiên mới và đổi phiên cũ `BO_DO` là một thao tác nguyên tử (BR-M02-013) |
| 22 | E-SCR-M02-001-22 | Previous-trip sync error | Text một dòng | Chuyến đi đã kết thúc nhưng không gửi được về hệ thống (theo bảng copy) | Conditional | Hiện khi có `PendingSyncItem` ở `CONFLICT`; không có trang hàng đợi, không cho sửa dữ liệu chuyến đi (BR-M02-011) |
| 23 | E-SCR-M02-001-23 | Mascot Mila | Ảnh + bong bóng trong slot (Spec Mascot §5.1) | Cạnh nút Quét QR (DOCK); cạnh vùng thông báo (INLINE); dải dưới khung trong scanner (AVATAR, không đè khung quét); đầu dialog cuối chuyến (INLINE, không làm chậm dialog). Không có Mila khi có thông báo tạm đóng. Câu: bảng copy bên dưới | Conditional (Could, MVP-Scope §3.6) | Chỉ trong slot, không chiếm focus, ảnh `alt=""`; bong bóng ≤ 90 ký tự, có nút đóng; không có nút ẩn Mila; tôn trọng giảm chuyển động (BR-MAS-11, BR-MAS-17); v1.1: cỡ theo design-system §9.2, bong bóng kiểu "Giấy dã ngoại" §9.3, chạm theo ngữ cảnh và chạm nhiều lần (BR-MAS-12, 22), cử chỉ tự động ở màn Mila đứng chờ (BR-MAS-21), công tắc chuyển động ở SCR-M01-004 (v1.3) |
| 24 | E-SCR-M02-001-24 | Công tắc "Chuyển động" của Mila | **Bỏ ở v1.3**: thanh đầu trang không còn nút chuyển động; công tắc duy nhất ở màn Tài nguyên SCR-M01-004 (Spec Mascot BR-MAS-21) | — | — | — |
| 25 | E-SCR-M02-001-25 | Journey progress bar (v1.4; chia đoạn từ 2026-11-27) | Progress bar trong thẻ tuyến (E-26) | Mỗi điểm của `PlaySession.journeyCheckpoints` một đoạn theo thứ tự hiển thị: đã quét màu success, điểm tiếp theo màu amber, còn lại rãnh mờ; k/n cùng nguồn với câu "Đã quét QR: k/n điểm" | Yes (khi có phiên) | Chỉ hình thức; câu tiến độ giữ nguyên là thông tin chính. `role="progressbar"`, `aria-valuenow` = k, `aria-valuemax` = n; không phải slot của Mila (Spec Mascot §5.1). Đoạn của điểm vừa có lượt ghé mới sáng lên khi quay về (design-system §4.3.1 T1). Không diễn đạt là "đã đến" (SC-M02-013) |
| 27 | E-SCR-M02-001-27 | All-scanned action card (2026-11-27, CHG-MASCOT-2026-11-27-08) | Card ở đáy màn thay khối nút | "Bạn đã quét đủ {n}/{n} điểm!"; nút chính "Kết thúc chuyến" (E-19); nút phụ "Quét QR" (E-09) | Conditional | Chỉ khi mọi điểm của journey đã có lượt ghé (k = n). Không đổi điều kiện hay câu hỏi của Finish (FR-M02-015, BR-M02-021). Trượt lên khi điểm vừa quét làm đủ (T1); giảm chuyển động: mờ dần |
| 26 | E-SCR-M02-001-26 | Route summary card (2026-11-27) | Card đầu hành trình | Nhãn "Tuyến đang đi"; tên tuyến = `routeEssentials.name` theo ngôn ngữ hiện tại của gói `SAN_SANG` đang dùng cùng `routeId` của phiên (Spec M02 v3.5 §5.1 "Content inputs"); E-25; câu "Đã quét QR: k/n điểm"; "Còn {r} điểm" (r = n − k) hoặc "Đã quét mã ở tất cả các điểm" | Yes (khi có phiên) | Không có gói hoặc đọc lỗi: không có dòng tên tuyến, phần còn lại giữ nguyên. Tên tuyến chỉ để hiển thị, không ghi vào phiên hay dữ liệu đồng bộ |

**Copy cố định (i18n vi/en).** Chuỗi hiển thị cho du khách là tài nguyên i18n đóng gói sẵn cùng ứng dụng (dùng được khi không có mạng), chọn theo `LanguagePreference`. Spec M01/M02 chỉ cố định một số câu; các câu còn lại dưới đây là chữ chốt ở mức screen spec, không thêm hành vi mới. Các câu đã cố định trong Spec M02 §5.1 (tạm đóng, mã không hợp lệ, cần kết nối, lỗi nguồn, gợi ý khách tự do, gợi ý bắt đầu phiên, phiên tự kết thúc) được dùng nguyên văn như ghi ở bảng inventory.

| Tình huống | Tiếng Việt | English |
|---|---|---|
| Tiêu đề màn (E-SCR-M02-001-02) | Chuyến đi | Your trip |
| Nút quét | Quét QR | Scan QR |
| Nhãn đã quét | Đã quét QR | QR scanned |
| Tiêu đề hành trình | Hành trình | Journey |
| Nhãn thẻ tuyến (E-26) | Tuyến đang đi | Current route |
| Số điểm còn lại (E-26) | Còn {r} điểm | {r} stops left (r = 1: "1 stop left") |
| Đã quét hết (E-26) | Đã quét mã ở tất cả các điểm | Every stop scanned |
| Nhãn điểm tiếp theo (E-07) | Tiếp theo | Next |
| Nhãn chưa quét | Chưa quét | Not scanned |
| Số điểm đã quét | Đã quét QR: {n}/{tổng} điểm | QR scanned: {n}/{total} points |
| Tiêu đề scanner | Quét mã QR | Scan a QR code |
| Hướng dẫn scanner | Đưa mã QR của điểm dừng vào khung. | Point the camera at the stop's QR code. |
| Nút đóng scanner | Đóng camera | Close camera |
| Nút thử lại camera | Thử lại | Try again |
| Nhãn điểm đang tìm trong scanner (E-10) | Đang tìm điểm {i} · {tên} | Looking for stop {i} · {name} |
| Tiêu đề hướng dẫn bật camera (E-11) | Cách bật camera | How to turn on the camera |
| Bước bật camera (mọi máy, 2026-11-28) | 1. Mở Cài đặt của điện thoại hoặc trình duyệt · 2. Cho phép ứng dụng dùng camera · 3. Quay lại và bấm Thử lại | 1. Open your phone or browser settings · 2. Allow camera access for this app · 3. Come back and tap Try again |
| Quét đủ mọi điểm (E-27) | Bạn đã quét đủ {n}/{n} điểm! | You've scanned all {n} points! |
| Nút Finish (E-SCR-M02-001-19) | Kết thúc chuyến | End trip |
| Đang tra cứu | Đang kiểm tra mã QR… | Checking the QR code… |
| Đã ghi nhận lượt quét | Đã ghi nhận lượt quét. | Scan recorded. |
| Nút đóng toast (tên truy cập, 2026-11-21) | Đóng thông báo | Dismiss |
| Handoff phiên bản 2 | Dữ liệu chuyến đi này thuộc phiên bản cũ. Hãy chọn tuyến và bắt đầu lại. | This trip data is from an older version. Please choose a route and start again. |
| Handoff đã dùng | Chuyến đi này đã được bắt đầu trước đó. Muốn đi lại, hãy chọn tuyến và bắt đầu lại. | This trip has already been started. To go again, choose a route and start again. |
| Handoff hết hạn | Lượt bắt đầu này đã hết hạn (quá 24 giờ). Hãy bắt đầu lại từ danh sách tuyến. | This start has expired (over 24 hours). Please start again from the route list. |
| Handoff bị thu hồi | Tuyến này không còn nhận chuyến mới. Hãy chọn tuyến khác. | This route no longer accepts new trips. Please choose another route. |
| Không có handoff | Chưa có chuyến đi để bắt đầu. Hãy chọn một tuyến. | There is no trip to start. Please choose a route. |
| Camera bị từ chối/không có | Không dùng được camera. Hãy cho phép truy cập camera hoặc quét mã bằng ứng dụng máy ảnh của điện thoại. | The camera cannot be used. Allow camera access, or scan the code with your phone's own camera app. |
| Thay phiên lỗi | Chưa bắt đầu được chuyến mới. Chuyến hiện tại vẫn đang chạy. | Could not start the new trip. Your current trip is still in progress. |
| Tiêu đề chưa kiểm tra được mã (E-16) | Chưa kiểm tra được mã này | This code couldn't be checked |
| Lượt quét chưa được tính, màn Chuyến đi (E-16) | Lượt quét chưa được tính. Hành trình bên dưới giữ nguyên. | This scan wasn't counted. Your journey below is unchanged. |
| Nút thử lại tra mã (E-16) | Thử lại | Try again |
| Chuyến trước không gửi được (E-SCR-M02-001-22) | Chuyến đi trước không gửi được về hệ thống. Chuyến đi vẫn được lưu trên thiết bị này. | Your previous trip could not be sent to the system. It is still saved on this device. |
| Mila khi bắt đầu chuyến (MSG-MAS-030, v1.7) | Điểm tiếp theo: {next}. Tìm tem QR ở đó rồi bấm Quét QR nhé! | Next stop: {next}. Find its QR sign there and tap Scan QR! |
| Chạm Mila (SCR-M02-001) (MSG-MAS-032) | Thấy tem thì bấm Quét QR. Chạm điểm đã quét để đọc lại nhé. | Spot a sign? Tap Scan QR. Tap a scanned stop to read it again. |
| Mila chào khi mở lại app giữa chuyến (MSG-MAS-034) | Chào mừng quay lại! Hành trình của bạn vẫn còn nguyên. | Welcome back! Your trip is just as you left it. |
| Mila hướng dẫn quét lần đầu (MSG-MAS-040) | — (chỉ minh họa từ v1.2) | — (illustration only since v1.2) |
| Mila khi quét lâu chưa được (MSG-MAS-042) | Chưa quét được? Thử lại gần hơn và tránh chỗ chói nắng. | No luck yet? Move a little closer and avoid the glare. |
| Mila khi tra mã chậm (MSG-MAS-044) | Sóng hơi yếu, mình vẫn đang kiểm tra… | Weak signal, still checking… |
| Mila sau 2 lần mã không hợp lệ (MSG-MAS-046) | Hãy quét tem QR của Vườn ở điểm dừng. Tem cũ thì thử tem khác nếu có. | Scan a park QR sign at the stop. If it looks old, try another one. |
| Mila sau 2 lần cần kết nối (MSG-MAS-048) | Mã này cần có sóng để kiểm tra. Điểm trong tuyến vẫn quét được khi mất sóng. | This code needs signal to check. Stops on your route still scan offline. |
| Mila gợi ý tắt camera (nút "Đóng camera" / "Chưa") (MSG-MAS-049) | Mình tắt camera cho đỡ tốn pin nhé? | Shall I turn the camera off to save battery? (buttons "Close camera" / "Not now") |
| Mila khi quay lại hành trình sau lượt ghé mới, còn điểm tiếp theo (MSG-MAS-056, v1.7) | Điểm tiếp theo: {next}. Tham quan xong thì đi tiếp và quét mã nhé! | Next stop: {next}. Take your time here, then scan there. |
| Mila nhắc ứng xử với thiên nhiên (a, chờ Ban Quản lý duyệt) (MSG-MAS-057a) | Đi nhẹ, nói khẽ để nghe được tiếng rừng nhé. | Walk softly and talk quietly, the forest is listening. |
| Mila nhắc ứng xử với thiên nhiên (b) (MSG-MAS-057b) | Ngắm thôi, đừng hái hay mang gì ra khỏi rừng nhé. | Look, don't pick. Leave everything as you found it. |
| Mila nhắc ứng xử với thiên nhiên (c) (MSG-MAS-057c) | Giữ rác trong ba lô cho tới khi gặp thùng rác nhé. | Keep your litter in your bag until you find a bin. |
| Mila nhắc ứng xử với thiên nhiên (d) (MSG-MAS-057d) | Đi đúng đường mòn để an toàn cho bạn và cho rừng. | Stay on the trail, it's safer for you and the forest. |
| Mila nhắc ứng xử với thiên nhiên (e) (MSG-MAS-057e) | Đừng cho thú ăn nhé, đồ ăn của người không tốt cho chúng. | Please don't feed the animals, our food isn't good for them. |
| Mila khi chọn "Đi tiếp" (MSG-MAS-061) | Được thôi! Khi sẵn sàng, nút Kết thúc chuyến vẫn ở đây. | Sure! The End trip button is here whenever you're ready. |
| Mila khi mất sóng giữa chuyến (MSG-MAS-074) | Mất sóng rồi. Đừng lo, các điểm trong tuyến vẫn quét được. | Signal's gone, but stops on your route can still be scanned. |
| Mila khi có sóng lại (MSG-MAS-075) | Có sóng lại rồi! | Signal's back! |
| Tên truy cập khi chạm Mila | Hỏi Mila | Ask Mila |
| Nút đóng bong bóng của Mila | Đóng lời nhắn | Dismiss message |
| Chạm Mila giữa chặng (MSG-MAS-033, v1.7) | Chạm điểm đã quét để đọc lại, hoặc quét tem QR ở điểm tiếp theo nhé. | Tap a scanned stop to read it again, or scan the sign at the next stop. |
| Chạm Mila khi đang mở camera (MSG-MAS-043) | Lại gần tem hơn và tránh chỗ chói nắng nhé. | Move closer to the sign and avoid the glare. |
| Mila khi bị chạm liên tục (MSG-MAS-085) | Ui, chóng mặt quá! | Whoa, I'm dizzy! |
| Nút phụ khi Mila gợi ý tắt camera | Chưa | Not now |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| Handoff rejected | Thông báo rõ và hướng dẫn bắt đầu lại từ M01 | Handoff version 2, đã dùng, hết hạn, `REVOKED` hoặc thiếu |
| Session started | Thẻ tuyến (E-26), journey map với điểm 1 là điểm tiếp theo, gợi ý quét bằng nút trong app | Handoff hợp lệ tạo phiên `DANG_DIEN_RA` |
| Session restored | Cùng phiên và lượt ghé cũ | Reload/mở lại khi có phiên chạy |
| Previous session auto-ended | Thông báo phiên trước đã tự kết thúc | Phiên quá 24 giờ khi mở app/quay lại màn hình |
| Scanning | Camera view | Chọn Quét |
| Camera denied / unavailable | Giải thích và cách thử lại | Trình duyệt từ chối/không có camera |
| Looking up | Spinner | Đang tra cứu online |
| Visit recorded | Phản hồi ghi nhận; chuyển sang nội dung | Lượt quét được chấp nhận (BR-M02-005) |
| Closure notice | Thông báo tạm đóng, không nội dung | Lookup `TEMPORARILY_CLOSED` |
| Invalid QR | Thông báo mã không hợp lệ | Lookup `INVALID` hoặc mã không phải link môi trường hiện tại |
| Connection needed | Thông báo cần kết nối | Offline/lỗi tra cứu, mã ngoài journey đóng băng |
| Out of journey (VALID) | Nội dung live, không lượt ghé, không đổi journey | Lookup `VALID` nhưng điểm dừng ngoài journey |
| Free-visitor | Nội dung kèm gợi ý khách tự do | Quét khi không có phiên |
| Final checkpoint visited | Câu hỏi kết thúc chuyến mở một lần ở màn này khi du khách quay về (v3.4, BR-M02-021) | Lượt ghé điểm cuối ghi lần đầu |
| Sync error visible | Lỗi đồng bộ hiển thị trong phiên/kết quả | Conflict/rejected (xem SCR-M02-003) |

## 5. Interactions and navigation

| # | Element | User action | System response | Destination screen / result |
|---|---|---|---|---|
| 1 | Màn hình | Mở app/quay lại màn hình | Áp dụng tự đóng phiên quá 24 giờ; sau đó mới xử lý handoff | State update |
| 2 | Handoff từ M01 | Start | Kiểm tra version 3, `AUTHORIZED`, chưa dùng, chưa hết hạn; tạo một phiên UUID; sao chép manifest thành journey đóng băng | Session started |
| 3 | Handoff mới khi đang có phiên | Start lại | Tạo phiên thay thế và chuyển phiên cũ sang `BO_DO` nguyên tử; lỗi thì giữ phiên cũ | Session replaced / error |
| 4 | Quét | Tap | Mở scanner | Scanning |
| 5 | Mã QR đã đọc | Quét | Trích `qrIdentifier`; online tra cứu M03 (kèm `routeId` nếu có phiên); offline phân giải qua journey đóng băng | Một trong các kết quả ở §4 |
| 6 | Lượt quét được chấp nhận | — | Ghi lượt ghé nếu chưa có, rồi hiện nội dung | `SCR-M02-002` |
| 7 | Điểm đã quét | Tap | Hiện nội dung mã đã quét và thời điểm ghé cũ | `SCR-M02-002` |
| 8 | Lượt ghé điểm cuối ghi lần đầu | — | Hỏi kết thúc chuyến | `SCR-M02-003` |
| 9 | Finish | Tap | Mở xác nhận kết thúc | `SCR-M02-003` |
| 10 | Phiên kết thúc | — | Quay về danh mục | `SCR-M01-001` |

## 6. Screen-level rules

| Rule ID | Rule | Related requirement |
|---|---|---|
| SR-SCR-M02-001-001 | Mỗi handoff hợp lệ tạo tối đa một phiên; tối đa một phiên `DANG_DIEN_RA` mỗi trình duyệt; `sessionId` là UUID duy nhất, `sourceHandoffId` duy nhất | FR-M02-001, FR-M02-002, FR-M02-003, BR-M02-001, BR-M02-002 |
| SR-SCR-M02-001-002 | Journey đóng băng được sao chép từ manifest handoff và không đổi suốt vòng đời phiên; mã M03 thêm sau không được thêm vào | FR-M02-004, BR-M02-003, BR-M02-020 |
| SR-SCR-M02-001-003 | Lượt ghé được ghi một lần theo `(sessionId, checkpointId)` trước khi hiện nội dung; lỗi nội dung không xóa lượt ghé | FR-M02-007, BR-M02-004, BR-M02-005, SC-M02-002, SC-M02-004 |
| SR-SCR-M02-001-004 | Online chỉ ghi lượt ghé khi lookup `VALID` và điểm dừng thuộc journey (qua mã đóng băng hoặc `checkpointId` trả về); `TEMPORARILY_CLOSED`/`INVALID` không ghi gì; offline hoặc lỗi tra cứu ghi khi mã thuộc journey đóng băng | BR-M02-005, BR-M02-020, FR-M02-022 |
| SR-SCR-M02-001-005 | Thứ tự check-in không bị ép; Finish mở sau khi quét điểm có `sequence` lớn nhất; không cần quét đủ 100% | FR-M02-008, FR-M02-015, BR-M02-006, BR-M02-007 |
| SR-SCR-M02-001-006 | Mã ngoài journey chỉ xem nội dung live, không tạo lượt ghé và không đổi tuyến | FR-M02-012, BR-M02-008 |
| SR-SCR-M02-001-007 | Lookup gửi `routeId` chỉ khi có phiên; khách tự do không gửi | BR-M02-019 |
| SR-SCR-M02-001-008 | Trạng thái đã quét luôn diễn đạt là "Đã quét QR", không phải bằng chứng hiện diện | BR-M02-005, SC-M02-013 |
| SR-SCR-M02-001-009 | Offline không biết được tạm đóng nên không hiện thông báo tạm đóng; an toàn thực địa xử lý ngoài ứng dụng | BR-M02-015, US-M02-08 mục 4 |
| SR-SCR-M02-001-010 | Phiên quá 24 giờ được tự đóng khi mở app/quay lại màn hình: `HOAN_TAT` nếu đã thăm điểm cuối, ngược lại `BO_DO`; `endedAt` là `checkedInAt` mới nhất hoặc `startedAt` | FR-M02-024, BR-M02-022, SC-M02-016 |
| SR-SCR-M02-001-011 | Hết hạn handoff chỉ chặn tạo phiên, không bao giờ kết thúc phiên đã tạo | BR-M02-017, SC-M02-010 |
| SR-SCR-M02-001-012 | M02 không ghi dữ liệu M01/M03 | FR-M02-020 |
| SR-SCR-M02-001-013 | Mila chỉ hiện trong slot của màn và không che nút, vùng thông báo, toast, dialog hay nội dung; câu cố định của màn giữ nguyên; Mila không đổi hành vi hay dữ liệu của màn và không có nút ẩn; có thông báo tạm đóng thì Mila rời màn; nhắc khi không hoạt động chỉ chạy trong scanner | BR-MAS-01, BR-MAS-02, BR-MAS-03, BR-MAS-08, BR-MAS-11 |

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M02-001 | Kiểm tra handoff v3, từ chối v2/hết hạn |
| FR-M02-002, FR-M02-003, FR-M02-004 | Một phiên mỗi trình duyệt, UUID, journey đóng băng |
| FR-M02-005 | Khôi phục phiên sau reload |
| FR-M02-006 | Lấy `qrIdentifier` từ link, phân giải online/offline |
| FR-M02-007, FR-M02-008, FR-M02-009 | Ghi lượt ghé, mọi thứ tự, quét lặp |
| FR-M02-012, FR-M02-013 | Mã ngoài journey, phân biệt `INVALID`/tạm đóng/lỗi nguồn |
| FR-M02-015 | Finish mọi lúc, có xác nhận (v3.4) |
| FR-M02-017 | Thay phiên nguyên tử |
| FR-M02-018 | Tình trạng đồng bộ hiển thị trong phiên |
| FR-M02-019 | Chế độ khách tự do |
| FR-M02-022 | Mã thêm sau khi phiên bắt đầu |
| FR-M02-024 | Tự đóng phiên quá 24 giờ |
| FR-M02-025 | Gợi ý quét bằng nút trong ứng dụng |
| FR-M02-026 | Chỉ nhận link QR của môi trường hiện tại |
| FR-MAS-001, FR-MAS-002, FR-MAS-003, FR-MAS-009 | Mascot Mila: slot, phản ứng theo sự kiện, lời thoại theo ngôn ngữ, không đổi hành vi của màn (Spec Mascot) |

## 8. Responsive and accessibility notes

- Định hướng mobile-first: ưu tiên nội dung/action chính, wrap text/tags và stack panels theo chiều rộng thực tế; tránh chiều rộng cố định gây tràn ngang. 360px, 768px và 1280px là kích thước tham khảo để review, không phải hard breakpoint hoặc điều kiện bật/tắt tính năng.
- Review text dài vi/en, zoom, keyboard/focus và error states; không ẩn action nghiệp vụ chỉ vì viewport nhỏ. Bố cục cuối cùng còn chờ UX review.
- Mục tiêu review accessibility: keyboard access, visible focus, semantic labels, trạng thái đã quét không chỉ biểu đạt bằng màu, thông báo kết quả quét được công bố cho công nghệ hỗ trợ và reduced motion. Tham khảo WCAG 2.1 AA, touch target khoảng 44×44px và contrast 4.5:1 cho normal text; đây là định hướng cần kiểm chứng trên frontend, không phải tuyên bố đã đạt chuẩn.

## 9. Open questions

| ID | Question | Blocking | Status | Resolution |
|---|---|---|---|---|
| OQ-SCR-M02-001-002 | Scanner dạng vùng nhúng hay toàn màn hình | No | Resolved | Scanner mở toàn màn hình khi bấm "Quét", có nút đóng; kết quả quét quay về phiên hoặc mở nội dung. |
| OQ-SCR-M02-001-003 | Hiển thị trạng thái đồng bộ trong phiên (SCR-M02-001 hay chỉ SCR-M02-003) | No | Resolved | Trạng thái đồng bộ của chuyến vừa kết thúc hiện ở SCR-M02-003; lỗi conflict/bị từ chối của chuyến trước hiện thêm một dòng ở SCR-M02-001 (E-SCR-M02-001-22). |

## Completion checklist

- [x] Required behavioral controls and feedback are described in the inventory.
- [x] Each input has a validation rule or explicit `None`.
- [x] Behavioral success/failure states in this screen scope are described.
- [x] Navigation screen IDs and requirement references resolve; behavioral mappings follow canonical sources.
- [ ] Final layout, copy, assets and UX choices are signed off.
- [ ] Responsive/accessibility and real interactions are verified on the frontend.
