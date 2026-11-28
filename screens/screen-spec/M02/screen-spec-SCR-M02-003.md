# Screen Spec: Kết thúc phiên

| Field | Value |
|---|---|
| Screen ID | `SCR-M02-003` |
| Screen name | Kết thúc phiên |
| Module | `M02` |
| Actor | Visitor có phiên |
| Priority | Must; trạng thái đồng bộ Should |
| Mockup | Chưa có |
| Status | Draft — đồng bộ [Spec M02 v3.6](../../../docs/spec/spec-M02.md) và [Spec Mascot v1.10](../../../docs/spec/spec-Mascot.md) cho Mila (bố cục màn kết quả theo CHG-MASCOT-2026-11-28-10) |

Nguồn hành vi/contract: [Spec M02](../../../docs/spec/spec-M02.md) (`SessionSyncRecord` nhận bởi [Spec M03 v3.7](../../../docs/spec/spec-M03.md) §5.1). Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu. Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline. Mascot Mila theo [Spec Mascot](../../../docs/spec/spec-Mascot.md) v1.0 (slot §5.1, BR-MAS-01 đến BR-MAS-19, câu §5.6); Mila không thay, không che câu nào của màn này.

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Trong §9: **Confirmed** có nguồn baseline, **Proposed** chờ UX review, **Open** có clarification chưa được nguồn xác nhận. Draft không đồng nghĩa frontend/prototype đã được nghiệm thu. Chữ hiển thị cho người dùng chỉ là các câu trong ngoặc kép, câu của khóa MSG-* và bảng copy; tên trường, mã enum/trạng thái, định danh và khóa MSG-* trong tài liệu này chỉ để truy vết cho người phát triển, không bao giờ hiện trên giao diện.

## 1. Purpose

**Shown when:** Ngay khi lượt ghé của điểm cuối (điểm dừng có `sequence` lớn nhất của journey) được ghi lần đầu trong phiên, hiện câu hỏi kết thúc chuyến; hoặc khi visitor chọn Finish từ SCR-M02-001 sau đó.

**The user leaves when:** Chọn [Kết thúc] (phiên thành `HOAN_TAT`, về SCR-M01-001) hoặc [Đi tiếp] (về SCR-M02-001 với phiên còn chạy).

## 2. Mockup

