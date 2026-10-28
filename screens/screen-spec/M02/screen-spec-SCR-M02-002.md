# Screen Spec: Nội dung điểm tham quan

| Field | Value |
|---|---|
| Screen ID | `SCR-M02-002` |
| Screen name | Nội dung điểm tham quan |
| Module | `M02` |
| Actor | Visitor; khách tự do |
| Priority | Must |
| Mockup | Chưa có |
| Status | Draft — đồng bộ [Spec M02 v3.3](../../../docs/spec/spec-M02.md) |

Nguồn hành vi/contract: [Spec M02](../../../docs/spec/spec-M02.md) (`LiveStationContent` theo [Spec M03 v3.7](../../../docs/spec/spec-M03.md) §5.1; `OfflinePackage.resources` theo [Spec M01 v3.2](../../../docs/spec/spec-M01.md)). Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu. Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline.

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Trong §9: **Confirmed** có nguồn baseline, **Proposed** chờ UX review, **Open** có clarification chưa được nguồn xác nhận. Draft không đồng nghĩa frontend/prototype đã được nghiệm thu. Chữ hiển thị cho người dùng chỉ là các câu trong ngoặc kép, câu của khóa MSG-* và bảng copy; tên trường, mã enum/trạng thái, định danh và khóa MSG-* trong tài liệu này chỉ để truy vết cho người phát triển, không bao giờ hiện trên giao diện.

## 1. Purpose

**Shown when:** Sau một lượt quét được chấp nhận hoặc kết quả `VALID` từ SCR-M02-001; khi visitor mở lại một điểm đã quét; hoặc khi SCR-M02-004 hiển thị nội dung của mã mở từ camera.

**The user leaves when:** Quay về scanner/phiên (SCR-M02-001); với trang mở từ link thì quay về trang đó.

## 2. Mockup

Chưa có mockup cho màn này. Không dùng ảnh mockup về sau để suy ngược business rule.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M02-002-01 | Language control VI/EN | Toggle (control của M01) | `LanguagePreference`; M02 chỉ đọc | Yes | Đổi có hiệu lực ngay cho chữ và danh sách audio/video (BR-M02-026) |
| 2 | E-SCR-M02-002-02 | Checkpoint name | Header text | `checkpointName.vi`/`.en` (live) hoặc tên đóng băng trong journey | Yes | Theo ngôn ngữ hiện tại |
| 3 | E-SCR-M02-002-03 | Object name | Header text | `objectName.vi`/`.en` của đúng mã đã quét | Yes | Nội dung theo từng mã QR, không phải nội dung chung của điểm dừng (BR-M02-014) |
| 4 | E-SCR-M02-002-04 | Introduction | Text | `localizedContent.<lang>.introductionText` của mã đã quét | Yes | Non-empty khi có nội dung |
| 5 | E-SCR-M02-002-05 | Images | Image list | `staticImages` (live: tham chiếu công khai; offline: byte đã lưu trong package) | Conditional | Có thể rỗng; ảnh giống nhau ở cả hai ngôn ngữ |
| 6 | E-SCR-M02-002-06 | Audio/video list | Media controls | `mediaResources[]` lọc theo `spokenLanguage` = ngôn ngữ hiện tại hoặc `NONE`, giữ thứ tự nhận được | Conditional | Chỉ hiện khi nội dung đang hiển thị có `mediaResources`; không bao giờ cho điểm dừng `OFFLINE_REQUIRED` hay nội dung từ package; không file khớp thì không hiện điều khiển (BR-M02-016, BR-M02-026) |
| 7 | E-SCR-M02-002-07 | Media play control | Button | Phát/dừng từng tệp | Conditional | Chỉ phát khi người dùng bấm; chỉ online; đổi VI/EN dừng tệp không còn trong danh sách |
| 8 | E-SCR-M02-002-08 | Visit time | Text | `checkedInAt` của lượt ghé (nếu mã thuộc phiên), hiển thị theo giờ của thiết bị, dạng hh:mm dd/mm/yyyy | Conditional | Diễn đạt là lượt quét, không phải bằng chứng hiện diện |
| 9 | E-SCR-M02-002-09 | Loading state | Spinner | Đang tải nội dung | Conditional | Hiện khi đang tra cứu/đọc package |
| 10 | E-SCR-M02-002-10 | No-offline-content message | Banner | VI: "Chưa có nội dung offline cho điểm này." | Conditional | Package `SAN_SANG` không có resource cho mã này và đang offline; không phải mã không hợp lệ (BR-M02-018) |
| 11 | E-SCR-M02-002-11 | Source-failure notice | Text | VI: "Chưa tải được nội dung mới. Đang dùng nội dung đã lưu nếu có." | Conditional | Lookup lỗi với mã thuộc journey; khác `INVALID` |
| 12 | E-SCR-M02-002-12 | Outdated-package warning | Text | Cảnh báo package cũ | Conditional | Hiện khi dùng nội dung từ package `SAN_SANG + OUTDATED` và biết trạng thái |
| 13 | E-SCR-M02-002-13 | ONLINE_AVAILABLE unavailable message | Banner | Điểm dừng có mạng không có nội dung offline | Conditional | Khi offline hoặc lỗi tra cứu với `ONLINE_AVAILABLE` (US-M02-03 mục 3) |
| 14 | E-SCR-M02-002-14 | Media error | Text | Tệp audio/video không phát được | Conditional | Lỗi nội dung không xóa lượt ghé đã ghi |
| 15 | E-SCR-M02-002-15 | Closure notice | Banner | VI: "Khu vực này đang tạm đóng. Vui lòng dừng lại hoặc quay về theo hướng dẫn của Ban Quản lý." | Conditional | Khi lookup `TEMPORARILY_CLOSED`; không có nội dung nào của điểm (BR-M02-015) |
| 16 | E-SCR-M02-002-16 | Free-visitor hint | Text | VI: "Bạn đang xem tự do, lượt quét này không được ghi vào chuyến đi. Muốn ghi lại hành trình, hãy chọn tuyến." | Conditional | Hiện cho mọi lượt xem khi không có phiên |
| 17 | E-SCR-M02-002-17 | Action: Quay lại | Button | Về scanner/phiên | Yes | None |

