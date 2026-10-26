# Function List M01 — Route Planning & Preparation

## 1. Document information

| Field | Value |
|---|---|
| Module | M01 — Route Planning & Preparation |
| Source spec | [spec-M01.md](../spec/spec-M01.md), v2.0 |
| Purpose | Functional decomposition for UI/API/storage/database design |
| Priority rule | Complete functional baseline; delivery priority comes from `MVP-Scope.md` and sub-functions inherit their parent function's priority unless a delivery plan explicitly splits them. |
| Source FR notation | After one full ID, following comma-separated numbers inherit the same `FR-M01-` prefix. |

## 2. Function hierarchy

| Function ID | Function | Outcome |
|---|---|---|
| FN-M01-001 | Language Preference | A valid current language is available to M01/M02. |
| FN-M01-002 | Route Discovery | Visitor can browse complete active route information. |
| FN-M01-003 | Route Recommendation | Visitor receives all exact matches or a valid empty result. |
| FN-M01-004 | Offline Need & Decision | Visitor understands offline impact and chooses the next action. |
| FN-M01-005 | Offline Package Lifecycle | Only complete active packages are exposed; old package survives failed update. |
| FN-M01-006 | Route Start & Handoff | Online/offline Start produces one complete one-use context. |
| FN-M01-007 | Shared Contract Publication | M02 reads stable language/context/package values independently. |

## 3. Detailed function list

### FN-M01-001 — Language Preference

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M01-001-01 | Require initial language selection before other M01 functions. | App entry without preference | `LanguagePreference` selection required | Only `vi`, `en` accepted | FR-M01-001 |
| SF-M01-001-02 | Persist and publish selected language. | Valid selection | Current singleton preference | Atomic replacement of previous value | FR-M01-001, 013 |
| SF-M01-001-03 | Change language online or offline. | Visitor selects other language | UI/local content branch changes immediately | No package/session state change | FR-M01-001 |

### FN-M01-002 — Route Discovery

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M01-002-01 | Read/refresh published route projection. | Catalog entry or source refresh | Locally usable route view | Successful request defines current source availability | FR-M01-002 |
| SF-M01-002-02 | Filter selectable routes. | Published routes | Only `HOAT_DONG` with valid `activeContentVersion` | Draft/closed/archived/incomplete routes excluded | FR-M01-002 |
| SF-M01-002-03 | Display localized route summary/details. | Active route + language | Name, description, distance, duration, difficulty, optional warning | Do not synthesize missing fields | FR-M01-003 |
| SF-M01-002-04 | Handle source unavailable while browsing. | Failed source request | Last local view may remain visibly stale | Must not claim local data is current | FR-M01-002 |
| SF-M01-002-05 | Remove newly unavailable route after refresh. | Route becomes closed/archived/deleted | Removed from new choices; current context may be revoked | Package/session not automatically deleted | FR-M01-002, 011, 012 |

### FN-M01-003 — Route Recommendation

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M01-003-01 | Capture one value from each tag group. | Visitor criteria | Valid recommendation context | Missing/unknown enum prevents execution | FR-M01-004 |
| SF-M01-003-02 | Filter exact three-group matches. | Valid criteria + active routes | Candidate set | Route must contain all three selected tags | FR-M01-004 |
| SF-M01-003-03 | Return all matches without scoring/cap. | Candidate set | `0..N` routes | No AI/ranking/near-match | FR-M01-004 |
| SF-M01-003-04 | Handle empty result. | Zero candidates | Empty-state message and change/back actions | Criteria are not auto-relaxed | FR-M01-004 |

### FN-M01-004 — Offline Need & Decision

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M01-004-01 | Count `OFFLINE_REQUIRED` checkpoints. | Selected route snapshot | Need flag + affected count | Snapshot must be published/complete | FR-M01-005 |
| SF-M01-004-02 | Inspect package readiness/freshness. | Selected route | `status`, `versionStatus` | Unreadable package treated not ready | FR-M01-005 |
| SF-M01-004-03 | Bypass package decision for all-online route. | No offline-required checkpoint | Proceed to online Start | Offline Start still requires ready package | FR-M01-005, 011 |
| SF-M01-004-04 | Warn when ready package is absent. | Offline need + not ready | Impact message with affected count | No implicit user choice | FR-M01-006 |
| SF-M01-004-05 | Process Download choice. | Visitor chooses Download | Invoke package acquisition | Source must be accessible | FR-M01-006, 007 |
| SF-M01-004-06 | Process Continue choice. | Visitor confirms impact | Eligible to attempt online Start without package | Does not bypass online Start validation | FR-M01-006, 011 |
| SF-M01-004-07 | Process Back choice. | Visitor chooses Back | Return without Start/package mutation | — | FR-M01-006 |

