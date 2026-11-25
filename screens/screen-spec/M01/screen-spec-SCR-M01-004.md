# Screen Spec: Quản lý tài nguyên offline

| Field | Value |
|---|---|
| Screen ID | `SCR-M01-004` |
| Screen name | Quản lý tài nguyên offline |
| Module | `M01` |
| Actor | Visitor |
| Priority | Should* |
| Mockup | Chưa có |
| Status | Draft — đồng bộ [Spec M01 v3.2](../../../docs/spec/spec-M01.md) và [Spec Mascot v1.4](../../../docs/spec/spec-Mascot.md) cho Mila |

Nguồn hành vi/contract: [Spec M01](../../../docs/spec/spec-M01.md). Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu; \* gói offline là Should nhưng phải nâng lên Must nếu increment phát hành có điểm dừng `OFFLINE_REQUIRED` hoặc sơ đồ tuyến cần dùng offline. Xóa package không xóa context hoặc session M02. Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline. Mascot Mila theo [Spec Mascot](../../../docs/spec/spec-Mascot.md) v1.0 (slot §5.1, BR-MAS-01 đến BR-MAS-19, câu §5.6); Mila không thay, không che câu nào của màn này.

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Trong §9: **Confirmed** có nguồn baseline, **Proposed** chờ UX review, **Open** có clarification chưa được nguồn xác nhận. Draft không đồng nghĩa frontend/prototype đã được nghiệm thu. Chữ hiển thị cho người dùng chỉ là các câu trong ngoặc kép, câu của khóa MSG-* và bảng copy; tên trường, mã enum/trạng thái, định danh và khóa MSG-* trong tài liệu này chỉ để truy vết cho người phát triển, không bao giờ hiện trên giao diện.

## 1. Purpose

**Shown when:** Visitor mở "Tài nguyên offline" từ SCR-M01-001 hoặc SCR-M01-003.

**The user leaves when:** Mở chi tiết tuyến để Start (SCR-M01-003) hoặc quay về danh mục (SCR-M01-001).

## 2. Mockup

