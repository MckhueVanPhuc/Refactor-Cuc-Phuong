# Screen Spec: Danh mục tuyến

| Field | Value |
|---|---|
| Screen ID | `SCR-M01-001` |
| Screen name | Danh mục tuyến |
| Module | `M01` |
| Actor | Visitor |
| Priority | Must |
| Mockup | Chưa có |
| Status | Draft — đồng bộ [Spec M01 v3.2](../../../docs/spec/spec-M01.md) |

Nguồn hành vi/contract: [Spec M01](../../../docs/spec/spec-M01.md) (Published Route input theo [Spec M03 v3.7](../../../docs/spec/spec-M03.md) §5.1). Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu. Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline.

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Trong §9: **Confirmed** có nguồn baseline, **Proposed** chờ UX review, **Open** có clarification chưa được nguồn xác nhận. Draft không đồng nghĩa frontend/prototype đã được nghiệm thu. Chữ hiển thị cho người dùng chỉ là các câu trong ngoặc kép, câu của khóa MSG-* và bảng copy; tên trường, mã enum/trạng thái, định danh và khóa MSG-* trong tài liệu này chỉ để truy vết cho người phát triển, không bao giờ hiện trên giao diện.

## 1. Purpose

**Shown when:** Entry mặc định của visitor khi mở ứng dụng. Nếu trình duyệt chưa có `LanguagePreference`, bước chọn ngôn ngữ `vi`/`en` chặn trước khi vào danh mục (US-M01-01 mục 1). Vào bằng link QR công khai (`/q/{qrIdentifier}`) không đi qua màn này mà mở SCR-M02-004.

**The user leaves when:** Mở chi tiết tuyến (SCR-M01-003), mở gợi ý tuyến (SCR-M01-002), mở quản lý tài nguyên offline (SCR-M01-004), hoặc đổi ngôn ngữ (ở lại màn này).

## 2. Mockup

Chưa có mockup cho màn này. Không suy ngược business rule từ bất kỳ ảnh mockup nào về sau.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M01-001-01 | Language selection step | Panel/dialog chặn | Chọn `vi` hoặc `en`; chỉ hiện khi chưa có `LanguagePreference` và vào bằng entry thường | Conditional | Chỉ nhận `vi`/`en`; giá trị khác bị từ chối (FR-M01-001); chưa chọn thì chưa vào danh mục |
| 2 | E-SCR-M01-001-02 | Language control VI/EN | Toggle (control dùng chung) | `LanguagePreference.languageCode`; có trên mọi màn du khách | Yes | Đổi có hiệu lực ngay cho UI và nội dung `vi/en` có sẵn, không đổi trạng thái package (BR-M01-001) |
| 3 | E-SCR-M01-001-03 | Screen title | Header text | Tên màn hình theo ngôn ngữ đã chọn | Yes | Non-empty |
| 4 | E-SCR-M01-001-04 | Stale data notice | Text | Nhãn "dữ liệu cũ/chưa chắc mới nhất" khi đang hiển thị local view | Conditional | Hiện khi không đọc được nguồn; không khẳng định là mới nhất (FR-M01-002) |
| 5 | E-SCR-M01-001-05 | Route card list | List | Published Route từ M03; chỉ gồm tuyến `status = HOAT_DONG` và `activeContentVersion` hợp lệ | Yes | Tuyến `TAM_DONG`/`LUU_TRU` hoặc thiếu `activeContentVersion` không xuất hiện (BR-M01-002) |
| 6 | E-SCR-M01-001-06 | Card thumbnail | Image | `thumbnail.sourceRef` | Yes | Ảnh lỗi → placeholder trung tính; thẻ vẫn dùng được (US-M01-02 mục 4) |
| 7 | E-SCR-M01-001-07 | Card name | Text | `name.vi`/`name.en` theo ngôn ngữ đã chọn | Yes | Không tự sinh giá trị thiếu |
| 8 | E-SCR-M01-001-08 | Card short description | Text | `shortDescription.vi`/`.en` | Yes | Như trên |
| 9 | E-SCR-M01-001-09 | Card distance | Text | `distanceKm` (km) | Yes | Hiển thị đúng giá trị nguồn (> 0, ≤ 100, tối đa 1 chữ số thập phân theo contract) |
| 10 | E-SCR-M01-001-10 | Card duration | Text | `durationMin` (phút) | Yes | Hiển thị đúng giá trị nguồn (> 0, ≤ 1440) |
| 11 | E-SCR-M01-001-11 | Card difficulty | Badge | `difficulty` (`NHE`/`TRUNG_BINH`/`KHO`) | Yes | Chỉ enum cho phép; nhãn i18n xem bảng nhãn ở SCR-M01-002 |
| 12 | E-SCR-M01-001-12 | Card checkpoint count | Text | `checkpointCount` | Yes | Số nguyên ≥ 0 từ snapshot đang hoạt động |
| 13 | E-SCR-M01-001-13 | Offline-needed mark | Badge | Hiện khi `hasOfflineRequiredCheckpoint` hoặc `hasOfflineRouteMap` là `true` | Conditional | Theo BR-M01-012; snapshot tải về mới là nguồn quyết định cuối cùng |
| 14 | E-SCR-M01-001-14 | Action: Mở chi tiết tuyến | Tap card | Mở SCR-M01-003 với tuyến đã chọn | Yes | Chỉ với tuyến đang chọn được |
| 15 | E-SCR-M01-001-15 | Action: Gợi ý tuyến | Button | Mở SCR-M01-002 | Yes | None |
| 16 | E-SCR-M01-001-16 | Action: Tài nguyên offline | Button | Mở SCR-M01-004 | Yes | None |
| 17 | E-SCR-M01-001-17 | Loading state | Spinner | Đang đọc nguồn | Conditional | Hiện khi đang tải |
| 18 | E-SCR-M01-001-18 | Empty state | Text | Không có tuyến nào chọn được | Conditional | Hiện khi nguồn trả về nhưng không có tuyến `HOAT_DONG` hợp lệ |
| 19 | E-SCR-M01-001-19 | Source unavailable | Text | Không đọc được nguồn và không có local view | Conditional | Request lỗi dù trình duyệt báo online vẫn coi là nguồn không khả dụng |

