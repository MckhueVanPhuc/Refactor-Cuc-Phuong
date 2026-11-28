# Screen Spec: Chi tiết tuyến & Chuẩn bị

| Field | Value |
|---|---|
| Screen ID | `SCR-M01-003` |
| Screen name | Chi tiết tuyến & Chuẩn bị |
| Module | `M01` |
| Actor | Visitor |
| Priority | Must; chuẩn bị offline Should* |
| Mockup | [mockup-SCR-M01-003.html](../../html/mockup-SCR-M01-003.html) (HTML tĩnh, chưa sign-off UX) |
| Status | Draft — đồng bộ [Spec M01 v3.2](../../../docs/spec/spec-M01.md) và [Spec Mascot v1.3](../../../docs/spec/spec-Mascot.md) cho Mila |

Nguồn hành vi/contract: [Spec M01](../../../docs/spec/spec-M01.md) (Published Route và JourneySnapshot theo [Spec M03 v3.7](../../../docs/spec/spec-M03.md) §5.1). Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu; \* gói offline là Should nhưng phải nâng lên Must nếu increment có điểm dừng `OFFLINE_REQUIRED` hoặc sơ đồ tuyến cần dùng offline. Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline. Mascot Mila theo [Spec Mascot](../../../docs/spec/spec-Mascot.md) v1.0 (slot §5.1, BR-MAS-01 đến BR-MAS-19, câu §5.6); Mila không thay, không che câu nào của màn này.

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Trong §9: **Confirmed** có nguồn baseline, **Proposed** chờ UX review, **Open** có clarification chưa được nguồn xác nhận. Draft không đồng nghĩa frontend/prototype đã được nghiệm thu. Chữ hiển thị cho người dùng chỉ là các câu trong ngoặc kép, câu của khóa MSG-* và bảng copy; tên trường, mã enum/trạng thái, định danh và khóa MSG-* trong tài liệu này chỉ để truy vết cho người phát triển, không bao giờ hiện trên giao diện.

## 1. Purpose

**Shown when:** Visitor chọn một tuyến từ SCR-M01-001, SCR-M01-002 hoặc SCR-M01-004 (để Start từ package đã tải).

**The user leaves when:** Start thành công và M01 mở SCR-M02-001; quay về danh mục/gợi ý; mở quản lý tài nguyên offline (SCR-M01-004); hoặc chọn "Quay lại" ở quyết định offline.

## 2. Mockup

