# CRUD Matrix — Cúc Phương Quest

## 1. Document Metadata

| Field | Value |
|---|---|
| Session | 5 — Data Modeling |
| Stage | S2 — CRUD Matrix |
| Source Entity Dictionary | [01-entity-dictionary.md](01-entity-dictionary.md), Human Gate 1 PASS |
| Source Function Lists | [M01](../docs/function%20list/function-list-M01.md), [M02](../docs/function%20list/function-list-M02.md), [M03](../docs/function%20list/function-list-M03.md) |
| Behavioral evidence | [Spec M01](../docs/spec/spec-M01.md), [Spec M02](../docs/spec/spec-M02.md), [Spec M03](../docs/spec/spec-M03.md) |
| Priority source | [MVP-Scope.md](../MVP-Scope.md) |
| Status | PASS — ready for S3 Conceptual ERD |

The S1 pre-check passed without discrepancy: the authoritative dictionary status is `S1 STATUS: PASS — READY FOR S2 CRUD MATRIX`, Table A contains 16 canonical entities, and the function lists contain 7 M01, 8 M02 and 10 M03 FN-level functions (25 total). No entity has been added in S2.

## 2. CRUD Legend

| Symbol | Meaning in this matrix |
|---|---|
| C | Creates a new canonical entity instance or business record. |
| R | Reads existing canonical entity state, including lookup, validation, reporting or copying from a canonical source. |
| U | Changes an existing canonical entity, including lifecycle/status transition or singleton replacement. |
| D | Actually removes a persisted canonical entity instance where the requirement explicitly permits deletion. |

Cells combine symbols when one FN-level function supports multiple operations. A blank cell means no source-supported interaction was found. Archive, close, reopen, replace and withdrawal are updates, not deletes.

## 3. Matrix Scope

- Rows are the 25 FN-level functions from M01–M03; the 171 sub-functions are evidence only.
- Columns are exactly the 16 canonical entities accepted in S1 Table A.
- Views, projections, manifests, embedded values and transport contracts are mapped to their canonical source or owning entity.
- Cross-module consumers are read-only. No C/U/D is assigned across a canonical ownership boundary.
- No PK/FK, schema, normalization, API or implementation behavior is inferred.

## 4. CRUD Matrix

