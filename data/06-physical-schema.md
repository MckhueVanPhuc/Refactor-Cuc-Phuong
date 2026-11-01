# Physical Schema and Storage — Cúc Phương Quest

## 1. Scope and authority

This document is the V2 physical design baseline. It maps the 16 canonical entities of the [S4 logical model](04-data-model.md) to storage, and it enforces the [Data Acceptance Criteria](08-data-acceptance-criteria.md) (DAC) where the platform can. It follows the passed [review gate](05-review.md) and the architecture in [system configuration](../docs/architecture/system-configuration.md), [tech stack](../docs/architecture/tech-stack.md) and [environment](../docs/architecture/environment.md).

- **Authority.** The specs own behavior. S4 owns logical fields. This document owns physical names, types, keys, constraints, indexes, access rules and transaction boundaries. It adds no business rule: every constraint cites S4, the DAC or a spec rule. A choice that no source dictates is listed in §4 as a technical decision, and a gap that needs a human answer is listed in §14.
- **Documentation only.** The repository holds no SQL, migration, Edge Function, test or runtime configuration (AGENTS.md §2). Names below are the design to implement later; nothing here claims an implemented or deployed schema.
- **One backend, no seed.** There is exactly one Supabase Cloud Project and one Vercel Project (Runbook §1.3). This design provides no seed data and no script that writes test data to the shared backend. Tests use rows created inside rolled-back transactions on a local or ephemeral database, or synthetic fixtures in the browser.

## 2. Storage placement

| Store | Canonical entities | Owner |
|---|---|---|
| Supabase PostgreSQL (schemas `app`, `api`) and Supabase Storage | Route, Checkpoint, QRCode, Revision, Media, JourneySnapshot, AdminAccount, AuditRecord, SessionRecord (9) | M03 |
| Browser IndexedDB through Dexie, database `cuc-phuong-quest` | LanguagePreference, SelectedRouteContext, OfflinePackage, OfflineResource (M01, 4); PlaySession, CheckpointVisit, PendingSyncItem (M02, 3) | M01, M02 |
| Cache Storage | App shell and bundled `vi`/`en` resources only; no business data | M01 |

Contracts, projections and embedded values are not stored as separate entities: Published Route, LiveQrLookupResult/LiveStationContent, `SessionSyncRecord`, `RouteJourneyMap`, `OfflineStationContent`, report outputs, `offlineRouteMap`, `routeEssentials` and every frozen manifest (S1 §7).

## 3. Naming and type mapping

Schema `app` holds private canonical tables and helpers. Schema `api` holds the only objects exposed to the Data API (views and functions). Tables and columns use `snake_case`; JSON keys and IndexedDB fields keep the exact `camelCase` contract names. Embedded paths such as `name.vi` are not split into columns: Revision content, snapshot checkpoints and session visits stay inside their `jsonb` values.

| Logical type (S4) | PostgreSQL | Browser (Dexie) | Source of the choice |
|---|---|---|---|
| String (identifier or text) | `text` | `string` | Specs declare opaque Strings; no format or length is invented. Length limits are CHECK constraints from the DAC (§4, PT-02). |
| UUID | `uuid` (`media_id`, `session_id`) | validated UUID string | S4 declares UUID for `mediaId`, `sessionId`, `handoffId`, `sourceHandoffId` and media references in content. |
| Integer | `integer` | integer number | |
| Decimal (`distanceKm`) | `numeric` (inside content `jsonb`) | number | Range and precision come from DAC-M03-032, not from the type. |
| Boolean | `boolean` | boolean | |
| DateTime (UTC) | `timestamptz` | UTC ISO-8601 string | Spec: all DateTime values are UTC. |
| Enum | `text` with a `CHECK` list | Zod union | PT-03. |
| Object / Array (embedded) | `jsonb` | structured-cloned value | S4 keeps embedded values as logical paths (S4 §12). |
| Required | `NOT NULL` | required property | S4 presence. |
| Optional | nullable | absent property | S4 presence is contract presence, not nullability policy; here a nullable column is the chosen representation. |
| Conditional | nullable, plus a `CHECK` or trigger for the stated condition | validated at the operation boundary | Only the condition S4 states is enforced. |

DBML labels such as `varchar` or `int` in [04-data-model.dbml](04-data-model.dbml) are visualization only and are not used here.

## 4. Technical decisions and limit constants

These choices are not dictated by a spec rule. They can be changed without changing behavior.

| ID | Decision | Why |
|---|---|---|
| PT-01 | System-generated String ids (`route_id`, `checkpoint_id`, `revision_id`, `audit_id`) are produced by one function `app.new_id()` returning an opaque text value (a random UUID rendered as text). Callers never supply them. | BR-M03-B01: system-generated, never input, never reused. The format is opaque. |
| PT-02 | All DAC numeric limits are defined once in an immutable function `app.limit(name text)`. CHECK constraints and validation functions read it. A change of a provisional constant (M03 §5.3) is one migration plus a spec edit. | The constants are provisional; no number is repeated in many places. |
| PT-03 | Enums are `text` plus `CHECK`, not PostgreSQL enum types. | Adding a value later is a constraint change, not a type migration. |
| PT-04 | `concurrency_revision` starts at `1`. The spec states only: the submitted value must equal the stored value, and it advances by exactly one on a mutation. | Initial value is not specified; `1` is arbitrary. |
| PT-05 | `updated_at` is set by a trigger from the database clock. | Source-declared field, no value rule beyond UTC. |
| PT-06 | Operations on a connected set of routes and checkpoints (BR-M03-F05) take transaction-level advisory locks on the sorted ids of the set; a lock that cannot be taken at once raises MSG-ROUTE-BUSY. | Serialize without queueing, as the spec requires. |
| PT-07 | Commands run as `SECURITY DEFINER` functions with fixed `search_path = ''`, explicit `EXECUTE` grants and an in-function role check, because authenticated users have no table DML. | Tech stack §5: definer only when needed, with these safeguards. |
| PT-08 | Text is stored verbatim as plain text and rendered as text; the database does not try to detect markup. Single-line fields reject CR and LF. | M03 §5.3 plain-text policy (DAC-M03-087, 088). |
| PT-09 | Character limits count `char_length(btrim(value, E' \t\r\n'))`. | M03 §5.3: counted after trimming. |

