# Function List M01 — Route Planning & Preparation

## 1. Document information

| Field | Value |
|---|---|
| Module | M01 — Route Planning & Preparation |
| Source spec | [spec-M01.md](../spec/spec-M01.md), v3.2 |
| Updated | 2026-10-27 |
| Purpose | Functional decomposition for UI/API/storage/database design |
| Priority rule | Complete functional baseline; delivery priority comes from `MVP-Scope.md` and sub-functions inherit their parent function's priority unless `MVP-Scope.md` §3.4 lists them separately. |
| Source FR notation | After one full ID, following comma-separated numbers inherit the same `FR-M01-` prefix. |
| ID rule | Sub-function IDs are never renumbered or reused; new sub-functions are appended at the end of their function. |

## 2. Function hierarchy

| Function ID | Function | Outcome |
|---|---|---|
| FN-M01-001 | Language Preference | A valid current language is available to M01/M02 on every visitor screen, including the QR link entry. |
| FN-M01-002 | Route Discovery | Visitor can browse route cards and read complete route details. |
| FN-M01-003 | Route Recommendation | Visitor receives all exact matches or a valid empty result. |
| FN-M01-004 | Offline Need & Decision | Visitor understands offline impact and size, and chooses the next action. |
| FN-M01-005 | Offline Package Lifecycle | Only complete active packages are exposed; old package survives failed update; essential route texts are kept with their saved time. |
| FN-M01-006 | Route Start & Handoff | Online/offline Start produces one complete one-use v3 context that expires after 24 hours. |
| FN-M01-007 | Shared Contract Publication | M02 reads stable language/context/package values independently. |

## 3. Detailed function list

### FN-M01-001 — Language Preference

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M01-001-01 | Require language selection at the normal app entry. | Normal entry without preference | `LanguagePreference` selection required | Only `vi`, `en` accepted; the QR link entry never shows this step | FR-M01-001 |
| SF-M01-001-02 | Persist and publish selected language. | Valid selection | Current singleton preference | Atomic replacement of previous value | FR-M01-001, 013 |
| SF-M01-001-03 | Change language online or offline. | Visitor selects other language | UI/local content branch changes immediately | No package/session state change | FR-M01-001 |
| SF-M01-001-04 | Provide the language control on every visitor screen, including the M02 QR link page. | Visitor opens any visitor screen | VI/EN switch available | Without a stored preference the QR link page uses the device language; M01 stays the only writer | FR-M01-001 |

### FN-M01-002 — Route Discovery

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M01-002-01 | Read/refresh published route projection. | Catalog entry or source refresh | Locally usable route view | Successful request defines current source availability | FR-M01-002 |
| SF-M01-002-02 | Filter selectable routes. | Published routes | Only `HOAT_DONG` with valid `activeContentVersion` | Closed/archived routes excluded | FR-M01-002 |
| SF-M01-002-03 | Display route cards. | Active routes + language | Thumbnail, name, short description, distance, duration, difficulty, checkpoint count, offline-needed mark | Do not synthesize missing fields | FR-M01-002 |
| SF-M01-002-04 | Handle source unavailable while browsing. | Failed source request | Last local view may remain visibly stale | Must not claim local data is current | FR-M01-002 |
| SF-M01-002-05 | Remove newly unavailable route after refresh. | Route becomes closed or archived | Removed from new choices; current context may be revoked | Package/session not automatically deleted | FR-M01-002, 011, 012 |
| SF-M01-002-06 | Display route details. | Selected route + language | Gallery (first image is the cover), full description, starting point, distance, duration, difficulty, highlights, checkpoint names in order; when present participation requirements, preparation, best time, route map and a prominent safety warning | Absent optional fields are hidden | FR-M01-003 |
| SF-M01-002-07 | Show a neutral placeholder for an image that cannot be loaded. | Image load failure | Card/detail stays usable | No broken layout | FR-M01-002, 003 |
| SF-M01-002-08 | Show saved essential texts offline. | Offline + ready package | Name, starting point, participation requirements, safety warning with the saved-time notice | Never claimed as current | FR-M01-003, 014 |

### FN-M01-003 — Route Recommendation

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M01-003-01 | Capture one value from each tag group. | Visitor criteria | Valid recommendation context | Missing/unknown enum prevents execution | FR-M01-004 |
| SF-M01-003-02 | Filter exact three-group matches. | Valid criteria + active routes | Candidate set | Route must contain all three selected tags; its single time tag is used as given | FR-M01-004 |
| SF-M01-003-03 | Return all matches without scoring/cap. | Candidate set | `0..N` routes | No AI/ranking/near-match | FR-M01-004 |
| SF-M01-003-04 | Handle empty result. | Zero candidates | Empty-state message and change/back actions | Criteria are not auto-relaxed | FR-M01-004 |

### FN-M01-004 — Offline Need & Decision

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M01-004-01 | Decide whether a package is needed. | Selected route | Need flag from `hasOfflineRequiredCheckpoint` or `hasOfflineRouteMap` | The downloaded snapshot is authoritative if it disagrees | FR-M01-005 |
| SF-M01-004-02 | Inspect package readiness/freshness. | Selected route | `status`, `versionStatus` | Unreadable package treated not ready | FR-M01-005 |
| SF-M01-004-03 | Bypass package decision when no package is needed. | No offline-required checkpoint and no offline route map | Proceed to online Start | Offline Start still requires ready package | FR-M01-005, 011 |
| SF-M01-004-04 | Warn when ready package is absent. | Offline need + not ready | Names of affected checkpoints in the visitor's language and the estimated size labelled as an estimate, or "size not available" | No implicit user choice; an absent estimate never blocks Download | FR-M01-006 |
| SF-M01-004-05 | Process Download choice. | Visitor chooses Download | Invoke package acquisition | Source must be accessible | FR-M01-006, 007 |
| SF-M01-004-06 | Process Continue choice. | Visitor confirms impact | Eligible to attempt online Start without package | Does not bypass online Start validation | FR-M01-006, 011 |
| SF-M01-004-07 | Process Back choice. | Visitor chooses Back | Return without Start/package mutation | — | FR-M01-006 |
| SF-M01-004-08 | Tell the visitor how to scan without network. | Offline decision or ready package state shown | One line: without network, check in with the Scan button in the app | The phone camera may not open the app without network | FR-M01-006 |

