# Logical Data Model — Cúc Phương Quest

## 1. Document Metadata

| Field | Value |
|---|---|
| Session | 5 — Data Modeling |
| Stage | S4 — Logical Data Model |
| Primary artifacts | [Entity Dictionary](01-entity-dictionary.md), [CRUD Matrix](02-crud-matrix.md), [Conceptual ERD](03-erd.mmd), [ERD Review](03-erd-review.md) |
| Authoritative field/rule sources | [Spec M01](../docs/spec/spec-M01.md) v3.2, [Spec M02](../docs/spec/spec-M02.md) v3.3, [Spec M03](../docs/spec/spec-M03.md) v3.7 |
| Authoritative S4 artifact | This document; [DBML](04-data-model.dbml) is visualization only |
| Status | PASS — S4 (V2) review accepted 2026-10-28; ready for Data Acceptance Criteria ([08](08-data-acceptance-criteria.md)) |

V2 rebaseline (2026-10-28): rebuilt from specs M01 v3.2, M02 v3.3, M03 v3.7 and the V2 S1–S3 artifacts. CheckpointContent (ENT-DATA-004) is retired and Revision (ENT-DATA-017) is modeled; Route, Checkpoint and QRCode keep identity, lifecycle and internal fields while their editable public content lives in Revision; the relationship catalog follows S3 V2 (24 active, 5 retired).

## 2. Modeling Principles

- This model is a pure derivation from the current specs and accepted S1–S3 artifacts.
- It is logical, not physical: no PostgreSQL/Supabase design, indexes, migrations, RLS, triggers or storage policy is prescribed.
- No field, relationship, type or constraint is supplied from general domain knowledge.
- No generic technical fields are added; source-declared fields such as `concurrencyRevision`, `createdAt` and `updatedAt` are retained.
- Embedded frozen values remain embedded logical paths. They are not replaced with live references.
- A source collection represented by an approved canonical child entity is modeled as a relationship rather than duplicated as an `Array<Object>` attribute. Specifically, `OfflinePackage.resources[]` is represented by OfflineResource.
- Editable public content of a Route, Checkpoint or QRCode is modeled once, as `Revision.content`, with one content shape per `subjectType` (M03 §6). It is not duplicated on the subject entity.
- Source-declared logical identifiers are used as given. This model does not assert that every opaque or UUID identifier is a real-world natural key; no unnamed business attribute is promoted into a new key.
- Numeric length, count and size limits declared in the specs (for example `NAME_MAX_CHARS`) are not repeated here; they are catalogued in the Data Acceptance Criteria. This model records presence, non-empty, both-or-none and sign constraints only.
- Embedded frozen contract values remain logical values. Relational 1NF/2NF/3NF are not claimed as completed by the DBML visualization; deliberate embedded values are reviewed in §10.1.
- The DBML uses quoted logical path names and logical Object/Array type labels for visualization. Those labels are not PostgreSQL type choices; this Markdown model remains authoritative.

## 3. Logical Entity Summary

| Entity | Classification | Owner | Logical Identifier | Lifecycle | Notes |
|---|---|---|---|---|---|
| Route | THING | M03 | `routeId` | `NHAP → HOAT_DONG ↔ TAM_DONG → LUU_TRU`; `NHAP → LUU_TRU` on discard | Mutable administrative source; content lives in Revision; archive is not delete. |
| Checkpoint | THING | M03 | `checkpointId` | `NHAP → HOAT_DONG ↔ TAM_DONG → LUU_TRU`; `NHAP → LUU_TRU` on discard | Shared library; belongs to no Route. |
| QRCode | THING | M03 | `qrIdentifier` | `NHAP → HOAT_DONG → THU_HOI`; `NHAP → THU_HOI` on discard | QR object (visit point); reprint preserves identity. |
| CheckpointContent | — | — | — | — | RETIRED (V2): ENT-DATA-004; replaced by Revision. |
| Media | THING | M03 | `mediaId` | No lifecycle enum declared; retained after it stops being referenced | Owned by one Route or one Checkpoint; `sourceRef` is not identity. |
| JourneySnapshot | EVENT | M03 | `(routeId, contentVersion)` | `DANG_TAO → DA_CONG_BO` | Published snapshot is immutable; versions form a single chain. |
| AdminAccount | THING | M03 | normalized `email` | `INVITATION_PENDING → ACTIVE ↔ DEACTIVATED` | Provider `userId` is unique external linkage when present. |
| AuditRecord | EVENT | M03 | `auditId` | Appended once | Append-only; server provisioning may have no actor. |
| LanguagePreference | THING | M01 | singleton current preference slot | Absent before selection; create/replace current value | Standalone entity; no invented relationship. |
| SelectedRouteContext | THING | M01 | `handoffId` | Created `AUTHORIZED`; may become `REVOKED`; later Start replaces current singleton | Complete atomic v3 handoff; expires 24 hours after authorization. |
| OfflinePackage | THING | M01 | `(routeId, contentVersion)` | `CHUA_TAI → DANG_TAI → SAN_SANG` or `CHUA_HOAN_TAT`; ready version is current/outdated | Local deletion is supported; offline route map and route essentials are embedded values. |
| OfflineResource | THING | M01 | `(routeId, contentVersion, qrIdentifier)` | Candidate value; exposed with ready package; removed with package/candidate | One per QR of an offline-required checkpoint; local immutable package value. |
| PlaySession | THING | M02 | `sessionId`; `sourceHandoffId` also unique | `DANG_DIEN_RA → HOAN_TAT` or `BO_DO` | Journey values freeze at creation; terminal state is immutable. |
| CheckpointVisit | EVENT | M02 | `(sessionId, checkpointId)` | Inserted on first accepted check-in | First timestamp is immutable. |
| PendingSyncItem | THING | M02 | `sessionId` | `PENDING → SYNCED` or `CONFLICT` | Embedded transport record is immutable. |
| SessionRecord | EVENT | M03 | `sessionId` | Inserted on first accepted payload | Immutable and idempotent on identical retry. |
| Revision | THING | M03 | `revisionId`; `(subjectType, subjectId, revisionNumber)` also unique | `NHAP → PHAT_HANH → LUU_TRU`; `NHAP → DA_BO` | One subject (Route, Checkpoint or QRCode); `PHAT_HANH` is immutable. |

16 canonical entities: M01 = 4, M02 = 3, M03 = 9. The retired CheckpointContent row is kept for traceability only.

## 4. Entity Definitions

### Route

#### Identity

`routeId` is the stable logical identifier, system-generated, and never changes or is reused.

#### Attributes

| Attribute | Logical Type | Presence | Constraint | Source |
|---|---|---|---|---|
| `routeId` | String | Required | System-generated; stable; never changes; never reused. | M03 §6.1 |
| `status` | Enum(`NHAP`, `HOAT_DONG`, `TAM_DONG`, `LUU_TRU`) | Required | Route lifecycle (§8). | M03 §6.1, §6.4 |
| `activeContentVersion` | Integer | Conditional | Required once the Route has been published; references the highest `DA_CONG_BO` JourneySnapshot of the same Route. Absent for a Route never published. | M03 §6.1, §6.4 |
| `closureSource` | Enum(`MANUAL`, `AUTO_NO_ACTIVE_CHECKPOINT`) | Conditional | Required while `TAM_DONG`. | M03 §6.1 |
| `closureReason` | String | Conditional | Required while `TAM_DONG`; internal, never exposed to visitors. | M03 §6.1 |
| `closedAt` | DateTime | Conditional | Required while `TAM_DONG`; UTC. | M03 §6.1 |
| `closedByUserId` | String | Conditional | Required while `TAM_DONG`; for an automatic closure, the user whose checkpoint closure triggered it. | M03 §6.1 |
| `createdByUserId` | String | Required | — | M03 §6.1 |
| `createdAt` | DateTime | Required | UTC. | M03 §6.1 |
| `updatedAt` | DateTime | Required | UTC. | M03 §6.1 |
| `concurrencyRevision` | Integer | Required | Submitted value must match stored value; stale writes are rejected. | M03 §6.1 |

Route content (names, descriptions, measures, tags, images, `checkpointList`, highlights) is the Revision content with `subjectType = ROUTE` (Revision, M03 §6.1.1). The time tag, checkpoint count, offline-required flag and checkpoint name list are derived and are not attributes (M03 §6.1.1).

#### Relationships

| Related Entity | Cardinality | Logical Reference | Rule | Source |
|---|---|---|---|---|
| Checkpoint | `0..* : 0..*` | `Revision(subjectType = ROUTE).content.checkpointList[].checkpointId → Checkpoint.checkpointId` | Lists checkpoints in its own order; a checkpoint appears at most once. | REL-022 |
| Media | `0..1 : 0..*` | `Media.(ownerType = ROUTE, ownerId) → routeId` | Owns route images. | REL-023 |
| Revision | `0..1 : 0..*` | `Revision.(subjectType = ROUTE, subjectId) → routeId` | Has revisions; at most one `NHAP` and one `PHAT_HANH`. | REL-024 |
| JourneySnapshot | `1 : 0..*` | `JourneySnapshot.routeId → Route.routeId` | Produces immutable versions. | REL-005 |
| JourneySnapshot | `0..1 : 0..1` | `(Route.routeId, Route.activeContentVersion) → (JourneySnapshot.routeId, JourneySnapshot.contentVersion)` | Selects the active published version. | REL-006 |
| SelectedRouteContext | `1 : 0..1` | `SelectedRouteContext.routeId → Route.routeId` | Current context selects one route. | REL-010 |
| OfflinePackage | `1 : 0..*` | `OfflinePackage.routeId → Route.routeId` | Package covers one route/version. | REL-011 |
| PlaySession | `1 : 0..*` | `PlaySession.routeId → Route.routeId` | Session freezes one route identity. | REL-015 |
| SessionRecord | `1 : 0..*` | `SessionRecord.routeId → Route.routeId` | Historical sessions report by route. | REL-020 |

#### Lifecycle / Immutability

Discard of a never-published Route, archive and emergency close/reopen are lifecycle updates, not deletion. A Route never reopens automatically. Public content changes only through publication of a Revision after the mandatory review; stale mutations are rejected.

#### Decision Status

No outstanding decision.

### Checkpoint

#### Identity

`checkpointId` is the stable logical identifier, system-generated and never reused.

#### Attributes

| Attribute | Logical Type | Presence | Constraint | Source |
|---|---|---|---|---|
| `checkpointId` | String | Required | System-generated; stable; never reused. | M03 §6.2 |
| `status` | Enum(`NHAP`, `HOAT_DONG`, `TAM_DONG`, `LUU_TRU`) | Required | Checkpoint lifecycle (§8). | M03 §6.2, §6.4 |
| `locationNote` | String | Optional | Internal area note saved with the checkpoint form; not part of a revision; never public. | M03 §6.2; BR-M03-F11 |
| `closureReason` | String | Conditional | Required while `TAM_DONG`; internal. | M03 §6.2 |
| `closedAt` | DateTime | Conditional | Required while `TAM_DONG`; UTC. | M03 §6.2 |
| `closedByUserId` | String | Conditional | Required while `TAM_DONG`; internal. | M03 §6.2 |
| `createdByUserId` | String | Required | — | M03 §6.2 |
| `createdAt` | DateTime | Required | UTC. | M03 §6.2 |
| `updatedAt` | DateTime | Required | UTC. | M03 §6.2 |
| `concurrencyRevision` | Integer | Required | Used for stale-write rejection. | M03 §6.2 |

