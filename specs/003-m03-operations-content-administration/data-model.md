# Data Model — M03 Operations & Content Administration

**Package**: `specs/003-m03-operations-content-administration` | **Date**: 2026-10-29 | **Plan**: [plan.md](plan.md)

## 0. Nguồn và quy tắc

- **Nguồn chuẩn:** field logic, presence, quan hệ, lifecycle lấy từ [S4 Logical Data Model](../../data/04-data-model.md) §3–§9. Tên bảng, cột, kiểu, null, khóa, constraint lấy từ [Physical Schema](../../data/06-physical-schema.md) §3–§9. Ràng buộc số lấy từ [DAC](../../data/08-data-acceptance-criteria.md) và hằng **provisional** của spec-M03 §5.3. Nếu file này lệch với ba nguồn đó, nguồn thắng.
- File này **không thêm** entity, field, kiểu, khóa, nullable, uniqueness hay quan hệ nào. Mỗi bảng dưới đây chép đúng Physical Schema; chỗ nào chỉ tham chiếu thì ghi rõ "xem Physical §x".
- Phân biệt rõ năm loại: **canonical entity** (lưu trữ, §1–§2), **contract/projection** (không lưu như entity, §3), **contract quản trị** (§4), **report output** (§5), **transient UI state** (§6). `SessionSyncRecord` (transport) và `SessionRecord` (entity) không bao giờ bị hợp nhất (AGENTS.md §5).
- Hằng giới hạn chỉ ghi bằng tên (`NAME_MAX_CHARS`…); giá trị nằm ở spec-M03 §5.3, đều là **provisional** (Physical §12, đoạn cuối).
- Kiểu logic ↔ vật lý theo Physical §3: String → `text`; UUID → `uuid`; Integer → `integer`; Decimal → `numeric` (trong `jsonb`); Boolean → `boolean`; DateTime (UTC) → `timestamptz`; Enum → `text` + `CHECK`; Object/Array nhúng → `jsonb`. Phía TypeScript: JSON key giữ camelCase theo contract, adapter ánh xạ sang snake_case.

## 1. Danh sách entity M03 (9 / 16 canonical)

| Entity (S4) | ENT | Bảng vật lý | Identity | Lifecycle (S4 §8) | Bất biến | Ghi bởi (command, xem [admin-command-contract.md](contracts/admin-command-contract.md)) |
|---|---|---|---|---|---|---|
| Route | ENT-DATA-001 | `app.routes` | `route_id` | `NHAP → HOAT_DONG ↔ TAM_DONG → LUU_TRU`; `NHAP → LUU_TRU` (hủy) | `route_id` | save route, publish, close, reopen, archive, discard |
| Checkpoint | ENT-DATA-002 | `app.checkpoints` | `checkpoint_id` | như Route | `checkpoint_id` | save checkpoint, publish, close, reopen, archive, discard |
| QRCode | ENT-DATA-003 | `app.qr_codes` | `qr_identifier` | `NHAP → HOAT_DONG → THU_HOI`; `NHAP → THU_HOI` (hủy) | `qr_identifier`, `checkpoint_id` | save visit point (tạo lần đầu), publish, revoke, discard, archive checkpoint (tự thu hồi) |
| Revision | ENT-DATA-017 | `app.revisions` | `revision_id`; UNIQUE `(subject_type, subject_id, revision_number)` | `NHAP → PHAT_HANH → LUU_TRU`; `NHAP → DA_BO` | `content` khi `PHAT_HANH`; `subject_*` | save draft, publish, discard draft, restore |
| Media | ENT-DATA-005 | `app.media` | `media_id` | không có enum lifecycle; giữ lại sau khi hết tham chiếu | không bao giờ xóa/ghi đè; `owner_*` | register media; tick quyền và ngôn ngữ nói qua save |
| JourneySnapshot | ENT-DATA-006 | `app.journey_snapshots` | PK `(route_id, content_version)` | `DANG_TAO → DA_CONG_BO` (ứng viên không phải dòng) | append-only | publish, close checkpoint, reopen, revoke |
| AdminAccount | ENT-DATA-007 | `app.admin_accounts` | PK `email` (chuẩn hóa); `user_id` UNIQUE khi có | `INVITATION_PENDING → ACTIVE ↔ DEACTIVATED` | `email` | Edge `admin-accounts` (invite/link), change role/status, provision initial Reviewer |
| AuditRecord | ENT-DATA-008 | `app.audit_records` | `audit_id` | ghi một lần | append-only | mọi command |
| SessionRecord | ENT-DATA-016 | `app.session_records` | PK `session_id` | chèn trực tiếp ở trạng thái terminal | append-only | `api.ingest_session` qua Edge `session-intake` |