## 5. Backend tables

Common rules for all nine tables: Row Level Security enabled; no `DELETE` or `TRUNCATE` grant and a rejecting trigger (DEC-S6-002, no hard delete or purge in the MVP); a `BEFORE UPDATE` trigger sets `updated_at` where the column exists and requires `concurrency_revision = old + 1` where that column exists.

### 5.1 `app.routes` (Route, REL-005/006/010/011/015/020/022/023/024)

| Column | S4 path | Type | Null | Constraint |
|---|---|---|---|---|
| `route_id` | `routeId` | text | no | PK; default `app.new_id()`; immutable |
| `status` | `status` | text | no | CHECK in `NHAP`, `HOAT_DONG`, `TAM_DONG`, `LUU_TRU`; transitions per S4 §8 enforced by trigger (DAC-M03-005) |
| `active_content_version` | `activeContentVersion` | integer | yes | CHECK: required when status is `HOAT_DONG` or `TAM_DONG` (not forced for `LUU_TRU`: a never-published route can be discarded `NHAP → LUU_TRU`, and the column alone cannot tell it from an archived published route; the publication and archive commands keep the value); deferred composite FK `(route_id, active_content_version)` → `app.journey_snapshots`; must be the highest snapshot of the route (trigger) (DAC-M03-006) |
| `closure_source` | `closureSource` | text | yes | CHECK in `MANUAL`, `AUTO_NO_ACTIVE_CHECKPOINT` |
| `closure_reason` | `closureReason` | text | yes | non-empty and ≤ `NOTE_MAX_CHARS` when present (DAC-M03-008) |
| `closed_at` | `closedAt` | timestamptz | yes | |
| `closed_by_user_id` | `closedByUserId` | text | yes | |
| `created_by_user_id` | `createdByUserId` | text | no | |
| `created_at`, `updated_at` | `createdAt`, `updatedAt` | timestamptz | no | |
| `concurrency_revision` | `concurrencyRevision` | integer | no | PT-04 |

CHECK: when status is `TAM_DONG`, the four `closure_*`/`closed_*` columns are all non-null (DAC-M03-007). Nothing is required of them in other states. Route content is not on this table; it lives in `app.revisions` (subject type `ROUTE`).

### 5.2 `app.checkpoints` (Checkpoint, REL-002/004/017/022/025/030)

| Column | S4 path | Type | Null | Constraint |
|---|---|---|---|---|
| `checkpoint_id` | `checkpointId` | text | no | PK; default `app.new_id()`; immutable |
| `status` | `status` | text | no | CHECK in `NHAP`, `HOAT_DONG`, `TAM_DONG`, `LUU_TRU`; transitions per S4 §8 (DAC-M03-009); archive allowed only when no non-archived route lists it (BR-M03-D10) |
| `location_note` | `locationNote` | text | yes | ≤ `NOTE_MAX_CHARS` (DAC-M03-011) |
| `closure_reason`, `closed_at`, `closed_by_user_id` | `closureReason`, `closedAt`, `closedByUserId` | text, timestamptz, text | yes | all required when `TAM_DONG`; reason non-empty and ≤ `NOTE_MAX_CHARS` (DAC-M03-008, 010) |
| `created_by_user_id`, `created_at`, `updated_at`, `concurrency_revision` | `createdByUserId`, `createdAt`, `updatedAt`, `concurrencyRevision` | as 5.1 | no | |

A checkpoint has no route column: it belongs to no route (M03 §6.4). Name, connectivity mode and field verification live in `app.revisions` (subject type `CHECKPOINT`).

### 5.3 `app.qr_codes` (QRCode, REL-002/026/028)

| Column | S4 path | Type | Null | Constraint |
|---|---|---|---|---|
| `qr_identifier` | `qrIdentifier` | text | no | PK; CHECK matches `^[A-Za-z0-9]{16,}$`; generated from a cryptographically secure source; immutable (DAC-M03-003, 004) |
| `checkpoint_id` | `checkpointId` | text | no | FK → `app.checkpoints`; immutable; insert allowed only if the checkpoint has a saved connectivity mode (DAC-M03-012) |
| `installation_label` | `installationLabel` | text | yes | ≤ `NOTE_MAX_CHARS` (DAC-M03-011) |
| `status` | `status` | text | no | CHECK in `NHAP`, `HOAT_DONG`, `THU_HOI`; `THU_HOI` terminal (DAC-M03-013) |
| `status_reason` | `statusReason` | text | yes | required when a user revokes an active visit point (`HOAT_DONG` → `THU_HOI`, BR-M03-E09); optional on discard (BR-M03-E10); not required when the visit point is revoked automatically by the archive of its checkpoint (BR-M03-D10); non-empty and ≤ `NOTE_MAX_CHARS` when present (DAC-M03-008, 014). The revoke command enforces the requirement; a table CHECK cannot tell the three paths apart |
| `created_by_user_id`, `created_at`, `updated_at`, `concurrency_revision` | `createdByUserId`, `createdAt`, `updatedAt`, `concurrencyRevision` | as 5.1 | no | |

Triggers: a checkpoint in `HOAT_DONG` keeps at least one `HOAT_DONG` QR (deferred constraint trigger, DAC-M03-015); the number of QR objects of a checkpoint whose status is not `THU_HOI` is at most `CHECKPOINT_QR_MAX_ITEMS` (DAC-M03-089). Content lives in `app.revisions` (subject type `QRCODE`). The public link is derived and never stored.

### 5.4 `app.revisions` (Revision, REL-024/025/026/027)