Mockup HTML tĩnh: [mockup-SCR-M01-003.html](../../html/mockup-SCR-M01-003.html). Không dùng mockup để suy ngược business rule.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M01-003-01 | Language control VI/EN | Toggle (control dùng chung) | `LanguagePreference` | Yes | Đổi offline vẫn đổi UI và nội dung có sẵn, không đổi trạng thái package (US-M01-01 mục 2) |
| 2 | E-SCR-M01-003-02 | Route name | Header text | `name.vi`/`.en` (offline: `routeEssentials.name`) | Yes | Không tự sinh giá trị thiếu |
| 3 | E-SCR-M01-003-03 | Gallery | Image carousel | `gallery[]` (tối đa 8, ảnh đầu là ảnh bìa) kèm `caption` nếu có | Yes | Chỉ online; ảnh không có local hiện placeholder trung tính; gallery rỗng thì dùng thông tin sẵn có, không tự dựng ảnh |
| 4 | E-SCR-M01-003-04 | Route facts | Text | `distanceKm` (km), `durationMin` (phút), `difficulty` | Yes | Hiển thị đúng giá trị nguồn |
| 5 | E-SCR-M01-003-05 | Full description | Text | `description.vi`/`.en` | Yes | Không tự sinh giá trị thiếu |
| 6 | E-SCR-M01-003-06 | Starting point | Text | `startingPoint.vi`/`.en` (offline: `routeEssentials.startingPoint`) | Yes | Như trên |
| 7 | E-SCR-M01-003-07 | Highlights | List | `highlights[]` (tối đa 5 mục) | Conditional | Ẩn khi rỗng |
| 8 | E-SCR-M01-003-08 | Participation requirements | Text | `participationRequirements` (offline: `routeEssentials.participationRequirements`) | Conditional | Both-or-none vi/en; ẩn khi vắng, không placeholder (US-M01-06 mục 2) |
| 9 | E-SCR-M01-003-09 | Preparation | Text | `preparation` | Conditional | Ẩn khi vắng; không lưu trong essentials nên offline không hiện từ bản lưu |
| 10 | E-SCR-M01-003-10 | Best time | Text | `bestTime` | Conditional | Như trên |
| 11 | E-SCR-M01-003-11 | Route map | Image + caption | `routeMap` (online); offline từ `OfflinePackage.offlineRouteMap` khi có | Conditional | Ảnh tĩnh, không phải điều hướng; offline chỉ có khi snapshot mang `offlineRouteMap` (BR-M01-013) |
| 12 | E-SCR-M01-003-12 | Safety warning | Callout nổi bật (amber, icon `warning.svg`) | `safetyWarning` (offline: `routeEssentials.safetyWarning`) | Conditional | Hiển thị nổi bật khi có; ẩn khi vắng. **Vị trí (A1, chủ dự án 2026-11-29):** trong panel Bắt đầu, ngay dưới lời nhắc của Mila (MSG-MAS-014) và ngay trên nút Bắt đầu; tuyến không bắt đầu được thì ở thân trang như trước |
| 13 | E-SCR-M01-003-13 | Checkpoint names list | Ordered list | `checkpointSummaries[].checkpointName` theo `sequence`; khi offline lấy từ `manifest` của package `SAN_SANG` | Yes | Đúng thứ tự thăm; không hiển thị `sequence` thô có khoảng trống như số thứ tự gián đoạn [xem OQ-SCR-M01-003-003] |
| 14 | E-SCR-M01-003-14 | Saved-copy notice | Text | "Thông tin được lưu lúc [thời điểm], có thể không phải bản mới nhất" với `routeEssentials.capturedAt` | Conditional | Hiện khi nội dung lấy từ bản lưu (offline); không khẳng định là mới nhất (BR-M01-014) |
| 15 | E-SCR-M01-003-15 | Offline-needed indicator | **Bỏ 2026-11-29** (chủ dự án): không còn chip "Cần tải trước" dưới tên tuyến; ô Gói tải trước tự giải thích (E-SCR-M01-003-16). Thẻ tuyến ở danh mục vẫn có dấu này | Badge | `hasOfflineRequiredCheckpoint` hoặc `hasOfflineRouteMap` | Conditional | Snapshot tải về thắng cờ nếu lệch (FR-M01-005) |
| 16 | E-SCR-M01-003-16 | Package state | Badge + chú thích | `OfflinePackage.status` + `versionStatus`: đang tải, sẵn sàng (hiện hành/cũ), chưa hoàn tất. **Chưa có bản dùng được (B1, 2026-11-29):** không chip "Chưa tải"; câu "Tuyến này đi qua nơi **không có sóng điện thoại**. Tải gói về máy khi còn sóng để xem được nội dung ở các điểm:" và danh sách tên các điểm `OFFLINE_REQUIRED` (icon `no-signal.svg`) đọc từ JourneySnapshot đang hoạt động; không đọc được snapshot thì câu kết "…ở những nơi đó.", không danh sách | Conditional | Package không đọc được → coi là chưa sẵn sàng; `SAN_SANG + OUTDATED` dùng được kèm cảnh báo khi biết |
| 17 | E-SCR-M01-003-17 | Offline decision panel | Panel/dialog | Khi tuyến cần package mà chưa có package sẵn sàng: tên các điểm dừng `OFFLINE_REQUIRED` có thể thiếu nội dung, dung lượng ước tính, một dòng hướng dẫn quét bằng nút trong ứng dụng | Conditional | Dung lượng gắn nhãn là ước tính khi có `estimatedOfflineSizeBytes`, "chưa có thông tin dung lượng" khi vắng; vắng không chặn Download (BR-M01-016) |
| 18 | E-SCR-M01-003-18 | Action: Tải | Button (căn giữa, rộng hết ô, 2026-11-29) | Bắt đầu tải package; nhãn "Tải về (khoảng {n} MB)" khi snapshot có dung lượng ước tính, không thì "Tải về" | Conditional | Một thao tác package mỗi tuyến tại một thời điểm; cần nguồn online |
| 19 | E-SCR-M01-003-19 | Action: Tiếp tục không tải | Button | Cho phép Start online không có package | Conditional | Chỉ khi online; vẫn theo guard Start (BR-M01-007) |
| 20 | E-SCR-M01-003-20 | Action: Quay lại | Button | Thoát quyết định offline, về màn trước | Conditional | Không chọn ngầm lựa chọn nào |
| 21 | E-SCR-M01-003-21 | Download progress | Panel | Tiến độ tải; không có nút hủy | Conditional | MVP không có Cancel download (§4.4) |
| 22 | E-SCR-M01-003-22 | Scan hint line | Text | Một dòng: không có mạng thì check-in bằng nút Quét trong ứng dụng vì camera điện thoại có thể không mở được ứng dụng khi không có mạng | Conditional | Hiện ở quyết định offline và khi package sẵn sàng (US-M01-03 mục 5) |
| 23 | E-SCR-M01-003-23 | Action: Start | Button | Tạo `SelectedRouteContext v3` rồi mở M02; không nhận Start lặp khi một Start đang chạy (FR-M01-012) | Yes | Online: nguồn xác nhận route và snapshot hợp lệ; offline: cần package `SAN_SANG`, nếu không bị chặn (US-M01-04) |
| 24 | E-SCR-M01-003-24 | Start blocked message | Text | Lý do Start bị chặn: không có nguồn lẫn package sẵn sàng, tuyến không khả dụng/revoked | Conditional | Không thay context cũ khi thất bại (FR-M01-012) |
| 25 | E-SCR-M01-003-25 | Route unavailable state | Panel | Tuyến không còn `HOAT_DONG` sau làm mới nguồn | Conditional | Chặn Start mới; context hiện tại đánh dấu `REVOKED` (BR-M01-011) |
| 26 | E-SCR-M01-003-26 | Action: Tài nguyên offline | Link | Mở SCR-M01-004 | Yes | None |
| 27 | E-SCR-M01-003-27 | Tab bar | Thanh tab cố định ở đáy (design-system §5.2; 2026-11-21) | Như E-SCR-M01-001-20: Tuyến · Quét QR · Tài nguyên | Yes | Tab của màn đang mở được đánh dấu, không chỉ bằng màu |
| 28 | E-SCR-M01-003-28 | Mascot Mila | Ảnh + bong bóng trong slot (Spec Mascot §5.1) | Panel Bắt đầu (AVATAR; không bao giờ trên khối Cảnh báo an toàn); panel gói tải trước (AVATAR, INLINE); đầu dialog quyết định offline và lỗi Start (INLINE). Câu: bảng copy bên dưới | Conditional (Could, MVP-Scope §3.6) | Chỉ trong slot, không chiếm focus, ảnh `alt=""`; bong bóng ≤ 90 ký tự, có nút đóng; không có nút ẩn Mila; tôn trọng giảm chuyển động (BR-MAS-11, BR-MAS-17); v1.1: cỡ theo design-system §9.2, bong bóng kiểu "Giấy dã ngoại" §9.3, chạm theo ngữ cảnh và chạm nhiều lần (BR-MAS-12, 22), cử chỉ tự động ở màn Mila đứng chờ (BR-MAS-21), công tắc chuyển động ở SCR-M01-004 (v1.3) |
| 29 | E-SCR-M01-003-29 | Công tắc "Chuyển động" của Mila | **Bỏ ở v1.3**: thanh đầu trang không còn nút chuyển động; công tắc duy nhất ở màn Tài nguyên SCR-M01-004 (Spec Mascot BR-MAS-21) | — | — | — |

