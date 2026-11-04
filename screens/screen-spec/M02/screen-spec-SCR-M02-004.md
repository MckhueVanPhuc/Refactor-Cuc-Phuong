# Screen Spec: Trang mở từ mã QR

| Field | Value |
|---|---|
| Screen ID | `SCR-M02-004` |
| Screen name | Trang mở từ mã QR |
| Module | `M02` |
| Actor | Bất kỳ ai quét mã bằng camera điện thoại |
| Priority | Must |
| Mockup | [mockup-SCR-M02-004.html](../../html/mockup-SCR-M02-004.html) (HTML tĩnh, chưa sign-off UX) |
| Status | Draft — đồng bộ [Spec M02 v3.3](../../../docs/spec/spec-M02.md) |

Nguồn hành vi/contract: [Spec M02](../../../docs/spec/spec-M02.md) (US-M02-09, FR-M02-025/026, BR-M02-023 đến 025) và link công khai theo [Spec M03 v3.7](../../../docs/spec/spec-M03.md) BR-M03-B04. Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu. Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline.

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Trong §9: **Confirmed** có nguồn baseline, **Proposed** chờ UX review, **Open** có clarification chưa được nguồn xác nhận. Draft không đồng nghĩa frontend/prototype đã được nghiệm thu. Chữ hiển thị cho người dùng chỉ là các câu trong ngoặc kép, câu của khóa MSG-* và bảng copy; tên trường, mã enum/trạng thái, định danh và khóa MSG-* trong tài liệu này chỉ để truy vết cho người phát triển, không bao giờ hiện trên giao diện.

## 1. Purpose

**Shown when:** Camera điện thoại mở link công khai `{QR_PUBLIC_BASE_URL}/q/{qrIdentifier}` trong trình duyệt. Trang không đi qua màn chọn ngôn ngữ hay chọn tuyến.

**The user leaves when:** Chọn liên kết sang danh mục tuyến (SCR-M01-001); hoặc, khi có phiên và quét điểm cuối lần đầu, chuyển sang câu hỏi kết thúc chuyến (SCR-M02-003).

## 2. Mockup

Mockup HTML tĩnh: [mockup-SCR-M02-004.html](../../html/mockup-SCR-M02-004.html). Không dùng mockup để suy ngược business rule.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M02-004-01 | Language control VI/EN | Toggle (control của M01) | `LanguagePreference` đã lưu; nếu chưa có thì ngôn ngữ máy: Tiếng Việt nếu máy là tiếng Việt, ngược lại Tiếng Anh | Yes | Đổi có hiệu lực ngay và được lưu; M01 vẫn là nơi ghi duy nhất (BR-M02-024) |
| 2 | E-SCR-M02-004-02 | Scanned content block | Nội dung (như SCR-M02-002) | Nội dung của mã trong link: tên điểm dừng, tên đối tượng, giới thiệu, ảnh, audio/video khi có | Conditional | Hiển thị theo quy tắc của SCR-M02-002; media chỉ khi nội dung có `mediaResources` |
| 3 | E-SCR-M02-004-03 | Free-visitor hint with catalog link | Text + link | VI: "Bạn đang xem tự do, lượt quét này không được ghi vào chuyến đi. Muốn ghi lại hành trình, hãy chọn tuyến." kèm liên kết sang danh mục tuyến | Conditional | Hiện cho mọi lượt xem khi không có phiên trong cùng trình duyệt |
| 4 | E-SCR-M02-004-04 | Action: Chọn tuyến | Link | Mở SCR-M01-001 | Conditional | Chỉ ở chế độ khách tự do |
| 5 | E-SCR-M02-004-05 | Check-in feedback | Toast/inline | Xác nhận lượt ghé đã được ghi | Conditional | Chỉ khi có phiên chạy trong cùng trình duyệt và lượt quét được chấp nhận (BR-M02-005) |
| 6 | E-SCR-M02-004-06 | Auto-end notice | Banner | VI: "Chuyến đi trước đã tự kết thúc và được ghi là hoàn thành." hoặc "Chuyến đi trước đã tự kết thúc vì đã quá 24 giờ." | Conditional | Tự đóng phiên quá 24 giờ được áp dụng trước mọi xử lý khác (BR-M02-022, BR-M02-024) |
| 7 | E-SCR-M02-004-07 | Closure notice | Banner | VI: "Khu vực này đang tạm đóng. Vui lòng dừng lại hoặc quay về theo hướng dẫn của Ban Quản lý." | Conditional | Khi lookup `TEMPORARILY_CLOSED`; không nội dung, không lượt ghé |
| 8 | E-SCR-M02-004-08 | Invalid QR message | Banner | VI: "Mã không còn hiệu lực hoặc không tồn tại." | Conditional | Khi lookup `INVALID`; cũng dùng (không tra cứu) khi đoạn `qrIdentifier` của đường dẫn rỗng, giống nguyên tắc mã không hợp lệ của scanner trong app (BR-M02-023) |
| 9 | E-SCR-M02-004-09 | Connection-needed message | Banner | VI: "Cần có kết nối mạng để kiểm tra mã QR này." | Conditional | Offline hoặc lỗi tra cứu ở chế độ khách tự do, hoặc mã không thuộc journey đóng băng |
| 10 | E-SCR-M02-004-10 | Loading state | Spinner | Đang tra cứu | Conditional | Quá 8 giây không phản hồi = lỗi tra cứu |
| 11 | E-SCR-M02-004-11 | Source-failure notice | Text | VI: "Chưa tải được nội dung mới. Đang dùng nội dung đã lưu nếu có." | Conditional | Khi có phiên và mã thuộc journey đóng băng |
| 12 | E-SCR-M02-004-12 | Action: Mở nội dung (có phiên) | Navigation | Hiển thị nội dung như SCR-M02-002 | Conditional | Sau khi ghi lượt ghé (nếu được chấp nhận) |

