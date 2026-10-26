# Function List M02 — Field Quest Experience

## 1. Document information

| Field | Value |
|---|---|
| Module | M02 — Field Quest Experience |
| Source spec | [spec-M02.md](../spec/spec-M02.md), v2.0 |
| Purpose | Functional decomposition for UI/API/local-storage/database design |
| Priority rule | Complete functional baseline; delivery priority comes from `MVP-Scope.md` and sub-functions inherit their parent function's priority unless a delivery plan explicitly splits them. |
| Source FR notation | After one full ID, following comma-separated numbers inherit the same `FR-M02-` prefix. |

## 2. Function hierarchy

| Function ID | Function | Outcome |
|---|---|---|
| FN-M02-001 | Handoff Validation & Session Start | One unused handoff creates one active session. |
| FN-M02-002 | Session Lifecycle & Recovery | Active/terminal transitions preserve consistent progress. |
| FN-M02-003 | Journey Map | Fixed manifest journey is displayed with visit state. |
| FN-M02-004 | QR Resolution & Check-in | Valid journey checkpoints create idempotent visits. |
| FN-M02-005 | Content Delivery | Correct offline/live content source is selected. |
| FN-M02-006 | Completion & Route Replacement | Finish and abandonment semantics are deterministic. |
| FN-M02-007 | Terminal Sync | Immutable anonymous terminal records are retried safely. |
| FN-M02-008 | Free Visitor Experience | QR content is available without session/report data. |

## 3. Detailed function list

### FN-M02-001 — Handoff Validation & Session Start

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M02-001-01 | Read current `SelectedRouteContext v2`. | M02 entry/start action | Candidate handoff | Context is read-only | FR-M02-001, FR-M02-020 |
| SF-M02-001-02 | Validate version/status/route consistency. | Candidate context | Valid/invalid result | Version 2, `AUTHORIZED`, route equals manifest | FR-M02-001 |
| SF-M02-001-03 | Reject consumed/revoked handoff. | `handoffId` lookup | Request new Start from M01 | `sourceHandoffId` unique | FR-M02-001, 003 |
| SF-M02-001-04 | Enforce one active session. | Valid handoff | Existing/new-session path | No second `DANG_DIEN_RA` without replacement flow | FR-M02-002 |
| SF-M02-001-05 | Generate session identity. | New session accepted | UUID `sessionId` | Globally unique | FR-M02-003 |
| SF-M02-001-06 | Copy/freeze journey manifest. | Valid handoff | Session-owned journey checkpoints | Never reconstruct from M03 | FR-M02-004 |

### FN-M02-002 — Session Lifecycle & Recovery

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M02-002-01 | Persist active session before interaction. | Session creation | Durable `DANG_DIEN_RA` session | No partial active session | FR-M02-001, 005 |
| SF-M02-002-02 | Persist each visit immediately. | Valid first check-in | Durable visit/progress | Content request runs after commit | FR-M02-005, 007 |
| SF-M02-002-03 | Restore active session after reload. | App reopen | Same session/journey/visits | Do not create new session | FR-M02-005 |
| SF-M02-002-04 | Preserve progress across connectivity changes. | Online/offline transition | No visit rollback | Local persistence independent of network | FR-M02-005 |
| SF-M02-002-05 | Freeze terminal session. | `HOAN_TAT` or `BO_DO` | Immutable session/visits/sync payload | No return to active state | FR-M02-018 |

### FN-M02-003 — Journey Map

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M02-003-01 | Sort copied checkpoints by `sequence`. | Session creation/restore | Ordered journey | Sequence unique within manifest | FR-M02-004 |
| SF-M02-003-02 | Display checkpoint identity/name/mode. | Journey screen | Fixed route map/timeline | No live journey reconstruction | FR-M02-004 |
| SF-M02-003-03 | Mark visited checkpoints. | Visit saved | Updated visual progress | Based on `(sessionId, checkpointId)` | FR-M02-008 |
| SF-M02-003-04 | Identify final checkpoint. | Frozen journey | Highest-sequence checkpoint | One linear final point | FR-M02-015 |
| SF-M02-003-05 | Show visit coverage separately from completion. | Journey/summary | Visited count/total | Completion may be true below 100% | FR-M02-016 |

