# Function List M02 — Field Quest Experience

## 1. Document information

| Field | Value |
|---|---|
| Module | M02 — Field Quest Experience |
| Source spec | [spec-M02.md](../spec/spec-M02.md), v3.3 |
| Updated | 2026-10-28 |
| Purpose | Functional decomposition for UI/API/local-storage/database design |
| Priority rule | Complete functional baseline; delivery priority comes from `MVP-Scope.md` and sub-functions inherit their parent function's priority unless `MVP-Scope.md` §3.4 lists them separately. |
| Source FR notation | After one full ID, following comma-separated numbers inherit the same `FR-M02-` prefix. |
| ID rule | Sub-function IDs are never renumbered or reused; new sub-functions are appended at the end of their function. |

## 2. Function hierarchy

| Function ID | Function | Outcome |
|---|---|---|
| FN-M02-001 | Handoff Validation & Session Start | One unused, unexpired v3 handoff creates one active session. |
| FN-M02-002 | Session Lifecycle & Recovery | Active/terminal transitions preserve consistent progress in one browser. |
| FN-M02-003 | Journey Map | Fixed manifest journey is displayed with scanned state. |
| FN-M02-004 | QR Resolution & Check-in | Scans from the in-app scanner or a phone camera link record a visit only when accepted. |
| FN-M02-005 | Content Delivery | The scanned QR's own content, or a closure notice, comes from the correct online/offline source. |
| FN-M02-006 | Completion & Route Replacement | Finish, the end-of-trip prompt, the 24-hour automatic end and abandonment are deterministic. |
| FN-M02-007 | Terminal Sync | Immutable anonymous terminal records are retried safely. |
| FN-M02-008 | Free Visitor Experience | Anyone can view QR content, also from the phone camera, without session/report data. |

## 3. Detailed function list

### FN-M02-001 — Handoff Validation & Session Start

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M02-001-01 | Read current `SelectedRouteContext v3`. | M02 entry/start action | Candidate handoff | Context is read-only | FR-M02-001, 020 |
| SF-M02-001-02 | Validate version/status/expiry/route consistency. | Candidate context | Valid/invalid result | Version 3, `AUTHORIZED`, before `expiresAt`, route equals manifest; version 2 and expired handoffs are rejected with a clear message, never converted | FR-M02-001 |
| SF-M02-001-03 | Reject consumed/revoked handoff. | `handoffId` lookup | Request new Start from M01 | `sourceHandoffId` unique | FR-M02-001, 003 |
| SF-M02-001-04 | Enforce one active session per browser. | Valid handoff | Existing/new-session path | No second `DANG_DIEN_RA` without replacement flow | FR-M02-002 |
| SF-M02-001-05 | Generate session identity. | New session accepted | UUID `sessionId` | Globally unique | FR-M02-003 |
| SF-M02-001-06 | Copy/freeze journey manifest. | Valid handoff | Session-owned journey checkpoints | Never reconstruct from M03 | FR-M02-004 |
| SF-M02-001-07 | Show the session start hint. | Session created or restored | One line asking to scan with the in-app Scan button during the trip | Fixed message of spec §5.1 | FR-M02-025 |

### FN-M02-002 — Session Lifecycle & Recovery

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M02-002-01 | Persist active session before interaction. | Session creation | Durable `DANG_DIEN_RA` session | No partial active session | FR-M02-001, 005 |
| SF-M02-002-02 | Persist each accepted visit immediately. | Accepted check-in | Durable visit/progress | Recorded before the content is shown | FR-M02-005, 007 |
| SF-M02-002-03 | Restore active session after reload. | App reopen | Same session/journey/visits | Do not create new session; handoff expiry never ends it | FR-M02-005 |
| SF-M02-002-04 | Preserve progress across connectivity changes. | Online/offline transition | No visit rollback | Local persistence independent of network | FR-M02-005 |
| SF-M02-002-05 | Freeze terminal session. | `HOAN_TAT` or `BO_DO` | Immutable session/visits/sync payload | No return to active state | FR-M02-018 |

