# Logical Data Model — Cúc Phương Quest

## 1. Document Metadata

| Field | Value |
|---|---|
| Session | 5 — Data Modeling |
| Stage | S4 — Logical Data Model |
| Primary artifacts | [Entity Dictionary](01-entity-dictionary.md), [CRUD Matrix](02-crud-matrix.md), [Conceptual ERD](03-erd.mmd), [ERD Review](03-erd-review.md) |
| Authoritative field/rule sources | [Spec M01](../docs/spec/spec-M01.md), [Spec M02](../docs/spec/spec-M02.md), [Spec M03](../docs/spec/spec-M03.md) |
| Authoritative S4 artifact | This document; [DBML](04-data-model.dbml) is visualization only |
| Status | PASS — ready for S5 Seed Data |

## 2. Modeling Principles

- This model is a pure derivation from the current specs and accepted S1–S3 artifacts.
- It is logical, not physical: no PostgreSQL/Supabase design, indexes, migrations, RLS, triggers or storage policy is prescribed.
- No field, relationship, type or constraint is supplied from general domain knowledge.
- No generic technical fields are added; source-declared fields such as `concurrencyRevision`, `createdAt` and `updatedAt` are retained.
- Embedded frozen values remain embedded logical paths. They are not replaced with live references.
- A source collection represented by an approved canonical child entity is modeled as a relationship rather than duplicated as an `Array<Object>` attribute. Specifically, `OfflinePackage.resources[]` is represented by OfflineResource.
- Source-declared logical identifiers are used as given. This model does not assert that every opaque or UUID identifier is a real-world natural key; no unnamed business attribute is promoted into a new key.
- Embedded frozen contract values remain logical values. Relational 1NF/2NF/3NF are not claimed as completed by the DBML visualization; the separate physical mapping and its deliberate exceptions are reviewed in §10.1.
- The DBML uses quoted logical path names and logical Object/Array type labels for visualization. Those labels are not PostgreSQL type choices; this Markdown model remains authoritative.

## 3. Logical Entity Summary

| Entity | Classification | Owner | Logical Identifier | Lifecycle | Notes |
|---|---|---|---|---|---|
| Route | THING | M03 | `routeId` | `NHAP → CHO_DUYET → HOAT_DONG → TAM_DONG → LUU_TRU`, with rejection/reopen paths | Mutable administrative source; archive is not delete. |
| Checkpoint | THING | M03 | `checkpointId` | `NHAP → HOAT_DONG → TAM_DONG → LUU_TRU`, with reopen path | Belongs to exactly one Route. |
| QRCode | THING | M03 | `qrIdentifier` | Created `HOAT_DONG`; may become `DA_THAY` or `THU_HOI` | Reprint preserves identity. |
| CheckpointContent | THING | M03 | `(checkpointId, languageCode, revision)` | `NHAP → CHO_DUYET → DA_DUYET → PHAT_HANH → LUU_TRU`, rejection to `NHAP` | One revision stream per checkpoint/language. |
| Media | THING | M03 | `mediaId` | Draft/edit and publication eligibility; no full state enum declared | `sourceRef` is not identity. |
| JourneySnapshot | EVENT | M03 | `(routeId, contentVersion)` | `DANG_TAO → DA_CONG_BO` | Published snapshot is immutable. |
| AdminAccount | THING | M03 | normalized `email` | `INVITATION_PENDING → ACTIVE ↔ DEACTIVATED` | Provider `userId` is unique external linkage when present. |
| AuditRecord | EVENT | M03 | `auditId` | Appended once | Append-only; server provisioning may have no actor. |
| LanguagePreference | THING | M01 | singleton current preference slot | Absent before selection; create/replace current value | Standalone entity; no invented relationship. |
| SelectedRouteContext | THING | M01 | `handoffId` | Created `AUTHORIZED`; may become `REVOKED`; later Start replaces current singleton | Complete atomic handoff. |
| OfflinePackage | THING | M01 | `(routeId, contentVersion)` | `CHUA_TAI → DANG_TAI → SAN_SANG` or `CHUA_HOAN_TAT`; ready version is current/outdated | Local deletion is supported. |
| OfflineResource | THING | M01 | `(routeId, contentVersion, checkpointId)` | Candidate value; exposed with ready package; removed with package/candidate | Local immutable package value. |
| PlaySession | THING | M02 | `sessionId`; `sourceHandoffId` also unique | `DANG_DIEN_RA → HOAN_TAT` or `BO_DO` | Journey values freeze at creation; terminal state is immutable. |
| CheckpointVisit | EVENT | M02 | `(sessionId, checkpointId)` | Inserted on first valid check-in | First timestamp is immutable. |
| PendingSyncItem | THING | M02 | `sessionId` | `PENDING → SYNCED` or `CONFLICT` | Embedded transport record is immutable. |
| SessionRecord | EVENT | M03 | `sessionId` | Inserted on first accepted payload | Immutable and idempotent on identical retry. |

## 4. Entity Definitions

### Route

#### Identity

`routeId` is the stable logical identifier and never changes.

#### Attributes

| Attribute | Logical Type | Presence | Constraint | Source |
|---|---|---|---|---|
| `routeId` | String | Required | Stable identity; never changes. | M03 §6.1 |
| `status` | Enum(`NHAP`, `CHO_DUYET`, `HOAT_DONG`, `TAM_DONG`, `LUU_TRU`) | Required | Route lifecycle. | M03 §6.1 |
| `name.vi` | String | Conditional | Required and non-empty for publication. | M03 §6.1 |
| `name.en` | String | Conditional | Required and non-empty for publication. | M03 §6.1 |
| `description.vi` | String | Conditional | Required and non-empty for publication. | M03 §6.1 |
| `description.en` | String | Conditional | Required and non-empty for publication. | M03 §6.1 |
| `safetyWarning.vi` | String | Conditional | Both-or-none with `safetyWarning.en`. | M03 §6.1 |
| `safetyWarning.en` | String | Conditional | Both-or-none with `safetyWarning.vi`. | M03 §6.1 |
| `distanceKm` | Decimal | Conditional | Required for publication; greater than `0`. | M03 §6.1 |
| `durationMin` | Integer | Conditional | Required for publication; greater than `0`. | M03 §6.1 |
| `difficulty` | Enum(`NHE`, `TRUNG_BINH`, `KHO`) | Conditional | Required for publication. | M03 §6.1 |
| `timeTags` | Array&lt;Enum(`TIME_NGAN`, `TIME_VUA`, `TIME_DAI`)&gt; | Conditional | Required and non-empty for publication. | M03 §6.1 |
| `groupTags` | Array&lt;Enum(`GROUP_CA_NHAN_NGUOI_LON`, `GROUP_GIA_DINH_CO_TRE`, `GROUP_CAN_DE_DANG`)&gt; | Conditional | Required and non-empty for publication. | M03 §6.1 |
| `experienceTags` | Array&lt;Enum(`INTEREST_THIEN_NHIEN_CHUP_ANH`, `INTEREST_TIM_HIEU`, `INTEREST_KHAM_PHA`)&gt; | Conditional | Required and non-empty for publication. | M03 §6.1 |
| `activeContentVersion` | Integer | Conditional | Required for `HOAT_DONG`; references a `DA_CONG_BO` JourneySnapshot of the same Route. | M03 §6.1, §6.4 |
| `concurrencyRevision` | Integer | Required | Submitted value must match stored value; stale writes are rejected. | M03 §6.1 |

#### Relationships