ENT ID theo [S1 Entity Dictionary](../../data/01-entity-dictionary.md) baseline V2 (đã đối chiếu 2026-10-29; ENT-DATA-004 `CheckpointContent` đã retire). Mọi bảng: RLS bật; không cấp `DELETE`/`TRUNCATE`, có trigger từ chối (DEC-S6-002); trigger `BEFORE UPDATE` đặt `updated_at` và yêu cầu `concurrency_revision = old + 1` khi có cột đó (Physical §5).

## 2. Entity chi tiết

### 2.1 Route — `app.routes` (Physical §5.1; S4 §4 Route)

| Cột | S4 path | Kiểu | Null | Constraint |
|---|---|---|---|---|
| `route_id` | `routeId` | text | no | PK; default `app.new_id()`; bất biến |
| `status` | `status` | text | no | CHECK `NHAP`, `HOAT_DONG`, `TAM_DONG`, `LUU_TRU`; chuyển trạng thái theo S4 §8 (DAC-M03-005) |
| `active_content_version` | `activeContentVersion` | integer | yes | bắt buộc khi `HOAT_DONG`/`TAM_DONG`; FK hoãn `(route_id, active_content_version)` → `app.journey_snapshots`; phải là snapshot cao nhất (DAC-M03-006) |
| `closure_source` | `closureSource` | text | yes | CHECK `MANUAL`, `AUTO_NO_ACTIVE_CHECKPOINT` |
| `closure_reason` | `closureReason` | text | yes | không rỗng, ≤ `NOTE_MAX_CHARS` khi có (DAC-M03-008) |
| `closed_at` | `closedAt` | timestamptz | yes | |
| `closed_by_user_id` | `closedByUserId` | text | yes | |
| `created_by_user_id` | `createdByUserId` | text | no | |
| `created_at`, `updated_at` | `createdAt`, `updatedAt` | timestamptz | no | |
| `concurrency_revision` | `concurrencyRevision` | integer | no | PT-04 |

CHECK: khi `TAM_DONG`, bốn cột `closure_*`/`closed_*` đều khác null (DAC-M03-007). Nội dung tuyến nằm trong `app.revisions` (`subject_type = ROUTE`). Giá trị suy ra (nhãn thời gian, số điểm dừng, cờ offline, danh sách tên) **không** phải attribute (S4 Route).

### 2.2 Checkpoint — `app.checkpoints` (Physical §5.2)

| Cột | S4 path | Kiểu | Null | Constraint |
|---|---|---|---|---|
| `checkpoint_id` | `checkpointId` | text | no | PK; default `app.new_id()`; bất biến |
| `status` | `status` | text | no | CHECK như Route; lưu trữ chỉ khi không tuyến chưa lưu trữ nào liệt kê (BR-M03-D10) |
| `location_note` | `locationNote` | text | yes | ≤ `NOTE_MAX_CHARS` (DAC-M03-011); nội bộ, lưu cùng form, không qua revision |
| `closure_reason`, `closed_at`, `closed_by_user_id` | `closureReason`, `closedAt`, `closedByUserId` | text, timestamptz, text | yes | bắt buộc cả ba khi `TAM_DONG` (DAC-M03-008, 010) |
| `created_by_user_id`, `created_at`, `updated_at`, `concurrency_revision` | như Route | như §5.1 | no | |

Không có cột route: điểm dừng không thuộc tuyến nào (spec-M03 §6.4). Tên, chế độ kết nối, xác nhận khảo sát nằm trong `app.revisions` (`subject_type = CHECKPOINT`).

### 2.3 QRCode — `app.qr_codes` (Physical §5.3)

