# Screen Spec: Phiên trải nghiệm & Quét QR

| Field | Value |
|---|---|
| Screen ID | `SCR-M02-001` |
| Screen name | Phiên trải nghiệm & Quét QR |
| Module | `M02` |
| Actor | Visitor có phiên; khách tự do dùng nút Quét |
| Priority | Must; đồng bộ Should |
| Mockup | [mockup-SCR-M02-001.html](../../html/mockup-SCR-M02-001.html) (HTML tĩnh, chưa sign-off UX) |
| Status | Draft — đồng bộ [Spec M02 v3.3](../../../docs/spec/spec-M02.md) |

Nguồn hành vi/contract: [Spec M02](../../../docs/spec/spec-M02.md) (handoff theo [Spec M01 v3.2](../../../docs/spec/spec-M01.md), lookup theo [Spec M03 v3.7](../../../docs/spec/spec-M03.md)). Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu. Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline.

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Trong §9: **Confirmed** có nguồn baseline, **Proposed** chờ UX review, **Open** có clarification chưa được nguồn xác nhận. Draft không đồng nghĩa frontend/prototype đã được nghiệm thu. Chữ hiển thị cho người dùng chỉ là các câu trong ngoặc kép, câu của khóa MSG-* và bảng copy; tên trường, mã enum/trạng thái, định danh và khóa MSG-* trong tài liệu này chỉ để truy vết cho người phát triển, không bao giờ hiện trên giao diện.

## 1. Purpose

**Shown when:** M01 Start thành công và mở M02 với `SelectedRouteContext v3`; visitor mở lại ứng dụng/reload khi có phiên `DANG_DIEN_RA`; khách tự do mở nút Quét khi không có phiên. Mỗi lần mở app hoặc quay lại màn hình, phiên đã bắt đầu quá 24 giờ được tự đóng trước khi xử lý bất kỳ handoff nào (BR-M02-022).

**The user leaves when:** Mở nội dung điểm tham quan (SCR-M02-002); lượt ghé điểm cuối được ghi lần đầu hoặc chọn Finish (mở SCR-M02-003); hoặc quay về danh mục (SCR-M01-001) sau khi phiên kết thúc.

## 2. Mockup