| Column | S4 path | Type | Null | Constraint |
|---|---|---|---|---|
| `revision_id` | `revisionId` | text | no | PK; default `app.new_id()` |
| `subject_type` | `subjectType` | text | no | CHECK in `ROUTE`, `CHECKPOINT`, `QRCODE` |
| `subject_id` | `subjectId` | text | no | polymorphic reference to `routes`, `checkpoints` or `qr_codes`, checked by a constraint trigger (S4 §12 item 6); immutable |
| `revision_number` | `revisionNumber` | integer | no | CHECK ≥ 1; UNIQUE `(subject_type, subject_id, revision_number)`; +1 per new revision; never reused (DAC-M03-019) |
| `status` | `status` | text | no | CHECK in `NHAP`, `PHAT_HANH`, `LUU_TRU`, `DA_BO`; partial UNIQUE `(subject_type, subject_id)` where `NHAP`, and again where `PHAT_HANH`; transitions per S4 §8 (DAC-M03-020) |
| `content` | `content.*` | jsonb | no | validated by `app.revision_content_ok(subject_type, content)` through a trigger on insert and on change of `content` (§5.4.1); immutable once `PHAT_HANH` |
| `based_on_revision_number` | `basedOnRevisionNumber` | integer | yes | |
| `created_by_user_id`, `created_at` | `createdByUserId`, `createdAt` | text, timestamptz | no | |
| `last_edited_by_user_id`, `last_edited_at` | `lastEditedByUserId`, `lastEditedAt` | text, timestamptz | no | |
| `published_by_user_id`, `published_at`, `self_published` | `publishedByUserId`, `publishedAt`, `selfPublished` | text, timestamptz, boolean | yes | all required when status is `PHAT_HANH` or `LUU_TRU`; `self_published` is true when the publisher equals `last_edited_by_user_id` (DAC-M03-022) |
| `concurrency_revision` | `concurrencyRevision` | integer | no | PT-04 |

Only `NHAP` content can be edited; a `PHAT_HANH` revision may only move to `LUU_TRU` (superseding publication, same transaction). A restore inserts a new `NHAP` row copying an earlier published revision. No revision is deleted.

#### 5.4.1 Content validation

`app.revision_content_ok` is a pure function that validates the shape for the subject type. It applies save-time rules always and never requires fields that are "required for publication" (those are checked by the publish command, §8). It is called by a `BEFORE INSERT OR UPDATE OF content` trigger, not by a table CHECK, so a status-only update of an older revision (superseded to `LUU_TRU`) is never re-checked against limits changed later. The restore command inserts the copy inside a savepoint; when the trigger rejects it, the command returns MSG-RESTORE-BLOCKED with the failing items and creates nothing (BR-M03-F07).

| Subject type | Save-time rules enforced by the trigger | DAC |
|---|---|---|
| `ROUTE` | Text fields ≤ their limits (`NAME_MAX_CHARS`, `ROUTE_SHORT_DESC_MAX_CHARS`, `ROUTE_DESC_MAX_CHARS`, `ROUTE_START_MAX_CHARS`, `ROUTE_PARTICIPATION_MAX_CHARS`, `ROUTE_PREPARATION_MAX_CHARS`, `ROUTE_BEST_TIME_MAX_CHARS`, `ROUTE_SAFETY_WARNING_MAX_CHARS`, `CAPTION_MAX_CHARS`); `distanceKm` > 0, ≤ `ROUTE_DISTANCE_MAX_KM`, one decimal place; `durationMin` > 0, ≤ `ROUTE_DURATION_MAX_MIN`; enum values; tag arrays distinct, no `KHO` with `GROUP_GIA_DINH_CO_TRE` or `GROUP_CAN_DE_DANG`; `galleryItems` ≤ `ROUTE_GALLERY_MAX_IMAGES`; `highlights` ≤ `ROUTE_HIGHLIGHTS_MAX_ITEMS`, each text ≤ `ROUTE_HIGHLIGHT_MAX_CHARS` and non-empty; `checkpointList` ≤ `ROUTE_CHECKPOINTS_MAX_ITEMS`, no repeated `checkpointId`; both-or-none pairs are complete or empty when published, not at save; `routeMapCaption` only with `routeMapMediaId`; `offlineRouteMapRequired` true only with `routeMapMediaId`; single-line fields contain no CR/LF | DAC-M03-023–043, 087, 088 |
| `CHECKPOINT` | `checkpointName.*` ≤ `NAME_MAX_CHARS`, single line; `connectivityMode` enum; `fieldVerificationConfirmed` true when `ONLINE_AVAILABLE` | DAC-M03-045, 047, 048 |
| `QRCODE` | `objectName.*` ≤ `NAME_MAX_CHARS`; `introductionText.*` between `QR_INTRO_MIN_CHARS` and `QR_INTRO_MAX_CHARS` once present, long texts may contain line breaks; `mediaItems` ≤ `QR_MAX_IMAGES` images and ≤ `QR_MAX_AV_FILES` audio/video | DAC-M03-051–053, 087, 088 |

The function checks shape only. Rules that need other rows (the referenced media exist, belong to the owner, have the right type and usage; a listed checkpoint exists and was `HOAT_DONG` when added; checkpoint name uniqueness; audio/video only for `ONLINE_AVAILABLE`; mode change blocked while audio/video exist) are enforced by a constraint trigger on `app.revisions` and by the save command. `checkpoint_id` values inside `checkpointList`, and media ids inside content, are the physical form of REL-022 and REL-027.

### 5.5 `app.media` (Media, REL-004/023/027)