Chưa có mockup cho màn này. Không suy ngược business rule từ bất kỳ ảnh mockup nào về sau.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M01-004-01 | Language control VI/EN | Toggle (control dùng chung) | `LanguagePreference` | Yes | Đổi không đổi trạng thái package |
| 2 | E-SCR-M01-004-02 | Screen title | Header text | Tên màn hình theo ngôn ngữ đã chọn | Yes | Non-empty |
| 3 | E-SCR-M01-004-03 | Package list | List | Package local theo tuyến: `routeId`, `contentVersion`, `status`, `versionStatus` | Yes | Mỗi tuyến tối đa một package `SAN_SANG` đang hoạt động; candidate/staging không hiện như package hoạt động |
| 4 | E-SCR-M01-004-04 | Package row: route name | Text | Tên tuyến theo ngôn ngữ (từ chữ cốt lõi đã lưu hoặc nguồn) | Yes | Không khẳng định là mới nhất khi lấy từ bản lưu |
| 5 | E-SCR-M01-004-05 | Package row: version | Text | `contentVersion` của package | Yes | Một package = một tuyến + một phiên bản |
| 6 | E-SCR-M01-004-06 | Package row: status | Badge | `CHUA_TAI`, `DANG_TAI`, `SAN_SANG`, `CHUA_HOAN_TAT` kèm `CURRENT`/`OUTDATED` khi `SAN_SANG` | Yes | `versionStatus` chỉ khi `SAN_SANG`; hoàn chỉnh và độ mới là hai khái niệm tách biệt (BR-M01-005) |
| 7 | E-SCR-M01-004-07 | Package row: essentials saved time | Text | `routeEssentials.capturedAt` | Conditional | Hiện khi package sẵn sàng; không khẳng định là mới nhất (BR-M01-014) |
| 8 | E-SCR-M01-004-08 | Package row: offline route map flag | Text | Package có/không có `offlineRouteMap` | Conditional | None |
| 9 | E-SCR-M01-004-09 | Outdated warning | Text | Cảnh báo bản cũ, vẫn dùng được | Conditional | Hiện khi `SAN_SANG + OUTDATED` và biết trạng thái (BR-M01-006) |
| 10 | E-SCR-M01-004-10 | Action: Xem | Button | Mở chi tiết tuyến để xem/Start | Yes | None |
| 11 | E-SCR-M01-004-11 | Action: Tải / Cập nhật | Button | Tải package hoặc chuẩn bị candidate mới | Conditional | Cần nguồn online; thao tác lặp không tạo việc song song; không có Hủy tải (MVP) |
| 12 | E-SCR-M01-004-12 | Action: Xóa | Button | Xóa package của tuyến | Conditional | Cần xác nhận; cascade sang tài nguyên, sơ đồ offline và chữ cốt lõi của package, không xóa `SelectedRouteContext` hay dữ liệu M02 |
| 13 | E-SCR-M01-004-13 | Delete confirmation | Dialog | Xác nhận xóa package | Conditional | Xóa chỉ sau khi xác nhận (FR-M01-009) |
| 14 | E-SCR-M01-004-14 | Download progress | Panel | Tiến độ tải/cập nhật | Conditional | Không có nút hủy |
| 15 | E-SCR-M01-004-15 | Update failure note | Text | Cập nhật lỗi, package cũ được giữ | Conditional | Giữ `SAN_SANG + OUTDATED`; candidate bị bỏ |
| 16 | E-SCR-M01-004-16 | Storage failure note | Text | Lỗi lưu trữ cục bộ | Conditional | Bỏ candidate, giữ package sẵn sàng hiện có; báo tải chưa hoàn tất và cho thử lại (spec-M01 §5.4) |
| 17 | E-SCR-M01-004-17 | Scan hint line | Text | Một dòng: không có mạng thì check-in bằng nút Quét trong ứng dụng | Conditional | Hiện khi có package sẵn sàng (US-M01-03 mục 5) |
| 18 | E-SCR-M01-004-18 | Empty state | Text | Chưa có package nào | Conditional | Hiện khi không có package local |
| 19 | E-SCR-M01-004-19 | Tab bar | Thanh tab cố định ở đáy (design-system §5.2; 2026-11-21) | Như E-SCR-M01-001-20: Tuyến · Quét QR · Tài nguyên | Yes | Tab của màn đang mở được đánh dấu, không chỉ bằng màu |
| 20 | E-SCR-M01-004-20 | Mascot Mila | Ảnh + bong bóng trong slot (Spec Mascot §5.1) | Panel gói (AVATAR, INLINE); trạng thái rỗng (INLINE). Câu: bảng copy bên dưới | Conditional (Could, MVP-Scope §3.6) | Chỉ trong slot, không chiếm focus, ảnh `alt=""`; bong bóng ≤ 90 ký tự, có nút đóng; không có nút ẩn Mila; tôn trọng giảm chuyển động (BR-MAS-11, BR-MAS-17); v1.1: cỡ theo design-system §9.2, bong bóng kiểu "Giấy dã ngoại" §9.3, chạm theo ngữ cảnh và chạm nhiều lần (BR-MAS-12, 22), cử chỉ tự động ở màn Mila đứng chờ (BR-MAS-21), công tắc chuyển động ở SCR-M01-004 (v1.3) |
| 21 | E-SCR-M01-004-21 | Công tắc "Hiệu ứng chuyển động" (v1.4; trước là "Chuyển động của Mila") | Một hàng dưới tiêu đề màn, trên danh sách gói: nhãn, câu phụ "Tắt để Mila và hiệu ứng trang trí đứng yên.", công tắc trượt (design-system §9.5) | Luôn có, kể cả khi Mila tắt (v1.4); **công tắc duy nhất của app** (v1.3) | Conditional (Could, MVP-Scope §3.6) | `role="switch"`, `aria-checked`, tên "Hiệu ứng chuyển động", vùng chạm cả hàng ≥ 44px; tắt: Mila và hiệu ứng trang trí (design-system §4.3 T3) đứng yên trên mọi màn, chữ hiện ngay, không rung, Mila vẫn hiện; khởi đầu tắt khi giảm chuyển động; không lưu qua lần mở app (Spec Mascot BR-MAS-21). Không phải nút ẩn Mila |

**Copy cố định (i18n vi/en).** Chuỗi hiển thị cho du khách là tài nguyên i18n đóng gói sẵn cùng ứng dụng (dùng được khi không có mạng), chọn theo `LanguagePreference`. Spec M01/M02 chỉ cố định một số câu; các câu còn lại dưới đây là chữ chốt ở mức screen spec, không thêm hành vi mới.

