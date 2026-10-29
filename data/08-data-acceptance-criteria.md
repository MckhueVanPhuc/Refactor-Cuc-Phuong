# 08 — Data Acceptance Criteria (DAC)

**Status:** COMPLETE (V2) — 0 TBD-HUMAN open; T1–T8 all resolved (§4)
**Current State:** V2 catalog rebuilt from Spec M01 v3.2, Spec M02 v3.3, Spec M03 v3.7 (incl. clarification 2) and S4 V2 (2026-10-28), updated with M03 v3.7 clarification 3 (limits T5–T7, `userId` uniqueness) Cập nhật M03 v3.7 clarification 4 (danh mục thông báo, `routeName` của RPT-02, đăng xuất): DAC-M03-068, 085, 086 bổ sung hành vi/thông báo; không đổi số tiêu chí (118).
**Authority:** Derived acceptance criteria catalog based on Canonical Specifications (Spec-M01, Spec-M02, Spec-M03) and S4 Logical Data Model.

---

## 1. Purpose and Authority

Tài liệu này là catalog chuẩn hóa các tiêu chí chấp nhận dữ liệu (Data Acceptance Criteria — DAC) xuyên suốt toàn bộ dự án Cúc Phương Quest (M01, M02, M03).

- **Authority & Hierarchy:** DAC là tài liệu dẫn xuất kiểm chứng (derived validation catalog). Nguồn sự thật cho business rules và contracts là ba Canonical Specifications ([spec-M01.md](../docs/spec/spec-M01.md), [spec-M02.md](../docs/spec/spec-M02.md), [spec-M03.md](../docs/spec/spec-M03.md)). DAC không tự tạo requirement hoặc constraint mới.
- **Workflow Placement:** Theo M03_Documentation_Refactor_Runbook_v2.md (§7.3), DAC được hoàn tất sau khi S4 ([Logical Data Model](04-data-model.md)) hoàn tất, trước khi tiến hành review gate và Physical Schema ([06-physical-schema.md](06-physical-schema.md)).
- **Phạm vi hiện tại (V2):** Mỗi tiêu chí trỏ tới section/ID của spec và tới field path của S4. Field path dùng đúng tên trong S4; với Revision, `content.*` là nội dung theo `subjectType`. Một số dòng là contract/projection/report không có trong S4 (Published Route, Live QR lookup, report input/output, RecommendationContext); các dòng này ghi rõ "not an S4 path". Không suy diễn constraint từ database schema, migration, seed data hay code cũ.
- **Hằng số cấu hình:** Các giới hạn số của M03 §5.3 được ghi bằng tên hằng số kèm giá trị hiện tại trong ngoặc. Spec gọi chúng là provisional (cần kiểm chứng trên giao diện và thiết bị thật); DAC vẫn coi chúng là `SOURCE-BACKED` và ghi chú "Provisional constant". Khi spec đổi giá trị, DAC phải sync lại.

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

Trong từng ô, `N/A` nghĩa là chiều kích đó không áp dụng hoặc spec không đặt giới hạn cho nó; `TBD-HUMAN` trong một ô nghĩa là giá trị đó còn chờ quyết định.

---

## 3. Criteria Catalog

118 tiêu chí: M01 = 18, M02 = 11, M03 = 89; `SOURCE-BACKED` = 118, `TBD-HUMAN` = 0; 9 dòng thuộc contract/projection/report không có trong S4 (DAC-M03-081–086, DAC-M01-017, DAC-M01-018, DAC-M02-011). Không có dòng `TECHNICAL-ONLY` hoặc `DEPRECATED`.

Cấu trúc các cột chuẩn theo Runbook §7.3.4:

| DAC ID | Module | Entity / Contract | Field path / Rule | Logical type | Presence | Null / absent | Blank / whitespace | Allowed values / format | Min / Max | Min length / Max length | Unit / precision | Uniqueness | Cross-field rule | Normalization | Error / reject behavior | Applies at | Source | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DAC-M03-001 | M03 | Route, Checkpoint, Revision, AuditRecord | `Route.routeId`, `Checkpoint.checkpointId`, `Revision.revisionId`, `AuditRecord.auditId` | String | Required | Never absent | N/A | Opaque system-generated identifier; never accepted as input | N/A | N/A | N/A | Unique; never reused, even after discard/archive/revoke | N/A | Immutable stable identity | N/A | Creation | M03 BR-M03-B01, BR-M03-B03; §5.1; §6.4 | SOURCE-BACKED | Boundary: identity/uniqueness. Max length/pattern: N/A (not an input value). |
| DAC-M03-002 | M03 | Media | `mediaId` | UUID | Required | Never absent | N/A | UUID; system-generated | N/A | N/A | N/A | Unique | N/A | Immutable stable identity | N/A | Upload | M03 BR-M03-B01; §6.3 | SOURCE-BACKED | Boundary: identity/uniqueness. |
| DAC-M03-003 | M03 | QRCode | `qrIdentifier` | String | Required | Never absent | N/A | Random, unguessable, URL-safe alphanumeric; no meaning | N/A | Min 16 / Max: see DAC-M03-004 | N/A | Unique system-wide; never reused | Last path segment of `{QR_PUBLIC_BASE_URL}/q/{qrIdentifier}` | Immutable; collision silently regenerated | N/A | First save of the visit point form | M03 BR-M03-B02, BR-M03-B03, BR-M03-B04, BR-M03-E15; §6.2 | SOURCE-BACKED | Boundary: identity/uniqueness, string length (min). |
| DAC-M03-004 | M03 | QRCode | `qrIdentifier` | String | Required | N/A | N/A | Characters `A–Z`, `a–z`, `0–9`; case-sensitive | N/A | Max N/A (system-generated) | N/A | N/A | N/A | N/A | N/A | Creation | M03 BR-M03-B02 (v3.7 clarification 2) | SOURCE-BACKED | Former open decision T4, resolved. Boundary: identity (case-sensitive comparison). |
| DAC-M03-005 | M03 | Route | `status` | Enum | Required | Never absent | N/A | `NHAP`, `HOAT_DONG`, `TAM_DONG`, `LUU_TRU` | N/A | N/A | N/A | N/A | Transitions: NHAP→HOAT_DONG (first publication); NHAP→LUU_TRU (discard); HOAT_DONG→TAM_DONG (close/auto); TAM_DONG→HOAT_DONG and TAM_DONG→LUU_TRU (Reviewer). Never reopens automatically; LUU_TRU terminal and read-only | N/A | Blocked operation states the reason (BR-M03-L07) | Lifecycle operations | M03 BR-M03-C01, BR-M03-H01–H03, BR-M03-H07, BR-M03-H09; §6.4 | SOURCE-BACKED | Boundary: enum. No `CHO_DUYET` (BR-M03-A05). |
| DAC-M03-006 | M03 | Route | `activeContentVersion` | Integer | Conditional | Absent while never published; required once published | N/A | N/A | N/A | N/A | N/A | N/A | References the highest `DA_CONG_BO` JourneySnapshot of the same Route; switches with the snapshot | N/A | N/A | Publication / snapshot switch | M03 §6.1; §6.4; BR-M03-G06 | SOURCE-BACKED | Boundary: conditional presence. |
| DAC-M03-007 | M03 | Route | `closureSource`, `closureReason`, `closedAt`, `closedByUserId` | Enum / String / DateTime / String | Conditional | Required while `TAM_DONG`; absent otherwise not stated | N/A | `closureSource`: `MANUAL`, `AUTO_NO_ACTIVE_CHECKPOINT` | N/A | N/A | N/A | N/A | Automatic closure: `closedByUserId` is the user whose checkpoint closure triggered it | `closedAt` UTC | N/A | Close | M03 §6.1; BR-M03-H01, BR-M03-H02 | SOURCE-BACKED | `closureReason` is internal and never exposed to visitors. Max length: DAC-M03-008. Boundary: conditional presence. |
| DAC-M03-008 | M03 | Route, Checkpoint, QRCode, AuditRecord | `Route.closureReason`, `Checkpoint.closureReason`, `QRCode.statusReason`, `AuditRecord.reason` | String | N/A | N/A | Non-empty after trimming whenever required or present | N/A | N/A | Max `NOTE_MAX_CHARS` (300) | N/A | N/A | N/A | Counted after trimming leading/trailing whitespace (M03 §5.3) | N/A | Close, reopen, archive, revoke, discard | M03 §5.3; §6.1; §6.2; §6.4; BR-M03-F08 (v3.7 clarification 2) | SOURCE-BACKED | Former open decision T1, resolved. Line-break policy not stated for reasons. Provisional constant. Boundary: string length. |
| DAC-M03-009 | M03 | Checkpoint | `status` | Enum | Required | Never absent | N/A | `NHAP`, `HOAT_DONG`, `TAM_DONG`, `LUU_TRU` | N/A | N/A | N/A | N/A | Transitions: NHAP→HOAT_DONG (own publication); NHAP→LUU_TRU (discard, reason required); HOAT_DONG→TAM_DONG (close); TAM_DONG→HOAT_DONG (Reviewer reopen); TAM_DONG→LUU_TRU (Reviewer archive, only when no non-archived route lists it) | N/A | Archive blocked with MSG-CHECKPOINT-IN-USE naming the routes | Lifecycle operations | M03 BR-M03-D05, BR-M03-D09, BR-M03-D10, BR-M03-H01, BR-M03-H06; §6.4 | SOURCE-BACKED | Boundary: enum. |
| DAC-M03-010 | M03 | Checkpoint | `closureReason`, `closedAt`, `closedByUserId` | String / DateTime / String | Conditional | Required while `TAM_DONG` | N/A | N/A | N/A | N/A | N/A | N/A | N/A | `closedAt` UTC | N/A | Close | M03 §6.2; BR-M03-H01 | SOURCE-BACKED | Internal. Max length of `closureReason`: DAC-M03-008. Boundary: conditional presence. |
| DAC-M03-011 | M03 | Checkpoint, QRCode | `Checkpoint.locationNote`, `QRCode.installationLabel` | String | Optional | May be absent | N/A | N/A | N/A | Max `NOTE_MAX_CHARS` (300) | N/A | N/A | N/A | Counted after trimming leading/trailing whitespace (M03 §5.3) | Text longer than the limit blocks saving | Save (with the form) | M03 §5.3; §6.2; BR-M03-D01, BR-M03-E02, BR-M03-F11, BR-M03-L01 | SOURCE-BACKED | Internal; never public. Provisional constant (M03 §5.3). Boundary: string length. |
| DAC-M03-012 | M03 | QRCode | `checkpointId` | String | Required | Never absent | N/A | N/A | N/A | N/A | N/A | N/A | Belongs to exactly one Checkpoint and never changes; created only for a checkpoint with a saved connectivity mode | N/A | Before a mode is saved, adding a visit point shows MSG-MODE-REQUIRED-FIRST | Creation | M03 §6.2; §6.4; BR-M03-E12, BR-M03-E15 | SOURCE-BACKED | Boundary: cross-field. |
| DAC-M03-013 | M03 | QRCode | `status` | Enum | Required | Never absent | N/A | `NHAP`, `HOAT_DONG`, `THU_HOI` | N/A | N/A | N/A | N/A | NHAP at first save; NHAP→HOAT_DONG only by publication of a ready object; NHAP→THU_HOI (discard); HOAT_DONG→THU_HOI (revoke, or archive of its checkpoint). THU_HOI terminal | N/A | N/A | Lifecycle operations | M03 §6.2; §6.4; BR-M03-E05, BR-M03-E09, BR-M03-E10, BR-M03-D10 | SOURCE-BACKED | Boundary: enum. `DA_THAY` removed (BR-M03-E08 retired). |
| DAC-M03-014 | M03 | QRCode | `statusReason` | String | Conditional | Required for `THU_HOI` by revoke; optional for a discarded draft | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | Revoke / discard | M03 §6.2; BR-M03-E09, BR-M03-E10 | SOURCE-BACKED | Max length: DAC-M03-008. Boundary: conditional presence. |
| DAC-M03-015 | M03 | Checkpoint, QRCode | Active checkpoint keeps an active QR (`Checkpoint.status`, `QRCode.status`) | Rule | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | A `HOAT_DONG` checkpoint always has at least one `HOAT_DONG` QR object | N/A | Any operation that would violate it (e.g. revoking the last active QR) is blocked with an explanation | Revoke, publication | M03 BR-M03-E09, BR-M03-E11; §6.4 | SOURCE-BACKED | Boundary: cross-field. |
| DAC-M03-016 | M03 | Route, Checkpoint, QRCode, Media, Revision, AdminAccount | `Route.concurrencyRevision`, `Checkpoint.concurrencyRevision`, `QRCode.concurrencyRevision`, `Media.concurrencyRevision`, `Revision.concurrencyRevision`, `AdminAccount.concurrencyRevision` | Integer | Required | N/A | N/A | N/A | N/A (no source range) | N/A | N/A | N/A | Submitted value must equal the stored value | N/A | Stale write rejected, nothing merged; stale message names who changed the item and when (BR-M03-L05); typed text kept | Every mutation and review confirmation | M03 BR-M03-F02, BR-M03-F06; §6.1–§6.4 | SOURCE-BACKED | Boundary: identity (equal / stale). |
| DAC-M03-017 | M03 | Route, Checkpoint, QRCode, Media, Revision, AdminAccount, AuditRecord, JourneySnapshot, SessionRecord | `Route.createdAt`, `Route.updatedAt`, `Checkpoint.createdAt`, `Checkpoint.updatedAt`, `QRCode.createdAt`, `QRCode.updatedAt`, `Media.createdAt`, `Media.usageRightsConfirmedAt`, `Revision.createdAt`, `Revision.lastEditedAt`, `Revision.publishedAt`, `Revision.content.fieldVerifiedAt`, `AdminAccount.createdAt`, `AdminAccount.updatedAt`, `AuditRecord.occurredAt`, `JourneySnapshot.publishedAt`, `SessionRecord.ingestedAt` | DateTime | Per S4 | N/A | N/A | DateTime | N/A | N/A | N/A | N/A | N/A | UTC | N/A | Persistence | M03 §5.1 ("All DateTime values are UTC"); §6.1–§6.4 | SOURCE-BACKED | Boundary: date/time (UTC format). |
| DAC-M03-018 | M03 | Revision | `subjectType`, `subjectId`, `content` | Enum / String / Object | Required | N/A | N/A | `subjectType`: `ROUTE`, `CHECKPOINT`, `QRCODE` | N/A | N/A | N/A | N/A | `subjectId` is the `routeId`, `checkpointId` or `qrIdentifier` matching `subjectType`; `subjectType` determines the shape of `content`; `content` is immutable once `PHAT_HANH` | N/A | N/A | Creation | M03 §6.3 | SOURCE-BACKED | Boundary: enum, cross-field. |
| DAC-M03-019 | M03 | Revision | `revisionNumber` | Integer | Required | N/A | N/A | N/A | Min 1 (starts at 1 per subject); +1 per new revision | N/A | N/A | `(subjectType, subjectId, revisionNumber)` unique; never reused | N/A | N/A | N/A | Creation | M03 §6.3; §6.4 | SOURCE-BACKED | Boundary: numeric (min), identity/uniqueness. |
| DAC-M03-020 | M03 | Revision | `status` | Enum | Required | Never absent | N/A | `NHAP`, `PHAT_HANH`, `LUU_TRU`, `DA_BO` | N/A | N/A | N/A | At most one `NHAP` and at most one `PHAT_HANH` per subject | NHAP→PHAT_HANH (previous PHAT_HANH becomes LUU_TRU in the same operation); NHAP→DA_BO (discard); PHAT_HANH→LUU_TRU (superseded); `content` immutable once PHAT_HANH | N/A | N/A | Save, publication, discard | M03 §6.3; §6.4; BR-M03-F06, BR-M03-F10 | SOURCE-BACKED | Boundary: enum. |
| DAC-M03-021 | M03 | Revision | `basedOnRevisionNumber` | Integer | Optional | Absent for a first draft | N/A | N/A | N/A | N/A | N/A | N/A | The published revision the draft was copied from; for a restore, the earlier revision restored. Restore blocked while a pending draft exists, and refused (MSG-RESTORE-BLOCKED) when the copied content breaks a current limit | N/A | N/A | Edit / restore | M03 §6.3; BR-M03-F07 | SOURCE-BACKED | Boundary: conditional presence. |
| DAC-M03-022 | M03 | Revision | `publishedByUserId`, `publishedAt`, `selfPublished` | String / DateTime / Boolean | Conditional | Required once published | N/A | N/A | N/A | N/A | N/A | N/A | `selfPublished = true` when the publisher equals `lastEditedByUserId` | `publishedAt` UTC | N/A | Publication | M03 §6.3; BR-M03-F08 | SOURCE-BACKED | Boundary: conditional presence. |
| DAC-M03-023 | M03 | Revision (ROUTE) | `content.name.vi`, `content.name.en` | String | Conditional | May be absent in a draft; required for publication | Non-empty after trimming at publication | N/A | N/A | Max `NAME_MAX_CHARS` (100) | N/A | N/A | Both languages required for publication | Counted after trimming leading/trailing whitespace (M03 §5.3) | Over the limit blocks saving; missing value blocks publication only | Save (limit) / publication (presence) | M03 §5.3; §6.1.1; BR-M03-C02, BR-M03-C04, BR-M03-L01; §5.1 Published Route | SOURCE-BACKED | Provisional constant. Boundary: string length, conditional presence. |
| DAC-M03-024 | M03 | Revision (ROUTE) | `content.shortDescription.vi`, `content.shortDescription.en` | String | Conditional | May be absent in a draft; required for publication | Non-empty after trimming at publication | N/A | N/A | Max `ROUTE_SHORT_DESC_MAX_CHARS` (160) | N/A | N/A | Both languages required for publication | Counted after trimming leading/trailing whitespace (M03 §5.3) | Over the limit blocks saving; missing value blocks publication only | Save (limit) / publication (presence) | M03 §5.3; §6.1.1; BR-M03-C02, BR-M03-C04, BR-M03-L01; §5.1 Published Route | SOURCE-BACKED | Provisional constant. Boundary: string length, conditional presence. |
| DAC-M03-025 | M03 | Revision (ROUTE) | `content.description.vi`, `content.description.en` | String | Conditional | May be absent in a draft; required for publication | Non-empty after trimming at publication | N/A | N/A | Max `ROUTE_DESC_MAX_CHARS` (2000) | N/A | N/A | Both languages required for publication | Counted after trimming leading/trailing whitespace (M03 §5.3) | Over the limit blocks saving; missing value blocks publication only | Save (limit) / publication (presence) | M03 §5.3; §6.1.1; BR-M03-C02, BR-M03-C04, BR-M03-L01; §5.1 Published Route | SOURCE-BACKED | Provisional constant. Boundary: string length, conditional presence. |
| DAC-M03-026 | M03 | Revision (ROUTE) | `content.startingPoint.vi`, `content.startingPoint.en` | String | Conditional | May be absent in a draft; required for publication | Non-empty after trimming at publication | N/A | N/A | Max `ROUTE_START_MAX_CHARS` (500) | N/A | N/A | Both languages required for publication | Counted after trimming leading/trailing whitespace (M03 §5.3) | Over the limit blocks saving; missing value blocks publication only | Save (limit) / publication (presence) | M03 §5.3; §6.1.1; BR-M03-C02, BR-M03-C04, BR-M03-L01; §5.1 Published Route | SOURCE-BACKED | Provisional constant. Boundary: string length, conditional presence. |
| DAC-M03-027 | M03 | Revision (ROUTE) | `content.participationRequirements.vi`, `content.participationRequirements.en` | String | Optional | Both absent allowed | N/A | N/A | N/A | Max `ROUTE_PARTICIPATION_MAX_CHARS` (300) | N/A | N/A | Both-or-none: complete in both languages or empty in both | Counted after trimming leading/trailing whitespace (M03 §5.3) | Over the limit blocks saving; one language only blocks publication with a message under the field | Save (limit) / publication (both-or-none) | M03 §5.3; §6.1.1; BR-M03-C04, BR-M03-C06, BR-M03-L01 | SOURCE-BACKED | Provisional constant. Boundary: string length, cross-field. |
| DAC-M03-028 | M03 | Revision (ROUTE) | `content.preparation.vi`, `content.preparation.en` | String | Optional | Both absent allowed | N/A | N/A | N/A | Max `ROUTE_PREPARATION_MAX_CHARS` (500) | N/A | N/A | Both-or-none: complete in both languages or empty in both | Counted after trimming leading/trailing whitespace (M03 §5.3) | Over the limit blocks saving; one language only blocks publication with a message under the field | Save (limit) / publication (both-or-none) | M03 §5.3; §6.1.1; BR-M03-C04, BR-M03-C06, BR-M03-L01 | SOURCE-BACKED | Provisional constant. Boundary: string length, cross-field. |
| DAC-M03-029 | M03 | Revision (ROUTE) | `content.bestTime.vi`, `content.bestTime.en` | String | Optional | Both absent allowed | N/A | N/A | N/A | Max `ROUTE_BEST_TIME_MAX_CHARS` (200) | N/A | N/A | Both-or-none: complete in both languages or empty in both | Counted after trimming leading/trailing whitespace (M03 §5.3) | Over the limit blocks saving; one language only blocks publication with a message under the field | Save (limit) / publication (both-or-none) | M03 §5.3; §6.1.1; BR-M03-C04, BR-M03-C06, BR-M03-L01 | SOURCE-BACKED | Provisional constant. Boundary: string length, cross-field. |
| DAC-M03-030 | M03 | Revision (ROUTE) | `content.safetyWarning.vi`, `content.safetyWarning.en` | String | Optional | Both absent allowed | N/A | N/A | N/A | Max `ROUTE_SAFETY_WARNING_MAX_CHARS` (500) | N/A | N/A | Both-or-none: complete in both languages or empty in both | Counted after trimming leading/trailing whitespace (M03 §5.3) | Over the limit blocks saving; one language only blocks publication with a message under the field | Save (limit) / publication (both-or-none) | M03 §5.3; §6.1.1; BR-M03-C04, BR-M03-C06, BR-M03-L01 | SOURCE-BACKED | Provisional constant. Boundary: string length, cross-field. |
| DAC-M03-031 | M03 | Revision (ROUTE) | `content.noSafetyWarningConfirmed` | Boolean | Required | N/A | N/A | `true` / `false`; default `false` | N/A | N/A | N/A | N/A | Must be `true` for publication when `content.safetyWarning` is absent; reset to `false` whenever a safety warning is entered; copied into later drafts | N/A | Publication blocked until ticked | Publication | M03 §6.1.1; BR-M03-C04, BR-M03-C09 | SOURCE-BACKED | Boundary: cross-field. |
| DAC-M03-032 | M03 | Revision (ROUTE) | `content.distanceKm`, `content.durationMin` | Decimal / Integer | Conditional | May be absent in a draft; required for publication | N/A | N/A | `distanceKm`: greater than 0 and at most `ROUTE_DISTANCE_MAX_KM` (100); `durationMin`: greater than 0 and at most `ROUTE_DURATION_MAX_MIN` (1440) | N/A | km, at most one decimal place / minutes, integer | N/A | N/A | N/A | A non-positive value, a value above the maximum or a distance with more than one decimal place blocks saving (MSG-NUMBER-POSITIVE, MSG-NUMBER-TOO-BIG, MSG-NUMBER-DECIMALS) | Save / publication | M03 §5.3; §6.1.1; BR-M03-C02, BR-M03-L01; §5.1 Published Route (v3.7 clarification 3); M01 §5.3 Published Route input | SOURCE-BACKED | Former open decision T5, resolved. Provisional constants. Boundary: numeric (0 and 0.1 km; 100 and 100.1 km; 1439, 1440 and 1441 minutes), decimal places. |
| DAC-M03-033 | M03 | Revision (ROUTE) | `content.difficulty` | Enum | Conditional | Required for publication | N/A | `NHE`, `TRUNG_BINH`, `KHO` | N/A | N/A | N/A | N/A | N/A | N/A | N/A | Publication | M03 §6.1.1; §5.1 | SOURCE-BACKED | Boundary: enum. |
| DAC-M03-034 | M03 | Revision (ROUTE) | `content.groupTags`, `content.experienceTags` | Array<Enum> | Conditional | Required for publication | N/A | groupTags: `GROUP_CA_NHAN_NGUOI_LON`, `GROUP_GIA_DINH_CO_TRE`, `GROUP_CAN_DE_DANG`; experienceTags: `INTEREST_THIEN_NHIEN_CHUP_ANH`, `INTEREST_TIM_HIEU`, `INTEREST_KHAM_PHA` | N/A | Min 1 item each; max 3 items each (one per allowed value) | N/A | Values are distinct within each array | N/A | N/A | N/A | Publication | M03 §6.1.1; BR-M03-C12 (v3.7 clarification 3); M01 §5.3 Published Route input | SOURCE-BACKED | No new tag groups in MVP. Former open decision T6 (duplicate values), resolved. Boundary: array, enum. |
| DAC-M03-035 | M03 | Revision (ROUTE) | Tag contradiction (`content.difficulty`, `content.groupTags`) | Rule | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | `difficulty = KHO` cannot be combined with `GROUP_GIA_DINH_CO_TRE` or `GROUP_CAN_DE_DANG` | N/A | Blocks saving the draft, with a message naming the conflict | Save | M03 BR-M03-C12, BR-M03-L01 | SOURCE-BACKED | Boundary: cross-field. |
| DAC-M03-036 | M03 | Revision (ROUTE) | `content.thumbnailMediaId` | UUID | Conditional | Required for publication | N/A | N/A | N/A | N/A | N/A | N/A | References an `IMAGE` Media of this Route with usage rights confirmed before publication | N/A | N/A | Publication | M03 §6.1.1; §6.3; BR-M03-C04, BR-M03-C14 | SOURCE-BACKED | Boundary: conditional presence. |
| DAC-M03-037 | M03 | Revision (ROUTE) | `content.galleryItems`, `content.galleryItems[].mediaId` | Array<Object> / UUID | Optional | May be absent or empty | N/A | N/A | N/A | Max `ROUTE_GALLERY_MAX_IMAGES` (8) items | N/A | N/A | Ordered, first item is the cover; each `mediaId` references an `IMAGE` Media of this Route | N/A | Files beyond the remaining count are refused one by one (MSG-COUNT-IMAGES) | Upload / save | M03 §5.3; §6.1.1; BR-M03-C14, BR-M03-E14 | SOURCE-BACKED | Provisional constant. Boundary: array. |
| DAC-M03-038 | M03 | Revision (ROUTE) | `content.galleryItems[].caption.vi`, `content.galleryItems[].caption.en`, `content.routeMapCaption.vi`, `content.routeMapCaption.en` | String | Optional | Both absent allowed | N/A | N/A | N/A | Max `CAPTION_MAX_CHARS` (200) | N/A | N/A | Both-or-none; `routeMapCaption` allowed only with `routeMapMediaId` | Counted after trimming leading/trailing whitespace (M03 §5.3) | Over the limit blocks saving; one language only blocks publication | Save / publication | M03 §5.3; §6.1.1; BR-M03-C06, BR-M03-L01 | SOURCE-BACKED | Provisional constant. Boundary: string length, cross-field. |
| DAC-M03-039 | M03 | Revision (ROUTE) | `content.routeMapMediaId` | UUID | Optional | 0 or 1 route map | N/A | N/A | N/A | N/A | N/A | N/A | References an `IMAGE` Media of this Route | N/A | N/A | Save | M03 §6.1.1; BR-M03-C14 | SOURCE-BACKED | Boundary: conditional presence. |
| DAC-M03-040 | M03 | Revision (ROUTE) | `content.offlineRouteMapRequired` | Boolean | Required | N/A | N/A | Default `false` | N/A | N/A | N/A | N/A | May be `true` only while `routeMapMediaId` is present | N/A | When the map is removed while ticked, the tick is cleared at save and the author is told | Save | M03 §6.1.1; BR-M03-C16 | SOURCE-BACKED | Boundary: cross-field. |
| DAC-M03-041 | M03 | Revision (ROUTE) | `content.checkpointList`, `content.checkpointList[].checkpointId` | Array<Object> / String | Conditional | May be empty in a draft; required with at least one active checkpoint for publication | N/A | N/A | N/A | Min 1 active checkpoint at publication; max `ROUTE_CHECKPOINTS_MAX_ITEMS` (30) items, closed checkpoints included | N/A | A checkpoint appears at most once | Item must reference a `HOAT_DONG` checkpoint when added; never `LUU_TRU` while a non-archived route lists it | N/A | A duplicate blocks saving (MSG-CHECKPOINT-DUPLICATE); an item above the maximum blocks saving (MSG-LIMIT-CHECKPOINTS) | Save / publication | M03 §5.3; §6.1.1; §6.4; BR-M03-C04, BR-M03-T01, BR-M03-T04, BR-M03-T09, BR-M03-L01 (v3.7 clarification 3) | SOURCE-BACKED | Former open decision T6 (route list size), resolved. Provisional constant. Boundary: array (29, 30 and 31 items). |
| DAC-M03-042 | M03 | Revision (ROUTE) | Active route keeps an active checkpoint (`content.checkpointList`) | Rule | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | A `HOAT_DONG` route always has at least one active checkpoint in its list | N/A | A route publication (including restore) that would leave none is blocked (MSG-ROUTE-LAST-CHECKPOINT); a checkpoint closure that leaves none closes the route automatically | Publication / close | M03 BR-M03-T05, BR-M03-H02 | SOURCE-BACKED | Boundary: cross-field. |
| DAC-M03-043 | M03 | Revision (ROUTE) | `content.highlights`, `content.highlights[].vi`, `content.highlights[].en` | Array<Object> / String | Optional (array); Required per item | Array may be absent or empty | Non-empty after trimming | N/A | N/A | Max `ROUTE_HIGHLIGHTS_MAX_ITEMS` (5) items; each text max `ROUTE_HIGHLIGHT_MAX_CHARS` (80) | N/A | N/A | Each item needs both languages | Counted after trimming leading/trailing whitespace (M03 §5.3) | Over the limit blocks saving | Save / publication | M03 §5.3; §6.1.1; BR-M03-C06, BR-M03-L01 | SOURCE-BACKED | Provisional constants. Boundary: array, string length. |
| DAC-M03-044 | M03 | Route | Route first publication guard (`Route.status`) | Rule | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | All required fields complete in both languages; both-or-none fields complete; at least one active checkpoint; image rights confirmed; tags not contradictory; offline size within ceiling; safety warning or no-warning tick | N/A | Each gap listed (BR-M03-L03); nothing published | Publication | M03 BR-M03-C04, BR-M03-F01 | SOURCE-BACKED | Boundary: cross-field. |
| DAC-M03-045 | M03 | Revision (CHECKPOINT) | `content.checkpointName.vi`, `content.checkpointName.en` | String | Conditional | Required before activation/publication | Non-empty after trimming | N/A | N/A | Max `NAME_MAX_CHARS` (100) | N/A | N/A | N/A | Counted after trimming leading/trailing whitespace (M03 §5.3) | Over the limit blocks saving | Save / publication | M03 §5.3; §6.2.1; BR-M03-D01, BR-M03-D04, BR-M03-L01 | SOURCE-BACKED | Provisional constant. Boundary: string length. |
| DAC-M03-046 | M03 | Revision (CHECKPOINT) | `content.checkpointName.vi` | String | Conditional | N/A | N/A | N/A | N/A | N/A | N/A | Unique among non-archived checkpoints | N/A | Compared ignoring case and surrounding spaces, against both the draft and the published name of every other non-archived checkpoint | Duplicate blocks saving (MSG-CHECKPOINT-NAME-TAKEN) | Save | M03 BR-M03-D03; §6.4 | SOURCE-BACKED | Boundary: identity/uniqueness. |
| DAC-M03-047 | M03 | Revision (CHECKPOINT) | `content.connectivityMode` | Enum | Conditional | No default; required before publication and before any visit point is added | N/A | `ONLINE_AVAILABLE`, `OFFLINE_REQUIRED` | N/A | N/A | N/A | N/A | N/A | N/A | Adding a visit point before a mode is saved shows MSG-MODE-REQUIRED-FIRST | Save / publication | M03 §6.2.1; BR-M03-D02, BR-M03-E15 | SOURCE-BACKED | Boundary: enum, conditional presence. |
| DAC-M03-048 | M03 | Revision (CHECKPOINT) | `content.fieldVerificationConfirmed`, `content.fieldVerifiedByUserId`, `content.fieldVerifiedAt` | Boolean / String / DateTime | Conditional | Required (and `true`) when `ONLINE_AVAILABLE`; who/when set by M03 when ticked | N/A | N/A | N/A | N/A | N/A | N/A | `ONLINE_AVAILABLE` may be chosen only after the tick; changing the mode away clears it | `fieldVerifiedAt` UTC | N/A | Save | M03 §6.2.1; BR-M03-D02 | SOURCE-BACKED | Not a GPS field. Boundary: conditional presence. |
| DAC-M03-049 | M03 | Revision (CHECKPOINT) | Mode change with audio/video (`content.connectivityMode`) | Rule | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | Changing `ONLINE_AVAILABLE` → `OFFLINE_REQUIRED` is blocked while any visit point of the checkpoint (published or pending draft) holds audio/video; the other direction is always allowed | N/A | Blocks saving; MSG-MODE-HAS-AV names the files | Save | M03 BR-M03-D02 | SOURCE-BACKED | Boundary: cross-field. |
| DAC-M03-050 | M03 | Checkpoint | Checkpoint readiness (`Checkpoint.status`) | Rule | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | Vietnamese and English name; connectivity mode (with confirmation for `ONLINE_AVAILABLE`); at least one ready visit point; for `OFFLINE_REQUIRED`, every image of its ready visit points stored and readable | N/A | Not-ready visit points stay `NHAP` and are listed on the review screen | First publication / reopen | M03 BR-M03-D04, BR-M03-D05, BR-M03-H06 | SOURCE-BACKED | Checked on stored data. Boundary: cross-field. |
| DAC-M03-051 | M03 | Revision (QRCODE) | `content.objectName.vi`, `content.objectName.en` | String | Conditional | May be absent in a draft; required for publication | Non-empty after trimming | N/A | N/A | Max `NAME_MAX_CHARS` (100) | N/A | N/A | N/A | Counted after trimming leading/trailing whitespace (M03 §5.3) | Over the limit blocks saving | Save / publication | M03 §5.3; §6.2.2; BR-M03-E03, BR-M03-E05, BR-M03-L01 | SOURCE-BACKED | Provisional constant. Boundary: string length. |
| DAC-M03-052 | M03 | Revision (QRCODE) | `content.introductionText.vi`, `content.introductionText.en` | String | Conditional | Required for publication | N/A | N/A | N/A | Min `QR_INTRO_MIN_CHARS` (30) / Max `QR_INTRO_MAX_CHARS` (2000) per language | N/A | N/A | N/A | Counted after trimming leading/trailing whitespace (M03 §5.3) | Over the maximum blocks saving; incomplete blocks publication | Save / publication | M03 §5.3; §6.2.2; BR-M03-E03, BR-M03-E05, BR-M03-L01 | SOURCE-BACKED | Provisional constants. Boundary: string length (min-1/min/max/max+1). |
| DAC-M03-053 | M03 | Revision (QRCODE) | `content.mediaItems`, `content.mediaItems[].mediaId` | Array<Object> / UUID | Optional | May be absent or empty | N/A | N/A | N/A | Max `QR_MAX_IMAGES` (5) images and `QR_MAX_AV_FILES` (3) audio/video in total | N/A | N/A | Audio/video only when the checkpoint is `ONLINE_AVAILABLE`; each `mediaId` is a `QR_MEDIA` Media owned by the checkpoint of this QR object | N/A | Files beyond the count refused one by one (MSG-COUNT-IMAGES, MSG-COUNT-AV); audio/video for an `OFFLINE_REQUIRED` checkpoint refused at save (MSG-AV-OFFLINE) | Upload / save | M03 §5.3; §6.2.2; §6.4; BR-M03-E02, BR-M03-E04, BR-M03-E14 | SOURCE-BACKED | Provisional constants. Boundary: array, cross-field. |
| DAC-M03-054 | M03 | QRCode | QR object readiness (`QRCode.status`) | Rule | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | Object name and introduction complete in both languages; media within limits and respecting the checkpoint mode; usage rights confirmed; spoken language for every audio/video | N/A | Not ready → cannot become `HOAT_DONG` | Publication | M03 BR-M03-E05, BR-M03-E17 | SOURCE-BACKED | Boundary: cross-field. |
| DAC-M03-055 | M03 | Media | `ownerType`, `ownerId`, `usage` | Enum / String / Enum | Required | N/A | N/A | ownerType: `ROUTE`, `CHECKPOINT`; usage: `ROUTE_THUMBNAIL`, `ROUTE_GALLERY`, `ROUTE_MAP`, `QR_MEDIA` | N/A | N/A | N/A | N/A | `ownerId` is the `routeId` or `checkpointId` of the owner; route usages require `type = IMAGE` and `ownerType = ROUTE`; `QR_MEDIA` requires `ownerType = CHECKPOINT`; referenced only by revisions of its owner | N/A | N/A | Upload / save | M03 §6.3; §6.4 | SOURCE-BACKED | Boundary: enum, cross-field. |
| DAC-M03-056 | M03 | Media | `type`, `mimeType` | Enum / String | Required | N/A | N/A | type: `IMAGE`, `AUDIO`, `VIDEO`; supported file types: JPEG, PNG, WebP (images); MP3, M4A (audio); MP4 (video); MIME values: DAC-M03-057 | N/A | N/A | N/A | N/A | N/A | N/A | Unsupported type refused at upload and blocks saving | Upload | M03 §5.3; §6.3; BR-M03-E14, BR-M03-L01 | SOURCE-BACKED | Boundary: enum. |
| DAC-M03-057 | M03 | Media | `mimeType` | String | Required | N/A | N/A | `image/jpeg`, `image/png`, `image/webp` (IMAGE); `audio/mpeg`, `audio/mp4` (AUDIO); `video/mp4` (VIDEO) | N/A | N/A | N/A | N/A | N/A | N/A | Unsupported type refused at upload (MSG-FILE-TYPE) and blocks saving | Upload | M03 §5.3; §6.3 (v3.7 clarification 2); BR-M03-L01 | SOURCE-BACKED | Former open decision T3, resolved. Boundary: enum. |
| DAC-M03-058 | M03 | Media | `fileSizeBytes` | Integer | Required | N/A | N/A | N/A | Greater than 0; max per type: `IMAGE_MAX_MB` (2), `AUDIO_MAX_MB` (5), `VIDEO_MAX_MB` (30) | N/A | Bytes; 1 MB = 1 048 576 bytes | N/A | N/A | N/A | Over the limit refused at once with a request to compress | Upload | M03 §5.3; §6.3; BR-M03-C14, BR-M03-E04 | SOURCE-BACKED | Provisional constants; MB factor from M03 §5.3 (v3.7 clarification 2). Boundary: numeric (max, max+1 byte). |
| DAC-M03-059 | M03 | Media | `spokenLanguage` | Enum | Conditional | Required for `AUDIO` and `VIDEO`; absent for `IMAGE` | N/A | `vi`, `en`, `NONE` | N/A | N/A | N/A | N/A | N/A | N/A | Missing value: visit point not ready (MSG-AV-LANGUAGE-MISSING); audio/video in one language only: non-blocking warning MSG-AV-ONE-LANGUAGE | Upload / publication | M03 §6.3; BR-M03-E05, BR-M03-E17 | SOURCE-BACKED | Consumer rule: M02 BR-M02-026. Boundary: enum, conditional presence. |
| DAC-M03-060 | M03 | Media | `usageRightsConfirmed`, `usageRightsConfirmedByUserId`, `usageRightsConfirmedAt` | Boolean / String / DateTime | Required / Conditional / Conditional | Who/when required when confirmed | N/A | N/A | N/A | N/A | N/A | N/A | Must be `true` before any revision referencing the media is published; confirmed file by file (no single tick for several files) | `usageRightsConfirmedAt` UTC | Unconfirmed media blocks publication | Save / publication | M03 §6.3; BR-M03-C04, BR-M03-C14, BR-M03-E04, BR-M03-E14 | SOURCE-BACKED | Boundary: cross-field. |
| DAC-M03-061 | M03 | JourneySnapshot | `routeId`, `contentVersion`, `previousContentVersion` | String / Integer / Integer | Required / Required / Optional | `previousContentVersion` absent for version 1 | N/A | N/A | `contentVersion` min 1; +1 per published snapshot, never skipped or reused | N/A | N/A | `(routeId, contentVersion)` unique | `previousContentVersion = contentVersion - 1` of the same route; number allocated inside the atomic switch | N/A | N/A | Snapshot publication | M03 §5.1; §6.4; BR-M03-G03 | SOURCE-BACKED | Boundary: numeric (min), identity/uniqueness. |
| DAC-M03-062 | M03 | JourneySnapshot | `status` | Enum | Required | N/A | N/A | `DA_CONG_BO` | N/A | N/A | N/A | N/A | Immutable once published; candidate `DANG_TAO` never exposed | N/A | N/A | Snapshot publication | M03 §5.1; BR-M03-G01, BR-M03-G09; §6.4 | SOURCE-BACKED | Boundary: enum. |
| DAC-M03-063 | M03 | JourneySnapshot | `checkpoints`, `checkpoints[].checkpointId`, `checkpoints[].sequence` | Array<Object> / String / Integer | Required | Array may be empty only when the route is not `HOAT_DONG` | N/A | N/A | `sequence` min 1 (1-based list position); gaps allowed | N/A | N/A | `checkpointId` and `sequence` unique within the snapshot | Every and only active checkpoint of the route list, in list order | N/A | N/A | Snapshot publication | M03 §5.1; BR-M03-G02, BR-M03-G06 | SOURCE-BACKED | Boundary: array, identity/uniqueness. |
| DAC-M03-064 | M03 | JourneySnapshot | `checkpoints[].checkpointName`, `checkpoints[].checkpointName.vi`, `checkpoints[].checkpointName.en`, `checkpoints[].connectivityMode`, `checkpoints[].qrIdentifiers` | Object / String / String / Enum / Array<String> | Required | N/A | Names non-empty | connectivityMode: `ONLINE_AVAILABLE`, `OFFLINE_REQUIRED` | N/A | `qrIdentifiers` min 1 item (active identifiers only) | N/A | N/A | N/A | N/A | N/A | Snapshot publication | M03 §5.1; BR-M03-G02 | SOURCE-BACKED | Frozen copy; source limits apply at Revision. Boundary: array, enum. |
| DAC-M03-065 | M03 | JourneySnapshot | `checkpoints[].offlineResources`, `checkpoints[].offlineResources[].qrIdentifier`, `checkpoints[].offlineResources[].objectName`, `checkpoints[].offlineResources[].localizedContent`, `checkpoints[].offlineResources[].localizedContent.vi`, `checkpoints[].offlineResources[].localizedContent.vi.introductionText`, `checkpoints[].offlineResources[].localizedContent.en`, `checkpoints[].offlineResources[].localizedContent.en.introductionText`, `checkpoints[].offlineResources[].staticImages` | Array<Object> and members | Conditional | Required only for `OFFLINE_REQUIRED`; absent for `ONLINE_AVAILABLE` | objectName vi/en and introductionText non-empty | N/A | N/A | Exactly one item per identifier in `qrIdentifiers`; `staticImages` may be empty | N/A | `qrIdentifier` unique within the snapshot and an identifier of the same checkpoint | N/A | N/A | N/A | Snapshot publication | M03 §5.1; BR-M03-G02 | SOURCE-BACKED | No audio/video in a snapshot. Boundary: conditional presence, array. |
| DAC-M03-066 | M03 | JourneySnapshot | `offlineRouteMap`, `offlineRouteMap.sourceRef`, `offlineRouteMap.caption`, `offlineRouteMap.caption.vi`, `offlineRouteMap.caption.en` | Object / String | Optional / Conditional | Present only when the published route content has `offlineRouteMapRequired = true`; `sourceRef` required when present | N/A | N/A | N/A | Caption max 200 per language | N/A | N/A | Caption both-or-none | N/A | N/A | Snapshot publication | M03 §5.1; BR-M03-C16 | SOURCE-BACKED | Boundary: conditional presence, string length. |
| DAC-M03-067 | M03 | JourneySnapshot | `estimatedOfflineSizeBytes` | Integer | Optional | Consumers must tolerate absence | N/A | N/A | Ceiling `OFFLINE_PACKAGE_MAX_MB` (50) per route | N/A | Bytes; 1 MB = 1 048 576 bytes | N/A | Sum of distinct offline images of `OFFLINE_REQUIRED` checkpoints + offline route map + UTF-8 size of offline texts; never audio/video | N/A | Above the ceiling blocks publication or reopening and names the route; closing and revoking are never blocked | Snapshot build | M03 §5.1; BR-M03-G10, BR-M03-X03; §5.3 | SOURCE-BACKED | Provisional constant. Boundary: numeric (max). |
| DAC-M03-068 | M03 | AdminAccount | `email` | String | Required | Never absent | N/A | N/A | N/A | N/A | N/A | Unique system-wide | N/A | Surrounding whitespace removed and lower-cased before storing and before every comparison | An invitation to an email that already has an account is refused (MSG-EMAIL-TAKEN); resending for the same pending account creates no duplicate (MSG-INVITE-RESENT) | Invitation / bootstrap | M03 §6.4; §5.6; BR-M03-K01, BR-M03-K04 (v3.7 clarification 4) | SOURCE-BACKED | Boundary: identity/uniqueness. |
| DAC-M03-069 | M03 | AdminAccount | `email` | String | Required | N/A | N/A | N/A | N/A | Max `EMAIL_MAX_CHARS` (254) after normalization | N/A | N/A | N/A | Trim surrounding whitespace, lower-case the whole address | N/A | Invitation / bootstrap | M03 §5.3; §6.4; BR-M03-K01 (v3.7 clarification 2) | SOURCE-BACKED | Former open decision T2, resolved. Provisional constant. Boundary: string length, identity (same address with different case/spaces). |
| DAC-M03-070 | M03 | AdminAccount | `userId` | String | Conditional | Present after a matching provider identity is linked | N/A | N/A | N/A | N/A | N/A | Unique system-wide and stable when present | N/A | N/A | N/A | Invitation completion | M03 §6.4 (v3.7 clarification 3); BR-M03-K05 | SOURCE-BACKED | Boundary: conditional presence, uniqueness. |
| DAC-M03-071 | M03 | AdminAccount | `role`, `status` | Enum | Required | N/A | N/A | role: `CONTENT_STAFF`, `REVIEWER`; status: `INVITATION_PENDING`, `ACTIVE`, `DEACTIVATED` | N/A | N/A | N/A | N/A | INVITATION_PENDING→ACTIVE only with a matching provider identity; ACTIVE↔DEACTIVATED; the last active Reviewer cannot be demoted or deactivated (transactional check) | N/A | Blocked with an explanation | Account management | M03 §6.4; BR-M03-A01, BR-M03-K01–K05 | SOURCE-BACKED | Boundary: enum, cross-field. |
| DAC-M03-072 | M03 | AuditRecord | `actorUserId` | String | Conditional | Required for authenticated administrative actions; may be absent for a server-side provisioning outcome | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | Append | M03 §6.4 | SOURCE-BACKED | Boundary: conditional presence. |
| DAC-M03-073 | M03 | AuditRecord | `reason` | String | Conditional | Required for close, reopen (safety-confirmation note), archive and discard of a route or checkpoint, and for revoke of a visit point; optional otherwise | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | Append | M03 §6.4; BR-M03-F08, BR-M03-C01, BR-M03-D09, BR-M03-E09, BR-M03-H06, BR-M03-H07 | SOURCE-BACKED | Max length: DAC-M03-008. Boundary: conditional presence. |
| DAC-M03-074 | M03 | AuditRecord | `outcome`, `selfPublished`, `revision` | Enum / Boolean / Integer | Required / Conditional / Optional | N/A | N/A | outcome: `SUCCESS`, `FAILURE` | N/A | N/A | N/A | N/A | Failed operations are logged too; `selfPublished` present on publication actions (`true` when publisher equals last editor); `revision` is the `revisionNumber` of the Revision concerned (subject from `entityType`/`entityId`) | N/A | N/A | Append | M03 §6.4; BR-M03-F08 | SOURCE-BACKED | Exactly one audit line per action. Boundary: enum. |
| DAC-M03-075 | M03 | AuditRecord | `beforeState`, `afterState`, `action`, `entityType`, `entityId` | Object / String | Optional / Required | N/A | N/A | N/A | N/A | N/A | N/A | N/A | Never contains passwords, credentials, tokens or secrets; append-only, never edited or deleted | N/A | N/A | Append | M03 §6.4; BR-M03-F08 | SOURCE-BACKED | Boundary: N/A (content exclusion). |
| DAC-M03-076 | M03 | SessionRecord | `sessionId` | UUID | Required | N/A | N/A | N/A | N/A | N/A | N/A | Unique across the whole system | First record stored immutably; identical retry succeeds without duplication; same `sessionId` with different business content rejected as conflict, first kept | Comparison on normalized business content, ignoring field order and formatting; visited checkpoints compared as a set keyed by `checkpointId` | Conflict | Intake | M03 §5.1; §6.4; BR-M03-J03 | SOURCE-BACKED | Boundary: identity/uniqueness. |
| DAC-M03-077 | M03 | SessionRecord | `routeId`, `contentVersion`, `status` | String / Integer / Enum | Required | N/A | N/A | status: `HOAN_TAT`, `BO_DO` only | N/A | N/A | N/A | N/A | `routeId` known to M03; `contentVersion` a published snapshot version of it, whatever the route status | N/A | Rejected as invalid; nothing stored | Intake | M03 §5.1; BR-M03-J01, BR-M03-J02, BR-M03-J04 | SOURCE-BACKED | Boundary: enum, cross-field. |
| DAC-M03-078 | M03 | SessionRecord | `startedAt`, `endedAt` | DateTime | Required | N/A | N/A | N/A | N/A | N/A | N/A | N/A | `endedAt >= startedAt` | UTC | Rejected as invalid | Intake | M03 §5.1; §6.4; BR-M03-J02 | SOURCE-BACKED | Boundary: date/time (equality boundary). |
| DAC-M03-079 | M03 | SessionRecord | `visitedCheckpoints`, `visitedCheckpoints[].checkpointId`, `visitedCheckpoints[].checkpointName`, `visitedCheckpoints[].sequence`, `visitedCheckpoints[].checkedInAt` | Array<Object> and members | Required | Array may be empty (abandoned session) | N/A | N/A | N/A | N/A | N/A | `checkpointId` unique within the session | Each checkpoint belongs to the snapshot `(routeId, contentVersion)` with `checkpointName` = snapshot `checkpointName.vi` and `sequence` = snapshot `sequence`; `checkedInAt` within `[startedAt, endedAt]` | UTC | Rejected as invalid; nothing stored | Intake | M03 §5.1; §6.4; BR-M03-J02 | SOURCE-BACKED | Boundary: array, date/time (interval containment). |
| DAC-M03-080 | M03 | SessionRecord | Privacy allowlist (whole record) | Rule | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | No visitor name, account, device identifier or GPS field | N/A | Rejected | Intake | M03 BR-M03-J01; §5.1 | SOURCE-BACKED | Boundary: N/A. |
| DAC-M03-081 | M03 | Published Route (contract, not an S4 path) | `timeTags` | Array<Enum> | Required | N/A | N/A | `TIME_NGAN`, `TIME_VUA`, `TIME_DAI` | N/A | Exactly 1 value | minutes | N/A | Derived from `durationMin`: ≤ 90 → `TIME_NGAN`; > 90 and ≤ 180 → `TIME_VUA`; > 180 → `TIME_DAI`; never entered by staff | N/A | N/A | Projection | M03 BR-M03-C11; §5.1; M01 §5.3 | SOURCE-BACKED | Boundary: numeric (90/91, 180/181). |
| DAC-M03-082 | M03 | Published Route (contract, not an S4 path) | `checkpointCount`, `hasOfflineRequiredCheckpoint`, `hasOfflineRouteMap`, `checkpointSummaries` | Integer / Boolean / Boolean / Array<Object> | Required | N/A | N/A | N/A | `checkpointCount >= 0` | N/A | N/A | N/A | Computed from the active snapshot; `checkpointSummaries` ordered by `sequence`, empty only when status is not `HOAT_DONG` | N/A | N/A | Projection | M03 §5.1; BR-M03-C11, BR-M03-T08 | SOURCE-BACKED | Boundary: rate/count (zero). |
| DAC-M03-083 | M03 | Live QR lookup (contract, not an S4 path) | Input `qrIdentifier`, `routeId` | String | Required / Optional | N/A | N/A | N/A | N/A | N/A | N/A | N/A | M03 does not check that the supplied route lists the checkpoint | `qrIdentifier` matched exactly after trimming surrounding whitespace | N/A | Lookup | M03 §5.1; BR-M03-I01 | SOURCE-BACKED | Boundary: N/A. |
| DAC-M03-084 | M03 | Live QR lookup (contract, not an S4 path) | `outcome`, `content`, `closedScope`, `content.mediaResources[]` | Enum / Object | Required / Conditional / Conditional | N/A | N/A | outcome: `VALID`, `TEMPORARILY_CLOSED`, `INVALID`; closedScope: `ROUTE`, `CHECKPOINT`; mediaResources[].spokenLanguage: `vi`, `en`, `NONE` | N/A | N/A | N/A | N/A | Evaluation order of BR-M03-I02; `content` only for `VALID`; `closedScope` only for `TEMPORARILY_CLOSED`; `mediaResources` empty for `OFFLINE_REQUIRED`; only published content | N/A | Source failure signalled separately, never `INVALID` | Lookup | M03 §5.1; BR-M03-I02–I04; M02 §5.1 | SOURCE-BACKED | Consumer filtering by language: M02 BR-M02-026. Boundary: enum, conditional presence. |
| DAC-M03-085 | M03 | Report input (contract, not an S4 path) | `routeId`, `fromDate`, `toDate` | String / Date / Date | Optional | `fromDate` and `toDate` supplied together; when the pair is absent, the most recent 30 days | N/A | N/A | `fromDate <= toDate`; inclusive span at most `REPORT_MAX_SPAN_DAYS` (366) days | N/A | N/A | N/A | N/A | Filter and group by `endedAt` in `Asia/Ho_Chi_Minh`; default window = 30 calendar days ending today, both ends inclusive | A longer span is refused (MSG-REPORT-SPAN); a single date, or a `fromDate` after `toDate`, is refused (MSG-REPORT-DATES-INVALID) | Report | M03 §5.1; §5.3; §5.6; BR-M03-J05 (v3.7 clarifications 3 and 4) | SOURCE-BACKED | Default 30 days is not a maximum. Former open decision T7, resolved. Provisional constant. Boundary: date/time, cross-field (spans of 365, 366 and 367 days). |
| DAC-M03-086 | M03 | RPT-01 / RPT-02 (report output, not an S4 path) | Counts and rates | Integer / Decimal | Required | N/A | N/A | N/A | Counts `>= 0`; rates in `0..1` | N/A | N/A | N/A | Rate = count / `totalSessionCount`; rate `0` when the total is 0; RPT-02 one item per `(routeId, checkpointId)`, label and `sequence` from the record with the latest `endedAt`; each RPT-02 item also carries `routeName` (display only: the Vietnamese name of the route's published revision at query time; not stored, not a grouping key) | N/A | N/A | Report | M03 §5.1; BR-M03-J06, BR-M03-J07 (v3.7 clarification 4) | SOURCE-BACKED | Boundary: rate/count. |
| DAC-M03-087 | M03 | Revision (ROUTE, QRCODE) | `content.description.vi`, `content.description.en`, `content.startingPoint.vi`, `content.startingPoint.en`, `content.participationRequirements.vi`, `content.participationRequirements.en`, `content.preparation.vi`, `content.preparation.en`, `content.bestTime.vi`, `content.bestTime.en`, `content.safetyWarning.vi`, `content.safetyWarning.en`, `content.introductionText.vi`, `content.introductionText.en` | String | N/A | N/A | N/A | Plain text, never markup or HTML; line breaks allowed | N/A | N/A | N/A | N/A | N/A | N/A | N/A | Save | M03 §5.3 (v3.7 clarification 2) | SOURCE-BACKED | Former open decision T8, resolved. Boundary: string length (with line breaks). |
| DAC-M03-088 | M03 | Revision (ROUTE, CHECKPOINT, QRCODE) | `content.name.vi`, `content.name.en`, `content.checkpointName.vi`, `content.checkpointName.en`, `content.objectName.vi`, `content.objectName.en`, `content.galleryItems[].caption.vi`, `content.galleryItems[].caption.en`, `content.routeMapCaption.vi`, `content.routeMapCaption.en`, `content.highlights[].vi`, `content.highlights[].en` | String | N/A | N/A | N/A | Plain text, never markup or HTML; single line | N/A | N/A | N/A | N/A | N/A | N/A | N/A | Save | M03 §5.3 (v3.7 clarification 2) | SOURCE-BACKED | `shortDescription`, internal notes and reasons are plain text; their line-break policy is not stated. Boundary: N/A. |
| DAC-M03-089 | M03 | QRCode, Checkpoint | QR objects per checkpoint (`QRCode.checkpointId`, `QRCode.status`) | Rule | N/A | N/A | N/A | N/A | N/A | Max `CHECKPOINT_QR_MAX_ITEMS` (20) QR objects that are not `THU_HOI` per checkpoint | count | N/A | Counted per checkpoint; revoked (`THU_HOI`) objects do not count | N/A | Adding one more is blocked (MSG-LIMIT-QR) | Adding a visit point | M03 §5.3; BR-M03-E02, BR-M03-L01 (v3.7 clarification 3) | SOURCE-BACKED | Former open decision T6 (QR objects per checkpoint), resolved. Provisional constant. Boundary: array (19, 20 and 21 non-revoked objects; revoked excluded). |
| DAC-M01-001 | M01 | LanguagePreference | `languageCode` | Enum | Required | N/A | N/A | `vi`, `en` | N/A | N/A | N/A | Singleton per local application profile | M01 is the only writer; replacement changes no package or session state; without a stored value the QR link page uses the device language (M02) | N/A | N/A | Selection | M01 §5.3; §6.4; BR-M01-001; M02 BR-M02-024 | SOURCE-BACKED | Boundary: enum. |
| DAC-M01-002 | M01 | SelectedRouteContext | `contractVersion` | Integer | Required | N/A | N/A | Exactly `3` | N/A | N/A | N/A | N/A | N/A | N/A | M02 rejects any other value (including `2`) with a clear message, never converted | Start / session start | M01 §5.3; M02 §5.1; BR-M02-017 | SOURCE-BACKED | Boundary: enum (3 vs 2). |
| DAC-M01-003 | M01 | SelectedRouteContext | `handoffId` | UUID | Required | N/A | N/A | UUID | N/A | N/A | N/A | Globally unique; used for at most one M02 session | Every successful Start creates a new handoff and atomically replaces the current context | N/A | N/A | Start | M01 §5.3; §5.4; §6.4; BR-M01-009; M02 BR-M02-001 | SOURCE-BACKED | Boundary: identity/uniqueness. |
| DAC-M01-004 | M01 | SelectedRouteContext | `routeId`, `routeJourneyManifest.routeId`, `routeJourneyManifest.contentVersion` | String / String / Integer | Required | N/A | N/A | N/A | N/A | N/A | N/A | N/A | `routeId` equals `routeJourneyManifest.routeId`; version is the source snapshot/package version | N/A | N/A | Start | M01 §5.3; §5.4; M02 §5.1 | SOURCE-BACKED | Boundary: cross-field. |
| DAC-M01-005 | M01 | SelectedRouteContext | `authorizedAt`, `expiresAt` | DateTime | Required | N/A | N/A | N/A | N/A | N/A | N/A | N/A | `expiresAt` = `authorizedAt` + 24 hours exactly; never extended; a session may be created only before `expiresAt` (device clock); expiry never ends a running session | UTC | M02 rejects an expired handoff; the visitor starts again from M01 | Start / session start | M01 §5.3; §5.4; BR-M01-015; M02 §5.1; BR-M02-017 | SOURCE-BACKED | Boundary: date/time (equality at expiresAt). |
| DAC-M01-006 | M01 | SelectedRouteContext | `authorizationStatus` | Enum | Required | N/A | N/A | `AUTHORIZED`, `REVOKED` | N/A | N/A | N/A | N/A | Only `AUTHORIZED`, unused and unexpired creates a session; discovered closure sets `REVOKED`; time passing never changes it | N/A | N/A | Start / session start | M01 §5.3; BR-M01-011, BR-M01-015; M02 §5.1 | SOURCE-BACKED | Boundary: enum. |
| DAC-M01-007 | M01 | SelectedRouteContext, OfflinePackage | `SelectedRouteContext.routeJourneyManifest`, `SelectedRouteContext.routeJourneyManifest.checkpoints`, `SelectedRouteContext.routeJourneyManifest.checkpoints[].checkpointId`, `SelectedRouteContext.routeJourneyManifest.checkpoints[].sequence`, `SelectedRouteContext.routeJourneyManifest.checkpoints[].checkpointName`, `SelectedRouteContext.routeJourneyManifest.checkpoints[].connectivityMode`, `SelectedRouteContext.routeJourneyManifest.checkpoints[].qrIdentifiers`, `OfflinePackage.manifest`, `OfflinePackage.manifest.checkpoints`, `OfflinePackage.manifest.checkpoints[].checkpointId`, `OfflinePackage.manifest.checkpoints[].sequence`, `OfflinePackage.manifest.checkpoints[].checkpointName`, `OfflinePackage.manifest.checkpoints[].connectivityMode`, `OfflinePackage.manifest.checkpoints[].qrIdentifiers` | Object / Array<Object> and members | Required | N/A | `checkpointName` vi and en non-empty | connectivityMode: `ONLINE_AVAILABLE`, `OFFLINE_REQUIRED` (copied without reclassification) | N/A | `qrIdentifiers` min 1 item | N/A | `checkpointId` and `sequence` unique in the manifest; gaps allowed | Complete checkpoint list of the version; written atomically | N/A | N/A | Start / package build | M01 §5.3; §5.4; M02 §5.1 | SOURCE-BACKED | Frozen value copies of the snapshot. Boundary: array, identity/uniqueness. |
| DAC-M01-008 | M01 | OfflinePackage | `routeId`, `contentVersion`, `manifest.routeId`, `manifest.contentVersion` | String / Integer | Required | N/A | N/A | N/A | N/A | N/A | N/A | `(routeId, contentVersion)` unique; at most one active `SAN_SANG` package per route | `manifest.routeId` = `routeId`; `manifest.contentVersion` = `contentVersion` | N/A | N/A | Package build | M01 §5.3; §5.4; §6.4 | SOURCE-BACKED | Boundary: identity/uniqueness, cross-field. |
| DAC-M01-009 | M01 | OfflinePackage | `status`, `versionStatus` | Enum | Required / Conditional | `versionStatus` required only when `SAN_SANG`; `CHUA_TAI` may be represented by no package | N/A | status: `CHUA_TAI`, `DANG_TAI`, `SAN_SANG`, `CHUA_HOAN_TAT`; versionStatus: `CURRENT`, `OUTDATED` | N/A | N/A | N/A | N/A | Only `SAN_SANG` is exposed to M02; staging/partial data never exposed | N/A | N/A | Package lifecycle | M01 §5.3; §6.4; BR-M01-005; M02 §5.1 | SOURCE-BACKED | Boundary: enum, conditional presence. |
| DAC-M01-010 | M01 | OfflinePackage | `offlineRouteMap`, `offlineRouteMap.sourceRef`, `offlineRouteMap.caption`, `offlineRouteMap.caption.vi`, `offlineRouteMap.caption.en` | Object / String | Optional / Conditional | Present only when the source snapshot carries `offlineRouteMap`; `sourceRef` required when present | N/A | N/A | N/A | Caption max 200 characters per language | N/A | N/A | Caption both-or-none; image bytes present in the ready package; at most one per package | N/A | Missing bytes keep the package from becoming ready | Package build | M01 §5.3; §5.4; §6.4; BR-M01-004, BR-M01-013 | SOURCE-BACKED | Boundary: conditional presence, string length. |
| DAC-M01-011 | M01 | OfflinePackage | `routeEssentials`, `routeEssentials.capturedAt`, `routeEssentials.name`, `routeEssentials.startingPoint`, `routeEssentials.participationRequirements`, `routeEssentials.safetyWarning` | Object / DateTime / Object | Required / Required / Required / Required / Optional / Optional | N/A | name and startingPoint vi and en non-empty | N/A | N/A | As the Published Route values copied: name 100, startingPoint 500, participationRequirements 300, safetyWarning 500 per language | N/A | N/A | Exactly one value per ready package; optional texts both-or-none; text only, never images; a failed refresh keeps the old texts and `capturedAt` | `capturedAt` UTC | N/A | Package build / refresh | M01 §5.3 (OfflinePackage output and Published Route input); §5.4; §6.4; BR-M01-014 | SOURCE-BACKED | Point-in-time copy; not frozen. Boundary: string length, cross-field. |
| DAC-M01-012 | M01 | OfflinePackage | `downloadedAt` | DateTime | Optional | Present when a completed download time is available | N/A | N/A | N/A | N/A | N/A | N/A | N/A | UTC | N/A | Package build | M01 §5.3 | SOURCE-BACKED | Boundary: date/time. |
| DAC-M01-013 | M01 | OfflinePackage | Package completeness (`OfflinePackage.status`) | Rule | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | A candidate becomes `SAN_SANG` only when complete: resources, every declared image, offline route map when present, essential texts; the old ready package stays usable while a candidate is prepared or fails | N/A | Storage failure discards the candidate and preserves the ready package | Package build / update | M01 BR-M01-004, BR-M01-006; §5.4 | SOURCE-BACKED | Boundary: cross-field. |
| DAC-M01-014 | M01 | OfflineResource | `routeId`, `contentVersion`, `qrIdentifier`, `checkpointId` | String / Integer / String / String | Required | N/A | N/A | N/A | N/A | N/A | N/A | `(routeId, contentVersion, qrIdentifier)`; `qrIdentifier` unique within the package | `qrIdentifier` equals an identifier in `manifest`; `checkpointId` is the `OFFLINE_REQUIRED` manifest checkpoint holding the QR; exactly one resource per QR of every offline-required checkpoint and none for `ONLINE_AVAILABLE` | N/A | N/A | Package build | M01 §5.3; §5.4; §6.4; BR-M01-004 | SOURCE-BACKED | Boundary: identity/uniqueness, array. |
| DAC-M01-015 | M01 | OfflineResource | `objectName`, `localizedContent`, `localizedContent.vi`, `localizedContent.vi.introductionText`, `localizedContent.en`, `localizedContent.en.introductionText`, `staticImages` | Object / String / Array<String> | Required | N/A | objectName vi/en and introductionText non-empty | N/A | N/A | `staticImages` may be empty | N/A | N/A | Every declared image has its bytes in the ready package; both languages present | N/A | A missing declared image keeps the package from becoming ready | Package build | M01 §5.3; §5.4 | SOURCE-BACKED | Frozen copy; source limits apply at M03 Revision. Boundary: array. |
| DAC-M01-016 | M01 | JourneySnapshot (consumer) | `JourneySnapshot.estimatedOfflineSizeBytes` | Integer | Optional | N/A | N/A | N/A | N/A | N/A | N/A | N/A | Absence or inaccuracy never blocks or changes Download; the screen says the size is not available | N/A | N/A | Offline decision | M01 BR-M01-016; §5.4 | SOURCE-BACKED | Producer rule: DAC-M03-067. Boundary: conditional presence. |
| DAC-M01-017 | M01 | Published Route (contract, not an S4 path) | `status`, `activeContentVersion` | Enum / Integer | Required | N/A | N/A | `HOAT_DONG`, `TAM_DONG`, `LUU_TRU` | N/A | N/A | N/A | N/A | Only `HOAT_DONG` with a non-null `activeContentVersion` is selectable; the snapshot is authoritative when it disagrees with the flags | N/A | N/A | Catalog / Start | M01 §5.3; BR-M01-002, BR-M01-012 | SOURCE-BACKED | Boundary: enum. |
| DAC-M01-018 | M01 | RecommendationContext (transient, not an S4 path) | One value from each tag group | Enum | Required | N/A | N/A | N/A | N/A | Exactly one value per group | N/A | N/A | N/A | N/A | Missing/unknown enum prevents execution; empty result is valid; criteria never relaxed | Recommendation | M01 BR-M01-003; SF-M01-003-01, SF-M01-003-04 | SOURCE-BACKED | Boundary: enum. |
| DAC-M02-001 | M02 | PlaySession | `sessionId`, `sourceHandoffId` | UUID | Required | N/A | N/A | N/A | N/A | N/A | N/A | `sessionId` globally unique; `sourceHandoffId` unique (one handoff creates at most one session) | N/A | N/A | N/A | Session start | M02 §6.1; BR-M02-001 | SOURCE-BACKED | Boundary: identity/uniqueness. |
| DAC-M02-002 | M02 | PlaySession | `status` | Enum | Required | N/A | N/A | `DANG_DIEN_RA`, `HOAN_TAT`, `BO_DO` | N/A | N/A | N/A | At most one `DANG_DIEN_RA` per browser | Terminal states immutable; `HOAN_TAT` requires the final checkpoint visited plus confirmation or automatic end; replacing a session is all-or-nothing | N/A | N/A | Session lifecycle | M02 §6.1; §6.4; BR-M02-002, BR-M02-007, BR-M02-010, BR-M02-013 | SOURCE-BACKED | Boundary: enum. |
| DAC-M02-003 | M02 | PlaySession | `startedAt`, `endedAt` | DateTime | Required / Conditional | `endedAt` required for `HOAN_TAT`/`BO_DO`, absent while `DANG_DIEN_RA` | N/A | N/A | N/A | N/A | N/A | N/A | Automatic end when more than 24 hours have passed since `startedAt` (device clock): `endedAt` = latest `checkedInAt`, or `startedAt` without visits | UTC | N/A | Session lifecycle | M02 §6.1; BR-M02-022 | SOURCE-BACKED | Boundary: date/time (24-hour boundary), conditional presence. |
| DAC-M02-004 | M02 | PlaySession | `routeId`, `contentVersion`, `journeyCheckpoints`, `journeyCheckpoints[].checkpointId`, `journeyCheckpoints[].sequence`, `journeyCheckpoints[].checkpointName`, `journeyCheckpoints[].connectivityMode`, `journeyCheckpoints[].qrIdentifiers` | String / Integer / Array<Object> and members | Required | N/A | checkpointName vi and en non-empty | connectivityMode: `ONLINE_AVAILABLE`, `OFFLINE_REQUIRED` | N/A | `qrIdentifiers` min 1 item | N/A | `checkpointId` and `sequence` unique within the session journey; gaps allowed | Copied from the accepted handoff; immutable for the session life; codes added later are never added | N/A | N/A | Session start | M02 §6.1; §6.3; BR-M02-003, BR-M02-020 | SOURCE-BACKED | Boundary: array, identity/uniqueness. |
| DAC-M02-005 | M02 | CheckpointVisit | `sessionId`, `checkpointId`, `qrIdentifier`, `checkedInAt` | UUID / String / String / DateTime | Required | N/A | N/A | N/A | N/A | N/A | N/A | `(sessionId, checkpointId)` unique; not per QR | `checkpointId` belongs to the frozen journey; `qrIdentifier` may be a code added later (absent from the frozen journey); first `checkedInAt` immutable | UTC | N/A | Check-in | M02 §6.2; BR-M02-004, BR-M02-020 | SOURCE-BACKED | Boundary: identity/uniqueness. |
| DAC-M02-006 | M02 | CheckpointVisit | Visit acceptance (record creation) | Rule | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | Recorded only when the scan is accepted: online `VALID` with a journey checkpoint, or offline/lookup failure with a QR in the frozen journey; no answer within `LOOKUP_TIMEOUT_SECONDS` (provisional 8) counts as lookup failure; `TEMPORARILY_CLOSED`/`INVALID` record nothing | N/A | A content failure never removes a recorded visit | Check-in | M02 BR-M02-005, BR-M02-008, BR-M02-015 | SOURCE-BACKED | Boundary: cross-field. |
| DAC-M02-007 | M02 | PendingSyncItem | `sessionId`, `record`, `record.sessionId` | UUID / Object | Required | N/A | N/A | N/A | N/A | N/A | N/A | At most one queue item per terminal session | `record.sessionId` equals `sessionId`; `record` immutable after creation | N/A | N/A | Terminal transition | M02 §6.4 | SOURCE-BACKED | Boundary: identity/uniqueness. |
| DAC-M02-008 | M02 | PendingSyncItem | `record.routeId`, `record.contentVersion`, `record.status`, `record.startedAt`, `record.endedAt` | String / Integer / Enum / DateTime | Required | N/A | N/A | status: `HOAN_TAT`, `BO_DO` only | N/A | N/A | N/A | N/A | `record.endedAt >= record.startedAt` | UTC | N/A | Terminal transition / sync | M02 §5.1 SessionSyncRecord output; §6.4 | SOURCE-BACKED | Same semantics as DAC-M03-077/078 at intake. Boundary: enum, date/time. |
| DAC-M02-009 | M02 | PendingSyncItem | `record.visitedCheckpoints`, `record.visitedCheckpoints[].checkpointId`, `record.visitedCheckpoints[].checkpointName`, `record.visitedCheckpoints[].sequence`, `record.visitedCheckpoints[].checkedInAt` | Array<Object> and members | Required | Array may be empty for an abandoned session | N/A | N/A | N/A | N/A | N/A | `checkpointId` unique within the session | `checkpointName` is the `vi` branch of the frozen name as a plain string; `sequence` from the frozen journey; `checkedInAt` within the session interval; no name, account, device identifier or GPS | UTC | N/A | Terminal transition / sync | M02 §5.1 SessionSyncRecord output; §6.4 | SOURCE-BACKED | Same semantics as DAC-M03-079/080. Boundary: array. |
| DAC-M02-010 | M02 | PendingSyncItem | `syncStatus` | Enum | Required | N/A | N/A | `PENDING`, `SYNCED`, `CONFLICT` | N/A | N/A | N/A | N/A | Network/server failure stays `PENDING`; identical acknowledgement → `SYNCED`; changed-payload conflict or invalid-record rejection → `CONFLICT`, which stops automatic retry | N/A | N/A | Sync | M02 §6.4; BR-M02-011 | SOURCE-BACKED | Boundary: enum. |
| DAC-M02-011 | M02 | Live QR lookup request (contract, not an S4 path) | `qrIdentifier`, `routeId` | String | Required / Optional | N/A | N/A | N/A | N/A | N/A | N/A | N/A | `qrIdentifier` is the last path segment of `{QR_PUBLIC_BASE_URL}/q/{qrIdentifier}`; `routeId` sent only when a session exists | N/A | Content that is not such a link, or a different base, is an invalid QR without a lookup | Scan | M02 §5.1; BR-M02-019, BR-M02-023 | SOURCE-BACKED | Producer rule: DAC-M03-083. Boundary: N/A. |

### 3.1 Coverage theo S4

Mỗi attribute path của [S4](04-data-model.md) §4 được liệt kê dưới đây. 243/250 path có ít nhất một tiêu chí; 7 path không có quy tắc chấp nhận nào trong spec ngoài kiểu logic và presence đã ghi trong S4.

| Entity | S4 path | DAC IDs |
| --- | --- | --- |
| Route | `routeId` | DAC-M03-001 |
| Route | `status` | DAC-M03-005, DAC-M03-044 |
| Route | `activeContentVersion` | DAC-M03-006 |
| Route | `closureSource` | DAC-M03-007 |
| Route | `closureReason` | DAC-M03-007, DAC-M03-008 |
| Route | `closedAt` | DAC-M03-007 |
| Route | `closedByUserId` | DAC-M03-007 |
| Route | `createdByUserId` | No source rule beyond S4 type/presence |
| Route | `createdAt` | DAC-M03-017 |
| Route | `updatedAt` | DAC-M03-017 |
| Route | `concurrencyRevision` | DAC-M03-016 |
| Checkpoint | `checkpointId` | DAC-M03-001 |
| Checkpoint | `status` | DAC-M03-009, DAC-M03-015, DAC-M03-050 |
| Checkpoint | `locationNote` | DAC-M03-011 |
| Checkpoint | `closureReason` | DAC-M03-008, DAC-M03-010 |
| Checkpoint | `closedAt` | DAC-M03-010 |
| Checkpoint | `closedByUserId` | DAC-M03-010 |
| Checkpoint | `createdByUserId` | No source rule beyond S4 type/presence |
| Checkpoint | `createdAt` | DAC-M03-017 |
| Checkpoint | `updatedAt` | DAC-M03-017 |
| Checkpoint | `concurrencyRevision` | DAC-M03-016 |
| QRCode | `qrIdentifier` | DAC-M03-003, DAC-M03-004 |
| QRCode | `checkpointId` | DAC-M03-012, DAC-M03-089 |
| QRCode | `installationLabel` | DAC-M03-011 |
| QRCode | `status` | DAC-M03-013, DAC-M03-015, DAC-M03-054, DAC-M03-089 |
| QRCode | `statusReason` | DAC-M03-008, DAC-M03-014 |
| QRCode | `createdByUserId` | No source rule beyond S4 type/presence |
| QRCode | `createdAt` | DAC-M03-017 |
| QRCode | `updatedAt` | DAC-M03-017 |
| QRCode | `concurrencyRevision` | DAC-M03-016 |
| Media | `mediaId` | DAC-M03-002 |
| Media | `ownerType` | DAC-M03-055 |
| Media | `ownerId` | DAC-M03-055 |
| Media | `usage` | DAC-M03-055 |
| Media | `type` | DAC-M03-056 |
| Media | `spokenLanguage` | DAC-M03-059 |
| Media | `sourceRef` | No source rule beyond S4 type/presence |
| Media | `mimeType` | DAC-M03-056, DAC-M03-057 |
| Media | `fileSizeBytes` | DAC-M03-058 |
| Media | `usageRightsConfirmed` | DAC-M03-060 |
| Media | `usageRightsConfirmedByUserId` | DAC-M03-060 |
| Media | `usageRightsConfirmedAt` | DAC-M03-017, DAC-M03-060 |
| Media | `createdByUserId` | No source rule beyond S4 type/presence |
| Media | `createdAt` | DAC-M03-017 |
| Media | `concurrencyRevision` | DAC-M03-016 |
| JourneySnapshot | `routeId` | DAC-M03-061 |
| JourneySnapshot | `contentVersion` | DAC-M03-061 |
| JourneySnapshot | `status` | DAC-M03-062 |
| JourneySnapshot | `publishedAt` | DAC-M03-017 |
| JourneySnapshot | `previousContentVersion` | DAC-M03-061 |
| JourneySnapshot | `estimatedOfflineSizeBytes` | DAC-M03-067, DAC-M01-016 |
| JourneySnapshot | `offlineRouteMap` | DAC-M03-066 |
| JourneySnapshot | `offlineRouteMap.sourceRef` | DAC-M03-066 |
| JourneySnapshot | `offlineRouteMap.caption` | DAC-M03-066 |
| JourneySnapshot | `offlineRouteMap.caption.vi` | DAC-M03-066 |
| JourneySnapshot | `offlineRouteMap.caption.en` | DAC-M03-066 |
| JourneySnapshot | `checkpoints` | DAC-M03-063 |
| JourneySnapshot | `checkpoints[].checkpointId` | DAC-M03-063 |
| JourneySnapshot | `checkpoints[].sequence` | DAC-M03-063 |
| JourneySnapshot | `checkpoints[].checkpointName` | DAC-M03-064 |
| JourneySnapshot | `checkpoints[].checkpointName.vi` | DAC-M03-064 |
| JourneySnapshot | `checkpoints[].checkpointName.en` | DAC-M03-064 |
| JourneySnapshot | `checkpoints[].connectivityMode` | DAC-M03-064 |
| JourneySnapshot | `checkpoints[].qrIdentifiers` | DAC-M03-064 |
| JourneySnapshot | `checkpoints[].offlineResources` | DAC-M03-065 |
| JourneySnapshot | `checkpoints[].offlineResources[].qrIdentifier` | DAC-M03-065 |
| JourneySnapshot | `checkpoints[].offlineResources[].objectName` | DAC-M03-065 |
| JourneySnapshot | `checkpoints[].offlineResources[].localizedContent` | DAC-M03-065 |
| JourneySnapshot | `checkpoints[].offlineResources[].localizedContent.vi` | DAC-M03-065 |
| JourneySnapshot | `checkpoints[].offlineResources[].localizedContent.vi.introductionText` | DAC-M03-065 |
| JourneySnapshot | `checkpoints[].offlineResources[].localizedContent.en` | DAC-M03-065 |
| JourneySnapshot | `checkpoints[].offlineResources[].localizedContent.en.introductionText` | DAC-M03-065 |
| JourneySnapshot | `checkpoints[].offlineResources[].staticImages` | DAC-M03-065 |
| AdminAccount | `userId` | DAC-M03-070 |
| AdminAccount | `email` | DAC-M03-068, DAC-M03-069 |
| AdminAccount | `role` | DAC-M03-071 |
| AdminAccount | `status` | DAC-M03-071 |
| AdminAccount | `createdAt` | DAC-M03-017 |
| AdminAccount | `updatedAt` | DAC-M03-017 |
| AdminAccount | `concurrencyRevision` | DAC-M03-016 |
| AuditRecord | `auditId` | DAC-M03-001 |
| AuditRecord | `actorUserId` | DAC-M03-072 |
| AuditRecord | `action` | DAC-M03-075 |
| AuditRecord | `entityType` | DAC-M03-075 |
| AuditRecord | `entityId` | DAC-M03-075 |
| AuditRecord | `revision` | DAC-M03-074 |
| AuditRecord | `reason` | DAC-M03-008, DAC-M03-073 |
| AuditRecord | `outcome` | DAC-M03-074 |
| AuditRecord | `selfPublished` | DAC-M03-074 |
| AuditRecord | `beforeState` | DAC-M03-075 |
| AuditRecord | `afterState` | DAC-M03-075 |
| AuditRecord | `occurredAt` | DAC-M03-017 |
| LanguagePreference | `languageCode` | DAC-M01-001 |
| SelectedRouteContext | `contractVersion` | DAC-M01-002 |
| SelectedRouteContext | `handoffId` | DAC-M01-003 |
| SelectedRouteContext | `routeId` | DAC-M01-004 |
| SelectedRouteContext | `authorizedAt` | DAC-M01-005 |
| SelectedRouteContext | `expiresAt` | DAC-M01-005 |
| SelectedRouteContext | `authorizationStatus` | DAC-M01-006 |
| SelectedRouteContext | `routeJourneyManifest` | DAC-M01-007 |
| SelectedRouteContext | `routeJourneyManifest.routeId` | DAC-M01-004 |
| SelectedRouteContext | `routeJourneyManifest.contentVersion` | DAC-M01-004 |
| SelectedRouteContext | `routeJourneyManifest.checkpoints` | DAC-M01-007 |
| SelectedRouteContext | `routeJourneyManifest.checkpoints[].checkpointId` | DAC-M01-007 |
| SelectedRouteContext | `routeJourneyManifest.checkpoints[].sequence` | DAC-M01-007 |
| SelectedRouteContext | `routeJourneyManifest.checkpoints[].checkpointName` | DAC-M01-007 |
| SelectedRouteContext | `routeJourneyManifest.checkpoints[].connectivityMode` | DAC-M01-007 |
| SelectedRouteContext | `routeJourneyManifest.checkpoints[].qrIdentifiers` | DAC-M01-007 |
| OfflinePackage | `routeId` | DAC-M01-008 |
| OfflinePackage | `contentVersion` | DAC-M01-008 |
| OfflinePackage | `status` | DAC-M01-009, DAC-M01-013 |
| OfflinePackage | `versionStatus` | DAC-M01-009 |
| OfflinePackage | `manifest` | DAC-M01-007 |
| OfflinePackage | `manifest.routeId` | DAC-M01-008 |
| OfflinePackage | `manifest.contentVersion` | DAC-M01-008 |
| OfflinePackage | `manifest.checkpoints` | DAC-M01-007 |
| OfflinePackage | `manifest.checkpoints[].checkpointId` | DAC-M01-007 |
| OfflinePackage | `manifest.checkpoints[].sequence` | DAC-M01-007 |
| OfflinePackage | `manifest.checkpoints[].checkpointName` | DAC-M01-007 |
| OfflinePackage | `manifest.checkpoints[].connectivityMode` | DAC-M01-007 |
| OfflinePackage | `manifest.checkpoints[].qrIdentifiers` | DAC-M01-007 |
| OfflinePackage | `offlineRouteMap` | DAC-M01-010 |
| OfflinePackage | `offlineRouteMap.sourceRef` | DAC-M01-010 |
| OfflinePackage | `offlineRouteMap.caption` | DAC-M01-010 |
| OfflinePackage | `offlineRouteMap.caption.vi` | DAC-M01-010 |
| OfflinePackage | `offlineRouteMap.caption.en` | DAC-M01-010 |
| OfflinePackage | `routeEssentials` | DAC-M01-011 |
| OfflinePackage | `routeEssentials.capturedAt` | DAC-M01-011 |
| OfflinePackage | `routeEssentials.name` | DAC-M01-011 |
| OfflinePackage | `routeEssentials.startingPoint` | DAC-M01-011 |
| OfflinePackage | `routeEssentials.participationRequirements` | DAC-M01-011 |
| OfflinePackage | `routeEssentials.safetyWarning` | DAC-M01-011 |
| OfflinePackage | `downloadedAt` | DAC-M01-012 |
| OfflineResource | `routeId` | DAC-M01-014 |
| OfflineResource | `contentVersion` | DAC-M01-014 |
| OfflineResource | `qrIdentifier` | DAC-M01-014 |
| OfflineResource | `checkpointId` | DAC-M01-014 |
| OfflineResource | `objectName` | DAC-M01-015 |
| OfflineResource | `localizedContent` | DAC-M01-015 |
| OfflineResource | `localizedContent.vi` | DAC-M01-015 |
| OfflineResource | `localizedContent.vi.introductionText` | DAC-M01-015 |
| OfflineResource | `localizedContent.en` | DAC-M01-015 |
| OfflineResource | `localizedContent.en.introductionText` | DAC-M01-015 |
| OfflineResource | `staticImages` | DAC-M01-015 |
| PlaySession | `sessionId` | DAC-M02-001 |
| PlaySession | `sourceHandoffId` | DAC-M02-001 |
| PlaySession | `routeId` | DAC-M02-004 |
| PlaySession | `contentVersion` | DAC-M02-004 |
| PlaySession | `journeyCheckpoints` | DAC-M02-004 |
| PlaySession | `journeyCheckpoints[].checkpointId` | DAC-M02-004 |
| PlaySession | `journeyCheckpoints[].sequence` | DAC-M02-004 |
| PlaySession | `journeyCheckpoints[].checkpointName` | DAC-M02-004 |
| PlaySession | `journeyCheckpoints[].connectivityMode` | DAC-M02-004 |
| PlaySession | `journeyCheckpoints[].qrIdentifiers` | DAC-M02-004 |
| PlaySession | `status` | DAC-M02-002 |
| PlaySession | `startedAt` | DAC-M02-003 |
| PlaySession | `endedAt` | DAC-M02-003 |
| CheckpointVisit | `sessionId` | DAC-M02-005 |
| CheckpointVisit | `checkpointId` | DAC-M02-005 |
| CheckpointVisit | `qrIdentifier` | DAC-M02-005 |
| CheckpointVisit | `checkedInAt` | DAC-M02-005 |
| PendingSyncItem | `sessionId` | DAC-M02-007 |
| PendingSyncItem | `record` | DAC-M02-007 |
| PendingSyncItem | `record.sessionId` | DAC-M02-007 |
| PendingSyncItem | `record.routeId` | DAC-M02-008 |
| PendingSyncItem | `record.contentVersion` | DAC-M02-008 |
| PendingSyncItem | `record.startedAt` | DAC-M02-008 |
| PendingSyncItem | `record.endedAt` | DAC-M02-008 |
| PendingSyncItem | `record.status` | DAC-M02-008 |
| PendingSyncItem | `record.visitedCheckpoints` | DAC-M02-009 |
| PendingSyncItem | `record.visitedCheckpoints[].checkpointId` | DAC-M02-009 |
| PendingSyncItem | `record.visitedCheckpoints[].checkpointName` | DAC-M02-009 |
| PendingSyncItem | `record.visitedCheckpoints[].sequence` | DAC-M02-009 |
| PendingSyncItem | `record.visitedCheckpoints[].checkedInAt` | DAC-M02-009 |
| PendingSyncItem | `syncStatus` | DAC-M02-010 |
| SessionRecord | `sessionId` | DAC-M03-076 |
| SessionRecord | `routeId` | DAC-M03-077 |
| SessionRecord | `contentVersion` | DAC-M03-077 |
| SessionRecord | `startedAt` | DAC-M03-078 |
| SessionRecord | `endedAt` | DAC-M03-078 |
| SessionRecord | `status` | DAC-M03-077 |
| SessionRecord | `visitedCheckpoints` | DAC-M03-079 |
| SessionRecord | `visitedCheckpoints[].checkpointId` | DAC-M03-079 |
| SessionRecord | `visitedCheckpoints[].checkpointName` | DAC-M03-079 |
| SessionRecord | `visitedCheckpoints[].sequence` | DAC-M03-079 |
| SessionRecord | `visitedCheckpoints[].checkedInAt` | DAC-M03-079 |
| SessionRecord | `ingestedAt` | DAC-M03-017 |
| Revision | `revisionId` | DAC-M03-001 |
| Revision | `subjectType` | DAC-M03-018 |
| Revision | `subjectId` | DAC-M03-018 |
| Revision | `revisionNumber` | DAC-M03-019 |
| Revision | `status` | DAC-M03-020 |
| Revision | `content` | DAC-M03-018 |
| Revision | `basedOnRevisionNumber` | DAC-M03-021 |
| Revision | `createdByUserId` | No source rule beyond S4 type/presence |
| Revision | `createdAt` | DAC-M03-017 |
| Revision | `lastEditedByUserId` | No source rule beyond S4 type/presence |
| Revision | `lastEditedAt` | DAC-M03-017 |
| Revision | `publishedByUserId` | DAC-M03-022 |
| Revision | `publishedAt` | DAC-M03-017, DAC-M03-022 |
| Revision | `selfPublished` | DAC-M03-022 |
| Revision | `concurrencyRevision` | DAC-M03-016 |
| Revision | `content.name.vi` | DAC-M03-023, DAC-M03-088 |
| Revision | `content.name.en` | DAC-M03-023, DAC-M03-088 |
| Revision | `content.shortDescription.vi` | DAC-M03-024 |
| Revision | `content.shortDescription.en` | DAC-M03-024 |
| Revision | `content.description.vi` | DAC-M03-025, DAC-M03-087 |
| Revision | `content.description.en` | DAC-M03-025, DAC-M03-087 |
| Revision | `content.startingPoint.vi` | DAC-M03-026, DAC-M03-087 |
| Revision | `content.startingPoint.en` | DAC-M03-026, DAC-M03-087 |
| Revision | `content.participationRequirements.vi` | DAC-M03-027, DAC-M03-087 |
| Revision | `content.participationRequirements.en` | DAC-M03-027, DAC-M03-087 |
| Revision | `content.preparation.vi` | DAC-M03-028, DAC-M03-087 |
| Revision | `content.preparation.en` | DAC-M03-028, DAC-M03-087 |
| Revision | `content.bestTime.vi` | DAC-M03-029, DAC-M03-087 |
| Revision | `content.bestTime.en` | DAC-M03-029, DAC-M03-087 |
| Revision | `content.safetyWarning.vi` | DAC-M03-030, DAC-M03-087 |
| Revision | `content.safetyWarning.en` | DAC-M03-030, DAC-M03-087 |
| Revision | `content.noSafetyWarningConfirmed` | DAC-M03-031 |
| Revision | `content.distanceKm` | DAC-M03-032 |
| Revision | `content.durationMin` | DAC-M03-032 |
| Revision | `content.difficulty` | DAC-M03-033, DAC-M03-035 |
| Revision | `content.groupTags` | DAC-M03-034, DAC-M03-035 |
| Revision | `content.experienceTags` | DAC-M03-034 |
| Revision | `content.thumbnailMediaId` | DAC-M03-036 |
| Revision | `content.galleryItems` | DAC-M03-037 |
| Revision | `content.galleryItems[].mediaId` | DAC-M03-037 |
| Revision | `content.galleryItems[].caption.vi` | DAC-M03-038, DAC-M03-088 |
| Revision | `content.galleryItems[].caption.en` | DAC-M03-038, DAC-M03-088 |
| Revision | `content.routeMapMediaId` | DAC-M03-039 |
| Revision | `content.routeMapCaption.vi` | DAC-M03-038, DAC-M03-088 |
| Revision | `content.routeMapCaption.en` | DAC-M03-038, DAC-M03-088 |
| Revision | `content.offlineRouteMapRequired` | DAC-M03-040 |
| Revision | `content.checkpointList` | DAC-M03-041, DAC-M03-042 |
| Revision | `content.checkpointList[].checkpointId` | DAC-M03-041 |
| Revision | `content.highlights` | DAC-M03-043 |
| Revision | `content.highlights[].vi` | DAC-M03-043, DAC-M03-088 |
| Revision | `content.highlights[].en` | DAC-M03-043, DAC-M03-088 |
| Revision | `content.checkpointName.vi` | DAC-M03-045, DAC-M03-046, DAC-M03-088 |
| Revision | `content.checkpointName.en` | DAC-M03-045, DAC-M03-088 |
| Revision | `content.connectivityMode` | DAC-M03-047, DAC-M03-049 |
| Revision | `content.fieldVerificationConfirmed` | DAC-M03-048 |
| Revision | `content.fieldVerifiedByUserId` | DAC-M03-048 |
| Revision | `content.fieldVerifiedAt` | DAC-M03-017, DAC-M03-048 |
| Revision | `content.objectName.vi` | DAC-M03-051, DAC-M03-088 |
| Revision | `content.objectName.en` | DAC-M03-051, DAC-M03-088 |
| Revision | `content.introductionText.vi` | DAC-M03-052, DAC-M03-087 |
| Revision | `content.introductionText.en` | DAC-M03-052, DAC-M03-087 |
| Revision | `content.mediaItems` | DAC-M03-053 |
| Revision | `content.mediaItems[].mediaId` | DAC-M03-053 |

### 3.2 Boundary classes

Theo Runbook §7.3.8, mỗi tiêu chí có min/max/length/range hoặc quan hệ ngày giờ phải được kiểm thử theo các boundary class dưới đây. Cột Notes của catalog ghi loại boundary áp dụng.

| Criterion type | Boundary classes tối thiểu |
| --- | --- |
| Numeric min/max | `< min`, `= min`, inside range, `= max`, `> max`; với open interval phải test exact boundary. |
| String length | absent/null theo presence rule; empty `""`; whitespace-only; length `min-1/min/max/max+1`; Unicode nếu field cho phép text tự do. |
| Enum | mọi allowed value; unknown value; wrong casing nếu casing canonical. |
| Array | absent nếu conditional/optional; empty; one item; duplicate; max/max+1 nếu max được định nghĩa; order rule nếu có. |
| Date/time | UTC format; equality boundary; before/after; timezone conversion edge; interval containment. |
| Identity/uniqueness | first insert, exact duplicate, conflicting duplicate, same logical identity khác normalization. |
| Cross-field | cả hai missing; chỉ field A; chỉ field B; cả hai valid; cả hai nhưng conflict. |
| Conditional presence | trigger false + absent; trigger false + unexpected value; trigger true + absent; trigger true + valid. |
| Rate/count | zero denominator; lower boundary 0; upper boundary 1; out-of-range negative/>1. |

---

## 4. Open Human Decisions

Danh mục các quyết định còn thiếu cần nhóm sản phẩm / con người phê duyệt (theo Runbook §7.3.6). Khi chốt, sửa canonical spec trước rồi mới sync DAC (Runbook §7.3.7).

| Nhóm | Vấn đề / Quyết định cần xác nhận | Trạng thái |
| --- | --- | --- |
| T1 — Administrative reasons | `Route.closureReason`, `Checkpoint.closureReason`, `QRCode.statusReason`, `AuditRecord.reason`: non-empty, tối đa `NOTE_MAX_CHARS` (300). DAC-M03-008. | RESOLVED — Spec M03 v3.7 (clarification 2) |
| T2 — Admin email | Chuẩn hóa: bỏ khoảng trắng hai đầu, chữ thường toàn bộ, trước khi lưu và so sánh; tối đa `EMAIL_MAX_CHARS` (254). DAC-M03-068, DAC-M03-069. | RESOLVED — Spec M03 v3.7 (clarification 2) |
| T3 — Media type/size | MIME `image/jpeg`, `image/png`, `image/webp`, `audio/mpeg`, `audio/mp4`, `video/mp4`; 1 MB = 1 048 576 byte. DAC-M03-057, DAC-M03-058, DAC-M03-067. | RESOLVED — Spec M03 v3.7 (clarification 2) |
| T4 — QR identifier | Bảng ký tự `A–Z a–z 0–9`, phân biệt hoa thường; tối thiểu 16; không đặt max (hệ thống sinh). DAC-M03-004. | RESOLVED — Spec M03 v3.7 (clarification 2) |
| T5 — Numeric route fields | `distanceKm` > 0, tối đa `ROUTE_DISTANCE_MAX_KM` (100), tối đa 1 chữ số thập phân; `durationMin` > 0, tối đa `ROUTE_DURATION_MAX_MIN` (1440). DAC-M03-032. | RESOLVED — Spec M03 v3.7 (clarification 3) |
| T6 — Collections | Tối đa `ROUTE_CHECKPOINTS_MAX_ITEMS` (30) checkpoint/route; tối đa `CHECKPOINT_QR_MAX_ITEMS` (20) QR object chưa `THU_HOI`/checkpoint; giá trị tag không trùng (tối đa 3 mỗi nhóm); số visit/phiên không có giới hạn riêng (bị chặn bởi số checkpoint của hành trình). DAC-M03-034, DAC-M03-041, DAC-M03-089. | RESOLVED — Spec M03 v3.7 (clarification 3) |
| T7 — Report query | Khoảng ngày tối đa `REPORT_MAX_SPAN_DAYS` (366), hai đầu tính cả; "mặc định 30 ngày" không phải maximum. DAC-M03-085. | RESOLVED — Spec M03 v3.7 (clarification 3) |
| T8 — Long text policy | Văn bản thuần, không markup/HTML; text dài cho phép xuống dòng; tên, caption, highlight một dòng. DAC-M03-087, DAC-M03-088. | RESOLVED — Spec M03 v3.7 (clarification 2) |

Các mục của skeleton V1 (Stable String IDs, `replacementReason`, `reviewReason`, CheckpointContent, `revision`, Email & Account, Media / Resource, Admin Reasons…) đã được thay bằng bảng trên: phần lớn nay có nguồn trong M03 §5.3 và §5.2 (độ dài text, số lượng media, kích thước file, loại file), các field V1 đã bị bỏ, còn lại được ghi thành T1–T8.

Mâu thuẫn trong spec cần làm rõ (không tự reconcile):

| Vị trí | Vấn đề | Cách DAC xử lý |
| --- | --- | --- |
| M03 §6.4 (`AuditRecord.reason`) và BR-M03-F08 | Từng ghi "revoke … of a route or checkpoint", trong khi revoke chỉ áp dụng cho visit point (BR-M03-E09). | RESOLVED — câu chữ đã sửa trong Spec M03 v3.7 (clarification 2); DAC-M03-073. |
| M03 §6.3 (`Media.mimeType`) và §5.3 | §5.3 từng chỉ liệt kê loại tệp, không có giá trị MIME. | RESOLVED — §5.3 và §6.3 nay ghi giá trị MIME (T3). |
| M03 §5.3 và §5.1 / M01 §5.3 | §5.3 gọi giới hạn là provisional, nhưng contract Published Route ghi cứng số (100, 160, 2000…). | Ghi tên hằng số kèm giá trị; nếu đổi hằng số phải sửa cả contract M03/M01. |

---

## 5. Boundary Coverage

### 5.1 Phủ theo ranh giới producer/consumer

Theo dõi phạm vi bao phủ tiêu chuẩn dữ liệu qua các ranh giới:

| Ranh giới | Phạm vi áp dụng | Coverage Status |
| --- | --- | --- |
| Producer M03 → Consumer M01 | Published Route, JourneySnapshot | Covered — DAC-M03-061–067, DAC-M03-081, DAC-M03-082; consumer DAC-M01-016, DAC-M01-017 |
| Producer M01 → Consumer M02 | LanguagePreference, SelectedRouteContext v3, OfflinePackage | Covered — DAC-M01-001–015 (M02 acceptance cited in the same rows) |
| Producer M03 → Consumer M02 | LiveStationContent, QR lookup | Covered — DAC-M03-083, DAC-M03-084; consumer DAC-M02-006, DAC-M02-011 |
| Producer M02 → Consumer M03 | SessionSyncRecord → SessionRecord | Covered — producer DAC-M02-007–010; intake DAC-M03-076–080 (same semantics) |
| Internal M03 | Route, Checkpoint, QRCode, Revision, Media, AdminAccount, AuditRecord | Covered — DAC-M03-001–060, DAC-M03-068–075, DAC-M03-087–089 |

### 5.2 Boundary matrix per criterion

Theo Runbook §7.3.4 và §7.3.9: mỗi tiêu chí có boundary class được liệt kê dưới đây (lấy từ thẻ `Boundary:` trong cột Notes; không thêm quy tắc mới). Bộ tài liệu V2 không có seed, edge-case hay validation artifact, nên mọi dòng ở trạng thái PENDING cho tới khi có bằng chứng downstream chạy thật. 4 tiêu chí có `Boundary: N/A` không nằm trong bảng.

| DAC ID | Boundary classes required | Evidence artifact | Status |
| --- | --- | --- | --- |
| DAC-M03-001 | identity/uniqueness. Max length/pattern: N/A (not an input value) | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-002 | identity/uniqueness | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-003 | identity/uniqueness, string length (min) | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-004 | identity (case-sensitive comparison) | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-005 | enum. No `CHO_DUYET` (BR-M03-A05) | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-006 | conditional presence | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-007 | conditional presence | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-008 | string length | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-009 | enum | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-010 | conditional presence | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-011 | string length | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-012 | cross-field | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-013 | enum. `DA_THAY` removed (BR-M03-E08 retired) | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-014 | conditional presence | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-015 | cross-field | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-016 | identity (equal / stale) | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-017 | date/time (UTC format) | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-018 | enum, cross-field | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-019 | numeric (min), identity/uniqueness | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-020 | enum | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-021 | conditional presence | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-022 | conditional presence | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-023 | string length, conditional presence | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-024 | string length, conditional presence | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-025 | string length, conditional presence | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-026 | string length, conditional presence | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-027 | string length, cross-field | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-028 | string length, cross-field | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-029 | string length, cross-field | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-030 | string length, cross-field | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-031 | cross-field | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-032 | numeric (0 and 0.1 km; 100 and 100.1 km; 1439, 1440 and 1441 minutes), decimal places | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-033 | enum | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-034 | array, enum | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-035 | cross-field | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-036 | conditional presence | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-037 | array | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-038 | string length, cross-field | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-039 | conditional presence | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-040 | cross-field | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-041 | array (29, 30 and 31 items) | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-042 | cross-field | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-043 | array, string length | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-044 | cross-field | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-045 | string length | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-046 | identity/uniqueness | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-047 | enum, conditional presence | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-048 | conditional presence | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-049 | cross-field | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-050 | cross-field | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-051 | string length | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-052 | string length (min-1/min/max/max+1) | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-053 | array, cross-field | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-054 | cross-field | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-055 | enum, cross-field | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-056 | enum | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-057 | enum | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-058 | numeric (max, max+1 byte) | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-059 | enum, conditional presence | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-060 | cross-field | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-061 | numeric (min), identity/uniqueness | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-062 | enum | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-063 | array, identity/uniqueness | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-064 | array, enum | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-065 | conditional presence, array | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-066 | conditional presence, string length | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-067 | numeric (max) | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-068 | identity/uniqueness | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-069 | string length, identity (same address with different case/spaces) | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-070 | conditional presence, uniqueness | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-071 | enum, cross-field | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-072 | conditional presence | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-073 | conditional presence | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-074 | enum | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-075 | N/A (content exclusion) | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-076 | identity/uniqueness | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-077 | enum, cross-field | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-078 | date/time (equality boundary) | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-079 | array, date/time (interval containment) | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-081 | numeric (90/91, 180/181) | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-082 | rate/count (zero) | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-084 | enum, conditional presence | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-085 | date/time, cross-field (spans of 365, 366 and 367 days) | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-086 | rate/count | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-087 | string length (with line breaks) | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M03-089 | array (19, 20 and 21 non-revoked objects; revoked excluded) | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M01-001 | enum | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M01-002 | enum (3 vs 2) | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M01-003 | identity/uniqueness | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M01-004 | cross-field | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M01-005 | date/time (equality at expiresAt) | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M01-006 | enum | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M01-007 | array, identity/uniqueness | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M01-008 | identity/uniqueness, cross-field | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M01-009 | enum, conditional presence | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M01-010 | conditional presence, string length | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M01-011 | string length, cross-field | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M01-012 | date/time | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M01-013 | cross-field | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M01-014 | identity/uniqueness, array | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M01-015 | array | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M01-016 | conditional presence | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M01-017 | enum | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M01-018 | enum | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M02-001 | identity/uniqueness | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M02-002 | enum | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M02-003 | date/time (24-hour boundary), conditional presence | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M02-004 | array, identity/uniqueness | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M02-005 | identity/uniqueness | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M02-006 | cross-field | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M02-007 | identity/uniqueness | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M02-008 | enum, date/time | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M02-009 | array | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |
| DAC-M02-010 | enum | None in the V2 documentation set (no seed or validation artifact) | PENDING (downstream) |

---

## 6. Change History

| Phiên bản | Ngày | Tác giả / Tác vụ | Nội dung thay đổi |
| --- | --- | --- | --- |
| 0.1.0 | 2026-10-26 | Documentation Migration to V2 | Khởi tạo skeleton cấu trúc DAC; ghi nhận trạng thái NOT STARTED — PENDING S4 REBASELINE theo Runbook §7.3. |
| 0.2.0 | 2026-10-28 | P9 — DAC (V2) | Điền catalog 117 tiêu chí từ Spec M01 v3.2 / M02 v3.3 / M03 v3.7 và S4 V2; thêm §3.1 coverage (243/250 path S4) và §3.2 boundary classes; viết lại §4 (T1–T8, mâu thuẫn spec) và §5; bỏ BOM và các ký tự điều khiển hỏng của skeleton. |
| 0.3.0 | 2026-10-28 | P9 — DAC decisions | T1–T4 và T8 được chốt và ghi vào Spec M03 v3.7 (clarification 2); DAC-M03-004, 008, 057, 069, 087 chuyển sang SOURCE-BACKED; thêm DAC-M03-088 (text một dòng); cập nhật DAC-M03-056, 058, 067, 068, 073 và §4–§5. |
| 0.4.0 | 2026-10-28 | P9 — Review gate fixes | Spec M03 v3.7 clarification 3: T5–T7 chuyển sang RESOLVED (DAC-M03-032, 034, 041, 085); thêm DAC-M03-089 (QR object/checkpoint); DAC-M03-070 ghi `userId` unique system-wide; sửa số dòng không thuộc S4 (9); thêm §5.2 ma trận boundary theo từng tiêu chí; tổng 118 tiêu chí. |
| 0.5.0 | 2026-10-28 | P9 — Sync with M03 v3.7 clarification 4 | DAC-M03-068 (MSG-EMAIL-TAKEN, MSG-INVITE-RESENT), DAC-M03-085 (MSG-REPORT-DATES-INVALID), DAC-M03-086 (`routeName` hiển thị của RPT-02); không thêm/bớt tiêu chí, tổng vẫn 118; không thêm trường lưu trữ. |
