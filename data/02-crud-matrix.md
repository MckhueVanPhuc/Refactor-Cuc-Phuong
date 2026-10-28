# CRUD Matrix — Cúc Phương Quest

## 1. Document Metadata

| Field | Value |
|---|---|
| Session | 5 — Data Modeling |
| Stage | S2 — CRUD Matrix |
| Source Entity Dictionary | [01-entity-dictionary.md](01-entity-dictionary.md), Human Gate 1 (V2) PASS, 2026-10-28 |
| Source Function Lists | [M01](../docs/function%20list/function-list-M01.md), [M02](../docs/function%20list/function-list-M02.md), [M03](../docs/function%20list/function-list-M03.md) |
| Behavioral evidence | [Spec M01](../docs/spec/spec-M01.md) v3.2, [Spec M02](../docs/spec/spec-M02.md) v3.3, [Spec M03](../docs/spec/spec-M03.md) v3.7 |
| Priority source | [MVP-Scope.md](../MVP-Scope.md) |
| Status | PASS — S2 review (V2) accepted 2026-10-28; ready for S3 Conceptual ERD |

The S1 pre-check passed without discrepancy: the authoritative dictionary status is `S1 STATUS: PASS — HUMAN GATE 1 (V2) ACCEPTED — READY FOR S2 CRUD MATRIX`, Table A contains 16 canonical entities (ENT-DATA-001–003 and 005–017; ENT-DATA-004 `CheckpointContent` is retired), and the function lists contain 7 M01, 8 M02 and 11 M03 FN-level functions (26 total). No entity has been added in S2.

V2 rebaseline (2026-10-28): the `CheckpointContent` column is removed with ENT-DATA-004 and a `Revision` column is appended; content reads move to Revision; FN-M03-011 is added and takes over the audit append of the removed SF-M03-008-13; `ANOM-S2-001` is resolved because SF-M03-011-05 now reads the audit log.

## 2. CRUD Legend

| Symbol | Meaning in this matrix |
|---|---|
| C | Creates a new canonical entity instance or business record. |
| R | Reads existing canonical entity state, including lookup, validation, reporting or copying from a canonical source. |
| U | Changes an existing canonical entity, including lifecycle/status transition or singleton replacement. |
| D | Actually removes a persisted canonical entity instance where the requirement explicitly permits deletion. |

Cells combine symbols when one FN-level function supports multiple operations. A blank cell means no source-supported interaction was found. Archive, close, reopen, revoke, discard and restore are creates or updates, not deletes.

## 3. Matrix Scope

- Rows are the 26 FN-level functions from M01–M03; the 218 sub-functions (50 M01, 55 M02, 113 M03) are evidence only.
- Columns are exactly the 16 canonical entities accepted in S1 Table A. The retired `CheckpointContent` (ENT-DATA-004) has no column; `Revision` (ENT-DATA-017) is the last column.
- Views, projections, manifests, embedded values and transport contracts are mapped to their canonical source entities: Published Route to Route, Revision (published content), Media (images) and JourneySnapshot (stop count and names); LiveStationContent to QRCode, Checkpoint, Revision and Media; route essentials and the offline route map to OfflinePackage, in which they are embedded.
- Cross-module consumers are read-only. No C/U/D is assigned across a canonical ownership boundary.
- AuditRecord C is assigned only where a sub-function names the audit effect; the shared audit behavior of other protected mutations (SF-M03-011-04) is not assigned to them indirectly.
- No PK/FK, schema, normalization, API or implementation behavior is inferred.

## 4. CRUD Matrix