**Copy cố định (i18n vi/en).** Chuỗi hiển thị cho du khách là tài nguyên i18n đóng gói sẵn cùng ứng dụng (dùng được khi không có mạng), chọn theo `LanguagePreference`. Spec M01/M02 chỉ cố định một số câu; các câu còn lại dưới đây là chữ chốt ở mức screen spec, không thêm hành vi mới. Các câu đã cố định trong Spec M02 §5.1 (gợi ý khách tự do, tạm đóng, mã không hợp lệ, cần kết nối, lỗi nguồn, phiên tự kết thúc) được dùng nguyên văn như ghi ở bảng inventory.

| Tình huống | Tiếng Việt | English |
|---|---|---|
| Tiêu đề trang (tên sản phẩm, không dịch) | Cúc Phương Quest | Cúc Phương Quest |
| Nút VI/EN | VI · EN | VI · EN |
| Liên kết sang danh mục | Chọn tuyến | Choose a route |
| Đang tra cứu | Đang kiểm tra mã QR… | Checking the QR code… |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| Loading | Spinner | Đang tra cứu |
| Free-visitor content | Nội dung kèm gợi ý và liên kết danh mục | Không có phiên chạy trong cùng trình duyệt, lookup `VALID` |
| Session scan | Xử lý như quét trong app: ghi lượt ghé nếu được chấp nhận, rồi nội dung; câu hỏi kết thúc khi quét điểm cuối lần đầu | Có phiên `DANG_DIEN_RA` trong cùng trình duyệt |
| Out of journey | Nội dung live, không lượt ghé | Có phiên nhưng điểm dừng ngoài journey |
| Closure notice | Thông báo tạm đóng | `TEMPORARILY_CLOSED` |
| Invalid | Thông báo mã không hợp lệ | `INVALID` |
| Connection needed | Thông báo cần kết nối | Offline/lỗi tra cứu, chế độ khách tự do hoặc mã ngoài journey |
| Browser offline page | Trang offline do trình duyệt tự hiện (ứng dụng không điều khiển được) | Không có mạng và trình duyệt chưa từng mở ứng dụng |
| Previous session auto-ended | Thông báo phiên trước đã tự kết thúc | Phiên quá 24 giờ |

## 5. Interactions and navigation

| # | Element | User action | System response | Destination screen / result |
|---|---|---|---|---|
| 1 | Mở link `/q/{qrIdentifier}` | Camera điện thoại mở | Áp dụng tự đóng phiên quá 24 giờ; lấy `qrIdentifier` từ đoạn cuối của đường dẫn | State update |
| 2 | Có phiên trong cùng trình duyệt | — | Xử lý y như quét trong app (lookup kèm `routeId`, lượt ghé, thông báo tạm đóng, câu hỏi kết thúc) | Content / `SCR-M02-003` |
| 3 | Không có phiên | — | Chế độ khách tự do: lookup không kèm `routeId`, không ghi gì | Free-visitor content |
| 4 | Language control | Đổi VI/EN | Đổi ngôn ngữ và danh sách audio/video ngay; lưu lựa chọn | State update |
| 5 | Chọn tuyến | Tap | Mở danh mục tuyến | `SCR-M01-001` |

## 6. Screen-level rules