Mockup HTML tĩnh: [mockup-SCR-M02-001.html](../../html/mockup-SCR-M02-001.html). Không dùng mockup để suy ngược business rule.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M02-001-01 | Language control VI/EN | Toggle (control của M01) | `LanguagePreference`; M02 chỉ đọc, không ghi | Yes | Đổi có hiệu lực ngay cho nội dung có sẵn; M01 là nơi ghi duy nhất (BR-M01-001) |
| 2 | E-SCR-M02-001-02 | Screen title | Header text | Tên màn hình theo ngôn ngữ | Yes | Non-empty |
| 3 | E-SCR-M02-001-03 | Handoff rejection message | Banner | Thông báo rõ khi handoff không dùng được: version 2, đã dùng, hết hạn (`expiresAt`), `REVOKED`, thiếu; kèm hướng dẫn bắt đầu lại từ M01 | Conditional | Chỉ `contractVersion = 3`, `AUTHORIZED`, chưa dùng, trước `expiresAt` (theo giờ thiết bị) mới tạo phiên; version 2 không bao giờ bị chuyển đổi ngầm (BR-M02-017) |
| 4 | E-SCR-M02-001-04 | Session start hint | Text | VI: "Trong chuyến đi, hãy quét bằng nút Quét trong ứng dụng để lượt ghé được ghi lại." (EN theo Spec M02 §5.1) | Conditional | Hiện khi bắt đầu phiên |
| 5 | E-SCR-M02-001-05 | Auto-end notice | Banner | VI: "Chuyến đi trước đã tự kết thúc và được ghi là hoàn thành." hoặc "Chuyến đi trước đã tự kết thúc vì đã quá 24 giờ." (EN theo Spec M02 §5.1) | Conditional | Chọn câu theo `HOAN_TAT` (đã thăm điểm cuối) hoặc `BO_DO`; hiện sau khi tự đóng phiên quá 24 giờ |
| 6 | E-SCR-M02-001-06 | Route journey map | Ordered list | `PlaySession.journeyCheckpoints` (frozen từ handoff), sắp theo `sequence` | Yes | Không dựng lại từ M03; số thứ tự hiển thị đếm liên tục dù `sequence` có khoảng trống (BR-M02-006) |
| 7 | E-SCR-M02-001-07 | Journey item | List item | Số thứ tự hiển thị, `checkpointName` theo ngôn ngữ hiện tại, trạng thái đã quét | Yes | Nhãn "Đã quét QR", không bao giờ diễn đạt là "đã đến" (BR-M02-005, SC-M02-013) |
| 8 | E-SCR-M02-001-08 | Item visited time | Text | `CheckpointVisit.checkedInAt` đầu tiên | Conditional | Giá trị đầu tiên bất biến; chỉ hiện với điểm đã quét |
| 9 | E-SCR-M02-001-09 | Action: Quét | Button | Mở scanner trong app; khách tự do dùng cùng nút khi không có phiên | Yes | Luôn khả dụng khi không có thao tác chặn |
| 10 | E-SCR-M02-001-10 | QR scanner | Camera view (vùng hoặc toàn màn hình) | Đọc nội dung mã QR | Conditional | Chỉ nhận link `{QR_PUBLIC_BASE_URL}/q/{qrIdentifier}` của môi trường hiện tại; mã khác hoặc base khác → thông báo mã không hợp lệ, không tra cứu (FR-M02-026, BR-M02-023) |
| 11 | E-SCR-M02-001-11 | Camera permission / unavailable state | Panel | Giải thích trạng thái quyền camera và cách thử lại, gồm lựa chọn quét bằng camera điện thoại | Conditional | Quyền do trình duyệt cấp; UI chỉ giải thích (Screen list M02 §4; BR-M02-023) |
| 12 | E-SCR-M02-001-12 | Lookup in progress | Spinner | Đang tra cứu mã QR | Conditional | Không có phản hồi trong 8 giây (`LOOKUP_TIMEOUT_SECONDS`) = lỗi tra cứu (BR-M02-005) |
| 13 | E-SCR-M02-001-13 | Check-in feedback | Toast/inline | Xác nhận lượt ghé đã được ghi (kể cả mã thêm sau khi phiên bắt đầu) | Conditional | Ghi một lượt ghé theo `(sessionId, checkpointId)` trước khi hiện nội dung; quét lặp không tạo bản ghi mới (FR-M02-007, FR-M02-009) |
| 14 | E-SCR-M02-001-14 | Closure notice | Banner | VI: "Khu vực này đang tạm đóng. Vui lòng dừng lại hoặc quay về theo hướng dẫn của Ban Quản lý." | Conditional | Cùng một thông báo cho `closedScope` `ROUTE` và `CHECKPOINT`; không nội dung, không lượt ghé (BR-M02-015) |
| 15 | E-SCR-M02-001-15 | Invalid QR message | Banner | VI: "Mã không còn hiệu lực hoặc không tồn tại." | Conditional | Cho `INVALID` hoặc mã không phải link QR của môi trường; không ghi lượt ghé |
| 16 | E-SCR-M02-001-16 | Connection-needed message | Banner | VI: "Cần có kết nối mạng để kiểm tra mã QR này." | Conditional | Offline hoặc lỗi tra cứu với mã không thuộc journey đóng băng; không phải mã không hợp lệ |
| 17 | E-SCR-M02-001-17 | Source failure notice | Text | VI: "Chưa tải được nội dung mới. Đang dùng nội dung đã lưu nếu có." | Conditional | Lỗi nguồn với mã thuộc journey; khác `INVALID` và khác tạm đóng (FR-M02-013) |
| 18 | E-SCR-M02-001-18 | Free-visitor hint | Text | VI: "Bạn đang xem tự do, lượt quét này không được ghi vào chuyến đi. Muốn ghi lại hành trình, hãy chọn tuyến." | Conditional | Hiện cho mọi lượt quét khi không có phiên; không tạo phiên/lượt ghé/bản ghi đồng bộ (FR-M02-019) |
| 19 | E-SCR-M02-001-19 | Action: Finish | Button | Mở xác nhận kết thúc chuyến | Conditional | Chỉ khả dụng sau khi đã quét điểm có `sequence` lớn nhất; còn khả dụng sau khi chọn "Đi tiếp" (FR-M02-015, BR-M02-021) |
| 20 | E-SCR-M02-001-20 | Action: Mở nội dung điểm đã quét | Tap item | Mở SCR-M02-002 cho đúng mã đã quét | Conditional | Quét lại hiển thị nội dung mã đó và thời điểm ghé cũ |
| 21 | E-SCR-M02-001-21 | Replace-session failure message | Banner | Không tạo được phiên thay thế; phiên cũ vẫn chạy | Conditional | Tạo phiên mới và đổi phiên cũ `BO_DO` là một thao tác nguyên tử (BR-M02-013) |
| 22 | E-SCR-M02-001-22 | Previous-trip sync error | Text một dòng | Chuyến đi đã kết thúc nhưng không gửi được về hệ thống (theo bảng copy) | Conditional | Hiện khi có `PendingSyncItem` ở `CONFLICT`; không có trang hàng đợi, không cho sửa dữ liệu chuyến đi (BR-M02-011) |