**Copy cố định (i18n vi/en).** Chuỗi hiển thị cho du khách là tài nguyên i18n đóng gói sẵn cùng ứng dụng (dùng được khi không có mạng), chọn theo `LanguagePreference`. Spec M01/M02 chỉ cố định một số câu; các câu còn lại dưới đây là chữ chốt ở mức screen spec, không thêm hành vi mới.

| Tình huống | Tiếng Việt | English |
|---|---|---|
| Tiêu đề màn | Danh mục tuyến | Routes |
| Nhãn điều hướng | Danh mục tuyến · Gợi ý tuyến · Tài nguyên offline | Routes · Route suggestions · Offline downloads |
| Nhãn nhóm điều khiển ngôn ngữ | Ngôn ngữ | Language |
| Bước chọn ngôn ngữ | Chọn ngôn ngữ (Tiếng Việt / English) | Choose your language (Tiếng Việt / English) |
| Dấu cần tải trước | Cần tải trước | Download first |
| Số điểm dừng / quãng đường / thời lượng | {n} điểm dừng · {km} km · {phút} phút | {n} stops · {km} km · {min} min |
| Danh sách trống | Hiện chưa có tuyến nào để chọn. | No routes are available right now. |
| Hiển thị dữ liệu đã lưu | Dữ liệu đã lưu, có thể chưa phải bản mới nhất. | Saved data, which may not be the latest. |
| Không đọc được nguồn, chưa có dữ liệu | Chưa tải được danh sách tuyến. Hãy kiểm tra kết nối và thử lại. | Could not load the routes. Check your connection and try again. |
| Lời nhắc cập nhật ứng dụng (shell dùng chung cho mọi màn du khách M01/M02; quyết định người dùng 2026-10-30) | Đã có phiên bản mới của ứng dụng. | A new version of the app is available. |
| Nút áp dụng bản mới | Cập nhật | Update |
| Nút hoãn | Để sau | Later |
| Cập nhật bị hoãn (đang tải gói hoặc có chuyến đi đang diễn ra) | Ứng dụng đang tải gói hoặc có chuyến đi đang diễn ra. Hãy thử cập nhật lại sau khi xong. | A route download or trip is in progress. Please try updating again when it finishes. |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| Language required | Chỉ bước chọn ngôn ngữ | Chưa có `LanguagePreference`, entry thường |
| Loading | Spinner tại vùng danh sách | Đang đọc/làm mới nguồn |
| Has routes | Danh sách thẻ tuyến | Nguồn trả về ít nhất một tuyến chọn được |
| Empty | Thông báo không có tuyến | Không có tuyến `HOAT_DONG` hợp lệ |
| Stale / offline | Danh sách local cuối cùng kèm nhãn dữ liệu cũ | Mất nguồn nhưng có local view |
| Source unavailable | Thông báo không đọc được nguồn | Mất nguồn, không có local view |
| Image failed | Placeholder trung tính trên thẻ | Ảnh không tải được |
| Route removed | Tuyến biến mất khỏi danh sách | Làm mới nguồn thành công báo tuyến `TAM_DONG`/`LUU_TRU` (US-M01-05) |