| Function ID | Function | Route | Checkpoint | QRCode | Media | JourneySnapshot | AdminAccount | AuditRecord | LanguagePreference | SelectedRouteContext | OfflinePackage | OfflineResource | PlaySession | CheckpointVisit | PendingSyncItem | SessionRecord | Revision |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FN-M01-001 | Language Preference |  |  |  |  |  |  |  | C/R/U |  |  |  |  |  |  |  |  |
| FN-M01-002 | Route Discovery | R |  |  | R | R |  |  |  | R/U | R |  |  |  |  |  | R |
| FN-M01-003 | Route Recommendation | R |  |  |  |  |  |  |  |  |  |  |  |  |  |  | R |
| FN-M01-004 | Offline Need & Decision | R |  |  |  | R |  |  |  |  | R |  |  |  |  |  |  |
| FN-M01-005 | Offline Package Lifecycle | R |  |  |  | R |  |  |  |  | C/R/U/D | C/R/D |  |  |  |  | R |
| FN-M01-006 | Route Start & Handoff | R |  |  |  | R |  |  |  | C/R/U | R |  |  |  |  |  |  |
| FN-M01-007 | Shared Contract Publication |  |  |  |  |  |  |  | R | R | R |  |  |  |  |  |  |
| FN-M02-001 | Handoff Validation & Session Start |  |  |  |  |  |  |  |  | R |  |  | C/R |  |  |  |  |
| FN-M02-002 | Session Lifecycle & Recovery |  |  |  |  |  |  |  |  |  |  |  | C/R/U | C/R |  |  |  |
| FN-M02-003 | Journey Map |  |  |  |  |  |  |  | R |  |  |  | R | R |  |  |  |
| FN-M02-004 | QR Resolution & Check-in |  | R | R |  |  |  |  | R |  |  |  | R | C/R |  |  |  |
| FN-M02-005 | Content Delivery |  | R |  | R |  |  |  | R |  | R | R | R |  |  |  | R |
| FN-M02-006 | Completion & Route Replacement |  |  |  |  |  |  |  |  |  |  |  | C/R/U | R |  |  |  |
| FN-M02-007 | Terminal Sync |  |  |  |  |  |  |  |  |  |  |  | R | R | C/R/U |  |  |
| FN-M02-008 | Free Visitor Experience |  | R | R | R |  |  |  |  |  |  |  |  |  |  |  | R |
| FN-M03-001 | Route Administration | C/R/U | R |  | C/R/U |  |  |  |  |  |  |  |  |  |  |  | C/R/U |
| FN-M03-002 | Checkpoint Administration | R | C/R/U | R/U | R |  |  |  |  |  |  |  |  |  |  |  | C/R/U |
| FN-M03-003 | QR Administration |  | R | C/R/U |  | C |  |  |  |  |  |  |  |  |  |  | R |
| FN-M03-004 | Bilingual Content & Media |  | R | R/U | C/R/U |  |  |  |  |  |  |  |  |  |  |  | C/R/U |
| FN-M03-005 | Publication Review & Self-Publish | R/U | R/U | R/U | R/U | C/R |  | C |  |  |  |  |  |  |  |  | C/R/U |
| FN-M03-006 | Journey Snapshot | R/U | R | R | R | C/R |  |  |  |  |  |  |  |  |  |  | R |
| FN-M03-007 | Emergency Operations | R/U | R/U | R | R | C/R |  | C |  |  |  |  |  |  |  |  | R |
| FN-M03-008 | Authentication, Accounts, Authorization & Concurrency |  |  |  |  |  | C/R/U |  |  |  |  |  |  |  |  |  |  |
| FN-M03-009 | Live QR & Content Service | R | R | R | R |  |  |  |  |  |  |  |  |  |  |  | R |
| FN-M03-010 | Session Intake & Reporting | R |  |  |  | R |  |  |  |  |  |  |  |  |  | C/R |  |
| FN-M03-011 | History, Restore & Audit Log |  |  |  |  |  |  | C/R |  |  |  |  |  |  |  |  | C/R/U |

## 5. CRUD Evidence

### FN-M01-001 — Language Preference

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| LanguagePreference | C/R/U | Normal entry checks for a current preference, persists the first valid selection and atomically replaces it when changed; the control on every visitor screen, including the M02 QR link page, keeps M01 the only writer. | SF-M01-001-01–04; FR-M01-001, FR-M01-013 |

### FN-M01-002 — Route Discovery

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| Route | R | Reads the published route projection and filters selectable routes; closed/archived routes are excluded. | SF-M01-002-01–03; FR-M01-002 |
| Revision | R | Card and detail texts come from the published content of the route. | SF-M01-002-03, SF-M01-002-06; FR-M01-002, FR-M01-003 |
| Media | R | Route images are shown, with a neutral placeholder when an image cannot be loaded. | SF-M01-002-03, SF-M01-002-06–07; FR-M01-002, FR-M01-003 |
| JourneySnapshot | R | Route details list the checkpoints of the current published journey. | SF-M01-002-06; FR-M01-003 |
| OfflinePackage | R | Offline, the saved essential route texts embedded in the package are shown, never claimed as current. | SF-M01-002-08; FR-M01-003, FR-M01-014 |
| SelectedRouteContext | R/U | A successful refresh may identify a current context for a newly unavailable route and revoke it; package/session data is not deleted. | SF-M01-002-05; FR-M01-002, FR-M01-011, FR-M01-012 |