**Copy cố định (i18n vi/en).** Chuỗi hiển thị cho du khách là tài nguyên i18n đóng gói sẵn cùng ứng dụng (dùng được khi không có mạng), chọn theo `LanguagePreference`. Spec M01/M02 chỉ cố định một số câu; các câu còn lại dưới đây là chữ chốt ở mức screen spec, không thêm hành vi mới. Các câu đã cố định trong Spec M02 §5.1 được dùng nguyên văn như ghi ở bảng inventory.

| Tình huống | Tiếng Việt | English |
|---|---|---|
| Package cũ | Nội dung này lấy từ gói tải trước đã cũ, có thể chưa phải bản mới nhất. | This content comes from an outdated download and may not be the latest. |
| Điểm có mạng, đang offline/lỗi tra cứu | Điểm này cần có mạng để xem nội dung. | This point needs a network connection to show its content. |
| Lỗi media | Không phát được tệp này. | This file cannot be played. |
| Nút media | Phát · Dừng | Play · Pause |
| Thời điểm ghé | Quét lúc {thời điểm} | Scanned at {time} |
| Nút quay lại | Quay lại | Back |
| Nhãn tệp audio/video | Âm thanh {n} · Video {n} | Audio {n} · Video {n} |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| Loading | Spinner | Đang tra cứu hoặc đọc package |
| Live content | Nội dung mới nhất của mã, kèm media nếu có | Online, lookup `VALID` (cả hai loại kết nối) |
| Package content | Chữ và ảnh từ package, không có media | Offline hoặc lookup lỗi, điểm `OFFLINE_REQUIRED`, có resource |
| Package outdated | Nội dung từ package kèm cảnh báo cũ | Package `SAN_SANG + OUTDATED` |
| No offline content | Thông báo không có nội dung offline | Offline, package không có resource cho mã |
| Unavailable (online-only point) | Thông báo không có nội dung offline | `ONLINE_AVAILABLE`, offline/lỗi tra cứu |
| Fetch by QR only | Nội dung hỏi M03 riêng mã này | Online, package thiếu resource; không đổi package |
| Source failure | Thông báo lỗi nguồn, dùng nội dung đã lưu nếu có | Lookup lỗi/quá 8 giây |
| Media error | Thông báo lỗi tệp; chữ và ảnh vẫn hiện | Tệp không phát được |
| Closure | Thông báo tạm đóng, không nội dung | `TEMPORARILY_CLOSED` |
| Free-visitor | Nội dung kèm gợi ý khách tự do | Không có phiên |

## 5. Interactions and navigation

| # | Element | User action | System response | Destination screen / result |
|---|---|---|---|---|
| 1 | Màn hình | Mở sau khi quét | Online: dùng nội dung lookup `VALID`; offline/lỗi: đọc resource theo `qrIdentifier` từ package `SAN_SANG` | Show content |
| 2 | Language control | Đổi VI/EN | Đổi chữ và danh sách audio/video ngay; dừng tệp không còn hiển thị | State update |
| 3 | Media play | Tap | Phát tệp đã chọn | Playback |
| 4 | Quay lại | Tap | Về phiên/scanner (hoặc trang link) | `SCR-M02-001` / `SCR-M02-004` |

## 6. Screen-level rules