Checkpoint name, connectivity mode and field verification are the Revision content with `subjectType = CHECKPOINT` (M03 §6.2.1). A Checkpoint belongs to no Route; its position in a route is the order of that route's `checkpointList` (M03 §6.4).

#### Relationships

| Related Entity | Cardinality | Logical Reference | Rule | Source |
|---|---|---|---|---|
| Route | `0..* : 0..*` | `Revision(subjectType = ROUTE).content.checkpointList[].checkpointId → checkpointId` | Listed by zero or more Routes. | REL-022 |
| QRCode | `1 : 0..*` | `QRCode.checkpointId → checkpointId` | Active checkpoint must retain at least one active QRCode. | REL-002 |
| Media | `0..1 : 0..*` | `Media.(ownerType = CHECKPOINT, ownerId) → checkpointId` | Owns media of its visit points. | REL-004 |
| Revision | `0..1 : 0..*` | `Revision.(subjectType = CHECKPOINT, subjectId) → checkpointId` | Has revisions. | REL-025 |
| CheckpointVisit | `1 : 0..*` | `CheckpointVisit.checkpointId → checkpointId` | Visit refers to a frozen journey checkpoint. | REL-017 |

#### Lifecycle / Immutability

First publication, close, reopen, archive and discard are lifecycle updates. Archive is allowed only when no non-archived Route lists the Checkpoint. `LUU_TRU` is terminal in the MVP; no deletion is declared.

#### Decision Status

No outstanding decision.

### QRCode

#### Identity

`qrIdentifier` is system-generated at the first save of the visit point form, globally unique, stable and never reused.

#### Attributes

| Attribute | Logical Type | Presence | Constraint | Source |
|---|---|---|---|---|
| `qrIdentifier` | String | Required | Globally unique stable identity; never reused. | M03 §6.2; BR-M03-B02, BR-M03-E15 |
| `checkpointId` | String | Required | Belongs to exactly one Checkpoint; never changes. | M03 §6.2; BR-M03-E12 |
| `installationLabel` | String | Optional | Internal placement note saved with the visit point form; not visitor content. | M03 §6.2; BR-M03-F11 |
| `status` | Enum(`NHAP`, `HOAT_DONG`, `THU_HOI`) | Required | `THU_HOI` is terminal. | M03 §6.2, §6.4 |
| `statusReason` | String | Conditional | Required for `THU_HOI` by revoke; optional for a discarded draft. | M03 §6.2 |
| `createdByUserId` | String | Required | — | M03 §6.2 |
| `createdAt` | DateTime | Required | UTC. | M03 §6.2 |
| `updatedAt` | DateTime | Required | UTC. | M03 §6.2 |
| `concurrencyRevision` | Integer | Required | Used for stale-write rejection. | M03 §6.2 |

Object name, introduction and media list are the Revision content with `subjectType = QRCODE` (M03 §6.2.2). The public QR link is derived from `qrIdentifier` and is not stored (M03 §6.2; BR-M03-B04).

#### Relationships

| Related Entity | Cardinality | Logical Reference | Rule | Source |
|---|---|---|---|---|
| Checkpoint | `1 : 1` from QRCode | `checkpointId → Checkpoint.checkpointId` | Belongs to one Checkpoint; exists only for a checkpoint with a saved connectivity mode. | REL-002 |
| Revision | `0..1 : 0..*` | `Revision.(subjectType = QRCODE, subjectId) → qrIdentifier` | Has revisions carrying its own content. | REL-026 |
| OfflineResource | `1 : 0..*` | `OfflineResource.qrIdentifier → qrIdentifier` | Local offline copies of this QR object. | REL-028 |

#### Lifecycle / Immutability

Reprint does not change identity. Revoke and discard change lifecycle state and never delete the QRCode; archiving its checkpoint revokes it automatically.

#### Decision Status

No outstanding decision.

### CheckpointContent

RETIRED (V2). ENT-DATA-004 is retired in S1: content belongs to each QR object and every content version is a Revision (M03 §6.3). Its V1 attributes and REL-003, REL-008 and REL-009 are not modeled; see Revision.

### Media

#### Identity

`mediaId` is the stable logical identity. `sourceRef` is a resource/storage reference and is not identity.

#### Attributes

| Attribute | Logical Type | Presence | Constraint | Source |
|---|---|---|---|---|
| `mediaId` | UUID | Required | System-generated logical identity. | M03 §6.3 |
| `ownerType` | Enum(`ROUTE`, `CHECKPOINT`) | Required | Route media belong to a Route; media of visit points belong to a Checkpoint. | M03 §6.3 |
| `ownerId` | String | Required | The `routeId` or `checkpointId` of the owner. | M03 §6.3 |
| `usage` | Enum(`ROUTE_THUMBNAIL`, `ROUTE_GALLERY`, `ROUTE_MAP`, `QR_MEDIA`) | Required | Route usages require `type = IMAGE` and `ownerType = ROUTE`; `QR_MEDIA` requires `ownerType = CHECKPOINT`. | M03 §6.3 |
| `type` | Enum(`IMAGE`, `AUDIO`, `VIDEO`) | Required | Offline resources include images only. | M03 §6.3 |
| `spokenLanguage` | Enum(`vi`, `en`, `NONE`) | Conditional | Required for `AUDIO` and `VIDEO`; absent for `IMAGE`. | M03 §6.3; BR-M03-E17 |
| `sourceRef` | String | Required | Resource/storage reference; not identity. | M03 §6.3 |
| `mimeType` | String | Required | Supported file type. | M03 §6.3 |
| `fileSizeBytes` | Integer | Required | Greater than `0`; within the per-type limit. | M03 §6.3 |
| `usageRightsConfirmed` | Boolean | Required | Must be `true` before any revision referencing it is published; confirmed file by file. | M03 §6.3; BR-M03-E14 |
| `usageRightsConfirmedByUserId` | String | Conditional | Required when confirmed. | M03 §6.3 |
| `usageRightsConfirmedAt` | DateTime | Conditional | Required when confirmed; UTC. | M03 §6.3 |
| `createdByUserId` | String | Required | — | M03 §6.3 |
| `createdAt` | DateTime | Required | UTC. | M03 §6.3 |
| `concurrencyRevision` | Integer | Required | Used for stale-write rejection. | M03 §6.3 |

#### Relationships

| Related Entity | Cardinality | Logical Reference | Rule | Source |
|---|---|---|---|---|
| Route | `0..1 : 1` from Media | `(ownerType = ROUTE, ownerId) → Route.routeId` | Owned by one Route, or else by a Checkpoint. | REL-023 |
| Checkpoint | `0..1 : 1` from Media | `(ownerType = CHECKPOINT, ownerId) → Checkpoint.checkpointId` | Owned by one Checkpoint, or else by a Route. | REL-004 |
| Revision | `0..* : 0..*` | Media IDs in `Revision.content` → `mediaId` | Referenced only by revisions of its owner. | REL-027 |

#### Lifecycle / Immutability

The source does not declare a Media lifecycle enum. Media is retained after it stops being referenced, so earlier revisions can be restored; public output includes only media referenced by a `PHAT_HANH` revision.

#### Decision Status

No outstanding decision.

### JourneySnapshot

#### Identity

The composite logical identifier is `(routeId, contentVersion)`.

#### Attributes

| Attribute | Logical Type | Presence | Constraint | Source |
|---|---|---|---|---|
| `routeId` | String | Required | References the owning Route. | M03 §5.1 |
| `contentVersion` | Integer | Required | Starts at `1` and increases by exactly `1` per published snapshot of the Route. | M03 §5.1 |
| `status` | Enum(`DA_CONG_BO`) | Required | Published snapshot state. | M03 §5.1 |
| `publishedAt` | DateTime | Required | UTC. | M03 §5.1 |
| `previousContentVersion` | Integer | Optional | Absent for version `1`; otherwise `contentVersion - 1` of the same Route. | M03 §5.1, §6.4 |
| `estimatedOfflineSizeBytes` | Integer | Optional | Estimate of what is downloaded for offline use; consumers tolerate its absence. | M03 §5.1; BR-M03-G10 |
| `offlineRouteMap` | Object | Optional | Present only when the route map is marked as needed offline. | M03 §5.1; BR-M03-C16 |
| `offlineRouteMap.sourceRef` | String | Conditional | Required when `offlineRouteMap` is present. | M03 §5.1 |
| `offlineRouteMap.caption` | Object | Optional | Both-or-none language branches. | M03 §5.1 |
| `offlineRouteMap.caption.vi` | String | Conditional | Required when `caption` is present. | M03 §5.1 |
| `offlineRouteMap.caption.en` | String | Conditional | Required when `caption` is present. | M03 §5.1 |
| `checkpoints` | Array&lt;Object&gt; | Required | Every and only active checkpoint; IDs/sequences unique; may be empty only when the Route is not `HOAT_DONG`. | M03 §5.1 |
| `checkpoints[].checkpointId` | String | Required | Stable frozen checkpoint identity. | M03 §5.1 |
| `checkpoints[].sequence` | Integer | Required | Unique within snapshot; 1-based position in the route's list; gaps allowed. | M03 §5.1 |
| `checkpoints[].checkpointName` | Object | Required | Frozen display name for this version. | M03 §5.1 |
| `checkpoints[].checkpointName.vi` | String | Required | Non-empty. | M03 §5.1 |
| `checkpoints[].checkpointName.en` | String | Required | Non-empty. | M03 §5.1 |
| `checkpoints[].connectivityMode` | Enum(`ONLINE_AVAILABLE`, `OFFLINE_REQUIRED`) | Required | Frozen connectivity classification. | M03 §5.1 |
| `checkpoints[].qrIdentifiers` | Array&lt;String&gt; | Required | Non-empty active identifiers only. | M03 §5.1 |
| `checkpoints[].offlineResources` | Array&lt;Object&gt; | Conditional | Required only for `OFFLINE_REQUIRED`; exactly one item per identifier in `qrIdentifiers`. | M03 §5.1 |
| `checkpoints[].offlineResources[].qrIdentifier` | String | Conditional | Required for every item; unique within the snapshot; an identifier of the same checkpoint. | M03 §5.1 |
| `checkpoints[].offlineResources[].objectName` | Object | Conditional | Required for every item; `vi` and `en` both required, non-empty. | M03 §5.1 |
| `checkpoints[].offlineResources[].localizedContent` | Object | Conditional | Required for every item. | M03 §5.1 |
| `checkpoints[].offlineResources[].localizedContent.vi` | Object | Conditional | Required for every item. | M03 §5.1 |
| `checkpoints[].offlineResources[].localizedContent.vi.introductionText` | String | Conditional | Required for every item; non-empty. | M03 §5.1 |
| `checkpoints[].offlineResources[].localizedContent.en` | Object | Conditional | Required for every item. | M03 §5.1 |
| `checkpoints[].offlineResources[].localizedContent.en.introductionText` | String | Conditional | Required for every item; non-empty. | M03 §5.1 |
| `checkpoints[].offlineResources[].staticImages` | Array&lt;String&gt; | Conditional | Required for every item; may be empty; image references of that QR object. | M03 §5.1 |