| Tình huống | Tiếng Việt | English |
|---|---|---|
| Tiêu đề màn | Quản lý tài nguyên offline | Offline downloads |
| Phiên bản gói (E-SCR-M01-004-05) | Phiên bản {n} | Version {n} |
| Nút xem (E-SCR-M01-004-10) | Xem | View |
| Nút cập nhật | Cập nhật | Update |
| Chưa tải | Chưa tải | Not downloaded |
| Đang tải | Đang tải | Downloading |
| Sẵn sàng, hiện hành | Sẵn sàng – mới nhất | Ready – up to date |
| Sẵn sàng, có bản mới | Sẵn sàng – có bản mới | Ready – newer version available |
| Chưa hoàn tất | Chưa hoàn tất | Incomplete |
| Thời điểm lưu chữ cốt lõi | Thông tin tuyến lưu lúc {thời điểm} | Route information saved on {time} |
| Có sơ đồ offline | Có sơ đồ tuyến offline | Includes offline route map |
| Cập nhật lỗi | Chưa cập nhật được. Vẫn dùng bản đã tải. | Could not update. The downloaded version is still in use. |
| Lỗi lưu trữ | Không lưu được dữ liệu trên thiết bị nên chưa tải xong. Bản đã tải trước đó không bị ảnh hưởng. Bạn có thể thử lại. | Could not save data on this device, so the download did not finish. Your earlier download is not affected. You can try again. |
| Xác nhận xóa | Xóa gói tải trước của tuyến "{tên}"? Chuyến đi đang diễn ra không bị ảnh hưởng. | Delete the download for "{name}"? A trip in progress is not affected. |
| Nút xác nhận xóa | Xóa · Giữ lại | Delete · Keep |
| Chưa có package | Bạn chưa tải tuyến nào. | You have not downloaded any route. |
| Gói cũ (cảnh báo) | Gói tải trước này đã cũ nhưng vẫn dùng được. | This download is out of date but still usable. |
| Package không đọc được | Gói tải trước không đọc được | This download cannot be read |
| Hành động với package không đọc được | Tải lại · Xóa | Download again · Delete |
| Mila khi bắt đầu tải gói (MSG-MAS-020) | Mình đang xếp nội dung vào ba lô. Giữ trang này mở nhé. | Packing your route into the backpack. Keep this page open. |
| Mila khi gói sẵn sàng (MSG-MAS-021) | Giờ các điểm này xem được cả khi mất sóng. | These stops now work without signal. |
| Mila khi tải lỗi (nguồn hoặc mạng) (MSG-MAS-024) | — (chỉ minh họa từ v1.2) | — (illustration only since v1.2) |
| Mila khi máy không cho lưu (MSG-MAS-025) | — (chỉ minh họa từ v1.2) | — (illustration only since v1.2) |
| Chạm Mila (MSG-MAS-018, v1.6; câu ở ô gói) | Tải gói trước khi vào rừng để xem tuyến khi mất sóng. | Download the pack before you go, so the route works without signal. |
| Tên truy cập khi chạm Mila | Hỏi Mila | Ask Mila |
| Nút đóng bong bóng của Mila | Đóng lời nhắn | Dismiss message |
| Mila khi bị chạm liên tục (MSG-MAS-085) | Ui, chóng mặt quá! | Whoa, I'm dizzy! |
| Nhãn công tắc chuyển động (v1.3; v1.4) | Hiệu ứng chuyển động | Motion effects |
| Câu phụ dưới nhãn công tắc (v1.3; v1.4) | Tắt để Mila và hiệu ứng trang trí đứng yên. | Turn off to keep Mila and decorations still. |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| Empty | Chưa có package | Không có package local |
| Not downloaded | Trạng thái chưa tải, có hành động Tải | `CHUA_TAI` (có thể không có bản ghi) |
| Downloading | Tiến độ, hành động khác trên tuyến bị khóa | `DANG_TAI` |
| Ready (current) | Sẵn sàng, hiện hành | `SAN_SANG + CURRENT` |
| Ready (outdated) | Sẵn sàng kèm cảnh báo cũ, có hành động Cập nhật | `SAN_SANG + OUTDATED` |
| Incomplete | Chưa hoàn tất, có hành động tải lại | `CHUA_HOAN_TAT` (tải lỗi, chưa có bản cũ) |
| Update failed | Giữ bản sẵn sàng cũ, thông báo cập nhật lỗi | Candidate lỗi |
| Storage failure | Thông báo lỗi lưu trữ, package cũ nguyên vẹn | Lỗi lưu trữ cục bộ |
| Delete confirmation | Dialog xác nhận | Chọn Xóa |

## 5. Interactions and navigation

| # | Element | User action | System response | Destination screen / result |
|---|---|---|---|---|
| 1 | Package row | Xem | Mở chi tiết tuyến | `SCR-M01-003` |
| 2 | Tải / Cập nhật | Tap | Tải candidate; công bố nguyên tử khi hợp lệ; lỗi thì bỏ candidate | State: Downloading → Ready/Incomplete/Update failed |
| 3 | Xóa | Tap | Hiện dialog xác nhận | Delete confirmation |
| 4 | Xác nhận xóa | Tap | Xóa package và dữ liệu cục bộ đi kèm; trạng thái về chưa tải | State: `CHUA_TAI` |
| 5 | Hủy xác nhận | Tap | Đóng dialog, không đổi gì | Previous state |
| 6 | Language control | Đổi VI/EN | Cập nhật preference | State update |
| 7 | Thanh tab | Tap Tuyến / Quét QR / Tài nguyên | Mở màn tương ứng; Quét QR bật camera ngay | `SCR-M01-001` / `SCR-M02-005` / `SCR-M01-004` |

