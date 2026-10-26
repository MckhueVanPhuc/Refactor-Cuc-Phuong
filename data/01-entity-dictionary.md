# Entity Dictionary — Cúc Phương Quest

## 1. Document Metadata

| Field | Value |
|---|---|
| Session | 5 — Data Modeling |
| Stage | S1 — Entity Dictionary Consolidation |
| Source specs | [Spec M01](../docs/spec/spec-M01.md) v2.0; [Spec M02](../docs/spec/spec-M02.md) v2.0; [Spec M03](../docs/spec/spec-M03.md) v2.0 |
| Functional evidence | [Function List M01](../docs/function%20list/function-list-M01.md); [Function List M02](../docs/function%20list/function-list-M02.md); [Function List M03](../docs/function%20list/function-list-M03.md) |
| Status | PASS — Human Gate 1 accepted; ready for S2 CRUD Matrix |
| Scope boundary | Logical entity consolidation only; no CRUD matrix, ERD, logical schema, physical keys, SQL or seed data |

The specs own behavior and logical contracts. This dictionary reconciles those sources; it does not add product requirements. Stable identity below is a logical/natural identity evidenced by source, not a physical PK/FK decision.

### Quick S0 guard

- Stable IDs remain available: M01 has 7 FN / 42 SF / 13 FR; M02 has 8 FN / 46 SF / 20 FR; M03 has 10 FN / 83 SF / 16 FR.
- Cross-module fields have stable names, logical types and Required/Optional/Conditional presence rules in the current specs.
- Published Route, JourneySnapshot, LanguagePreference, SelectedRouteContext v2, OfflinePackage, LiveStationContent and SessionSyncRecord producer/consumer shapes are aligned.
- Business rules and ownership boundaries are sufficient for S1. Human Gate 1 decisions are incorporated in this dictionary.

## 2. Input Map

| Slot | Sources used | S1 use |
|---|---|---|
| FUNCTIONS | Function Lists M01–M03 §§2–4; spec FR sections | Functional evidence for every accepted entity and coverage check. |
| FIELDS | M01 §5.3; M02 §5.1 and §6; M03 §5.1 and §6 | Logical attributes, presence, stable identifiers and transport shapes. |
| ENTITIES | M01 §6; M02 §6; M03 §6 | Initial candidate nouns, owner statements and logical persistence constraints. |
| RULES | M01 §5.5/§6.4; M02 §5.2/§6; M03 §5.2/§6 | Lifecycle, uniqueness, immutability, atomicity, retention and ownership. |
| SCENARIOS | Specs M01–M03 §3 | Evidence that data concepts participate in user/business outcomes. |
| FLOWS | Specs M01–M03 §4; architecture usage/sequence documents | Source/copy/transport transitions without creating new entities. |

## 3. Consolidated Entities