#### Relationships

| Related Entity | Cardinality | Logical Reference | Rule | Source |
|---|---|---|---|---|
| Route | `1 : 1` from snapshot | `routeId → Route.routeId` | Belongs to one Route/version. | REL-005 |
| Route | `0..1 : 0..1` | `(routeId, contentVersion) ← (Route.routeId, Route.activeContentVersion)` | May be the Route active version. | REL-006 |
| JourneySnapshot | `0..1 predecessor : 0..1 successor` | `(routeId, previousContentVersion) → (routeId, contentVersion)` | Same-Route single version chain. | REL-021; M03 §6.4 CL-S4-001 |
| SessionRecord | `1 : 0..*` | `(SessionRecord.routeId, SessionRecord.contentVersion) → (routeId, contentVersion)` | Accepted sessions are validated against this snapshot. | REL-029 |

#### Lifecycle / Immutability

`DANG_TAO → DA_CONG_BO` is the build/publication lifecycle; a candidate consumes no version number. The persisted public contract is `DA_CONG_BO` and immutable. The snapshots of all routes affected by one change switch together or not at all. Persisted snapshots are retained without MVP hard-delete or automatic purge (M03 §6.4 DEC-S6-002).

#### Decision Status

CL-S4-001 (revised) is resolved: each snapshot has zero or one same-Route predecessor, and the versions of a Route form a single chain (M03 §6.4).

### AdminAccount

#### Identity

Normalized `email` is the MVP logical identity from invitation through active lifecycle. Conditional `userId` is unique external/provider linkage when present.

#### Attributes

| Attribute | Logical Type | Presence | Constraint | Source |
|---|---|---|---|---|
| `userId` | String | Conditional | Present after matching provider identity is linked; unique and stable when present. | M03 §6.4; S1 HC-001 |
| `email` | String | Required | Normalized; unique system-wide; MVP logical identity. | M03 §6.4; S1 HC-001 |
| `role` | Enum(`CONTENT_STAFF`, `REVIEWER`) | Required | Fixed application role. | M03 §6.4 |
| `status` | Enum(`INVITATION_PENDING`, `ACTIVE`, `DEACTIVATED`) | Required | Account lifecycle. | M03 §6.4 |
| `createdAt` | DateTime | Required | UTC. | M03 §6.4 |
| `updatedAt` | DateTime | Required | UTC. | M03 §6.4 |
| `concurrencyRevision` | Integer | Required | Stale-write and last-active-Reviewer protection. | M03 §6.4 |

#### Relationships

| Related Entity | Cardinality | Logical Reference | Rule | Source |
|---|---|---|---|---|
| AuditRecord | `0..1 actor : 0..* records` | `AuditRecord.actorUserId → userId` | Server provisioning may have no actor. | REL-007 |

Other recorded user IDs (`createdByUserId`, `lastEditedByUserId`, `publishedByUserId`, `closedByUserId`, `fieldVerifiedByUserId`, `usageRightsConfirmedByUserId`) are history/display values and are not drawn as relationships (S3 §2).

#### Lifecycle / Immutability

Provider credential recovery does not change application role/status. The last active Reviewer cannot be demoted or deactivated transactionally.

#### Decision Status

If future behavior permits email change, the identity rule must be reviewed; this is not an MVP clarification.

### AuditRecord

#### Identity

`auditId` is the stable logical identifier.

#### Attributes

| Attribute | Logical Type | Presence | Constraint | Source |
|---|---|---|---|---|
| `auditId` | String | Required | Stable audit-record identity. | M03 §6.4 |
| `actorUserId` | String | Conditional | Required for authenticated administrative actions; absent for allowed server provisioning. | M03 §6.4 |
| `action` | String | Required | Administrative/provisioning action name. | M03 §6.4 |
| `entityType` | String | Required | Logical affected entity type. | M03 §6.4 |
| `entityId` | String | Required | Logical affected entity identity. | M03 §6.4 |
| `revision` | Integer | Optional | Present when the action concerns a revisioned value: the `revisionNumber` of that Revision, whose subject is identified by `entityType` and `entityId`. | M03 §6.4; S1 HC-006 |
| `reason` | String | Conditional | Required for close, reopen, archive and discard of a route or checkpoint, and for revoke of a visit point. | M03 §6.4; BR-M03-F08 |
| `outcome` | Enum(`SUCCESS`, `FAILURE`) | Required | Failed operations are logged too. | M03 §6.4 |
| `selfPublished` | Boolean | Conditional | Present on publication actions; `true` when publisher equals last editor. | M03 §6.4 |
| `beforeState` | Object | Optional | Must not contain credential/token values. | M03 §6.4 |
| `afterState` | Object | Optional | Must not contain credential/token values. | M03 §6.4 |
| `occurredAt` | DateTime | Required | UTC append time. | M03 §6.4 |

#### Relationships

| Related Entity | Cardinality | Logical Reference | Rule | Source |
|---|---|---|---|---|
| AdminAccount | `0..1 : 1` from record | `actorUserId → AdminAccount.userId` | Actor is conditional. | REL-007 |

#### Lifecycle / Immutability

Append-only; never updated. Generic affected-entity fields do not create separate typed relationships without source cardinality (S3 §2).

#### Decision Status

No outstanding decision. Reviewers read the system-wide audit log (SF-M03-011-05), so S2 `ANOM-S2-001` is resolved.

### LanguagePreference

#### Identity

Singleton current preference slot in one local application profile; no surrogate identifier is introduced.

#### Attributes

| Attribute | Logical Type | Presence | Constraint | Source |
|---|---|---|---|---|
| `languageCode` | Enum(`vi`, `en`) | Required | Current singleton value. | M01 §5.3 |

#### Relationships

No canonical entity relationship is declared. It selects a rendering branch without owning or mutating content/package/session state.

#### Lifecycle / Immutability

Initial selection creates the singleton; later selection atomically replaces its value. Browser data lifecycle may remove it.

#### Decision Status

No outstanding decision.

### SelectedRouteContext

#### Identity

`handoffId` is globally unique; only one current context is stored.

#### Attributes

| Attribute | Logical Type | Presence | Constraint | Source |
|---|---|---|---|---|
| `contractVersion` | Integer | Required | Exactly `3`. | M01 §5.3 |
| `handoffId` | UUID | Required | Globally unique; used for at most one PlaySession. | M01 §5.3 |
| `routeId` | String | Required | Equals embedded manifest Route. | M01 §5.3 |
| `authorizedAt` | DateTime | Required | UTC. | M01 §5.3 |
| `expiresAt` | DateTime | Required | UTC; exactly `authorizedAt` plus 24 hours; never extended by M01. | M01 §5.3, §6.4 |
| `authorizationStatus` | Enum(`AUTHORIZED`, `REVOKED`) | Required | Start creates authorized; discovered closure may revoke. | M01 §5.3 |
| `routeJourneyManifest` | Object | Required | Complete journey-only manifest written atomically. | M01 §5.3 |
| `routeJourneyManifest.routeId` | String | Required | Equals outer `routeId`. | M01 §5.3 |
| `routeJourneyManifest.contentVersion` | Integer | Required | Source snapshot/package version. | M01 §5.3 |
| `routeJourneyManifest.checkpoints` | Array&lt;Object&gt; | Required | Complete frozen checkpoint list. | M01 §5.3 |
| `routeJourneyManifest.checkpoints[].checkpointId` | String | Required | Unique in manifest. | M01 §5.3 |
| `routeJourneyManifest.checkpoints[].sequence` | Integer | Required | Unique in manifest; gaps allowed. | M01 §5.3 |
| `routeJourneyManifest.checkpoints[].checkpointName` | Object | Required | Frozen display name; `vi` and `en` both required, non-empty. | M01 §5.3 |
| `routeJourneyManifest.checkpoints[].connectivityMode` | Enum(`ONLINE_AVAILABLE`, `OFFLINE_REQUIRED`) | Required | Copied without reclassification. | M01 §5.3 |
| `routeJourneyManifest.checkpoints[].qrIdentifiers` | Array&lt;String&gt; | Required | Non-empty frozen active identifier set. | M01 §5.3 |

#### Relationships

| Related Entity | Cardinality | Logical Reference | Rule | Source |
|---|---|---|---|---|
| Route | `1 : 1` from context | `routeId → Route.routeId` | Refers to one Route. | REL-010 |
| PlaySession | `1 : 0..1` at creation | `PlaySession.sourceHandoffId` copies `handoffId` | At most one session originates from a handoff; a later Start may replace this current context. | REL-014; M01 BR-M01-009 |

#### Lifecycle / Immutability

Complete manifest freezes at atomic context creation. Status may change to `REVOKED`; expiry is enforced by M02 and never changes `authorizationStatus`. A later successful Start replaces the current singleton with a new handoff identity.

#### Decision Status

No outstanding decision.

### OfflinePackage

#### Identity

The composite logical identifier is `(routeId, contentVersion)`.

#### Attributes

| Attribute | Logical Type | Presence | Constraint | Source |
|---|---|---|---|---|
| `routeId` | String | Required | Covers exactly one Route. | M01 §5.3 |
| `contentVersion` | Integer | Required | Covers exactly one journey version. | M01 §5.3 |
| `status` | Enum(`CHUA_TAI`, `DANG_TAI`, `SAN_SANG`, `CHUA_HOAN_TAT`) | Required | Only `SAN_SANG` exposed; `CHUA_TAI` may be absence. | M01 §5.3 |
| `versionStatus` | Enum(`CURRENT`, `OUTDATED`) | Conditional | Required only for `SAN_SANG`. | M01 §5.3 |
| `manifest` | Object | Required | Full journey metadata for package version. | M01 §5.3 |
| `manifest.routeId` | String | Required | Equals package `routeId`. | M01 §5.3 |
| `manifest.contentVersion` | Integer | Required | Equals package `contentVersion`. | M01 §5.3 |
| `manifest.checkpoints` | Array&lt;Object&gt; | Required | Complete checkpoint list for package version. | M01 §5.3 |
| `manifest.checkpoints[].checkpointId` | String | Required | Unique in manifest. | M01 §5.3 |
| `manifest.checkpoints[].sequence` | Integer | Required | Unique in manifest; gaps allowed. | M01 §5.3 |
| `manifest.checkpoints[].checkpointName` | Object | Required | Frozen display name; `vi` and `en` both required, non-empty. | M01 §5.3 |
| `manifest.checkpoints[].connectivityMode` | Enum(`ONLINE_AVAILABLE`, `OFFLINE_REQUIRED`) | Required | Frozen source classification. | M01 §5.3 |
| `manifest.checkpoints[].qrIdentifiers` | Array&lt;String&gt; | Required | Non-empty active source identifiers. | M01 §5.3 |
| `offlineRouteMap` | Object | Optional | Embedded value; present only when the source snapshot carries `offlineRouteMap`. | M01 §5.3, §6.4; S1 HC-005 |
| `offlineRouteMap.sourceRef` | String | Conditional | Required when present; image bytes present in the ready package. | M01 §5.3 |
| `offlineRouteMap.caption` | Object | Optional | Both-or-none `vi`/`en`. | M01 §5.3 |
| `offlineRouteMap.caption.vi` | String | Conditional | Required when `caption` is present. | M01 §5.3 |
| `offlineRouteMap.caption.en` | String | Conditional | Required when `caption` is present. | M01 §5.3 |
| `routeEssentials` | Object | Required | Embedded M01-owned point-in-time copy of route texts; present in every ready package; text only. | M01 §5.3, §6.4; S1 HC-005 |
| `routeEssentials.capturedAt` | DateTime | Required | UTC; when the texts were last read from M03. | M01 §5.3 |
| `routeEssentials.name` | Object | Required | `vi` and `en` both required, non-empty. | M01 §5.3 |
| `routeEssentials.startingPoint` | Object | Required | `vi` and `en` both required, non-empty. | M01 §5.3 |
| `routeEssentials.participationRequirements` | Object | Optional | Both-or-none `vi`/`en`. | M01 §5.3 |
| `routeEssentials.safetyWarning` | Object | Optional | Both-or-none `vi`/`en`. | M01 §5.3 |
| `downloadedAt` | DateTime | Optional | UTC completed-download time when available. | M01 §5.3 |