## 6. Screen-level rules

| Rule ID | Rule | Related requirement |
|---|---|---|
| SR-SCR-M01-004-001 | Hành động có sẵn là Xem, Tải và Xóa; Xóa luôn cần xác nhận | FR-M01-009 |
| SR-SCR-M01-004-002 | Mỗi tuyến chỉ một thao tác package tại một thời điểm; MVP không có Hủy tải | Spec M01 §4.4, FR-M01-009 |
| SR-SCR-M01-004-003 | Cập nhật lỗi giữ package sẵn sàng cũ ở `SAN_SANG + OUTDATED`; candidate lỗi bị bỏ | BR-M01-006, FR-M01-010, SC-M01-004 |
| SR-SCR-M01-004-004 | Candidate/staging không bao giờ hiển thị như package hoạt động và không được M02 đọc | FR-M01-013, SC-M01-003 |
| SR-SCR-M01-004-005 | Hiển thị thời điểm lưu chữ cốt lõi và có/không có sơ đồ tuyến offline của package | FR-M01-009, FR-M01-014 |
| SR-SCR-M01-004-006 | Xóa package cascade sang tài nguyên, sơ đồ offline, chữ cốt lõi và dữ liệu candidate nhưng không xóa `SelectedRouteContext` hay dữ liệu M02 | Spec M01 §6.4 |
| SR-SCR-M01-004-007 | Chỉ gửi request nguồn khi tải hoặc kiểm tra phiên bản; việc xem trạng thái dùng dữ liệu local | Screen list M01 |
| SR-SCR-M01-004-008 | Mila chỉ hiện trong slot của màn và không che nút, vùng thông báo, toast, dialog hay nội dung; câu cố định của màn giữ nguyên; Mila không đổi hành vi hay dữ liệu của màn và không có nút ẩn | BR-MAS-01, BR-MAS-02, BR-MAS-03, BR-MAS-08, BR-MAS-11 |

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M01-007 | Tải package |
| FR-M01-009 | Xem/tải/xóa, xác nhận xóa, tuần tự hóa thao tác |
| FR-M01-010 | Cập nhật, giữ bản cũ khi lỗi |
| FR-M01-014 | Hiển thị thời điểm lưu chữ cốt lõi |
| FR-MAS-001, FR-MAS-002, FR-MAS-003, FR-MAS-009 | Mascot Mila: slot, phản ứng theo sự kiện, lời thoại theo ngôn ngữ, không đổi hành vi của màn (Spec Mascot) |

## 8. Responsive and accessibility notes

- Định hướng mobile-first: ưu tiên nội dung/action chính, wrap text/tags và stack panels theo chiều rộng thực tế; tránh chiều rộng cố định gây tràn ngang. 360px, 768px và 1280px là kích thước tham khảo để review, không phải hard breakpoint hoặc điều kiện bật/tắt tính năng.
- Review text dài vi/en, zoom, keyboard/focus và error states; không ẩn action nghiệp vụ chỉ vì viewport nhỏ. Bố cục cuối cùng còn chờ UX review.
- Mục tiêu review accessibility: keyboard access, visible focus, semantic labels, trạng thái package không chỉ biểu đạt bằng màu, focus được quản lý trong dialog xác nhận và reduced motion. Tham khảo WCAG 2.1 AA, touch target khoảng 44×44px và contrast 4.5:1 cho normal text; đây là định hướng cần kiểm chứng trên frontend, không phải tuyên bố đã đạt chuẩn.

## 9. Open questions

| ID | Question | Blocking | Status | Resolution |
|---|---|---|---|---|
| OQ-SCR-M01-004-002 | Hành động trên package `CHUA_TAI` khi không có tuyến liên kết hiển thị ở đâu | No | Resolved | Hành động "Tải về" lần đầu nằm ở SCR-M01-003; màn này liệt kê các package đã có bản ghi và cho cập nhật/xóa. |
| OQ-SCR-M01-004-003 | Tên tuyến hiển thị khi package bị hỏng hoặc không đọc được | No | Resolved | Package không đọc được được coi là chưa sẵn sàng: hiện tên tuyến từ dữ liệu tuyến nếu có, nếu không thì "Gói tải trước không đọc được" / "This download cannot be read", với hai hành động "Tải lại" và "Xóa". |

## Completion checklist

- [x] Required behavioral controls and feedback are described in the inventory.
- [x] Each input has a validation rule or explicit `None`.
- [x] Behavioral success/failure states in this screen scope are described.
- [x] Navigation screen IDs and requirement references resolve; behavioral mappings follow canonical sources.
- [ ] Final layout, copy, assets and UX choices are signed off.
- [ ] Responsive/accessibility and real interactions are verified on the frontend.