| Entity ID | Canonical Entity | Classification | Definition | Owner | Stable Identity | Main Sources | Key Rules | Aliases / Representations |
|---|---|---|---|---|---|---|---|---|
| ENT-DATA-001 | Route | THING | Canonical administrated route whose approved public fields are projected to M01. | M03 | `routeId` | M03 §5.1, §6.1; M01 §5.3 | Lifecycle, bilingual publication, active snapshot compatibility, concurrency | Published Route is a read model/projection. |
| ENT-DATA-002 | Checkpoint | THING | Stable route member with name, sequence, connectivity classification and lifecycle. | M03 | `checkpointId` | M03 §5.1, §6.2; M01 §5.3 | Exactly one route; sequence unique per non-archived route; active QR/content guards | `QRCheckpoint` is an earlier alias for its snapshot projection. |
| ENT-DATA-003 | QRCode | THING | Managed QR identity assigned to exactly one checkpoint. | M03 | `qrIdentifier` | M03 §6.2; FN-M03-003 | Globally unique; reprint preserves identity; replace/withdraw terminal semantics | `qrIdentifiers[]` is an embedded projection in snapshots/manifests. |
| ENT-DATA-004 | CheckpointContent | THING | Language-specific, revisioned checkpoint content governed by review/publication lifecycle. | M03 | `(checkpointId, languageCode, revision)` | M03 §6.3; FN-M03-004/005 | One stream per checkpoint/language; maker-checker; at most one current published value per language | Canonical name remains CheckpointContent; current published content is a projection. |
| ENT-DATA-005 | Media | THING | Managed image/audio/video resource with rights and publication eligibility. | M03 | `mediaId: UUID` | M03 §6.3; FN-M03-004 | Rights required before publication; only published media is public; offline package includes images only | `sourceRef` is a resource/storage reference, not identity; live `mediaResources[]` and `staticImages[]` are projections. |
| ENT-DATA-006 | JourneySnapshot | EVENT | Immutable, versioned full-journey publication produced for journey-affecting changes. | M03 | `(routeId, contentVersion)` | M03 §5.1, §5.2, §6; M01 §5.3 | Immutable after `DA_CONG_BO`; full active checkpoint set; retention; previous-version link | Source of package manifest, handoff manifest and frozen session journey. |
| ENT-DATA-007 | AdminAccount | THING | M03 application account linking normalized email/provider identity to fixed role and account status. | M03 | normalized `email` | M03 §5.2, §6.4 | Email is the MVP logical identity from invitation through active account; provider `userId` is unique external linkage when present | Provider credential/session is external; no ProviderIdentity entity is introduced. |
| ENT-DATA-008 | AuditRecord | EVENT | Append-only record of an administrative or provisioning action and its before/after context. | M03 | `auditId` | M03 §6.4; FN-M03-005/007/008 | Append-only; no credential/token values; actor may be absent for server-side provisioning | Publication/account/concurrency audit entries share this entity. |
| ENT-DATA-009 | LanguagePreference | THING | Current persisted language selection for one local application profile. | M01 | Singleton slot in one local application profile | M01 §5.3, §6.2/§6.4; M02 §5.1 | `languageCode` is `vi` or `en`; replacement is independent of package/session state | Shared contract read by M02. |
| ENT-DATA-010 | SelectedRouteContext | THING | Current atomic, one-use route handoff written by M01 for M02 session creation. | M01 | `handoffId` UUID; one current singleton context | M01 §5.3, §6.2/§6.4; M02 §5.1 | New ID per Start; atomic replacement; `AUTHORIZED`/`REVOKED`; one handoff creates at most one session | `SelectedRouteContext v2`; contains embedded `routeJourneyManifest`. |
| ENT-DATA-011 | OfflinePackage | THING | Local route/version package containing full journey manifest and ready offline resource set. | M01 | `(routeId, contentVersion)` | M01 §5.3, §5.5, §6; M02 §5.1 | Completeness separate from freshness; atomic candidate activation; at most one active ready package per route | Candidate/staging is a lifecycle representation, not another entity. |
| ENT-DATA-012 | OfflineResource | THING | M01-owned local copy of bilingual text and packaged static images for one offline-required checkpoint/version. | M01 | `(routeId, contentVersion, checkpointId)` | M01 §5.3, §6.2/§6.4; M02 §5.1 | Only for offline-required checkpoints; package delete removes its resources; does not delete context/session | `OfflineStationContent` is an M02 read-only view; M03 `offlineResource` is the embedded source value. |
| ENT-DATA-013 | PlaySession | THING | Local field-experience session created from one accepted handoff with immutable journey data. | M02 | `sessionId` UUID; unique `sourceHandoffId` | M02 §5.2, §6.1 | At most one in progress per device; fixed journey; atomic replacement; terminal states immutable | Frozen journey is embedded; RouteJourneyMap is a view. |
| ENT-DATA-014 | CheckpointVisit | EVENT | First valid check-in of one checkpoint during one PlaySession. | M02 | `(sessionId, checkpointId)` | M02 §5.2, §6.2 | Unique by session/checkpoint, not QR; first time immutable; saved before content loading | SessionSyncRecord carries a historical value copy. |
| ENT-DATA-015 | PendingSyncItem | THING | Local queue item wrapping one immutable terminal SessionSyncRecord and its sync outcome. | M02 | `sessionId` UUID; at most one item per terminal session | M02 §6.4; FN-M02-007 | `PENDING` retries; `SYNCED` acknowledges; `CONFLICT` stops automatic retry; record is never mutated | Local sync queue entry; contains transport value `record`. |
| ENT-DATA-016 | SessionRecord | EVENT | M03-persisted immutable terminal session business record accepted from M02. | M03 | `sessionId` UUID | M03 §5.1, §5.2, §6.4; M02 §5.1 | Identical retry idempotent; changed payload conflicts; anonymous; child visits unique; reports use synchronized records only | Derived from transport `SessionSyncRecord`; adds M03-owned `ingestedAt`. |

## 4. Entity Detail

### ENT-DATA-001 — Route