| Cột | S4 path | Kiểu | Null | Constraint |
|---|---|---|---|---|
| `qr_identifier` | `qrIdentifier` | text | no | PK; CHECK `^[A-Za-z0-9]{16,}$`; sinh từ nguồn ngẫu nhiên an toàn; bất biến (DAC-M03-003, 004) |
| `checkpoint_id` | `checkpointId` | text | no | FK → `app.checkpoints`; bất biến; chỉ insert khi điểm dừng đã lưu chế độ kết nối (DAC-M03-012) |
| `installation_label` | `installationLabel` | text | yes | ≤ `NOTE_MAX_CHARS` |
| `status` | `status` | text | no | CHECK `NHAP`, `HOAT_DONG`, `THU_HOI`; `THU_HOI` terminal (DAC-M03-013) |
| `status_reason` | `statusReason` | text | yes | bắt buộc khi người dùng thu hồi QR đang hoạt động (BR-M03-E09); tùy chọn khi hủy (E10); không cần khi tự thu hồi do lưu trữ điểm dừng (D10); command revoke enforce |
| `created_by_user_id`, `created_at`, `updated_at`, `concurrency_revision` | như Route | | no | |

Trigger: điểm dừng `HOAT_DONG` giữ ≥ 1 QR `HOAT_DONG` (DAC-M03-015); số QR không `THU_HOI` của một điểm dừng ≤ `CHECKPOINT_QR_MAX_ITEMS` (DAC-M03-089). Link công khai `{QR_PUBLIC_BASE_URL}/q/{qrIdentifier}` là giá trị suy ra, **không lưu**.

### 2.4 Revision — `app.revisions` (Physical §5.4; S4 §4 Revision)

| Cột | S4 path | Kiểu | Null | Constraint |
|---|---|---|---|---|
| `revision_id` | `revisionId` | text | no | PK; default `app.new_id()` |
| `subject_type` | `subjectType` | text | no | CHECK `ROUTE`, `CHECKPOINT`, `QRCODE` |
| `subject_id` | `subjectId` | text | no | tham chiếu đa hình, trigger kiểm tra; bất biến |
| `revision_number` | `revisionNumber` | integer | no | ≥ 1; UNIQUE `(subject_type, subject_id, revision_number)`; +1; không dùng lại (DAC-M03-019) |
| `status` | `status` | text | no | CHECK `NHAP`, `PHAT_HANH`, `LUU_TRU`, `DA_BO`; partial UNIQUE `(subject_type, subject_id)` where `NHAP`, và where `PHAT_HANH` (DAC-M03-020) |
| `content` | `content.*` | jsonb | no | trigger gọi `app.revision_content_ok(subject_type, content)` khi chèn hoặc khi `content` đổi (không phải CHECK của bảng); bất biến khi `PHAT_HANH` |
| `based_on_revision_number` | `basedOnRevisionNumber` | integer | yes | |
| `created_by_user_id`, `created_at` | | text, timestamptz | no | |
| `last_edited_by_user_id`, `last_edited_at` | | text, timestamptz | no | dùng cho MSG-STALE và cờ tự xuất bản |
| `published_by_user_id`, `published_at`, `self_published` | | text, timestamptz, boolean | yes | bắt buộc cả ba khi `PHAT_HANH` hoặc `LUU_TRU` (DAC-M03-022) |
| `concurrency_revision` | `concurrencyRevision` | integer | no | PT-04 |

Hình dạng `content` theo `subject_type` — chép đầy đủ ở S4 §4 Revision (bảng "Route content", "Checkpoint content", "QR object content"); không lặp lại ở đây để tránh lệch. Tóm tắt vai trò:

