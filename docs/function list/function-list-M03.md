# Function List M03 — Operations & Content Administration

## 1. Document information

| Field | Value |
|---|---|
| Module | M03 — Operations & Content Administration |
| Source spec | [spec-M03.md](../spec/spec-M03.md), v3.7 |
| Updated | 2026-10-28 |
| Purpose | Functional decomposition for admin UI/API/database/security design |
| Priority rule | Complete functional baseline; delivery priority comes from `MVP-Scope.md` and sub-functions inherit their parent function's priority unless `MVP-Scope.md` §3.4 lists them separately. |
| Source FR notation | After one full ID, following comma-separated numbers inherit the same `FR-M03-` prefix. Business rules are cited as `BR-M03-<group><number>`. |
| ID rule | Sub-function IDs are never renumbered or reused; sub-functions that no longer exist in the spec were removed and their IDs stay unused; new sub-functions are appended at the end of their function. |

## 2. Function hierarchy

| Function ID | Function | Outcome |
|---|---|---|
| FN-M03-001 | Route Administration | Route drafts carry complete bilingual information, images, tags and an ordered list of published checkpoints. |
| FN-M03-002 | Checkpoint Administration | A shared checkpoint library with explicit connectivity, independent of routes. |
| FN-M03-003 | QR Administration | Visit points with unguessable QR codes, a permanent public link and printable images, reprinted or revoked safely. |
| FN-M03-004 | Bilingual Content & Media | Each visit point carries its own bilingual content and media with confirmed usage rights. |
| FN-M03-005 | Publication Review & Self-Publish | Two-level validation, one save unit and a mandatory review screen before self-publishing, in plain Vietnamese. |
| FN-M03-006 | Journey Snapshot | Every journey-affecting change creates consecutive immutable versions for all affected routes together. |
| FN-M03-007 | Emergency Operations | Close/reopen/archive outcomes are immediate, deterministic and auditable for every affected route. |
| FN-M03-008 | Authentication, Accounts, Authorization & Concurrency | M03 entry, credential flows, fixed roles and stale-write protection are enforced without public sign-up. |
| FN-M03-009 | Live QR & Content Service | M02 receives `VALID`, `TEMPORARILY_CLOSED` or `INVALID` with the scanned QR's own content. |
| FN-M03-010 | Session Intake & Reporting | Terminal sessions are validated against their snapshot, stored immutably and reported with plain notes. |
| FN-M03-011 | History, Restore & Audit Log | Published history, restore, draft discard and an append-only audit trail with a Reviewer system-wide log. |

## 3. Detailed function list

### FN-M03-001 — Route Administration

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M03-001-01 | Create route draft with a system-generated identity. | Staff create action | `Route NHAP`, new `routeId` | No screen accepts an identifier; identity never changes | FR-M03-001 |
| SF-M03-001-02 | Edit localized route card and detail texts. | Draft edit | Name, short description, description, starting point, optional both-or-none texts, highlights | Limits checked at save; missing content only blocks publication | FR-M03-001, 005 |
| SF-M03-001-03 | Edit route measures and difficulty. | Draft edit | `distanceKm`, `durationMin`, `difficulty`; time tag derived from duration | Non-positive values, a distance above 100 km or with more than one decimal place, and a duration above 1440 minutes block save; staff cannot select the time tag | FR-M03-001 |
| SF-M03-001-04 | Assign group and experience tags. | Draft edit | At least one value per group for publication | Values within a group are distinct; contradictory combination with `KHO` blocked at save | FR-M03-001, 005 |
| SF-M03-001-05 | Save draft. | "Lưu bản nháp" | Updated draft revision | One atomic save for the whole editor; stale write rejected | FR-M03-001, 007 |
| SF-M03-001-06 | Archive route. | Reviewer lifecycle action | `LUU_TRU` terminal | Only while `TAM_DONG`; checkpoints untouched; history retained | FR-M03-011 |
| SF-M03-001-07 | Manage route images. | Upload/edit | Thumbnail, gallery 0–8 with captions, route map 0–1 with caption | 2 MB per image; several files per selection; usage rights per file | FR-M03-001, 004 |
| SF-M03-001-08 | Mark the route map as needed offline. | Tick on the route map | `offlineRouteMapRequired` | Only while a route map exists; cleared with a message when the map is removed | FR-M03-001, 009 |
| SF-M03-001-09 | Choose published checkpoints and order them. | Step 4 of the editor | Ordered `checkpointList`; position is `sequence` | Only `HOAT_DONG` checkpoints can be added; a checkpoint appears at most once; at most 30 items, closed checkpoints included (removal is always allowed) | FR-M03-001 |
| SF-M03-001-10 | Discard a never-published route. | Discard with reason | `NHAP → LUU_TRU` | Either role; checkpoints untouched | FR-M03-001, 011 |
| SF-M03-001-11 | Confirm that the route has no safety warning. | Review screen with empty safety warning | `noSafetyWarningConfirmed` | Publication blocked until ticked; reset when a warning is entered | FR-M03-005 |

