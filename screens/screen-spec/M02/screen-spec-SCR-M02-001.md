# Screen Spec: Phiên trải nghiệm & Quét QR

| Field | Value |
|---|---|
| Screen ID | `SCR-M02-001` |
| Screen name | Phiên trải nghiệm & Quét QR |
| Module | `M02` |
| Actor | Visitor; free visitor khi capability được phát hành |
| Priority | Must; free visitor Could |
| Mockup | `screens/M02/mockups/SCR-M02-001-session.png` |
| Status | Draft |

Nguồn hành vi/contract: [Spec M02](../../../docs/spec/spec-M02.md). Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu; bố cục/visual direction tham khảo [DESIGN.md](../../../DESIGN.md). Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline.

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Trong §9: **Confirmed** có nguồn baseline, **Proposed** chờ UX review, **Open** có clarification chưa được nguồn xác nhận. Draft không đồng nghĩa frontend/prototype đã được nghiệm thu.

## 1. Purpose

**Shown when:** M01 Start tạo handoff hợp lệ; HOẶC reload/resume phiên cũ; HOẶC free-visitor entry riêng khi capability bật.

**The user leaves when:** Mở checkpoint content (SCR-M02-002), chọn Finish (khi final checkpoint đã ghé), hoặc nhận handoff mới từ M01.

## 2. Mockup

