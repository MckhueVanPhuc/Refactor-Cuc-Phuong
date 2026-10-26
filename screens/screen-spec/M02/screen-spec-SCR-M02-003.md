# Screen Spec: Kết thúc phiên

| Field | Value |
|---|---|
| Screen ID | `SCR-M02-003` |
| Screen name | Kết thúc phiên |
| Module | `M02` |
| Actor | Visitor có session |
| Priority | Must; sync status Should |
| Mockup | `screens/M02/mockups/SCR-M02-003-finish.png` |
| Status | Draft |

Nguồn hành vi/contract: [Spec M02](../../../docs/spec/spec-M02.md). Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu; bố cục/visual direction tham khảo [DESIGN.md](../../../DESIGN.md). Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline.

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Trong §9: **Confirmed** có nguồn baseline, **Proposed** chờ UX review, **Open** có clarification chưa được nguồn xác nhận. Draft không đồng nghĩa frontend/prototype đã được nghiệm thu.

## 1. Purpose

**Shown when:** Final checkpoint (highest sequence) đã visited và visitor chọn Finish từ SCR-M02-001.

**The user leaves when:** Xác nhận hoàn tất (chuyển trạng thái HOAN_TAT) rồi quay về SCR-M01-001; HOẶC quay lại SCR-M02-001 để tiếp tục.

## 2. Mockup

Mockup: `screens/M02/mockups/SCR-M02-003-finish.png`. Đây là target asset tham khảo; cần kiểm tra asset và design sign-off, không dùng ảnh mockup để suy ngược business rule.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M02-003-01 | Screen title | Header text | "Hoàn tất phiên" / "Complete Session" theo ngôn ngữ | Yes | Non-empty |
| 2 | E-SCR-M02-003-02 | Language indicator | Header control | `vi` / `en`; đọc từ LanguagePreference | Yes | Hiển thị ngôn ngữ hiện tại |
| 3 | E-SCR-M02-003-03 | Session summary | Panel | routeId, tổng checkpoint và visits từ frozen session; tên tuyến nếu có metadata hiển thị riêng | Yes | Không thêm routeName vào SessionSyncRecord/handoff; thiếu tên thì dùng routeId |
| 4 | E-SCR-M02-003-04 | Checkpoint list | List | Tất cả checkpoints đã ghé với thời điểm | Yes | Hiển thị N visited |
| 5 | E-SCR-M02-003-05 | Completion badge | Badge | "HOAN_TAT" badge | Conditional | Chỉ sau khi terminal state và immutable sync data được lưu thành công |
| 6 | E-SCR-M02-003-06 | Sync status | Badge | Trạng thái sync: PENDING / SYNCED / CONFLICT | Conditional | Hiển thị sync status |
| 7 | E-SCR-M02-003-07 | Confirmation text | Text | "Bạn có chắc muốn kết thúc phiên này?" / "Are you sure you want to complete this session?" | Yes | None |
| 8 | E-SCR-M02-003-08 | Action: Xác nhận | Button | Kết thúc phiên; chuyển session → HOAN_TAT | Conditional | Chỉ khi DANG_DIEN_RA và highest-sequence đã visited; disabled khi đang lưu, không confirm lại terminal session |
| 9 | E-SCR-M02-003-09 | Action: Quay lại | Button | Quay về SCR-M02-001 để tiếp tục trước khi confirmed | Conditional | Không mở lại terminal session thành DANG_DIEN_RA |
| 10 | E-SCR-M02-003-10 | Action: Về danh mục | Button | Quay về SCR-M01-001 sau khi confirmed | Conditional | Hiển thị sau khi confirmed |
| 11 | E-SCR-M02-003-11 | Sync error banner | Banner | PENDING: chưa gửi được, sẽ retry; CONFLICT: payload xung đột, đã dừng retry | Conditional | Phân biệt network/server failure với terminal conflict |
| 12 | E-SCR-M02-003-12 | Sync pending | Text | Chờ đồng bộ hoặc đang gửi; network activity là transient UI state | Conditional | Canonical syncStatus vẫn PENDING; không thêm enum SYNCING |
| 13 | E-SCR-M02-003-13 | Sync success | Badge | "Đã đồng bộ" khi SYNCED | Conditional | Hiển thị khi SYNCED |
| 14 | E-SCR-M02-003-14 | Skipped checkpoints note | Text | "Một số checkpoint chưa ghé" nếu visited < total | Conditional | Hiển thị khi visited < total |
| 15 | E-SCR-M02-003-15 | Action: Thử đồng bộ lại | Button | Đề nghị gửi lại đúng immutable pending record | Conditional | Chỉ PENDING; không sửa payload/sessionId, không retry CONFLICT |
| 16 | E-SCR-M02-003-16 | Completion failure | Banner | Không lưu được terminal session/sync data; chưa báo hoàn tất | Conditional | Giữ phiên đang chạy nếu terminal operation thất bại |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| Default | Confirmation text, checkpoint list (visited), action buttons | Final checkpoint visited, Finish tapped |
| Confirmation pending | Buttons Xác nhận và Quay lại visible | Before user confirms |
| Confirming | Báo đang lưu; ngăn double-submit | Terminal operation in progress |
| Completion failure | Báo lỗi local persistence; có thể xác nhận lại hoặc quay về phiên vẫn chạy | Terminal operation fails |
| Finish unavailable | Giải thích chưa thể Finish; không tạo terminal record | Session không DANG_DIEN_RA hoặc final checkpoint chưa visited |
| Confirmed (pending sync) | "HOAN_TAT" badge, checkpoint list, sync status PENDING | User confirmed; sync queued |
| Confirmed (syncing) | "Đang đồng bộ..." indicator | Sync in progress |
| Confirmed (synced) | "HOAN_TAT" badge, "Đã đồng bộ" badge | Sync acknowledged |
| Confirmed (conflict) | HOAN_TAT giữ nguyên; báo xung đột, không có retry/resolve làm đổi dữ liệu | Same ID, different payload |
| Confirmed (final) | "HOAN_TAT" badge, button Về danh mục | Session completed and synced (or will retry) |