### FN-M03-002 — Checkpoint Administration

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M03-002-01 | Create a checkpoint in the shared library. | Staff create action | `Checkpoint NHAP`, system-generated `checkpointId` | Belongs to no route | FR-M03-002 |
| SF-M03-002-02 | Edit the bilingual checkpoint name. | Draft edit | Updated name revision | Vietnamese name unique among non-archived checkpoints, compared with both the draft and the published names of the others | FR-M03-002 |
| SF-M03-002-03 | Set `OFFLINE_REQUIRED`. | Classification action | Offline classification | No confirmation needed; visit points take text and images only | FR-M03-002 |
| SF-M03-002-04 | Set `ONLINE_AVAILABLE` after field verification. | Classification action with tick | Online classification + who/when recorded | Blocked without the tick; changing away clears it | FR-M03-002, 005 |
| SF-M03-002-05 | Publish a checkpoint for the first time with its ready visit points. | Review screen confirmation | Checkpoint and ready visit points `HOAT_DONG` | At least one ready visit point; no journey version created | FR-M03-002, 008 |
| SF-M03-002-07 | Archive checkpoint. | Reviewer action | `LUU_TRU` terminal; visit points `THU_HOI` | Only while closed and listed by no non-archived route | FR-M03-002, 011 |
| SF-M03-002-08 | Block switching to offline while audio/video exist. | Mode change to `OFFLINE_REQUIRED` | Save blocked with the files to remove | Other direction always allowed | FR-M03-002, 004 |
| SF-M03-002-09 | Save the internal location note. | Checkpoint form save | Updated note | Saved with the form; no publication; never public | FR-M03-002 |
| SF-M03-002-10 | Discard a never-published checkpoint. | Discard with reason | `NHAP → LUU_TRU`; draft visit points `THU_HOI` | Either role | FR-M03-002 |
| SF-M03-002-11 | Show checkpoint usage and readiness. | Library list | Status, mode, number of visit points, routes using it, "Sẵn sàng"/"Chưa đủ" | Display names only | FR-M03-002 |

### FN-M03-003 — QR Administration

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M03-003-01 | Generate an unguessable QR identity. | First save of a new visit point form | `QRCode NHAP` with `qrIdentifier` | At least 16 random URL-safe characters; collision silently regenerated | FR-M03-003 |
| SF-M03-003-02 | Store the installation note. | Visit point form save | Internal placement note | Not visitor content | FR-M03-003 |
| SF-M03-003-03 | Support multiple active QR per checkpoint. | Additional visit point | Expanded active QR set | Each QR has its own content; at most 20 QR objects that are not `THU_HOI` per checkpoint | FR-M03-003 |
| SF-M03-003-04 | Reprint QR without identity change. | Damaged/faded code | Same link and content | Audit only; no snapshot version change | FR-M03-003 |
| SF-M03-003-07 | Revoke QR. | Either role with reason | `THU_HOI` terminal; new versions for listing routes | Blocked for the last active QR of an active checkpoint | FR-M03-003, 011 |
| SF-M03-003-08 | Publish changed QR set. | Active QR set changes | New JourneySnapshot for every listing route | Applies to both connectivity modes | FR-M03-009 |
| SF-M03-003-09 | Add a visit point only to a checkpoint with a saved mode. | "Thêm điểm tham quan" | Empty form; record created at first save | Before a mode is saved the action shows the mode-required message | FR-M03-003 |
| SF-M03-003-10 | Encode the permanent public QR link. | Printable image generation | `{QR_PUBLIC_BASE_URL}/q/{qrIdentifier}` | No other parameter; Production base is permanent; non-Production codes never installed | FR-M03-003 |
| SF-M03-003-11 | Offer the printable code image. | Download request | SVG and PNG with fixed print settings, last six characters, offline warning line, test-environment mark | Unpublished visit point shows the unpublished warning | FR-M03-003 |
| SF-M03-003-12 | Identify visit points in lists and editors. | List/editor display | Name or "chưa đặt tên {số}", status, readiness, "Mã …{6 ký tự}", creation feedback | Only the last six characters of a code are shown | FR-M03-003 |
| SF-M03-003-13 | Discard a never-published visit point. | Discard action | `NHAP → THU_HOI` | Reason optional; identifier never reused | FR-M03-003 |
| SF-M03-003-14 | Remind to reprint after a mode change. | Review of a checkpoint mode change | Reprint reminder | Printed warning line depends on the mode | FR-M03-003 |