- Classification: THING.
- Owner: M03.
- Definition: Canonical source route under administrative lifecycle; approved fields form the Published Route projection consumed by M01.
- Stable identity: `routeId: String`, stable and never changed.
- Lifecycle: `NHAP → CHO_DUYET → HOAT_DONG → TAM_DONG → LUU_TRU`; rejection returns to `NHAP`; Reviewer may reopen `TAM_DONG → HOAT_DONG`.
- Main attributes supported by source: `routeId`, `status`, bilingual `name`/`description`, optional both-or-none `safetyWarning`, `distanceKm`, `durationMin`, `difficulty`, three tag arrays, conditional `activeContentVersion`, `concurrencyRevision`.
- Relationships evidenced by source: contains Checkpoints; active version refers to a published JourneySnapshot of the same route; Published Route is its consumer projection.
- Used by functions: FN-M03-001/005/006/007; FN-M01-002/003/004/006.
- Business rules: BR-M03-001/004/007/011/014; BR-M01-002/003/011.
- Cross-module representations: Published Route projection; `routeId` copied into snapshots, packages, contexts, sessions and reports.
- Source references: [M03 §5.1 and §6.1](../docs/spec/spec-M03.md); [M01 §5.3](../docs/spec/spec-M01.md); [Function List M03](../docs/function%20list/function-list-M03.md).
- Decision status: No outstanding decision for S1.

### ENT-DATA-002 — Checkpoint

- Classification: THING.
- Owner: M03.
- Definition: Stable route member whose approved name, order, connectivity and QR set participate in journey publication.
- Stable identity: `checkpointId: String`.
- Lifecycle: `NHAP → HOAT_DONG → TAM_DONG → LUU_TRU`; Reviewer may reopen `TAM_DONG → HOAT_DONG`.
- Main attributes supported by source: `checkpointId`, `routeId`, `checkpointName`, `sequence`, `connectivityMode`, conditional `fieldVerificationConfirmed`, `status`, `concurrencyRevision`.
- Relationships evidenced by source: belongs to exactly one Route; has one or more active QRCode values when active; has per-language CheckpointContent streams; appears in JourneySnapshot.
- Used by functions: FN-M03-002/006/007/009; FN-M01-004/005/006; FN-M02-003/004/005.
- Business rules: BR-M03-003/006/010/011/013; BR-M02-004/006.
- Cross-module representations: snapshot/manifest checkpoint value; the old term `QRCheckpoint` is not a separate canonical entity.
- Source references: [M03 §5.1 and §6.2](../docs/spec/spec-M03.md); [M01 §5.3 and §6](../docs/spec/spec-M01.md).
- Decision status: No outstanding decision for S1.

### ENT-DATA-003 — QRCode

- Classification: THING.
- Owner: M03.
- Definition: Logical QR identity resolved to one Checkpoint; physical reprints do not create a new identity.
- Stable identity: `qrIdentifier: String`, globally unique.
- Lifecycle: created `HOAT_DONG`; may become terminal `DA_THAY` or `THU_HOI`.
- Main attributes supported by source: `qrIdentifier`, `checkpointId`, `installationLabel`, `status`, conditional `replacementReason`.
- Relationships evidenced by source: belongs to exactly one Checkpoint; active sets are embedded as `qrIdentifiers[]` in JourneySnapshot and downstream manifests.
- Used by functions: FN-M03-003/006/009; FN-M02-004/008.
- Business rules: BR-M03-009/010; BR-M02-004/008.
- Cross-module representations: String identifier embedded in snapshot, handoff, package and frozen journey; LiveStationContent includes the resolved identifier.
- Source references: [M03 §6.2](../docs/spec/spec-M03.md); [Function List M03 FN-M03-003](../docs/function%20list/function-list-M03.md).
- Decision status: No outstanding decision for S1.

### ENT-DATA-004 — CheckpointContent

- Classification: THING.
- Owner: M03.
- Definition: One language-specific revision in the content stream for a checkpoint.
- Stable identity: `(checkpointId, languageCode, revision)` based on the declared per-language stream and revision number.
- Lifecycle: `NHAP → CHO_DUYET → DA_DUYET → PHAT_HANH → LUU_TRU`; rejection returns to `NHAP`; editing published content creates a new draft revision.
- Main attributes supported by source: `checkpointId`, `languageCode`, `revision`, conditional `introductionText`, `status`, conditional `submittedByUserId`, `approvedByUserId`, `reviewReason`, `concurrencyRevision`.
- Relationships evidenced by source: belongs to one Checkpoint and one language stream; approved branches feed JourneySnapshot offline content and LiveStationContent.
- Used by functions: FN-M03-004/005/006/009; FN-M02-005/008 through projections.
- Business rules: BR-M03-002/003/006/014.
- Cross-module representations: published `introductionText` in JourneySnapshot, OfflineResource and LiveStationContent; these copies are not CheckpointContent entities.
- Source references: [M03 §6.3](../docs/spec/spec-M03.md); [Function List M03 FN-M03-004/005](../docs/function%20list/function-list-M03.md).
- Decision status: No outstanding decision for S1. HC-004 confirms the canonical name remains CheckpointContent; each instance has revision/lifecycle and current published content is a projection.