**Copy cố định (i18n vi/en).** Chuỗi hiển thị cho du khách là tài nguyên i18n đóng gói sẵn cùng ứng dụng (dùng được khi không có mạng), chọn theo `LanguagePreference`. Spec M01/M02 chỉ cố định một số câu; các câu còn lại dưới đây là chữ chốt ở mức screen spec, không thêm hành vi mới. Các câu đã cố định trong Spec M02 §5.1 (tạm đóng, mã không hợp lệ, cần kết nối, lỗi nguồn, gợi ý khách tự do, gợi ý bắt đầu phiên, phiên tự kết thúc) được dùng nguyên văn như ghi ở bảng inventory.

| Tình huống | Tiếng Việt | English |
|---|---|---|
| Tiêu đề màn (E-SCR-M02-001-02) | Chuyến đi | Your trip |
| Nút quét | Quét | Scan |
| Nhãn đã quét | Đã quét QR | QR scanned |
| Tiêu đề hành trình | Hành trình | Journey |
| Nhãn chưa quét | Chưa quét | Not scanned |
| Số điểm đã quét | Đã quét QR: {n}/{tổng} điểm | QR scanned: {n}/{total} points |
| Tiêu đề scanner | Quét mã QR | Scan a QR code |
| Hướng dẫn scanner | Đưa mã QR của điểm dừng vào khung. | Point the camera at the stop's QR code. |
| Nút đóng scanner | Đóng camera | Close camera |
| Nút thử lại camera | Thử lại | Try again |
| Nút Finish (E-SCR-M02-001-19) | Kết thúc chuyến | End trip |
| Đang tra cứu | Đang kiểm tra mã QR… | Checking the QR code… |
| Đã ghi nhận lượt quét | Đã ghi nhận lượt quét. | Scan recorded. |
| Handoff phiên bản 2 | Dữ liệu chuyến đi này thuộc phiên bản cũ. Hãy chọn tuyến và bắt đầu lại. | This trip data is from an older version. Please choose a route and start again. |
| Handoff đã dùng | Chuyến đi này đã được bắt đầu trước đó. Muốn đi lại, hãy chọn tuyến và bắt đầu lại. | This trip has already been started. To go again, choose a route and start again. |
| Handoff hết hạn | Lượt bắt đầu này đã hết hạn (quá 24 giờ). Hãy bắt đầu lại từ danh sách tuyến. | This start has expired (over 24 hours). Please start again from the route list. |
| Handoff bị thu hồi | Tuyến này không còn nhận chuyến mới. Hãy chọn tuyến khác. | This route no longer accepts new trips. Please choose another route. |
| Không có handoff | Chưa có chuyến đi để bắt đầu. Hãy chọn một tuyến. | There is no trip to start. Please choose a route. |
| Camera bị từ chối/không có | Không dùng được camera. Hãy cho phép truy cập camera hoặc quét mã bằng ứng dụng máy ảnh của điện thoại. | The camera cannot be used. Allow camera access, or scan the code with your phone's own camera app. |
| Thay phiên lỗi | Chưa bắt đầu được chuyến mới. Chuyến hiện tại vẫn đang chạy. | Could not start the new trip. Your current trip is still in progress. |
| Chuyến trước không gửi được (E-SCR-M02-001-22) | Chuyến đi trước không gửi được về hệ thống. Chuyến đi vẫn được lưu trên thiết bị này. | Your previous trip could not be sent to the system. It is still saved on this device. |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| Handoff rejected | Thông báo rõ và hướng dẫn bắt đầu lại từ M01 | Handoff version 2, đã dùng, hết hạn, `REVOKED` hoặc thiếu |
| Session started | Journey map, gợi ý quét bằng nút trong app | Handoff hợp lệ tạo phiên `DANG_DIEN_RA` |
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
| Final checkpoint visited | Câu hỏi kết thúc chuyến (SCR-M02-003), Finish khả dụng | Lượt ghé điểm cuối ghi lần đầu |
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

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M02-001 | Kiểm tra handoff v3, từ chối v2/hết hạn |
| FR-M02-002, FR-M02-003, FR-M02-004 | Một phiên mỗi trình duyệt, UUID, journey đóng băng |
| FR-M02-005 | Khôi phục phiên sau reload |
| FR-M02-006 | Lấy `qrIdentifier` từ link, phân giải online/offline |
| FR-M02-007, FR-M02-008, FR-M02-009 | Ghi lượt ghé, mọi thứ tự, quét lặp |
| FR-M02-012, FR-M02-013 | Mã ngoài journey, phân biệt `INVALID`/tạm đóng/lỗi nguồn |
| FR-M02-015 | Finish sau điểm cuối |
| FR-M02-017 | Thay phiên nguyên tử |
| FR-M02-018 | Tình trạng đồng bộ hiển thị trong phiên |
| FR-M02-019 | Chế độ khách tự do |
| FR-M02-022 | Mã thêm sau khi phiên bắt đầu |
| FR-M02-024 | Tự đóng phiên quá 24 giờ |
| FR-M02-025 | Gợi ý quét bằng nút trong ứng dụng |
| FR-M02-026 | Chỉ nhận link QR của môi trường hiện tại |

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