| `subject_type` | Path chính (S4) | Kiểm tra lúc lưu (`app.revision_content_ok`, Physical §5.4.1) | Kiểm tra lúc xuất bản (guard, Physical §8) |
|---|---|---|---|
| `ROUTE` | `name`, `shortDescription`, `description`, `startingPoint` (vi/en); `participationRequirements`, `preparation`, `bestTime`, `safetyWarning` (both-or-none); `noSafetyWarningConfirmed`; `distanceKm`, `durationMin`, `difficulty`; `groupTags`, `experienceTags`; `thumbnailMediaId`, `galleryItems[]`, `routeMapMediaId`, `routeMapCaption`, `offlineRouteMapRequired`; `checkpointList[].checkpointId`; `highlights[]` | Độ dài, khoảng giá trị, một chữ số thập phân, enum, tag phân biệt, không `KHO` + `GROUP_GIA_DINH_CO_TRE`/`GROUP_CAN_DE_DANG`, số phần tử, không lặp `checkpointId`, không CR/LF ở trường một dòng (DAC-M03-023–043, 087, 088) | Đủ song ngữ, both-or-none đầy đủ, ≥ 1 điểm dừng hoạt động, quyền media, tick không cảnh báo, trần offline (BR-M03-C04, T04, T05, G10) |
| `CHECKPOINT` | `checkpointName.vi/.en`, `connectivityMode`, `fieldVerificationConfirmed`, `fieldVerifiedByUserId`, `fieldVerifiedAt` | Độ dài tên, enum mode, xác nhận khi `ONLINE_AVAILABLE` (DAC-M03-045, 047, 048) | ≥ 1 điểm tham quan sẵn sàng, ảnh đọc được cho `OFFLINE_REQUIRED` (BR-M03-D04) |
| `QRCODE` | `objectName.vi/.en`, `introductionText.vi/.en`, `mediaItems[].mediaId` | Độ dài tên, `QR_INTRO_MIN_CHARS`…`QR_INTRO_MAX_CHARS` khi có, số ảnh/AV (DAC-M03-051–053) | Đủ song ngữ, quyền media, `spokenLanguage` cho AV (BR-M03-E05, E17) |

Kiểm tra `content` do trigger `BEFORE INSERT OR UPDATE OF content` gọi `app.revision_content_ok`, không phải CHECK của bảng; nhờ đó đổi trạng thái một revision cũ không bị kiểm lại theo giới hạn mới, và lệnh khôi phục bắt lỗi của trigger để trả MSG-RESTORE-BLOCKED (Physical §5.4.1).

Quy tắc liên dòng (media tồn tại và thuộc owner, điểm dừng trong danh sách là `HOAT_DONG` khi thêm, tên điểm dừng không trùng, AV chỉ cho `ONLINE_AVAILABLE`, chặn đổi mode khi còn AV) do constraint trigger + command lưu thực thi (Physical §5.4.1, đoạn cuối).

### 2.5 Media — `app.media` (Physical §5.5)

| Cột | S4 path | Kiểu | Null | Constraint |
|---|---|---|---|---|
| `media_id` | `mediaId` | uuid | no | PK; default `gen_random_uuid()` |
| `owner_type` | `ownerType` | text | no | CHECK `ROUTE`, `CHECKPOINT` |
| `owner_id` | `ownerId` | text | no | tham chiếu đa hình (REL-004, REL-023); bất biến |
| `usage` | `usage` | text | no | CHECK `ROUTE_THUMBNAIL`, `ROUTE_GALLERY`, `ROUTE_MAP`, `QR_MEDIA`; ràng buộc type/owner (DAC-M03-055) |
| `type` | `type` | text | no | CHECK `IMAGE`, `AUDIO`, `VIDEO` |
| `spoken_language` | `spokenLanguage` | text | yes | CHECK `vi`, `en`, `NONE`; khác null đúng khi `AUDIO`/`VIDEO` (DAC-M03-059) |
| `source_ref` | `sourceRef` | text | no | đường dẫn object tương đối trong bucket; không phải identity; không dùng lại |
| `mime_type` | `mimeType` | text | no | CHECK theo type (DAC-M03-056, 057) |
| `file_size_bytes` | `fileSizeBytes` | integer | no | > 0 và ≤ `IMAGE_MAX_MB`/`AUDIO_MAX_MB`/`VIDEO_MAX_MB` × 1 048 576 (DAC-M03-058) |
| `usage_rights_confirmed` | `usageRightsConfirmed` | boolean | no | phải `true` trước khi revision tham chiếu được xuất bản (DAC-M03-060) |
| `usage_rights_confirmed_by_user_id`, `usage_rights_confirmed_at` | | text, timestamptz | yes | cả hai bắt buộc khi đã xác nhận |
| `created_by_user_id`, `created_at`, `concurrency_revision` | | text, timestamptz, integer | no | |

Không bao giờ xóa hoặc ghi đè; revision chỉ tham chiếu media của owner của nó (trigger). Plan: `source_ref` có dạng `uploads/{ownerType}/{ownerId}/{uploadKey}` ([research.md](research.md) R-11); đây là quy ước đường dẫn, không thêm cột.