### FN-M02-004 — QR Resolution & Check-in

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M02-004-01 | Capture/decode QR payload. | Camera scan | `qrIdentifier` | Camera/permission failure surfaced | FR-M02-006 |
| SF-M02-004-02 | Resolve QR against journey arrays first. | `qrIdentifier` + frozen journey | `checkpointId` or outside-journey path | Active manifest arrays are authoritative for session | FR-M02-006 |
| SF-M02-004-03 | Insert first journey visit. | Resolved member checkpoint | New `CheckpointVisit` | Unique `(sessionId, checkpointId)` | FR-M02-007 |
| SF-M02-004-04 | Handle repeated scan. | Existing visit | Original `checkedInAt`; no new row | QR identity may differ but checkpoint same | FR-M02-009 |
| SF-M02-004-05 | Accept out-of-order visit. | Any unvisited member checkpoint | Visit recorded | No warning/block for sequence order | FR-M02-008 |
| SF-M02-004-06 | Route valid outside-journey QR to live lookup. | QR not in frozen journey | Content-only result | Never create visit/change context | FR-M02-012 |
| SF-M02-004-07 | Distinguish invalid/withdrawn QR. | M03 confirms no active QR | Invalid QR message | Network failure is a different state | FR-M02-013 |
| SF-M02-004-08 | Distinguish source/connectivity failure. | Lookup/content request fails | Retry/connectivity message | Do not label QR invalid | FR-M02-013 |

### FN-M02-005 — Content Delivery

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M02-005-01 | Select source by frozen `connectivityMode`. | Journey check-in | Offline/live branch | M02 does not change classification | FR-M02-010, 011 |
| SF-M02-005-02 | Read offline resource by stable checkpoint ID. | `OFFLINE_REQUIRED` | Text + static images | Package must be `SAN_SANG` | FR-M02-010 |
| SF-M02-005-03 | Use matching resource from older package. | Package version differs | Outdated content + warning | Missing checkpoint resource shows unavailable | FR-M02-010 |
| SF-M02-005-04 | Read live station content. | `ONLINE_AVAILABLE` | Current text/images/media | Source failure leaves visit intact | FR-M02-011 |
| SF-M02-005-05 | Play audio/video on explicit action. | Visitor presses media control | Playback request | Never autoplay | FR-M02-011 |
| SF-M02-005-06 | Apply current language branch. | Content render | `vi` or `en` content | No fallback to other language | FR-M02-014 |
| SF-M02-005-07 | Show unavailable content state. | Resource/source missing | Message; check-in preserved | Never rollback visit | FR-M02-007, 010, 011 |

### FN-M02-006 — Completion & Route Replacement

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M02-006-01 | Enable Finish after final checkpoint visit. | Final checkpoint saved | Finish available | Earlier checkpoints may be unvisited | FR-M02-015 |
| SF-M02-006-02 | Confirm completion. | Visitor presses/confirms Finish | `HOAN_TAT`, `endedAt` | No automatic completion | FR-M02-016 |
| SF-M02-006-03 | Validate replacement handoff. | New context while active | Candidate replacement session | Failure leaves old session active | FR-M02-017 |
| SF-M02-006-04 | Atomically replace active session. | Replacement valid | New active session + old `BO_DO` | Preserve old visits and set `endedAt` | FR-M02-017 |
| SF-M02-006-05 | Create terminal payload immediately. | Completion/abandonment commit | Frozen sync record | One payload per session | FR-M02-018 |

### FN-M02-007 — Terminal Sync

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M02-007-01 | Build anonymous payload. | Terminal session | Contract fields incl. historical label/sequence | Exclude identity/device/GPS | FR-M02-018 |
| SF-M02-007-02 | Queue payload durably. | Terminal commit | Pending sync item | Works offline | FR-M02-018 |
| SF-M02-007-03 | Send when source available. | Pending queue + connectivity | M03 request | Terminal statuses only | FR-M02-018 |
| SF-M02-007-04 | Handle success/idempotent retry. | M03 acknowledgement | Mark synced | Identical business payload only | FR-M02-018 |
| SF-M02-007-05 | Handle network/server failure. | No success acknowledgement | Keep pending and retry later | Do not mutate payload | FR-M02-018 |
| SF-M02-007-06 | Handle conflict. | Same ID/different payload response | Stop automatic retry; surface error | Data-quality issue, not transient failure | FR-M02-018 |

### FN-M02-008 — Free Visitor Experience

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M02-008-01 | Enter scan without M01 handoff. | Free visitor entry | QR scanner | No PlaySession creation | FR-M02-019 |
| SF-M02-008-02 | Resolve valid QR through M03. | Scan | Live content | Requires source connectivity | FR-M02-012, 019 |
| SF-M02-008-03 | Render content without progress controls. | Valid live response | Information-only view | No visit/session/sync | FR-M02-019 |
| SF-M02-008-04 | Handle invalid/network errors distinctly. | Lookup result | Correct error state | Same distinction as web-app outside journey | FR-M02-013, 019 |

## 4. Coverage summary

| Metric | Value |
|---|---:|
| Functions | 8 |
| Sub-functions | 46 |
| Source FR covered | 20/20 |
| Baseline sub-functions | 46 |

Every sub-function maps to a source FR; contract field definitions and lifecycle invariants remain authoritative in the source spec.