| Function ID | Function | Route | Checkpoint | QRCode | CheckpointContent | Media | JourneySnapshot | AdminAccount | AuditRecord | LanguagePreference | SelectedRouteContext | OfflinePackage | OfflineResource | PlaySession | CheckpointVisit | PendingSyncItem | SessionRecord |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FN-M01-001 | Language Preference |  |  |  |  |  |  |  |  | C/R/U |  |  |  |  |  |  |  |
| FN-M01-002 | Route Discovery | R |  |  |  |  |  |  |  |  | R/U |  |  |  |  |  |  |
| FN-M01-003 | Route Recommendation | R |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| FN-M01-004 | Offline Need & Decision | R |  |  |  |  | R |  |  |  |  | R |  |  |  |  |  |
| FN-M01-005 | Offline Package Lifecycle |  |  |  |  |  | R |  |  |  |  | C/R/U/D | C/R/D |  |  |  |  |
| FN-M01-006 | Route Start & Handoff | R |  |  |  |  | R |  |  |  | C/R/U | R |  |  |  |  |  |
| FN-M01-007 | Shared Contract Publication |  |  |  |  |  |  |  |  | R | R | R |  |  |  |  |  |
| FN-M02-001 | Handoff Validation & Session Start |  |  |  |  |  |  |  |  |  | R |  |  | C/R |  |  |  |
| FN-M02-002 | Session Lifecycle & Recovery |  |  |  |  |  |  |  |  |  |  |  |  | C/R/U | C/R |  |  |
| FN-M02-003 | Journey Map |  |  |  |  |  |  |  |  |  |  |  |  | R | R |  |  |
| FN-M02-004 | QR Resolution & Check-in |  | R | R |  |  |  |  |  |  |  |  |  | R | C/R |  |  |
| FN-M02-005 | Content Delivery |  | R |  | R | R |  |  |  | R |  | R | R | R |  |  |  |
| FN-M02-006 | Completion & Route Replacement |  |  |  |  |  |  |  |  |  |  |  |  | C/R/U | R |  |  |
| FN-M02-007 | Terminal Sync |  |  |  |  |  |  |  |  |  |  |  |  | R | R | C/R/U |  |
| FN-M02-008 | Free Visitor Experience |  | R | R | R | R |  |  |  |  |  |  |  |  |  |  |  |
| FN-M03-001 | Route Administration | C/R/U |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| FN-M03-002 | Checkpoint Administration | R | C/R/U |  |  |  | C |  |  |  |  |  |  |  |  |  |  |
| FN-M03-003 | QR Administration |  | R | C/R/U |  |  | C |  |  |  |  |  |  |  |  |  |  |
| FN-M03-004 | Bilingual Content & Media |  | R |  | C/R/U | C/R/U |  |  |  |  |  |  |  |  |  |  |  |
| FN-M03-005 | Review & Publication | R/U | R | R | R/U |  | C/R |  | C |  |  |  |  |  |  |  |  |
| FN-M03-006 | Journey Snapshot | R/U | R | R | R | R | C/R |  |  |  |  |  |  |  |  |  |  |
| FN-M03-007 | Emergency Operations | R/U | R/U | R | R |  | C/R |  | C |  |  |  |  |  |  |  |  |
| FN-M03-008 | Authentication, Accounts, Authorization & Concurrency |  |  |  |  |  |  | C/R/U | C |  |  |  |  |  |  |  |  |
| FN-M03-009 | Live QR & Content Service |  | R | R | R | R |  |  |  |  |  |  |  |  |  |  |  |
| FN-M03-010 | Session Intake & Reporting |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | C/R |

## 5. CRUD Evidence

### FN-M01-001 — Language Preference

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| LanguagePreference | C/R/U | Initial entry checks for a current preference, persists the first valid selection and atomically replaces it when changed. | SF-M01-001-01–03; FR-M01-001, FR-M01-013 |

### FN-M01-002 — Route Discovery

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| Route | R | Reads the published route projection and filters selectable active routes. | SF-M01-002-01–03; FR-M01-002, FR-M01-003 |
| SelectedRouteContext | R/U | A successful refresh may identify a current context for a newly unavailable route and revoke it; package/session data is not deleted. | SF-M01-002-05; FR-M01-002, FR-M01-012 |

### FN-M01-003 — Route Recommendation

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| Route | R | Filters active routes by exact membership in all three selected tag groups and returns all matches. | SF-M01-003-02–04; FR-M01-004 |

### FN-M01-004 — Offline Need & Decision

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| Route | R | Uses the visitor's selected route as the decision subject. | SF-M01-004-01–06; FR-M01-005, FR-M01-006 |
| JourneySnapshot | R | Counts `OFFLINE_REQUIRED` checkpoints from the selected published snapshot. | SF-M01-004-01; FR-M01-005 |
| OfflinePackage | R | Inspects readiness and freshness before offering or bypassing the package decision. | SF-M01-004-02–06; FR-M01-005, FR-M01-006 |

### FN-M01-005 — Offline Package Lifecycle

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| JourneySnapshot | R | Fetches the current immutable snapshot as the manifest and offline-resource source. | SF-M01-005-01–03; FR-M01-007, FR-M01-008 |
| OfflinePackage | C/R/U/D | Creates and validates a candidate, reads package state, atomically activates or marks freshness, and removes a visitor-confirmed package. | SF-M01-005-03–11; FR-M01-008–010 |
| OfflineResource | C/R/D | Creates the required local resource copies, validates/reads their completeness, and removes them with their owning package. | SF-M01-005-02–03, SF-M01-005-07, SF-M01-005-09–10; FR-M01-007–010; M01 §6.4 |

