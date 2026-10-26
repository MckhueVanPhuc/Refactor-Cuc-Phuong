# Function List M03 — Operations & Content Administration

## 1. Document information

| Field | Value |
|---|---|
| Module | M03 — Operations & Content Administration |
| Source spec | [spec-M03.md](../spec/spec-M03.md), v2.0 |
| Purpose | Functional decomposition for admin UI/API/database/security design |
| Priority rule | Complete functional baseline; delivery priority comes from `MVP-Scope.md` and sub-functions inherit their parent function's priority unless a delivery plan explicitly splits them. |
| Source FR notation | After one full ID, following comma-separated numbers inherit the same `FR-M03-` prefix. |

## 2. Function hierarchy

| Function ID | Function | Outcome |
|---|---|---|
| FN-M03-001 | Route Administration | Route drafts and published metadata follow canonical rules. |
| FN-M03-002 | Checkpoint Administration | Stable ordered checkpoints have explicit lifecycle/connectivity. |
| FN-M03-003 | QR Administration | Multiple active QR identities remain safe and resolvable. |
| FN-M03-004 | Bilingual Content & Media | Approved bilingual content/media is publicly available. |
| FN-M03-005 | Review & Publication | Maker-checker review publishes public state atomically. |
| FN-M03-006 | Journey Snapshot | Every journey-affecting change creates a complete immutable version. |
| FN-M03-007 | Emergency Operations | Close/reopen outcomes are immediate, deterministic and auditable. |
| FN-M03-008 | Authentication, Accounts, Authorization & Concurrency | M03 entry, credential flows, fixed roles and stale-write protection are enforced without public sign-up. |
| FN-M03-009 | Live QR & Content Service | M02 can distinguish valid, invalid and unavailable live content. |
| FN-M03-010 | Session Intake & Reporting | Terminal sessions are immutable/idempotent and reports deterministic. |

## 3. Detailed function list

### FN-M03-001 — Route Administration

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M03-001-01 | Create route draft with stable identity. | Staff create action | `Route NHAP`, unique `routeId` | Identity never changes | FR-M03-001 |
| SF-M03-001-02 | Edit localized route fields. | Draft/revision edit | `name`, `description`, optional `safetyWarning` | Publish requires `vi/en`; warning both-or-none | FR-M03-001, 005 |
| SF-M03-001-03 | Edit positive route measures. | Draft/revision edit | `distanceKm`, `durationMin`, `difficulty` | Difficulty enum only | FR-M03-001 |
| SF-M03-001-04 | Assign recommendation tags. | Draft/revision edit | At least one allowed value/group | Unknown/empty group blocks publication | FR-M03-001, 005 |
| SF-M03-001-05 | Save incomplete draft. | Save action | Updated `NHAP` revision | Concurrency revision required | FR-M03-001, 007 |
| SF-M03-001-06 | Archive route. | Reviewer lifecycle action | `LUU_TRU` terminal | Hidden from new public selection; history retained | FR-M03-001, 011 |

### FN-M03-002 — Checkpoint Administration

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M03-002-01 | Create checkpoint under one route. | Staff create action | `Checkpoint NHAP`, stable ID | Route must exist | FR-M03-002 |
| SF-M03-002-02 | Edit checkpoint name and route sequence. | Draft/revision edit | Updated metadata | `(routeId, sequence)` unique for non-archived points | FR-M03-002 |
| SF-M03-002-03 | Set `OFFLINE_REQUIRED`. | Classification action | Offline classification | No field-connectivity proof needed | FR-M03-002 |
| SF-M03-002-04 | Set `ONLINE_AVAILABLE` after field verification. | Classification action | Online classification + audit evidence | Block without confirmation | FR-M03-002, 005 |
| SF-M03-002-05 | Activate publishable checkpoint. | Approved revision | `HOAT_DONG` | Active QR + bilingual published content required | FR-M03-002, 005 |
| SF-M03-002-06 | Reorder live checkpoint through revision. | Sequence change | New journey version | Never mutate published snapshot | FR-M03-002, 009 |
| SF-M03-002-07 | Archive checkpoint. | Approved removal | `LUU_TRU` terminal | Publishes replacement journey when route remains active | FR-M03-002, 009, 011 |