### FN-M01-005 — Offline Package Lifecycle

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M01-005-01 | Fetch current immutable snapshot. | Download request online | Full manifest candidate | Request must succeed and version be published | FR-M01-007 |
| SF-M01-005-02 | Fetch offline resource subset. | Snapshot checkpoints | Bilingual text and declared image bytes | Key by stable `checkpointId` | FR-M01-007 |
| SF-M01-005-03 | Validate candidate completeness. | Download completes | Valid/invalid candidate | Both languages and every declared image required | FR-M01-008 |
| SF-M01-005-04 | Publish ready candidate atomically. | Candidate valid | One active `SAN_SANG + CURRENT` package | Partial/staging data never exposed | FR-M01-008, 013 |
| SF-M01-005-05 | Handle initial download failure. | No old ready package | `CHUA_HOAN_TAT`; candidate removed | No partial package | FR-M01-008 |
| SF-M01-005-06 | List/view package state. | Resource-management entry | Route, version, readiness/freshness | Display outdated warning when known | FR-M01-009 |
| SF-M01-005-07 | Confirm and delete package. | Delete request | Package/resources removed; logical `CHUA_TAI` | Context/M02 data remain | FR-M01-009 |
| SF-M01-005-08 | Detect newer version lazily. | Packaged route opened online | Old package marked `OUTDATED`; candidate starts | No update when source unavailable/same version | FR-M01-010 |
| SF-M01-005-09 | Switch updated package atomically. | New candidate valid | New active `CURRENT`; old version cleaned | At most one active package/route | FR-M01-010 |
| SF-M01-005-10 | Recover failed update. | Candidate download/validation fails | Candidate removed; old `SAN_SANG + OUTDATED` remains | Never remove old ready package | FR-M01-010 |
| SF-M01-005-11 | Serialize package operations. | Download/update/delete repeated | One operation per route | MVP has no Cancel | FR-M01-009, 010 |

### FN-M01-006 — Route Start & Handoff

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M01-006-01 | Select online Start path. | Start + successful source access | Current active route/snapshot selected | Block closed/incomplete/unavailable route | FR-M01-011 |
| SF-M01-006-02 | Select offline Start path. | Start + no source access + ready package | Package route/version/manifest selected | Block if package absent/not ready | FR-M01-011 |
| SF-M01-006-03 | Allow known outdated package for offline Start. | Ready `OUTDATED` package | Handoff based on package version | Preserve outdated warning | FR-M01-011 |
| SF-M01-006-04 | Generate new handoff identity. | Start path valid | New UUID `handoffId` | Never reuse previous handoff | FR-M01-012 |
| SF-M01-006-05 | Build journey-only context. | Selected snapshot/package manifest | Context metadata without duplicated resource bytes | Route IDs/version must match | FR-M01-012 |
| SF-M01-006-06 | Atomically replace current context. | Complete context | `AUTHORIZED` v2 context | Failure keeps previous context unchanged | FR-M01-012 |
| SF-M01-006-07 | Revoke current context after closure discovered. | Successful refresh sees unavailable route | `authorizationStatus = REVOKED` | Created M02 session continues | FR-M01-002, 012 |
| SF-M01-006-08 | Open M02 only after context commit. | Atomic write success | M02 entry | No partial handoff | FR-M01-011, 012 |

### FN-M01-007 — Shared Contract Publication

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-M01-007-01 | Expose current language independently. | Preference changes | `LanguagePreference` | Only valid enum | FR-M01-001, 013 |
| SF-M01-007-02 | Expose only active ready package. | Package lifecycle change | `OfflinePackage SAN_SANG` or none | Never expose staging/partial data | FR-M01-008, 013 |
| SF-M01-007-03 | Expose complete v2 context. | Start/revoke commit | Current `SelectedRouteContext v2` | Atomic value only | FR-M01-012, 013 |
| SF-M01-007-04 | Preserve ownership boundary. | M02 reads shared data | Read-only access | M02 cannot mutate M01 state | FR-M01-013 |

## 4. Coverage summary

| Metric | Value |
|---|---:|
| Functions | 7 |
| Sub-functions | 42 |
| Source FR covered | 13/13 |
| Baseline sub-functions | 42 |

Every sub-function maps to at least one FR; detailed field/state constraints remain authoritative in the source spec.