### FN-M01-003 — Route Recommendation

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| Route | R | Filters selectable routes and returns all exact matches without scoring or cap. | SF-M01-003-02–04; FR-M01-004 |
| Revision | R | The group and experience tags matched are part of the published route content. | SF-M01-003-02; FR-M01-004 |

### FN-M01-004 — Offline Need & Decision

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| Route | R | Uses the visitor's selected route as the decision subject. | SF-M01-004-01–07; FR-M01-005, FR-M01-006 |
| JourneySnapshot | R | Counts `OFFLINE_REQUIRED` checkpoints of the published snapshot; the downloaded snapshot is authoritative if it disagrees. | SF-M01-004-01; FR-M01-005 |
| OfflinePackage | R | Inspects readiness and freshness before offering or bypassing the package decision. | SF-M01-004-02–06; FR-M01-005, FR-M01-006 |

### FN-M01-005 — Offline Package Lifecycle

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| Route | R | Essential route texts are saved from, and refreshed against, the published route independently of the package version. | SF-M01-005-13–14; FR-M01-010, FR-M01-014 |
| Revision | R | The essential texts are taken from the published route content. | SF-M01-005-13–14; FR-M01-014 |
| JourneySnapshot | R | Fetches the current immutable snapshot as the manifest, offline-resource and offline-route-map source. | SF-M01-005-01–02, SF-M01-005-12; FR-M01-007, FR-M01-008 |
| OfflinePackage | C/R/U/D | Creates and validates a candidate, reads package state, atomically activates or switches it, refreshes the embedded essentials, and removes a visitor-confirmed package. | SF-M01-005-03–14; FR-M01-007–010, FR-M01-014 |
| OfflineResource | C/R/D | Creates exactly one local resource per QR of the offline-required checkpoints, validates its completeness, and removes it with its owning package. | SF-M01-005-02–03, SF-M01-005-07, SF-M01-005-09–10; FR-M01-007–010; M01 §6.4 |

### FN-M01-006 — Route Start & Handoff

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| Route | R | Online Start validates the current route and blocks a closed, incomplete or unavailable one. | SF-M01-006-01; FR-M01-011 |
| JourneySnapshot | R | Online Start reads the current published journey used to build the handoff. | SF-M01-006-01, SF-M01-006-05; FR-M01-011, FR-M01-012 |
| OfflinePackage | R | Offline Start reads a ready package and may use its known-outdated manifest. | SF-M01-006-02–03, SF-M01-006-05; FR-M01-011, FR-M01-012 |
| SelectedRouteContext | C/R/U | Creates a new one-use context with its 24-hour expiry, atomically replaces the current value on later Start, and may revoke it after closure discovery. | SF-M01-006-04–08; FR-M01-002, FR-M01-011, FR-M01-012 |

### FN-M01-007 — Shared Contract Publication

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| LanguagePreference | R | Exposes the current valid language value independently of other shared data. | SF-M01-007-01; FR-M01-001, FR-M01-013 |
| SelectedRouteContext | R | Exposes only the complete current v3 context. | SF-M01-007-03–04; FR-M01-012, FR-M01-013 |
| OfflinePackage | R | Exposes only the active ready package and never staging/partial data. | SF-M01-007-02, SF-M01-007-04; FR-M01-008, FR-M01-013 |

### FN-M02-001 — Handoff Validation & Session Start

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| SelectedRouteContext | R | Reads and validates the current `SelectedRouteContext v3` (version, status, expiry, route) without mutating M01 state. | SF-M02-001-01–03; FR-M02-001, FR-M02-020 |
| PlaySession | C/R | Reads existing sessions to reject consumed handoffs and enforce one active session per browser, then creates a new session identity with a frozen journey. | SF-M02-001-03–06; FR-M02-001–004 |

### FN-M02-002 — Session Lifecycle & Recovery

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| PlaySession | C/R/U | Persists a new active session, restores it after reload and transitions it once to an immutable terminal state. | SF-M02-002-01, SF-M02-002-03–05; FR-M02-001, FR-M02-005, FR-M02-018 |
| CheckpointVisit | C/R | Persists each accepted visit immediately and reads saved visits when restoring progress; saved timestamps are not updated. | SF-M02-002-02–04; FR-M02-005, FR-M02-007 |