`resources[]` is represented by the canonical OfflineResource relationship below, not duplicated as an embedded attribute. `offlineRouteMap` and `routeEssentials` are embedded values without identity of their own (S1 HC-005).

#### Relationships

| Related Entity | Cardinality | Logical Reference | Rule | Source |
|---|---|---|---|---|
| Route | `1 : 1` from package | `routeId → Route.routeId` | Belongs to one Route/version. | REL-011 |
| OfflineResource | `1 : 0..*` | `(OfflineResource.routeId, contentVersion) → (routeId, contentVersion)` | One resource for each QR of each offline-required checkpoint; may be empty for an all-online manifest. | REL-012 |

#### Lifecycle / Immutability

Candidate activation is atomic. Old ready package remains usable during failed update. At most one active ready package exists per Route; visitor-confirmed delete removes package, resources and embedded values. `routeEssentials` is refreshed independently of the package version: a refresh replaces the value atomically and, on failure, keeps the old texts and their `capturedAt`.

#### Decision Status

No outstanding decision.

### OfflineResource

#### Identity

The composite logical identifier is `(routeId, contentVersion, qrIdentifier)`; `qrIdentifier` is unique within a package.

#### Attributes

| Attribute | Logical Type | Presence | Constraint | Source |
|---|---|---|---|---|
| `routeId` | String | Required | Inherited owning package Route component. | S1 ENT-DATA-012; M01 §5.3/§6.4 |
| `contentVersion` | Integer | Required | Inherited owning package version component. | S1 ENT-DATA-012; M01 §5.3/§6.4 |
| `qrIdentifier` | String | Required | Logical lookup key; unique within the package; equals an identifier in `manifest`. | M01 §5.3, §6.4 |
| `checkpointId` | String | Required | The `OFFLINE_REQUIRED` manifest checkpoint that holds the QR; not identity. | M01 §5.3 |
| `objectName` | Object | Required | `vi` and `en` both required, non-empty. | M01 §5.3 |
| `localizedContent` | Object | Required | Contains both language branches. | M01 §5.3 |
| `localizedContent.vi` | Object | Required | Vietnamese branch. | M01 §5.3 |
| `localizedContent.vi.introductionText` | String | Required | Non-empty. | M01 §5.3 |
| `localizedContent.en` | Object | Required | English branch. | M01 §5.3 |
| `localizedContent.en.introductionText` | String | Required | Non-empty. | M01 §5.3 |
| `staticImages` | Array&lt;String&gt; | Required | May be empty; each declared image byte is present. | M01 §5.3 |

#### Relationships

| Related Entity | Cardinality | Logical Reference | Rule | Source |
|---|---|---|---|---|
| OfflinePackage | `1 : 1` from resource | `(routeId, contentVersion) → (OfflinePackage.routeId, contentVersion)` | Belongs to one package. | REL-012 |
| QRCode | `1 : 1` from resource | `qrIdentifier → QRCode.qrIdentifier` | Local copy of one QR object. | REL-028 |

#### Lifecycle / Immutability

Prepared within candidate; exposed only through complete ready package; removed with package/candidate deletion. It does not delete context or M02 data.

#### Decision Status

No outstanding decision.

### PlaySession

#### Identity

`sessionId` is globally unique. `sourceHandoffId` is also unique and enforces at most one session per handoff.

#### Attributes

| Attribute | Logical Type | Presence | Constraint | Source |
|---|---|---|---|---|
| `sessionId` | UUID | Required | Globally unique identity. | M02 §6.1 |
| `sourceHandoffId` | UUID | Required | Unique; copied from the accepted handoff and retained after current-context replacement. | M02 §6.1; M01 BR-M01-009 |
| `routeId` | String | Required | Copied from accepted handoff. | M02 §6.1 |
| `contentVersion` | Integer | Required | Copied from accepted manifest. | M02 §6.1 |
| `journeyCheckpoints` | Array&lt;Object&gt; | Required | Frozen after creation. | M02 §6.1, §6.3 |
| `journeyCheckpoints[].checkpointId` | String | Required | Unique in session journey. | M02 §6.3 |
| `journeyCheckpoints[].sequence` | Integer | Required | Unique in session journey; gaps allowed. | M02 §6.3 |
| `journeyCheckpoints[].checkpointName` | Object | Required | Frozen historical label; `vi` and `en` both required, non-empty. | M02 §6.3 |
| `journeyCheckpoints[].connectivityMode` | Enum(`ONLINE_AVAILABLE`, `OFFLINE_REQUIRED`) | Required | Frozen classification. | M02 §6.3 |
| `journeyCheckpoints[].qrIdentifiers` | Array&lt;String&gt; | Required | Non-empty frozen identifier set; codes added later are never added here. | M02 §6.3; BR-M02-020 |
| `status` | Enum(`DANG_DIEN_RA`, `HOAN_TAT`, `BO_DO`) | Required | Session lifecycle. | M02 §6.1 |
| `startedAt` | DateTime | Required | UTC. | M02 §6.1 |
| `endedAt` | DateTime | Conditional | Required for terminal status; absent while active. For an automatic end, the latest `checkedInAt`, or `startedAt` when no visit exists. | M02 §6.1; BR-M02-022 |

#### Relationships

| Related Entity | Cardinality | Logical Reference | Rule | Source |
|---|---|---|---|---|
| SelectedRouteContext | `1 : 1` at creation | `sourceHandoffId` copies accepted `handoffId` | Historical lineage remains even when the singleton context is replaced; no continuing reference is required. | REL-014 |
| Route | `1 : 1` from session | `routeId → Route.routeId` | Freezes one Route identity. | REL-015 |
| CheckpointVisit | `1 : 0..*` | `CheckpointVisit.sessionId → sessionId` | Owns progress events. | REL-016 |
| PendingSyncItem | `1 : 0..1` | `PendingSyncItem.sessionId → sessionId` | At most one terminal queue item. | REL-018 |
| SessionRecord | `1 : 0..1` at intake | Accepted `SessionSyncRecord.sessionId` carries `sessionId` | Accepted synchronized history is backend-owned; local session data may later disappear. | REL-019 |

#### Lifecycle / Immutability

Journey freezes at creation. Terminal header, visits and sync payload are immutable; a terminal session cannot return active. At most one in-progress session exists per browser. A session left in progress for more than 24 hours is ended automatically the next time the app is opened (BR-M02-022).

#### Decision Status

No outstanding decision.

### CheckpointVisit

#### Identity

The composite logical identifier is `(sessionId, checkpointId)`; visit uniqueness is not based on QRCode.

#### Attributes

| Attribute | Logical Type | Presence | Constraint | Source |
|---|---|---|---|---|
| `sessionId` | UUID | Required | References owning PlaySession. | M02 §6.2 |
| `checkpointId` | String | Required | Identifies visited frozen-journey checkpoint. | M02 §6.2 |
| `qrIdentifier` | String | Required | QR observed at first accepted check-in; may be a code added after the session started; not identity. | M02 §6.2; BR-M02-020 |
| `checkedInAt` | DateTime | Required | UTC; first value immutable; records a scan, not presence. | M02 §6.2 |

#### Relationships

| Related Entity | Cardinality | Logical Reference | Rule | Source |
|---|---|---|---|---|
| PlaySession | `1 : 1` from visit | `sessionId → PlaySession.sessionId` | Belongs to one session. | REL-016 |
| Checkpoint | `1 : 1` from visit | `checkpointId → Checkpoint.checkpointId` | Refers to one frozen journey checkpoint. | REL-017 |

#### Lifecycle / Immutability

Inserted before content is shown on the first accepted check-in. Repeated scans reuse the original value; no timestamp update is allowed.

#### Decision Status

No outstanding decision.

### PendingSyncItem

#### Identity

`sessionId` identifies at most one queue item per terminal PlaySession.

#### Attributes

| Attribute | Logical Type | Presence | Constraint | Source |
|---|---|---|---|---|
| `sessionId` | UUID | Required | At most one queue item per terminal session. | M02 §6.4 |
| `record` | Object | Required | Exact immutable SessionSyncRecord transport value. | M02 §6.4, §5.1 |
| `record.sessionId` | UUID | Required | Equals outer `sessionId`. | M02 §5.1, §6.4 |
| `record.routeId` | String | Required | Frozen terminal Route identity. | M02 §5.1 |
| `record.contentVersion` | Integer | Required | Frozen journey version. | M02 §5.1 |
| `record.startedAt` | DateTime | Required | UTC. | M02 §5.1 |
| `record.endedAt` | DateTime | Required | UTC; not earlier than start. | M02 §5.1 |
| `record.status` | Enum(`HOAN_TAT`, `BO_DO`) | Required | Terminal only. | M02 §5.1 |
| `record.visitedCheckpoints` | Array&lt;Object&gt; | Required | May be empty; checkpoint IDs unique in session. | M02 §5.1 |
| `record.visitedCheckpoints[].checkpointId` | String | Required | Stable frozen checkpoint identity. | M02 §5.1 |
| `record.visitedCheckpoints[].checkpointName` | String | Required | Vietnamese name (`checkpointName.vi`) from the frozen journey, as a plain string. | M02 §5.1, §6.4 |
| `record.visitedCheckpoints[].sequence` | Integer | Required | Historical frozen sequence. | M02 §5.1 |
| `record.visitedCheckpoints[].checkedInAt` | DateTime | Required | UTC and within session interval. | M02 §5.1 |
| `syncStatus` | Enum(`PENDING`, `SYNCED`, `CONFLICT`) | Required | Failure remains pending; a changed-payload conflict or an invalid-record rejection becomes `CONFLICT` and stops automatic retry. | M02 §6.4 |

