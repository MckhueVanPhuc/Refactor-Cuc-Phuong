# Entity Dictionary — Cúc Phương Quest

## 1. Document Metadata

| Field | Value |
|---|---|
| Session | 5 — Data Modeling |
| Stage | S1 — Entity Dictionary Consolidation |
| Source specs | [Spec M01](../docs/spec/spec-M01.md) v3.2; [Spec M02](../docs/spec/spec-M02.md) v3.3; [Spec M03](../docs/spec/spec-M03.md) v3.7 |
| Functional evidence | [Function List M01](../docs/function%20list/function-list-M01.md); [Function List M02](../docs/function%20list/function-list-M02.md); [Function List M03](../docs/function%20list/function-list-M03.md) |
| Status | PASS — Human Gate 1 (V2) accepted 2026-10-28; ready for S2 CRUD Matrix |
| Scope boundary | Logical entity consolidation only; no CRUD matrix, ERD, logical schema, physical keys, SQL or seed data |

The specs own behavior and logical contracts. This dictionary reconciles those sources; it does not add product requirements. Stable identity below is a logical/natural identity evidenced by source, not a physical PK/FK decision.

### Quick S0 guard

- Stable IDs remain available: M01 has 7 FN / 50 SF / 14 FR; M02 has 8 FN / 55 SF / 26 FR; M03 has 11 FN / 113 SF / 18 active FR (FR-M03-017 removed in the spec).
- Cross-module fields have stable names, logical types and Required/Optional/Conditional presence rules in the current specs.
- Published Route, JourneySnapshot, LanguagePreference, SelectedRouteContext v3, OfflinePackage, LiveQrLookupResult with LiveStationContent and SessionSyncRecord producer/consumer shapes are aligned.
- Business rules and ownership boundaries are sufficient for S1. Human Gate 1 (V2, 2026-10-28) decisions are incorporated in this dictionary: CheckpointContent (ENT-DATA-004) is retired and replaced by Revision (ENT-DATA-017); OfflineRouteMap and RouteEssentials are embedded values of OfflinePackage (HC-005). The canonical set has 16 entities.

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
| ENT-DATA-001 | Route | THING | Canonical administrated day-trip route whose published revision forms the Published Route projection consumed by M01; it lists published checkpoints in its own order. | M03 | `routeId` | M03 §5.1, §6.1, §6.1.1; M01 §5.3 | Lifecycle without review state; discard, auto-close, archive; checkpoint list and order; derived time tag; concurrency | Published Route is a read model/projection; editable content lives in Revision. |
| ENT-DATA-002 | Checkpoint | THING | Real-world area in a shared library, independent of any route, with bilingual name and connectivity mode; it holds visit points (QR objects). | M03 | `checkpointId` | M03 §6.2, §6.2.1; M01 §5.3 | Belongs to no route; listed by any number of routes; unique Vietnamese name; own publication; archive only when unlisted | `QRCheckpoint` is an earlier alias for its snapshot projection; order belongs to each route list. |
| ENT-DATA-003 | QRCode | THING | Visit point: one system-generated QR identity attached to one thing in one checkpoint, owning the visitor content shown when scanned. | M03 | `qrIdentifier` | M03 §6.2, §6.2.2; FN-M03-003 | Globally unique and unguessable; reprint preserves identity; no identity replacement; revoke is terminal; last active QR of an active checkpoint protected | `qrIdentifiers[]` and `offlineResources[]` items in snapshots/manifests; public QR link is derived from it. |
| ENT-DATA-004 | CheckpointContent | RETIRED (V2) | Retired 2026-10-28: spec M03 v3.7 no longer defines it; visitor content belongs to QR objects and every editable content version is a Revision. | — | — | M03 §6.3, §6.4 DEC-S6-002 (revised), BR-M03-A05, BR-M03-E01 | Replaced by ENT-DATA-017 Revision; the ID is not reused | — |
| ENT-DATA-005 | Media | THING | Managed image/audio/video file owned by a route or a checkpoint, with usage rights and, for audio/video, a spoken language. | M03 | `mediaId: UUID` | M03 §6.3; FN-M03-004 | Rights required before publication; public only when referenced by a published revision; audio/video only for online checkpoints; offline uses images only | `sourceRef` is a resource/storage reference, not identity; `staticImages[]`, `mediaResources[]`, gallery and route-map references are projections. |
| ENT-DATA-006 | JourneySnapshot | EVENT | Immutable, consecutively versioned full-journey publication of one route, created for every journey-affecting change. | M03 | `(routeId, contentVersion)` | M03 §5.1, §5.2 group G, §6.4; M01 §5.3 | Immutable after `DA_CONG_BO`; active checkpoints of the route list; per-QR offline resources; single version chain; size ceiling | Source of package manifest, handoff manifest and frozen session journey. |
| ENT-DATA-007 | AdminAccount | THING | M03 application account linking normalized email/provider identity to fixed role and account status. | M03 | normalized `email` | M03 §5.2, §6.4 | Email is the MVP logical identity from invitation through active account; provider `userId` is unique external linkage when present | Provider credential/session is external; no ProviderIdentity entity is introduced. |
| ENT-DATA-008 | AuditRecord | EVENT | Append-only record of an administrative or provisioning action with before/after context, result and reason where required. | M03 | `auditId` | M03 §6.4; FN-M03-005/007/011 | Append-only; no credential/token values; actor may be absent for server-side provisioning; failures logged | Publication/account/closure audit entries share this entity. |
| ENT-DATA-009 | LanguagePreference | THING | Current persisted language selection for one local application profile. | M01 | Singleton slot in one local application profile | M01 §5.3, §6.2/§6.4; M02 §5.1 | `languageCode` is `vi` or `en`; replacement is independent of package/session state | Shared contract read by M02. |
| ENT-DATA-010 | SelectedRouteContext | THING | Current atomic, one-use, expiring route handoff written by M01 for M02 session creation. | M01 | `handoffId` UUID; one current singleton context | M01 §5.3, §6.2/§6.4; M02 §5.1 | New ID per Start; `expiresAt` 24 hours after authorization; atomic replacement; `AUTHORIZED`/`REVOKED`; one handoff creates at most one session | `SelectedRouteContext v3`; contains embedded `routeJourneyManifest`. |
| ENT-DATA-011 | OfflinePackage | THING | Local route/version package containing the full journey manifest, one resource per QR of offline-required checkpoints, an optional offline route map and the route essentials. | M01 | `(routeId, contentVersion)` | M01 §5.3, §5.5, §6; M02 §5.1 | Completeness separate from freshness; atomic candidate activation; at most one active ready package per route | Candidate/staging is a lifecycle representation; offline route map and route essentials are embedded values. |
| ENT-DATA-012 | OfflineResource | THING | M01-owned local copy of the bilingual content and packaged static images of one QR object in an offline-required checkpoint, for one route/version. | M01 | `(routeId, contentVersion, qrIdentifier)` | M01 §5.3, §6.2/§6.4; M02 §5.1 | One per QR of offline-required checkpoints; package delete removes its resources; does not delete context/session | `OfflineStationContent` is an M02 read-only view; M03 snapshot `offlineResources[]` item is the embedded source value. |
| ENT-DATA-013 | PlaySession | THING | Local field-experience session created from one accepted handoff with immutable journey data. | M02 | `sessionId` UUID; unique `sourceHandoffId` | M02 §5.2, §6.1 | At most one in progress per browser; fixed journey; atomic replacement; automatic end after 24 hours; terminal states immutable | Frozen journey is embedded; RouteJourneyMap is a view. |
| ENT-DATA-014 | CheckpointVisit | EVENT | First accepted check-in of one checkpoint during one PlaySession. | M02 | `(sessionId, checkpointId)` | M02 §5.2, §6.2 | Unique by session/checkpoint, not QR; recorded only for an accepted scan; first time immutable; saved before content is shown | SessionSyncRecord carries a historical value copy. |
| ENT-DATA-015 | PendingSyncItem | THING | Local queue item wrapping one immutable terminal SessionSyncRecord and its sync outcome. | M02 | `sessionId` UUID; at most one item per terminal session | M02 §6.4; FN-M02-007 | `PENDING` retries; `SYNCED` acknowledges; `CONFLICT` (changed payload or invalid-record rejection) stops automatic retry; record is never mutated | Local sync queue entry; contains transport value `record`. |
| ENT-DATA-016 | SessionRecord | EVENT | M03-persisted immutable terminal session business record accepted from M02 after validation against its snapshot. | M03 | `sessionId` UUID | M03 §5.1, §5.2 group J, §6.4; M02 §5.1 | Identical retry idempotent; changed payload conflicts; anonymous; visited checkpoints must match the snapshot; reports use synchronized records only | Derived from transport `SessionSyncRecord`; adds M03-owned `ingestedAt`. |
| ENT-DATA-017 | Revision | THING | One version of the editable content of a route, checkpoint or QR object; the published version is the only one the public sees. | M03 | `revisionId`; unique `(subjectType, subjectId, revisionNumber)` | M03 §1.1, §6.1.1, §6.2.1, §6.2.2, §6.3, §6.4 | At most one `NHAP` and one `PHAT_HANH` per subject; `PHAT_HANH` immutable; restore creates a new draft; self-publish through review | Current published content is a projection of the `PHAT_HANH` revision; content payloads are embedded values. |