### FN-M01-006 — Route Start & Handoff

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| Route | R | Online Start validates the current active route before handoff. | SF-M01-006-01; FR-M01-011 |
| JourneySnapshot | R | Online Start reads the current published journey metadata used to build the handoff. | SF-M01-006-01, SF-M01-006-05; FR-M01-011, FR-M01-012 |
| OfflinePackage | R | Offline Start reads a ready package and may use its known-outdated manifest. | SF-M01-006-02–03, SF-M01-006-05; FR-M01-011, FR-M01-012 |
| SelectedRouteContext | C/R/U | Creates the first complete context, reads/preserves the current value during guarded replacement, atomically replaces it on later Start, and may revoke it after closure discovery. | SF-M01-006-04–08; FR-M01-012 |

### FN-M01-007 — Shared Contract Publication

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| LanguagePreference | R | Exposes the current valid language value without coupling it to other shared data. | SF-M01-007-01; FR-M01-001, FR-M01-013 |
| SelectedRouteContext | R | Exposes only the complete current v2 context after Start/revoke commit. | SF-M01-007-03–04; FR-M01-012, FR-M01-013 |
| OfflinePackage | R | Exposes only the active ready package and never staging/partial data. | SF-M01-007-02, SF-M01-007-04; FR-M01-008, FR-M01-013 |

### FN-M02-001 — Handoff Validation & Session Start

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| SelectedRouteContext | R | Reads and validates the current authorized v2 handoff without mutating M01 state. | SF-M02-001-01–03; FR-M02-001, FR-M02-020 |
| PlaySession | C/R | Reads existing sessions to reject consumed handoffs/enforce one active session, then creates a new session identity and frozen journey for an accepted handoff. | SF-M02-001-03–06; FR-M02-002–004 |

### FN-M02-002 — Session Lifecycle & Recovery

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| PlaySession | C/R/U | Persists a new active session, restores it after reload and transitions it once to immutable terminal state. | SF-M02-002-01, SF-M02-002-03–05; FR-M02-005, FR-M02-018 |
| CheckpointVisit | C/R | Persists first visits immediately and reads saved visits when restoring progress; saved timestamps are not updated. | SF-M02-002-02–04; FR-M02-005, FR-M02-007 |

### FN-M02-003 — Journey Map

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| PlaySession | R | Reads the fixed session-owned journey to order checkpoints, identify the final checkpoint and show coverage. | SF-M02-003-01–05; FR-M02-004, FR-M02-015, FR-M02-016 |
| CheckpointVisit | R | Reads existing visits to mark visual progress and calculate visited coverage. | SF-M02-003-03, SF-M02-003-05; FR-M02-008, FR-M02-016 |

### FN-M02-004 — QR Resolution & Check-in

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| PlaySession | R | Reads frozen journey QR arrays and checkpoint membership before any visit is recorded. | SF-M02-004-02–06; FR-M02-006, FR-M02-012 |
| QRCode | R | Resolves QR identity through the frozen projection or M03 live lookup and distinguishes inactive/withdrawn values. | SF-M02-004-02, SF-M02-004-06–08; FR-M02-006, FR-M02-012, FR-M02-013 |
| Checkpoint | R | Resolves the stable checkpoint represented by a valid QR and validates journey membership. | SF-M02-004-02–07; FR-M02-006, FR-M02-012 |
| CheckpointVisit | C/R | Reads for an existing visit and creates only the first visit for a session/checkpoint; repeated scans retain the original time. | SF-M02-004-03–05; FR-M02-007–009 |