#### Relationships

| Related Entity | Cardinality | Logical Reference | Rule | Source |
|---|---|---|---|---|
| PlaySession | `1 : 1` from item | `sessionId → PlaySession.sessionId` | Belongs one-to-one to a terminal session when present. | REL-018 |

#### Lifecycle / Immutability

Only sync delivery state changes. Embedded `record` never changes after terminal creation.

#### Decision Status

No outstanding decision.

### SessionRecord

#### Identity

`sessionId` is globally unique and copied from the accepted transport record.

#### Attributes

| Attribute | Logical Type | Presence | Constraint | Source |
|---|---|---|---|---|
| `sessionId` | UUID | Required | Globally unique identity. | M03 §6.4 |
| `routeId` | String | Required | Historical Route identity copied unchanged; must identify a Route known to M03. | M03 §5.1, §6.4 |
| `contentVersion` | Integer | Required | Historical journey version copied unchanged; must be a published snapshot version of `routeId`. | M03 §5.1, §6.4 |
| `startedAt` | DateTime | Required | UTC. | M03 §6.4 |
| `endedAt` | DateTime | Required | UTC; not earlier than start. | M03 §5.1, §6.4 |
| `status` | Enum(`HOAN_TAT`, `BO_DO`) | Required | Terminal status only. | M03 §6.4 |
| `visitedCheckpoints` | Array&lt;Object&gt; | Required | Immutable child values; may be empty for abandoned session. | M03 §6.4; M02 §5.1 |
| `visitedCheckpoints[].checkpointId` | String | Required | Unique within session; a checkpoint of the snapshot `(routeId, contentVersion)`. | M03 §5.1, §6.4 |
| `visitedCheckpoints[].checkpointName` | String | Required | Historical Vietnamese label; equals the snapshot `checkpointName.vi`. | M03 §5.1, §6.4 |
| `visitedCheckpoints[].sequence` | Integer | Required | Historical sequence; equals the snapshot `sequence`. | M03 §5.1, §6.4 |
| `visitedCheckpoints[].checkedInAt` | DateTime | Required | UTC and within session interval. | M03 §6.4 |
| `ingestedAt` | DateTime | Required | M03-owned UTC receipt time. | M03 §6.4 |

#### Relationships

| Related Entity | Cardinality | Logical Reference | Rule | Source |
|---|---|---|---|---|
| PlaySession | `0..1 record : 1 session` at intake | `sessionId` copied through `SessionSyncRecord` | Accepted synchronized outcome retains historical identity without requiring a browser-local PlaySession to remain. | REL-019 |
| Route | `1 : 1` from record | `routeId → Route.routeId` | Reports group historical records by Route. | REL-020 |
| JourneySnapshot | `1 : 1` from record | `(routeId, contentVersion) → (JourneySnapshot.routeId, contentVersion)` | Validation reference at intake, whatever the Route's current status. | REL-029 |

#### Lifecycle / Immutability

Inserted atomically on first accepted payload and never changed. Identical retry succeeds without mutation; different payload for the same identity conflicts.

#### Decision Status

No outstanding decision.

### Revision

#### Identity

`revisionId` is the system-generated logical identifier; `(subjectType, subjectId, revisionNumber)` is also unique.

#### Attributes

| Attribute | Logical Type | Presence | Constraint | Source |
|---|---|---|---|---|
| `revisionId` | String | Required | System-generated. | M03 §6.3 |
| `subjectType` | Enum(`ROUTE`, `CHECKPOINT`, `QRCODE`) | Required | Determines the shape of `content`. | M03 §6.3 |
| `subjectId` | String | Required | `routeId`, `checkpointId` or `qrIdentifier`. | M03 §6.3 |
| `revisionNumber` | Integer | Required | Starts at `1` per subject; `+1` for each new revision; never reused. | M03 §6.3 |
| `status` | Enum(`NHAP`, `PHAT_HANH`, `LUU_TRU`, `DA_BO`) | Required | At most one `NHAP` and at most one `PHAT_HANH` per subject. | M03 §6.3, §6.4 |
| `content` | Object | Required | Editable public content of the subject (content tables below); immutable once `PHAT_HANH`. | M03 §6.3 |
| `basedOnRevisionNumber` | Integer | Optional | The published revision this draft was copied from; for a restore, the earlier revision restored. | M03 §6.3; BR-M03-F07 |
| `createdByUserId` | String | Required | — | M03 §6.3 |
| `createdAt` | DateTime | Required | UTC. | M03 §6.3 |
| `lastEditedByUserId` | String | Required | Used for the stale message and the self-publish flag. | M03 §6.3 |
| `lastEditedAt` | DateTime | Required | UTC. | M03 §6.3 |
| `publishedByUserId` | String | Conditional | Required once published. | M03 §6.3 |
| `publishedAt` | DateTime | Conditional | Required once published; UTC. | M03 §6.3 |
| `selfPublished` | Boolean | Conditional | Required once published; `true` when the publisher equals `lastEditedByUserId`. | M03 §6.3 |
| `concurrencyRevision` | Integer | Required | Used for stale-write rejection and review confirmation. | M03 §6.3 |

Route content (`subjectType = ROUTE`):

| Attribute | Logical Type | Presence | Constraint | Source |
|---|---|---|---|---|
| `content.name.vi` | String | Conditional | May be absent in a draft; required and non-empty for publication. | M03 §6.1.1 |
| `content.name.en` | String | Conditional | May be absent in a draft; required and non-empty for publication. | M03 §6.1.1 |
| `content.shortDescription.vi` | String | Conditional | Required for publication. | M03 §6.1.1 |
| `content.shortDescription.en` | String | Conditional | Required for publication. | M03 §6.1.1 |
| `content.description.vi` | String | Conditional | Required for publication. | M03 §6.1.1 |
| `content.description.en` | String | Conditional | Required for publication. | M03 §6.1.1 |
| `content.startingPoint.vi` | String | Conditional | Required for publication. | M03 §6.1.1 |
| `content.startingPoint.en` | String | Conditional | Required for publication. | M03 §6.1.1 |
| `content.participationRequirements.vi` | String | Optional | Both-or-none with `.en`. | M03 §6.1.1 |
| `content.participationRequirements.en` | String | Optional | Both-or-none with `.vi`. | M03 §6.1.1 |
| `content.preparation.vi` | String | Optional | Both-or-none with `.en`. | M03 §6.1.1 |
| `content.preparation.en` | String | Optional | Both-or-none with `.vi`. | M03 §6.1.1 |
| `content.bestTime.vi` | String | Optional | Both-or-none with `.en`. | M03 §6.1.1 |
| `content.bestTime.en` | String | Optional | Both-or-none with `.vi`. | M03 §6.1.1 |
| `content.safetyWarning.vi` | String | Optional | Both-or-none with `.en`. | M03 §6.1.1 |
| `content.safetyWarning.en` | String | Optional | Both-or-none with `.vi`. | M03 §6.1.1 |
| `content.noSafetyWarningConfirmed` | Boolean | Required | Default `false`; must be `true` for publication when `safetyWarning` is absent; reset to `false` when a warning is entered. | M03 §6.1.1; BR-M03-C09 |
| `content.distanceKm` | Decimal | Conditional | Required for publication; greater than `0`. | M03 §6.1.1 |
| `content.durationMin` | Integer | Conditional | Required for publication; greater than `0`. | M03 §6.1.1 |
| `content.difficulty` | Enum(`NHE`, `TRUNG_BINH`, `KHO`) | Conditional | Required for publication. | M03 §6.1.1 |
| `content.groupTags` | Array&lt;Enum(`GROUP_CA_NHAN_NGUOI_LON`, `GROUP_GIA_DINH_CO_TRE`, `GROUP_CAN_DE_DANG`)&gt; | Conditional | Required and non-empty for publication; no contradiction with `difficulty`. | M03 §6.1.1; BR-M03-C12 |
| `content.experienceTags` | Array&lt;Enum(`INTEREST_THIEN_NHIEN_CHUP_ANH`, `INTEREST_TIM_HIEU`, `INTEREST_KHAM_PHA`)&gt; | Conditional | Required and non-empty for publication. | M03 §6.1.1 |
| `content.thumbnailMediaId` | UUID | Conditional | Required for publication; an `IMAGE` Media of this Route. | M03 §6.1.1 |
| `content.galleryItems` | Array&lt;Object&gt; | Optional | Ordered; the first is the cover. | M03 §6.1.1 |
| `content.galleryItems[].mediaId` | UUID | Required | Required for every item; an `IMAGE` Media of this Route. | M03 §6.1.1 |
| `content.galleryItems[].caption.vi` | String | Optional | Both-or-none with `.en`. | M03 §6.1.1 |
| `content.galleryItems[].caption.en` | String | Optional | Both-or-none with `.vi`. | M03 §6.1.1 |
| `content.routeMapMediaId` | UUID | Optional | An `IMAGE` Media of this Route. | M03 §6.1.1 |
| `content.routeMapCaption.vi` | String | Optional | Both-or-none; allowed only with `routeMapMediaId`. | M03 §6.1.1 |
| `content.routeMapCaption.en` | String | Optional | Both-or-none; allowed only with `routeMapMediaId`. | M03 §6.1.1 |
| `content.offlineRouteMapRequired` | Boolean | Required | Default `false`; may be `true` only while `routeMapMediaId` is present. | M03 §6.1.1; BR-M03-C16 |
| `content.checkpointList` | Array&lt;Object&gt; | Conditional | Required, with at least one active checkpoint, for publication; ordered visiting order; a checkpoint appears at most once. | M03 §6.1.1, §6.4 |
| `content.checkpointList[].checkpointId` | String | Required | Required for every item; a `HOAT_DONG` checkpoint when added; never `LUU_TRU` while a non-archived route lists it. | M03 §6.1.1, §6.4 |
| `content.highlights` | Array&lt;Object&gt; | Optional | Ordered highlight items. | M03 §6.1.1 |
| `content.highlights[].vi` | String | Required | Required for every item; non-empty. | M03 §6.1.1 |
| `content.highlights[].en` | String | Required | Required for every item; non-empty. | M03 §6.1.1 |

Checkpoint content (`subjectType = CHECKPOINT`):

| Attribute | Logical Type | Presence | Constraint | Source |
|---|---|---|---|---|
| `content.checkpointName.vi` | String | Conditional | Required and non-empty before activation/publication; unique among non-archived checkpoints. | M03 §6.2.1, §6.4 |
| `content.checkpointName.en` | String | Conditional | Required and non-empty before activation/publication. | M03 §6.2.1 |
| `content.connectivityMode` | Enum(`ONLINE_AVAILABLE`, `OFFLINE_REQUIRED`) | Conditional | Required before activation/publication and before any visit point can be added. | M03 §6.2.1; BR-M03-E15 |
| `content.fieldVerificationConfirmed` | Boolean | Conditional | Required and `true` when `ONLINE_AVAILABLE`; cleared when the mode changes away; not a GPS field. | M03 §6.2.1 |
| `content.fieldVerifiedByUserId` | String | Conditional | Set when the confirmation is ticked. | M03 §6.2.1 |
| `content.fieldVerifiedAt` | DateTime | Conditional | Set when the confirmation is ticked; UTC. | M03 §6.2.1 |