**Copy cố định (i18n vi/en).** Chuỗi hiển thị cho du khách là tài nguyên i18n đóng gói sẵn cùng ứng dụng (dùng được khi không có mạng), chọn theo `LanguagePreference`. Spec M01/M02 chỉ cố định một số câu; các câu còn lại dưới đây là chữ chốt ở mức screen spec, không thêm hành vi mới. Nhãn độ khó, thời gian và tag dùng bảng nhãn i18n ở SCR-M01-002.

| Tình huống | Tiếng Việt | English |
|---|---|---|
| Tiêu đề màn | Chi tiết tuyến & Chuẩn bị | Route details & preparation |
| Nhãn mục | Quãng đường · Thời lượng · Độ khó · Cảnh báo an toàn · Giới thiệu · Điểm xuất phát · Yêu cầu và điều kiện tham gia · Cần chuẩn bị · Thời điểm phù hợp · Điểm nổi bật · Sơ đồ tuyến · Các điểm dừng | Distance · Duration · Difficulty · Safety warning · About this route · Starting point · Requirements · What to bring · Best time to go · Highlights · Route map · Stops |
| Tiêu đề khối gói tải trước | Gói tải trước | Offline download |
| Nút Start | Bắt đầu | Start |
| Tiêu đề quyết định offline | Tuyến này nên tải trước | Download this route first |
| Điểm dừng có thể thiếu nội dung | Một số điểm dừng có thể không có nội dung nếu bạn không tải trước: {danh sách}. | Some stops may have no content unless you download first: {list}. |
| Dung lượng có ước tính | Dung lượng ước tính: khoảng {số} MB. | Estimated size: about {n} MB. |
| Dung lượng vắng | Chưa có thông tin dung lượng. | Size not available. |
| Dòng hướng dẫn quét (Spec M01 US-M01-03) | Khi không có mạng, hãy quét mã bằng nút Quét trong ứng dụng, vì camera điện thoại có thể không mở được ứng dụng nếu không có mạng. | Without a network, scan codes with the Scan button in the app, because the phone camera may not be able to open the app. |
| Ba lựa chọn | Tải về · Tiếp tục không tải · Quay lại | Download · Continue without download · Go back |
| Bản lưu (Spec M01 US-M01-06) | Thông tin được lưu lúc {thời điểm}, có thể không phải bản mới nhất | Saved on {time}; this may not be the latest information. |
| Package cũ nhưng dùng được | Gói tải trước này đã cũ nhưng vẫn dùng được. | This download is out of date but still usable. |
| Tải chưa hoàn tất | Tải chưa hoàn tất. Hãy thử tải lại. | The download is not complete. Please try again. |
| Start bị chặn (offline, chưa có package) | Chưa bắt đầu được vì không có mạng và tuyến này chưa được tải trước. | Cannot start: you are offline and this route has not been downloaded. |
| Start lỗi | Chưa bắt đầu được. Hãy thử lại. | Could not start. Please try again. |
| Tuyến không còn nhận chuyến mới | Tuyến này hiện không nhận chuyến mới. | This route is not available for new trips right now. |
| Lỗi nguồn, đang dùng bản lưu | Chưa tải được thông tin mới. Đang hiển thị thông tin đã lưu. | Could not load the latest information. Showing saved information. |
| Mila nhắc đọc Cảnh báo an toàn, mỗi lần vào màn (MSG-MAS-014, v1.6) | Trước khi đi, bạn đọc kỹ phần Cảnh báo an toàn ngay bên dưới giúp mình nhé. | Before you head out, please read the Safety warning just below. |
| Mila khi bắt đầu tải gói (MSG-MAS-020) | Mình đang xếp nội dung vào ba lô. Giữ trang này mở nhé. | Packing your route into the backpack. Keep this page open. |
| Mila khi gói sẵn sàng (MSG-MAS-021) | Giờ các điểm này xem được cả khi mất sóng. | These stops now work without signal. |
| Mila khi tải lỗi (nguồn hoặc mạng) (MSG-MAS-024) | — (chỉ minh họa từ v1.2) | — (illustration only since v1.2) |
| Mila khi máy không cho lưu (MSG-MAS-025) | — (chỉ minh họa từ v1.2) | — (illustration only since v1.2) |
| Mila khi tải lỗi lần 2 liên tiếp (MSG-MAS-026) | Vẫn chưa được. Có mạng thì bạn vẫn đi được, chỉ vài điểm cần sóng để xem. | Still no luck. You can go without it, but some stops will need signal. |
| Chạm Mila, tuyến có Cảnh báo an toàn (MSG-MAS-017, v1.6; câu ở panel Bắt đầu) | Đọc kỹ Cảnh báo an toàn, tải gói nếu cần, rồi bấm Bắt đầu nhé. | Read the Safety warning, download the pack if you need it, then tap Start. |
| Chạm Mila, tuyến không có Cảnh báo an toàn (MSG-MAS-019; câu ở panel Bắt đầu) | Tải gói nếu cần, rồi bấm Bắt đầu nhé. | Download the pack if you need it, then tap Start. |
| Tên truy cập khi chạm Mila | Hỏi Mila | Ask Mila |
| Nút đóng bong bóng của Mila | Đóng lời nhắn | Dismiss message |
| Mila khi bị chạm liên tục (MSG-MAS-085) | Ui, chóng mặt quá! | Whoa, I'm dizzy! |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| Loading | Spinner/skeleton | Đang đọc nguồn |
| Online detail | Đầy đủ thông tin, gallery, dấu cần tải trước | Đọc nguồn thành công |
| Offline with ready package | Chữ cốt lõi đã lưu kèm thời điểm lưu; ảnh không lưu hiện placeholder | Mất mạng, package `SAN_SANG` |
| No package needed | Start online sẵn sàng, không có quyết định offline | Không có `OFFLINE_REQUIRED` và không có sơ đồ offline |
| Package missing | Panel quyết định offline: Tải / Tiếp tục không tải / Quay lại | Tuyến cần package, chưa có package sẵn sàng |
| Downloading | Tiến độ tải, thao tác khác trên tuyến bị khóa | Package `DANG_TAI` |
| Ready (current) | Trạng thái sẵn sàng, Start dùng được | `SAN_SANG + CURRENT` |
| Ready (outdated) | Cảnh báo cũ nhưng vẫn dùng được | `SAN_SANG + OUTDATED` |
| Incomplete | Thông báo tải chưa hoàn tất, cho thử lại | `CHUA_HOAN_TAT` |
| Start blocked | Giải thích lý do | Offline không có package, hoặc không xác nhận được nguồn |
| Route unavailable | Tuyến không còn lựa chọn mới | Làm mới nguồn báo `TAM_DONG`/`LUU_TRU` |
| Source error | Giữ nội dung đang có, không khẳng định mới nhất | Request nguồn lỗi dù trình duyệt báo online |