### FN-M02-005 — Content Delivery

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| PlaySession | R | Reads the frozen checkpoint connectivity mode to select offline or live content. | SF-M02-005-01; FR-M02-010, FR-M02-011 |
| LanguagePreference | R | Reads the current M01-owned language and selects exactly that branch. | SF-M02-005-06; FR-M02-014 |
| OfflinePackage | R | Verifies a package is ready and evaluates version mismatch before using packaged content. | SF-M02-005-02–03; FR-M02-010 |
| OfflineResource | R | Reads text and static images by stable checkpoint ID, including a matching resource from an older package. | SF-M02-005-02–03, SF-M02-005-07; FR-M02-010 |
| Checkpoint | R | LiveStationContent maps the current public checkpoint name and connectivity classification to the M03-owned canonical source. | SF-M02-005-04; FR-M02-011; Entity Dictionary §7 |
| CheckpointContent | R | Reads the selected published language branch through offline/live projections. | SF-M02-005-02–06; FR-M02-010, FR-M02-011, FR-M02-014 |
| Media | R | Reads public static images and on-demand live audio/video through package or LiveStationContent projections. | SF-M02-005-02, SF-M02-005-04–05; FR-M02-010, FR-M02-011 |

### FN-M02-006 — Completion & Route Replacement

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| PlaySession | C/R/U | Reads progress/final-checkpoint state, completes or abandons the active session, and atomically creates its replacement when a new handoff is accepted. | SF-M02-006-01–04; FR-M02-015–017 |
| CheckpointVisit | R | Reads preserved visits to determine Finish eligibility and freeze historical visit values. | SF-M02-006-01, SF-M02-006-04–05; FR-M02-015–018 |

### FN-M02-007 — Terminal Sync

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| PlaySession | R | Reads the immutable terminal session header when building/sending the anonymous payload. | SF-M02-007-01–03; FR-M02-018 |
| CheckpointVisit | R | Reads historical visit labels, order and timestamps copied into the transport record. | SF-M02-007-01; FR-M02-018 |
| PendingSyncItem | C/R/U | Durably queues a payload, reads pending items for sending/retry and changes sync status to `SYNCED` or `CONFLICT`; failure remains pending. | SF-M02-007-02–06; FR-M02-018 |

### FN-M02-008 — Free Visitor Experience

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| QRCode | R | Resolves the scanned identity through M03 without creating session/progress data. | SF-M02-008-01–04; FR-M02-012, FR-M02-019 |
| Checkpoint | R | Reads the current public checkpoint projection returned for a valid QR. | SF-M02-008-02–03; FR-M02-012, FR-M02-019 |
| CheckpointContent | R | Reads current published bilingual content through LiveStationContent. | SF-M02-008-02–03; FR-M02-012, FR-M02-019 |
| Media | R | Reads current published media through LiveStationContent. | SF-M02-008-02–03; FR-M02-012, FR-M02-019 |

### FN-M03-001 — Route Administration

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| Route | C/R/U | Creates a stable route draft, reads its state/concurrency revision, edits draft fields/tags and archives through a terminal lifecycle update. | SF-M03-001-01–06; FR-M03-001, FR-M03-005, FR-M03-007, FR-M03-011 |

### FN-M03-002 — Checkpoint Administration

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| Route | R | Reads the owning Route because checkpoint creation requires that Route to exist. Active-version switching is performed by FN-M03-006, not this function. | SF-M03-002-01; FR-M03-002 |
| Checkpoint | C/R/U | Creates a checkpoint draft, reads route/activation guards and edits metadata, classification, order and lifecycle. | SF-M03-002-01–07; FR-M03-002, FR-M03-005, FR-M03-011 |
| JourneySnapshot | C | Approved journey-affecting reorder/archive produces a new immutable journey version. | SF-M03-002-06–07; FR-M03-009 |