| Rule ID | Rule | Related requirement |
|---|---|---|
| SR-SCR-M02-004-001 | Trang không bao giờ tạo phiên và không hiện bước chọn ngôn ngữ hay chọn tuyến trước nội dung | BR-M02-024, FR-M02-025, SC-M02-017, SC-M02-018 |
| SR-SCR-M02-004-002 | Ngôn ngữ: `LanguagePreference` đã lưu, nếu chưa có thì ngôn ngữ máy (Việt nếu máy là tiếng Việt, ngược lại Anh); nút VI/EN là control của M01 nên M01 vẫn là nơi ghi duy nhất | BR-M02-024, BR-M01-001 |
| SR-SCR-M02-004-003 | Có phiên trong cùng trình duyệt thì xử lý y như quét trong app; phiên ở trình duyệt khác hoặc app đã cài không được nhận diện | BR-M02-024, US-M02-09 |
| SR-SCR-M02-004-004 | Không có phiên: chế độ khách tự do, không gửi `routeId`, không ghi phiên/lượt ghé/bản ghi đồng bộ, luôn hiện gợi ý một dòng kèm liên kết danh mục | FR-M02-019, BR-M02-012, BR-M02-019 |
| SR-SCR-M02-004-005 | Offline: trang chỉ mở được nếu trình duyệt này từng mở ứng dụng (app shell đã cache), khi đó hoạt động như quét offline; ngược lại trình duyệt tự báo không có kết nối | BR-M02-025 |
| SR-SCR-M02-004-006 | Chỉ nút Quét trong ứng dụng được đảm bảo hoạt động offline | BR-M02-025 |
| SR-SCR-M02-004-007 | `TEMPORARILY_CLOSED` hiện thông báo cố định và không nội dung, không lượt ghé; offline không biết tạm đóng nên không hiện thông báo | BR-M02-015, US-M02-08 |
| SR-SCR-M02-004-008 | Không diễn đạt lượt ghé là bằng chứng có mặt tại chỗ | SC-M02-013 |

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M02-006 | Lấy `qrIdentifier` từ link, phân giải online/offline |
| FR-M02-011 | Tra cứu online và nội dung live |
| FR-M02-012, FR-M02-013 | Mã ngoài journey; phân biệt `INVALID`/tạm đóng/lỗi nguồn |
| FR-M02-014 | Ngôn ngữ và danh sách audio/video |
| FR-M02-019 | Khách tự do không tạo dữ liệu |
| FR-M02-021 | Thông báo tạm đóng |
| FR-M02-022 | Mã thêm sau khi phiên bắt đầu (có phiên) |
| FR-M02-024 | Tự đóng phiên quá 24 giờ |
| FR-M02-025 | Trang `/q/{qrIdentifier}` không bước chặn |

## 8. Responsive and accessibility notes

- Định hướng mobile-first (đây là màn hình được mở trực tiếp từ camera điện thoại): ưu tiên nội dung chính, wrap text và stack panels; tránh chiều rộng cố định gây tràn ngang. 360px, 768px và 1280px là kích thước tham khảo để review, không phải hard breakpoint hoặc điều kiện bật/tắt tính năng.
- Review text dài vi/en, zoom, keyboard/focus và error states; không ẩn action nghiệp vụ chỉ vì viewport nhỏ. Bố cục cuối cùng còn chờ UX review.
- Mục tiêu review accessibility: keyboard access, visible focus, semantic labels, nút VI/EN nhận biết được bằng công nghệ hỗ trợ, thông báo tạm đóng/không hợp lệ được công bố và reduced motion. Tham khảo WCAG 2.1 AA, touch target khoảng 44×44px và contrast 4.5:1 cho normal text; đây là định hướng cần kiểm chứng trên frontend, không phải tuyên bố đã đạt chuẩn.

## 9. Open questions

| ID | Question | Blocking | Status | Resolution |
|---|---|---|---|---|
| OQ-SCR-M02-004-002 | Vị trí đặt nút VI/EN và liên kết danh mục trên trang | No | Resolved | Nút VI/EN ở góc phải header; liên kết "Chọn tuyến" nằm ngay dưới dòng gợi ý khách tự do. |

## Completion checklist

- [x] Required behavioral controls and feedback are described in the inventory.
- [x] Each input has a validation rule or explicit `None`.
- [x] Behavioral success/failure states in this screen scope are described.
- [x] Navigation screen IDs and requirement references resolve; behavioral mappings follow canonical sources.
- [ ] Final layout, copy, assets and UX choices are signed off.
- [ ] Responsive/accessibility and real interactions are verified on the frontend.
