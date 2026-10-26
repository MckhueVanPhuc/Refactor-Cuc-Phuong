# Screen Spec: Nội dung checkpoint

| Field | Value |
|---|---|
| Screen ID | `SCR-M02-002` |
| Screen name | Nội dung checkpoint |
| Module | `M02` |
| Actor | Visitor; free visitor nếu enabled |
| Priority | Must; free visitor Could |
| Mockup | `screens/M02/mockups/SCR-M02-002-content.png` |
| Status | Draft |

Nguồn hành vi/contract: [Spec M02](../../../docs/spec/spec-M02.md). Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu; bố cục/visual direction tham khảo [DESIGN.md](../../../DESIGN.md). Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline.

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Trong §9: **Confirmed** có nguồn baseline, **Proposed** chờ UX review, **Open** có clarification chưa được nguồn xác nhận. Draft không đồng nghĩa frontend/prototype đã được nghiệm thu.

## 1. Purpose

**Shown when:** Visitor đã scan QR checkpoint thành công (SCR-M02-001); HOẶC mở lại checkpoint đã ghé; HOẶC free visitor scan QR.

**The user leaves when:** Quay về scanner/session.

## 2. Mockup

Mockup: `screens/M02/mockups/SCR-M02-002-content.png`. Đây là target asset tham khảo; cần kiểm tra asset và design sign-off, không dùng ảnh mockup để suy ngược business rule.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M02-002-01 | Checkpoint name | Header text | `checkpointName` từ frozen journey hoặc live lookup | Yes | Non-empty |
| 2 | E-SCR-M02-002-02 | Language indicator | Header control | `vi` / `en`; đọc từ LanguagePreference; đổi bằng control M01 | Yes | Hiển thị ngôn ngữ hiện tại |
| 3 | E-SCR-M02-002-03 | Connectivity badge | Badge | `OFFLINE_REQUIRED` / `ONLINE_AVAILABLE` | Yes | Hiển thị mode |
| 4 | E-SCR-M02-002-04 | Checkpoint image | Image | `staticImages[]`: local bytes từ ready OfflinePackage.resources hoặc reference từ LiveStationContent | No | Không dùng URL như bằng chứng image bytes đã có offline |
| 5 | E-SCR-M02-002-05 | Checkpoint introduction | Text | `localizedContent.vi.introductionText` hoặc `localizedContent.en.introductionText` theo LanguagePreference | Conditional | Hiển thị nếu đúng source có content; thiếu thì unavailable, không xóa visit |
| 6 | E-SCR-M02-002-06 | Media controls | Player controls | Audio/video player cho media resources; play chỉ khi user explicitly action | Conditional | Hiển thị khi có mediaResources |
| 7 | E-SCR-M02-002-08 | Visited indicator | Badge | "Đã ghé" kèm thời điểm nếu checkpoint đã visited | Conditional | Hiển thị khi đã visited |
| 8 | E-SCR-M02-002-09 | Loading state | Spinner | Loading spinner khi đang tải content | Conditional | Hiển thị khi loading |
| 9 | E-SCR-M02-002-10 | Content unavailable | Banner | Nội dung offline thiếu hoặc live source không truy cập được; visit vẫn được giữ | Conditional | OUTDATED tự nó không làm content unavailable; media error hiển thị riêng |
| 10 | E-SCR-M02-002-11 | Action: Quay về | Button | Quay về scanner/session | Yes | None |
| 12 | E-SCR-M02-002-12 | Source label | Text | "Từ gói offline" / "Từ máy chủ" để chỉ nguồn content | Yes | None |
| 13 | E-SCR-M02-002-13 | Free visitor mode banner | Banner | "Chế độ xem thông tin" khi free visitor mode | Conditional | Hiển thị khi free visitor |
| 14 | E-SCR-M02-002-14 | Media/image error | Inline message | Lỗi resource riêng lẻ; giữ text/images khác đã đọc được | Conditional | Không rollback visit hoặc biến toàn bộ content thành lỗi |
| 15 | E-SCR-M02-002-15 | Action: Làm mới / Thử lại | Button | Retry live fetch hoặc đọc lại local resource theo đúng mode | Conditional | Không fallback OFFLINE_REQUIRED sang live để đổi source semantics |
| 16 | E-SCR-M02-002-16 | Outdated package note | Text/banner | Gói cũ vẫn dùng được khi có matching ready resource | Conditional | Không đổi frozen journey/version của session |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| Default | Content hiển thị đầy đủ; visited indicator nếu đã ghé | Content loaded from correct source |
| Loading | Spinner; nội dung ẩn | Đang fetch từ source |
| Content loaded (offline) | Content từ package; source label "Từ gói offline" | OfflineRequired + SAN_SANG resource available |
| Content loaded (offline outdated) | Content từ matching ready package cũ; warning nếu biết freshness OUTDATED | OFFLINE_REQUIRED và resource vẫn dùng được cho frozen session |
| Content loaded (online) | Content từ M03 live; source label "Từ máy chủ" | OnlineAvailable |
| Content unavailable | Thông báo thiếu resource hoặc lỗi source; giữ visit và cho quay lại/thử lại | Matching offline resource thiếu hoặc live content fetch fails |
| Media playing | Audio/video player active | User explicitly tap play |
| Media error | Error message cho media playback failure | Media file unavailable hoặc unsupported |
| Image error | Thông báo ảnh không tải được; text và visit giữ nguyên | Một image resource không đọc được |
| Free visitor | Banner "Chế độ xem thông tin" + content | Free visitor mode active |