QR object content (`subjectType = QRCODE`):

| Attribute | Logical Type | Presence | Constraint | Source |
|---|---|---|---|---|
| `content.objectName.vi` | String | Conditional | May be absent in a draft; required and non-empty for publication. | M03 §6.2.2 |
| `content.objectName.en` | String | Conditional | May be absent in a draft; required and non-empty for publication. | M03 §6.2.2 |
| `content.introductionText.vi` | String | Conditional | Required for publication. | M03 §6.2.2 |
| `content.introductionText.en` | String | Conditional | Required for publication. | M03 §6.2.2 |
| `content.mediaItems` | Array&lt;Object&gt; | Optional | Ordered; audio/video only when the QR object's checkpoint is `ONLINE_AVAILABLE`. | M03 §6.2.2 |
| `content.mediaItems[].mediaId` | UUID | Required | Required for every item; a `QR_MEDIA` Media owned by the checkpoint of this QR object. | M03 §6.2.2, §6.4 |

#### Relationships

| Related Entity | Cardinality | Logical Reference | Rule | Source |
|---|---|---|---|---|
| Route | `0..1 : 1` from revision | `(subjectType = ROUTE, subjectId) → Route.routeId` | Exactly one subject among Route, Checkpoint and QRCode. | REL-024 |
| Checkpoint | `0..1 : 1` from revision | `(subjectType = CHECKPOINT, subjectId) → Checkpoint.checkpointId` | Exactly one subject. | REL-025 |
| QRCode | `0..1 : 1` from revision | `(subjectType = QRCODE, subjectId) → QRCode.qrIdentifier` | Exactly one subject. | REL-026 |
| Media | `0..* : 0..*` | Media IDs in `content` → `Media.mediaId` | Only media of the subject's owner (route media for a route; checkpoint media for a QR object of that checkpoint). | REL-027 |
| Checkpoint | `0..* : 0..*` (route revisions) | `content.checkpointList[].checkpointId → Checkpoint.checkpointId` | Drawn as Route lists Checkpoint. | REL-022 |

#### Lifecycle / Immutability

`NHAP → PHAT_HANH` on publication (the previous `PHAT_HANH` becomes `LUU_TRU` in the same operation); `NHAP → DA_BO` when a pending draft is discarded; `PHAT_HANH → LUU_TRU` when superseded. Restoring creates a new `NHAP` revision. A `PHAT_HANH` revision is immutable; no Revision is deleted (M03 §6.4 DEC-S6-002).

#### Decision Status

No outstanding decision. AuditRecord `revision` identifies a Revision by `revisionNumber` with the subject given by `entityType`/`entityId` (S1 HC-006).

## 5. Relationship Catalog

| ID | Entity A | Cardinality | Entity B | Logical Reference | Requiredness | Source |
|---|---|---|---|---|---|---|
| REL-001 | Route | `1 : 0..*` | Checkpoint | — | RETIRED (V2): a checkpoint belongs to no route; replaced by REL-022 | S3 REL-001; M03 §6.4 |
| REL-002 | Checkpoint | `1 : 0..*` | QRCode | `QRCode.checkpointId → Checkpoint.checkpointId` | Required on QRCode | S3 REL-002; M03 §6.2 |
| REL-003 | Checkpoint | `1 : 0..*` | CheckpointContent | — | RETIRED (V2): ENT-DATA-004 retired | S3 REL-003 |
| REL-004 | Checkpoint | `0..1 : 0..*` | Media | `Media.(ownerType = CHECKPOINT, ownerId) → Checkpoint.checkpointId` | Required on Media when `ownerType = CHECKPOINT` | S3 REL-004; M03 §6.3 |
| REL-005 | Route | `1 : 0..*` | JourneySnapshot | `JourneySnapshot.routeId → Route.routeId` | Required on JourneySnapshot | S3 REL-005; M03 §5.1 |
| REL-006 | Route | `0..1 : 0..1` | JourneySnapshot | `(Route.routeId, activeContentVersion) → (JourneySnapshot.routeId, contentVersion)` | Conditional on published Route | S3 REL-006; M03 §6.1, §6.4 |
| REL-007 | AdminAccount | `0..1 : 0..*` | AuditRecord | `AuditRecord.actorUserId → AdminAccount.userId` | Conditional on authenticated action | S3 REL-007; M03 §6.4 |
| REL-008 | AdminAccount | `0..1 : 0..*` | CheckpointContent | — | RETIRED (V2): ENT-DATA-004 retired; maker-checker removed | S3 REL-008 |
| REL-009 | AdminAccount | `0..1 : 0..*` | CheckpointContent | — | RETIRED (V2): ENT-DATA-004 retired; maker-checker removed | S3 REL-009 |
| REL-010 | Route | `1 : 0..1` | SelectedRouteContext | `SelectedRouteContext.routeId → Route.routeId` | Required on context | S3 REL-010; M01 §5.3 |
| REL-011 | Route | `1 : 0..*` | OfflinePackage | `OfflinePackage.routeId → Route.routeId` | Required on package | S3 REL-011; M01 §5.3 |
| REL-012 | OfflinePackage | `1 : 0..*` | OfflineResource | `(OfflineResource.routeId, contentVersion) → (OfflinePackage.routeId, contentVersion)` | Required on resource | S3 REL-012; M01 §5.3/§6.4 |
| REL-013 | Checkpoint | `1 : 0..*` | OfflineResource | — | RETIRED (V2): resources are per QR; replaced by REL-028 | S3 REL-013; M01 §6.4 |
| REL-014 | SelectedRouteContext | `1 : 0..1` at creation | PlaySession | `PlaySession.sourceHandoffId` copies `SelectedRouteContext.handoffId` | Lineage at creation; no continuing reference | S3 REL-014; M01 BR-M01-009; M02 §6.1 |
| REL-015 | Route | `1 : 0..*` | PlaySession | `PlaySession.routeId → Route.routeId` | Required on session | S3 REL-015; M02 §6.1 |
| REL-016 | PlaySession | `1 : 0..*` | CheckpointVisit | `CheckpointVisit.sessionId → PlaySession.sessionId` | Required on visit | S3 REL-016; M02 §6.2 |
| REL-017 | Checkpoint | `1 : 0..*` | CheckpointVisit | `CheckpointVisit.checkpointId → Checkpoint.checkpointId` | Required on visit | S3 REL-017; M02 §6.2 |
| REL-018 | PlaySession | `1 : 0..1` | PendingSyncItem | `PendingSyncItem.sessionId → PlaySession.sessionId` | Required on item; item optional before terminal queue | S3 REL-018; M02 §6.4 |
| REL-019 | PlaySession | `1 : 0..1` at intake | SessionRecord | `SessionRecord.sessionId` is copied through `SessionSyncRecord` | Accepted record has its own required ID; local PlaySession need not persist afterward | S3 REL-019; M02/M03 session contract |
| REL-020 | Route | `1 : 0..*` | SessionRecord | `SessionRecord.routeId → Route.routeId` | Required on record | S3 REL-020; M03 §6.4 |
| REL-021 | JourneySnapshot (predecessor) | `0..1 : 0..1` | JourneySnapshot (successor) | `(routeId, previousContentVersion) → (routeId, contentVersion)` | Optional predecessor; single chain | S3 REL-021; M03 §6.4 CL-S4-001 |
| REL-022 | Route | `0..* : 0..*` | Checkpoint | `Revision(subjectType = ROUTE).content.checkpointList[].checkpointId → Checkpoint.checkpointId` | Embedded ordered list in route revision content | S3 REL-022; M03 §6.1.1, §6.4 |
| REL-023 | Route | `0..1 : 0..*` | Media | `Media.(ownerType = ROUTE, ownerId) → Route.routeId` | Required on Media when `ownerType = ROUTE` | S3 REL-023; M03 §6.3 |
| REL-024 | Route | `0..1 : 0..*` | Revision | `Revision.(subjectType = ROUTE, subjectId) → Route.routeId` | Required on Revision when `subjectType = ROUTE` | S3 REL-024; M03 §6.3 |
| REL-025 | Checkpoint | `0..1 : 0..*` | Revision | `Revision.(subjectType = CHECKPOINT, subjectId) → Checkpoint.checkpointId` | Required on Revision when `subjectType = CHECKPOINT` | S3 REL-025; M03 §6.3 |
| REL-026 | QRCode | `0..1 : 0..*` | Revision | `Revision.(subjectType = QRCODE, subjectId) → QRCode.qrIdentifier` | Required on Revision when `subjectType = QRCODE` | S3 REL-026; M03 §6.3 |
| REL-027 | Revision | `0..* : 0..*` | Media | Media IDs in `Revision.content` (`thumbnailMediaId`, `galleryItems[].mediaId`, `routeMapMediaId`, `mediaItems[].mediaId`) → `Media.mediaId` | Optional references in revision content | S3 REL-027; M03 §6.1.1, §6.2.2, §6.4 |
| REL-028 | QRCode | `1 : 0..*` | OfflineResource | `OfflineResource.qrIdentifier → QRCode.qrIdentifier` | Required on resource | S3 REL-028; M01 §5.3/§6.4 |
| REL-029 | JourneySnapshot | `1 : 0..*` | SessionRecord | `(SessionRecord.routeId, contentVersion) → (JourneySnapshot.routeId, contentVersion)` | Required on record; validation reference | S3 REL-029; M03 §5.1, §6.4 |

REL-014 and REL-019 are historical lineage. Their identity values are source-supported, but they are not continuing parent references: M01 replaces the current handoff, and M03 retains an accepted record independently of browser-local M02 data. REL-004, REL-023 and REL-024–REL-026 use a typed polymorphic reference (`ownerType`/`ownerId`, `subjectType`/`subjectId`); REL-022 and REL-027 are references inside `Revision.content`. DBML records these nine links in notes rather than `Ref` statements.

### 5.1 Diagram check

| Check | Result | Evidence |
|---|---|---|
| Canonical entity inventory and ownership | 16 entities: M01 = 4, M02 = 3, M03 = 9; each has one owner. CheckpointContent is retired. | §3; specs M01/M02/M03 §6; S1 Entity Dictionary. |
| Relationship inventory and both directions | 29 REL IDs in this catalog and [S3 review](03-erd-review.md): 24 active and 5 retired (REL-001, 003, 008, 009, 013). 24 Mermaid edges in [canonical ERD](03-erd.mmd). S3 records the inverse reading and cardinality for each link. | REL-002, 004–007, 010–012, 014–029; [ERD preview](03-erd-preview.md) contains the same Mermaid body. |
| DBML representation | 16 entity blocks and 15 `Ref` statements; nine links (REL-004, 014, 019, 022–027) are recorded as notes. Thus 15 + 9 = 24 active links. | [DBML](04-data-model.dbml) and §12. |
| Many-to-many links | REL-022 (Route lists Checkpoint) and REL-027 (Revision references Media) are many-to-many through ordered/embedded references in `Revision.content`; no extra canonical join entity is approved. Session/checkpoint visits are CheckpointVisit; package/QR resources are OfflineResource. LanguagePreference intentionally has no relationship. | REL-012, 016, 017, 022, 027, 028; S3 §2; M01/M02 §6; M03 §6.4. |