### FN-M03-003 — QR Administration

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| Checkpoint | R | Reads checkpoint ownership and the active-QR guard before adding, replacing or withdrawing a QR. | SF-M03-003-01–03, SF-M03-003-06–07; FR-M03-003 |
| QRCode | C/R/U | Creates unique QR identities, reads active membership/reprint state and updates metadata or terminal replacement/withdrawal lifecycle. | SF-M03-003-01–07; FR-M03-003, FR-M03-006 |
| JourneySnapshot | C | A published active-QR-set change creates a new immutable snapshot. | SF-M03-003-08; FR-M03-009 |

### FN-M03-004 — Bilingual Content & Media

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| Checkpoint | R | Reads the owning checkpoint, language streams and connectivity classification for content/media management and offline packaging. | SF-M03-004-01, SF-M03-004-05, SF-M03-004-07; FR-M03-004 |
| CheckpointContent | C/R/U | Creates a language draft, reads stream/review state and transitions revisions through submit, approve/reject and publish lifecycle. | SF-M03-004-01–04; FR-M03-004–006 |
| Media | C/R/U | Creates media metadata, reads eligibility/rights and updates metadata or publication state. | SF-M03-004-05–08; FR-M03-004, FR-M03-012 |

### FN-M03-005 — Review & Publication

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| Route | R/U | Reads submission/publication state and atomically changes public metadata, route state or active snapshot version after approval. | SF-M03-005-01–07; FR-M03-005, FR-M03-008, FR-M03-009 |
| Checkpoint | R | Reads publishable-checkpoint completeness and lifecycle during publication guards. | SF-M03-005-01, SF-M03-005-04, SF-M03-005-07; FR-M03-005 |
| QRCode | R | Reads active QR completeness for publishable checkpoints. | SF-M03-005-04; FR-M03-005; BR-M03-003 |
| CheckpointContent | R/U | Reads bilingual revision/diff and changes rejected or published revision lifecycle state. | SF-M03-005-02, SF-M03-005-05–07; FR-M03-005, FR-M03-006, FR-M03-008 |
| JourneySnapshot | C/R | Reads any current version and creates the immutable first/replacement snapshot when publication affects the journey. | SF-M03-005-07; FR-M03-008, FR-M03-009 |
| AuditRecord | C | Appends an immutable record for publication or rejection outcome. | SF-M03-005-08; FR-M03-006, FR-M03-008 |

### FN-M03-006 — Journey Snapshot

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| Route | R/U | Reads route/version state and atomically switches `activeContentVersion` after a valid snapshot is published. | SF-M03-006-01, SF-M03-006-07–09; FR-M03-008–010 |
| Checkpoint | R | Reads all active checkpoints, ordering, names and connectivity for the complete snapshot. | SF-M03-006-02, SF-M03-006-05; FR-M03-009 |
| QRCode | R | Reads active QR arrays embedded in each active checkpoint projection. | SF-M03-006-03, SF-M03-006-05; FR-M03-009 |
| CheckpointContent | R | Reads bilingual published content for conditional offline resources. | SF-M03-006-04–05; FR-M03-009 |
| Media | R | Reads published static image references included in offline resources. | SF-M03-006-04–05; FR-M03-004, FR-M03-009 |
| JourneySnapshot | C/R | Reads the preceding/current version and creates a complete linked immutable version; retention does not imply deletion. | SF-M03-006-05–09; FR-M03-009, FR-M03-010; BR-M03-005, BR-M03-008 |

### FN-M03-007 — Emergency Operations

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| Route | R/U | Reads route/checkpoint outcome and closes, auto-closes or reopens the route through lifecycle transitions. | SF-M03-007-01, SF-M03-007-04, SF-M03-007-06–07; FR-M03-011 |
| Checkpoint | R/U | Reads completeness and closes/reopens a checkpoint through lifecycle transitions. | SF-M03-007-02, SF-M03-007-04–07; FR-M03-005, FR-M03-011 |
| QRCode | R | Reads active-QR completeness before reopen. | SF-M03-007-06; FR-M03-005, FR-M03-011 |
| CheckpointContent | R | Reads bilingual published-content completeness before reopen. | SF-M03-007-06; FR-M03-005, FR-M03-011 |
| JourneySnapshot | C/R | Reads the current journey and creates a replacement snapshot for checkpoint close/reopen where required. | SF-M03-007-03, SF-M03-007-07; FR-M03-009, FR-M03-011 |
| AuditRecord | C | Appends closure/reopen and safety-confirmation audit evidence. | SF-M03-007-01, SF-M03-007-05; FR-M03-011 |