| Column | S4 path | Type | Null | Constraint |
|---|---|---|---|---|
| `media_id` | `mediaId` | uuid | no | PK; default `gen_random_uuid()` |
| `owner_type` | `ownerType` | text | no | CHECK in `ROUTE`, `CHECKPOINT` |
| `owner_id` | `ownerId` | text | no | polymorphic reference to `routes` or `checkpoints`, checked by trigger (REL-004, REL-023); immutable |
| `usage` | `usage` | text | no | CHECK in `ROUTE_THUMBNAIL`, `ROUTE_GALLERY`, `ROUTE_MAP`, `QR_MEDIA`; route usages need `type = IMAGE` and `owner_type = ROUTE`; `QR_MEDIA` needs `owner_type = CHECKPOINT` (DAC-M03-055) |
| `type` | `type` | text | no | CHECK in `IMAGE`, `AUDIO`, `VIDEO` |
| `spoken_language` | `spokenLanguage` | text | yes | CHECK in `vi`, `en`, `NONE`; null when `type` is `IMAGE`. For `AUDIO`/`VIDEO` it may be null in a draft (visit point not ready, MSG-AV-LANGUAGE-MISSING) and is required by the publication guard (§8; DAC-M03-059) |
| `source_ref` | `sourceRef` | text | no | bucket-relative object path; not identity; not reused for a different object |
| `mime_type` | `mimeType` | text | no | CHECK: `image/jpeg`, `image/png`, `image/webp` for `IMAGE`; `audio/mpeg`, `audio/mp4` for `AUDIO`; `video/mp4` for `VIDEO` (DAC-M03-056, 057) |
| `file_size_bytes` | `fileSizeBytes` | integer | no | CHECK > 0 and ≤ `IMAGE_MAX_MB`, `AUDIO_MAX_MB` or `VIDEO_MAX_MB` × 1 048 576 by type (DAC-M03-058) |
| `usage_rights_confirmed` | `usageRightsConfirmed` | boolean | no | must be true before a referencing revision is published (publish command, DAC-M03-060) |
| `usage_rights_confirmed_by_user_id`, `usage_rights_confirmed_at` | `usageRightsConfirmedByUserId`, `usageRightsConfirmedAt` | text, timestamptz | yes | both required when confirmed |
| `created_by_user_id`, `created_at`, `concurrency_revision` | `createdByUserId`, `createdAt`, `concurrencyRevision` | text, timestamptz, integer | no | |

A media row is never deleted or overwritten, so earlier revisions and retained snapshots keep valid references. A revision may reference only media of its owner (trigger).

### 5.6 `app.journey_snapshots` (JourneySnapshot, REL-005/006/021/029)

| Column | S4 path | Type | Null | Constraint |
|---|---|---|---|---|
| `route_id` | `routeId` | text | no | FK → `app.routes` |
| `content_version` | `contentVersion` | integer | no | CHECK ≥ 1; PK `(route_id, content_version)` |
| `status` | `status` | text | no | CHECK = `DA_CONG_BO`; a candidate (`DANG_TAO`) is never a row |
| `published_at` | `publishedAt` | timestamptz | no | |
| `previous_content_version` | `previousContentVersion` | integer | yes | CHECK: null when version is 1, else `content_version - 1`; FK `(route_id, previous_content_version)` → same table (REL-021; at most one successor follows from the equation) |
| `estimated_offline_size_bytes` | `estimatedOfflineSizeBytes` | integer | yes | optional estimate |
| `offline_route_map` | `offlineRouteMap.*` | jsonb | yes | shape: `sourceRef` required, optional `caption` with both `vi` and `en`, each ≤ `CAPTION_MAX_CHARS` |
| `checkpoints` | `checkpoints[].*` | jsonb | no | CHECK `app.snapshot_checkpoints_ok(checkpoints)`: array; unique `checkpointId` and `sequence`; non-empty `vi`/`en` names; `qrIdentifiers` non-empty; `offlineResources` present exactly for `OFFLINE_REQUIRED` with one item per identifier, unique within the snapshot, non-empty names and texts |

The table is append-only: updates and deletes are rejected. The composition rules ("every and only active checkpoint of the published list, in list order") and the 50 MB ceiling (`OFFLINE_PACKAGE_MAX_MB`) are checked by the publication and closure commands while the snapshot is built; a deferred check re-verifies the route's new active snapshot against the live sources at commit. Historical snapshots are validated structurally only (DAC-M03-061–067).

### 5.7 `app.admin_accounts` (AdminAccount, REL-007)

| Column | S4 path | Type | Null | Constraint |
|---|---|---|---|---|
| `email` | `email` | text | no | PK; CHECK `email = lower(btrim(email))`, ≤ `EMAIL_MAX_CHARS` (DAC-M03-068, 069) |
| `user_id` | `userId` | text | yes | UNIQUE (nulls allowed); null while `INVITATION_PENDING`, non-null when `ACTIVE` or `DEACTIVATED` (DAC-M03-070, 071) |
| `role` | `role` | text | no | CHECK in `CONTENT_STAFF`, `REVIEWER` |
| `status` | `status` | text | no | CHECK in `INVITATION_PENDING`, `ACTIVE`, `DEACTIVATED`; `INVITATION_PENDING` → `ACTIVE` ↔ `DEACTIVATED` |
| `created_at`, `updated_at`, `concurrency_revision` | `createdAt`, `updatedAt`, `concurrencyRevision` | as 5.1 | no | |

`user_id` holds the provider user id as text. There is no foreign key to `auth.users`: removing a provider identity must not remove an account or its audit history. A statement-level constraint trigger under a lock rejects any role or status change that would leave zero active Reviewers (BR-M03-K03).

### 5.8 `app.audit_records` (AuditRecord, REL-007)

| Column | S4 path | Type | Null | Constraint |
|---|---|---|---|---|
| `audit_id` | `auditId` | text | no | PK; default `app.new_id()` |
| `actor_user_id` | `actorUserId` | text | yes | FK → `app.admin_accounts(user_id)`; null for server provisioning |
| `action` | `action` | text | no | |
| `entity_type`, `entity_id` | `entityType`, `entityId` | text | no | generic reference, no FK |
| `revision` | `revision` | integer | yes | the `revisionNumber` concerned (S1 HC-006) |
| `reason` | `reason` | text | yes | non-empty and ≤ `NOTE_MAX_CHARS` when present |
| `outcome` | `outcome` | text | no | CHECK in `SUCCESS`, `FAILURE` |
| `self_published` | `selfPublished` | boolean | yes | |
| `before_state`, `after_state` | `beforeState`, `afterState` | jsonb | yes | |
| `occurred_at` | `occurredAt` | timestamptz | no | default `now()` |