### FN-M02-003 — Journey Map

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M02-003-01 | Sort copied checkpoints by `sequence`. | Session creation/restore | Ordered journey with continuous display numbers | `sequence` may have gaps | FR-M02-004 |
| SF-M02-003-02 | Display checkpoint name and mode. | Journey screen | Fixed route map/timeline in the chosen language | No live journey reconstruction | FR-M02-004, 014 |
| SF-M02-003-03 | Mark scanned checkpoints. | Visit saved | Updated visual progress | Worded as a scanned QR, never as arrival | FR-M02-008 |
| SF-M02-003-04 | Identify final checkpoint. | Frozen journey | Highest-sequence checkpoint | One linear final point | FR-M02-015 |
| SF-M02-003-05 | Show visit coverage separately from completion. | Journey/summary | Scanned count/total | Completion may be true below 100% | FR-M02-016 |

### FN-M02-004 — QR Resolution & Check-in

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M02-004-01 | Capture/decode QR in the in-app scanner and take `qrIdentifier` from the public QR link. | Camera scan | `qrIdentifier` | Camera/permission failure surfaced; content that is not a link of the current `QR_PUBLIC_BASE_URL` shows the invalid-QR message without a lookup | FR-M02-006, 026 |
| SF-M02-004-02 | Look up the scanned QR online. | Online scan | Outcome and content | Send `routeId` when a session exists; no answer within `LOOKUP_TIMEOUT_SECONDS` counts as lookup failure | FR-M02-006, 011 |
| SF-M02-004-03 | Record the visit of an accepted scan. | Online `VALID` with a journey checkpoint, or offline/lookup failure with a QR of the frozen journey | New `CheckpointVisit` before the content is shown | Unique `(sessionId, checkpointId)` | FR-M02-007 |
| SF-M02-004-04 | Handle repeated scan. | Existing visit | Original `checkedInAt`; no new row; content of the scanned QR | QR identity may differ but checkpoint same | FR-M02-009 |
| SF-M02-004-05 | Accept out-of-order visit. | Any unvisited journey checkpoint | Visit recorded | No warning/block for sequence order | FR-M02-008 |
| SF-M02-004-06 | Handle a QR outside the journey. | Lookup checkpoint not in the frozen journey | Content-only result | Never create visit/change context | FR-M02-012 |
| SF-M02-004-07 | Distinguish `INVALID` and `TEMPORARILY_CLOSED`. | Lookup outcome | Invalid-QR message or closure notice | No visit is recorded for either | FR-M02-013, 021 |
| SF-M02-004-08 | Distinguish source/connectivity failure. | Lookup/content request fails or times out | Retry/connectivity message; frozen-journey path for a journey QR | Do not label QR invalid | FR-M02-013 |
| SF-M02-004-09 | Resolve a code added after the session started. | Online `VALID` whose `checkpointId` belongs to the frozen journey | Visit of that checkpoint | Frozen journey never changes; offline such a code needs a connection | FR-M02-022 |
| SF-M02-004-10 | Serve the QR link page `/q/{qrIdentifier}`. | Phone camera opens the link | Auto-end check, then in-app-scan handling when a session exists in the same browser, otherwise free-visitor mode | Never creates a session or asks for route/language first | FR-M02-025 |
| SF-M02-004-11 | Apply language on the QR link page. | Link page opened | Stored preference, otherwise device language; VI/EN switch | The switch is the M01 language control | FR-M02-014, 025 |
| SF-M02-004-12 | Handle the QR link page without network. | Offline link open | Behaves like an offline in-app scan when this browser opened the app before | Otherwise the browser shows its own offline page | FR-M02-025 |

### FN-M02-005 — Content Delivery

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M02-005-01 | Select the content source. | Scan result | Online: lookup content when `VALID`; offline or lookup failure: package | For both connectivity modes | FR-M02-010, 011 |
| SF-M02-005-02 | Read offline resource by `qrIdentifier`. | Offline/lookup failure + `OFFLINE_REQUIRED` | Object name, introduction, static images | Package must be `SAN_SANG` | FR-M02-010 |
| SF-M02-005-03 | Use a matching resource from an older package. | Package version differs | Outdated content + warning | Missing resource: online asks M03 for that QR only; offline shows "no offline content" | FR-M02-010 |
| SF-M02-005-04 | Show live content of the scanned QR. | Online `VALID` | Checkpoint name, object name, introduction, images, media | Never content shared by the checkpoint | FR-M02-011 |
| SF-M02-005-05 | Play audio/video on explicit action. | Visitor presses media control | Playback request | Controls only for the listed files (SF-M02-005-09); never autoplay | FR-M02-011 |
| SF-M02-005-06 | Apply current language branch. | Content render | `vi` or `en` text content | Images are the same in both languages | FR-M02-014 |
| SF-M02-005-07 | Show unavailable content state. | Resource/source missing | Message; recorded visit kept | Never rollback visit | FR-M02-007, 010, 011 |
| SF-M02-005-08 | Show the closure notice. | Online `TEMPORARILY_CLOSED` | Fixed notice, no content | Same notice for route and checkpoint scope; no visit | FR-M02-021 |
| SF-M02-005-09 | List only the audio/video of the current language. | Content shown or VI/EN switched | Files whose `spokenLanguage` equals the current language, plus `NONE` files, in the order received | Switching language changes the list at once and stops a file that is no longer listed; no control when nothing matches | FR-M02-011, 014 |