## 4. Entity Detail

### ENT-DATA-001 — Route

- Classification: THING.
- Owner: M03.
- Definition: Canonical administrated day-trip route. Its entity record holds identity, lifecycle and internal operational fields; its editable content lives in Revision (`subjectType = ROUTE`), and the published revision forms the Published Route projection consumed by M01.
- Stable identity: `routeId: String`, system-generated, stable, never changed and never reused.
- Lifecycle: `NHAP → HOAT_DONG` (first publication); `NHAP → LUU_TRU` (discard); `HOAT_DONG → TAM_DONG` (close, or automatically when its last active listed checkpoint closes); Reviewer reopen `TAM_DONG → HOAT_DONG`; Reviewer archive `TAM_DONG → LUU_TRU`. No `CHO_DUYET`; a route never reopens automatically.
- Main attributes supported by source: Entity: `routeId`, `status`, conditional `activeContentVersion`, conditional `closureSource`/`closureReason`/`closedAt`/`closedByUserId`, `createdByUserId`, `createdAt`/`updatedAt`, `concurrencyRevision`. Content (Revision §6.1.1): bilingual name, short description, description, starting point, optional both-or-none texts, `noSafetyWarningConfirmed`, `distanceKm`, `durationMin`, `difficulty`, group/experience tags, thumbnail/gallery/route-map media references and captions, `offlineRouteMapRequired`, ordered `checkpointList[]`, `highlights`. The time tag is derived and not part of the content.
- Relationships evidenced by source: lists zero or more published Checkpoints in its own order through `checkpointList` (a checkpoint belongs to no route); owns Media with `ownerType = ROUTE`; has Revisions; active version refers to a `DA_CONG_BO` JourneySnapshot of the same route; Published Route is its consumer projection.
- Used by functions: FN-M03-001/005/006/007/011; FN-M01-002/003/004/005/006.
- Business rules: BR-M03-C01–C17, T01–T09, G04/G06, H01/H03/H07/H08/H09, X02; BR-M01-002/003/011/012/014.
- Cross-module representations: Published Route projection (with derived `timeTags`, `checkpointCount`, offline flags and `checkpointSummaries`); `routeId` copied into snapshots, packages, contexts, sessions and reports; route essentials copied into OfflinePackage.
- Source references: [M03 §5.1, §6.1 and §6.1.1](../docs/spec/spec-M03.md); [M01 §5.3](../docs/spec/spec-M01.md); [Function List M03](../docs/function%20list/function-list-M03.md).
- Decision status: No outstanding decision for S1.