Chưa có mockup cho màn này. Không dùng ảnh mockup về sau để suy ngược business rule.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M02-003-01 | End-of-trip prompt | Dialog (bảng nền đặc ở đáy màn SCR-M02-001, lớp phủ tối `--overlay-scrim`; Mila chỉ ở đầu hộp thoại) | Quét đủ mọi điểm: VI "Bạn đã quét mã ở tất cả {n} điểm. Kết thúc chuyến đi?" (EN "You've scanned all {n} checkpoints. End your trip?"); còn điểm chưa quét: VI "Bạn còn {r} điểm chưa quét mã. Vẫn kết thúc chuyến đi?" (EN "{r} checkpoints not scanned yet. End your trip anyway?") — spec-M02 v3.4 §5.1 | Conditional | Tự mở đúng một lần ở màn chuyến đi kế tiếp sau khi lượt ghé điểm cuối được ghi lần đầu, không ở trang nội dung; không hiện lại cho lần quét sau (BR-M02-021 v3.4) |
| 2 | E-SCR-M02-003-02 | Action: Kết thúc | Button | VI: "Kết thúc" (EN: "End") | Yes | Tác dụng giống xác nhận Finish: phiên thành `HOAN_TAT` khi đã quét điểm cuối, ngược lại `BO_DO` (BR-M02-007 v3.4) |
| 3 | E-SCR-M02-003-03 | Action: Đi tiếp | Button | VI: "Đi tiếp" (EN: "Continue") | Yes | Không đổi gì; Finish vẫn khả dụng đến khi phiên kết thúc |
| 4 | E-SCR-M02-003-04 | Finish confirmation | Dialog | Xác nhận kết thúc khi dùng Finish, cùng hộp thoại và câu như E-SCR-M02-003-01 | Conditional | Finish khả dụng mọi lúc trong chuyến (FR-M02-015 v3.4) |
| 5 | E-SCR-M02-003-05 | Visit summary "Hành trình của bạn" | List | v3.6: mọi điểm của journey theo thứ tự hiển thị: vòng ✓ (đã quét) hoặc vòng số nét đứt (chưa quét) nối bằng đường nét đứt; ảnh nhỏ; số thứ tự hai chữ số; tên theo ngôn ngữ; điểm đã quét "Đã tham quan" kèm giờ quét đầu tiên, điểm chưa quét "Chưa ghé · lần sau nhé!" và ảnh xám | Yes | Từ `PlaySession.journeyCheckpoints` và `CheckpointVisit` local. Ảnh nhỏ: ảnh đầu tiên của một mã QR bất kỳ thuộc điểm dừng đó (ưu tiên lấy từ `resources` của gói `SAN_SANG` đang dùng của tuyến; nếu điểm không có trong gói hoặc chưa tải gói thì khi có mạng tra cứu các mã QR của điểm qua live lookup); không có ảnh → ô biểu tượng (spec-M02 v3.6 §5.1). Chữ theo SC-M02-013 v3.6 |
| 6 | E-SCR-M02-003-06 | Completion result | Ảnh bìa + thẻ tóm tắt | Ảnh bìa nền xanh đậm (ảnh rừng mờ dưới lớp phủ tối): chip "Hoàn thành hành trình" khi đã quét mọi điểm, ngược lại "Đã kết thúc chuyến đi"; một tiêu đề cảm ơn; phụ đề hẹn gặp lại. Thẻ tóm tắt đè lên mép dưới ảnh bìa: vòng tiến độ (đủ: ✓ xanh; thiếu: vòng vàng "k/n"), dòng nhỏ "Bạn đã đi hết tuyến" / "Tuyến của bạn" và tên tuyến (chỉ khi có gói, spec-M02 v3.6), "k/n điểm dừng đã tham quan" | Conditional | Hiện sau [Kết thúc]; không yêu cầu quét 100% điểm (FR-M02-016). Chip và vòng theo số điểm đã quét k so với n, không theo `HOAN_TAT`/`BO_DO` |
| 7 | E-SCR-M02-003-07 | Sync status | Nhãn nhỏ ngay dưới danh sách | Trạng thái đồng bộ: chờ đồng bộ (chữ vàng, chấm nhấp nháy), đã đồng bộ (chữ xanh, dấu ✓, đổi trong 200 ms) | Conditional | Theo `PendingSyncItem.syncStatus` (`PENDING`/`SYNCED`/`CONFLICT`); không có trang hàng đợi sync |
| 8 | E-SCR-M02-003-08 | Sync error message | Banner (chỉ chữ, ở chỗ của nhãn gửi; không hình Mila, spec-Mascot v1.10) | Lỗi khi M03 báo conflict hoặc từ chối record | Conditional | Dừng retry tự động; không sửa payload bất biến; không có thao tác thử lại hay xóa của du khách (BR-M02-011) |
| 9 | E-SCR-M02-003-09 | Action: Về danh mục | Link phụ (gạch chân) | VI "Về danh sách tuyến"; mở SCR-M01-001 | Conditional | Sau khi phiên kết thúc |
| 12 | E-SCR-M02-003-12 | Action: Gợi ý tuyến tiếp theo | Button chính | VI "Gợi ý tuyến tiếp theo"; mở SCR-M01-002 (`/recommend`) | Conditional | Sau khi phiên kết thúc (spec-M02 v3.6 §7) |
| 10 | E-SCR-M02-003-10 | Mascot Mila | Ảnh + bong bóng trong slot (Spec Mascot §5.1) | v1.10 (OD-MAS-34): trong ảnh bìa, bên phải tiêu đề, bong bóng bên trái Mila; CELEBRATE một lần ngay sau khi kết thúc với MSG-MAS-065 (≤ 2,4 s, Mila bật lên 0.6 → 1.1 → 1), sau đó DOCK cùng chỗ; `CONFLICT` → Mila đứng yên, không bong bóng; tắt Mila thì ảnh bìa chỉ có chữ. Thẻ "Hẹn gặp lại" và huy hiệu đứng riêng đã bỏ. Câu: bảng copy bên dưới | Conditional (Could, MVP-Scope §3.6) | Chỉ trong slot, không chiếm focus, ảnh `alt=""`; bong bóng ≤ 90 ký tự, có nút đóng; không có nút ẩn Mila; tôn trọng giảm chuyển động (BR-MAS-11, BR-MAS-17); v1.1: cỡ theo design-system §9.2, bong bóng kiểu "Giấy dã ngoại" §9.3, chạm theo ngữ cảnh và chạm nhiều lần (BR-MAS-12, 22), cử chỉ tự động ở màn Mila đứng chờ (BR-MAS-21), công tắc chuyển động ở SCR-M01-004 (v1.3) |
| 11 | E-SCR-M02-003-11 | Công tắc "Chuyển động" của Mila | **Bỏ ở v1.3**: thanh đầu trang không còn nút chuyển động; công tắc duy nhất ở màn Tài nguyên SCR-M01-004 (Spec Mascot BR-MAS-21) | — | — | — |

