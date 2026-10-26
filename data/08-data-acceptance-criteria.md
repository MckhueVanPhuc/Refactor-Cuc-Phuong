# 08 — Data Acceptance Criteria (DAC)

**Status:** NOT STARTED — PENDING S4 REBASELINE  
**Current State:** Initial Skeleton for V2 Documentation Refactor  
**Authority:** Derived acceptance criteria catalog based on Canonical Specifications (Spec-M01, Spec-M02, Spec-M03) and S4 Logical Data Model.

---

## 1. Purpose and Authority

Tài liệu này là catalog chuẩn hóa các tiêu chí chấp nhận dữ liệu (Data Acceptance Criteria — DAC) xuyên suốt toàn bộ dự án Cúc Phương Quest (M01, M02, M03).

- **Authority & Hierarchy:** DAC là tài liệu dẫn xuất kiểm chứng (derived validation catalog). Nguồn sự thật cho business rules và contracts là ba Canonical Specifications (spec-M01.md, spec-M02.md, spec-M03.md). DAC không tự tạo requirement hoặc constraint mới.
- **Workflow Placement:** Theo M03_Documentation_Refactor_Runbook_v2.md (§7.3), DAC được hoàn tất sau khi S4 (Logical Data Model) hoàn tất, trước khi tiến hành review gate và Physical Schema (data/06-physical-schema.md).
- **Phạm vi hiện tại (V2 Skeleton):** File này được khởi tạo dưới dạng skeleton cấu trúc. Các tiêu chí cụ thể sẽ chỉ được trích xuất và đối chiếu trực tiếp từ canonical specs sau khi hoàn tất rebaseline Spec-M03 và đồng bộ S1–S4 trong nhiệm vụ P9. Không tự động suy diễn constraint từ database schema, migration, seed data hay code cũ.

---

## 2. Status Legend

Mỗi dòng tiêu chí trong Criteria Catalog sử dụng một trong các trạng thái sau theo Runbook §7.3.3:

| Trạng thái | Định nghĩa | Hành động yêu cầu |
| --- | --- | --- |
| SOURCE-BACKED | Tiêu chí đã có source section, FR hoặc BR rõ ràng trong Canonical Specs. | Kiểm tra tính nhất quán với S4 Logical Model. |
| TBD-HUMAN | Cần quyết định nghiệp vụ/sản phẩm từ con người; Canonical Specs hiện tại chưa quy định. | Phải ghi nhận thành open decision; không được đoán trước. |
| TECHNICAL-ONLY | Ràng buộc kỹ thuật phát sinh từ implementation/storage (nếu có, sau S4). | Phải đánh dấu rõ ràng, không coi là business rule. |
| N/A | Chiều kích (dimension) không áp dụng cho field hoặc entity này. | Không yêu cầu xử lý. |
| DEPRECATED | Quy tắc cũ đã bị bãi bỏ hoặc thay thế trong quá trình rebaseline. | Lưu vết lịch sử, không dùng cho baseline mới. |

---

## 3. Criteria Catalog

*Trạng thái: Trống — Đang chờ hoàn tất rebaseline Spec-M03 và S4 Logical Data Model.*

Cấu trúc các cột chuẩn theo Runbook §7.3.4:

| DAC ID | Module | Entity / Contract | Field path / Rule | Logical type | Presence | Null / absent | Blank / whitespace | Allowed values / format | Min / Max | Min length / Max length | Unit / precision | Uniqueness | Cross-field rule | Normalization | Error / reject behavior | Applies at | Source | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| *TBD* | *TBD* | *TBD* | *TBD* | *TBD* | *TBD* | *TBD* | *TBD* | *TBD* | *TBD* | *TBD* | *TBD* | *TBD* | *TBD* | *TBD* | *TBD* | *TBD* | *TBD* | NOT STARTED | Đang chờ P9 |

---

## 4. Open Human Decisions

Danh mục các quyết định còn thiếu trong baseline cũ cần nhóm sản phẩm / con người phê duyệt trước khi chốt DAC (theo Runbook §7.3.6):

| Nhóm | Vấn đề / Quyết định cần xác nhận | Trạng thái |
| --- | --- | --- |
| Stable String IDs | Max length, allowed character set/pattern, case-sensitivity/canonical casing cho outeId, checkpointId, qrIdentifier, userId, uditId, entityId. | TBD-HUMAN |
| Localized text | Max length cho 
ame.vi/en, description.vi/en, safetyWarning.vi/en; chính sách trim/whitespace, newline/markdown. | TBD-HUMAN |
| Checkpoint text | Max length cho checkpointName, installationLabel, eplacementReason, eviewReason, introductionText. | TBD-HUMAN |
| Numeric route fields | Upper bound và precision cho distanceKm, durationMin. | TBD-HUMAN |
| Version/sequence | Giới hạn số học cụ thể cho contentVersion, evision, concurrencyRevision, sequence. | TBD-HUMAN |
| Collections | Số lượng tối đa checkpoint/route, QR/checkpoint, static images, audio/video resource, visits/session, array length tags. | TBD-HUMAN |
| Email & Account | Max length, normalization rule ngoài "normalized + unique", Unicode/IDN policy. | TBD-HUMAN |
| Media / Resource | Max file size, allowed MIME types, image dimensions, audio/video duration, upload count. | TBD-HUMAN |
| Report Query | Giới hạn selectable date span, maximum rows/items, pagination limits. | TBD-HUMAN |
| Admin Reasons | Max length cho close/reopen/reject/replacement reason. | TBD-HUMAN |

---

## 5. Boundary Coverage

Theo dõi phạm vi bao phủ tiêu chuẩn dữ liệu qua các ranh giới:

| Ranh giới | Phạm vi áp dụng | Coverage Status |
| --- | --- | --- |
| Producer M03 → Consumer M01 | Published Route, JourneySnapshot | Pending S4 Rebaseline |
| Producer M01 → Consumer M02 | LanguagePreference, SelectedRouteContext v2, OfflinePackage | Pending S4 Rebaseline |
| Producer M03 → Consumer M02 | LiveStationContent, QR lookup | Pending S4 Rebaseline |
| Producer M02 → Consumer M03 | SessionSyncRecord → SessionRecord | Pending S4 Rebaseline |
| Internal M03 | AdminAccount, CheckpointContent revision stream, AuditRecord | Pending S4 Rebaseline |

---

## 6. Change History

| Phiên bản | Ngày | Tác giả / Tác vụ | Nội dung thay đổi |
| --- | --- | --- | --- |
| 0.1.0 | 2026-10-26 | Documentation Migration to V2 | Khởi tạo skeleton cấu trúc DAC; ghi nhận trạng thái NOT STARTED — PENDING S4 REBASELINE theo Runbook §7.3. |