### ENT-DATA-002 — Checkpoint

- Classification: THING.
- Owner: M03.
- Definition: Real-world area in a shared checkpoint library, created and published independently of any route; it holds one or more visit points (QR objects) and has no order and no visitor introduction text of its own.
- Stable identity: `checkpointId: String`, system-generated, stable and never reused.
- Lifecycle: `NHAP → HOAT_DONG` (its own publication); `NHAP → LUU_TRU` (discard); `HOAT_DONG → TAM_DONG` (close, affecting every listing route); Reviewer reopen `TAM_DONG → HOAT_DONG`; Reviewer archive `TAM_DONG → LUU_TRU` only when no non-archived route lists it.
- Main attributes supported by source: Entity: `checkpointId`, `status`, optional `locationNote`, conditional `closureReason`/`closedAt`/`closedByUserId`, `createdByUserId`/`createdAt`/`updatedAt`, `concurrencyRevision`. Content (Revision §6.2.1): bilingual `checkpointName`, `connectivityMode`, conditional `fieldVerificationConfirmed`, `fieldVerifiedByUserId`, `fieldVerifiedAt`. `sequence` is not a checkpoint attribute: it is the position in each route list.
- Relationships evidenced by source: listed by zero or more Routes; has QRCodes (an active checkpoint keeps at least one active QR); owns visit-point Media with `ownerType = CHECKPOINT`; has Revisions; appears in the JourneySnapshot of every route that lists it while active.
- Used by functions: FN-M03-001/002/003/006/007/009; FN-M01-004/005/006; FN-M02-003/004/005.
- Business rules: BR-M03-D01–D12, X01–X07, T01/T02/T05/T09, H01/H02/H04/H06; BR-M02-004/006.
- Cross-module representations: snapshot/manifest checkpoint value with bilingual name, list position and active QR identifiers; `checkpointSummaries[]` in Published Route; `checkpointName`/`connectivityMode` in LiveStationContent. The old term `QRCheckpoint` is not a separate canonical entity.
- Source references: [M03 §1.1, §5.2.D and §6.2](../docs/spec/spec-M03.md); [M01 §5.3 and §6](../docs/spec/spec-M01.md).
- Decision status: No outstanding decision for S1.

### ENT-DATA-003 — QRCode

- Classification: THING.
- Owner: M03.
- Definition: Visit point (QR object): one QR identity attached to one specific thing inside one checkpoint; it owns the visitor content shown when it is scanned. Physical reprints do not create a new identity.
- Stable identity: `qrIdentifier: String`, system-generated, random and unguessable, globally unique, never reused.
- Lifecycle: created `NHAP` at the first save of the visit point form; `NHAP → HOAT_DONG` (publication); `NHAP → THU_HOI` (discard); `HOAT_DONG → THU_HOI` (revoke, or automatically when its checkpoint is archived). No identity replacement state.
- Main attributes supported by source: Entity: `qrIdentifier`, `checkpointId`, optional `installationLabel`, `status`, conditional `statusReason`, `createdByUserId`/`createdAt`/`updatedAt`, `concurrencyRevision`. Content (Revision §6.2.2): bilingual `objectName`, bilingual `introductionText`, ordered `mediaItems[]`.
- Relationships evidenced by source: belongs to exactly one Checkpoint and never moves; has Revisions; its revision content references Media owned by its checkpoint; active identifiers are embedded as `qrIdentifiers[]` (and, for offline-required checkpoints, `offlineResources[]`) in JourneySnapshot and downstream manifests.
- Used by functions: FN-M03-003/004/006/009; FN-M02-004/005/008.
- Business rules: BR-M03-B01–B05, E01–E16 (E08 retired), I01/I02; BR-M02-004/014/020/023.
- Cross-module representations: String identifier in snapshot, handoff, package and frozen journey; per-QR offline resource; LiveStationContent of the scanned QR; the public QR link `{QR_PUBLIC_BASE_URL}/q/{qrIdentifier}` is derived and not stored.
- Source references: [M03 §5.2.B, §5.2.E and §6.2](../docs/spec/spec-M03.md); [Function List M03 FN-M03-003](../docs/function%20list/function-list-M03.md).
- Decision status: No outstanding decision for S1.

### ENT-DATA-004 — CheckpointContent

- Classification: RETIRED (V2, 2026-10-28). Not a canonical entity in the current baseline.
- Reason: spec M03 v3.7 lists nine canonical M03 entities without CheckpointContent (M03 §6.4 DEC-S6-002 revised); visitor content belongs to individual QR objects, not to the checkpoint (M03 §1.1, BR-M03-E01); every editable content version of a route, checkpoint or QR object is a Revision (M03 §6.3); the review states `CHO_DUYET`/`DA_DUYET` and the submitter/approver fields no longer exist (BR-M03-A05).
- Replacement: ENT-DATA-017 Revision; the former per-language introduction text is now `introductionText.vi/.en` in QR object content (M03 §6.2.2).
- ID rule: ENT-DATA-004 is kept for traceability and is never reused.
- Source references: [M03 §1.1, §6.2.2, §6.3 and §6.4](../docs/spec/spec-M03.md).
- Decision status: Retirement accepted at Human Gate 1 (V2).

### ENT-DATA-005 — Media