Mockup: `screens/M02/mockups/SCR-M02-001-session.png`. Đây là target asset tham khảo; cần kiểm tra asset và design sign-off, không dùng ảnh mockup để suy ngược business rule.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M02-001-01 | Route name | Header text | routeId từ PlaySession; tên tuyến chỉ là metadata hiển thị riêng nếu đã có Published Route/local view | Conditional | Handoff/frozen journey không có routeName; thiếu tên thì dùng routeId; free mode dùng tiêu đề scanner |
| 2 | E-SCR-M02-001-02 | Language indicator | Header control | `vi` / `en`; đọc từ LanguagePreference; đổi bằng control M01 | Yes | Chỉ hiển thị, không tự ghi |
| 3 | E-SCR-M02-001-03 | Session status | Badge | `DANG_DIEN_RA` / `HOAN_TAT` / `BO_DO` từ PlaySession | Conditional | Chỉ khi có session; free mode không có session status |
| 4 | E-SCR-M02-001-04 | Journey timeline | List | Frozen journey checkpoints theo sequence, kèm visits của session | Conditional | Chỉ khi có session; không thay manifest bằng live journey |
| 5 | E-SCR-M02-001-05 | Checkpoint item (visited) | List item | Checkpoint đã ghé; checked-in time, visit indicator | Conditional | Hiển thị visited=true |
| 6 | E-SCR-M02-001-06 | Checkpoint item (current) | List item | Checkpoint đang hiển thị content | Conditional | Current checkpoint |
| 7 | E-SCR-M02-001-07 | Checkpoint item (upcoming) | List item | Checkpoint chưa ghé; sequence number, checkpoint name | Conditional | Hiển thị visited=false |
| 8 | E-SCR-M02-001-08 | QR Scanner | Component | Camera viewfinder; QR scan overlay; tap to activate | Yes | Camera permission required |
| 9 | E-SCR-M02-001-09 | Scanner instruction | Text | "Quét mã QR tại điểm checkpoint" / "Scan the QR code at the checkpoint" | Yes | None |
| 10 | E-SCR-M02-001-10 | Camera permission denied | Banner/panel | Hướng dẫn bật camera permission | Conditional | Hiển thị khi permission denied |
| 11 | E-SCR-M02-001-11 | Camera unavailable | Banner/panel | Thông báo camera không khả dụng | Conditional | Hiển thị khi camera unavailable |
| 12 | E-SCR-M02-001-12 | Action: Mở nội dung | List item tap | Mở content của checkpoint đã ghé hoặc đang xem | Yes | None |
| 13 | E-SCR-M02-001-13 | Action: Finish | Button | Kết thúc phiên; chỉ enabled khi final checkpoint (highest sequence) đã visited | Conditional | Disabled khi final checkpoint chưa ghé |
| 14 | E-SCR-M02-001-15 | Rescan feedback | Toast/panel | "Đã ghé lúc [time]" khi quét lại QR đã ghé | Conditional | Hiển thị khi scan duplicate |
| 15 | E-SCR-M02-001-16 | Invalid QR banner | Banner | "Mã không còn hiệu lực hoặc không tồn tại" khi live lookup xác nhận unknown/withdrawn QR ngoài frozen journey | Conditional | Không coi QR thiếu trong journey hoặc lỗi mạng là invalid |
| 16 | E-SCR-M02-001-17 | Network error banner | Banner | "Lỗi kết nối" khi QR lookup fails với network error | Conditional | Hiển thị khi source failure |
| 17 | E-SCR-M02-001-18 | Outside journey content prompt | Toast/panel | QR hợp lệ nhưng không trong journey; gợi ý xem nội dung online | Conditional | Hiển thị khi valid QR outside journey |
| 19 | E-SCR-M02-001-19 | BO_DO banner | Banner | "Phiên này đã bị thay thế" khi nhận handoff mới | Conditional | Hiển thị khi session = BO_DO |
| 20 | E-SCR-M02-001-20 | Check-in animation | Animation | Visual feedback khi check-in thành công | Conditional | Hiển thị khi first scan for checkpoint |
| 21 | E-SCR-M02-001-21 | Action: Mở camera / Thử lại | Button | Yêu cầu camera khi visitor chọn quét; thử lại scan sau lỗi | Yes | Không cam kết browser sẽ hỏi permission lại sau denial; không tạo visit trước QR hợp lệ |
| 22 | E-SCR-M02-001-22 | Session start / resume feedback | Panel | Đang đọc local session/handoff, handoff lỗi/revoked/đã dùng, lỗi lưu session hoặc replacement | Conditional | Giữ session cũ nếu replacement thất bại; không consume handoff một phần |
| 23 | E-SCR-M02-001-23 | Action: Về danh mục | Button | Về M01 để chọn tuyến và tạo Start mới khi không có phiên hợp lệ | Conditional | Không tự tạo handoff hoặc bỏ phiên đang chạy |
| 24 | E-SCR-M02-001-24 | Free visitor indicator | Text/banner | Chế độ chỉ xem nội dung QR, không ghi tiến trình | Conditional | Chỉ khi free visitor capability được phát hành |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| Default | Journey timeline, scanner ready, status DANG_DIEN_RA | Session active, no current action |
| Starting / resuming | Báo đang đọc/khôi phục local session; chưa cho check-in trước khi session hợp lệ | Start hoặc reload |
| Invalid/revoked/used handoff, no active session | Giải thích cần Start mới từ M01; không tạo session từ handoff lỗi | Handoff không hợp lệ và không có session để resume |
| Resume existing session | Journey và visits cũ; cùng handoff đã consumed không tạo session mới | Reload với active session |
| Replacement failure | Báo lỗi; old DANG_DIEN_RA và visits vẫn giữ nguyên | New-session transaction fails |
| Free visitor | Scanner và mode indicator; không journey/progress/Finish | Free visitor entry khi capability được phát hành |
| Scanning | Camera viewfinder active, scan overlay visible | Scanner activated |
| Visit success | Checkpoint animation + "Đã ghé" feedback + timeline updated | First scan of checkpoint in journey |
| Rescan | Toast "Đã ghé lúc [time]", không tạo visit mới | Scan QR đã ghé |
| Invalid QR | Banner "Mã không còn hiệu lực hoặc không tồn tại" | Live lookup xác nhận unknown/withdrawn ngoài frozen journey |
| Network error | Banner "Lỗi kết nối, vui lòng thử lại" | Source lookup fails với network error |
| Outside journey | Toast + option xem live content | Valid QR nhưng không trong journey |
| Final checkpoint visited | Nút Finish enabled | Highest-sequence checkpoint visited |
| Finish ready | Nút Finish highlighted/emphasized | After final checkpoint visited |
| BO_DO | Banner "Phiên này đã bị thay thế"; session chỉ đọc | New handoff accepted |
| Permission denied | Panel hướng dẫn bật camera | Camera permission denied |
| Camera unavailable | Thông báo camera không khả dụng | Device không có camera |