## 5. Interactions and navigation

| # | Element | User action | System response | Destination screen / result |
|---|---|---|---|---|
| 1 | Checkpoint image | Tap / view | Hiển thị image fullscreen nếu supported | Fullscreen image view |
| 2 | Audio/Video | Tap play | Bắt đầu phát media on demand | Media player active |
| 3 | Audio/Video | Tap pause/stop | Dừng media | Media paused/stopped |
| 4 | Language indicator | Tap | Chuyển hướng đến M01 language control | Mở M01 language selector |
| 5 | Quay về | Tap | Quay về scanner/session | `SCR-M02-001` |
| 6 | Làm mới / Thử lại | Tap; pull-to-refresh nếu được chọn | Đọc lại đúng source: package cho OFFLINE_REQUIRED, M03 cho online/outside/free | Reload content hoặc giữ error |

## 6. Screen-level rules

| Rule ID | Rule | Related requirement |
|---|---|---|
| SR-SCR-M02-002-001 | OFFLINE_REQUIRED checkpoint: đọc bilingual text/images từ ready package resource keyed by checkpointId | FR-M02-010, BR-M02-009 |
| SR-SCR-M02-002-002 | ONLINE_AVAILABLE checkpoint: đọc current public content từ M03 live | FR-M02-011, BR-M02-009 |
| SR-SCR-M02-002-003 | Audio/video chỉ phát khi visitor explicitly action | FR-M02-011 |
| SR-SCR-M02-002-004 | Missing content hiển thị unavailable message NHƯNG vẫn giữ visit | FR-M02-010, BR-M02-005 |
| SR-SCR-M02-002-005 | Package cũ vẫn dùng được nếu có resource cho checkpoint đó | FR-M02-010 |
| SR-SCR-M02-002-006 | LanguagePreference controls ngôn ngữ content được hiển thị | FR-M02-014 |
| SR-SCR-M02-002-007 | Outside-journey và free visitor luôn đọc LiveStationContent, kể cả live connectivityMode là OFFLINE_REQUIRED; không tạo visit | FR-M02-012, FR-M02-019, BR-M02-009 |

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M02-004 | Tên/connectivity metadata session từ frozen journey; journey-only manifest không chứa text/images |
| FR-M02-005 | Resume checkpoint content sau reload |
| FR-M02-010 | Read offline content từ matching ready package |
| FR-M02-011 | Read online/live content từ M03 và play media on demand |
| FR-M02-012 | QR outside journey hiển thị live content |
| FR-M02-014 | Apply LanguagePreference cho content |
| FR-M02-019 | Free visitor: live content only |

## 8. Responsive and accessibility notes

- Định hướng mobile-first: ưu tiên nội dung/action chính, wrap text/tags và stack panels theo chiều rộng thực tế; tránh chiều rộng cố định gây tràn ngang. 360px, 768px và 1280px là kích thước tham khảo để review, không phải hard breakpoint hoặc điều kiện bật/tắt tính năng.
- Review text dài vi/en, loading/empty/error, phóng to chữ, focus và thao tác một tay trên điện thoại. Bố cục cuối cùng cần prototype/usability review trước sign-off.
- Mục tiêu review accessibility: keyboard access, visible focus, semantic labels, error liên kết với field, status không chỉ biểu đạt bằng màu và reduced motion. Tham khảo WCAG 2.1 AA, touch target khoảng 44×44px và contrast 4.5:1 cho normal text; đây là định hướng cần kiểm chứng trên frontend, không phải tuyên bố đã đạt chuẩn.

## 9. Open questions

| ID | Question | Blocking | Status | Resolution |
|---|---|---|---|---|
| OQ-SCR-M02-002-001 | Cơ chế hiển thị image fullscreen (lightbox, new tab, inline?) | No | Proposed | Đề xuất image viewer có action đóng rõ ràng và keyboard support; lightbox/inline và gesture còn chờ review, không bắt buộc swipe để thoát. |
| OQ-SCR-M02-002-002 | Supported audio/video formats và fallback strategy | No | Open | [NEEDS CLARIFICATION: media format/codec support và fallback UX chưa có baseline xác nhận.] Không chốt MP3/MP4 hoặc codec như contract; playback error chỉ ảnh hưởng resource đó, giữ text và visit. |
| OQ-SCR-M02-002-003 | Retry strategy khi online content fetch fails | No | Proposed | Đề xuất explicit retry cho live source failure; số lần/interval chưa chốt. Phân biệt source error với invalid QR và giữ visit; không đổi offline source semantics. |
| OQ-SCR-M02-002-004 | Kích thước trang tối thiểu | No | Proposed | Mobile-first, co giãn theo content; xem §8, chưa chốt minimum/breakpoints. |

## Completion checklist

- [x] Required behavioral controls and feedback are described in the inventory.
- [x] Each input has a validation rule or explicit `None`.
- [x] Behavioral success/failure states in this screen scope are described.
- [x] Navigation screen IDs and requirement references resolve; behavioral mappings follow canonical sources.
- [ ] Final layout, copy, assets and UX choices are signed off.
- [ ] Responsive/accessibility and real interactions are verified on the frontend.