### FN-M03-004 — Bilingual Content & Media

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M03-004-01 | Edit a visit point's object name and introduction in both languages. | Draft edit | Draft revision of the QR object | Introduction 30–2000 characters per language; name at most 100 | FR-M03-004 |
| SF-M03-004-04 | Publish a visit point on its own. | Review screen confirmation | `PHAT_HANH` revision; previous one becomes history | No batch publication; replacement versions per BR rules | FR-M03-004, 008 |
| SF-M03-004-05 | Attach media to a visit point. | Upload | IMAGE/AUDIO/VIDEO media owned by the checkpoint | Size/count/type limits; audio/video only for `ONLINE_AVAILABLE`, each with a spoken language (SF-M03-004-11) | FR-M03-004 |
| SF-M03-004-06 | Expose only eligible media. | Publication | Public media resources | Only media referenced by a published revision with usage rights | FR-M03-004 |
| SF-M03-004-07 | Package offline images only. | Snapshot build for an offline checkpoint | Static images per QR in the offline resource | Audio/video excluded | FR-M03-004, 009 |
| SF-M03-004-08 | Serve live media. | M02 live request | Public images/audio/video of the scanned QR | Only published active content | FR-M03-004, 012 |
| SF-M03-004-09 | Upload several files in one selection. | Multi-file selection | Per-file state "Đang tải / Đã tải / Không tải được" and a summary | A failed file never removes uploaded ones; files join the draft only on save | FR-M03-004 |
| SF-M03-004-10 | Confirm usage rights file by file. | Tick per file | `usageRightsConfirmed` with who/when | No single tick for several files | FR-M03-004 |
| SF-M03-004-11 | Mark the spoken language of each audio/video file. | Upload or edit of an audio/video file | `spokenLanguage` = Tiếng Việt / Tiếng Anh / Không lời | Required before publication (MSG-AV-LANGUAGE-MISSING); review warns, without blocking, when audio/video exists in only one language (MSG-AV-ONE-LANGUAGE) | FR-M03-004 |

### FN-M03-005 — Publication Review & Self-Publish

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M03-005-01 | Validate at save time. | Save | Saved draft or field messages | Only plainly invalid values block saving | FR-M03-005 |
| SF-M03-005-02 | Present the mandatory review screen. | "Xuất bản" | Changes, impact, affected routes, left-out items, estimated size, highlighted sensitive changes | Closing/reopening use dialogs instead | FR-M03-006 |
| SF-M03-005-04 | Validate the full publication guard. | Review screen | Pass or complete gap list | Nothing is published while a gap remains | FR-M03-005 |
| SF-M03-005-06 | Publish route information without a new version. | Confirmation of a route information change | New public projection | `contentVersion` unchanged unless list, order or offline map changed | FR-M03-008, 009 |
| SF-M03-005-07 | Publish the first route atomically. | First publication | Journey version 1 + `HOAT_DONG` | Never publishes a checkpoint; failure leaves public data unchanged | FR-M03-008 |
| SF-M03-005-08 | Record publication audit. | Publication outcome | Audit line with self-published flag | Failures audited too | FR-M03-018 |
| SF-M03-005-09 | Keep the "missing for publication" panel visible. | Editing | Gap list linked to fields | Each line jumps to the field | FR-M03-005 |
| SF-M03-005-10 | Confirm once with the reviewed concurrency revision. | Confirmation | Publication or stale rejection | Stale confirmation reopens the review | FR-M03-006, 007 |
| SF-M03-005-11 | Save the whole form as one unit. | "Lưu bản nháp" | All texts, ordered media with rights ticks and internal note saved atomically | No per-language save; no autosave; unsaved-changes dialog on leave | FR-M03-007 |
| SF-M03-005-12 | Preview a visit point as visitors see it. | "Xem trước như du khách" | Draft rendering with VI/EN switch and preview label; audio/video of the chosen language plus files without speech | Writes nothing; never shown to visitors | FR-M03-006 |
| SF-M03-005-13 | Show staff only plain Vietnamese. | Any administrative screen | Display names, catalog messages, allowed hints | No raw data, code names or technical terms | FR-M03-019 |
| SF-M03-005-14 | Serialize operations on a connected set. | Concurrent publication/closure/reopen | One operation at a time | Second operation rejected with the busy message, not queued; a route's checkpoints are those in its published and pending-draft lists | FR-M03-007 |