- Classification: THING.
- Owner: M03.
- Definition: Managed image/audio/video file owned by a route (thumbnail, gallery, route map) or by a checkpoint (visit-point media), gated by usage rights and published only through a published revision.
- Stable identity: `mediaId: UUID`, system-generated.
- Lifecycle: no Media state enum is declared; a Media becomes public only while referenced by a `PHAT_HANH` revision; it is retained after it stops being referenced so earlier revisions can be restored.
- Main attributes supported by source: `mediaId`, `ownerType`, `ownerId`, `usage`, `type`, conditional `spokenLanguage` (audio/video), `sourceRef`, `mimeType`, `fileSizeBytes`, `usageRightsConfirmed`, conditional `usageRightsConfirmedByUserId`/`usageRightsConfirmedAt`, `createdByUserId`/`createdAt`, `concurrencyRevision`. `sourceRef` is a resource/storage reference and is not identity.
- Relationships evidenced by source: owned by one Route or one Checkpoint (`ownerType`, `ownerId`); referenced only by revisions of its owner; image references may be embedded in JourneySnapshot; image/audio/video references are projected to Published Route and LiveStationContent.
- Used by functions: FN-M03-001/004/006/009; FN-M01-005 through snapshot image references; FN-M02-005/008 through live projections.
- Business rules: BR-M03-C14, E02, E04, E14, E17; offline resources contain images only.
- Cross-module representations: `thumbnail`, `gallery[]`, `routeMap` in Published Route; `staticImages[]` and `offlineRouteMap` in snapshots; `mediaResources[]` with `spokenLanguage` in LiveStationContent; no separate consumer-owned Media entity.
- Source references: [M03 §5.1 and §6.3](../docs/spec/spec-M03.md); [Function List M03 FN-M03-004](../docs/function%20list/function-list-M03.md).
- Decision status: No outstanding decision for S1; HC-002 is resolved.

### ENT-DATA-006 — JourneySnapshot

- Classification: EVENT.
- Owner: M03.
- Definition: Immutable full-journey state of one route at one content version, created for every journey-affecting change; one change to a shared checkpoint switches the snapshots of all affected routes together.
- Stable identity: `(routeId, contentVersion)`; `contentVersion` starts at `1` and increases by exactly `1` per published snapshot.
- Lifecycle: `DANG_TAO → DA_CONG_BO`; published state is immutable; a candidate consumes no version number.
- Main attributes supported by source: `routeId`, `contentVersion`, `status`, `publishedAt`, optional `previousContentVersion`, optional `estimatedOfflineSizeBytes`, optional `offlineRouteMap`, complete `checkpoints[]` (bilingual name, list position, connectivity mode, active `qrIdentifiers[]`, conditional per-QR `offlineResources[]`).
- Relationships evidenced by source: belongs to one Route/version; versions of a route form a single chain, each with zero or one same-route predecessor (M03 §6.4 CL-S4-001 revised); embeds Checkpoint/QRCode projections and published content/image values.
- Used by functions: FN-M03-005/006/007/010; FN-M01-002/004/005/006.
- Business rules: BR-M03-G01–G10, X02, C16; BR-M01-004/008/012/013.
- Cross-module representations: source for OfflinePackage.manifest, OfflinePackage resources and offline route map, SelectedRouteContext.routeJourneyManifest and the M02 frozen journey; reference for SessionRecord validation. Those are value copies, not JourneySnapshot entities.
- Source references: [M03 §5.1, §5.2.G and §6.4](../docs/spec/spec-M03.md); [M01 §5.3](../docs/spec/spec-M01.md).
- Decision status: No outstanding decision for S1.

### ENT-DATA-007 — AdminAccount

- Classification: THING.
- Owner: M03.
- Definition: Application authorization account distinct from provider-owned identity and credentials.
- Stable identity: normalized `email` is the logical identity in the MVP from `INVITATION_PENDING` through the active account lifecycle. Provider `userId` is a unique external/provider linkage when present, not a second entity identity.
- Lifecycle: `INVITATION_PENDING → ACTIVE ↔ DEACTIVATED`; recovery does not change lifecycle.
- Main attributes supported by source: conditional `userId`, normalized unique `email`, fixed `role`, `status`, `createdAt`, `updatedAt`, `concurrencyRevision`.
- Relationships evidenced by source: may link to one external provider identity through unique `userId`; user IDs appear as revision authors/publishers, closure and media-rights actors and audit actors; last active Reviewer is protected across role/status mutations. No ProviderIdentity entity is introduced.
- Used by functions: FN-M03-008/011; authorization evidence supports FN-M03-001–011 protected operations.
- Business rules: BR-M03-A01/A03/A04, K01–K05, F06.
- Cross-module representations: Auth provider session/credential is external; it is not AdminAccount.
- Source references: [M03 §5.2 and §6.4](../docs/spec/spec-M03.md); [Function List M03 FN-M03-008](../docs/function%20list/function-list-M03.md).
- Decision status: No outstanding decision for the MVP. If email change is supported in the future, the identity rule must be reviewed.

### ENT-DATA-008 — AuditRecord

- Classification: EVENT.
- Owner: M03.
- Definition: Immutable record of one administrative or provisioning action, including failed operations, with before/after context.
- Stable identity: `auditId: String`.
- Lifecycle: appended once and never updated or deleted.
- Main attributes supported by source: `auditId`, conditional `actorUserId`, `action`, `entityType`, `entityId`, optional `revision`, conditional `reason`, `outcome`, conditional `selfPublished`, optional `beforeState`/`afterState`, `occurredAt`.
- Relationships evidenced by source: refers logically to an affected administrative entity (and, for checkpoint operations, names the affected routes) and usually an AdminAccount actor.
- Used by functions: FN-M03-005/007/011 (SF-M03-011-04/05); other protected mutations use the shared audit behavior.
- Business rules: BR-M03-F08/F09, X06, K04; audit values exclude credentials/tokens.
- Cross-module representations: none; not exposed as a visitor contract.
- Source references: [M03 §5.2.F and §6.4](../docs/spec/spec-M03.md); [Function List M03](../docs/function%20list/function-list-M03.md).
- Decision status: `AuditRecord.revision` holds the `revisionNumber` of the Revision the action concerns; that Revision's subject is identified by `entityType` and `entityId` (M03 §6.4, v3.7 clarification; HC-006 resolved).

