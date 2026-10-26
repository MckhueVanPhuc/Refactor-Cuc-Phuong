# Screen Spec: Quản lý tài nguyên offline

| Field | Value |
|---|---|
| Screen ID | `SCR-M01-004` |
| Screen name | Quản lý tài nguyên offline |
| Module | `M01` |
| Actor | Visitor |
| Priority | Should* |
| Mockup | `screens/M01/mockups/SCR-M01-004-offline.png` |
| Status | Draft |

*Offline preparation/package là Should theo MVP Scope §3.4, nhưng phải nâng lên Must nếu increment phát hành có checkpoint OFFLINE_REQUIRED.

Nguồn hành vi/contract: [Spec M01](../../../docs/spec/spec-M01.md). Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu; bố cục/visual direction tham khảo [DESIGN.md](../../../DESIGN.md). Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline.

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Trong §9: **Confirmed** có nguồn baseline, **Proposed** chờ UX review, **Open** có clarification chưa được nguồn xác nhận. Draft không đồng nghĩa frontend/prototype đã được nghiệm thu.

## 1. Purpose

**Shown when:** Visitor chọn "Tài nguyên offline" từ SCR-M01-001 hoặc SCR-M01-003.

**The user leaves when:** Quay lại danh mục/chi tiết, xóa package (với confirmation), hoặc mở SCR-M01-003 để Start.

## 2. Mockup

Mockup: `screens/M01/mockups/SCR-M01-004-offline.png`. Đây là target asset tham khảo; cần kiểm tra asset và design sign-off, không dùng ảnh mockup để suy ngược business rule.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M01-004-01 | Language selector | Header control | `vi` / `en`; đọc từ LanguagePreference | Yes | Chỉ chấp nhận `vi` hoặc `en` |
| 2 | E-SCR-M01-004-02 | Screen title | Header text | "Quản lý tài nguyên offline" / "Offline Resources" | Yes | None |
| 3 | E-SCR-M01-004-03 | Package list | List | Danh sách tất cả packages (routeId, contentVersion, status, versionStatus) | Yes | None |
| 4 | E-SCR-M01-004-04 | Package card | List item | routeId, version, readiness/freshness; tên tuyến chỉ từ Published Route/local view riêng nếu có | Yes | Manifest không chứa route name; thiếu metadata thì dùng routeId |
| 5 | E-SCR-M01-004-05 | Status badge | Badge | CHUA_TAI (xám), DANG_TAI (vàng), SAN_SANG (xanh), CHUA_HOAN_TAT (đỏ) | Yes | None |
| 6 | E-SCR-M01-004-06 | Version info | Text | "Version X" và "CURRENT" / "OUTDATED" | Conditional | Chỉ khi SAN_SANG |
| 7 | E-SCR-M01-004-07 | Downloaded at | Text | "Đã tải: [datetime]" nếu có | Conditional | Chỉ khi SAN_SANG có downloadedAt |
| 8 | E-SCR-M01-004-08 | Action: Tải | Button | Bắt đầu download/update package; hiển thị khi CHUA_TAI, CHUA_HOAN_TAT, hoặc SAN_SANG + OUTDATED | Conditional | Cần current source truy cập được; không có operation cùng route đang chạy |
| 9 | E-SCR-M01-004-09 | Action: Xóa | Button | Xóa local package; hiển thị khi có package | Conditional | Yêu cầu confirmation; không chạy song song operation khác cùng route |
| 10 | E-SCR-M01-004-10 | Action: Xem chi tiết | List item tap | Mở SCR-M01-003 cho route đó | Yes | None |
| 11 | E-SCR-M01-004-12 | Action: Quay lại | Button | Trở về SCR-M01-001 | Yes | None |
| 13 | E-SCR-M01-004-13 | Download progress | Progress indicator | Tiến trình candidate riêng; % khi đo được | Conditional | Không ẩn hoặc đổi trạng thái active SAN_SANG trong lúc update |
| 14 | E-SCR-M01-004-14 | Storage error banner | Banner | "Lỗi lưu trữ" khi storage thất bại | Conditional | Hiển thị khi có lỗi |
| 15 | E-SCR-M01-004-15 | Update available badge | Badge | "Có bản mới" cho SAN_SANG + OUTDATED | Conditional | Chỉ khi OUTDATED |
| 16 | E-SCR-M01-004-16 | Delete confirmation dialog | Dialog | "Bạn có chắc muốn xóa gói dữ liệu này?" kèm Cancel/Confirm | Conditional | Hiển thị trước khi xóa |
| 17 | E-SCR-M01-004-17 | Action: Làm mới / Thử lại | Button | Đọc lại local package list; source freshness chỉ khi truy cập được | Conditional | Không xóa gói cũ khi source/storage lỗi |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| Default | Danh sách packages đầy đủ | Packages loaded |
| Empty | "Chưa có gói dữ liệu nào" khi không có package nào được tải | Không có persisted package |
| Loading | Spinner tại package list | Đang load packages |
| CHUA_TAI | Package card với nút "Tải"; status badge xám | Không có package cho route này |
| DANG_TAI | Progress bar với %; nút "Tải" disabled | Download in progress |
| SAN_SANG + CURRENT | Badge xanh "Sẵn sàng"; "CURRENT"; nút Xóa | Package complete and current |
| SAN_SANG + OUTDATED | Badge xanh + "OUTDATED" + "Có bản mới"; nút "Tải" để update | Package ready but new version available |
| CHUA_HOAN_TAT | Badge đỏ "Tải thất bại"; nút "Tải" để retry | Download failed without old package |
| Updating with old ready package | SAN_SANG + OUTDATED vẫn hiển thị và dùng được; candidate progress riêng | Update in progress |
| Update failure with old ready package | Giữ SAN_SANG + OUTDATED; báo lỗi update, có retry | Candidate failed |
| Source unavailable | Giữ local packages; báo không kiểm tra được freshness, không claim CURRENT mới | Source request fails |
| Delete failure | Gói còn lại giữ nguyên; báo lỗi và cho thử lại | Local delete fails |
| Storage error | Banner "Lỗi lưu trữ" | Browser storage write fails |
| Delete confirmation | Dialog xác nhận xóa | Visitor tap nút Xóa |