| Related Entity | Cardinality | Logical Reference | Rule | Source |
|---|---|---|---|---|
| Checkpoint | `1 : 0..*` | `Checkpoint.routeId → Route.routeId` | Contains checkpoints. | REL-001 |
| JourneySnapshot | `1 : 0..*` | `JourneySnapshot.routeId → Route.routeId` | Produces immutable versions. | REL-005 |
| JourneySnapshot | `0..1 : 0..1` | `(Route.routeId, Route.activeContentVersion) → (JourneySnapshot.routeId, JourneySnapshot.contentVersion)` | Selects the active published version. | REL-006 |
| SelectedRouteContext | `1 : 0..1` | `SelectedRouteContext.routeId → Route.routeId` | Current context selects one route. | REL-010 |
| OfflinePackage | `1 : 0..*` | `OfflinePackage.routeId → Route.routeId` | Package covers one route/version. | REL-011 |
| PlaySession | `1 : 0..*` | `PlaySession.routeId → Route.routeId` | Session freezes one route identity. | REL-015 |
| SessionRecord | `1 : 0..*` | `SessionRecord.routeId → Route.routeId` | Historical sessions report by route. | REL-020 |

#### Lifecycle / Immutability

Archive and emergency close/reopen are lifecycle updates, not deletion. Publication changes public state only after approval; stale mutations are rejected.

#### Decision Status

No outstanding decision.

### Checkpoint

#### Identity

`checkpointId` is the stable logical identifier.

#### Attributes

| Attribute | Logical Type | Presence | Constraint | Source |
|---|---|---|---|---|
| `checkpointId` | String | Required | Stable identity. | M03 §6.2 |
| `routeId` | String | Required | References exactly one Route. | M03 §6.2 |
| `checkpointName` | String | Conditional | Required and non-empty before activation/publication. | M03 §6.2 |
| `sequence` | Integer | Conditional | Required before activation; unique per Route for non-archived checkpoints. | M03 §6.2 |
| `connectivityMode` | Enum(`ONLINE_AVAILABLE`, `OFFLINE_REQUIRED`) | Conditional | Required before activation. | M03 §6.2 |
| `fieldVerificationConfirmed` | Boolean | Conditional | Required and `true` before `ONLINE_AVAILABLE`; not GPS data. | M03 §6.2 |
| `status` | Enum(`NHAP`, `HOAT_DONG`, `TAM_DONG`, `LUU_TRU`) | Required | Checkpoint lifecycle. | M03 §6.2 |
| `concurrencyRevision` | Integer | Required | Used for stale-write rejection. | M03 §6.2 |

#### Relationships

| Related Entity | Cardinality | Logical Reference | Rule | Source |
|---|---|---|---|---|
| Route | `1 : 1` from Checkpoint | `routeId → Route.routeId` | Belongs to exactly one Route. | REL-001 |
| QRCode | `1 : 0..*` | `QRCode.checkpointId → checkpointId` | Active checkpoint must retain at least one active QRCode. | REL-002 |
| CheckpointContent | `1 : 0..*` | `CheckpointContent.checkpointId → checkpointId` | Owns per-language revision streams. | REL-003 |
| Media | `1 : 0..*` | `Media.checkpointId → checkpointId` | Owns media resources. | REL-004 |
| OfflineResource | `1 : 0..*` | `OfflineResource.checkpointId → checkpointId` | Local resources reference manifest checkpoints. | REL-013 |
| CheckpointVisit | `1 : 0..*` | `CheckpointVisit.checkpointId → checkpointId` | Visit refers to a frozen journey checkpoint. | REL-017 |

#### Lifecycle / Immutability

Close, reopen and archive are lifecycle updates. `LUU_TRU` is terminal in the MVP; no deletion is declared.

#### Decision Status

No outstanding decision.

### QRCode

#### Identity

`qrIdentifier` is globally unique and stable.

#### Attributes

| Attribute | Logical Type | Presence | Constraint | Source |
|---|---|---|---|---|
| `qrIdentifier` | String | Required | Globally unique stable identity. | M03 §6.2 |
| `checkpointId` | String | Required | References exactly one Checkpoint. | M03 §6.2 |
| `installationLabel` | String | Required | Operational placement description; not visitor content. | M03 §6.2 |
| `status` | Enum(`HOAT_DONG`, `DA_THAY`, `THU_HOI`) | Required | `DA_THAY` and `THU_HOI` are terminal. | M03 §6.2 |
| `replacementReason` | String | Conditional | Required when identity replacement is submitted. | M03 §6.2 |

#### Relationships

| Related Entity | Cardinality | Logical Reference | Rule | Source |
|---|---|---|---|---|
| Checkpoint | `1 : 1` from QRCode | `checkpointId → Checkpoint.checkpointId` | Belongs to one Checkpoint. | REL-002 |

#### Lifecycle / Immutability

Reprint does not change identity. Replacement/withdrawal changes lifecycle state and never deletes the QRCode.

#### Decision Status

No outstanding decision.

### CheckpointContent

#### Identity

The composite logical identifier is `(checkpointId, languageCode, revision)`.

#### Attributes

| Attribute | Logical Type | Presence | Constraint | Source |
|---|---|---|---|---|
| `checkpointId` | String | Required | References the owning Checkpoint. | M03 §6.3 |
| `languageCode` | Enum(`vi`, `en`) | Required | One revision stream per checkpoint/language. | M03 §6.3 |
| `revision` | Integer | Required | Identifies a revision within its stream. | M03 §6.3 |
| `introductionText` | String | Conditional | Required and non-empty for submission/publication. | M03 §6.3 |
| `status` | Enum(`NHAP`, `CHO_DUYET`, `DA_DUYET`, `PHAT_HANH`, `LUU_TRU`) | Required | At most one `PHAT_HANH` revision per language. | M03 §6.3 |
| `submittedByUserId` | String | Conditional | Required after submission. | M03 §6.3 |
| `approvedByUserId` | String | Conditional | Required after approval; differs from submitter. | M03 §6.3 |
| `reviewReason` | String | Conditional | Required when a submitted revision is rejected. | M03 §6.3 |
| `concurrencyRevision` | Integer | Required | Used for stale-write rejection. | M03 §6.3 |

#### Relationships

| Related Entity | Cardinality | Logical Reference | Rule | Source |
|---|---|---|---|---|
| Checkpoint | `1 : 1` from content | `checkpointId → Checkpoint.checkpointId` | Belongs to one Checkpoint. | REL-003 |
| AdminAccount | `0..1 : 1` from content | `submittedByUserId → AdminAccount.userId` | Optional before submission. | REL-008 |
| AdminAccount | `0..1 : 1` from content | `approvedByUserId → AdminAccount.userId` | Optional before approval; maker-checker applies. | REL-009 |

#### Lifecycle / Immutability

Published content is preserved as a revision; editing published content creates a new `NHAP` revision. Current published content is a projection, not another entity.

#### Decision Status

No outstanding decision.

### Media

#### Identity

`mediaId` is the stable logical identity. `sourceRef` is a resource/storage reference and is not identity.

#### Attributes

| Attribute | Logical Type | Presence | Constraint | Source |
|---|---|---|---|---|
| `mediaId` | UUID | Required | Stable logical identity. | M03 §6.3 |
| `sourceRef` | String | Required | Resource/storage reference; not identity. | M03 §6.3 |
| `checkpointId` | String | Required | References the owning Checkpoint. | M03 §6.3 |
| `type` | Enum(`IMAGE`, `AUDIO`, `VIDEO`) | Required | Offline resources include images only. | M03 §6.3 |
| `usageRightsConfirmed` | Boolean | Required | Must be `true` before publication. | M03 §6.3 |
| `isPublished` | Boolean | Required | Only published media appears publicly. | M03 §6.3 |
| `concurrencyRevision` | Integer | Required | Used for stale-write rejection. | M03 §6.3 |