## 5. Interactions and navigation

| # | Element | User action | System response | Destination screen / result |
|---|---|---|---|---|
| 1 | QR Scanner | Point camera at QR | Session mode: resolve trong frozen QR set trước; nếu ngoài journey thì live lookup. Free mode: live lookup | Check-in trước content hoặc live-only/error |
| 2 | Checkpoint item | Tap | Mở content cho checkpoint đã ghé | `SCR-M02-002` |
| 3 | Mở nội dung | Tap | Mở checkpoint content với visited/loading state | `SCR-M02-002` |
| 4 | Finish | Tap | Chuyển sang xác nhận kết thúc | `SCR-M02-003` |
| 5 | Language indicator | Tap | Chuyển hướng đến control M01 để đổi ngôn ngữ | Mở M01 language selector |
| 6 | Mở camera / Thử lại | Tap button | Request camera qua frontend/browser hoặc thử lại scan; hiển thị lỗi permission/device nếu không mở được | Scanning hoặc camera error |
| 7 | Xem nội dung (outside journey) | Tap | Hiển thị live content từ M03 mà không tạo visit | `SCR-M02-002` (live mode) |
| 8 | Về danh mục | Tap | Về M01 để chọn tuyến/Start; không tự đổi session state | `SCR-M01-001` |

## 6. Screen-level rules

| Rule ID | Rule | Related requirement |
|---|---|---|
| SR-SCR-M02-001-001 | Tối đa một active session `DANG_DIEN_RA` tại một thời điểm trên thiết bị | FR-M02-002, BR-M02-002 |
| SR-SCR-M02-001-002 | Mỗi `(sessionId, checkpointId)` chỉ tạo một visit; scan lại không tạo duplicate | FR-M02-007, BR-M02-004 |
| SR-SCR-M02-001-003 | Visit được ghi một lần TRƯỚC KHI tải content | FR-M02-007 |
| SR-SCR-M02-001-004 | QR trong frozen journey resolve theo manifest; QR ngoài journey dùng M03 lookup và không tạo visit. Source lỗi không được gán invalid | FR-M02-006, FR-M02-012, FR-M02-013; spec-M02 §4.1 |
| SR-SCR-M02-001-005 | Checkpoint visit không bắt buộc theo thứ tự; sequence chỉ dùng cho display và final checkpoint detection | BR-M02-006, FR-M02-008 |
| SR-SCR-M02-001-006 | Finish chỉ enabled sau khi checkpoint có highest sequence được visited | FR-M02-015 |
| SR-SCR-M02-001-007 | Handoff mới hợp lệ: một operation nguyên tử tạo new DANG_DIEN_RA, chuyển old session sang BO_DO và lưu terminal sync data của old session | FR-M02-017, FR-M02-018, BR-M02-013 |
| SR-SCR-M02-001-008 | Lỗi tạo replacement session KHÔNG thay đổi session cũ | BR-M02-013 |
| SR-SCR-M02-001-009 | Free visitor mode: scan QR để xem content, không tạo session/visit/sync | FR-M02-019 |
| SR-SCR-M02-001-010 | Network failure được báo cáo riêng, không phải invalid QR | FR-M02-013 |
| SR-SCR-M02-001-011 | M02 chỉ đọc M01 language/handoff/package và M03 source; đổi language qua control M01, không ghi source data từ scanner | FR-M02-020 |

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M02-001 | Validate handoff v2: authorized, unused, AUTHORIZED status |
| FR-M02-002 | Enforce tối đa một DANG_DIEN_RA session |
| FR-M02-003 | Generate UUID sessionId; enforce unique sourceHandoffId |
| FR-M02-004 | Copy manifest thành frozen journey |
| FR-M02-005 | Resume session sau reload |
| FR-M02-006 | QR resolution về checkpointId |
| FR-M02-007 | Ghi visit một lần trước tải content |
| FR-M02-008 | Check-in không bắt thứ tự; hiển thị visited state |
| FR-M02-009 | Quét lại hiển thị thời điểm cũ |
| FR-M02-012 | QR ngoài journey chỉ xem live content |
| FR-M02-013 | Invalid QR khác network failure |
| FR-M02-014 | Đọc LanguagePreference từ M01 |
| FR-M02-015 | Finish enabled sau highest-sequence visit |
| FR-M02-017 | Atomic BO_DO + new session |
| FR-M02-019 | Free visitor: không tạo progress |
| FR-M02-020 | M01/M03-owned source data là read-only đối với M02 |