### ENT-DATA-009 — LanguagePreference

- Classification: THING.
- Owner: M01.
- Definition: Current language setting persisted for the current local application profile and shared read-only with M02.
- Stable identity: singleton preference slot in one local application profile.
- Lifecycle: absent before initial selection; valid selection creates/replaces current `languageCode`; browser data deletion may remove it.
- Main attributes supported by source: `languageCode: Enum(vi, en)`.
- Relationships evidenced by source: controls selection of language branches without changing OfflinePackage or PlaySession state.
- Used by functions: FN-M01-001/007; FN-M02-004/005.
- Business rules: BR-M01-001; BR-M02-024 (QR link page uses it, or the device language until a choice is stored); BR-M02-026 (selects the audio/video shown).
- Cross-module representations: exact M01→M02 LanguagePreference contract.
- Source references: [M01 §5.3 and §6](../docs/spec/spec-M01.md); [M02 §5.1](../docs/spec/spec-M02.md).
- Decision status: No outstanding decision for S1; Human Gate 1 accepted singleton THING classification rather than an unpersisted value object.

### ENT-DATA-010 — SelectedRouteContext

- Classification: THING.
- Owner: M01.
- Definition: Current shared one-use, expiring handoff authorizing M02 to create a PlaySession from one frozen route/version manifest.
- Stable identity: globally unique `handoffId: UUID`; only one current context is stored.
- Lifecycle: created `AUTHORIZED` with `expiresAt` = `authorizedAt` + 24 hours; may become `REVOKED`; later Start atomically replaces the current context. M02 consumption is enforced by unique `sourceHandoffId`; expiry is enforced by M02 and never changes `authorizationStatus`.
- Main attributes supported by source: `contractVersion` (exactly `3`), `handoffId`, `routeId`, `authorizedAt`, `expiresAt`, `authorizationStatus`, embedded `routeJourneyManifest` (bilingual checkpoint names, list positions with gaps, connectivity modes, QR identifiers).
- Relationships evidenced by source: refers to one Route and one journey version; at most one PlaySession may originate from the handoff.
- Used by functions: FN-M01-002/006/007; FN-M02-001/006.
- Business rules: BR-M01-009/010/011/015; BR-M02-001/003/013/017.
- Cross-module representations: exact `SelectedRouteContext v3` producer/consumer contract; manifest is an embedded JourneySnapshot projection; version 2 is rejected by M02.
- Source references: [M01 §5.3, §5.5 and §6](../docs/spec/spec-M01.md); [M02 §5.1](../docs/spec/spec-M02.md).
- Decision status: No outstanding decision for S1.

### ENT-DATA-011 — OfflinePackage

- Classification: THING.
- Owner: M01.
- Definition: Versioned local package whose ready form exposes complete journey metadata, one resource per QR of offline-required checkpoints, an optional offline route map and the route essentials.
- Stable identity: `(routeId, contentVersion)`.
- Lifecycle: `CHUA_TAI → DANG_TAI → SAN_SANG` or `CHUA_HOAN_TAT`; ready packages have `CURRENT`/`OUTDATED`; delete returns logical `CHUA_TAI`; candidate activation is atomic; route essentials are refreshed atomically and independently of the package version.
- Main attributes supported by source: `routeId`, `contentVersion`, `status`, conditional `versionStatus`, embedded `manifest`, `resources[]`, optional embedded `offlineRouteMap`, embedded `routeEssentials` (with `capturedAt`), optional `downloadedAt`.
- Relationships evidenced by source: belongs to one Route/version; contains OfflineResource values; its manifest is a JourneySnapshot metadata copy; offline route map and route essentials are embedded values deleted with the package (HC-005).
- Used by functions: FN-M01-002/004/005/006/007; FN-M02-005.
- Business rules: BR-M01-004/005/006/008/012/013/014/016; only ready active data is exposed to M02.
- Cross-module representations: exact M01→M02 contract; M02 ignores `offlineRouteMap` and `routeEssentials`; candidate/staging and active are lifecycle representations of this concept.
- Source references: [M01 §5.3–§6](../docs/spec/spec-M01.md); [M02 §5.1](../docs/spec/spec-M02.md).
- Decision status: No outstanding decision for S1; HC-005 is resolved.

### ENT-DATA-012 — OfflineResource

- Classification: THING.
- Owner: M01.
- Definition: Persisted local copy of the content of one QR object in an offline-required checkpoint, packaged for one route/version.
- Stable identity: `(routeId, contentVersion, qrIdentifier)`; `qrIdentifier` is unique within a package.
- Lifecycle: prepared as candidate; exposed only with a complete ready package; removed with package/candidate deletion; never deletes SelectedRouteContext or M02 data.
- Main attributes supported by source: package-derived `routeId`/`contentVersion`, `qrIdentifier`, referenced `checkpointId`, bilingual `objectName`, bilingual `localizedContent.*.introductionText`, `staticImages[]` references whose bytes are present.
- Relationships evidenced by source: belongs to one OfflinePackage; refers to one QR identifier and its offline-required checkpoint in the package manifest.
- Used by functions: FN-M01-005/007; FN-M02-005.
- Business rules: BR-M01-004/006; one resource per QR of every offline-required checkpoint; both languages and declared images must validate; BR-M02-009/018.
- Cross-module representations: M03 JourneySnapshot `offlineResources[]` item is the source embedded value; M02 `OfflineStationContent` is a read-only view of this M01 entity.
- Source references: [M01 §5.3, §5.4 and §6](../docs/spec/spec-M01.md); [M02 §5.1 and §6](../docs/spec/spec-M02.md).
- Decision status: No outstanding decision for S1.