This is a structural check, not a claim that Mermaid or DBML rendered in a parser. Physical storage mapping belongs to the [physical schema](06-physical-schema.md), which has not been re-evaluated for V2. A new relation must update the catalog, ERD, visualization and this count together.

## 6. Freeze Value Review

| Entity | Frozen Value | Freeze Moment | Later source changes affect it? | Source |
|---|---|---|---|---|
| Revision | `content` of a `PHAT_HANH` revision | Publication | No; a change creates a new revision; restore creates a new draft. | M03 §6.3, §6.4 |
| JourneySnapshot | Complete checkpoint order/name/mode/QR arrays, per-QR offline resources and offline route map | Atomic publication as `DA_CONG_BO` | No; published snapshot is immutable. | M03 §5.1, §5.2.G, §6.4 |
| SelectedRouteContext | `routeJourneyManifest` | Successful Start context commit | No; later source change does not rewrite the handoff. Closure may change only authorization status. | M01 §4.5, §5.3, BR-M01-009 |
| OfflinePackage | Manifest, OfflineResource values and offline route map for one version | Candidate validates and becomes ready | No; newer source creates/switches a candidate while old ready version survives failure. `routeEssentials` is not frozen: it is refreshed independently of the version and keeps its `capturedAt`. | M01 §4.3/§4.8, §5.3, §6.4, BR-M01-004/006 |
| PlaySession | Route/version and `journeyCheckpoints` | Session creation from accepted handoff | No; journey is immutable for session life; codes added later are resolved by lookup. | M02 FR-M02-004, BR-M02-020, §6.1/§6.3 |
| CheckpointVisit | `qrIdentifier` and first `checkedInAt` | First accepted session/checkpoint check-in | No; repeated scans retain first time. | M02 FR-M02-007/009, §6.2 |
| PendingSyncItem | Embedded terminal `record` | Terminal session payload creation/queue | No; only `syncStatus` changes. | M02 FR-M02-018, §6.4 |
| SessionRecord | Terminal header and historical checkpoint values | First accepted ingest | No; identical retry is no-op and changed retry conflicts. | M03 §5.1, §5.2.J, §6.4 |
| AuditRecord | Optional `beforeState`/`afterState` | Administrative/provisioning action is appended | No; AuditRecord is append-only. | M03 §6.4 |

## 7. Delete Behavior Review

| Entity / Relationship | Source Behavior | Logical Decision | Source |
|---|---|---|---|
| OfflinePackage | Visitor-confirmed local delete removes package and yields logical `CHUA_TAI`. | Delete is supported only for local package lifecycle. | M01 FR-M01-009, §6.4 |
| OfflinePackage → OfflineResource | Package/candidate deletion removes owned resources, offline route map and route essentials. | Confirmed logical cascade within M01 local ownership. | M01 §6.4 |
| Route | Discard of a never-published route and archive are `LUU_TRU`; history retained. | Lifecycle U, not D. | M03 SF-M03-001-06, SF-M03-001-10; §6.4 |
| Checkpoint | Close, discard and archive are `TAM_DONG`/`LUU_TRU`. | Lifecycle U, not D. | M03 SF-M03-002-07, SF-M03-002-10, FN-M03-007; §6.4 |
| QRCode | Revoke and discard yield terminal `THU_HOI`; the identifier is never reused. | Lifecycle U, not D. | M03 SF-M03-003-07, SF-M03-003-13; §6.4 |
| Revision | Discarded draft becomes `DA_BO`; superseded published revision becomes `LUU_TRU`. | Lifecycle U; retain revisions, no MVP hard-delete or purge. | M03 §6.3/§6.4 DEC-S6-002 |
| JourneySnapshot | Persisted versions are retained. | Retain persisted versions; no MVP hard-delete or automatic purge. | M03 BR-M03-G08; §6.4 DEC-S6-002 |
| Media | Retained after it stops being referenced. | Retain canonical records; no MVP hard-delete or purge. | M03 §6.3/§6.4 DEC-S6-002 |
| AdminAccount | Deactivation preserves account and authorization history. | Lifecycle U; retain accounts, no MVP hard-delete or purge. | M03 §5.2.K; §6.4 DEC-S6-002 |
| AuditRecord | Append-only historical record. | No U/D. | M03 §6.4 |
| PlaySession / CheckpointVisit / PendingSyncItem | Browser data deletion may remove local values; no remote recovery. | Environmental local-data lifecycle is acknowledged; no product FN-level targeted delete operation is invented. | M02 §6 logical constraints |
| SessionRecord | Immutable accepted record. | Retain record and embedded visits together; no U, hard-delete or automatic purge in MVP. | M03 §5.2.J; §6.4 DEC-S6-002 |
| SelectedRouteContext | Later Start replaces current singleton; browser lifecycle may remove local data. | Replacement is U in S2; no independent D function is inferred. | M01 §6.3/§6.4; S2 |
| LanguagePreference | Browser data lifecycle may remove singleton. | No product delete behavior beyond browser lifecycle is declared. | M01 §6.3/§6.4 |

## 8. Enum / Lifecycle Transition Review

| Entity | States | Allowed Transitions | Terminal States | Guards | Source |
|---|---|---|---|---|---|
| Route | `NHAP`, `HOAT_DONG`, `TAM_DONG`, `LUU_TRU` | `NHAP→HOAT_DONG` (first publication); `NHAP→LUU_TRU` (discard); `HOAT_DONG→TAM_DONG` (close, or automatically when its last active listed checkpoint closes); Reviewer reopen `TAM_DONG→HOAT_DONG`; Reviewer archive `TAM_DONG→LUU_TRU` | `LUU_TRU` | Publication guard and mandatory review; concurrency; never reopens automatically; active version required once published. | M03 §5.2.C, §5.2.H, §6.1/§6.4 |
| Checkpoint | `NHAP`, `HOAT_DONG`, `TAM_DONG`, `LUU_TRU` | `NHAP→HOAT_DONG` (own publication); `NHAP→LUU_TRU` (discard); `HOAT_DONG→TAM_DONG` (close, affecting every listing route); Reviewer reopen `TAM_DONG→HOAT_DONG`; Reviewer archive `TAM_DONG→LUU_TRU` | `LUU_TRU` | At least one ready visit point; bilingual name; online requires field verification; archive only when no non-archived route lists it. | M03 §5.2.D, §5.2.H, §6.2/§6.4 |
| QRCode | `NHAP`, `HOAT_DONG`, `THU_HOI` | Created `NHAP` at first save; `NHAP→HOAT_DONG` (publication); `NHAP→THU_HOI` (discard); `HOAT_DONG→THU_HOI` (revoke, or automatically when its checkpoint is archived) | `THU_HOI` | Cannot revoke the last active QR of an active checkpoint; created only for a checkpoint with a saved mode. | M03 §5.2.E, §6.2/§6.4 |
| Revision | `NHAP`, `PHAT_HANH`, `LUU_TRU`, `DA_BO` | `NHAP→PHAT_HANH` (previous published becomes `LUU_TRU`); `NHAP→DA_BO` (discard); `PHAT_HANH→LUU_TRU` (superseded); restore creates a new `NHAP` | `LUU_TRU`, `DA_BO` | At most one `NHAP` and one `PHAT_HANH` per subject; publication guard; reviewed concurrency revision; restore blocked while a draft exists. | M03 §5.2.F, §6.3/§6.4 |
| JourneySnapshot | `DANG_TAO`, `DA_CONG_BO` | `DANG_TAO→DA_CONG_BO` | `DA_CONG_BO` immutable | Complete active journey, unique IDs/sequences, per-QR offline resources; consecutive number allocated in the atomic switch; all affected routes switch together. | M03 §5.1, §5.2.G, §6.4 |
| AdminAccount | `INVITATION_PENDING`, `ACTIVE`, `DEACTIVATED` | `INVITATION_PENDING→ACTIVE↔DEACTIVATED`; retry keeps pending | None declared | Matching provider identity; Reviewer-only management; preserve last active Reviewer. | M03 §5.2.K, §6.4 |
| SelectedRouteContext | `AUTHORIZED`, `REVOKED` | Created authorized; discovered closure may revoke; later Start replaces current value | `REVOKED` for that handoff | Complete atomic manifest; new handoff identity per Start; expiry checked by M02, not a state. | M01 §5.3/§6.4 |
| OfflinePackage | `CHUA_TAI`, `DANG_TAI`, `SAN_SANG`, `CHUA_HOAN_TAT`; ready freshness `CURRENT`/`OUTDATED` | Download/candidate validation; ready may become outdated; valid candidate atomically replaces; delete returns logical not-downloaded | No terminal persisted state declared | Completeness, serialization, retain old ready package on failed update. | M01 §4.8, §5.3/§6.4 |
| PlaySession | `DANG_DIEN_RA`, `HOAN_TAT`, `BO_DO` | Active to completed after final checkpoint plus confirmation; active to abandoned on valid replacement; automatic end after 24 hours (`HOAN_TAT` when the final checkpoint was visited, else `BO_DO`) | `HOAN_TAT`, `BO_DO` | At most one active session per browser; terminal state immutable. | M02 §5.2 BR-M02-022, §6.1 |
| PendingSyncItem | `PENDING`, `SYNCED`, `CONFLICT` | Pending to synced on success/identical acknowledgement; pending to conflict on changed payload or invalid-record rejection; failure remains pending | `SYNCED`, `CONFLICT` for automatic processing | Embedded record immutable; conflict stops automatic retry. | M02 §6.4 |
| SessionRecord | `HOAN_TAT`, `BO_DO` | Inserted directly in terminal state; no transitions | Both terminal | Schema/privacy/timestamp and snapshot validation; identical retry succeeds, changed retry conflicts. | M03 §5.1/§5.2.J/§6.4 |

## 9. Logical Integrity Constraints