Append-only: update, delete and truncate are rejected. The spec fixes no list of action names, so `action` is free text. The conditional `reason` (close, reopen, archive, discard, revoke) and the ban on credential or token values in the states are enforced by the command functions that write audit lines; the database cannot recognize them (DAC-M03-072–075).

### 5.9 `app.session_records` (SessionRecord, REL-019/020/029)

| Column | S4 path | Type | Null | Constraint |
|---|---|---|---|---|
| `session_id` | `sessionId` | uuid | no | PK |
| `route_id` | `routeId` | text | no | FK → `app.routes` |
| `content_version` | `contentVersion` | integer | no | FK `(route_id, content_version)` → `app.journey_snapshots` |
| `started_at`, `ended_at` | `startedAt`, `endedAt` | timestamptz | no | CHECK `ended_at >= started_at` (DAC-M03-078) |
| `status` | `status` | text | no | CHECK in `HOAN_TAT`, `BO_DO` |
| `visited_checkpoints` | `visitedCheckpoints[].*` | jsonb | no | CHECK `app.visits_ok(...)`: array (may be empty); unique `checkpointId`; each item has exactly `checkpointId`, `checkpointName`, `sequence`, `checkedInAt`; no other key (privacy allowlist) |
| `ingested_at` | `ingestedAt` | timestamptz | no | default `now()`; not part of the compared payload |

The table is append-only. Items inside `visited_checkpoints` are historical values, not rows: they are not foreign keys to live checkpoints. Their match with the snapshot (`checkpointName` equals the snapshot `vi` name, `sequence` equals the snapshot sequence, `checkedInAt` inside `[started_at, ended_at]`) is checked by the intake function (§7).

## 6. Relationship enforcement

All 25 active relationships of [S3](03-erd-review.md), by how they are enforced.

| REL | Link | Enforcement |
|---|---|---|
| 002 | Checkpoint 1 : 0..* QRCode | FK `qr_codes.checkpoint_id` |
| 005 | Route 1 : 0..* JourneySnapshot | FK `journey_snapshots.route_id` |
| 006 | Route active snapshot | Deferred composite FK + highest-version trigger |
| 007 | AdminAccount 0..1 : 0..* AuditRecord | FK `audit_records.actor_user_id` → `admin_accounts.user_id` |
| 020 | Route 1 : 0..* SessionRecord | FK `session_records.route_id` |
| 021 | Snapshot predecessor | Composite FK + CHECK equation |
| 029 | Snapshot validates SessionRecord | Composite FK `(route_id, content_version)` |
| 004, 023 | Media owner (Checkpoint, Route) | Polymorphic: CHECK on `owner_type` + constraint trigger on `owner_id` |
| 024–026 | Revision subject (Route, Checkpoint, QRCode) | Polymorphic: CHECK on `subject_type` + constraint trigger on `subject_id` |
| 022 | Route lists Checkpoint | References inside route revision content; list rules by CHECK and trigger; reverse lookup by a partial GIN index (§9) |
| 027 | Revision references Media | References inside revision content; owner/type rules by trigger |
| 010, 011, 015, 017, 028, 030 | Browser entity → backend entity (Route, Checkpoint, QRCode) | Historical identity only: no foreign key can exist across stores; validated against the frozen manifest and by Zod |
| 012 | OfflinePackage 1 : 0..* OfflineResource | Local: compound key and index `[routeId+contentVersion]`; deleted together |
| 014 | SelectedRouteContext → PlaySession | Lineage: `PlaySession.sourceHandoffId` copies `handoffId`; unique index; no continuing reference |
| 016 | PlaySession 1 : 0..* CheckpointVisit | Local: key `[sessionId+checkpointId]`, index `sessionId` |
| 018 | PlaySession 1 : 0..1 PendingSyncItem | Local: key `sessionId` |
| 019 | PlaySession → SessionRecord | Lineage through the transport record; no reference |

## 7. Access surface

### 7.1 Public projections (Data API, `anon` and `authenticated`)

| Object | Returns | Rule |
|---|---|---|
| `api.published_routes` (view) | Published Route contract (M03 §5.1) | One row per route that has a `PHAT_HANH` route revision and an active version. Composes route status and active version, published content, referenced media (`sourceRef`, caption), `timeTags` derived from `durationMin` (`TIME_NGAN` ≤ 90, `TIME_VUA` 91–180, `TIME_DAI` > 180), and `checkpointCount`, `hasOfflineRequiredCheckpoint`, `hasOfflineRouteMap`, `checkpointSummaries` from the active snapshot. Owner-executed, `security_barrier`, field whitelist. |
| `api.active_journey_snapshots` (view) | JourneySnapshot contract of each route's active version | Joins `routes.active_content_version`; historical snapshots stay unexposed. |
| `api.lookup_qr(p_qr_identifier text, p_route_id text default null)` (function) | LiveQrLookupResult with LiveStationContent | Trims the identifier; evaluates BR-M03-I02 in order; returns only published content; `content` only for `VALID`; `closedScope` only for `TEMPORARILY_CLOSED`; audio/video only for `ONLINE_AVAILABLE`; a source failure raises an error and is never returned as `INVALID`; writes nothing. |

### 7.2 Terminal intake