### FN-M01-005 — Offline Package Lifecycle

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M01-005-01 | Fetch current immutable snapshot. | Download request online | Full manifest candidate | Request must succeed and version be published | FR-M01-007 |
| SF-M01-005-02 | Fetch the offline resource of every QR of the offline-required checkpoints. | Snapshot checkpoints | Bilingual object name, introduction and declared image bytes per QR | Key by `qrIdentifier`; exactly one resource per QR | FR-M01-007 |
| SF-M01-005-03 | Validate candidate completeness. | Download completes | Valid/invalid candidate | Both languages, every declared image, the offline route map when present and the essential texts required | FR-M01-008 |
| SF-M01-005-04 | Publish ready candidate atomically. | Candidate valid | One active `SAN_SANG + CURRENT` package | Partial/staging data never exposed | FR-M01-008, 013 |
| SF-M01-005-05 | Handle initial download failure. | No old ready package | `CHUA_HOAN_TAT`; candidate removed | No partial package | FR-M01-008 |
| SF-M01-005-06 | List/view package state. | Resource-management entry | Route, version, readiness/freshness, when essential texts were saved, whether an offline route map is included | Display outdated warning when known | FR-M01-009 |
| SF-M01-005-07 | Confirm and delete package. | Delete request | Package, resources, offline route map and essentials removed; logical `CHUA_TAI` | Context/M02 data remain | FR-M01-009 |
| SF-M01-005-08 | Detect newer version lazily. | Packaged route opened online | Old package marked `OUTDATED`; candidate starts | No update when source unavailable/same version | FR-M01-010 |
| SF-M01-005-09 | Switch updated package atomically. | New candidate valid | New active `CURRENT`; old version cleaned | At most one active package/route | FR-M01-010 |
| SF-M01-005-10 | Recover failed update. | Candidate download/validation fails | Candidate removed; old `SAN_SANG + OUTDATED` remains | Never remove old ready package | FR-M01-010 |
| SF-M01-005-11 | Serialize package operations. | Download/update/delete repeated | One operation per route | MVP has no Cancel | FR-M01-009, 010 |
| SF-M01-005-12 | Download the offline route map. | Snapshot carries `offlineRouteMap` | Local image bytes and optional caption in the package | Missing bytes keep the package from becoming ready | FR-M01-007, 008 |
| SF-M01-005-13 | Save essential route texts with their saved time. | Package becomes ready | `routeEssentials` with `capturedAt` | Text only, never images | FR-M01-014 |
| SF-M01-005-14 | Refresh essential texts independently of the package version. | Successful source read | Essentials replaced atomically | On failure keep the old texts and their saved time | FR-M01-010, 014 |

### FN-M01-006 — Route Start & Handoff

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M01-006-01 | Select online Start path. | Start + successful source access | Current active route/snapshot selected | Block closed/incomplete/unavailable route | FR-M01-011 |
| SF-M01-006-02 | Select offline Start path. | Start + no source access + ready package | Package route/version/manifest selected | Block if package absent/not ready | FR-M01-011 |
| SF-M01-006-03 | Allow known outdated package for offline Start. | Ready `OUTDATED` package | Handoff based on package version | Preserve outdated warning | FR-M01-011 |
| SF-M01-006-04 | Generate new handoff identity and expiry. | Start path valid | New UUID `handoffId`; `expiresAt` = `authorizedAt` + 24 hours | Never reuse previous handoff; M01 never extends the expiry | FR-M01-012 |
| SF-M01-006-05 | Build journey-only context. | Selected snapshot/package manifest | Context metadata without duplicated resource bytes | Route IDs/version must match | FR-M01-012 |
| SF-M01-006-06 | Atomically replace current context. | Complete context | `AUTHORIZED` v3 context | Failure keeps previous context unchanged | FR-M01-012 |
| SF-M01-006-07 | Revoke current context after closure discovered. | Successful refresh sees unavailable route | `authorizationStatus = REVOKED` | Created M02 session continues | FR-M01-002, 012 |
| SF-M01-006-08 | Open M02 only after context commit. | Atomic write success | M02 entry | No partial handoff | FR-M01-011, 012 |

### FN-M01-007 — Shared Contract Publication

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M01-007-01 | Expose current language independently. | Preference changes | `LanguagePreference` | Only valid enum | FR-M01-001, 013 |
| SF-M01-007-02 | Expose only active ready package. | Package lifecycle change | `OfflinePackage SAN_SANG` or none | Never expose staging/partial data | FR-M01-008, 013 |
| SF-M01-007-03 | Expose complete v3 context. | Start/revoke commit | Current `SelectedRouteContext v3` | Atomic value only | FR-M01-012, 013 |
| SF-M01-007-04 | Preserve ownership boundary. | M02 reads shared data | Read-only access | M02 cannot mutate M01 state | FR-M01-013 |

## 4. Coverage summary

| Metric | Value |
|---|---:|
| Functions | 7 |
| Sub-functions | 50 |
| Source FR covered | 14/14 |

Every sub-function maps to at least one FR; detailed field/state constraints remain authoritative in the source spec.