**Copy cố định (i18n vi/en).** Chuỗi hiển thị cho du khách là tài nguyên i18n đóng gói sẵn cùng ứng dụng (dùng được khi không có mạng), chọn theo `LanguagePreference`. Spec M01/M02 chỉ cố định một số câu; các câu còn lại dưới đây là chữ chốt ở mức screen spec, không thêm hành vi mới. Câu hỏi kết thúc chuyến và hai nút Kết thúc / Đi tiếp đã cố định trong Spec M02 §5.1 và dùng nguyên văn.

| Tình huống | Tiếng Việt | English |
|---|---|---|
| Chip: đã quét mọi điểm (v3.6) | Hoàn thành hành trình | Journey complete |
| Chip: còn điểm chưa quét (v3.6) | Đã kết thúc chuyến đi | Trip ended |
| Tiêu đề kết quả (v3.6) | Cảm ơn bạn đã đồng hành cùng Cúc Phương. | Thank you for exploring Cuc Phuong. |
| Phụ đề hẹn gặp lại (v3.6) | Hẹn gặp lại bạn trong những hành trình tiếp theo. | See you on your next journey. |
| Thẻ tóm tắt: dòng nhỏ khi đã quét mọi điểm | Bạn đã đi hết tuyến | You walked the whole route |
| Thẻ tóm tắt: dòng nhỏ khi còn điểm chưa quét | Tuyến của bạn | Your route |
| Thẻ tóm tắt: số điểm | {k}/{n} điểm dừng đã tham quan | {k}/{n} stops visited |
| Tiêu đề danh sách (v3.6) | Hành trình của bạn | Your journey |
| Nhãn điểm đã quét | Đã tham quan | Visited |
| Nhãn điểm chưa quét (v3.6) | Chưa ghé · lần sau nhé! | Not visited yet |
| Đồng bộ: chờ (v3.6) | Đang chờ gửi về hệ thống | Waiting to sync |
| Đồng bộ: xong (v3.6) | Đã gửi về hệ thống | Synced to the park system |
| Đồng bộ: conflict/bị từ chối | Chuyến đi này không gửi được về hệ thống. Chuyến đi vẫn được lưu trên thiết bị này. | This trip could not be sent to the system. It is still saved on this device. |
| Nút gợi ý tuyến (v3.6) | Gợi ý tuyến tiếp theo | Suggest my next route |
| Nút về danh sách | Về danh sách tuyến | Back to routes |
| Mila khi chuyến chờ gửi lúc mất sóng (MSG-MAS-070) | Chuyến đi đã lưu trên máy. Lần tới có sóng và mở app, mình sẽ gửi đi. | Your trip is saved on this phone. I'll send it next time you're online. |
| Nút đóng bong bóng của Mila | Đóng lời nhắn | Dismiss message |
| Tên truy cập khi chạm Mila | Hỏi Mila | Ask Mila |
| Mila ăn mừng kết thúc chuyến và khi chạm Mila ở màn kết quả (MSG-MAS-065, v1.10) | Cảm ơn bạn đã đi cùng mình hôm nay! | Thanks for exploring with me today! |
| Mila khi bị chạm liên tục (MSG-MAS-085) | Ui, chóng mặt quá! | Whoa, I'm dizzy! |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| Confirmation | Câu hỏi kết thúc chuyến với [Kết thúc] và [Đi tiếp] | Lượt ghé điểm cuối ghi lần đầu, hoặc chọn Finish |
| Continue | Quay lại phiên, Finish vẫn khả dụng | Chọn [Đi tiếp] |
| Completed – pending sync | Ảnh bìa, thẻ tóm tắt, danh sách mọi điểm; chờ đồng bộ | `HOAN_TAT`, record trong hàng đợi |
| Completed – synced | Như trên, đã đồng bộ | M03 xác nhận thành công (kể cả retry giống hệt) |
| Conflict / rejected | Thông báo lỗi đồng bộ, dừng thử lại tự động | M03 trả conflict hoặc từ chối record không hợp lệ |
| Offline | Kết thúc vẫn thực hiện được; record chờ đồng bộ | Không có mạng |