### FN-M03-008 — Authentication, Accounts, Authorization & Concurrency

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| AdminAccount | C/R/U | Reads account/role/status for every protected request, creates invitation/bootstrap accounts and updates linkage, role or activation status. | SF-M03-008-02, SF-M03-008-05–12; FR-M03-006, FR-M03-007, FR-M03-013 |
| AuditRecord | C | Appends an immutable entry for protected mutations and account-provisioning outcomes without credential/token values. | SF-M03-008-13; FR-M03-006, FR-M03-007, FR-M03-013 |

### FN-M03-009 — Live QR & Content Service

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| QRCode | R | Resolves only an active public QR identity; replaced, withdrawn and unknown identifiers are invalid. | SF-M03-009-01, SF-M03-009-04–05; FR-M03-012 |
| Checkpoint | R | Validates current public checkpoint state and returns its current name/connectivity projection. | SF-M03-009-02–05; FR-M03-012 |
| CheckpointContent | R | Reads both current published language branches for the live response. | SF-M03-009-02–05; FR-M03-012 |
| Media | R | Reads public images/audio/video returned through LiveStationContent. | SF-M03-009-03–05; FR-M03-012 |

### FN-M03-010 — Session Intake & Reporting

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| SessionRecord | C/R | Reads by `sessionId` for idempotency/conflict checks, creates the first immutable accepted record and reads synchronized records for both reports. | SF-M03-010-01–11; FR-M03-014–016; BR-M03-016, BR-M03-017 |

## 6. Ownership Check

| Entity | Canonical Owner | Creating Functions | Updating Functions | Deleting Functions | External Readers | Result |
|---|---|---|---|---|---|---|
| Route | M03 | FN-M03-001 | FN-M03-001/005/006/007 | — | FN-M01-002/003/004/006 | PASS |
| Checkpoint | M03 | FN-M03-002 | FN-M03-002/007 | — | FN-M02-004/005/008 | PASS |
| QRCode | M03 | FN-M03-003 | FN-M03-003 | — | FN-M02-004/008 | PASS |
| CheckpointContent | M03 | FN-M03-004 | FN-M03-004/005 | — | FN-M02-005/008 | PASS |
| Media | M03 | FN-M03-004 | FN-M03-004 | — | FN-M02-005/008 | PASS |
| JourneySnapshot | M03 | FN-M03-002/003/005/006/007 | — | — | FN-M01-004/005/006 | PASS |
| AdminAccount | M03 | FN-M03-008 | FN-M03-008 | — | — | PASS |
| AuditRecord | M03 | FN-M03-005/007/008 | — | — | — | PASS |
| LanguagePreference | M01 | FN-M01-001 | FN-M01-001 | — | FN-M02-005 | PASS |
| SelectedRouteContext | M01 | FN-M01-006 | FN-M01-002/006 | — | FN-M02-001 | PASS |
| OfflinePackage | M01 | FN-M01-005 | FN-M01-005 | FN-M01-005 | FN-M02-005 | PASS |
| OfflineResource | M01 | FN-M01-005 | — | FN-M01-005 | FN-M02-005 | PASS |
| PlaySession | M02 | FN-M02-001/002/006 | FN-M02-002/006 | — | — | PASS |
| CheckpointVisit | M02 | FN-M02-002/004 | — | — | — | PASS |
| PendingSyncItem | M02 | FN-M02-007 | FN-M02-007 | — | — | PASS |
| SessionRecord | M03 | FN-M03-010 | — | — | — | PASS |