### 2.6 JourneySnapshot — `app.journey_snapshots` (Physical §5.6)

| Cột | S4 path | Kiểu | Null | Constraint |
|---|---|---|---|---|
| `route_id` | `routeId` | text | no | FK → `app.routes` |
| `content_version` | `contentVersion` | integer | no | ≥ 1; PK `(route_id, content_version)` |
| `status` | `status` | text | no | CHECK = `DA_CONG_BO` |
| `published_at` | `publishedAt` | timestamptz | no | |
| `previous_content_version` | `previousContentVersion` | integer | yes | null khi version 1, ngược lại `content_version - 1`; FK cùng bảng (REL-021) |
| `estimated_offline_size_bytes` | `estimatedOfflineSizeBytes` | integer | yes | ước tính tùy chọn |
| `offline_route_map` | `offlineRouteMap.*` | jsonb | yes | `sourceRef` bắt buộc; `caption` tùy chọn với cả `vi`/`en` |
| `checkpoints` | `checkpoints[].*` | jsonb | no | CHECK `app.snapshot_checkpoints_ok(checkpoints)` |

Append-only. Quy tắc thành phần ("mọi và chỉ điểm dừng hoạt động của danh sách đã xuất bản, theo thứ tự") và trần `OFFLINE_PACKAGE_MAX_MB` do command publish/close kiểm khi dựng; deferred check xác minh lại snapshot active mới lúc commit (DAC-M03-061–067). Hình dạng `checkpoints[]` = contract `JourneySnapshot` ([publication-public-contract.md](contracts/publication-public-contract.md) §3).

### 2.7 AdminAccount — `app.admin_accounts` (Physical §5.7)

| Cột | S4 path | Kiểu | Null | Constraint |
|---|---|---|---|---|
| `email` | `email` | text | no | PK; CHECK `email = lower(btrim(email))`, ≤ `EMAIL_MAX_CHARS` (DAC-M03-068, 069) |
| `user_id` | `userId` | text | yes | UNIQUE (cho phép null); null khi `INVITATION_PENDING`, khác null khi `ACTIVE`/`DEACTIVATED` (DAC-M03-070, 071) |
| `role` | `role` | text | no | CHECK `CONTENT_STAFF`, `REVIEWER` |
| `status` | `status` | text | no | CHECK `INVITATION_PENDING`, `ACTIVE`, `DEACTIVATED` |
| `created_at`, `updated_at`, `concurrency_revision` | | như §5.1 | no | |

Không FK tới `auth.users`. Constraint trigger cấp câu lệnh dưới khóa từ chối mọi thay đổi để lại 0 Reviewer hoạt động (BR-M03-K03).

### 2.8 AuditRecord — `app.audit_records` (Physical §5.8)

| Cột | S4 path | Kiểu | Null | Constraint |
|---|---|---|---|---|
| `audit_id` | `auditId` | text | no | PK; default `app.new_id()` |
| `actor_user_id` | `actorUserId` | text | yes | FK → `app.admin_accounts(user_id)`; null khi cấp phía server |
| `action` | `action` | text | no | văn bản tự do (spec không cố định danh sách) |
| `entity_type`, `entity_id` | `entityType`, `entityId` | text | no | tham chiếu chung, không FK |
| `revision` | `revision` | integer | yes | `revisionNumber` liên quan (S1 HC-006) |
| `reason` | `reason` | text | yes | không rỗng, ≤ `NOTE_MAX_CHARS` khi có |
| `outcome` | `outcome` | text | no | CHECK `SUCCESS`, `FAILURE` |
| `self_published` | `selfPublished` | boolean | yes | |
| `before_state`, `after_state` | `beforeState`, `afterState` | jsonb | yes | không chứa credential/token |
| `occurred_at` | `occurredAt` | timestamptz | no | default `now()` |

Append-only. Plan decision ([research.md](research.md) R-07): command ghi dòng `FAILURE` ở khối ngoài sau khi khối nghiệp vụ rollback. Danh sách giá trị `action` mà plan dùng (văn bản tự do, chỉ để lọc và hiển thị qua bảng tên hiển thị) nằm ở [admin-command-contract.md](contracts/admin-command-contract.md) §5; UI không bao giờ hiện mã action thô.

### 2.9 SessionRecord — `app.session_records` (Physical §5.9)