`api.ingest_session(p_record jsonb)` is executable by `service_role` only. The Edge Function validates the payload with the strict Zod schema, then calls it. The function: rejects any key outside the `SessionSyncRecord` allowlist; checks `endedAt >= startedAt`, unique visits, `checkedInAt` inside the interval, route known, `(route_id, content_version)` an existing snapshot, and each visit equal to the snapshot by `checkpointId`, `checkpointName` (`vi`) and `sequence`; inserts once; on an existing `session_id` compares the normalized payload and returns `IDENTICAL` or `CONFLICT` without writing. Normalization: JSON key order ignored (`jsonb`), timestamps compared as UTC instants, visits compared as a set keyed by `checkpointId` (§14 O-3, BR-M03-J03). An invalid record raises a validation error and stores nothing. Results: `ACCEPTED`, `IDENTICAL`, `CONFLICT`.

### 7.3 Administration commands (authenticated, role-checked)

Names are proposals. Every command takes the expected `concurrency_revision`, runs in one transaction, appends exactly one audit line (also on failure, written by the caller handler outside the rolled-back transaction) and returns a plain-language message key.

| Command group | Roles | Writes | Spec |
|---|---|---|---|
| Save draft (route, checkpoint, visit point): creates the entity on first save, inserts or updates the single `NHAP` revision, saves the internal note, all in one atomic save | both | `routes`/`checkpoints`/`qr_codes`, `revisions`, `media` (rights ticks) | BR-M03-F11, E15, T03 |
| Publish one unit: validates the publication guard, promotes the draft, supersedes the previous `PHAT_HANH`, builds replacement snapshots for every affected route and switches them with the change | both | `revisions`, state rows, `journey_snapshots`, `routes.active_content_version` | BR-M03-F01–F04, G04–G06, X02 |
| Discard draft; discard a never-published item (reason) | both | `revisions`, state rows | BR-M03-F10, C01, D09, E10 |
| Restore an earlier published revision as a new draft | both | `revisions` | BR-M03-F07 |
| Close route or checkpoint (reason); revoke visit point (reason); reprint (audit only) | both | state rows, snapshots when the journey changes | BR-M03-H01–H03, E07, E09, X02 |
| Reopen (safety note), archive route or checkpoint | Reviewer | state rows, snapshots when the journey changes | BR-M03-H06, H07, H09, D10 |
| Register media; tick usage rights; set spoken language | both | `media` | BR-M03-E14, E17 |
| Accounts: create pending invitation account, link identity on matching callback, change role or status | Reviewer (link is server-side) | `admin_accounts` | BR-M03-K01–K05 |
| Reports: RPT-01 totals and RPT-02 per `(routeId, checkpointId)`, each RPT-02 item labelled with `routeName` read from the route's `PHAT_HANH` revision (`name.vi`) at query time | both | none | BR-M03-J05–J07 (v3.7 clarification 4) |
| History of an item; system-wide audit log | both; audit log Reviewer only | none | BR-M03-F09 |

Reports filter `ended_at >= (fromDate::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh')` and `ended_at < ((toDate + 1)::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh')`, both dates together, a span above `REPORT_MAX_SPAN_DAYS` refused with MSG-REPORT-SPAN, a single date or `fromDate` after `toDate` refused with MSG-REPORT-DATES-INVALID, default window per §14 O-2 (BR-M03-J05). RPT-02 counts distinct `session_id` per `(route_id, checkpointId)` from the `visited_checkpoints` arrays; name and sequence come from the record with the latest `ended_at` in the period, with `session_id` as a deterministic tie-break. `lastSuccessfulIngestionAt` is the maximum `ingested_at`.

## 8. Transactions and integrity

| Operation | Boundary | Spec |
|---|---|---|
| Publish a unit | One transaction. Locks the connected set (PT-06). Re-checks `concurrency_revision` against the reviewed value. Promotes the revision, builds a full snapshot for every affected `HOAT_DONG` or `TAM_DONG` route, inserts them, advances each `active_content_version`, writes audit. A failure to build any snapshot rolls back all of it (MSG-PUBLISH-FAILED). A route's first publication is atomic with version 1. A new version is created only when the resulting snapshot differs from the active one. | BR-M03-F03, F05, G04–G07, X02 |
| Publication guard | Checked inside the command before the transition: required fields in both languages, both-or-none pairs, ≥ 1 active checkpoint in a route list, usage rights confirmed on every referenced media, spoken language on every audio/video, safety warning or the no-warning tick, offline size ≤ `OFFLINE_PACKAGE_MAX_MB`, field verification for `ONLINE_AVAILABLE`, image bytes readable for `OFFLINE_REQUIRED`. | BR-M03-C04, D04, E05, G10, T04, T05 |
| Close or reopen | One transaction with the affected routes' replacement snapshots; a route left without an active checkpoint closes automatically and never reopens automatically. Closing and revoking are never blocked by the size ceiling; reopening is. | BR-M03-H01–H07, T05, X02 |
| Account change | Table lock serializes changes; identity, status and last-active-Reviewer checks run in the transaction. Auth Admin calls are separate and idempotent; only a matching callback sets `ACTIVE`. | BR-M03-K01–K05 |
| Terminal intake | §7.2; single insert, idempotent compare. | BR-M03-J01–J04 |
| Media upload and publication | Upload and verify the object first; publish the reference in the database second. A failed upload changes no public state. | Tech stack §5 |

Immutability: snapshots, `PHAT_HANH` revisions, session records and audit records reject updates (a `PHAT_HANH` revision may only become `LUU_TRU`). Identities and ownership columns (`*_id`, `checkpoint_id` of a QR, `owner_*`, `subject_*`, `email` of an account) are immutable.

## 9. Access control, grants and Storage

| Actor | Public projections and lookup | Admin reads | Direct table DML | Commands | Intake | Audit log |
|---|---|---|---|---|---|---|
| `anon` | yes | no | no | no | no | no |
| Authenticated, no active account | yes | own account row only | no | no | no | no |
| Active `CONTENT_STAFF` | yes | operational data, history, reports | no | allowed set (§7.3) | no | no |
| Active `REVIEWER` | yes | as staff plus accounts | no | all | no | yes |
| `service_role` (Edge Functions) | yes | server-side | no direct DML on `app` | account linking, intake | yes | server-side |