### FN-M02-003 — Journey Map

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| PlaySession | R | Reads the fixed session-owned journey to order checkpoints, identify the final checkpoint and show coverage. | SF-M02-003-01–05; FR-M02-004, FR-M02-015, FR-M02-016 |
| CheckpointVisit | R | Reads existing visits to mark scanned checkpoints and calculate coverage. | SF-M02-003-03, SF-M02-003-05; FR-M02-008, FR-M02-016 |
| LanguagePreference | R | Checkpoint names are displayed in the current language. | SF-M02-003-02; FR-M02-014 |

### FN-M02-004 — QR Resolution & Check-in

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| PlaySession | R | Reads the frozen journey QR arrays and checkpoint membership before any visit is recorded. | SF-M02-004-02–06, SF-M02-004-09; FR-M02-006, FR-M02-012, FR-M02-022 |
| QRCode | R | Resolves the scanned identity through the M03 live lookup (with `routeId` when a session exists) or, offline, the frozen journey; `INVALID` and `TEMPORARILY_CLOSED` are distinguished. | SF-M02-004-01–02, SF-M02-004-07–10; FR-M02-006, FR-M02-011, FR-M02-013, FR-M02-025 |
| Checkpoint | R | Resolves the checkpoint of an accepted QR and validates journey membership. | SF-M02-004-02–07; FR-M02-006, FR-M02-012 |
| CheckpointVisit | C/R | Reads for an existing visit and creates only the first visit per session/checkpoint; repeated scans keep the original time. | SF-M02-004-03–05; FR-M02-007–009 |
| LanguagePreference | R | The QR link page applies the current language through the M01 language control. | SF-M02-004-11; FR-M02-014, FR-M02-025 |

### FN-M02-005 — Content Delivery

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| PlaySession | R | Reads the frozen checkpoint connectivity mode to select offline or live content. | SF-M02-005-01; FR-M02-010, FR-M02-011 |
| LanguagePreference | R | Reads the current M01-owned language to select the text branch and the audio/video listed. | SF-M02-005-06, SF-M02-005-09; FR-M02-014; BR-M02-026 |
| OfflinePackage | R | Verifies the package is `SAN_SANG` before using packaged content. | SF-M02-005-02–03; FR-M02-010 |
| OfflineResource | R | Reads text and static images by `qrIdentifier`, including a matching resource from an older package. | SF-M02-005-02–03; FR-M02-010 |
| Checkpoint | R | LiveStationContent carries the current public checkpoint name and connectivity mode, and a closure notice. | SF-M02-005-04, SF-M02-005-08; FR-M02-011, FR-M02-021 |
| Revision | R | The scanned QR's own published bilingual content, through the offline resource or LiveStationContent. | SF-M02-005-02–06; FR-M02-010, FR-M02-011, FR-M02-014 |
| Media | R | Static images and on-demand audio/video, filtered by `spokenLanguage`. | SF-M02-005-02, SF-M02-005-04–05, SF-M02-005-09; FR-M02-010, FR-M02-011; BR-M02-026 |

### FN-M02-006 — Completion & Route Replacement

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| PlaySession | C/R/U | Reads progress and final-checkpoint state, completes, abandons or automatically ends the session after 24 hours, and atomically creates its replacement when a new handoff is accepted. The terminal payload is queued by FN-M02-007, not here. | SF-M02-006-01–07; FR-M02-015–018, FR-M02-023, FR-M02-024; BR-M02-022 |
| CheckpointVisit | R | Reads preserved visits to determine Finish eligibility and freeze historical visit values. | SF-M02-006-01, SF-M02-006-04–05; FR-M02-015, FR-M02-017, FR-M02-018 |

### FN-M02-007 — Terminal Sync

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| PlaySession | R | Reads the immutable terminal session header when building the anonymous payload. | SF-M02-007-01–03; FR-M02-018 |
| CheckpointVisit | R | Reads historical visit labels, order and timestamps copied into the transport record. | SF-M02-007-01; FR-M02-018 |
| PendingSyncItem | C/R/U | Durably queues a payload, reads pending items for sending/retry and changes sync status to `SYNCED` or `CONFLICT`; failure remains pending. | SF-M02-007-02–06; FR-M02-018 |