## 5. Interactions and navigation

| # | Element | User action | System response | Destination screen / result |
|---|---|---|---|---|
| 1 | Màn hình | Mở khi online | Đọc Published Route; làm mới chữ cốt lõi khi đọc thành công; nếu có package thì kiểm tra phiên bản mới và chuẩn bị candidate riêng | State update |
| 2 | Language control | Đổi VI/EN | Cập nhật preference; đổi nội dung có sẵn | State update |
| 3 | Start | Tap, tuyến không cần package | Online: kiểm tra nguồn rồi ghi context v3 nguyên tử, `expiresAt` = `authorizedAt` + 24 giờ | `SCR-M02-001` |
| 4 | Start | Tap, tuyến cần package nhưng chưa có | Hiện quyết định offline | Panel quyết định |
| 5 | Tải | Tap | Tải snapshot, tài nguyên từng QR của điểm dừng `OFFLINE_REQUIRED`, sơ đồ offline và chữ cốt lõi; chỉ công bố khi hợp lệ trọn vẹn | State: Downloading → Ready/Incomplete |
| 6 | Tiếp tục không tải | Tap (online) | Tiếp tục theo guard Start online | Start online |
| 7 | Start | Tap, offline có package `SAN_SANG` | Ghi context v3 từ manifest của package | `SCR-M02-001` |
| 8 | Start | Tap, offline không có package | Chặn Start, giải thích | Start blocked |
| 9 | Quay lại | Tap | Thoát quyết định, về màn trước | Previous screen |
| 10 | Tài nguyên offline | Tap | Mở quản lý package | `SCR-M01-004` |
| 11 | Thanh tab | Tap Tuyến / Quét QR / Tài nguyên | Mở màn tương ứng; Quét QR bật camera ngay | `SCR-M01-001` / `SCR-M02-005` / `SCR-M01-004` |