### ENT-DATA-013 — PlaySession

- Classification: THING.
- Owner: M02.
- Definition: Local field session created from an authorized, unused and unexpired handoff and carrying a frozen journey for its full lifecycle.
- Stable identity: globally unique `sessionId: UUID`; `sourceHandoffId` is also unique.
- Lifecycle: created `DANG_DIEN_RA`; `HOAN_TAT` when the final checkpoint was visited and the end was confirmed (Finish or end-of-trip prompt) or the session was ended automatically after 24 hours with the final checkpoint visited; `BO_DO` after a valid replacement handoff or an automatic end without the final checkpoint; terminal state is immutable.
- Main attributes supported by source: `sessionId`, `sourceHandoffId`, `routeId`, `contentVersion`, embedded `journeyCheckpoints`, `status`, `startedAt`, conditional `endedAt`.
- Relationships evidenced by source: originates from one SelectedRouteContext; owns CheckpointVisits; has at most one terminal sync payload/PendingSyncItem; at most one in progress per browser.
- Used by functions: FN-M02-001/002/003/004/006/007.
- Business rules: BR-M02-001/002/003/006/007/010/013/017/021/022.
- Cross-module representations: terminal historical value becomes SessionSyncRecord, then M03 SessionRecord; the local PlaySession itself is not transferred.
- Source references: [M02 §5.2 and §6.1](../docs/spec/spec-M02.md); [Function List M02](../docs/function%20list/function-list-M02.md).
- Decision status: No outstanding decision for S1.

### ENT-DATA-014 — CheckpointVisit

- Classification: EVENT.
- Owner: M02.
- Definition: First accepted visit event for a session/checkpoint pair, independent of whether content later loads.
- Stable identity: `(sessionId, checkpointId)`.
- Lifecycle: inserted on the first accepted scan of a journey checkpoint (online `VALID`, or offline/lookup failure with a QR of the frozen journey); repeated QR scans reuse original time; immutable when session becomes terminal.
- Main attributes supported by source: `sessionId`, `checkpointId`, observed `qrIdentifier` (may be a code added after the session started), first `checkedInAt`.
- Relationships evidenced by source: belongs to one PlaySession; refers to one checkpoint in the frozen journey; historical label/sequence are read from that journey for sync.
- Used by functions: FN-M02-002/003/004/006/007.
- Business rules: BR-M02-004/005/006/008/010/015/020.
- Cross-module representations: `SessionSyncRecord.visitedCheckpoints[]` and SessionRecord child values are frozen historical projections, not the local event entity itself.
- Source references: [M02 §5.2 and §6.2](../docs/spec/spec-M02.md).
- Decision status: No outstanding decision for S1.

### ENT-DATA-015 — PendingSyncItem

- Classification: THING.
- Owner: M02.
- Definition: Durable local delivery state for one frozen terminal transport payload.
- Stable identity: `sessionId: UUID`; at most one queue item per terminal session.
- Lifecycle: `PENDING → SYNCED` after new/identical acknowledgement, or `PENDING → CONFLICT` after a same-ID changed-payload response or an invalid-record rejection; transient failures retain `PENDING`.
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
- Definition: Canonical persisted terminal session history accepted through SessionSyncRecord intake after validation against the snapshot it names, and used by operational reports.
- Stable identity: `sessionId: UUID`.
- Lifecycle: inserted atomically on first accepted payload; never changed; identical retries acknowledge without mutation and different retries conflict.
- Main attributes supported by source: `sessionId`, `routeId`, `contentVersion`, `startedAt`, `endedAt`, terminal `status`, immutable `visitedCheckpoints[]`, M03-owned `ingestedAt`.
- Relationships evidenced by source: contains child historical visit values unique by session/checkpoint, each matching a checkpoint of the JourneySnapshot `(routeId, contentVersion)`; feeds RPT-01 and RPT-02.
- Used by functions: FN-M02-006/007 through transport; FN-M03-010 for intake/reporting.
- Business rules: BR-M02-010/011; BR-M03-J01–J07.
- Cross-module representations: SessionSyncRecord is the transport value; SessionRecord is the persisted M03 entity and is not automatically the same entity as M02 PlaySession.
- Source references: [M03 §5.1, §5.2 and §6.4](../docs/spec/spec-M03.md); [M02 §5.1](../docs/spec/spec-M02.md).
- Decision status: No outstanding decision for S1.

### ENT-DATA-017 — Revision

- Classification: THING.
- Owner: M03.
- Definition: One version of the editable public content of a route, checkpoint or QR object. Each subject has at most one pending draft shared by all administrators and at most one published version; the published version is the only one the public sees.
- Stable identity: `revisionId: String`, system-generated; `(subjectType, subjectId, revisionNumber)` is unique; `revisionNumber` starts at `1` per subject and is never reused.
- Lifecycle: `NHAP → PHAT_HANH` (publication; the previously published revision becomes `LUU_TRU` in the same operation); `NHAP → DA_BO` (pending draft discarded); `PHAT_HANH → LUU_TRU` (superseded). Restoring creates a new `NHAP` revision. `LUU_TRU` and `DA_BO` are terminal; `PHAT_HANH` content is immutable.
- Main attributes supported by source: `revisionId`, `subjectType`, `subjectId`, `revisionNumber`, `status`, `content` (shape by subject type: M03 §6.1.1, §6.2.1, §6.2.2), optional `basedOnRevisionNumber`, `createdByUserId`/`createdAt`, `lastEditedByUserId`/`lastEditedAt`, conditional `publishedByUserId`/`publishedAt`, conditional `selfPublished`, `concurrencyRevision`.
- Relationships evidenced by source: belongs to exactly one subject — a Route, a Checkpoint or a QRCode — identified by `subjectType` and `subjectId`; its content may reference Media of the same owner and, for a route, published Checkpoints through `checkpointList`; authored and published by AdminAccount users.
- Used by functions: FN-M03-001/002/003/004/005/011.
- Business rules: BR-M03-A05, D06, D11, E05, E06, E13, F01–F07, F10, F11.
- Cross-module representations: Published Route fields, snapshot names and offline content, and LiveStationContent are projections of `PHAT_HANH` revisions; current published content is a projection, not a separate entity.
- Source references: [M03 §1.1, §5.2.F, §6.1.1, §6.2.1, §6.2.2, §6.3 and §6.4](../docs/spec/spec-M03.md).
- Decision status: Added at Human Gate 1 (V2) as the replacement of ENT-DATA-004 and the former implied AdministrativeRevision.