### ENT-DATA-005 — Media

- Classification: THING.
- Owner: M03.
- Definition: Managed public media resource associated with a checkpoint and gated by usage rights/publication state.
- Stable identity: `mediaId: UUID`.
- Lifecycle: source declares draft/edit, approval/publication eligibility and exclusion of unpublished/rights-incomplete media, but no separate full Media state enum.
- Main attributes supported by source: `mediaId`, `sourceRef`, `checkpointId`, `type`, `usageRightsConfirmed`, `isPublished`, `concurrencyRevision`; `sourceRef` is a resource/storage reference and is not identity.
- Relationships evidenced by source: belongs to a Checkpoint; image references may be embedded in JourneySnapshot; image/audio/video references may be projected to LiveStationContent.
- Used by functions: FN-M03-004/009; FN-M02-005/008 through live projections; FN-M01-005 through snapshot image references.
- Business rules: BR-M03-003/006; offline resources contain images only.
- Cross-module representations: `staticImages[]` String references and LiveStationContent `mediaResources[]`; no separate consumer-owned Media entity.
- Source references: [M03 §5.1 and §6.3](../docs/spec/spec-M03.md); [Function List M03 FN-M03-004](../docs/function%20list/function-list-M03.md).
- Decision status: No outstanding decision for S1; HC-002 is resolved.

### ENT-DATA-006 — JourneySnapshot

- Classification: EVENT.
- Owner: M03.
- Definition: Immutable full-journey state published for one Route/content version after a journey-affecting change.
- Stable identity: `(routeId, contentVersion)`.
- Lifecycle: `DANG_TAO → DA_CONG_BO`; published state is immutable.
- Main attributes supported by source: `routeId`, `contentVersion`, `status`, `publishedAt`, optional `previousContentVersion`, complete `checkpoints[]`, conditional embedded `offlineResource` values.
- Relationships evidenced by source: belongs to one Route/version; has zero or one same-Route predecessor and zero or many successors (M03 §6.4 CL-S4-001); embeds Checkpoint/QRCode projections and conditional content/media values.
- Used by functions: FN-M03-005/006/007; FN-M01-004/005/006.
- Business rules: BR-M03-004/005/006/008; BR-M01-004/008.
- Cross-module representations: source for OfflinePackage.manifest, SelectedRouteContext.routeJourneyManifest and M02 frozen journey. Those are value copies, not JourneySnapshot entities.
- Source references: [M03 §5.1, §5.2 and §6](../docs/spec/spec-M03.md); [M01 §5.3](../docs/spec/spec-M01.md).
- Decision status: No outstanding decision for S1.

### ENT-DATA-007 — AdminAccount

- Classification: THING.
- Owner: M03.
- Definition: Application authorization account distinct from provider-owned identity and credentials.
- Stable identity: normalized `email` is the logical identity in the MVP from `INVITATION_PENDING` through the active account lifecycle. Provider `userId` is a unique external/provider linkage when present, not a second entity identity.
- Lifecycle: `INVITATION_PENDING → ACTIVE ↔ DEACTIVATED`; recovery does not change lifecycle.
- Main attributes supported by source: conditional `userId`, normalized unique `email`, fixed `role`, `status`, `createdAt`, `updatedAt`, `concurrencyRevision`.
- Relationships evidenced by source: may link to one external provider identity through unique `userId`; user IDs appear as submitter/approver/audit actors; last active Reviewer is protected across role/status mutations. No ProviderIdentity entity is introduced.
- Used by functions: FN-M03-008; authorization evidence supports FN-M03-001–010 protected operations.
- Business rules: BR-M03-002/014/015/018/019/020.
- Cross-module representations: Auth provider session/credential is external; it is not AdminAccount.
- Source references: [M03 §5.2 and §6.4](../docs/spec/spec-M03.md); [Function List M03 FN-M03-008](../docs/function%20list/function-list-M03.md).
- Decision status: No outstanding decision for the MVP. If email change is supported in the future, the identity rule must be reviewed.

### ENT-DATA-008 — AuditRecord