| Cột | S4 path | Kiểu | Null | Constraint |
|---|---|---|---|---|
| `session_id` | `sessionId` | uuid | no | PK |
| `route_id` | `routeId` | text | no | FK → `app.routes` |
| `content_version` | `contentVersion` | integer | no | FK `(route_id, content_version)` → `app.journey_snapshots` |
| `started_at`, `ended_at` | `startedAt`, `endedAt` | timestamptz | no | CHECK `ended_at >= started_at` (DAC-M03-078) |
| `status` | `status` | text | no | CHECK `HOAN_TAT`, `BO_DO` |
| `visited_checkpoints` | `visitedCheckpoints[].*` | jsonb | no | CHECK `app.visits_ok(...)`: mảng (có thể rỗng); `checkpointId` duy nhất; mỗi phần tử đúng bốn khóa `checkpointId`, `checkpointName`, `sequence`, `checkedInAt` |
| `ingested_at` | `ingestedAt` | timestamptz | no | default `now()`; không thuộc payload so sánh |

Append-only. Phần tử trong `visited_checkpoints` là giá trị lịch sử, không FK tới điểm dừng live; khớp với snapshot được `api.ingest_session` kiểm tra (Physical §7.2).

## 3. Contract / projection (không phải entity lưu riêng)

Physical §2: các giá trị này không lưu như entity. Hình dạng đầy đủ ở thư mục [contracts/](contracts/).

| Tên (giữ nguyên) | Loại | Nguồn dữ liệu | Producer → Consumer | Contract file |
|---|---|---|---|---|
| Published Route projection | Projection công khai | `api.published_routes` (view) từ `routes` + revision `PHAT_HANH` + media + snapshot active | M03 → M01 | [publication-public-contract.md](contracts/publication-public-contract.md) |
| `JourneySnapshot` | Entity được phát hành nguyên dạng | `api.active_journey_snapshots` (view) | M03 → M01 (rồi qua M01 tới M02) | [publication-public-contract.md](contracts/publication-public-contract.md) |
| `LiveQrLookupResult` với `LiveStationContent` | Transport projection | `api.lookup_qr(...)` từ QR, checkpoint, route, revision `PHAT_HANH`, media | M03 → M02 | [live-qr-lookup-contract.md](contracts/live-qr-lookup-contract.md) |
| `SessionSyncRecord` | Transport contract | Body request tới Edge `session-intake` | M02 → M03; lưu thành `SessionRecord` | [session-intake-contract.md](contracts/session-intake-contract.md) |
| Current published content | Projection của revision `PHAT_HANH` | `app.revisions` | nội bộ M03 | — (AGENTS.md §5: không phải entity mới) |

## 4. Contract quản trị logic (spec-M03 §5.1)

| Tên | Vai trò | Lưu? | File |
|---|---|---|---|
| `ValidationIssue` | Một vấn đề cấp trường hiện cho nhân viên (`severity`, `fieldLabel`, `message`, `messageKey`, `targetItemType`, `targetItemId`, `targetFieldKey`) | Không | [admin-command-contract.md](contracts/admin-command-contract.md) §3 |
| `PublicationReview` | Kết quả mở màn review (`unitType`, `blockingIssues`, `changes`, `sensitiveChanges`, `affectedRoutes[]`, `leftOutCheckpoints`, `leftOutQrObjects`, `impactNotes`, `noSafetyWarningConfirmationRequired`, `reviewedConcurrencyRevision`) | Không; tính khi mở | [admin-command-contract.md](contracts/admin-command-contract.md) §4 |
| `CommandResult` | Bao kết quả command (plan decision R-06) | Không | [admin-command-contract.md](contracts/admin-command-contract.md) §2 |

## 5. Report output (spec-M03 §5.1 "Report outputs")

| Output | Nguồn | Lưu? |
|---|---|---|
| RPT-01 (`totalSessionCount`, `completedCount`, `completedRate`, `abandonedCount`, `abandonedRate`, `lastSuccessfulIngestionAt?`) | query trên `app.session_records` | Không; tính theo yêu cầu |
| RPT-02 (`items[]` theo `(routeId, checkpointId)` với `routeName`, `checkpointName`, `sequence`, `uniqueSessionCount`; `lastSuccessfulIngestionAt?`) | query trên `app.session_records` + `name.vi` của revision `PHAT_HANH` lúc query | Không |