## 5. Interactions and navigation

| # | Element | User action | System response | Destination screen / result |
|---|---|---|---|---|
| 1 | Language selector | Tap / change | Cập nhật LanguagePreference, chuyển ngôn ngữ UI | Stays |
| 2 | Package card | Tap | Mở chi tiết tuyến để xem hoặc Start | `SCR-M01-003` |
| 3 | Tải | Tap | Chuẩn bị candidate riêng; chỉ publish khi hoàn chỉnh; giữ active ready package cũ | Update package card |
| 4 | Xóa | Tap | Hiện confirmation dialog | Show confirmation |
| 5 | Confirm delete | Tap confirm | Xóa package; giữ nguyên SelectedRouteContext; chuyển state CHUA_TAI | Update package card |
| 6 | Cancel delete | Tap cancel | Đóng dialog | Stays |
| 7 | Quay lại | Tap | Trở về SCR-M01-001 | `SCR-M01-001` |
| 8 | Làm mới / Thử lại | Tap; pull-to-refresh nếu được chọn | Đọc local list; mở packaged route kích hoạt lazy version check khi source truy cập được | Reload list / `SCR-M01-003` |

## 6. Screen-level rules

| Rule ID | Rule | Related requirement |
|---|---|---|
| SR-SCR-M01-004-001 | Chỉ MỘT package operation trên mỗi route tại một thời điểm; MVP không có Cancel download action | FR-M01-009; spec-M01 §4.4 |
| SR-SCR-M01-004-002 | Xóa package giữ nguyên SelectedRouteContext và không xóa session/play data | FR-M01-009, BR-M01-010 |
| SR-SCR-M01-004-003 | Update failure giữ bản ready cũ; candidate mới bị discard | BR-M01-006 |
| SR-SCR-M01-004-004 | Success update chuyển active package sang candidate mới | FR-M01-010 |
| SR-SCR-M01-004-005 | Storage failure discard candidate và giữ existing ready package | FR-M01-008 |
| SR-SCR-M01-004-006 | Retry chuẩn bị candidate hợp lệ; không expose staging/partial resource như ready package | FR-M01-007, FR-M01-008 |
| SR-SCR-M01-004-007 | M01 không phải trình đọc nội dung checkpoint; chỉ hiển thị status/version | FN-M01-005 |

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M01-001 | Control M01 cập nhật LanguagePreference; không đổi package state |
| FR-M01-007 | Download full manifest và offline resource subset |
| FR-M01-008 | Validate đầy đủ và atomic publish |
| FR-M01-009 | View/download/delete; confirmation và serialize operation |
| FR-M01-010 | Lazy update giữ active package cũ |
| FR-M01-012 | Context v2 không bị ảnh hưởng bởi xóa package |
| FR-M01-013 | Chỉ active SAN_SANG package được expose cho M02; progress candidate là UI state riêng |