### FN-M03-006 — Journey Snapshot

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M03-006-01 | Detect journey-affecting changes. | Publication or operation | Snapshot required per route | List/order, closure/reopen, name/mode, visit point joins/revoked, offline content, offline map | FR-M03-009 |
| SF-M03-006-02 | Collect active checkpoints of the route list. | Snapshot build | Ordered checkpoint array; `sequence` = list position | Closed/draft/archived excluded; gaps allowed | FR-M03-009 |
| SF-M03-006-03 | Embed active QR arrays. | Checkpoint projection | `qrIdentifiers[]` | At least one per active checkpoint | FR-M03-009 |
| SF-M03-006-04 | Embed per-QR offline resources. | `OFFLINE_REQUIRED` checkpoint | Object name, introduction and images for every QR | None for `ONLINE_AVAILABLE` | FR-M03-009 |
| SF-M03-006-05 | Validate candidate snapshot. | Build complete | Valid/failed candidate | Unique IDs/sequences; complete conditional data | FR-M03-009 |
| SF-M03-006-06 | Publish immutable consecutive version. | Candidate valid | `DA_CONG_BO`, `contentVersion` +1 | Number allocated inside the atomic switch | FR-M03-009 |
| SF-M03-006-07 | Switch all affected routes atomically. | Snapshots published | Consumers see complete old or new versions | Any failure keeps every route unchanged | FR-M03-008, 009 |
| SF-M03-006-08 | Link previous version. | New snapshot publish | `previousContentVersion` | Same route only | FR-M03-009 |
| SF-M03-006-09 | Retain versions. | Any time | All published snapshots kept | No hard delete; no M01 acknowledgement | FR-M03-010 |
| SF-M03-006-10 | Carry the offline route map. | Route content marks the map | `offlineRouteMap` in the snapshot | Changes to tick, image or caption create a version | FR-M03-009 |
| SF-M03-006-11 | Estimate offline size and apply the ceiling. | Candidate snapshot | `estimatedOfflineSizeBytes` | Above 50 MB blocks publication/reopening; closing and revoking exempt | FR-M03-009 |
| SF-M03-006-12 | Fail the whole operation on a build failure. | Build error | Public data unchanged; clear message; audit | No automatic retry | FR-M03-009 |

### FN-M03-007 — Emergency Operations

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M03-007-01 | Close route immediately with reason. | Either role | Route `TAM_DONG` + audit | No review screen; active version unchanged | FR-M03-011 |
| SF-M03-007-02 | Close checkpoint immediately. | Either role with reason | Checkpoint `TAM_DONG` | Dialog names every listing route and the routes that will auto-close | FR-M03-011 |
| SF-M03-007-03 | Publish closure snapshots atomically. | Checkpoint closure | New versions for every listing route together | Never blocked by the size ceiling | FR-M03-009, 011 |
| SF-M03-007-04 | Evaluate deterministic route outcome. | Checkpoint removed | Route stays active or auto-closes | Auto-close only when no active checkpoint remains; never auto-reopen | FR-M03-011 |
| SF-M03-007-05 | Capture reopen safety confirmation. | Reviewer action | Confirmation note/audit | Reviewer only | FR-M03-011 |
| SF-M03-007-06 | Revalidate before reopen. | Reopen request | Pass or list of fixes | Active visit point, bilingual content, field verification, stored images, size ceiling | FR-M03-005, 011 |
| SF-M03-007-07 | Reopen checkpoint/route atomically. | Reopen guard passes | `HOAT_DONG` + new versions where needed | Auto-closed routes stay closed | FR-M03-009, 011 |
| SF-M03-007-08 | Preserve running-session boundary. | Any close/reopen | No message/termination sent to M02 sessions | Physical safety handled outside the app | FR-M03-011 |
| SF-M03-007-09 | Offer closing the related routes when a checkpoint closure fails. | Closure failure | "Đóng tạm các tuyến liên quan" | Checkpoint itself stays active; never false success | FR-M03-011 |