### FN-M03-003 — QR Administration

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M03-003-01 | Generate globally unique QR identity. | Staff requests QR | Active `qrIdentifier` linked to checkpoint | Collision rejected | FR-M03-003 |
| SF-M03-003-02 | Store installation label. | QR create/edit | Operational placement description | Not visitor content | FR-M03-003 |
| SF-M03-003-03 | Support multiple active QR per checkpoint. | Additional QR request | Expanded active QR set | All resolve to same stable checkpoint | FR-M03-003 |
| SF-M03-003-04 | Reprint QR without identity change. | Physical damage/reprint | Same payload/output asset | No snapshot version change | FR-M03-003 |
| SF-M03-003-05 | Submit identity replacement. | Replacement reason | Revision awaiting Reviewer | Separate from reprint | FR-M03-003, 006 |
| SF-M03-003-06 | Approve replacement atomically. | Reviewer approves | New active QR; old `DA_THAY` | Active checkpoint must retain an active QR | FR-M03-003, 006, 009 |
| SF-M03-003-07 | Withdraw QR. | Authorized action | `THU_HOI` terminal | Block if last active QR of active checkpoint | FR-M03-003 |
| SF-M03-003-08 | Publish changed QR set. | Active QR set changes | New JourneySnapshot | Applies to both connectivity modes | FR-M03-009 |

### FN-M03-004 — Bilingual Content & Media

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M03-004-01 | Create language-specific content draft. | Staff create/edit | `NHAP` revision for `vi` or `en` | One revision stream/checkpoint/language | FR-M03-004 |
| SF-M03-004-02 | Submit content revision. | Staff submit | `CHO_DUYET` | Minimum content validation | FR-M03-004, 005 |
| SF-M03-004-03 | Approve other user's revision. | Reviewer decision | `DA_DUYET` or rejected-to-`NHAP` | Reviewer differs from submitter | FR-M03-004, 006 |
| SF-M03-004-04 | Publish bilingual content. | Both approved branches ready | One current `PHAT_HANH` per language | Previous published revision archived/replaced | FR-M03-004, 008 |
| SF-M03-004-05 | Create/edit media metadata. | Staff action | IMAGE/AUDIO/VIDEO draft | Storage reference and usage rights required | FR-M03-004 |
| SF-M03-004-06 | Publish eligible media. | Approved media | Public media resource | Unpublished/rights-incomplete media excluded | FR-M03-004 |
| SF-M03-004-07 | Package offline images only. | Snapshot build for offline point | Static image descriptors in offline resource | Audio/video excluded | FR-M03-004, 009 |
| SF-M03-004-08 | Serve live media for online/outside journey. | M02 live request | Public images/audio/video | Only published active content | FR-M03-004, 012 |

### FN-M03-005 — Review & Publication

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M03-005-01 | Validate submission minimum. | Submit route revision | `CHO_DUYET` or gap list | Route metadata + at least one checkpoint | FR-M03-005 |
| SF-M03-005-02 | Present revision/diff and submitter identity. | Reviewer opens queue | Reviewable revision | Current public data remains active | FR-M03-005, 006 |
| SF-M03-005-03 | Enforce maker-checker. | Approval action | Allowed/denied decision | Submitter cannot approve own revision | FR-M03-006 |
| SF-M03-005-04 | Validate full publication guard. | Reviewer approval | Pass or complete gap list | Bilingual route, tags, publishable checkpoint(s) | FR-M03-005 |
| SF-M03-005-05 | Reject revision with reason. | Reviewer rejects | Revision returns to `NHAP` | Public state unchanged | FR-M03-005, 006 |
| SF-M03-005-06 | Publish metadata-only revision. | Approved non-journey fields | New public projection | `contentVersion` unchanged | FR-M03-008, 009 |
| SF-M03-005-07 | Publish first route atomically. | First approval + snapshot complete | Snapshot active version + `HOAT_DONG` | Failure keeps `CHO_DUYET` | FR-M03-008 |
| SF-M03-005-08 | Record publication audit. | Publish/reject outcome | Append-only audit record | Include actor/revision/time/result | FR-M03-006, 008 |