### FN-M02-008 — Free Visitor Experience

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| QRCode | R | Resolves the scanned identity through M03 without `routeId` and without creating session/progress data. | SF-M02-008-01–04; FR-M02-012, FR-M02-013, FR-M02-019 |
| Checkpoint | R | Reads the current public checkpoint projection returned for a valid QR. | SF-M02-008-02–03; FR-M02-012, FR-M02-019 |
| Revision | R | Reads the scanned QR's current published bilingual content through LiveStationContent. | SF-M02-008-02–03; FR-M02-012, FR-M02-019 |
| Media | R | Reads current published media through LiveStationContent. | SF-M02-008-02–03; FR-M02-012, FR-M02-019 |

### FN-M03-001 — Route Administration

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| Route | C/R/U | Creates a route with a system-generated identity, reads its state/concurrency revision, and archives or discards it through lifecycle updates; checkpoints are untouched. | SF-M03-001-01, SF-M03-001-05–06, SF-M03-001-10; FR-M03-001, FR-M03-007, FR-M03-011 |
| Revision | C/R/U | Route texts, measures, tags, image references, offline-map tick, checkpoint list and safety tick are saved atomically as the route's draft revision. | SF-M03-001-02–05, SF-M03-001-07–09, SF-M03-001-11; FR-M03-001, FR-M03-005, FR-M03-007 |
| Media | C/R/U | Uploads and manages route images with usage rights per file. | SF-M03-001-07; FR-M03-001, FR-M03-004 |
| Checkpoint | R | Only `HOAT_DONG` checkpoints can be added to the ordered list, each at most once. | SF-M03-001-09; FR-M03-001 |

### FN-M03-002 — Checkpoint Administration

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| Checkpoint | C/R/U | Creates a checkpoint in the shared library (belonging to no route), edits name, mode, field verification and location note, publishes it for the first time, archives or discards it. | SF-M03-002-01–05, SF-M03-002-07, SF-M03-002-09–11; FR-M03-002, FR-M03-005, FR-M03-008, FR-M03-011; BR-M03-D05 |
| Revision | C/R/U | Bilingual name and connectivity mode are saved as the checkpoint's draft revision and published, or discarded. | SF-M03-002-02–05, SF-M03-002-10; FR-M03-002 |
| QRCode | R/U | First publication requires at least one ready visit point and publishes the ready visit points with it. | SF-M03-002-05; FR-M03-002, FR-M03-008 |
| Media | R | Switching to offline is blocked while audio/video exist. | SF-M03-002-08; FR-M03-002, FR-M03-004 |
| Route | R | Archiving requires that no non-archived route lists the checkpoint; usage shows the listing routes. | SF-M03-002-07, SF-M03-002-11; FR-M03-002, FR-M03-011 |

No JourneySnapshot is created here: first publication creates no journey version (BR-M03-D05), and journey-affecting changes are versioned by FN-M03-006.

### FN-M03-003 — QR Administration

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| QRCode | C/R/U | Generates an unguessable identity at first save, stores the installation note, supports several active QR per checkpoint, records reprints, revokes or discards a visit point; the identifier is never reused. | SF-M03-003-01–04, SF-M03-003-07, SF-M03-003-10–14; FR-M03-003, FR-M03-011 |
| Checkpoint | R | Reads the saved mode and the last-active-QR guard before adding or revoking a visit point. | SF-M03-003-07, SF-M03-003-09, SF-M03-003-14; FR-M03-003 |
| Revision | R | Shows whether a visit point is unpublished before offering the printable image. | SF-M03-003-11; FR-M03-003 |
| JourneySnapshot | C | Publishing a changed QR set creates a new immutable snapshot. | SF-M03-003-08; FR-M03-009 |

### FN-M03-004 — Bilingual Content & Media

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| Revision | C/R/U | Edits the visit point's bilingual object name and introduction as its draft revision and publishes it on its own. | SF-M03-004-01, SF-M03-004-04, SF-M03-004-06; FR-M03-004, FR-M03-008 |
| Media | C/R/U | Attaches media within limits, uploads several files, confirms usage rights per file and marks the spoken language of each audio/video file. | SF-M03-004-05–11; FR-M03-004, FR-M03-009, FR-M03-012; BR-M03-E05, BR-M03-E14, BR-M03-E17 |
| QRCode | R/U | Publishing a visit point on its own makes it `HOAT_DONG`. | SF-M03-004-04; FR-M03-004, FR-M03-008 |
| Checkpoint | R | Audio/video are allowed only for `ONLINE_AVAILABLE` checkpoints. | SF-M03-004-05, SF-M03-004-07; FR-M03-004 |