- Classification: EVENT.
- Owner: M03.
- Definition: Immutable history item for an administrative mutation, review/publication outcome or account-provisioning action.
- Stable identity: `auditId: String`.
- Lifecycle: appended once and never updated.
- Main attributes supported by source: `auditId`, conditional `actorUserId`, `action`, `entityType`, `entityId`, optional `revision`, optional `beforeState`/`afterState`, `occurredAt`.
- Relationships evidenced by source: refers logically to an affected administrative entity/revision and usually an AdminAccount actor.
- Used by functions: FN-M03-005/007/008; other protected mutations use the shared audit behavior through FN-M03-008-13.
- Business rules: BR-M03-002/014/015/019/020; audit values exclude credentials/tokens.
- Cross-module representations: none; not exposed as a visitor contract.
- Source references: [M03 §6.4](../docs/spec/spec-M03.md); [Function List M03](../docs/function%20list/function-list-M03.md).
- Decision status: No outstanding decision for S1.

### ENT-DATA-009 — LanguagePreference

- Classification: THING.
- Owner: M01.
- Definition: Current language setting persisted for the current local application profile and shared read-only with M02.
- Stable identity: singleton preference slot in one local application profile.
- Lifecycle: absent before initial selection; valid selection creates/replaces current `languageCode`; browser data deletion may remove it.
- Main attributes supported by source: `languageCode: Enum(vi, en)`.
- Relationships evidenced by source: controls selection of language branches without changing OfflinePackage or PlaySession state.
- Used by functions: FN-M01-001/007; FN-M02-005.
- Business rules: BR-M01-001; BR-M02-009 indirectly governs content source while the preference selects the branch.
- Cross-module representations: exact M01→M02 LanguagePreference contract.
- Source references: [M01 §5.3 and §6](../docs/spec/spec-M01.md); [M02 §5.1](../docs/spec/spec-M02.md).
- Decision status: No outstanding decision for S1; Human Gate 1 accepted singleton THING classification rather than an unpersisted value object.

### ENT-DATA-010 — SelectedRouteContext

- Classification: THING.
- Owner: M01.
- Definition: Current shared one-use handoff authorizing M02 to create a PlaySession from one frozen route/version manifest.
- Stable identity: globally unique `handoffId: UUID`; only one current context is stored.
- Lifecycle: created `AUTHORIZED`; may become `REVOKED`; later Start atomically replaces current context. M02 consumption is enforced by unique `sourceHandoffId`, not by a new context status.
- Main attributes supported by source: `contractVersion`, `handoffId`, `routeId`, `authorizedAt`, `authorizationStatus`, embedded `routeJourneyManifest`.
- Relationships evidenced by source: refers to one Route and one journey version; at most one PlaySession may originate from the handoff.
- Used by functions: FN-M01-006/007; FN-M02-001/006.
- Business rules: BR-M01-009/010/011; BR-M02-001/003/013.
- Cross-module representations: exact `SelectedRouteContext v2` producer/consumer contract; manifest is an embedded JourneySnapshot projection.
- Source references: [M01 §5.3, §5.5 and §6](../docs/spec/spec-M01.md); [M02 §5.1](../docs/spec/spec-M02.md).
- Decision status: No outstanding decision for S1.

### ENT-DATA-011 — OfflinePackage

- Classification: THING.
- Owner: M01.
- Definition: Versioned local package whose ready form exposes complete journey metadata and all required offline resource values.
- Stable identity: `(routeId, contentVersion)`.
- Lifecycle: `CHUA_TAI → DANG_TAI → SAN_SANG` or `CHUA_HOAN_TAT`; ready packages have `CURRENT`/`OUTDATED`; delete returns logical `CHUA_TAI`; candidate activation is atomic.
- Main attributes supported by source: `routeId`, `contentVersion`, `status`, conditional `versionStatus`, embedded `manifest`, `resources[]`, optional `downloadedAt`.
- Relationships evidenced by source: belongs to one Route/version; contains OfflineResource values; its manifest is a JourneySnapshot metadata copy.
- Used by functions: FN-M01-004/005/006/007; FN-M02-005.
- Business rules: BR-M01-004/005/006/008; only ready active data is exposed to M02.
- Cross-module representations: exact M01→M02 contract; candidate/staging and active are lifecycle representations of this concept.
- Source references: [M01 §5.3–§6](../docs/spec/spec-M01.md); [M02 §5.1](../docs/spec/spec-M02.md).
- Decision status: No outstanding decision for S1.

### ENT-DATA-012 — OfflineResource