## 5. Implied Entities

| Candidate | Why implied | Evidence | Why not canonical | Human Gate disposition |
|---|---|---|---|---|
| AdministrativeRevision | V1 implied concept for revisioned administrative state. | Superseded: spec M03 v3.7 defines Revision explicitly (M03 §6.3). | Not applicable in V2. | Superseded by ENT-DATA-017 Revision at Human Gate 1 (V2); no implied entity remains. |

## 6. Human Conflicts

| Conflict ID | Concept A | Concept B | Conflict type | Evidence | Resolution | Status |
|---|---|---|---|---|---|---|
| HC-001 | AdminAccount normalized email | Provider `userId` | Identity evolution | M03 §6.4 makes email unique, userId conditional and stable when present; invitation creates account before provider linkage. | Keep one AdminAccount. Normalized email is its MVP logical identity from invitation through active account; `userId` is unique external/provider linkage when present. Do not create ProviderIdentity. Review this identity rule if email change is supported later. | RESOLVED |
| HC-002 | Media `sourceRef` | Media entity identity | Missing stable identity | M03 §6.3 now declares `mediaId: UUID` and distinguishes `sourceRef` as a resource/storage reference. | Use `mediaId: UUID` as stable logical identity; `sourceRef` is not identity. | RESOLVED |
| HC-003 | AdministrativeRevision | Route/Checkpoint/QRCode mutation state | Entity versus embedded state | V1 kept it implied. Spec M03 v3.7 §6.3 now declares Revision with identity, lifecycle and fields. | Superseded: Revision is canonical (ENT-DATA-017). | SUPERSEDED (V2) |
| HC-004 | `CheckpointContent` | Language-specific content revision/current published content | Naming/entity-versus-projection ambiguity | V1 kept CheckpointContent canonical. Spec M03 v3.7 removes it; content belongs to QR objects and every content version is a Revision. | Superseded: ENT-DATA-004 retired; current published content is a projection of the `PHAT_HANH` Revision. | SUPERSEDED (V2) |
| HC-005 | OfflineRouteMap / RouteEssentials | OfflinePackage | Entity versus embedded value | M01 §6.2 lists both under "Entity Definitions" and the M01 §6.1 ER draws them, but §6.2 says "embedded in `OfflinePackage`" and §6.4 allows at most one route map and exactly one essentials value per package, with no identity of their own. | Classified as embedded values of OfflinePackage (Human Gate 1 V2). M01 v3.2 (clarification, 2026-10-28) aligns §6.1 ER, §6.2 and §11.1 with this classification. | RESOLVED |
| HC-006 | `AuditRecord.revision` | Revision `revisionNumber` / `revisionId` | Missing reference semantics | M03 §6.4 defined `AuditRecord.revision` as an Integer "present when the action concerns a revisioned value" without naming the referenced value. | M03 v3.7 (clarification) §6.4: it is the `revisionNumber` of the Revision concerned, whose subject is given by `entityType`/`entityId`; `(subjectType, subjectId, revisionNumber)` is unique. | RESOLVED |

Previously audited names are not remaining conflicts:

- `Checkpoint` is canonical; `QRCheckpoint` is an old projection alias.
- `OfflineResource` is canonical M01 local data; `OfflineStationContent` is an M02 read-only view.
- `LiveQrLookupResult` with `LiveStationContent` is a transport/read contract, not a persisted M02 entity.
- Current published content is a projection of the `PHAT_HANH` Revision, not a separate entity.
- `SessionSyncRecord` is transport; `SessionRecord` is persisted M03 data.
- JourneySnapshot manifests and frozen journeys are source/copy representations, not duplicate entities.

## 7. Non-Entities / Excluded Concepts