## 5. Interactions and navigation

| # | Element | User action | System response | Destination screen / result |
|---|---|---|---|---|
| 1 | Language selection step | Chọn `vi` hoặc `en` | Lưu và công bố `LanguagePreference`; vào danh mục | State update |
| 2 | Language control | Đổi VI/EN | Cập nhật `LanguagePreference` ngay; đổi UI và nội dung có sẵn | State update |
| 3 | Route card | Tap | Mở chi tiết tuyến | `SCR-M01-003` |
| 4 | Gợi ý tuyến | Tap | Mở màn gợi ý | `SCR-M01-002` |
| 5 | Tài nguyên offline | Tap | Mở quản lý package | `SCR-M01-004` |
| 6 | Màn hình | Mở/làm mới | Đọc Published Route; thay local view khi thành công | Reload list |

## 6. Screen-level rules

| Rule ID | Rule | Related requirement |
|---|---|---|
| SR-SCR-M01-001-001 | Chỉ tuyến `HOAT_DONG` có `activeContentVersion` hợp lệ được liệt kê và chọn được | BR-M01-002, FR-M01-002 |
| SR-SCR-M01-001-002 | Entry thường yêu cầu chọn ngôn ngữ; entry bằng link QR không bao giờ hiện bước này (dùng ngôn ngữ máy) | US-M01-01, FR-M01-001 |
| SR-SCR-M01-001-003 | M01 là nơi duy nhất ghi `LanguagePreference`; đổi ngôn ngữ không đổi trạng thái package | BR-M01-001 |
| SR-SCR-M01-001-004 | Khi mất nguồn chỉ hiển thị local view, có nhãn dữ liệu cũ, không khẳng định là mới nhất | FR-M01-002 |
| SR-SCR-M01-001-005 | Trường tùy chọn vắng không thay bằng placeholder văn bản; chỉ ảnh lỗi dùng placeholder trung tính | FR-M01-002, FR-M01-003 |
| SR-SCR-M01-001-006 | Màn hình không ghi dữ liệu M03 và không đụng session M02 | BR-M01-010 |

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M01-001 | Chọn/đổi `vi`/`en`, control dùng chung |
| FR-M01-002 | Thẻ tuyến, làm mới nguồn, giữ local view khi offline, bỏ tuyến không khả dụng |
| FR-M01-013 | `LanguagePreference` được công bố cho M02 |

## 8. Responsive and accessibility notes

- Định hướng mobile-first: ưu tiên nội dung/action chính, wrap text/tags và stack panels theo chiều rộng thực tế; tránh chiều rộng cố định gây tràn ngang. 360px, 768px và 1280px là kích thước tham khảo để review, không phải hard breakpoint hoặc điều kiện bật/tắt tính năng.
- Review text dài vi/en, zoom, keyboard/focus và error states; không ẩn action nghiệp vụ chỉ vì viewport nhỏ. Bố cục cuối cùng còn chờ UX review.
- Mục tiêu review accessibility: keyboard access, visible focus, semantic labels, trạng thái không chỉ biểu đạt bằng màu, ảnh có văn bản thay thế và reduced motion. Tham khảo WCAG 2.1 AA, touch target khoảng 44×44px và contrast 4.5:1 cho normal text; đây là định hướng cần kiểm chứng trên frontend, không phải tuyên bố đã đạt chuẩn.

## 9. Open questions

| ID | Question | Blocking | Status | Resolution |
|---|---|---|---|---|
| OQ-SCR-M01-001-001 | Thứ tự hiển thị các thẻ tuyến trong danh mục | No | Resolved | Thẻ tuyến sắp theo tên tuyến A→Z theo ngôn ngữ đang chọn. Đây là thứ tự trình bày trung tính, không chấm điểm hay xếp hạng (Spec M01 §4.2). |
| OQ-SCR-M01-001-003 | Cách trình bày bước chọn ngôn ngữ (màn riêng, dialog hay panel) | No | Resolved | Panel chặn toàn trang trước danh mục, hai nút "Tiếng Việt" và "English"; không có lựa chọn bỏ qua. |

## Completion checklist

- [x] Required behavioral controls and feedback are described in the inventory.
- [x] Each input has a validation rule or explicit `None`.
- [x] Behavioral success/failure states in this screen scope are described.
- [x] Navigation screen IDs and requirement references resolve; behavioral mappings follow canonical sources.
- [ ] Final layout, copy, assets and UX choices are signed off.
- [ ] Responsive/accessibility and real interactions are verified on the frontend.