### FN-M03-006 — Journey Snapshot

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M03-006-01 | Detect journey-affecting changes. | Approved revision | Snapshot required flag | Membership/status/sequence/name/mode/QR/offline resource | FR-M03-009 |
| SF-M03-006-02 | Collect all active checkpoints. | Snapshot build | Full ordered checkpoint array | Exclude draft/closed/archived points | FR-M03-009 |
| SF-M03-006-03 | Embed active QR arrays. | Checkpoint projection | `qrIdentifiers[]` | At least one per active checkpoint | FR-M03-009 |
| SF-M03-006-04 | Embed conditional offline resources. | Offline-required checkpoint | Bilingual text + static images | No resource for online checkpoint | FR-M03-009 |
| SF-M03-006-05 | Validate candidate snapshot. | Build complete | Valid/failed candidate | Unique IDs/sequence; complete conditional data | FR-M03-009 |
| SF-M03-006-06 | Publish immutable version. | Candidate valid | `DA_CONG_BO`, new `contentVersion` | Never edit published snapshot | FR-M03-009 |
| SF-M03-006-07 | Switch route active version atomically. | Snapshot published | Consumer sees complete old or new version | Failure preserves old active version | FR-M03-008, 009 |
| SF-M03-006-08 | Link previous version. | New snapshot publish | `previousContentVersion` | Same route only | FR-M03-009 |
| SF-M03-006-09 | Retain required versions. | Cleanup evaluation | Current + previous + replaced <30 days | No M01 acknowledgement | FR-M03-010 |

### FN-M03-007 — Emergency Operations

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M03-007-01 | Close route immediately with reason. | Either admin role | Route `TAM_DONG` + audit | No normal review queue | FR-M03-011 |
| SF-M03-007-02 | Close checkpoint immediately. | Either admin role | Checkpoint `TAM_DONG` | No normal review queue | FR-M03-011 |
| SF-M03-007-03 | Publish closure snapshot atomically. | Checkpoint closure | New journey excludes checkpoint | Closure completes with public switch | FR-M03-009, 011 |
| SF-M03-007-04 | Evaluate deterministic route outcome. | Checkpoint removed | Route stays active or auto-closes | Auto-close only when zero active checkpoints | FR-M03-011 |
| SF-M03-007-05 | Capture reopen safety confirmation. | Reviewer action | Confirmation note/audit | Reviewer only | FR-M03-011 |
| SF-M03-007-06 | Revalidate completeness before reopen. | Reopen request | Pass/gap list | QR/content/connectivity required | FR-M03-005, 011 |
| SF-M03-007-07 | Reopen checkpoint/route atomically. | Reopen guard passes | `HOAT_DONG` + replacement snapshot where needed | No partial public state | FR-M03-009, 011 |
| SF-M03-007-08 | Preserve running-session boundary. | Any close/reopen | No message/termination sent to M02 sessions | Physical safety handled outside app | FR-M03-011 |

### FN-M03-008 — Authentication, Accounts, Authorization & Concurrency

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M03-008-01 | Authenticate an administrator through the provider. | Email/password submit from M03 login | Provider session with authenticated `userId`, or login error | No public sign-up; M03 never stores the password | FR-M03-013 |
| SF-M03-008-02 | Authorize fixed application role server-side. | Every protected request | Allowed/denied | Require matching `ACTIVE` `AdminAccount`; only `CONTENT_STAFF`/`REVIEWER` | FR-M03-006, 013 |
| SF-M03-008-03 | Start self-service password recovery. | Email submitted from M03 login | Generic request-accepted response; provider may send recovery email | Do not reveal whether email/account exists; do not create/change `AdminAccount` | FR-M03-013 |
| SF-M03-008-04 | Complete password recovery. | Valid provider recovery callback + new password | Provider credential updated; return to login | Expired/invalid callback rejected; role/status unchanged; reauthorization still required | FR-M03-013 |
| SF-M03-008-05 | Invite administrative account. | Reviewer submits normalized email + fixed role | Provider invitation and linked `INVITATION_PENDING` application account | Reviewer only; email unique; retry same pending request idempotently | FR-M03-013 |
| SF-M03-008-06 | Complete account invitation. | Recipient opens valid provider invitation and sets credential | Matching pending account becomes `ACTIVE`; provider identity ready for M03 login | Expired/invalid invite grants no access; recipient cannot choose/change role | FR-M03-013 |
| SF-M03-008-07 | Provision the initial Reviewer. | Authorized server-side environment operation + normalized email | Exactly one `INVITATION_PENDING` `REVIEWER` account linked to a provider invitation | Empty environment only; unavailable to browser/public API; same pending request is idempotent; activate only after matching provider identity | FR-M03-013 |
| SF-M03-008-08 | Change fixed role. | Reviewer action | Updated account role | Block last-active-Reviewer demotion | FR-M03-013 |
| SF-M03-008-09 | Activate/deactivate account. | Reviewer action | Updated active status | Block last-active-Reviewer deactivation | FR-M03-013 |
| SF-M03-008-10 | Preserve an active Reviewer transactionally. | Role/status mutation | Mutation accepted or blocked | Count active Reviewers in the same transaction; never leave zero | FR-M03-013 |
| SF-M03-008-11 | Validate concurrency revision. | Administrative update | Save or stale conflict | Stored revision must match submitted revision | FR-M03-007 |
| SF-M03-008-12 | Reject stale write. | Revision mismatch | Reload-required response | No auto-merge/overwrite | FR-M03-007 |
| SF-M03-008-13 | Append administrative audit. | Protected mutation or account-provisioning outcome | Immutable audit entry | Actor/action/entity/before/after/time; no credential/token value | FR-M03-006, 007, 013 |