### FN-M03-008 — Authentication, Accounts, Authorization & Concurrency

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M03-008-01 | Authenticate an administrator through the provider and end the session at sign-out. | Email/password submit from M03 login; sign-out action on any authenticated M03 screen | Provider session with authenticated `userId`, or login error; at sign-out the provider session ends and M03 returns to login | No public sign-up; M03 never stores the password; sign-out changes no role/status, writes no audit line and warns first about unsaved changes | FR-M03-013 |
| SF-M03-008-02 | Authorize fixed application role server-side. | Every protected request | Allowed/denied | Require matching `ACTIVE` `AdminAccount`; only `CONTENT_STAFF`/`REVIEWER` | FR-M03-006, 013 |
| SF-M03-008-03 | Start self-service password recovery. | Email submitted from M03 login | Generic request-accepted response; provider may send recovery email | Do not reveal whether email/account exists; do not create/change `AdminAccount` | FR-M03-013 |
| SF-M03-008-04 | Complete password recovery. | Valid provider recovery callback + new password | Provider credential updated; return to login | Expired/invalid callback rejected; role/status unchanged; reauthorization still required | FR-M03-013 |
| SF-M03-008-05 | Invite administrative account. | Reviewer submits normalized email + fixed role | Provider invitation and linked `INVITATION_PENDING` application account | Reviewer only; email unique; retry same pending request idempotently | FR-M03-013 |
| SF-M03-008-06 | Complete account invitation. | Recipient opens valid provider invitation and sets credential | Matching pending account becomes `ACTIVE`; provider identity ready for M03 login | Expired/invalid invite grants no access; recipient cannot choose/change role | FR-M03-013 |
| SF-M03-008-07 | Provision the initial Reviewer. | Authorized server-side environment operation + normalized email | Exactly one `INVITATION_PENDING` `REVIEWER` account linked to a provider invitation | Empty environment only; unavailable to browser/public API; same pending request is idempotent; environment exceptions live in the environment documentation | FR-M03-013 |
| SF-M03-008-08 | Change fixed role. | Reviewer action | Updated account role | Block last-active-Reviewer demotion | FR-M03-013 |
| SF-M03-008-09 | Activate/deactivate account. | Reviewer action | Updated active status | Block last-active-Reviewer deactivation | FR-M03-013 |
| SF-M03-008-10 | Preserve an active Reviewer transactionally. | Role/status mutation | Mutation accepted or blocked | Count active Reviewers in the same transaction; never leave zero | FR-M03-013 |
| SF-M03-008-11 | Validate concurrency revision. | Administrative update | Save or stale conflict | Stored revision must match submitted revision | FR-M03-007 |
| SF-M03-008-12 | Reject stale write. | Revision mismatch | Message naming who changed the item and when, with "Tải lại" | No auto-merge/overwrite; typed text kept on screen | FR-M03-007 |

### FN-M03-009 — Live QR & Content Service

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M03-009-01 | Resolve an active `qrIdentifier`. | M02 lookup (identifier taken from the public link, optional `routeId`) | Stable checkpoint identity | Exact match after trimming; `NHAP`/`THU_HOI`/unknown is `INVALID` | FR-M03-012 |
| SF-M03-009-02 | Evaluate checkpoint and route state. | Resolved QR | Outcome in the order of BR-M03-I02 | Checkpoint `NHAP`/`LUU_TRU` and unknown/`NHAP` route are `INVALID` | FR-M03-012 |
| SF-M03-009-03 | Return the scanned QR's own content. | `VALID` | Checkpoint name, mode, object name, introduction, images, media with `spokenLanguage` | Audio/video only for `ONLINE_AVAILABLE`; no route data | FR-M03-012 |
| SF-M03-009-04 | Return an invalid result. | Unknown/inactive QR | `INVALID` | Distinguishable from service failure | FR-M03-012 |
| SF-M03-009-05 | Preserve consumer read-only boundary. | M01/M02 public access | Read result | No source mutation permission; no visitor data written | FR-M03-012 |
| SF-M03-009-06 | Return a temporary closure. | Supplied route `TAM_DONG`/`LUU_TRU`, or checkpoint `TAM_DONG` | `TEMPORARILY_CLOSED` with scope `ROUTE` or `CHECKPOINT`, no content | Route scope takes priority | FR-M03-012 |
| SF-M03-009-07 | Signal source failure separately. | Lookup cannot conclude | Failure signal | Never answered as `INVALID` | FR-M03-012 |