#### Relationships

| Related Entity | Cardinality | Logical Reference | Rule | Source |
|---|---|---|---|---|
| Checkpoint | `1 : 1` from Media | `checkpointId → Checkpoint.checkpointId` | Belongs to one Checkpoint. | REL-004 |

#### Lifecycle / Immutability

The source defines edit/publication eligibility but does not declare a separate Media lifecycle enum. Rights-incomplete or unpublished media is excluded from public output.

#### Decision Status

No outstanding decision.

### JourneySnapshot

#### Identity

The composite logical identifier is `(routeId, contentVersion)`.

#### Attributes

| Attribute | Logical Type | Presence | Constraint | Source |
|---|---|---|---|---|
| `routeId` | String | Required | References the owning Route. | M03 §5.1 |
| `contentVersion` | Integer | Required | Immutable version within the Route. | M03 §5.1 |
| `status` | Enum(`DA_CONG_BO`) | Required | Published snapshot state. | M03 §5.1 |
| `publishedAt` | DateTime | Required | UTC. | M03 §5.1 |
| `previousContentVersion` | Integer | Optional | May reference the preceding snapshot of the same Route. | M03 §5.1, §6.4 |
| `checkpoints` | Array&lt;Object&gt; | Required | Every and only active checkpoint; IDs/sequences unique. | M03 §5.1 |
| `checkpoints[].checkpointId` | String | Required | Stable frozen checkpoint identity. | M03 §5.1 |
| `checkpoints[].sequence` | Integer | Required | Unique within snapshot. | M03 §5.1 |
| `checkpoints[].checkpointName` | String | Required | Frozen display name. | M03 §5.1 |
| `checkpoints[].connectivityMode` | Enum(`ONLINE_AVAILABLE`, `OFFLINE_REQUIRED`) | Required | Frozen connectivity classification. | M03 §5.1 |
| `checkpoints[].qrIdentifiers` | Array&lt;String&gt; | Required | Non-empty active identifiers only. | M03 §5.1 |
| `checkpoints[].offlineResource` | Object | Conditional | Present only for `OFFLINE_REQUIRED`. | M03 §5.1 |
| `checkpoints[].offlineResource.localizedContent` | Object | Conditional | Required with embedded offline resource. | M03 §5.1 |
| `checkpoints[].offlineResource.localizedContent.vi` | Object | Conditional | Required with embedded offline resource. | M03 §5.1 |
| `checkpoints[].offlineResource.localizedContent.vi.introductionText` | String | Conditional | Required and non-empty with embedded resource. | M03 §5.1 |
| `checkpoints[].offlineResource.localizedContent.en` | Object | Conditional | Required with embedded offline resource. | M03 §5.1 |
| `checkpoints[].offlineResource.localizedContent.en.introductionText` | String | Conditional | Required and non-empty with embedded resource. | M03 §5.1 |
| `checkpoints[].offlineResource.staticImages` | Array&lt;String&gt; | Conditional | Required with embedded resource; may be empty. | M03 §5.1 |

#### Relationships

| Related Entity | Cardinality | Logical Reference | Rule | Source |
|---|---|---|---|---|
| Route | `1 : 1` from snapshot | `routeId → Route.routeId` | Belongs to one Route/version. | REL-005 |
| Route | `0..1 : 0..1` | `(routeId, contentVersion) ← (Route.routeId, Route.activeContentVersion)` | May be the Route active version. | REL-006 |
| JourneySnapshot | `0..1 predecessor : 0..* successors` | `(routeId, previousContentVersion) → (routeId, contentVersion)` | Same-Route ancestry; no inverse uniqueness. Route activation remains singular. | REL-021; M03 §6.4 CL-S4-001 |

#### Lifecycle / Immutability

`DANG_TAO → DA_CONG_BO` is the build/publication lifecycle. The persisted public contract is `DA_CONG_BO` and immutable. Persisted snapshots are retained without MVP hard-delete or automatic purge (M03 §6.4 DEC-S6-002).

#### Decision Status

CL-S4-001 is resolved: zero or one predecessor and zero or many successors, as finalized in M03 §6.4. This relationship does not impose a one-to-one publication chain.

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
| CheckpointContent | `0..1 submitter : 0..* revisions` | `CheckpointContent.submittedByUserId → userId` | Submitter is recorded after submission. | REL-008 |
| CheckpointContent | `0..1 approver : 0..* revisions` | `CheckpointContent.approvedByUserId → userId` | Approver differs from submitter. | REL-009 |

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
| `revision` | Integer | Optional | Present when action concerns a revisioned value. | M03 §6.4 |
| `beforeState` | Object | Optional | Must not contain credential/token values. | M03 §6.4 |
| `afterState` | Object | Optional | Must not contain credential/token values. | M03 §6.4 |
| `occurredAt` | DateTime | Required | UTC append time. | M03 §6.4 |

#### Relationships

| Related Entity | Cardinality | Logical Reference | Rule | Source |
|---|---|---|---|---|
| AdminAccount | `0..1 : 1` from record | `actorUserId → AdminAccount.userId` | Actor is conditional. | REL-007 |

#### Lifecycle / Immutability

Append-only; never updated. Generic affected-entity fields do not create separate typed relationships without source cardinality.

#### Decision Status

No outstanding decision. Absence of audit-history read behavior is accepted non-blocking MVP behavior in S2.

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
| `contractVersion` | Integer | Required | Exactly `2`. | M01 §5.3 |
| `handoffId` | UUID | Required | Globally unique; used for at most one PlaySession. | M01 §5.3 |
| `routeId` | String | Required | Equals embedded manifest Route. | M01 §5.3 |
| `authorizedAt` | DateTime | Required | UTC. | M01 §5.3 |
| `authorizationStatus` | Enum(`AUTHORIZED`, `REVOKED`) | Required | Start creates authorized; discovered closure may revoke. | M01 §5.3 |
| `routeJourneyManifest` | Object | Required | Complete journey-only manifest written atomically. | M01 §5.3 |
| `routeJourneyManifest.routeId` | String | Required | Equals outer `routeId`. | M01 §5.3 |
| `routeJourneyManifest.contentVersion` | Integer | Required | Source snapshot/package version. | M01 §5.3 |
| `routeJourneyManifest.checkpoints` | Array&lt;Object&gt; | Required | Complete frozen checkpoint list. | M01 §5.3 |
| `routeJourneyManifest.checkpoints[].checkpointId` | String | Required | Unique in manifest. | M01 §5.3 |
| `routeJourneyManifest.checkpoints[].sequence` | Integer | Required | Unique in manifest. | M01 §5.3 |
| `routeJourneyManifest.checkpoints[].checkpointName` | String | Required | Frozen display name. | M01 §5.3 |
| `routeJourneyManifest.checkpoints[].connectivityMode` | Enum(`ONLINE_AVAILABLE`, `OFFLINE_REQUIRED`) | Required | Copied without reclassification. | M01 §5.3 |
| `routeJourneyManifest.checkpoints[].qrIdentifiers` | Array&lt;String&gt; | Required | Non-empty frozen active identifier set. | M01 §5.3 |

#### Relationships

| Related Entity | Cardinality | Logical Reference | Rule | Source |
|---|---|---|---|---|
| Route | `1 : 1` from context | `routeId → Route.routeId` | Refers to one Route. | REL-010 |
| PlaySession | `1 : 0..1` at creation | `PlaySession.sourceHandoffId` copies `handoffId` | At most one session originates from a handoff; a later Start may replace this current context. | REL-014; M01 BR-M01-009 |

#### Lifecycle / Immutability