- Every `app` table has RLS enabled. Authenticated users have `SELECT` policies that call `app.current_admin()` (security definer, fixed `search_path`), which finds the active account by `auth.uid()::text = user_id` and `status = 'ACTIVE'` and requires that the session in the JWT (`session_id` claim) still exists in `auth.sessions`, so a token of a signed-out session is refused (BR-M03-K06, SC-M03-040); role and status are never read from JWT metadata (BR-M03-K05). `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE` are revoked from `anon` and `authenticated`; only the definer commands write.
- Functions in `api` have `EXECUTE` revoked from `PUBLIC` and granted explicitly per row of §7. The service-role key is a server secret (`APP_BACKEND_SECRET_KEY`) and never reaches the browser bundle.
- Storage: bucket `quest-media` is private. Active administrators may insert new objects; no policy allows client overwrite or delete. Reads (including creating signed URLs) are allowed for objects referenced by a media row used in a `PHAT_HANH` revision or inside a retained snapshot. An active administrator may also read (and create signed URLs for) any object in the bucket, so that the editor shows files just uploaded and the visitor preview of a draft works (BR-M03-E14, F12); this opens nothing to visitors. Objects referenced by a retained snapshot are never removed. Bytes are uploaded and verified before the database reference is published. `source_ref` is the bucket-relative path; Workbox does not cache signed media responses.

## 10. Indexes

Primary and unique keys implement the declared identities (§5). Extra indexes, each tied to a stated access path:

| Index | Purpose |
|---|---|
| `revisions (subject_type, subject_id, status)` | find the draft or published revision of a subject (F06, public views) |
| `revisions` partial GIN on `content -> 'checkpointList'` for route revisions in `NHAP`/`PHAT_HANH` | reverse lookup "which routes list this checkpoint" for archive guard, closure impact and selection lists (BR-M03-D10, T01, X02) |
| `qr_codes (checkpoint_id, status)` | active-QR rule, lookup, QR count limit |
| `media (owner_type, owner_id)` | owner media listing and reference checks |
| `session_records (ended_at, route_id)` and `(route_id, ended_at)` | global and route-filtered date reports |
| `audit_records (occurred_at desc)`, `(entity_type, entity_id)`, `(actor_user_id)` | audit log and item history |

No index covers visitor identifiers, because none exist. Snapshot JSON is not GIN-indexed.

## 11. Browser-local schema (IndexedDB, Dexie)

One Dexie database, `cuc-phuong-quest`, per browser origin and profile. The Dexie schema version is independent of the app build version and of every `contentVersion`. Writes that must be atomic use one Dexie transaction; network work happens outside it (tech stack §4).

| Store | Key and indexes | Entity or purpose | Held S4 paths |
|---|---|---|---|
| `languagePreference` | PK `slot` (`current`) | LanguagePreference (singleton) | `languageCode` |
| `selectedRouteContext` | PK `slot` (`current`); unique `handoffId` | SelectedRouteContext v3 | all, incl. embedded `routeJourneyManifest` |
| `offlinePackages` | PK `[routeId+contentVersion]`; index `routeId` | OfflinePackage | `status`, `versionStatus`, `manifest`, embedded `offlineRouteMap`, embedded `routeEssentials`, `downloadedAt` |
| `offlineResources` | PK `[routeId+contentVersion+qrIdentifier]`; indexes `[routeId+contentVersion]`, `qrIdentifier` | OfflineResource | all; `qrIdentifier` index lets M02 find a matching resource of an older package |
| `playSessions` | PK `sessionId`; unique `sourceHandoffId`; index `status` | PlaySession | all, incl. frozen `journeyCheckpoints` |
| `checkpointVisits` | PK `[sessionId+checkpointId]`; index `sessionId` | CheckpointVisit | all |
| `pendingSyncItems` | PK `sessionId`; index `syncStatus` | PendingSyncItem | `record` (immutable), `syncStatus` |
| `activePackages` | PK `routeId` | technical pointer to the one active ready package | none |
| `packageCandidates` | PK `routeId` | technical staging bundle with an operation token; never exposed to M02 | none |
| `imageBytes` | PK `[routeId+contentVersion+sourceRef]`; index `[routeId+contentVersion]` | technical Blob storage for declared images and the offline route map; a URL alone is not a downloaded resource | none |

The three technical stores and the `slot` fields are physical representation; they add no entity or transport property.

- **M01.** The preference is saved independently. A new Start validates the source before the write, then replaces the current context in one transaction. Discovering a closure revokes only the current context.
- **Package preparation.** Download outside the transaction; validate the full manifest, the exact set of offline resources and readable bytes; stage with an operation token. Activation is one transaction over candidate, package, resources, bytes and `activePackages`, accepted only for the current token. A failed update leaves the old ready package unchanged. Downloads, updates and deletes are serialized per route by the caller.
- **Local delete.** Remove package, resources, embedded values, bytes, candidate and pointer in one transaction. Keep the handoff, sessions, visits and queue.
- **M02 start or replacement.** Inside one transaction: read the current authorized, unexpired handoff, enforce `sourceHandoffId` uniqueness, abandon any running session (`BO_DO`), insert the new session. A failure leaves the old session intact. Because sessions share one store, competing tabs serialize on the transaction. At most one `DANG_DIEN_RA` exists per browser.
- **Check-in.** Insert the visit once per `[sessionId+checkpointId]` before content is shown; repeated scans keep the first time; a content failure never removes the visit; QRs outside the frozen journey write nothing.
- **Terminal transition.** The terminal status, `endedAt` (24-hour automatic end included) and the frozen `SessionSyncRecord` queue item are written in one transaction, so a reload never finds a terminal session without its queue item (M02 §6.4, one-to-one with the session). Network failure keeps `PENDING`; a conflict or invalid-record rejection becomes `CONFLICT` and stops automatic retry.
- **Recovery.** Reopening restores the running session and pending queue. There is no reset on app update and no remote recovery. M02 never writes M01 stores.
- **Validation.** Zod schemas validate every value at read and write (the M01 and M02 DAC rows). Browser data can be evicted or cleared; persistent storage may be requested but is not guaranteed.