### FN-M03-005 — Publication Review & Self-Publish

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| Revision | C/R/U | Saves the whole form as one draft revision, reads it for the review screen and preview, and publishes it with the reviewed concurrency revision. | SF-M03-005-01–02, SF-M03-005-04, SF-M03-005-06–07, SF-M03-005-10–12; FR-M03-005–008 |
| Route | R/U | Publishes route information, or the first route atomically, and changes route state. | SF-M03-005-04, SF-M03-005-06–07; FR-M03-005, FR-M03-008, FR-M03-009; BR-M03-F11 |
| Checkpoint | R/U | Reads publishable completeness; the form save writes the internal location note. | SF-M03-005-04, SF-M03-005-11; FR-M03-005, FR-M03-007 |
| QRCode | R/U | Reads active visit-point completeness; the form save writes the installation note. | SF-M03-005-04, SF-M03-005-11; FR-M03-005, FR-M03-007 |
| Media | R/U | Reads usage rights and spoken language in the publication guard; the form save writes the per-file rights tick. | SF-M03-005-04, SF-M03-005-11; FR-M03-005, FR-M03-007; BR-M03-E14, BR-M03-E17 |
| JourneySnapshot | C/R | Reads the current version and creates the first snapshot when a route is first published. | SF-M03-005-06–07; FR-M03-008, FR-M03-009 |
| AuditRecord | C | Appends an immutable record for every publication, including failures. | SF-M03-005-08; FR-M03-018 |

### FN-M03-006 — Journey Snapshot

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| Route | R/U | Reads the route list and atomically switches `activeContentVersion` for all affected routes. | SF-M03-006-01–02, SF-M03-006-07; FR-M03-008, FR-M03-009 |
| Checkpoint | R | Reads active checkpoints of the route list, their names and connectivity for the complete snapshot. | SF-M03-006-02, SF-M03-006-05; FR-M03-009 |
| QRCode | R | Reads the active QR arrays embedded in each active checkpoint. | SF-M03-006-03, SF-M03-006-05; FR-M03-009 |
| Revision | R | Reads published bilingual content for per-QR offline resources and the offline route map. | SF-M03-006-04, SF-M03-006-10; FR-M03-009 |
| Media | R | Reads published static images included in offline resources and size estimates. | SF-M03-006-04, SF-M03-006-10–11; FR-M03-009 |
| JourneySnapshot | C/R | Reads the preceding version and creates a complete, consecutive, linked immutable version; retention does not imply deletion. | SF-M03-006-05–09, SF-M03-006-12; FR-M03-009, FR-M03-010 |

### FN-M03-007 — Emergency Operations

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| Route | R/U | Closes a route immediately, auto-closes routes left without active checkpoints, reopens, or closes related routes when a checkpoint closure fails. | SF-M03-007-01, SF-M03-007-04, SF-M03-007-07, SF-M03-007-09; FR-M03-011 |
| Checkpoint | R/U | Closes and reopens a checkpoint through lifecycle transitions. | SF-M03-007-02, SF-M03-007-06–07; FR-M03-005, FR-M03-011 |
| QRCode | R | Requires an active visit point before reopen. | SF-M03-007-06; FR-M03-005, FR-M03-011 |
| Revision | R | Requires bilingual published content before reopen. | SF-M03-007-06; FR-M03-005, FR-M03-011 |
| Media | R | Requires stored images before reopen. | SF-M03-007-06; FR-M03-005, FR-M03-011 |
| JourneySnapshot | C/R | Reads the current journey and publishes closure/reopen snapshots atomically. | SF-M03-007-03, SF-M03-007-07; FR-M03-009, FR-M03-011 |
| AuditRecord | C | Appends closure/reopen and safety-confirmation audit evidence. | SF-M03-007-01, SF-M03-007-05; FR-M03-011 |

### FN-M03-008 — Authentication, Accounts, Authorization & Concurrency

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| AdminAccount | C/R/U | Reads account/role/status for every protected request, creates invitation/bootstrap accounts and updates linkage, role or activation status. | SF-M03-008-02, SF-M03-008-05–10; FR-M03-006, FR-M03-013 |