No canonical entity is written by more than one module. M01/M02 operations on M03 projections and M02 reads of M01 shared values remain R-only.

## 7. Anomaly Detection

| Anomaly ID | Type | Function/Entity | Evidence | Severity | Resolution |
|---|---|---|---|---|---|
| ANOM-S2-001 | WRITE-ONLY | AuditRecord | FN-M03-005/007/008 append AuditRecord, but no current FN-level requirement reads audit history. | INFO | ACCEPTED — intentional MVP behavior. Keep append-only C semantics; audit querying is outside the current baseline and no R function is invented. |

Category scan:

| Type | Count | Result |
|---|---:|---|
| NO-C | 0 | Every canonical entity has at least one source-supported creating function. |
| WRITE-ONLY | 1 accepted | AuditRecord is intentionally append-only in the MVP; no current function reads audit history. |
| MULTI-OWNER | 0 | No C/U/D crosses the accepted owner boundary. |
| ORPHAN FUNCTION | 0 | Every FN-level function has at least one CRUD interaction. |
| UNUSED ENTITY | 0 | Every canonical entity is touched by at least one function. |
| SUSPICIOUS-D | 0 | The only D operations are confirmed M01 package/resource removal. |
| IMMUTABILITY-CONFLICT | 0 | JourneySnapshot, CheckpointVisit, SessionRecord and AuditRecord have no U/D. |
| OWNERSHIP-VIOLATION | 0 | External consumers are R-only. |

Special-case results:

- JourneySnapshot is created/read only; published versions are never updated or deleted. Retention language does not create D.
- AuditRecord is append-only C; `ANOM-S2-001` is accepted as intentional, non-blocking MVP behavior.
- LanguagePreference supports first C, current-value R and singleton replacement U; no history entity is inferred.
- SelectedRouteContext supports first C, guarded R and atomic replacement/revocation U; no D is inferred.
- OfflinePackage and owned OfflineResource are the only entities with D, based on confirmed visitor deletion/cascade behavior.
- CheckpointVisit is C/R only; repeated scans retain the first timestamp.
- PendingSyncItem is C/R/U exclusively in FN-M02-007; FN-M02-006 freezes the transport payload but does not durably queue the canonical item.
- SessionRecord is C/R only and immutable after first accepted ingest.
- Media uses `mediaId: UUID`; `sourceRef` is read as a resource reference, not identity.
- AdminAccount remains one C/R/U entity; provider identity is external linkage rather than another column/entity in this matrix.

## 8. Coverage Summary

| Metric | Result |
|---|---:|
| Total FN-level functions | 25 |
| Total canonical entities | 16 |
| Functions with CRUD coverage | 25 / 25 |
| Entities with CRUD coverage | 16 / 16 |
| C operations | 25 |
| R operations | 73 |
| U operations | 18 |
| D operations | 2 |
| Total detected anomalies | 1 |
| Blockers | 0 |

Anomalies by type: `WRITE-ONLY = 1`; all required zero-result categories are recorded in §7.

## 9. S2 Review Gate

- [x] Every FN-level function reviewed
- [x] Every canonical entity reviewed
- [x] Every CRUD cell traceable to source
- [x] No unsupported cross-module writes
- [x] Immutable entities respected
- [x] Delete semantics reviewed
- [x] All anomalies classified
- [x] Ready for S3 Conceptual ERD

**S2 STATUS: PASS — READY FOR S3 CONCEPTUAL ERD**

The recorded S2 review accepts `ANOM-S2-001` as an intentional MVP write-only audit record. No anomaly decision remains outstanding; see S6 HG-S6-001. M03 §6.4 DEC-S6-002 confirms no backend hard-delete/purge operation in MVP, so the direct CRUD assignments remain unchanged.