## 8. Responsive and accessibility notes

- Định hướng mobile-first: ưu tiên nội dung/action chính, wrap text/tags và stack panels theo chiều rộng thực tế; tránh chiều rộng cố định gây tràn ngang. 360px, 768px và 1280px là kích thước tham khảo để review, không phải hard breakpoint hoặc điều kiện bật/tắt tính năng.
- Review text dài vi/en, loading/empty/error, phóng to chữ, focus và thao tác một tay trên điện thoại. Bố cục cuối cùng cần prototype/usability review trước sign-off.
- Mục tiêu review accessibility: keyboard access, visible focus, semantic labels, error liên kết với field, status không chỉ biểu đạt bằng màu và reduced motion. Tham khảo WCAG 2.1 AA, touch target khoảng 44×44px và contrast 4.5:1 cho normal text; đây là định hướng cần kiểm chứng trên frontend, không phải tuyên bố đã đạt chuẩn.

## 9. Open questions

| ID | Question | Blocking | Status | Resolution |
|---|---|---|---|---|
| OQ-SCR-M02-001-001 | UI pattern cho scanner (fullscreen overlay hay embedded viewfinder?) | No | Proposed | Có thể thử embedded viewfinder hoặc fullscreen scanner; chưa có usability evidence để chốt phương án tối ưu. Journey, feedback và action thoát cần rõ. |
| OQ-SCR-M02-001-002 | Animation khi check-in thành công (visual feedback) | No | Proposed | Đề xuất check-in feedback bằng text/icon; animation tùy chọn, timing chưa chốt, tôn trọng reduced motion. Không block ghi visit/content flow. |
| OQ-SCR-M02-001-003 | Cơ chế retry cho camera permission denied | No | Proposed | Đề xuất nút Mở camera/Thử lại và hướng dẫn permission theo browser/device. Không bảo đảm browser sẽ hỏi permission lần nữa; camera failure không làm mất session/visits. |
| OQ-SCR-M02-001-004 | Free visitor entry point cụ thể là gì (deep link, menu, button?) | No | Proposed | Đề xuất entry Xem nội dung QR ở SCR-M01-001 khi free capability được phát hành. URL/deep-link format chưa chốt; không hardcode query parameter thành contract. |
| OQ-SCR-M02-001-005 | Kích thước trang tối thiểu | No | Proposed | Mobile-first; kích thước review tham khảo tại §8, không dùng viewport để suy ra camera availability. |

## Completion checklist

- [x] Required behavioral controls and feedback are described in the inventory.
- [x] Each input has a validation rule or explicit `None`.
- [x] Behavioral success/failure states in this screen scope are described.
- [x] Navigation screen IDs and requirement references resolve; behavioral mappings follow canonical sources.
- [ ] Final layout, copy, assets and UX choices are signed off.
- [ ] Responsive/accessibility and real interactions are verified on the frontend.