## 5. Interactions and navigation

| # | Element | User action | System response | Destination screen / result |
|---|---|---|---|---|
| 1 | Lượt ghé điểm cuối | Ghi lần đầu | Hiện câu hỏi kết thúc chuyến một lần | Confirmation |
| 2 | Kết thúc | Tap | Phiên `HOAN_TAT`; đóng băng `SessionSyncRecord` và xếp hàng đồng bộ | Completion result |
| 3 | Đi tiếp | Tap | Giữ phiên chạy; không đổi gì | `SCR-M02-001` |
| 4 | Finish (từ phiên) | Tap | Hiện xác nhận; xác nhận như [Kết thúc] | Confirmation |
| 5 | Về danh mục | Tap | Rời màn hình kết quả | `SCR-M01-001` |
| 6 | Gợi ý tuyến tiếp theo | Tap | Rời màn hình kết quả (v3.6) | `SCR-M01-002` |

## 6. Screen-level rules

| Rule ID | Rule | Related requirement |
|---|---|---|
| SR-SCR-M02-003-001 | Câu hỏi kết thúc chuyến hiện đúng một lần khi lượt ghé điểm cuối ghi lần đầu | FR-M02-023, BR-M02-021, SC-M02-015 |
| SR-SCR-M02-003-002 | `HOAN_TAT` yêu cầu đã thăm điểm cuối và visitor xác nhận (hoặc tự đóng sau 24 giờ); không yêu cầu quét đủ 100% | FR-M02-016, BR-M02-007 |
| SR-SCR-M02-003-003 | Không có nút "Dừng chuyến đi"; phiên chỉ thành `BO_DO` khi nhận handoff mới hoặc tự đóng sau 24 giờ | US-M02-05, Screen list M02 §2 |
| SR-SCR-M02-003-004 | Kết thúc không bị chặn bởi mạng; record đồng bộ bất biến được xếp hàng | FR-M02-018, BR-M02-010 |
| SR-SCR-M02-003-005 | Đồng bộ lại cùng `sessionId` với dữ liệu giống hệt là thành công, khác dữ liệu là conflict; record bị M03 từ chối dừng retry và hiện lỗi | BR-M02-011, SC-M02-006 |
| SR-SCR-M02-003-006 | Record đồng bộ không chứa tên, tài khoản, định danh thiết bị, GPS hay PII khác | SC-M02-007 |
| SR-SCR-M02-003-007 | Retry chỉ khi ứng dụng đang mở hoặc quay lại; không đồng bộ nền sau khi đóng trình duyệt | Constitution VI |
| SR-SCR-M02-003-008 | Mila chỉ hiện trong slot của màn và không che nút, vùng thông báo, toast, dialog hay nội dung; câu cố định của màn giữ nguyên; Mila không đổi hành vi hay dữ liệu của màn và không có nút ẩn; không có nút thử lại gửi cho bản ghi CONFLICT | BR-MAS-01, BR-MAS-02, BR-MAS-03, BR-MAS-08, BR-MAS-11 |

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M02-015 | Finish sau điểm có `sequence` lớn nhất |
| FR-M02-016 | Hoàn tất khi xác nhận |
| FR-M02-018 | Hàng đợi đồng bộ bất biến, retry/conflict/rejected |
| FR-M02-023 | Câu hỏi kết thúc chuyến ở lần mở màn chuyến đi kế tiếp sau lượt quét điểm cuối đầu tiên (v3.4) |
| FR-MAS-001, FR-MAS-002, FR-MAS-003, FR-MAS-009 | Mascot Mila: slot, phản ứng theo sự kiện, lời thoại theo ngôn ngữ, không đổi hành vi của màn (Spec Mascot) |