Complete manifest freezes at atomic context creation. Status may change to `REVOKED`; later successful Start replaces the current singleton with a new handoff identity.

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
| `manifest.checkpoints[].sequence` | Integer | Required | Unique in manifest. | M01 §5.3 |
| `manifest.checkpoints[].checkpointName` | String | Required | Frozen display name. | M01 §5.3 |
| `manifest.checkpoints[].connectivityMode` | Enum(`ONLINE_AVAILABLE`, `OFFLINE_REQUIRED`) | Required | Frozen source classification. | M01 §5.3 |
| `manifest.checkpoints[].qrIdentifiers` | Array&lt;String&gt; | Required | Non-empty active source identifiers. | M01 §5.3 |
| `downloadedAt` | DateTime | Optional | UTC completed-download time when available. | M01 §5.3 |

`resources[]` is represented by the canonical OfflineResource relationship below, not duplicated as an embedded attribute.

#### Relationships

| Related Entity | Cardinality | Logical Reference | Rule | Source |
|---|---|---|---|---|
| Route | `1 : 1` from package | `routeId → Route.routeId` | Belongs to one Route/version. | REL-011 |
| OfflineResource | `1 : 0..*` | `(OfflineResource.routeId, contentVersion) → (routeId, contentVersion)` | One resource for each offline-required checkpoint; may be empty for all-online manifest. | REL-012 |

#### Lifecycle / Immutability

Candidate activation is atomic. Old ready package remains usable during failed update. At most one active ready package exists per Route; visitor-confirmed delete removes package/resources.

#### Decision Status

No outstanding decision.

### OfflineResource

#### Identity

The composite logical identifier is `(routeId, contentVersion, checkpointId)`.

#### Attributes

| Attribute | Logical Type | Presence | Constraint | Source |
|---|---|---|---|---|
| `routeId` | String | Required | Inherited owning package Route component. | S1 ENT-DATA-012; M01 §5.3/§6.4 |
| `contentVersion` | Integer | Required | Inherited owning package version component. | S1 ENT-DATA-012; M01 §5.3/§6.4 |
| `checkpointId` | String | Required | Unique within package; references manifest Checkpoint. | M01 §5.3 |
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
| Checkpoint | `1 : 1` from resource | `checkpointId → Checkpoint.checkpointId` | References one manifest checkpoint. | REL-013 |

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
| `journeyCheckpoints[].sequence` | Integer | Required | Unique in session journey. | M02 §6.3 |
| `journeyCheckpoints[].checkpointName` | String | Required | Frozen historical label. | M02 §6.3 |
| `journeyCheckpoints[].connectivityMode` | Enum(`ONLINE_AVAILABLE`, `OFFLINE_REQUIRED`) | Required | Frozen classification. | M02 §6.3 |
| `journeyCheckpoints[].qrIdentifiers` | Array&lt;String&gt; | Required | Non-empty frozen identifier set. | M02 §6.3 |
| `status` | Enum(`DANG_DIEN_RA`, `HOAN_TAT`, `BO_DO`) | Required | Session lifecycle. | M02 §6.1 |
| `startedAt` | DateTime | Required | UTC. | M02 §6.1 |
| `endedAt` | DateTime | Conditional | Required for terminal status; absent while active. | M02 §6.1 |

#### Relationships

| Related Entity | Cardinality | Logical Reference | Rule | Source |
|---|---|---|---|---|
| SelectedRouteContext | `1 : 1` at creation | `sourceHandoffId` copies accepted `handoffId` | Historical lineage remains even when the singleton context is replaced; no continuing reference is required. | REL-014 |
| Route | `1 : 1` from session | `routeId → Route.routeId` | Freezes one Route identity. | REL-015 |
| CheckpointVisit | `1 : 0..*` | `CheckpointVisit.sessionId → sessionId` | Owns progress events. | REL-016 |
| PendingSyncItem | `1 : 0..1` | `PendingSyncItem.sessionId → sessionId` | At most one terminal queue item. | REL-018 |
| SessionRecord | `1 : 0..1` at intake | Accepted `SessionSyncRecord.sessionId` carries `sessionId` | Accepted synchronized history is backend-owned; local session data may later disappear. | REL-019 |

#### Lifecycle / Immutability

Journey freezes at creation. Terminal header, visits and sync payload are immutable; a terminal session cannot return active. At most one in-progress session exists per device/local profile.

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
| `qrIdentifier` | String | Required | QR observed at first valid check-in; not identity. | M02 §6.2 |
| `checkedInAt` | DateTime | Required | UTC; first value immutable. | M02 §6.2 |

#### Relationships

| Related Entity | Cardinality | Logical Reference | Rule | Source |
|---|---|---|---|---|
| PlaySession | `1 : 1` from visit | `sessionId → PlaySession.sessionId` | Belongs to one session. | REL-016 |
| Checkpoint | `1 : 1` from visit | `checkpointId → Checkpoint.checkpointId` | Refers to one frozen journey checkpoint. | REL-017 |

#### Lifecycle / Immutability

Inserted before content loading on first valid check-in. Repeated scans reuse the original value; no timestamp update is allowed.

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
| `record.visitedCheckpoints[].checkpointName` | String | Required | Historical frozen label. | M02 §5.1 |
| `record.visitedCheckpoints[].sequence` | Integer | Required | Historical frozen sequence. | M02 §5.1 |
| `record.visitedCheckpoints[].checkedInAt` | DateTime | Required | UTC and within session interval. | M02 §5.1 |
| `syncStatus` | Enum(`PENDING`, `SYNCED`, `CONFLICT`) | Required | Failure remains pending; conflict stops automatic retry. | M02 §6.4 |

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
| `routeId` | String | Required | Historical Route identity copied unchanged. | M03 §6.4 |
| `contentVersion` | Integer | Required | Historical journey version copied unchanged. | M03 §6.4 |
| `startedAt` | DateTime | Required | UTC. | M03 §6.4 |
| `endedAt` | DateTime | Required | UTC; not earlier than start. | M03 §5.1, §6.4 |
| `status` | Enum(`HOAN_TAT`, `BO_DO`) | Required | Terminal status only. | M03 §6.4 |
| `visitedCheckpoints` | Array&lt;Object&gt; | Required | Immutable child values; may be empty for abandoned session. | M03 §6.4; M02 §5.1 |
| `visitedCheckpoints[].checkpointId` | String | Required | Unique within session. | M03 §6.4 |
| `visitedCheckpoints[].checkpointName` | String | Required | Historical label. | M03 §6.4 |
| `visitedCheckpoints[].sequence` | Integer | Required | Historical sequence. | M03 §6.4 |
| `visitedCheckpoints[].checkedInAt` | DateTime | Required | UTC and within session interval. | M03 §6.4 |
| `ingestedAt` | DateTime | Required | M03-owned UTC receipt time. | M03 §6.4 |

#### Relationships

| Related Entity | Cardinality | Logical Reference | Rule | Source |
|---|---|---|---|---|
| PlaySession | `0..1 record : 1 session` at intake | `sessionId` copied through `SessionSyncRecord` | Accepted synchronized outcome retains historical identity without requiring a browser-local PlaySession to remain. | REL-019 |
| Route | `1 : 1` from record | `routeId → Route.routeId` | Reports group historical records by Route. | REL-020 |

#### Lifecycle / Immutability

Inserted atomically on first accepted payload and never changed. Identical retry succeeds without mutation; different payload for the same identity conflicts.

#### Decision Status

No outstanding decision.

## 5. Relationship Catalog

