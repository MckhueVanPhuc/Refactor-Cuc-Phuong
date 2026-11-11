# Screen Spec: Kết thúc phiên

| Field | Value |
|---|---|
| Screen ID | `SCR-M02-003` |
| Screen name | Kết thúc phiên |
| Module | `M02` |
| Actor | Visitor có phiên |
| Priority | Must; trạng thái đồng bộ Should |
| Mockup | Chưa có |
| Status | Draft — đồng bộ [Spec M02 v3.3](../../../docs/spec/spec-M02.md) |

Nguồn hành vi/contract: [Spec M02](../../../docs/spec/spec-M02.md) (`SessionSyncRecord` nhận bởi [Spec M03 v3.7](../../../docs/spec/spec-M03.md) §5.1). Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu. Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline.

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Trong §9: **Confirmed** có nguồn baseline, **Proposed** chờ UX review, **Open** có clarification chưa được nguồn xác nhận. Draft không đồng nghĩa frontend/prototype đã được nghiệm thu. Chữ hiển thị cho người dùng chỉ là các câu trong ngoặc kép, câu của khóa MSG-* và bảng copy; tên trường, mã enum/trạng thái, định danh và khóa MSG-* trong tài liệu này chỉ để truy vết cho người phát triển, không bao giờ hiện trên giao diện.

## 1. Purpose

**Shown when:** Ngay khi lượt ghé của điểm cuối (điểm dừng có `sequence` lớn nhất của journey) được ghi lần đầu trong phiên, hiện câu hỏi kết thúc chuyến; hoặc khi visitor chọn Finish từ SCR-M02-001 sau đó.

**The user leaves when:** Chọn [Kết thúc] (phiên thành `HOAN_TAT`, về SCR-M01-001) hoặc [Đi tiếp] (về SCR-M02-001 với phiên còn chạy).

## 2. Mockup

Chưa có mockup cho màn này. Không dùng ảnh mockup về sau để suy ngược business rule.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M02-003-01 | End-of-trip prompt | Dialog | VI: "Bạn đã quét điểm cuối. Kết thúc chuyến đi?" (EN: "You have scanned the last point. End the trip?") | Conditional | Hiện đúng một lần khi lượt ghé điểm cuối được ghi lần đầu; không hiện lại cho lần quét sau (BR-M02-021) |
| 2 | E-SCR-M02-003-02 | Action: Kết thúc | Button | VI: "Kết thúc" (EN: "End") | Yes | Tác dụng giống xác nhận Finish: phiên thành `HOAN_TAT` (BR-M02-007) |
| 3 | E-SCR-M02-003-03 | Action: Đi tiếp | Button | VI: "Đi tiếp" (EN: "Continue") | Yes | Không đổi gì; Finish vẫn khả dụng đến khi phiên kết thúc |
| 4 | E-SCR-M02-003-04 | Finish confirmation | Dialog | Xác nhận kết thúc khi dùng Finish | Conditional | Finish chỉ khả dụng khi đã quét điểm có `sequence` lớn nhất |
| 5 | E-SCR-M02-003-05 | Visit summary | List | Các điểm đã quét: tên theo ngôn ngữ, thứ tự, `checkedInAt` | Yes | Từ `PlaySession` và `CheckpointVisit` local; nhãn "Đã tham quan" kèm giờ quét, không phải "đã đến" (SC-M02-013, spec-M02 3.3 clarification 3) |
| 6 | E-SCR-M02-003-06 | Completion result | Text | Phiên đã hoàn tất kèm danh sách điểm đã quét | Conditional | Hiện sau [Kết thúc]; không yêu cầu quét 100% điểm (FR-M02-016) |
| 7 | E-SCR-M02-003-07 | Sync status | Text/badge | Trạng thái đồng bộ: chờ đồng bộ, đã đồng bộ, conflict/bị từ chối | Conditional | Theo `PendingSyncItem.syncStatus` (`PENDING`/`SYNCED`/`CONFLICT`); không có trang hàng đợi sync |
| 8 | E-SCR-M02-003-08 | Sync error message | Banner | Lỗi khi M03 báo conflict hoặc từ chối record | Conditional | Dừng retry tự động; không sửa payload bất biến; không có thao tác thử lại hay xóa của du khách (BR-M02-011) |
| 9 | E-SCR-M02-003-09 | Action: Về danh mục | Button | Mở SCR-M01-001 | Conditional | Sau khi phiên kết thúc |

**Copy cố định (i18n vi/en).** Chuỗi hiển thị cho du khách là tài nguyên i18n đóng gói sẵn cùng ứng dụng (dùng được khi không có mạng), chọn theo `LanguagePreference`. Spec M01/M02 chỉ cố định một số câu; các câu còn lại dưới đây là chữ chốt ở mức screen spec, không thêm hành vi mới. Câu hỏi kết thúc chuyến và hai nút Kết thúc / Đi tiếp đã cố định trong Spec M02 §5.1 và dùng nguyên văn.

| Tình huống | Tiếng Việt | English |
|---|---|---|
| Tiêu đề kết quả | Chuyến đi đã kết thúc! | Your trip has ended! |
| Lời cảm ơn | Cảm ơn bạn đã tham quan Vườn quốc gia Cúc Phương! | Thank you for visiting Cuc Phuong National Park! |
| Lời chúc | Hy vọng bạn đã có những trải nghiệm tuyệt vời tại Cúc Phương! | We hope you had a wonderful time at Cuc Phuong! |
| Lời hẹn gặp lại | Hẹn gặp lại bạn trong những hành trình tiếp theo! | See you on your next journey! |
| Tiêu đề danh sách | Các điểm đã quét | Points scanned |
| Nhãn điểm trong danh sách | Đã tham quan | Visited |
| Đồng bộ: chờ | Chờ gửi về hệ thống | Waiting to be sent |
| Đồng bộ: xong | Đã gửi về hệ thống | Sent |
| Đồng bộ: conflict/bị từ chối | Chuyến đi này không gửi được về hệ thống. Chuyến đi vẫn được lưu trên thiết bị này. | This trip could not be sent to the system. It is still saved on this device. |
| Nút về danh sách | Về danh sách tuyến | Back to routes |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| Confirmation | Câu hỏi kết thúc chuyến với [Kết thúc] và [Đi tiếp] | Lượt ghé điểm cuối ghi lần đầu, hoặc chọn Finish |
| Continue | Quay lại phiên, Finish vẫn khả dụng | Chọn [Đi tiếp] |
| Completed – pending sync | Danh sách điểm đã quét; chờ đồng bộ | `HOAN_TAT`, record trong hàng đợi |
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

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M02-015 | Finish sau điểm có `sequence` lớn nhất |
| FR-M02-016 | Hoàn tất khi xác nhận |
| FR-M02-018 | Hàng đợi đồng bộ bất biến, retry/conflict/rejected |
| FR-M02-023 | Câu hỏi kết thúc chuyến khi quét điểm cuối lần đầu |

## 8. Responsive and accessibility notes

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