Chi tiết: [admin-command-contract.md](contracts/admin-command-contract.md) §6.

## 6. Transient UI state (không lưu, không phải contract)

| State | Nơi giữ | Ghi chú |
|---|---|---|
| Form editor (tuyến/điểm dừng/điểm tham quan) chưa lưu | React state của editor | Không autosave; không reset khi lưu lỗi/stale (BR-M03-F11, L06) |
| Hàng đợi upload theo tệp: `Đang tải` / `Đã tải` / `Không tải được` | React state | Tên hiển thị §5.4 "Upload state (per file, not stored)"; tệp đã tải nhưng chưa lưu hiện MSG-UPLOADED-NOT-SAVED |
| Readiness hiển thị "Sẵn sàng / Chưa đủ: …" | tính từ dữ liệu đã lưu (server) | §5.4 "Readiness (derived, not stored)" |
| Panel "Còn thiếu để xuất bản" | hàm thuần trên state form | BR-M03-L03 |
| Bản xem trước như du khách | render client của bản nháp | không ghi, không dùng lookup (BR-M03-F12) |
| Phiên đăng nhập provider | Supabase Auth client | không phải `AdminAccount` |
| Registry form chưa lưu cho update service worker | context của shell | R-22 |

## 7. Quan hệ (S4 §5, Physical §6) — phần thuộc M03

| REL | Liên kết | Thực thi vật lý |
|---|---|---|
| REL-002 | Checkpoint 1 : 0..* QRCode | FK `qr_codes.checkpoint_id` |
| REL-004, REL-023 | Media owner (Checkpoint, Route) | CHECK `owner_type` + constraint trigger `owner_id` |
| REL-005 | Route 1 : 0..* JourneySnapshot | FK `journey_snapshots.route_id` |
| REL-006 | Route active snapshot | FK hoãn composite + trigger version cao nhất |
| REL-007 | AdminAccount 0..1 : 0..* AuditRecord | FK `audit_records.actor_user_id` → `admin_accounts.user_id` |
| REL-020 | Route 1 : 0..* SessionRecord | FK `session_records.route_id` |
| REL-021 | Snapshot predecessor | FK composite + CHECK phương trình |
| REL-022 | Route lists Checkpoint (0..* : 0..*) | tham chiếu trong `revisions.content -> 'checkpointList'`; GIN partial index cho tra ngược |
| REL-024–026 | Revision subject (Route/Checkpoint/QRCode) | CHECK `subject_type` + constraint trigger `subject_id` |
| REL-027 | Revision references Media | tham chiếu trong `content`; trigger owner/type |
| REL-029 | Snapshot validates SessionRecord | FK composite `(route_id, content_version)` |
| REL-019 | PlaySession → SessionRecord | lineage qua transport, không tham chiếu |
| REL-010, 011, 015, 017, 028, 030 | Entity trình duyệt → entity backend | chỉ identity lịch sử; không FK xuyên store (thuộc M01/M02) |

## 8. Chuyển trạng thái và guard (S4 §8) — ánh xạ command