| ID | Entity A | Cardinality | Entity B | Logical Reference | Requiredness | Source |
|---|---|---|---|---|---|---|
| REL-001 | Route | `1 : 0..*` | Checkpoint | `Checkpoint.routeId → Route.routeId` | Required on Checkpoint | S3 REL-001; M03 §6.2 |
| REL-002 | Checkpoint | `1 : 0..*` | QRCode | `QRCode.checkpointId → Checkpoint.checkpointId` | Required on QRCode | S3 REL-002; M03 §6.2 |
| REL-003 | Checkpoint | `1 : 0..*` | CheckpointContent | `CheckpointContent.checkpointId → Checkpoint.checkpointId` | Required on CheckpointContent | S3 REL-003; M03 §6.3 |
| REL-004 | Checkpoint | `1 : 0..*` | Media | `Media.checkpointId → Checkpoint.checkpointId` | Required on Media | S3 REL-004; M03 §6.3 |
| REL-005 | Route | `1 : 0..*` | JourneySnapshot | `JourneySnapshot.routeId → Route.routeId` | Required on JourneySnapshot | S3 REL-005; M03 §5.1 |
| REL-006 | Route | `0..1 : 0..1` | JourneySnapshot | `(Route.routeId, activeContentVersion) → (JourneySnapshot.routeId, contentVersion)` | Conditional on active Route version | S3 REL-006; M03 §6.4 |
| REL-007 | AdminAccount | `0..1 : 0..*` | AuditRecord | `AuditRecord.actorUserId → AdminAccount.userId` | Conditional on authenticated action | S3 REL-007; M03 §6.4 |
| REL-008 | AdminAccount | `0..1 : 0..*` | CheckpointContent | `CheckpointContent.submittedByUserId → AdminAccount.userId` | Conditional after submission | S3 REL-008; M03 §6.3 |
| REL-009 | AdminAccount | `0..1 : 0..*` | CheckpointContent | `CheckpointContent.approvedByUserId → AdminAccount.userId` | Conditional after approval | S3 REL-009; M03 §6.3 |
| REL-010 | Route | `1 : 0..1` | SelectedRouteContext | `SelectedRouteContext.routeId → Route.routeId` | Required on context | S3 REL-010; M01 §5.3 |
| REL-011 | Route | `1 : 0..*` | OfflinePackage | `OfflinePackage.routeId → Route.routeId` | Required on package | S3 REL-011; M01 §5.3 |
| REL-012 | OfflinePackage | `1 : 0..*` | OfflineResource | `(OfflineResource.routeId, contentVersion) → (OfflinePackage.routeId, contentVersion)` | Required on resource | S3 REL-012; M01 §5.3/§6.4 |
| REL-013 | Checkpoint | `1 : 0..*` | OfflineResource | `OfflineResource.checkpointId → Checkpoint.checkpointId` | Required on resource | S3 REL-013; M01 §5.3 |
| REL-014 | SelectedRouteContext | `1 : 0..1` at creation | PlaySession | `PlaySession.sourceHandoffId` copies accepted `handoffId` | Handoff ID required and unique on session; current context need only match at creation | S3 REL-014; M01 BR-M01-009; M02 §6.1 |
| REL-015 | Route | `1 : 0..*` | PlaySession | `PlaySession.routeId → Route.routeId` | Required on session | S3 REL-015; M02 §6.1 |
| REL-016 | PlaySession | `1 : 0..*` | CheckpointVisit | `CheckpointVisit.sessionId → PlaySession.sessionId` | Required on visit | S3 REL-016; M02 §6.2 |
| REL-017 | Checkpoint | `1 : 0..*` | CheckpointVisit | `CheckpointVisit.checkpointId → Checkpoint.checkpointId` | Required on visit | S3 REL-017; M02 §6.2 |
| REL-018 | PlaySession | `1 : 0..1` | PendingSyncItem | `PendingSyncItem.sessionId → PlaySession.sessionId` | Required on item; item optional before terminal queue | S3 REL-018; M02 §6.4 |
| REL-019 | PlaySession | `1 : 0..1` at intake | SessionRecord | `SessionRecord.sessionId` is copied through `SessionSyncRecord` | Accepted record has its own required ID; local PlaySession need not persist afterward | S3 REL-019; M02/M03 session contract |
| REL-020 | Route | `1 : 0..*` | SessionRecord | `SessionRecord.routeId → Route.routeId` | Required on record | S3 REL-020; M03 §6.4 |
| REL-021 | JourneySnapshot (predecessor) | `0..1 : 0..*` | JourneySnapshot (successor) | `(routeId, previousContentVersion) → (routeId, contentVersion)` | Optional predecessor; no inverse uniqueness | S3 REL-021; M03 §6.4 CL-S4-001 |

REL-014 and REL-019 are historical lineage. Their identity values are source-supported, but they are not continuing parent references: M01 replaces the current handoff, and M03 retains an accepted record independently of browser-local M02 data. DBML records these links in notes rather than `Ref` statements.

### 5.1 Diagram check

| Check | Result | Evidence |
|---|---|---|
| Canonical entity inventory and ownership | 16 entities: M01 = 4, M02 = 3, M03 = 9; each has one owner. | §3; specs M01/M02/M03 §6; S1 Entity Dictionary. |
| Relationship inventory and both directions | 21 REL IDs in this catalog and [S3 review](03-erd-review.md); 21 Mermaid edges in [canonical ERD](03-erd.mmd). S3 records the inverse reading and cardinality for each link. | REL-001–REL-021; [ERD preview](03-erd-preview.md) contains the same Mermaid body. |
| DBML representation | 16 entity blocks and 19 `Ref` statements; REL-014 and REL-019 are historical lineage notes, not continuing references. Thus 19 + 2 = 21 catalog links. | [DBML](04-data-model.dbml) and §12. |
| Storage mapping | 9 M03 entities map to backend tables; 7 M01/M02 entities map to browser-local stores. The three extra local stores are technical package/image state, not canonical entities. Cross-store and historical links do not become physical foreign keys. | [Physical schema](06-physical-schema.md) §§3, 6; §12. |
| Physical relationship disposition | 11 backend links (REL-001–REL-009, REL-020/021) have SQL foreign keys; 8 local or cross-store links (REL-010–REL-013, REL-015–REL-018) use local ownership/identity values rather than backend foreign keys; 2 links (REL-014/019) are creation/intake lineage. 11 + 8 + 2 = 21. | [Core migration](../supabase/migrations/20260930000100_core.sql), [local database](../src/data/local-db.ts), physical schema §§3, 6. |
| Many-to-many resolution | No direct many-to-many link remains in the catalog. Session/checkpoint visits are CheckpointVisit; package/checkpoint resources are OfflineResource. LanguagePreference intentionally has no relationship. | REL-012/013/016/017; S3 §2; M01/M02 §6. |

This is a structural/source-to-storage check, not a claim that Mermaid or DBML rendered in a parser. A new relation or storage mapping must update the catalog, ERD, visualization and this count together.

## 6. Freeze Value Review

| Entity | Frozen Value | Freeze Moment | Later source changes affect it? | Source |
|---|---|---|---|---|
| JourneySnapshot | Complete checkpoint order/name/mode/QR arrays and conditional offline values | Atomic publication as `DA_CONG_BO` | No; published snapshot is immutable. | M03 §5.1, BR-M03-005/006 |
| SelectedRouteContext | `routeJourneyManifest` | Successful Start context commit | No; later source change does not rewrite the handoff. Closure may change only authorization status. | M01 §4.5, §5.3, BR-M01-009/011 |
| OfflinePackage | Manifest and OfflineResource values for one version | Candidate validates and becomes ready | No; newer source creates/switches a candidate while old ready version survives failure. | M01 §4.3/§4.8, BR-M01-004–008 |
| PlaySession | Route/version and `journeyCheckpoints` | Session creation from accepted handoff | No; journey is immutable for session life. | M02 FR-M02-004, BR-M02-003, §6.1/§6.3 |
| CheckpointVisit | `qrIdentifier` and first `checkedInAt` | First valid session/checkpoint check-in | No; repeated scans retain first time. | M02 FR-M02-007/009, §6.2 |
| PendingSyncItem | Embedded terminal `record` | Terminal session payload creation/queue | No; only `syncStatus` changes. | M02 FR-M02-018, §6.4 |
| SessionRecord | Terminal header and historical checkpoint values | First accepted ingest | No; identical retry is no-op and changed retry conflicts. | M03 BR-M03-016, §6.4 |
| AuditRecord | Optional `beforeState`/`afterState` | Administrative/provisioning action is appended | No; AuditRecord is append-only. | M03 §6.4 |