- Classification: THING.
- Owner: M01.
- Definition: Persisted local resource value packaged for one offline-required checkpoint at one route/version.
- Stable identity: `(routeId, contentVersion, checkpointId)`.
- Lifecycle: prepared as candidate; exposed only with complete ready package; removed with package/candidate deletion; never deletes SelectedRouteContext or M02 data.
- Main attributes supported by source: package-derived `routeId`/`contentVersion`, embedded `checkpointId`, bilingual `localizedContent.*.introductionText`, `staticImages[]` references whose bytes are present.
- Relationships evidenced by source: belongs to one OfflinePackage and references one checkpoint in its manifest.
- Used by functions: FN-M01-005/007; FN-M02-005.
- Business rules: BR-M01-004/006; only offline-required checkpoints receive resources; both languages and declared images must validate.
- Cross-module representations: M03 JourneySnapshot `offlineResource` is the source embedded value; M02 `OfflineStationContent` is a read-only view of this M01 entity.
- Source references: [M01 §5.3, §5.4 and §6](../docs/spec/spec-M01.md); [M02 §5.1 and §6](../docs/spec/spec-M02.md).
- Decision status: No outstanding decision for S1.

### ENT-DATA-013 — PlaySession

- Classification: THING.
- Owner: M02.
- Definition: Local field session created from an authorized unused handoff and carrying a frozen journey for its full lifecycle.
- Stable identity: globally unique `sessionId: UUID`; `sourceHandoffId` is also unique.
- Lifecycle: created `DANG_DIEN_RA`; transitions to `HOAN_TAT` after final checkpoint and confirmation, or `BO_DO` after valid replacement handoff; terminal state is immutable.
- Main attributes supported by source: `sessionId`, `sourceHandoffId`, `routeId`, `contentVersion`, embedded `journeyCheckpoints`, `status`, `startedAt`, conditional `endedAt`.
- Relationships evidenced by source: originates from one SelectedRouteContext; owns CheckpointVisits; has at most one terminal sync payload/PendingSyncItem.
- Used by functions: FN-M02-001/002/003/004/006/007.
- Business rules: BR-M02-001/002/003/006/007/010/013.
- Cross-module representations: terminal historical value becomes SessionSyncRecord, then M03 SessionRecord; the local PlaySession itself is not transferred.
- Source references: [M02 §5.2 and §6.1](../docs/spec/spec-M02.md); [Function List M02](../docs/function%20list/function-list-M02.md).
- Decision status: No outstanding decision for S1.

### ENT-DATA-014 — CheckpointVisit

- Classification: EVENT.
- Owner: M02.
- Definition: First valid visit event for a session/checkpoint pair, independent of whether content later loads.
- Stable identity: `(sessionId, checkpointId)`.
- Lifecycle: inserted on first valid journey check-in; repeated QR scans reuse original time; immutable when session becomes terminal.
- Main attributes supported by source: `sessionId`, `checkpointId`, observed `qrIdentifier`, first `checkedInAt`.
- Relationships evidenced by source: belongs to one PlaySession; refers to one checkpoint in the frozen journey; historical label/sequence are read from that journey for sync.
- Used by functions: FN-M02-002/003/004/006/007.
- Business rules: BR-M02-004/005/006/008/010.
- Cross-module representations: `SessionSyncRecord.visitedCheckpoints[]` and SessionRecord child values are frozen historical projections, not the local event entity itself.
- Source references: [M02 §5.2 and §6.2](../docs/spec/spec-M02.md).
- Decision status: No outstanding decision for S1.

### ENT-DATA-015 — PendingSyncItem

- Classification: THING.
- Owner: M02.
- Definition: Durable local delivery state for one frozen terminal transport payload.
- Stable identity: `sessionId: UUID`; at most one queue item per terminal session.
- Lifecycle: `PENDING → SYNCED` after new/identical acknowledgement, or `PENDING → CONFLICT` after same-ID changed-payload response; transient failures retain `PENDING`.
- Main attributes supported by source: `sessionId`, embedded immutable `record: SessionSyncRecord`, `syncStatus`.
- Relationships evidenced by source: belongs one-to-one with a terminal PlaySession and wraps one transport value destined for M03.
- Used by functions: FN-M02-006/007.
- Business rules: BR-M02-010/011/013.
- Cross-module representations: queue item remains M02-local; only its `record` transport value crosses to M03.
- Source references: [M02 §6.4](../docs/spec/spec-M02.md); [Function List M02 FN-M02-007](../docs/function%20list/function-list-M02.md).
- Decision status: No outstanding decision for S1.

### ENT-DATA-016 — SessionRecord