### FN-M03-010 — Session Intake & Reporting

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M03-010-01 | Validate terminal schema/status. | SessionSyncRecord request | Valid/validation error | UUID, terminal status, required fields | FR-M03-014 |
| SF-M03-010-02 | Validate timestamps/visit uniqueness. | Parsed payload | Valid/validation error | `endedAt >= startedAt`; visits within interval; unique checkpoint | FR-M03-014 |
| SF-M03-010-03 | Enforce privacy allowlist. | Parsed payload | Accepted fields only | Reject visitor/device/GPS PII fields | FR-M03-014 |
| SF-M03-010-04 | Insert first session atomically. | New `sessionId` | Immutable header + child visits + `ingestedAt` | No partial insert | FR-M03-014 |
| SF-M03-010-05 | Acknowledge identical retry. | Existing ID + same normalized payload | Success without mutation | Formatting/order ignored | FR-M03-014 |
| SF-M03-010-06 | Reject changed retry. | Existing ID + different business payload | Conflict | Never overwrite terminal record; visited checkpoints compared as a set by `checkpointId` | FR-M03-014 |
| SF-M03-010-07 | Filter report dates. | Report query | Valid `fromDate/toDate` in Asia/Ho_Chi_Minh | Default 30 calendar days ending today, both ends inclusive; both dates together; from ≤ to; span at most 366 days (MSG-REPORT-SPAN, MSG-REPORT-DATES-INVALID) | FR-M03-015, 016 |
| SF-M03-010-08 | Produce RPT-01 totals/rates. | Valid filters | Unique total, completed/abandoned counts/rates | Empty result returns zero values | FR-M03-015 |
| SF-M03-010-09 | Produce RPT-02 unique visits. | Valid filters | Unique sessions per route/checkpoint, with the current Vietnamese route name for display | Group by stable route and checkpoint ID; checkpoint level only | FR-M03-016 |
| SF-M03-010-10 | Select historical display label/order. | Multiple historical labels | Latest-ended record label/sequence in range | Does not change grouping identity | FR-M03-016 |
| SF-M03-010-11 | Show the last successful ingestion time. | Report display | "Số liệu tính đến …" or "Chưa có chuyến đi nào…" | Plain one-line text in Asia/Ho_Chi_Minh | FR-M03-015, 016 |
| SF-M03-010-12 | Validate visited checkpoints against the snapshot. | Parsed payload | Valid/invalid | Each checkpoint in the snapshot of `(routeId, contentVersion)` with equal Vietnamese name and sequence | FR-M03-014 |
| SF-M03-010-13 | Validate route and published version. | Parsed payload | Valid/invalid | Known route; published version; any route status accepted | FR-M03-014 |
| SF-M03-010-14 | Show the report notes. | Report display | Counting scope, meaning of a visit, empty-period message | Plain one-line notes; warning style only for load failure | FR-M03-015, 016 |

### FN-M03-011 — History, Restore & Audit Log

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M03-011-01 | Show the published history of an item. | Route, checkpoint or visit point opened | List of published versions in plain language | Visible to both roles | FR-M03-007, 018 |
| SF-M03-011-02 | Restore an earlier published version as a new draft. | "Khôi phục bản đã xuất bản trước đó" | New draft that must pass review | Blocked while a draft exists; refused with MSG-RESTORE-BLOCKED when the old content breaks a limit in force now; current rules also apply at publication | FR-M03-007 |
| SF-M03-011-03 | Discard a pending draft. | "Bỏ thay đổi" | Draft `DA_BO`; published version untouched | Either role; audited | FR-M03-007 |
| SF-M03-011-04 | Append an audit line for every administrative action. | Any action or provisioning outcome | Actor, time, object, before/after, result, reason where required, self-published flag | Append-only; no credential or token values | FR-M03-018 |
| SF-M03-011-05 | Show the system-wide audit log to Reviewers. | Reviewer opens the log | Plain-language log | Reviewer only | FR-M03-018 |

## 4. Coverage summary

| Metric | Value |
|---|---:|
| Functions | 11 |
| Sub-functions | 113 |
| Source FR covered | 18/18 (FR-M03-017 removed in the spec) |

Every sub-function maps to at least one source FR; physical schema, endpoint and security-policy syntax remain design outputs derived from the source spec.
