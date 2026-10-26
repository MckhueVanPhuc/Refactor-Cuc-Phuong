# Conceptual ERD Review

## 1. Relationship Catalog

The Mermaid labels are uppercase renderings of the 16 canonical S1 names; underscores only separate words visually and do not introduce aliases or additional entities. Cardinality is written from Entity A to Entity B.

| ID | Entity A | Cardinality | Entity B | Relationship | Source | Status |
|---|---|---|---|---|---|---|
| REL-001 | Route | `1 : 0..*` | Checkpoint | Route contains Checkpoints; every Checkpoint belongs to exactly one Route. Draft Route may have none; submission requires at least one. | Entity Dictionary ENT-DATA-001/002; M03 §3 US-M03-01; §6.2, logical persistence constraints | CONFIRMED |
| REL-002 | Checkpoint | `1 : 0..*` | QRCode | Checkpoint has QR identities; every QRCode belongs to exactly one Checkpoint. Zero is allowed before activation, while an active Checkpoint must retain at least one active QRCode. | Entity Dictionary ENT-DATA-002/003; M03 §3 US-M03-03; §6.2, BR-M03-003/010 | CONFIRMED |
| REL-003 | Checkpoint | `1 : 0..*` | CheckpointContent | Checkpoint owns per-language revision streams; each CheckpointContent belongs to one Checkpoint. | Entity Dictionary ENT-DATA-002/004; M03 §6.3 and logical persistence constraints | CONFIRMED |
| REL-004 | Checkpoint | `1 : 0..*` | Media | Checkpoint owns zero or more managed Media resources; every Media belongs to one Checkpoint. | Entity Dictionary ENT-DATA-005; M03 §6.3 | CONFIRMED |
| REL-005 | Route | `1 : 0..*` | JourneySnapshot | Route produces immutable journey versions; every JourneySnapshot belongs to one Route/version. A draft Route may have no snapshot. | Entity Dictionary ENT-DATA-001/006; M03 §5.1, §5.2 BR-M03-004–008; §6.4 | CONFIRMED |
| REL-006 | Route | `0..1 : 0..1` | JourneySnapshot | Route may activate one published JourneySnapshot; a JourneySnapshot is either inactive historical data or the active version of its own Route. | Entity Dictionary ENT-DATA-001/006; M03 §5.1 Published Route, §6.4 logical persistence constraints | CONFIRMED |
| REL-007 | AdminAccount | `0..1 : 0..*` | AuditRecord | An AuditRecord may have one AdminAccount actor; server-side provisioning may have no authenticated actor. An account may act in many records. | Entity Dictionary ENT-DATA-007/008; M03 §6.4 AuditRecord actor rule | CONFIRMED |
| REL-008 | AdminAccount | `0..1 : 0..*` | CheckpointContent | Submitted CheckpointContent may identify one submitting AdminAccount; an account may submit many revisions. | Entity Dictionary ENT-DATA-004/007; M03 §6.3 `submittedByUserId` rule | CONFIRMED |
| REL-009 | AdminAccount | `0..1 : 0..*` | CheckpointContent | Approved CheckpointContent may identify one approving AdminAccount; an account may approve many revisions and must differ from the submitter. | Entity Dictionary ENT-DATA-004/007; M03 §6.3 `approvedByUserId` rule; BR-M03-002 | CONFIRMED |
| REL-010 | Route | `1 : 0..1` | SelectedRouteContext | The current singleton handoff refers to exactly one Route; any Route may or may not be the one represented by the current context. | Entity Dictionary ENT-DATA-010; M01 §5.3 SelectedRouteContext, §6.4 | CONFIRMED |
| REL-011 | Route | `1 : 0..*` | OfflinePackage | Each OfflinePackage covers one Route/version; a Route may have no package or versioned ready/candidate package instances during lifecycle processing. | Entity Dictionary ENT-DATA-011; M01 §5.3 OfflinePackage, BR-M01-004/006; §6.4 | CONFIRMED |
| REL-012 | OfflinePackage | `1 : 0..*` | OfflineResource | Every OfflineResource belongs to one OfflinePackage. A package has exactly one resource per offline-required checkpoint and may have none when its manifest has none. | Entity Dictionary ENT-DATA-011/012; M01 §5.3 `resources`, BR-M01-004; §6.4 | CONFIRMED |
| REL-013 | Checkpoint | `1 : 0..*` | OfflineResource | Each OfflineResource references one Checkpoint in its package manifest; a Checkpoint may have resource copies in zero or more package versions/local profiles. | Entity Dictionary ENT-DATA-012; M01 §5.3 `resources[].checkpointId`; §6.4 | CONFIRMED |
| REL-014 | SelectedRouteContext | `1 : 0..1` at creation | PlaySession | An accepted handoff may originate at most one PlaySession. The session retains `sourceHandoffId` after a later Start replaces the singleton context; this is creation lineage, not a permanent reference to the current context. | Entity Dictionary ENT-DATA-010/013; M01 §5.3/§6.4, BR-M01-009; M02 FR-M02-001/003, BR-M02-001, §6.1 | CONFIRMED — LINEAGE |
| REL-015 | Route | `1 : 0..*` | PlaySession | Every PlaySession is for one Route copied from its accepted handoff; a Route may be experienced by many sessions. | Entity Dictionary ENT-DATA-013; M02 §5.1 SelectedRouteContext, §6.1 | CONFIRMED |
| REL-016 | PlaySession | `1 : 0..*` | CheckpointVisit | PlaySession owns its CheckpointVisits; a new session may have none and each visit belongs to exactly one session. | Entity Dictionary ENT-DATA-013/014; M02 §6.2 and logical persistence constraints | CONFIRMED |
| REL-017 | Checkpoint | `1 : 0..*` | CheckpointVisit | Each CheckpointVisit refers to one checkpoint in the frozen journey; a Checkpoint may be visited in many sessions. | Entity Dictionary ENT-DATA-014; M02 §5.2 BR-M02-004; §6.2 | CONFIRMED |
| REL-018 | PlaySession | `1 : 0..1` | PendingSyncItem | A PlaySession has no queue item before terminal sync data is persisted and at most one afterward; every PendingSyncItem belongs to one terminal session. | Entity Dictionary ENT-DATA-013/015; M02 §6.4 and logical persistence constraints | CONFIRMED |
| REL-019 | PlaySession | `1 : 0..1` at intake | SessionRecord | A terminal PlaySession may yield one accepted SessionRecord through `SessionSyncRecord`; unsynchronized/conflicted sessions yield none. The accepted record persists independently if browser-local session data is removed; this is transport lineage, not a persistent cross-store reference. | Entity Dictionary ENT-DATA-013/016; M02 §5.1/§6.4; M03 §5.1, §6.4, §11 cross-module mapping | CONFIRMED — LINEAGE |
| REL-020 | Route | `1 : 0..*` | SessionRecord | Every SessionRecord carries one historical Route identity and reports group accepted records by Route; a Route may have no or many records. | Entity Dictionary ENT-DATA-016; M03 §5.1 SessionSyncRecord, §5.2 BR-M03-017, §6.4 | CONFIRMED |
| REL-021 | JourneySnapshot (predecessor) | `0..1 : 0..*` | JourneySnapshot (successor) | Each successor has at most one same-Route predecessor; a predecessor may have many successors. No inverse uniqueness is imposed; the Route still activates at most one published version. | Entity Dictionary ENT-DATA-006; M01 §5.3; M03 §6.4 CL-S4-001 | CONFIRMED |