| Entity | Chuyển | Command | Guard chính | BR |
|---|---|---|---|---|
| Route | `NHAP → HOAT_DONG` | publish `ROUTE_FIRST_PUBLICATION` | guard xuất bản; atomic với version 1 | C04, C17, F03, F04, T04 |
| Route | `NHAP → LUU_TRU` | discard never-published route (lý do) | chưa từng xuất bản | C01 |
| Route | `HOAT_DONG → TAM_DONG` | close route (lý do) / tự đóng khi đóng điểm dừng | chỉ `HOAT_DONG` | H01–H03, T05 |
| Route | `TAM_DONG → HOAT_DONG` | reopen route (Reviewer, ghi chú an toàn) | trường bắt buộc hợp lệ, ≥ 1 điểm dừng hoạt động | H07 |
| Route | `TAM_DONG → LUU_TRU` | archive route (Reviewer) | chỉ `TAM_DONG` | H09 |
| Checkpoint | `NHAP → HOAT_DONG` | publish `CHECKPOINT_FIRST_PUBLICATION` | ≥ 1 điểm tham quan sẵn sàng; không tạo version | D04, D05 |
| Checkpoint | `NHAP → LUU_TRU` | discard never-published checkpoint (lý do); QR `NHAP` → `THU_HOI` | | D09 |
| Checkpoint | `HOAT_DONG → TAM_DONG` | close checkpoint (lý do) | snapshot mọi tuyến liệt kê, atomic; không bị trần chặn | H02, H04, X02 |
| Checkpoint | `TAM_DONG → HOAT_DONG` | reopen checkpoint (Reviewer) | kiểm tra kỹ thuật H06; trần offline | H06, G10 |
| Checkpoint | `TAM_DONG → LUU_TRU` | archive checkpoint (Reviewer); QR → `THU_HOI` | không tuyến chưa lưu trữ nào liệt kê | D10 |
| QRCode | tạo `NHAP` | lần lưu đầu của form điểm tham quan | điểm dừng có mode đã lưu | E15 |
| QRCode | `NHAP → HOAT_DONG` | publish `QR_OBJECT` / `CHECKPOINT_FIRST_PUBLICATION` | sẵn sàng | E05, E13 |
| QRCode | `NHAP → THU_HOI` | discard QR (lý do tùy chọn) | | E10 |
| QRCode | `HOAT_DONG → THU_HOI` | revoke (lý do) | không phải QR hoạt động cuối của điểm dừng hoạt động | E09, E11 |
| Revision | tạo/sửa `NHAP` | save draft | ≤ 1 `NHAP`; stale check | F06, F11 |
| Revision | `NHAP → PHAT_HANH` (+ cũ `PHAT_HANH → LUU_TRU`) | publish | reviewed `concurrencyRevision` | F02, F03 |
| Revision | `NHAP → DA_BO` | discard draft | | F10 |
| Revision | tạo `NHAP` từ bản cũ | restore | chặn khi đã có bản nháp (MSG-DRAFT-EXISTS); từ chối khi nội dung vi phạm giới hạn hiện hành (MSG-RESTORE-BLOCKED) | F07 |
| JourneySnapshot | ứng viên → `DA_CONG_BO` | trong publish/close/reopen/revoke | khác snapshot active; trần offline (trừ close/revoke) | G01–G07, G10 |
| AdminAccount | → `INVITATION_PENDING` | invite / provision | email chuẩn hóa duy nhất | K01, K04 |
| AdminAccount | `INVITATION_PENDING → ACTIVE` | link sau khi nhận lời mời | email provider khớp | K01 |
| AdminAccount | `ACTIVE ↔ DEACTIVATED`; đổi role | change status / role (Reviewer) | không để 0 Reviewer hoạt động | K03 |
| SessionRecord | chèn | `api.ingest_session` | J01–J03 | J01–J04 |

## 9. Bất biến và giữ lại

- `JourneySnapshot`, revision `PHAT_HANH`, `SessionRecord`, `AuditRecord`: từ chối update; revision `PHAT_HANH` chỉ được thành `LUU_TRU` (Physical §8).
- Cột identity và ownership bất biến: `*_id`, `qr_codes.checkpoint_id`, `owner_*`, `subject_*`, `admin_accounts.email`.
- Không hard-delete, không purge tự động cho 9 entity M03 (DEC-S6-002, BR-M03-D12, G08). Lưu trữ, thu hồi, bỏ, khóa là cập nhật lifecycle.
- Media đã xuất bản không bị ghi đè; object còn được snapshot giữ không bị xóa (constitution IV).

## 10. Phụ thuộc cross-module

| Hướng | Phụ thuộc | Điểm cần giữ |
|---|---|---|
| M03 → M01 | `api.published_routes`, `api.active_journey_snapshots`, signed URL ảnh | M01 chỉ chọn `HOAT_DONG` có `activeContentVersion`; snapshot bất biến |
| M03 → M02 | `api.lookup_qr`, signed URL media online, link `/q/{qrIdentifier}` | lỗi nguồn ≠ `INVALID`; không dữ liệu route trong `VALID` |
| M02 → M03 | Edge `session-intake` → `api.ingest_session` | idempotent; conflict giữ bản ghi đầu; snapshot luôn còn (G08), checklist CHK024 không phát sinh trường hợp hết hạn |
| Auth ↔ M03 | Supabase Auth | provider giữ credential; M03 giữ role/status |