- Classification: EVENT.
- Owner: M03.
- Definition: Canonical persisted terminal session history accepted through SessionSyncRecord intake and used by operational reports.
- Stable identity: `sessionId: UUID`.
- Lifecycle: inserted atomically on first accepted payload; never changed; identical retries acknowledge without mutation and different retries conflict.
- Main attributes supported by source: `sessionId`, `routeId`, `contentVersion`, `startedAt`, `endedAt`, terminal `status`, immutable `visitedCheckpoints[]`, M03-owned `ingestedAt`.
- Relationships evidenced by source: contains child historical visit values unique by session/checkpoint; feeds RPT-01 and RPT-02.
- Used by functions: FN-M02-006/007 through transport; FN-M03-010 for intake/reporting.
- Business rules: BR-M02-010/011; BR-M03-016/017.
- Cross-module representations: SessionSyncRecord is the transport value; SessionRecord is the persisted M03 entity and is not automatically the same entity as M02 PlaySession.
- Source references: [M03 §5.1, §5.2 and §6.4](../docs/spec/spec-M03.md); [M02 §5.1](../docs/spec/spec-M02.md).
- Decision status: No outstanding decision for S1.

## 5. Implied Entities

| Candidate | Why implied | Evidence | Why not canonical | Human Gate disposition |
|---|---|---|---|---|
| AdministrativeRevision | Route/checkpoint/QR changes are edited, submitted, diffed, approved/rejected and published as revisioned state. | M03 US-M03-01/02/03; FR-M03-005–009; FN-M03-005; Route/Checkpoint carry `concurrencyRevision`, but no revision entity contract is declared. | Human Gate 1 decided not to promote it. Route, CheckpointContent and QRCode continue to own their respective revision/review lifecycle. | Keep implied only. S4 review is complete and does not require a separate canonical entity; the 16-entity baseline is final for MVP. |

## 6. Human Conflicts

| Conflict ID | Concept A | Concept B | Conflict type | Evidence | Resolution | Status |
|---|---|---|---|---|---|---|
| HC-001 | AdminAccount normalized email | Provider `userId` | Identity evolution | M03 §6.4 makes email unique, userId conditional and stable when present; invitation creates account before provider linkage. | Keep one AdminAccount. Normalized email is its MVP logical identity from invitation through active account; `userId` is unique external/provider linkage when present. Do not create ProviderIdentity. Review this identity rule if email change is supported later. | RESOLVED |
| HC-002 | Media `sourceRef` | Media entity identity | Missing stable identity | M03 §6.3 now declares `mediaId: UUID` and distinguishes `sourceRef` as a resource/storage reference. | Use `mediaId: UUID` as stable logical identity; `sourceRef` is not identity. | RESOLVED |
| HC-003 | AdministrativeRevision | Route/Checkpoint/QRCode mutation state | Entity versus embedded state | Review/publication functions evidence revisioned state, but no independent revision contract exists. | Do not promote it. Keep it implied; Route, CheckpointContent and QRCode own their respective lifecycle. S4 review is complete; no independent canonical revision entity is required for MVP. | RESOLVED |
| HC-004 | `CheckpointContent` | Language-specific content revision/current published content | Naming/entity-versus-projection ambiguity | M03 §6.3 calls the entity CheckpointContent and gives each instance a `revision` and lifecycle; one `PHAT_HANH` value is current per language. | Keep CheckpointContent as canonical name. Current published content is a projection, not a separate entity; do not rename to CheckpointContentRevision. | RESOLVED |

Previously audited names are not remaining conflicts:

- `Checkpoint` is canonical; `QRCheckpoint` is an old projection alias.
- `OfflineResource` is canonical M01 local data; `OfflineStationContent` is an M02 read-only view.
- `LiveStationContent` is a transport/read contract, not a persisted M02 entity.
- `SessionSyncRecord` is transport; `SessionRecord` is persisted M03 data.
- JourneySnapshot manifests and frozen journeys are source/copy representations, not duplicate entities.

## 7. Non-Entities / Excluded Concepts