## 8. Responsive and accessibility notes

- Chuyển động khi vừa kết thúc chuyến hoàn tất (CHG-MASCOT-2026-11-28-10; specs/006 US7, ≤ 2,4 s, chạm để bỏ qua; mở lại màn: tĩnh): chip trượt xuống → tiêu đề hiện dần → Mila bật lên một lần → vòng tiến độ chạy đầy rồi đổi thành ✓ → các điểm hiện lần lượt (mỗi điểm cách 80 ms). Giảm chuyển động hoặc tắt "Hiệu ứng chuyển động": hiện thẳng, chấm chờ gửi đứng yên. Đổi VI/EN không chạy lại.
- Định hướng mobile-first: ưu tiên nội dung/action chính, wrap text/tags và stack panels theo chiều rộng thực tế; tránh chiều rộng cố định gây tràn ngang. 360px, 768px và 1280px là kích thước tham khảo để review, không phải hard breakpoint hoặc điều kiện bật/tắt tính năng.
- Review text dài vi/en, zoom, keyboard/focus và error states; không ẩn action nghiệp vụ chỉ vì viewport nhỏ. Bố cục cuối cùng còn chờ UX review.
- Mục tiêu review accessibility: keyboard access, visible focus, semantic labels, focus được quản lý trong dialog, trạng thái đồng bộ không chỉ biểu đạt bằng màu và reduced motion. Tham khảo WCAG 2.1 AA, touch target khoảng 44×44px và contrast 4.5:1 cho normal text; đây là định hướng cần kiểm chứng trên frontend, không phải tuyên bố đã đạt chuẩn.

## 9. Open questions

| ID | Question | Blocking | Status | Resolution |
|---|---|---|---|---|
| OQ-SCR-M02-003-002 | Sau khi hoàn tất, phiên đã `HOAN_TAT` mà người dùng rời màn hình thì trạng thái đồng bộ xem lại ở đâu | No | Resolved | Khi rời màn kết quả, lỗi conflict/bị từ chối hiện một dòng ở SCR-M02-001 (E-SCR-M02-001-22) cho tới khi có chuyến mới; trạng thái chờ gửi và đã gửi không cần hiện lại. |

## Completion checklist

- [x] Required behavioral controls and feedback are described in the inventory.
- [x] Each input has a validation rule or explicit `None`.
- [x] Behavioral success/failure states in this screen scope are described.
- [x] Navigation screen IDs and requirement references resolve; behavioral mappings follow canonical sources.
- [ ] Final layout, copy, assets and UX choices are signed off.
- [ ] Responsive/accessibility and real interactions are verified on the frontend.