## 7. Delete Behavior Review

| Entity / Relationship | Source Behavior | Logical Decision | Source |
|---|---|---|---|
| OfflinePackage | Visitor-confirmed local delete removes package and yields logical `CHUA_TAI`. | Delete is supported only for local package lifecycle. | M01 FR-M01-009, §6.4 |
| OfflinePackage → OfflineResource | Package/candidate deletion removes owned resources. | Confirmed logical cascade within M01 local ownership. | M01 §6.4 |
| Route | Archive is `LUU_TRU`; history retained. | Lifecycle U, not D. | M03 SF-M03-001-06; §6.4 |
| Checkpoint | Close/archive are `TAM_DONG`/`LUU_TRU`. | Lifecycle U, not D. | M03 SF-M03-002-07, FN-M03-007; §6.4 |
| QRCode | Replace/withdraw yields terminal state. | Lifecycle U, not D. | M03 BR-M03-009/010; §6.4 |
| JourneySnapshot | Current, previous and recently replaced versions must be retained. | Retain persisted versions; no MVP hard-delete or automatic purge. | M03 BR-M03-008; §6.4 DEC-S6-002 |
| CheckpointContent | Published revision may become archived when replaced. | Lifecycle U; retain revisions, no MVP hard-delete or purge. | M03 §6.3/§6.4 DEC-S6-002 |
| Media | Unpublished/ineligible media is excluded. | Retain canonical records; no MVP hard-delete or purge. | M03 §6.3/§6.4 DEC-S6-002 |
| AdminAccount | Deactivation preserves account and authorization history. | Lifecycle U; retain accounts, no MVP hard-delete or purge. | M03 §3 US-M03-05; §6.4 DEC-S6-002 |
| AuditRecord | Append-only historical record. | No U/D. | M03 §6.4 |
| PlaySession / CheckpointVisit / PendingSyncItem | Browser data deletion may remove local values; no remote recovery. | Environmental local-data lifecycle is acknowledged; no product FN-level targeted delete operation is invented. | M02 §6 logical constraints |
| SessionRecord | Immutable accepted record. | Retain record and embedded visits together; no U, hard-delete or automatic purge in MVP. | M03 BR-M03-016; §6.4 DEC-S6-002 |
| SelectedRouteContext | Later Start replaces current singleton; browser lifecycle may remove local data. | Replacement is U in S2; no independent D function is inferred. | M01 §6.3/§6.4; S2 |
| LanguagePreference | Browser data lifecycle may remove singleton. | No product delete behavior beyond browser lifecycle is declared. | M01 §6.3/§6.4 |

## 8. Enum / Lifecycle Transition Review

| Entity | States | Allowed Transitions | Terminal States | Guards | Source |
|---|---|---|---|---|---|
| Route | `NHAP`, `CHO_DUYET`, `HOAT_DONG`, `TAM_DONG`, `LUU_TRU` | `NHAP→CHO_DUYET→HOAT_DONG→TAM_DONG→LUU_TRU`; reject `CHO_DUYET→NHAP`; Reviewer reopen `TAM_DONG→HOAT_DONG` | `LUU_TRU` | Publication completeness, maker-checker, concurrency; active version required when active. | M03 §6.1/§6.4 |
| Checkpoint | `NHAP`, `HOAT_DONG`, `TAM_DONG`, `LUU_TRU` | `NHAP→HOAT_DONG→TAM_DONG→LUU_TRU`; Reviewer reopen `TAM_DONG→HOAT_DONG` | `LUU_TRU` | Active QR, bilingual content, connectivity completeness; online requires field verification. | M03 §6.2/§6.4 |
| QRCode | `HOAT_DONG`, `DA_THAY`, `THU_HOI` | Created active; `HOAT_DONG→DA_THAY` or `HOAT_DONG→THU_HOI` | `DA_THAY`, `THU_HOI` | Cannot leave active Checkpoint without active QR; replacement requires reason/approval. | M03 §6.2/§6.4 |
| CheckpointContent | `NHAP`, `CHO_DUYET`, `DA_DUYET`, `PHAT_HANH`, `LUU_TRU` | Forward publication path; rejection returns to `NHAP`; editing published creates new `NHAP` revision | `LUU_TRU` for a revision | Minimum content, maker-checker; one current `PHAT_HANH` per language. | M03 §6.3/§6.4 |
| JourneySnapshot | `DANG_TAO`, `DA_CONG_BO` | `DANG_TAO→DA_CONG_BO` | `DA_CONG_BO` immutable | Complete active journey, unique IDs/sequences, conditional resources; atomic active switch. | M03 §5.1/§6.4 |
| AdminAccount | `INVITATION_PENDING`, `ACTIVE`, `DEACTIVATED` | `INVITATION_PENDING→ACTIVE↔DEACTIVATED`; retry keeps pending | None declared | Matching provider identity; Reviewer-only management; preserve last active Reviewer. | M03 §3 US-M03-05, §6.4 |
| SelectedRouteContext | `AUTHORIZED`, `REVOKED` | Created authorized; discovered closure may revoke; later Start replaces current value | `REVOKED` for that handoff | Complete atomic manifest; new handoff identity per Start. | M01 §5.3/§6.4 |
| OfflinePackage | `CHUA_TAI`, `DANG_TAI`, `SAN_SANG`, `CHUA_HOAN_TAT`; ready freshness `CURRENT`/`OUTDATED` | Download/candidate validation; ready may become outdated; valid candidate atomically replaces; delete returns logical not-downloaded | No terminal persisted state declared | Completeness, serialization, retain old ready package on failed update. | M01 §4.8, §5.3/§6.4 |
| PlaySession | `DANG_DIEN_RA`, `HOAN_TAT`, `BO_DO` | Active to completed after final checkpoint plus confirmation, or active to abandoned on valid replacement | `HOAN_TAT`, `BO_DO` | At most one active local session; terminal state immutable. | M02 §5.2, §6.1 |
| PendingSyncItem | `PENDING`, `SYNCED`, `CONFLICT` | Pending to synced on success/identical acknowledgement; pending to conflict on changed payload; failure remains pending | `SYNCED`, `CONFLICT` for automatic processing | Embedded record immutable; conflict stops automatic retry. | M02 §6.4 |
| SessionRecord | `HOAN_TAT`, `BO_DO` | Inserted directly in terminal state; no transitions | Both terminal | Schema/privacy/timestamp validation; identical retry succeeds, changed retry conflicts. | M03 §5.1/§5.2/§6.4 |

## 9. Logical Integrity Constraints