Concurrency validation (SF-M03-008-11–12) compares the revision carried by the entity being written; it creates no record of its own. The audit append formerly under SF-M03-008-13 belongs to FN-M03-011.

### FN-M03-009 — Live QR & Content Service

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| QRCode | R | Resolves only an active `qrIdentifier`; `NHAP`, `THU_HOI` and unknown are `INVALID`. | SF-M03-009-01, SF-M03-009-04; FR-M03-012 |
| Checkpoint | R | Evaluates checkpoint state and returns its current name and connectivity. | SF-M03-009-02–03, SF-M03-009-06; FR-M03-012 |
| Route | R | Evaluates the route sent with the lookup; route closure takes priority. | SF-M03-009-02, SF-M03-009-06; FR-M03-012 |
| Revision | R | Returns the scanned QR's own published bilingual content. | SF-M03-009-03; FR-M03-012 |
| Media | R | Returns published images and, for `ONLINE_AVAILABLE`, audio/video with `spokenLanguage`. | SF-M03-009-03; FR-M03-012; BR-M03-E17 |

### FN-M03-010 — Session Intake & Reporting

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| SessionRecord | C/R | Reads by `sessionId` for idempotency/conflict checks, creates the first immutable accepted record and reads synchronized records for both reports. | SF-M03-010-01–11, SF-M03-010-14; FR-M03-014–016 |
| Route | R | The route of a received session must be known; any route status is accepted. | SF-M03-010-13; FR-M03-014 |
| JourneySnapshot | R | The version must be published, and each visited checkpoint must be in the snapshot of `(routeId, contentVersion)`. | SF-M03-010-12–13; FR-M03-014 |

### FN-M03-011 — History, Restore & Audit Log

| Entity | CRUD | Evidence | Source |
|---|---|---|---|
| Revision | C/R/U | Shows published history, restores an earlier published version as a new draft, and discards a pending draft (`DA_BO`). | SF-M03-011-01–03; FR-M03-007, FR-M03-018 |
| AuditRecord | C/R | Appends an audit line for every administrative action and shows the system-wide log to Reviewers. | SF-M03-011-04–05; FR-M03-018 |

## 6. Ownership Check

| Entity | Canonical Owner | Creating Functions | Updating Functions | Deleting Functions | External Readers | Result |
|---|---|---|---|---|---|---|
| Route | M03 | FN-M03-001 | FN-M03-001/005/006/007 | — | FN-M01-002/003/004/005/006 | PASS |
| Checkpoint | M03 | FN-M03-002 | FN-M03-002/005/007 | — | FN-M02-004/005/008 | PASS |
| QRCode | M03 | FN-M03-003 | FN-M03-002/003/004/005 | — | FN-M02-004/008 | PASS |
| Media | M03 | FN-M03-001/004 | FN-M03-001/004/005 | — | FN-M01-002; FN-M02-005/008 | PASS |
| JourneySnapshot | M03 | FN-M03-003/005/006/007 | — | — | FN-M01-002/004/005/006 | PASS |
| AdminAccount | M03 | FN-M03-008 | FN-M03-008 | — | — | PASS |
| AuditRecord | M03 | FN-M03-005/007/011 | — | — | — | PASS |
| LanguagePreference | M01 | FN-M01-001 | FN-M01-001 | — | FN-M02-003/004/005 | PASS |
| SelectedRouteContext | M01 | FN-M01-006 | FN-M01-002/006 | — | FN-M02-001 | PASS |
| OfflinePackage | M01 | FN-M01-005 | FN-M01-005 | FN-M01-005 | FN-M02-005 | PASS |
| OfflineResource | M01 | FN-M01-005 | — | FN-M01-005 | FN-M02-005 | PASS |
| PlaySession | M02 | FN-M02-001/002/006 | FN-M02-002/006 | — | — | PASS |
| CheckpointVisit | M02 | FN-M02-002/004 | — | — | — | PASS |
| PendingSyncItem | M02 | FN-M02-007 | FN-M02-007 | — | — | PASS |
| SessionRecord | M03 | FN-M03-010 | — | — | — | PASS |
| Revision | M03 | FN-M03-001/002/004/005/011 | FN-M03-001/002/004/005/011 | — | FN-M01-002/003/005; FN-M02-005/008 | PASS |