1. Route, Checkpoint, QRCode, Revision, Media, AuditRecord, handoff and session identities are stable according to their source declarations; no surrogate identifier is introduced.
2. `qrIdentifier`, normalized AdminAccount email, conditional provider `userId`, `handoffId`, `PlaySession.sessionId`, `PlaySession.sourceHandoffId` and `SessionRecord.sessionId` are unique where declared; identifiers are never reused.
3. Composite identities are exactly those accepted in S1: JourneySnapshot, OfflinePackage, OfflineResource and CheckpointVisit; Revision is also unique by `(subjectType, subjectId, revisionNumber)`.
4. A Checkpoint belongs to no Route. A Route lists checkpoints in its revision content (`checkpointList`); a checkpoint appears at most once in a list; the list position is the snapshot `sequence`. No two non-archived checkpoints share the same Vietnamese name.
5. QRCode belongs to exactly one Checkpoint and never moves; an active Checkpoint retains at least one active QRCode; a QR object holding audio/video belongs to an `ONLINE_AVAILABLE` checkpoint; a QRCode exists only for a checkpoint that had a saved connectivity mode.
6. Each subject has at most one `NHAP` and at most one `PHAT_HANH` Revision; a `PHAT_HANH` revision is immutable; public views expose only the `PHAT_HANH` revision.
7. A Media record is referenced only by revisions of its owner; it is owned by exactly one Route or one Checkpoint; `spokenLanguage` is present exactly for audio/video; usage rights are confirmed before a referencing revision is published.
8. Route publication requires complete bilingual fields, allowed non-empty tag groups, positive measures, a thumbnail, the safety tick when no warning exists and at least one active listed checkpoint.
9. Route active version references the highest `DA_CONG_BO` JourneySnapshot of the same Route, which lists exactly the currently active checkpoints of the route's published list, in list order. JourneySnapshot identity is unique per Route/version and published contents are immutable.
10. `contentVersion` is consecutive per Route starting at `1`; `previousContentVersion`, when present, is `contentVersion - 1` of the same Route; the versions of a Route form a single chain (M03 §6.4 CL-S4-001). The snapshots of all routes affected by one change switch together or not at all.
11. The published or pending-draft list of a non-archived Route never contains a `LUU_TRU` checkpoint; a checkpoint is archived only when no non-archived route lists it.
12. SelectedRouteContext is one current singleton, is written atomically, has a globally unique handoff, expires 24 hours after authorization and creates at most one PlaySession. A historical session retains the handoff ID after that current context is replaced.
13. OfflinePackage is unique per Route/version; at most one active ready package exists per Route. Candidate/partial data is not exposed. A package has at most one offline route map and exactly one route-essentials value.
14. OfflineResource is unique per Route/version/QR and exists exactly for the QRs of the offline-required checkpoints of its owning complete package.
15. At most one PlaySession is `DANG_DIEN_RA` per browser. Its copied journey cannot change after creation.
16. CheckpointVisit is unique per session/checkpoint, not per QR, and preserves the first timestamp; its checkpoint always belongs to the session's frozen journey.
17. PendingSyncItem is at most one per terminal session. Its embedded record is immutable; only sync status transitions.
18. SessionRecord child checkpoint IDs are unique within session; timestamps fall within the session interval; the route is known, the version is published, and every visit matches the snapshot name and sequence; no visitor/device/GPS PII is accepted.
19. SessionRecord ingest is idempotent for identical business data and rejects changed payload for an existing identity.
20. AdminAccount roles are fixed to the declared enum; protected access requires provider authentication plus an active account. Role/status mutation cannot leave zero active Reviewers.
21. AuditRecord is append-only and excludes credential/token values.
22. Ownership remains module-bound: M01/M02 do not write M03 sources, M02 does not write M01 shared values, and M03 SessionRecord is distinct from M02 local PlaySession state. SessionRecord intake lineage does not require a continuing local PlaySession reference.
23. Every Required/Optional/Conditional designation in §4 is logical contract presence, not physical database nullability.

### 9.1 Business-rule enforcement register

RETIRED (V2). The V1 register mapped V1 business-rule IDs (for example `BR-M03-001`–`BR-M03-020`) to implementation evidence (`src/`, `supabase/`, storage validation). Those IDs no longer exist in spec M03 v3.7, whose rules are grouped `BR-M03-A01`–`L13`, and the implementation files are not part of the V2 documentation set (AGENTS.md §2). The complete rule-to-data catalogue is produced in the [Data Acceptance Criteria](08-data-acceptance-criteria.md) stage; this model adds no rule.

## 10. Finalized Decisions

| ID | Status | Decision | Impact / disposition |
|---|---|---|---|
| CL-S4-001 | RESOLVED (revised) | Each snapshot has zero or one same-Route predecessor; the versions of a Route form a single chain because numbers are allocated consecutively inside the atomic publication. | M03 §6.4; REL-021 is `0..1 : 0..1` and drawn. Atomic publication and singular Route activation still apply. |
| DEC-S6-002 | RESOLVED (revised) | Retain the nine M03 canonical entities (Route, Checkpoint, QRCode, Revision, Media, JourneySnapshot, AdminAccount, SessionRecord, AuditRecord) in MVP; no hard-delete or automatic purge. | M03 §6.4; lifecycle archive, discard, revoke and deactivation and M01 local package deletion remain as specified. |

No logical-model decision remains outstanding. The physical storage representation in [06-physical-schema.md](06-physical-schema.md) has not been re-evaluated for V2.

### 10.1 Normalization check and deliberate exceptions

The 16 entities have explicit ownership and identities (§3); attributes trace to spec fields (§4), and relationships to S3 (§5). Mutable source entities and their dependent collections are separated where the specs declare distinct entities: Route/Checkpoint/QRCode/Revision/Media, OfflinePackage/OfflineResource and PlaySession/CheckpointVisit. The two many-to-many links (REL-022, REL-027) are held as references inside `Revision.content`; no extra canonical join entity is approved. The DBML's Object/Array paths are logical values, so this check does not certify relational 1NF/2NF/3NF from a visualization.

| Deliberate repeated or embedded value | Why it is retained | Upkeep rule / source |
|---|---|---|
| Revision `NHAP` beside the `PHAT_HANH` revision of the same subject | A draft must not alter public output; history and restore need earlier versions. | Publication switches the published revision atomically; public views read only `PHAT_HANH`. M03 §5.2.F, §6.3/§6.4. |
| JourneySnapshot checkpoint names, order, QR set, per-QR offline content and offline route map | An old route version must remain self-contained after live content changes. | Build the full copy at publication, then leave it immutable; a journey change creates a new version. M03 §5.1, §5.2.G. |
| OfflinePackage manifest, OfflineResource content/image references and offline route map | An offline route/version must work without the live source. | Validate complete candidate and local image bytes; switch ready version atomically and keep the old ready copy on failure. M01 BR-M01-004/006. |
| OfflinePackage `routeEssentials` | Essential route texts must be shown offline. | Copy from the Published Route at package creation and on each successful later read; keep the old value and `capturedAt` on failure. M01 §5.3, §6.4. |
| SelectedRouteContext v3 `routeJourneyManifest` | M02 receives the exact selected journey even if published data later changes. | Copy once at successful Start; subsequent Start replaces the singleton with a new handoff. M01 BR-M01-009; §6. |
| PlaySession `journeyCheckpoints` and CheckpointVisit first event | The session must use its frozen route version and first accepted check-in. | Copy from authorized handoff at session creation; never rewrite frozen journey or first visit. M02 §6.1–§6.3. |
| PendingSyncItem embedded SessionSyncRecord | A failed sync must resend the same terminal business payload. | Create with terminal transition; only sync status changes. M02 §6.4. |
| SessionRecord embedded historical visits and checkpoint labels | Reports must survive local session cleanup and later route revisions. | Validate once on intake; identical retry is no-op and changed retry conflicts. M03 §5.1, §5.2.J. |
| AuditRecord before/after state | Administrative history must not be reconstructed from mutable current rows. | Append once with the action; exclude credentials/tokens and never update the record. M03 §6.4. |

These are the deliberate duplicated or embedded values in the current S4 model. Physical stores and technical fields are out of scope for this logical model.

## 11. Privacy Declaration

| Check | Declaration and evidence |
|---|---|
| [x] Visitor data minimization | SessionSyncRecord/SessionRecord carry anonymous session, route, status, time and visited-checkpoint fields only; no visitor name, contact, device identifier or GPS field. M02 §5.1; M03 §5.1; §9(18). |
| [x] Administrative identity isolation | AdminAccount email/provider user ID and recorded actor user IDs are M03 private data; public route/content projections do not expose them. Provider credentials remain in the provider, and AuditRecord excludes tokens/credential values. M03 §6.4. |
| [x] Local storage boundary | M01/M02 values stay in the browser-local profile and can be lost when browser data is cleared. M01/M02 §6. Backend access control belongs to the physical schema, which has not been re-evaluated for V2. |

Seed fixtures are not part of the V2 documentation set (AGENTS.md §2); no seed declaration is made here.

## 12. DBML Representation and Validation

- DBML parser/render validation was not run for this revision: no local DBML parser is available, and none was installed. Syntax/render result: NOT RUN.
- Structural inventory of this revision: 16 tables with 250 attribute paths and 15 `Ref` statements; the nine remaining active S3 links (REL-004, 014, 019, 022–027) are recorded as notes. 15 + 9 = 24 active links.
- Markdown-to-DBML comparison: every attribute path of §4 appears in the DBML table of the same entity with the same logical type category and presence (`Required` maps to DBML `not null`; Optional/Conditional remain nullable in the visualization). The Revision table lists the three content shapes with `content.` paths, annotated by `subjectType`. Because each `content.` path applies to one `subjectType` only, all of them stay nullable in the visualization, including paths that are Required within their own content shape.
- The structural inventory and attribute comparison do not constitute a syntax/render PASS.

Representation differences:

1. DBML maps UUID/String/Integer/Decimal/Boolean/Date/DateTime to `uuid`/`varchar`/`int`/`decimal`/`boolean`/`date`/`timestamp` only for visualization, as requested. These are not final PostgreSQL selections.
2. Embedded Object and Array paths are shown with quoted logical field names and logical custom type labels such as `Object` and `Array<Object>`; they are not mapped to JSON/JSONB and do not prescribe storage layout.
3. `OfflinePackage.resources[]` is visualized through the canonical OfflinePackage–OfflineResource relationship rather than as a duplicated embedded DBML field.
4. DBML composite `indexes { ... [pk] }` and `[unique]` blocks visualize approved logical identifiers only; they do not prescribe physical indexes.
5. REL-014 and REL-019 remain in the conceptual catalog as creation/intake lineage. DBML does not draw them as continuing references because the current handoff can be replaced and browser-local sessions can disappear after accepted backend intake.
6. REL-004, REL-023 and REL-024–REL-026 are typed polymorphic references, and REL-022 and REL-027 are references inside `Revision.content`. DBML cannot express them without implying an unconditional foreign key, so they are recorded as notes.
7. The remaining DBML `Ref` statements visualize logical associations, including IDs crossing browser/backend storage boundaries; they do not prescribe enforceable physical foreign keys. Physical design must classify each link by storage location.
8. Singleton/current, conditional presence, lifecycle, freeze, at-most-one-draft/published revision, idempotency and last-active-Reviewer rules remain authoritative in this Markdown because DBML cannot express them completely.

## 13. Automatic S4 Gate

| Check | Result |
|---|---|
| All 16 canonical entities modeled; retired CheckpointContent recorded | PASS |
| All source-supported attributes represented | PASS |
| Logical types and presence reviewed | PASS |
| Approved logical identifiers reviewed | PASS |
| All 24 active S3 links represented (15 references, nine notes); 5 retired links recorded | PASS |
| Frozen/historical values reviewed | PASS |
| Delete behavior reviewed | PASS |
| Enum/lifecycle transitions reviewed | PASS |
| Logical integrity constraints reviewed | PASS |
| DBML field and note mapping consistent with authoritative model | PASS — structural review; parser/render NOT RUN |
| No unsupported physical design introduced | PASS |

**S4 STATUS: PASS — READY FOR DATA ACCEPTANCE CRITERIA**