## 8. Responsive and accessibility notes

- Định hướng mobile-first: ưu tiên nội dung/action chính, wrap text/tags và stack panels theo chiều rộng thực tế; tránh chiều rộng cố định gây tràn ngang. 360px, 768px và 1280px là kích thước tham khảo để review, không phải hard breakpoint hoặc điều kiện bật/tắt tính năng.
- Review text dài vi/en, loading/empty/error, phóng to chữ, focus và thao tác một tay trên điện thoại. Bố cục cuối cùng cần prototype/usability review trước sign-off.
- Mục tiêu review accessibility: keyboard access, visible focus, semantic labels, error liên kết với field, status không chỉ biểu đạt bằng màu và reduced motion. Tham khảo WCAG 2.1 AA, touch target khoảng 44×44px và contrast 4.5:1 cho normal text; đây là định hướng cần kiểm chứng trên frontend, không phải tuyên bố đã đạt chuẩn.

## 9. Open questions

| ID | Question | Blocking | Status | Resolution |
|---|---|---|---|---|
| OQ-SCR-M01-004-001 | Cơ chế storage quota và cleanup policy là gì? | No | Open | Package structured data và image bytes thuộc IndexedDB theo [tech-stack.md §4](../../../docs/architecture/tech-stack.md#4-pwa-and-offline-stack). [NEEDS CLARIFICATION: quota warning threshold và browser-local cleanup policy chưa có quyết định nguồn.] Không chốt ngưỡng 20% hoặc dùng Cache Storage để lưu package data. |
| OQ-SCR-M01-004-002 | UI cho delete confirmation (dialog hay bottom sheet)? | No | Proposed | Đề xuất modal hoặc bottom sheet có package identity và Confirm/Cancel; explicit delete confirmation là baseline FR-M01-009. |
| OQ-SCR-M01-004-003 | Retry strategy cho failed downloads | No | Proposed | Đề xuất nút Thử lại sau download failure; auto-retry/timing chưa chốt. Giữ old ready package, chỉ một operation mỗi route, không expose partial candidate (FR-M01-008, FR-M01-009, FR-M01-010). |
| OQ-SCR-M01-004-004 | Kích thước trang tối thiểu | No | Proposed | Mobile-first, co giãn theo content; xem §8, chưa chốt minimum/breakpoints. |

## Completion checklist

- [x] Required behavioral controls and feedback are described in the inventory.
- [x] Each input has a validation rule or explicit `None`.
- [x] Behavioral success/failure states in this screen scope are described.
- [x] Navigation screen IDs and requirement references resolve; behavioral mappings follow canonical sources.
- [ ] Final layout, copy, assets and UX choices are signed off.
- [ ] Responsive/accessibility and real interactions are verified on the frontend.