No canonical entity is written by more than one module. M01/M02 operations on M03 projections and M02 reads of M01 shared values remain R-only; the M02 QR link page reads LanguagePreference and leaves the write to FN-M01-001 (SF-M01-001-04).

## 7. Anomaly Detection

| Anomaly ID | Type | Function/Entity | Evidence | Severity | Resolution |
|---|---|---|---|---|---|
| ANOM-S2-001 | WRITE-ONLY | AuditRecord | V1: FN-M03-005/007/008 appended AuditRecord, but no FN-level requirement read audit history. | INFO | RESOLVED (V2) — SF-M03-011-05 shows the system-wide audit log to Reviewers, so AuditRecord now has a reader. |

Category scan:

| Type | Count | Result |
|---|---:|---|
| NO-C | 0 | Every canonical entity has at least one source-supported creating function. |
| WRITE-ONLY | 0 | AuditRecord is read by FN-M03-011 (`ANOM-S2-001` resolved). |
| MULTI-OWNER | 0 | No C/U/D crosses the accepted owner boundary. |
| ORPHAN FUNCTION | 0 | Every FN-level function has at least one CRUD interaction. |
| UNUSED ENTITY | 0 | Every canonical entity is touched by at least one function. |
| SUSPICIOUS-D | 0 | The only D operations are confirmed M01 package/resource removal. |
| IMMUTABILITY-CONFLICT | 0 | JourneySnapshot, CheckpointVisit, SessionRecord and AuditRecord have no U/D. |
| OWNERSHIP-VIOLATION | 0 | External consumers are R-only. |

Special-case results:

- JourneySnapshot is created/read only; published versions are never updated or deleted. Retention language does not create D.
- AuditRecord is append-only C with a Reviewer read (FN-M03-011); `AuditRecord.revision` identifies the Revision concerned (S1 HC-006 resolved).
- Revision is C/R/U: a restore creates a new draft (C) and a discard sets `DA_BO` (U); no Revision is deleted.
- Archive, discard and revoke of Route, Checkpoint and QRCode are U; a never-published item that is discarded is not D.
- LanguagePreference supports first C, current-value R and singleton replacement U; no history entity is inferred.
- SelectedRouteContext supports first C, guarded R and atomic replacement/revocation U; no D is inferred.
- OfflinePackage and owned OfflineResource are the only entities with D, based on confirmed visitor deletion/cascade behavior.
- CheckpointVisit is C/R only; repeated scans retain the first timestamp.
- PendingSyncItem is C/R/U exclusively in FN-M02-007; FN-M02-006 (including the 24-hour automatic end) freezes the transport payload but does not durably queue the canonical item.
- SessionRecord is C/R only and immutable after first accepted ingest.
- Media uses `mediaId: UUID`; `sourceRef` is read as a resource reference, not identity.
- AdminAccount remains one C/R/U entity; provider identity is external linkage rather than another column/entity in this matrix.

## 8. Coverage Summary

| Metric | Result |
|---|---:|
| Total FN-level functions | 26 |
| Total canonical entities | 16 |
| Functions with CRUD coverage | 26 / 26 |
| Entities with CRUD coverage | 16 / 16 |
| C operations | 29 |
| R operations | 97 |
| U operations | 27 |
| D operations | 2 |
| Total detected anomalies | 1 (resolved) |
| Blockers | 0 |

Anomalies by type: `WRITE-ONLY = 0` open (`ANOM-S2-001` resolved); all required zero-result categories are recorded in §7.

## 9. S2 Review Gate

- [x] Every FN-level function reviewed
- [x] Every canonical entity reviewed
- [x] Every CRUD cell traceable to source
- [x] No unsupported cross-module writes
- [x] Immutable entities respected
- [x] Delete semantics reviewed
- [x] All anomalies classified
- [x] Ready for S3 Conceptual ERD

**S2 STATUS: PASS — S2 REVIEW (V2) ACCEPTED — READY FOR S3 CONCEPTUAL ERD**

The V2 review (2026-10-28) accepted the mapping decisions: published projections map to their source entities, the `CheckpointContent` column is removed, the whole-form save writes every entity it touches, the 24-hour automatic end does not queue sync, and AuditRecord C is assigned only where a sub-function names it. M03 keeps no hard-delete/purge operation in MVP (SF-M03-006-09), so no further D is assigned.