## 6. Screen-level rules

| Rule ID | Rule | Related requirement |
|---|---|---|
| SR-SCR-M01-003-001 | Trường tùy chọn vắng thì ẩn, không placeholder văn bản; không tự sinh trường công khai thiếu | US-M01-06, FR-M01-003 |
| SR-SCR-M01-003-002 | Offline chỉ hiển thị chữ cốt lõi đã lưu (tên, điểm xuất phát, yêu cầu tham gia, cảnh báo an toàn) kèm thời điểm lưu và không khẳng định là mới nhất | FR-M01-014, BR-M01-014, SC-M01-008 |
| SR-SCR-M01-003-003 | Ảnh bìa và gallery chỉ dùng online; sơ đồ tuyến offline chỉ khi snapshot mang `offlineRouteMap`; audio/video không bao giờ lưu offline | BR-M01-013 |
| SR-SCR-M01-003-004 | Tuyến cần package khi `hasOfflineRequiredCheckpoint` hoặc `hasOfflineRouteMap` là `true`; snapshot tải về là nguồn quyết định khi lệch | BR-M01-012, FR-M01-005 |
| SR-SCR-M01-003-005 | Quyết định offline gồm đúng ba lựa chọn Tải / Tiếp tục không tải / Quay lại, nêu tên điểm dừng bị ảnh hưởng, dung lượng ước tính (hoặc chưa có thông tin) và dòng hướng dẫn quét; không chọn ngầm | FR-M01-006, US-M01-03 |
| SR-SCR-M01-003-006 | Dung lượng ước tính vắng hoặc sai không bao giờ chặn Tải | BR-M01-016, SC-M01-009 |
| SR-SCR-M01-003-007 | Package chỉ được công bố sẵn sàng khi hoàn chỉnh; cập nhật lỗi giữ package cũ ở `SAN_SANG + OUTDATED` | BR-M01-005, BR-M01-006, SC-M01-003, SC-M01-004 |
| SR-SCR-M01-003-008 | Start online dùng nguồn hiện hành; Start offline cần package `SAN_SANG`; mỗi Start thành công tạo `handoffId` mới và thay context cũ nguyên tử; thất bại không thay context cũ | BR-M01-008, BR-M01-009, FR-M01-011, FR-M01-012 |
| SR-SCR-M01-003-009 | `expiresAt` đúng bằng `authorizedAt` + 24 giờ; M01 không gia hạn và không đổi `authorizationStatus` khi thời gian trôi qua | BR-M01-015 |
| SR-SCR-M01-003-010 | Tuyến phát hiện đã đóng/lưu trữ bị chặn Start mới và context hiện tại thành `REVOKED`; phiên M02 đã tạo không bị M01 xóa hay dừng | BR-M01-011, US-M01-05 |
| SR-SCR-M01-003-011 | Chỉ một thao tác package mỗi tuyến tại một thời điểm | Spec M01 §4.4, FR-M01-009 |
| SR-SCR-M01-003-012 | Tuyến không cần package có thể Start online mà không cần package | SC-M01-010 |
| SR-SCR-M01-003-013 | Mila chỉ hiện trong slot của màn và không che nút, vùng thông báo, toast, dialog hay nội dung; câu cố định của màn giữ nguyên; Mila không đổi hành vi hay dữ liệu của màn và không có nút ẩn; không đặt Mila trên khối Cảnh báo an toàn | BR-MAS-01, BR-MAS-02, BR-MAS-03, BR-MAS-08, BR-MAS-11 |

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M01-001 | Control ngôn ngữ dùng chung |
| FR-M01-003 | Thông tin chi tiết theo ngôn ngữ, ẩn trường vắng |
| FR-M01-005 | Cờ cần package, kiểm tra package |
| FR-M01-006 | Quyết định offline |
| FR-M01-007 | Tải manifest, tài nguyên từng QR, sơ đồ offline, chữ cốt lõi |
| FR-M01-008 | Kiểm tra đầy đủ và công bố nguyên tử |
| FR-M01-010 | Cập nhật lười, giữ package cũ, làm mới chữ cốt lõi |
| FR-M01-011 | Start online/offline |
| FR-M01-012 | Ghi `SelectedRouteContext v3` |
| FR-M01-013 | Công bố context/package cho M02 |
| FR-M01-014 | Chữ cốt lõi kèm thời điểm lưu |
| FR-MAS-001, FR-MAS-002, FR-MAS-003, FR-MAS-009 | Mascot Mila: slot, phản ứng theo sự kiện, lời thoại theo ngôn ngữ, không đổi hành vi của màn (Spec Mascot) |