1. Route, Checkpoint, QRCode, Media, AuditRecord, handoff and session identities are stable according to their source declarations; no surrogate identifier is introduced.
2. `qrIdentifier`, normalized AdminAccount email, conditional provider `userId`, `handoffId`, `PlaySession.sessionId`, `PlaySession.sourceHandoffId` and `SessionRecord.sessionId` are unique where declared.
3. Composite identities are exactly those accepted in S1: CheckpointContent, JourneySnapshot, OfflinePackage, OfflineResource and CheckpointVisit.
4. Checkpoint belongs to exactly one Route; `(routeId, sequence)` is unique for non-archived checkpoints.
5. QRCode belongs to exactly one Checkpoint; an active Checkpoint retains at least one active QRCode.
6. CheckpointContent belongs to one checkpoint/language stream; at most one revision per language is `PHAT_HANH`.
7. Submitter and approver differ for an approved revision.
8. Route publication requires complete bilingual fields, allowed non-empty tag groups, positive measures and at least one publishable checkpoint.
9. Route active version references a published JourneySnapshot of the same Route. JourneySnapshot identity is unique per Route/version and published contents are immutable.
10. Optional `previousContentVersion`, when present, references one JourneySnapshot of the same Route. A predecessor may have zero or many successors; there is no inverse uniqueness (M03 §6.4 CL-S4-001).
11. SelectedRouteContext is one current singleton, is written atomically, has a globally unique handoff and creates at most one PlaySession. A historical session retains the handoff ID after that current context is replaced.
12. OfflinePackage is unique per Route/version; at most one active ready package exists per Route. Candidate/partial data is not exposed.
13. OfflineResource is unique per Route/version/checkpoint and exists exactly for offline-required checkpoints of its owning complete package.
14. At most one PlaySession is `DANG_DIEN_RA` per device/local profile. Its copied journey cannot change after creation.
15. CheckpointVisit is unique per session/checkpoint, not per QR, and preserves the first timestamp.
16. PendingSyncItem is at most one per terminal session. Its embedded record is immutable; only sync status transitions.
17. SessionRecord child checkpoint IDs are unique within session; timestamps fall within the session interval; no visitor/device/GPS PII is accepted.
18. SessionRecord ingest is idempotent for identical business data and rejects changed payload for an existing identity.
19. AdminAccount roles are fixed to the declared enum; protected access requires provider authentication plus an active account. Role/status mutation cannot leave zero active Reviewers.
20. AuditRecord is append-only and excludes credential/token values.
21. Ownership remains module-bound: M01/M02 do not write M03 sources, M02 does not write M01 shared values, and M03 SessionRecord is distinct from M02 local PlaySession state. SessionRecord intake lineage does not require a continuing local PlaySession reference.
22. Every Required/Optional/Conditional designation in §4 is logical contract presence, not physical database nullability.

### 9.1 Business-rule enforcement register

Every rule in the three specs has a named enforcement boundary. “Data layer present” means the cited persistence or database guard exists; “integration pending” means application or provider code must still invoke/enforce it before claiming end-to-end behavior. The register assigns responsibility without adding a new product rule.

| Rule IDs | Enforcement boundary | Current evidence / limit |
|---|---|---|
| BR-M01-001 | M01 language preference command | `m01Store.setLanguage` validates and persists `vi`/`en`; UI language switch is integration pending. |
| BR-M01-002 | M01 route catalog reader over M03 Published Route | Public projection exists; catalog filtering and offline freshness display are integration pending. |
| BR-M01-003 | M01 recommendation handler | Integration pending; the handler must apply all three spec tag groups. |
| BR-M01-004, BR-M01-005, BR-M01-006 | M01 offline package staging/activation transaction | `m01Store.stagePackage`, `activatePackage`, `markOutdated` and `readOfflineResource` provide data-layer guards; download/orchestration is integration pending. |
| BR-M01-007 | M01 continue-without-download confirmation flow | Integration pending. |
| BR-M01-008, BR-M01-009 | M01 Start command and handoff write | `m01Store.writeContext` enforces a new authorized handoff; online source check, ready-package selection and Start orchestration are integration pending. |
| BR-M01-010 | M01/M02 store ownership boundary | `m01Store` writes only M01 stores; `m02Store` writes only M02 stores. |
| BR-M01-011 | M01 route-closure reader and context revocation | `m01Store.revokeRoute` is present; discovery and blocking of a new Start are integration pending. |
| BR-M02-001, BR-M02-002, BR-M02-003, BR-M02-013 | M02 session-start transaction | `m02Store.start` consumes the authorized handoff, copies the journey and atomically replaces an active session. |
| BR-M02-004, BR-M02-005, BR-M02-006, BR-M02-008 | M02 QR check-in transaction | `m02Store.checkIn` keys visits by session/checkpoint, accepts unordered journey visits and leaves outside-journey scans without progress; content resolution remains separate. |
| BR-M02-007, BR-M02-010 | M02 terminal transition and sync queue | `m02Store.finish`/`terminate` require final checkpoint and confirmation, then freeze terminal business data. |
| BR-M02-009 | M02 content resolver using M01 offline resource or M03 live lookup | `m02Store.readOfflineResource` is present; online/outside-journey lookup integration is pending. |
| BR-M02-011 | M02 sync acknowledgement and M03 terminal intake | `m02Store.acknowledge` and `api.ingest_session` implement data-layer outcomes; network retry orchestration is pending. |
| BR-M02-012 | M02 free-visitor scan flow | Integration pending; it must not call session/progress/report writers. |
| BR-M03-001, BR-M03-002 | M03 review/publication command | Private draft/public copy and database guards exist; authenticated maker-checker command is integration pending. |
| BR-M03-003, BR-M03-004, BR-M03-005, BR-M03-006, BR-M03-007 | M03 publication transaction | Snapshot/public integrity and immutable-snapshot database guards exist; complete publication command and revision-diff decision are integration pending. |
| BR-M03-008 | M03 snapshot retention boundary | Database denies snapshot delete; no MVP purge command exists. |
| BR-M03-009, BR-M03-010 | M03 QR replacement command and active-checkpoint guard | Database lifecycle/public-integrity guards exist; replacement command is integration pending. |
| BR-M03-011, BR-M03-012, BR-M03-013 | M03 close/reopen command and checkpoint activation guard | Database integrity/lifecycle guards exist; reason, Reviewer permission and field-verification command path are integration pending. |
| BR-M03-014 | M03 administrative write command with expected revision | Database revision guard exists; compare-and-write command is integration pending. |
| BR-M03-015 | M03 account-management command and last-Reviewer guard | Database account guard/serialization exist; Reviewer-only command is integration pending. |
| BR-M03-016 | M03 `api.ingest_session` | Service-only database function validates privacy/time/visits and identical-versus-conflicting retry; application intake adapter is integration pending. |
| BR-M03-017 | M03 report query over SessionRecord | Physical schema defines `Asia/Ho_Chi_Minh` date boundary; report query/UI integration is pending. |
| BR-M03-018 | M03 Auth-to-active-account authorization boundary | Database role lookup, RLS and grants exist; provider configuration and application command authorization are integration pending. |
| BR-M03-019, BR-M03-020 | M03 server-side initial Reviewer provisioning and provider invitation/recovery flow | Provider-backed bootstrap, invitation and recovery integration is pending; no browser privilege grant is defined here. |

The planned boundaries above are traceable to specs M01 §5.5, M02 §5.2 and M03 §5.2; implementation status is supported by [local data operations](../src/data/local-db.ts), [physical schema](06-physical-schema.md) and [storage validation](07-storage-validation.md). A named boundary is not evidence that an unimplemented handler has run.

## 10. Finalized Decisions

| ID | Status | Decision | Impact / disposition |
|---|---|---|---|
| CL-S4-001 | RESOLVED | Each snapshot has zero or one same-Route predecessor; a predecessor has zero or many successors. | M03 §6.4; REL-021 is confirmed and drawn. No inverse uniqueness; atomic publication and singular Route activation still apply. |
| DEC-S6-002 | RESOLVED | Retain M03 canonical records in MVP; no hard-delete or automatic purge. | M03 §6.4; lifecycle archive/deactivation and M01 local package deletion remain as specified. |