The Mermaid ERD contains 21 confirmed links, including the REL-021 self-relationship and two source-supported lineage links (REL-014 and REL-019). The latter express creation/intake history, not ongoing referential existence.

## 2. Excluded Relationships

| Excluded concept/link | Reason not drawn |
|---|---|
| JourneySnapshot → embedded Checkpoint/QRCode/content/media values | A snapshot contains immutable historical projections, not ownership of the mutable canonical source entities. Drawing these as direct entity associations would erase the source-versus-copy distinction. |
| JourneySnapshot → OfflinePackage manifest → SelectedRouteContext manifest → PlaySession frozen journey | The manifests/frozen journey are embedded value copies, not canonical entities. Confirmed owner relationships are represented without adding intermediate nodes. Snapshot-to-package copy multiplicity across local profiles is not declared as an independent business association. |
| OfflinePackage → SelectedRouteContext | Offline Start reads a package manifest, while online Start reads the current snapshot. No persistent direct association between the package and current handoff is declared. |
| Media → OfflineResource | OfflineResource stores image references/bytes copied from published media; the source does not declare an independent canonical Media-to-OfflineResource association lifecycle. |
| PendingSyncItem → SessionRecord through SessionSyncRecord | SessionSyncRecord is transport-only. The canonical business lineage is represented as PlaySession → SessionRecord without creating or joining through a transport entity. |
| SessionRecord → CheckpointVisit | SessionRecord contains immutable historical visit values copied through transport; they are not the same canonical M02 CheckpointVisit instances. |
| AuditRecord → affected Route/Checkpoint/QRCode/content/account entity | AuditRecord uses a generic affected-entity reference. The source does not declare separate cardinalities to each possible canonical target, so polymorphic implementation links are not invented. |
| LanguagePreference → CheckpointContent/OfflineResource/PlaySession | LanguagePreference selects a render branch but explicitly does not own or mutate package/session/content state. It remains a standalone canonical entity. |
| Published Route, OfflineStationContent, LiveStationContent, RouteJourneyMap, RPT-01 and RPT-02 | These are projections, views or report outputs rather than canonical entities. |
| RecommendationContext, report filters and UI state | These are transient contexts and do not have canonical persistence identity. |
| Provider identity/session/credential | Authentication-provider data is external; no ProviderIdentity canonical entity was approved. |
| AdministrativeRevision | Human Gate 1 retained it as an implied concept, not a canonical entity; S3 cannot promote it. |

## 3. Human Gate 3 record

PASS — the relationship catalog records both directions for REL-001–REL-021 and distinguishes the two time-bound lineage links. REL-021 is finalized in M03 §6.4 and included in the conceptual Mermaid source. Both cardinality directions are resolved; no relationship decision remains outstanding. See S6 HG-S6-001 for the final review disposition.