## 5. Interactions and navigation

| # | Element | User action | System response | Destination screen / result |
|---|---|---|---|---|
| 1 | Xác nhận | Tap | Kiểm tra Finish guard; lưu HOAN_TAT và immutable SessionSyncRecord trước khi báo hoàn tất | Confirmed hoặc completion failure |
| 2 | Quay lại | Tap | Quay về SCR-M02-001 để tiếp tục phiên | `SCR-M02-001` |
| 3 | Về danh mục | Tap | Quay về danh mục tuyến | `SCR-M01-001` |
| 4 | Thử đồng bộ lại | Tap | Gửi lại cùng business payload nếu PENDING; background retry vẫn tiếp tục đến ACK/conflict | Retry pending item |

## 6. Screen-level rules

| Rule ID | Rule | Related requirement |
|---|---|---|
| SR-SCR-M02-003-001 | Finish chỉ xuất hiện sau khi checkpoint với highest sequence đã visited | FR-M02-015 |
| SR-SCR-M02-003-002 | Hoàn tất khi xác nhận; không yêu cầu 100% checkpoint coverage | FR-M02-016, BR-M02-007 |
| SR-SCR-M02-003-003 | Sau xác nhận, session → HOAN_TAT; hiển thị HOAN_TAT badge và checkpoints đã ghé | FR-M02-016 |
| SR-SCR-M02-003-004 | Chỉ `HOAN_TAT` hoặc `BO_DO` sessions được sync | FR-M02-018, BR-M02-010 |
| SR-SCR-M02-003-005 | Sync retry: identical payload = success (idempotent); changed payload = conflict | FR-M02-018, BR-M02-011 |
| SR-SCR-M02-003-006 | Sync failure = PENDING; automatic retry cho đến khi acknowledged/conflict | FR-M02-018 |
| SR-SCR-M02-003-007 | Finish không bị blocked bởi network; sync có thể PENDING | BR-M02-010 |

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M02-015 | Finish enabled sau highest-sequence visit |
| FR-M02-016 | Hoàn tất khi xác nhận |
| FR-M02-018 | Frozen sync queue; retry success/conflict |
| FR-M02-017 | Session replacement context (nếu handoff mới đến) |

## 8. Responsive and accessibility notes

- Định hướng mobile-first: ưu tiên nội dung/action chính, wrap text/tags và stack panels theo chiều rộng thực tế; tránh chiều rộng cố định gây tràn ngang. 360px, 768px và 1280px là kích thước tham khảo để review, không phải hard breakpoint hoặc điều kiện bật/tắt tính năng.
- Review text dài vi/en, loading/empty/error, phóng to chữ, focus và thao tác một tay trên điện thoại. Bố cục cuối cùng cần prototype/usability review trước sign-off.
- Mục tiêu review accessibility: keyboard access, visible focus, semantic labels, error liên kết với field, status không chỉ biểu đạt bằng màu và reduced motion. Tham khảo WCAG 2.1 AA, touch target khoảng 44×44px và contrast 4.5:1 cho normal text; đây là định hướng cần kiểm chứng trên frontend, không phải tuyên bố đã đạt chuẩn.

## 9. Open questions

| ID | Question | Blocking | Status | Resolution |
|---|---|---|---|---|
| OQ-SCR-M02-003-001 | Sync retry strategy cụ thể (interval, max attempts)? | No | Open | Giữ immutable SessionSyncRecord PENDING và retry đến acknowledged/CONFLICT (FR-M02-018, spec-M02 §6.4); CONFLICT dừng retry. [NEEDS CLARIFICATION: scheduling/backoff cụ thể chưa có quyết định nguồn.] Không giới hạn ba lần rồi ngừng automatic retry. |
| OQ-SCR-M02-003-002 | Conflict state: user có cần thông báo đặc biệt không? | No | Confirmed | CONFLICT được thông báo riêng, dừng retry, không cho user sửa payload/sessionId hoặc retry như PENDING; terminal session giữ nguyên (BR-M02-010, BR-M02-011, spec-M02 §6.4). Presentation còn có thể review. |
| OQ-SCR-M02-003-003 | Kích thước trang tối thiểu | No | Proposed | Mobile-first, co giãn theo content; xem §8, chưa chốt minimum/breakpoints. |

## Completion checklist

- [x] Required behavioral controls and feedback are described in the inventory.
- [x] Each input has a validation rule or explicit `None`.
- [x] Behavioral success/failure states in this screen scope are described.
- [x] Navigation screen IDs and requirement references resolve; behavioral mappings follow canonical sources.
- [ ] Final layout, copy, assets and UX choices are signed off.
- [ ] Responsive/accessibility and real interactions are verified on the frontend.