| Rule ID | Rule | Related requirement |
|---|---|---|
| SR-SCR-M02-002-001 | Nội dung hiển thị là của đúng mã đã quét; quét hai mã của một điểm dừng cho hai nội dung khác nhau nhưng chỉ một lượt ghé | BR-M02-014, SC-M02-008 |
| SR-SCR-M02-002-002 | Online: hiển thị nội dung lookup `VALID` cho cả hai loại kết nối; package chỉ dùng khi offline hoặc lookup lỗi | BR-M02-009, FR-M02-011, FR-M02-010 |
| SR-SCR-M02-002-003 | Package thiếu resource cho mã: online hỏi M03 riêng mã đó và không đổi package; offline hiện thông báo cố định; không phải mã không hợp lệ | BR-M02-018, SC-M02-012 |
| SR-SCR-M02-002-004 | Audio/video chỉ có với điểm dừng `ONLINE_AVAILABLE`, phát khi bấm và chỉ online; không có điều khiển media cho điểm `OFFLINE_REQUIRED` hay nội dung package | BR-M02-016, SC-M02-011 |
| SR-SCR-M02-002-005 | Chỉ liệt kê tệp có `spokenLanguage` bằng ngôn ngữ hiện tại cộng tệp `NONE`; đổi VI/EN đổi danh sách ngay; không tệp nào khớp thì không hiện điều khiển media | BR-M02-026, SC-M02-019 |
| SR-SCR-M02-002-006 | Lỗi nội dung không xóa lượt ghé đã ghi; `TEMPORARILY_CLOSED` không bao giờ hiện nội dung | BR-M02-005, BR-M02-015, SC-M02-004, SC-M02-009 |
| SR-SCR-M02-002-007 | Không màn hình nào diễn đạt lượt ghé như bằng chứng du khách có mặt tại chỗ | SC-M02-013 |
| SR-SCR-M02-002-008 | Package cũ được dùng cho mã có resource và phải hiện cảnh báo cũ khi biết | Spec M02 §5.1 (Content inputs) |
| SR-SCR-M02-002-009 | Nội dung live không được lưu; `LiveQrLookupResult`/`LiveStationContent` là transport, không là entity bền vững của M02 | Spec M02 §6.4 |

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M02-009 | Quét lại hiển thị nội dung mã và thời điểm ghé cũ |
| FR-M02-010 | Nội dung offline theo `qrIdentifier`, kể cả package cũ phù hợp |
| FR-M02-011 | Tra cứu online, nội dung live, media khi bấm |
| FR-M02-014 | Áp dụng `LanguagePreference` cho chữ và tệp audio/video |
| FR-M02-021 | Thông báo tạm đóng, không nội dung |
| FR-M02-019 | Chế độ khách tự do |

## 8. Responsive and accessibility notes

- Định hướng mobile-first: ưu tiên nội dung/action chính, wrap text/tags và stack panels theo chiều rộng thực tế; tránh chiều rộng cố định gây tràn ngang. 360px, 768px và 1280px là kích thước tham khảo để review, không phải hard breakpoint hoặc điều kiện bật/tắt tính năng.
- Review text dài vi/en (giới thiệu đến 2000 ký tự), zoom, keyboard/focus và error states; không ẩn action nghiệp vụ chỉ vì viewport nhỏ. Bố cục cuối cùng còn chờ UX review.
- Mục tiêu review accessibility: keyboard access, visible focus, semantic labels, ảnh có văn bản thay thế, điều khiển media có nhãn và phím tắt, nội dung không tự phát âm thanh/video và reduced motion. Tham khảo WCAG 2.1 AA, touch target khoảng 44×44px và contrast 4.5:1 cho normal text; đây là định hướng cần kiểm chứng trên frontend, không phải tuyên bố đã đạt chuẩn.

## 9. Open questions

| ID | Question | Blocking | Status | Resolution |
|---|---|---|---|---|
| OQ-SCR-M02-002-002 | Cách hiển thị tên tệp/nhãn cho nhiều audio/video cùng ngôn ngữ | No | Resolved | Danh sách tệp theo thứ tự nhận được, nhãn "Âm thanh {n}" / "Audio {n}" và "Video {n}" / "Video {n}", đánh số trong từng loại. |
| OQ-SCR-M02-002-003 | Hiển thị `checkedInAt` theo định dạng/múi giờ nào | No | Resolved | Giờ của thiết bị, dạng hh:mm dd/mm/yyyy cho cả hai ngôn ngữ; giá trị lưu vẫn là UTC. |

## Completion checklist

- [x] Required behavioral controls and feedback are described in the inventory.
- [x] Each input has a validation rule or explicit `None`.
- [x] Behavioral success/failure states in this screen scope are described.
- [x] Navigation screen IDs and requirement references resolve; behavioral mappings follow canonical sources.
- [ ] Final layout, copy, assets and UX choices are signed off.
- [ ] Responsive/accessibility and real interactions are verified on the frontend.