No logical-model decision remains outstanding. The subsequent physical storage representation is documented in [06-physical-schema.md](06-physical-schema.md).

### 10.1 Normalization check and deliberate exceptions

The 16 entities have explicit ownership and identities (§3); attributes trace to spec fields (§4), and relationships to S3 (§5). Mutable source entities and their dependent collections are separated where the specs declare distinct entities: Route/Checkpoint/QRCode/CheckpointContent/Media, OfflinePackage/OfflineResource and PlaySession/CheckpointVisit. No unresolved many-to-many relation or extra canonical join entity is needed. The DBML's Object/Array paths are logical values, so this check does not certify relational 1NF/2NF/3NF from a visualization. The physical storage review in [§§2–6 of the physical schema](06-physical-schema.md) maps scalar ownership to tables/keys and the following approved value copies to immutable aggregates or local stores.

| Deliberate repeated or embedded value | Why it is retained | Upkeep rule / source |
|---|---|---|
| Route published metadata copy beside editable draft | A partial draft must not alter public output. | Publication updates the approved public copy atomically; never read unapproved draft as public. M03 BR-M03-001/004/007; physical schema §3. |
| Route/Checkpoint/QRCode/Media `draft_state` and `review_state` envelopes | Pending edits and review evidence must coexist with the last published values. | Administrative command validates expected revision and maker-checker evidence; only approved changes enter public state. M03 BR-M03-001/002/014; physical schema §3. |
| JourneySnapshot checkpoint names, order, QR set and offline content | An old route version must remain self-contained after live content changes. | Build the full copy at publication, then leave it immutable; a journey change creates a new version. M03 BR-M03-005/006. |
| OfflinePackage manifest and OfflineResource localized content/image references | An offline route/version must work without the live source. | Validate complete candidate and local image bytes; switch ready version atomically and keep the old ready copy on failure. M01 BR-M01-004–006. |
| SelectedRouteContext v2 `routeJourneyManifest` | M02 receives the exact selected journey even if published data later changes. | Copy once at successful Start; subsequent Start replaces the singleton with a new handoff. M01 BR-M01-009/011; §6. |
| PlaySession `journeyCheckpoints` and CheckpointVisit first event | The session must use its frozen route version and first valid check-in. | Copy from authorized handoff at session creation; never rewrite frozen journey or first visit. M02 BR-M02-003/004/010. |
| PendingSyncItem embedded SessionSyncRecord | A failed sync must resend the same terminal business payload. | Create with terminal transition; only sync status changes. M02 BR-M02-010/011. |
| SessionRecord embedded historical visits and checkpoint labels | Reports must survive local session cleanup and later route revisions. | Validate/normalize once on intake; identical retry is no-op and changed retry conflicts. M03 BR-M03-016/017. |
| AuditRecord before/after state | Administrative history must not be reconstructed from mutable current rows. | Append once with the action; exclude credentials/tokens and never update the record. M03 §6.4. |
| Local `activePackages` pointer, `packageCandidates` bundle and `imageBytes` | A ready version, an unexposed candidate and actual offline image bytes need separate local lifecycles. | Validate the candidate before activation; update pointer/resources/bytes in one local transaction; delete owned bytes with the package. M01 BR-M01-004–006; physical schema §6. |

These are the deliberate duplicated or embedded values in the current S4/physical mapping. Technical fields and stores in the last two relevant rows are not extra canonical entities or new logical relationships.

## 11. Privacy Declaration

| Check | Declaration and evidence |
|---|---|
| [x] Visitor data minimization | SessionSyncRecord/SessionRecord carry anonymous session, route, status, time and visited-checkpoint fields only; no visitor name, contact, device identifier or GPS field. M02 §5.1; M03 §5.1; §9(17). |
| [x] Administrative identity isolation | AdminAccount email/provider user ID are M03 private data; public route/content projections do not expose them. Provider credentials remain in the provider, and AuditRecord excludes tokens/credential values. M03 §3/§6.4; physical schema §5. |
| [x] Access and storage boundary | Backend canonical tables use RLS and limited grants; M01/M02 browser-local values stay in the local profile. The latter can be lost when browser data is cleared. Physical schema §§5–6; M01/M02 §6. |
| [x] Seed values are synthetic | Repository owner confirmed in this review that all 17 canonical CSV files contain synthetic values and no real person's name, contact detail or identifier. The admin emails use `cucphuong-seed.example`; fixture provider IDs are synthetic. This is an attestation plus fixture inspection, not an automated proof of arbitrary text. |

The synthetic-data declaration applies to the current canonical CSV package only. Any replacement fixture needs the same review before publication or sharing.

## 12. DBML Representation and Validation

- The prior S4 revision recorded local syntax validation with `@dbml/core` 5.3.0 (`dbmlv2` parser). Current-revision parser result is recorded in the S6 review; the prior result alone does not validate these edits.
- Parsed inventory from the previous S4 validation: 16 tables and 160 fields. This revision represents all 21 confirmed S3 links: 19 DBML references, including REL-021, and two temporal lineage links in notes. Parser validation must be rerun for this revision before claiming syntax PASS.
- The previous parser validation reported no duplicate names or undefined references and accepted the composite syntax. Current structural checks do not replace parser validation.
- Markdown-to-DBML comparison: all 160 attribute paths match by entity/name, logical type category and presence (`Required` maps to DBML `not null`; Optional/Conditional remain nullable in the visualization).
- DBML parser/render validation was not rerun for this revision because no local parser is available. The structural inventory and attribute comparison do not constitute a syntax/render PASS.

Representation differences:

1. DBML maps UUID/String/Integer/Decimal/Boolean/Date/DateTime to `uuid`/`varchar`/`int`/`decimal`/`boolean`/`date`/`timestamp` only for visualization, as requested. These are not final PostgreSQL selections.
2. Embedded Object and Array paths are shown with quoted logical field names and logical custom type labels such as `Object` and `Array<Object>`; they are not mapped to JSON/JSONB and do not prescribe storage layout.
3. `OfflinePackage.resources[]` is visualized through the canonical OfflinePackage–OfflineResource relationship rather than as a duplicated embedded DBML field.
4. DBML composite `indexes { ... [pk] }` blocks visualize approved composite logical identifiers only; they do not prescribe physical indexes.
5. REL-014 and REL-019 remain in the conceptual catalog as creation/intake lineage. DBML does not draw them as continuing references because the current handoff can be replaced and browser-local sessions can disappear after accepted backend intake.
6. The remaining DBML `Ref` statements visualize logical associations, including IDs crossing browser/backend storage boundaries; they do not prescribe enforceable physical foreign keys. Physical design must classify each link by storage location.
7. Singleton/current, conditional presence, lifecycle, freeze, maker-checker, idempotency and last-active-Reviewer rules remain authoritative in this Markdown because DBML cannot express them completely.

## 13. Automatic S4 Gate

| Check | Result |
|---|---|
| All 16 canonical entities modeled | PASS |
| All source-supported attributes represented | PASS |
| Logical types and presence reviewed | PASS |
| Approved logical identifiers reviewed | PASS |
| All 21 confirmed S3 links represented (19 references, two lineage notes) | PASS |
| Frozen/historical values reviewed | PASS |
| Delete behavior reviewed | PASS |
| Enum/lifecycle transitions reviewed | PASS |
| Logical integrity constraints reviewed | PASS |
| DBML field and lineage mapping consistent with authoritative model | PASS — structural review; parser/render not rerun |
| No unsupported physical design introduced | PASS |

**S4 STATUS: PASS — READY FOR S5 SEED DATA**