### FN-M02-006 — Completion & Route Replacement

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M02-006-01 | Enable Finish after final checkpoint visit. | Final checkpoint saved | Finish available | Earlier checkpoints may be unvisited | FR-M02-015 |
| SF-M02-006-02 | Confirm completion. | Visitor presses/confirms Finish | `HOAN_TAT`, `endedAt` | No automatic completion outside SF-M02-006-07 | FR-M02-016 |
| SF-M02-006-03 | Validate replacement handoff. | New context while active | Candidate replacement session | Failure leaves old session active | FR-M02-017 |
| SF-M02-006-04 | Atomically replace active session. | Replacement valid | New active session + old `BO_DO` | Preserve old visits and set `endedAt` | FR-M02-017 |
| SF-M02-006-05 | Create terminal payload immediately. | Completion/abandonment commit | Frozen sync record | One payload per session | FR-M02-018 |
| SF-M02-006-06 | Ask to end the trip at the final checkpoint. | Final checkpoint's visit first recorded | "Bạn đã quét điểm cuối. Kết thúc chuyến đi?" with [Kết thúc] / [Đi tiếp] | Shown once; [Đi tiếp] keeps Finish available | FR-M02-023 |
| SF-M02-006-07 | End a forgotten session automatically. | App opened/resumed more than 24 hours after `startedAt` | `HOAN_TAT` if the final checkpoint was visited, otherwise `BO_DO`; `endedAt` = latest `checkedInAt` or `startedAt`; record queued; notice shown | Runs before any handoff is processed | FR-M02-024 |

### FN-M02-007 — Terminal Sync

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M02-007-01 | Build anonymous payload. | Terminal session | Contract fields incl. historical Vietnamese label and sequence | Exclude identity/device/GPS | FR-M02-018 |
| SF-M02-007-02 | Queue payload durably. | Terminal commit | Pending sync item | Works offline | FR-M02-018 |
| SF-M02-007-03 | Send when source available. | Pending queue + connectivity | M03 request | Terminal statuses only | FR-M02-018 |
| SF-M02-007-04 | Handle success/idempotent retry. | M03 acknowledgement | Mark synced | Identical business payload only | FR-M02-018 |
| SF-M02-007-05 | Handle network/server failure. | No success acknowledgement | Keep pending and retry later | Do not mutate payload | FR-M02-018 |
| SF-M02-007-06 | Handle conflict or invalid-record rejection. | Same ID/different payload, or M03 rejects the record as invalid | Stop automatic retry; surface error | Data-quality issue, not transient failure | FR-M02-018 |

### FN-M02-008 — Free Visitor Experience

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M02-008-01 | Enter scanning without an M01 handoff. | In-app scanner without session, or QR link opened from the phone camera | Free-visitor mode | No PlaySession creation | FR-M02-019, 025 |
| SF-M02-008-02 | Resolve valid QR through M03. | Scan | Live content | No `routeId` sent; requires source connectivity | FR-M02-012, 019 |
| SF-M02-008-03 | Render content with the free-visitor hint. | Valid live response | Information-only view, hint and link to the route catalog | No visit/session/sync | FR-M02-019 |
| SF-M02-008-04 | Handle invalid/closed/network results distinctly. | Lookup result | Invalid-QR message, closure notice or connection-needed message | Same distinction as for a session | FR-M02-013, 019 |

## 4. Coverage summary

| Metric | Value |
|---|---:|
| Functions | 8 |
| Sub-functions | 55 |
| Source FR covered | 26/26 |

Every sub-function maps to a source FR; contract field definitions and lifecycle invariants remain authoritative in the source spec.