### FN-M03-009 — Live QR & Content Service

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M03-009-01 | Resolve active `qrIdentifier`. | M02 lookup | Stable checkpoint identity | Replaced/withdrawn/unknown is invalid | FR-M03-012 |
| SF-M03-009-02 | Validate public checkpoint/content state. | Resolved QR | Valid live record | Checkpoint active; both languages published | FR-M03-012 |
| SF-M03-009-03 | Return canonical live content. | Valid lookup | Name, mode, localized content, media | Public resources only | FR-M03-012 |
| SF-M03-009-04 | Return invalid/not-found result. | Unknown/inactive QR | Explicit invalid result | Distinguishable from service failure | FR-M03-012 |
| SF-M03-009-05 | Preserve consumer read-only boundary. | M01/M02 public access | Read result | No source mutation permission | FR-M03-006, 012 |

### FN-M03-010 — Session Intake & Reporting

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M03-010-01 | Validate terminal schema/status. | SessionSyncRecord request | Valid/validation error | UUID, terminal status, required fields | FR-M03-014 |
| SF-M03-010-02 | Validate timestamps/visit uniqueness. | Parsed payload | Valid/validation error | `endedAt >= startedAt`; visits within interval; unique checkpoint | FR-M03-014 |
| SF-M03-010-03 | Enforce privacy allowlist. | Parsed payload | Accepted fields only | Reject visitor/device/GPS PII fields | FR-M03-014 |
| SF-M03-010-04 | Insert first session atomically. | New `sessionId` | Immutable header + child visits | No partial insert | FR-M03-014 |
| SF-M03-010-05 | Acknowledge identical retry. | Existing ID + same normalized payload | Success without mutation | Formatting/order ignored | FR-M03-014 |
| SF-M03-010-06 | Reject changed retry. | Existing ID + different business payload | Conflict | Never overwrite terminal record | FR-M03-014 |
| SF-M03-010-07 | Filter report dates. | Report query | Valid `fromDate/toDate` in Asia/Ho_Chi_Minh | Default 30 days; from ≤ to | FR-M03-015, 016 |
| SF-M03-010-08 | Produce RPT-01 totals/rates. | Valid filters | Unique total, completed/abandoned counts/rates | Empty result returns zero values | FR-M03-015 |
| SF-M03-010-09 | Produce RPT-02 unique visits. | Valid filters | Unique sessions per route/checkpoint | Group by stable checkpoint ID | FR-M03-016 |
| SF-M03-010-10 | Select historical display label/order. | Multiple historical labels | Latest-ended record label/sequence in range | Does not change grouping identity | FR-M03-016 |
| SF-M03-010-11 | Show reporting freshness limitation. | Report display | Last successful ingestion time | Unsynchronized sessions excluded; not realtime | FR-M03-015, 016 |

## 4. Coverage summary

| Metric | Value |
|---|---:|
| Functions | 10 |
| Sub-functions | 83 |
| Source FR covered | 16/16 |
| Baseline sub-functions | 83 |

Every sub-function maps to at least one source FR; physical schema, endpoint and security-policy syntax remain design outputs derived from the source spec.