## 8. Responsive and accessibility notes

- Định hướng mobile-first: ưu tiên nội dung/action chính, wrap text/tags và stack panels theo chiều rộng thực tế; tránh chiều rộng cố định gây tràn ngang. 360px, 768px và 1280px là kích thước tham khảo để review, không phải hard breakpoint hoặc điều kiện bật/tắt tính năng.
- Review text dài vi/en (mô tả đến 2000 ký tự), zoom, keyboard/focus và error states; cảnh báo an toàn phải nổi bật nhưng không chỉ bằng màu. Bố cục cuối cùng còn chờ UX review.
- Mục tiêu review accessibility: keyboard access, visible focus, semantic labels, ảnh có văn bản thay thế (caption), tiến độ tải được thông báo cho công nghệ hỗ trợ và reduced motion. Tham khảo WCAG 2.1 AA, touch target khoảng 44×44px và contrast 4.5:1 cho normal text; đây là định hướng cần kiểm chứng trên frontend, không phải tuyên bố đã đạt chuẩn.

## 9. Open questions

| ID | Question | Blocking | Status | Resolution |
|---|---|---|---|---|
| OQ-SCR-M01-003-002 | Khi offline, màn chi tiết có hiện danh sách tên điểm dừng từ manifest của package không | No | Resolved | Có. Khi offline, danh sách tên điểm dừng lấy từ `manifest` của package `SAN_SANG` (cùng phiên bản với package) và đi kèm thông báo bản lưu; không khẳng định là mới nhất. |
| OQ-SCR-M01-003-003 | Số thứ tự hiển thị của điểm dừng khi `sequence` có khoảng trống | No | Resolved | Số thứ tự hiển thị đếm liên tục 1, 2, 3… theo thứ tự `sequence`, giống M02 (BR-M02-006); không hiện `sequence` gốc. |
| OQ-SCR-M01-003-004 | Cách trình bày quyết định offline (dialog hay panel trong trang) | No | Resolved | Dialog trên màn chi tiết, mở khi bấm "Bắt đầu" với tuyến cần tải trước mà chưa có package sẵn sàng; ba nút theo bảng copy. |

## Completion checklist

- [x] Required behavioral controls and feedback are described in the inventory.
- [x] Each input has a validation rule or explicit `None`.
- [x] Behavioral success/failure states in this screen scope are described.
- [x] Navigation screen IDs and requirement references resolve; behavioral mappings follow canonical sources.
- [ ] Final layout, copy, assets and UX choices are signed off.
- [ ] Responsive/accessibility and real interactions are verified on the frontend.