| Concept | Classification | Reason not treated as a canonical entity |
|---|---|---|
| Published Route | READ MODEL / VIEW | Public projection of Route; same canonical source identity. |
| RecommendationContext | TRANSIENT CONTEXT | Three selected criteria used for deterministic filtering; no persistence requirement or stable identity. |
| `routeJourneyManifest` | VALUE OBJECT / EMBEDDED VALUE | JourneySnapshot metadata copy embedded in SelectedRouteContext. |
| `OfflinePackage.manifest` | VALUE OBJECT / EMBEDDED VALUE | JourneySnapshot metadata copy embedded in OfflinePackage. |
| JourneySnapshot `offlineResource` | VALUE OBJECT / EMBEDDED VALUE | M03 source value embedded conditionally in a snapshot; copied into M01 OfflineResource. |
| Frozen session journey / `journeyCheckpoints` | VALUE OBJECT / EMBEDDED VALUE | Immutable copy owned inside PlaySession, without independent identity/lifecycle. |
| RouteJourneyMap | READ MODEL / VIEW | Ordered view of PlaySession.journeyCheckpoints. |
| OfflineStationContent | READ MODEL / VIEW | M02 read-only view of M01 OfflineResource. |
| LiveStationContent | READ MODEL / VIEW | M03→M02 live transport payload; source data remains Checkpoint/Content/Media/QRCode. |
| SessionSyncRecord | VALUE OBJECT / EMBEDDED VALUE | Immutable transport payload wrapped by PendingSyncItem and accepted into SessionRecord. |
| RPT-01 output | READ MODEL / VIEW | Aggregate of synchronized SessionRecord data. |
| RPT-02 output | READ MODEL / VIEW | Grouped projection of SessionRecord visit values. |
| Report filters | TRANSIENT CONTEXT | Optional query inputs, not retained business data. |
| Offline package candidate/staging | TRANSIENT CONTEXT | Non-exposed lifecycle representation of OfflinePackage, not a new business identity. |
| `qrIdentifiers[]` item | VALUE OBJECT / EMBEDDED VALUE | String projection of canonical QRCode identity. |
| Live `mediaResources[]` item | VALUE OBJECT / EMBEDDED VALUE | Transport projection of canonical Media. |
| Provider credential/session/token | External data concept | Owned by the authentication provider; M03 owns only AdminAccount role/status. |
| Device/local application profile | Context boundary, not entity | Rules use device/profile scope but explicitly prohibit synchronized device identifiers and visitor accounts. |
| UI loading/error/confirmation state | UI state | Screen behavior only; no canonical persistence identity. |

## 8. Coverage Check

This is FN-level evidence coverage only, not a CRUD matrix.

| Function ID | Known entities/data concepts touched | Coverage result |
|---|---|---|
| FN-M01-001 | LanguagePreference | Covered |
| FN-M01-002 | Route, JourneySnapshot, SelectedRouteContext | Covered |
| FN-M01-003 | Route; transient RecommendationContext | Covered |
| FN-M01-004 | Route, JourneySnapshot, OfflinePackage | Covered |
| FN-M01-005 | JourneySnapshot, OfflinePackage, OfflineResource | Covered |
| FN-M01-006 | Route, JourneySnapshot, OfflinePackage, SelectedRouteContext | Covered |
| FN-M01-007 | LanguagePreference, SelectedRouteContext, OfflinePackage | Covered |
| FN-M02-001 | SelectedRouteContext, PlaySession | Covered |
| FN-M02-002 | PlaySession, CheckpointVisit | Covered |
| FN-M02-003 | PlaySession; embedded frozen journey; RouteJourneyMap view | Covered |
| FN-M02-004 | QRCode projection, Checkpoint, CheckpointVisit | Covered |
| FN-M02-005 | LanguagePreference, OfflineResource, CheckpointContent/Media projections | Covered |
| FN-M02-006 | PlaySession, CheckpointVisit, PendingSyncItem | Covered |
| FN-M02-007 | PlaySession, PendingSyncItem, SessionSyncRecord transport, SessionRecord destination | Covered |
| FN-M02-008 | QRCode/Checkpoint/CheckpointContent/Media through LiveStationContent | Covered |
| FN-M03-001 | Route, AuditRecord | Covered |
| FN-M03-002 | Route, Checkpoint, JourneySnapshot, AuditRecord | Covered |
| FN-M03-003 | Checkpoint, QRCode, JourneySnapshot, AuditRecord | Covered |
| FN-M03-004 | CheckpointContent, Media, JourneySnapshot | Covered |
| FN-M03-005 | Route, CheckpointContent, JourneySnapshot, AuditRecord; implied AdministrativeRevision | Covered |
| FN-M03-006 | Route, Checkpoint, QRCode, CheckpointContent, JourneySnapshot | Covered |
| FN-M03-007 | Route, Checkpoint, JourneySnapshot, AuditRecord | Covered |
| FN-M03-008 | AdminAccount, AuditRecord | Covered |
| FN-M03-009 | QRCode, Checkpoint, CheckpointContent, Media; LiveStationContent view | Covered |
| FN-M03-010 | SessionRecord; SessionSyncRecord transport; RPT-01/RPT-02 views | Covered |

- Entity-orphaned functions: none.
- Canonical entities with no FN-level evidence: none.
- Human Gate disposition: AdministrativeRevision remains implied and is not promoted; S4 review confirms the existing 16-entity baseline is sufficient for MVP.

## 9. Human Gate 1

- [x] Canonical entity names accepted
- [x] Aliases/synonyms accepted
- [x] Ownership accepted
- [x] Implied entities reviewed
- [x] Conflicts resolved
- [x] Non-entity exclusions accepted
- [x] Ready for S2 CRUD Matrix

**S1 STATUS: PASS — READY FOR S2 CRUD MATRIX**