| Concept | Classification | Reason not treated as a canonical entity |
|---|---|---|
| Published Route | READ MODEL / VIEW | Public projection of Route and its published Revision, including derived values; same canonical source identity. |
| RecommendationContext | TRANSIENT CONTEXT | Three selected criteria used for deterministic filtering; no persistence requirement or stable identity. |
| `routeJourneyManifest` | VALUE OBJECT / EMBEDDED VALUE | JourneySnapshot metadata copy embedded in SelectedRouteContext. |
| `OfflinePackage.manifest` | VALUE OBJECT / EMBEDDED VALUE | JourneySnapshot metadata copy embedded in OfflinePackage. |
| JourneySnapshot `offlineResources[]` item | VALUE OBJECT / EMBEDDED VALUE | Per-QR M03 source value embedded conditionally in a snapshot; copied into M01 OfflineResource. |
| Frozen session journey / `journeyCheckpoints` | VALUE OBJECT / EMBEDDED VALUE | Immutable copy owned inside PlaySession, without independent identity/lifecycle. |
| RouteJourneyMap | READ MODEL / VIEW | Ordered view of PlaySession.journeyCheckpoints. |
| OfflineStationContent | READ MODEL / VIEW | M02 read-only view of M01 OfflineResource. |
| LiveQrLookupResult / LiveStationContent | READ MODEL / VIEW | M03→M02 live lookup transport (outcome plus the scanned QR's content); source data remains QRCode/Checkpoint/Route/Revision/Media. |
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
| OfflineRouteMap | VALUE OBJECT / EMBEDDED VALUE | Optional route-map image and caption embedded in OfflinePackage, without own identity (HC-005). |
| RouteEssentials | VALUE OBJECT / EMBEDDED VALUE | Point-in-time route texts with `capturedAt`, exactly one per ready OfflinePackage, without own identity (HC-005). |
| Revision `content` payloads and Route `checkpointList` | VALUE OBJECT / EMBEDDED VALUE | Editable content shapes of a Revision (M03 §6.1.1, §6.2.1, §6.2.2); the ordered checkpoint list is part of route content. |
| Derived route values (`timeTags`, `checkpointCount`, `hasOfflineRequiredCheckpoint`, `hasOfflineRouteMap`, `checkpointSummaries`) | READ MODEL / VIEW | Computed from `durationMin` and the active JourneySnapshot; never entered or stored as content. |
| Readiness ("Sẵn sàng" / "Chưa đủ") | READ MODEL / VIEW | Derived, not stored (M03 §5.4). |
| Public QR link | VALUE OBJECT / EMBEDDED VALUE | `{QR_PUBLIC_BASE_URL}/q/{qrIdentifier}` derived from QRCode identity; not stored (M03 §6.2). |
| PublicationReview / ValidationIssue | TRANSIENT CONTEXT | Administrative UI response contracts (M03 §5.1), not retained business data. |
| Upload state per file, report notes, message catalog entries | UI state | Screen behavior only; no canonical persistence identity. |

## 8. Coverage Check

This is FN-level evidence coverage only, not a CRUD matrix.

| Function ID | Known entities/data concepts touched | Coverage result |
|---|---|---|
| FN-M01-001 | LanguagePreference | Covered |
| FN-M01-002 | Route, JourneySnapshot (via Published Route summaries), SelectedRouteContext, OfflinePackage (saved route essentials) | Covered |
| FN-M01-003 | Route; transient RecommendationContext | Covered |
| FN-M01-004 | Route, JourneySnapshot, OfflinePackage | Covered |
| FN-M01-005 | Route, JourneySnapshot, OfflinePackage, OfflineResource | Covered |
| FN-M01-006 | Route, JourneySnapshot, OfflinePackage, SelectedRouteContext | Covered |
| FN-M01-007 | LanguagePreference, SelectedRouteContext, OfflinePackage | Covered |
| FN-M02-001 | SelectedRouteContext, PlaySession | Covered |
| FN-M02-002 | PlaySession, CheckpointVisit | Covered |
| FN-M02-003 | PlaySession; embedded frozen journey; RouteJourneyMap view | Covered |
| FN-M02-004 | PlaySession, CheckpointVisit, LanguagePreference; QRCode/Checkpoint/Route projections through LiveQrLookupResult | Covered |
| FN-M02-005 | LanguagePreference, OfflineResource; QRCode/Revision/Media projections through LiveStationContent | Covered |
| FN-M02-006 | PlaySession, CheckpointVisit, PendingSyncItem | Covered |
| FN-M02-007 | PlaySession, PendingSyncItem, SessionSyncRecord transport, SessionRecord destination | Covered |
| FN-M02-008 | QRCode/Checkpoint/Revision/Media through LiveQrLookupResult | Covered |
| FN-M03-001 | Route, Revision, Media, Checkpoint (listed), AuditRecord | Covered |
| FN-M03-002 | Checkpoint, Revision, QRCode, AuditRecord | Covered |
| FN-M03-003 | QRCode, Checkpoint, Revision, JourneySnapshot, AuditRecord | Covered |
| FN-M03-004 | Revision, Media, QRCode, JourneySnapshot | Covered |
| FN-M03-005 | Revision, Route, Checkpoint, QRCode, Media, JourneySnapshot, AuditRecord | Covered |
| FN-M03-006 | JourneySnapshot, Route, Checkpoint, QRCode, Revision, Media | Covered |
| FN-M03-007 | Route, Checkpoint, JourneySnapshot, AuditRecord | Covered |
| FN-M03-008 | AdminAccount, AuditRecord | Covered |
| FN-M03-009 | QRCode, Checkpoint, Route, Revision, Media; LiveQrLookupResult view | Covered |
| FN-M03-010 | SessionRecord, JourneySnapshot (validation); SessionSyncRecord transport; RPT-01/RPT-02 views | Covered |
| FN-M03-011 | Revision, AuditRecord, AdminAccount (actor) | Covered |

- Entity-orphaned functions: none.
- Canonical entities with no FN-level evidence: none.
- Function coverage: 26/26 FN-level functions (7 M01, 8 M02, 11 M03) map to at least one canonical entity or declared data concept.
- Human Gate disposition (V2): the canonical set has 16 entities — ENT-DATA-001–003 and 005–017; ENT-DATA-004 is retired and Revision (ENT-DATA-017) replaces it and the former implied AdministrativeRevision.

## 9. Human Gate 1 (V2, 2026-10-28)

- [x] Canonical entity names accepted
- [x] Aliases/synonyms accepted
- [x] Ownership accepted
- [x] Implied entities reviewed
- [x] Conflicts resolved or recorded
- [x] Non-entity exclusions accepted
- [x] Ready for S2 CRUD Matrix
- [x] HC-006 `AuditRecord.revision` semantics clarified in M03 (v3.7 clarification, 2026-10-28)

**S1 STATUS: PASS — HUMAN GATE 1 (V2) ACCEPTED — READY FOR S2 CRUD MATRIX**