## 12. DAC enforcement map

Where each DAC row is enforced. Every one of the 118 DAC IDs appears below.

| DAC | Enforcement |
|---|---|
| DAC-M03-001, 002 | Identity defaults (`app.new_id()`, `gen_random_uuid()`); never accepted as input |
| DAC-M03-003, 004 | `qr_codes.qr_identifier` CHECK and secure generator |
| DAC-M03-005, 009, 013, 020 | Status CHECK + transition triggers (routes, checkpoints, qr_codes, revisions) |
| DAC-M03-006 | Conditional CHECK + deferred composite FK + highest-version trigger |
| DAC-M03-007, 010, 014 | Conditional CHECKs on closure and status-reason columns |
| DAC-M03-008, 011 | Length CHECKs through `app.limit` (`NOTE_MAX_CHARS`) |
| DAC-M03-012, 015, 089 | Triggers: connectivity mode on QR insert, active checkpoint keeps an active QR, QR count limit |
| DAC-M03-016 | `concurrency_revision` equality in commands and +1 trigger |
| DAC-M03-017 | `timestamptz` columns |
| DAC-M03-018, 019, 021, 022 | Revision CHECKs, UNIQUE key, polymorphic trigger, published-triple CHECK |
| DAC-M03-023–030, 032–035, 038, 040, 043, 045, 047, 048, 051–053, 087, 088 | `app.revision_content_ok` trigger (shape and save-time limits) |
| DAC-M03-031, 036, 037, 039, 041, 042, 044, 046, 049, 050, 054 | Save and publish commands plus constraint triggers (cross-row rules, publication guard, name uniqueness) |
| DAC-M03-055–060 | `app.media` CHECKs; rights tick checked by the publish command |
| DAC-M03-061–066 | `app.journey_snapshots` CHECKs, composite FK, `app.snapshot_checkpoints_ok`, immutability trigger |
| DAC-M03-067 | Publication and reopen commands (50 MB ceiling); close and revoke exempt |
| DAC-M03-068–071 | `app.admin_accounts` CHECKs, UNIQUE, last-Reviewer trigger |
| DAC-M03-072–075 | `app.audit_records` CHECKs and FK; reason and content exclusion in command functions |
| DAC-M03-076–080 | `app.session_records` PK, CHECKs, FK and `api.ingest_session` |
| DAC-M03-081, 082 | `api.published_routes` |
| DAC-M03-083, 084 | `api.lookup_qr` |
| DAC-M03-085, 086 | Report functions |
| DAC-M01-001–018 | Dexie stores of §11 and Zod schemas in the M01 module; DAC-M01-016 and 017 are consumer rules on projections of §7.1 |
| DAC-M02-001–010 | Dexie stores of §11 and Zod schemas in the M02 module |
| DAC-M02-011 | M02 parsing of the QR link and the request to `api.lookup_qr` |

Provisional limits are not copied into this document except by constant name; their values live in M03 §5.3 and `app.limit`.

## 13. Migration and hosting rules

Migrations are not part of this repository. When implementation starts, they are created in this order, each in a single transaction:

1. Schemas, `app.new_id`, `app.limit`, the nine tables with keys, CHECKs and the common update guards.
2. Validation functions (`app.revision_content_ok`, `app.snapshot_checkpoints_ok`, `app.visits_ok`), polymorphic-reference, lifecycle, uniqueness and last-Reviewer triggers.
3. Publication, closure, restore, media and account command functions.
4. RLS policies, grants, `api` views, `api.lookup_qr`, report functions and `api.ingest_session`.
5. Storage bucket `quest-media` and its policies.

Rules (Runbook §1.3, environment.md §§5, 8, 11): the schema is applied only to the single linked Supabase project, after the project reference is verified and after approval; migration history that has been applied is never edited, fixes are appended; remote reset, seed and destructive tests are forbidden on that project. Schema, RLS and function tests run on the Supabase CLI local stack or an ephemeral database with pgTAP, using rows created and rolled back inside each test; coverage that cannot run locally is recorded `NOT RUN`. No hosted resource was provisioned or changed by this design.

## 14. Open items and limits

These three points were open in the first draft of this design and were decided by the product owner on 2026-10-28; the decisions are now written in M03 (v3.7 clarification 3). No open item remains.

| ID | Decision | Source |
|---|---|---|
| O-1 | Checkpoint-name uniqueness compares against both the draft and the published name of every other non-archived checkpoint, under the connected-set lock. | BR-M03-D03 |
| O-2 | Default report window: 30 calendar days ending today in `Asia/Ho_Chi_Minh`, both ends inclusive. | BR-M03-J05 |
| O-3 | Retry comparison ignores the order of `visitedCheckpoints`; visits are compared as a set keyed by `checkpointId`. | BR-M03-J03 |

Limits of this document: it contains no executed validation; SQL, policies and Dexie code do not exist yet, so nothing here is tested. The [S4 DBML](04-data-model.dbml) parser result remains NOT RUN, and this document has no parser result either.

## 15. Technical references

- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) and [database functions](https://supabase.com/docs/guides/database/functions)
- [Supabase database migrations](https://supabase.com/docs/guides/local-development/database-migrations) and [local development](https://supabase.com/docs/guides/local-development/cli/getting-started)
- [Supabase custom schemas](https://supabase.com/docs/guides/api/using-custom-schemas)
- [Supabase database testing](https://supabase.com/docs/guides/database/testing)
- [Dexie schema](https://dexie.org/docs/Version/Version.stores()) and [transactions](https://dexie.org/docs/Dexie/Dexie.transaction())
