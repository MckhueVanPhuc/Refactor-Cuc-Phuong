# Function List Mascot — Mila, the Visitor Companion for M01 and M02

## 1. Document information

| Field | Value |
|---|---|
| Capability | Mascot — Mila accompanies visitors on the M01 and M02 screens |
| Source spec | [spec-Mascot.md](../spec/spec-Mascot.md), v1.0 |
| Updated | 2026-11-21 |
| Purpose | Functional decomposition for the visitor frontend design |
| Priority rule | Delivery priority comes from `MVP-Scope.md` §3.6 (Could); sub-functions inherit their parent function's priority. |
| Source FR notation | After one full ID, following comma-separated numbers inherit the same `FR-MAS-` prefix. Business rules are cited as `BR-MAS-<number>`; spec-M01/M02 rules keep their own IDs. |
| ID rule | Sub-function IDs are never renumbered or reused; new sub-functions are appended at the end of their function. |

## 2. Function hierarchy

| Function ID | Function | Outcome |
|---|---|---|
| FN-MAS-001 | Companion Presence | Mila appears only in the slots of the visitor screens, never overlaps content, cannot be hidden, works offline and respects reduced motion. |
| FN-MAS-002 | Event Reaction & Arbitration | Mila reacts to real M01/M02 events, one reaction at a time, by priority, cooldown and proactive limit, in the current language. |
| FN-MAS-003 | Onboarding & Guidance | Mila introduces itself once, guides the visitor through choosing and starting a route, reminds about safety and nature, and answers a tap with one sentence. |
| FN-MAS-004 | Scanner Assistance & Recovery | Mila helps with scanning, explains repeated failures, network loss, package failures and codes outside the journey. |
| FN-MAS-005 | Celebration & Progress | Mila celebrates newly recorded visits and the end of the trip with real progress, and keeps the visitor calm about pending synchronization. |

## 3. Detailed function list

### FN-MAS-001 — Companion Presence

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-MAS-001-01 | Show Mila in the screen's slot. | A visitor screen with a slot is shown (spec-Mascot §5.1) | Mila in the allowed display mode | No slot → nothing shown; never on the language step, safety warning, closure notice, article text, gallery, media, delete dialog, update prompt or M03 (§5.1) | FR-MAS-001 |
| SF-MAS-001-02 | Keep Mila present without a hide control. | Any screen with a `DOCK` slot | Mila stays while the screen is shown | No hide, minimize or quiet mode; a bubble's close button closes only that message (BR-MAS-11) | FR-MAS-001 |
| SF-MAS-001-03 | Never block the visitor. | Any reaction | Mila does not take focus or overlap buttons, notices, toasts, dialogs or text | — (BR-MAS-11, SC-MAS-002) | FR-MAS-001, 009 |
| SF-MAS-001-04 | Step aside in focus contexts. | Media playing, another dialog open, page hidden | No bubble; only P0–P1 `INLINE`; timers stop while hidden | (BR-MAS-08) | FR-MAS-007 |
| SF-MAS-001-05 | Leave on a temporary closure. | Scan answered `TEMPORARILY_CLOSED` | Mila removed from the screen; pending reactions dropped | Returns only on the next scan or another screen (BR-MAS-03) | FR-MAS-007 |
| SF-MAS-001-06 | Work offline. | Device offline after the app shell is cached | Same images and messages as online | Missing image → Mila not shown, screen unchanged (BR-MAS-15, 16) | FR-MAS-010 |
| SF-MAS-001-07 | Respect reduced motion. | Reduced motion requested | Immediate changes or fades ≤ 150 ms; no particles; no vibration | (BR-MAS-17, 19) | FR-MAS-001 |

### FN-MAS-002 — Event Reaction & Arbitration

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-MAS-002-01 | Receive mascot events. | A logical event of spec-Mascot §5.2, emitted after the module's work | Event available to the mascot system | Never awaited, stored or sent off the device (BR-MAS-01, 18) | FR-MAS-002 |
| SF-MAS-002-02 | Choose one reaction by priority. | Several events close together | At most one bubble; higher class interrupts lower; at most one waiting reaction | Waiting reaction dropped after `MASCOT_QUEUE_TTL_MS`; P5–P7 never wait (BR-MAS-05) | FR-MAS-002 |
| SF-MAS-002-03 | Avoid repetition. | A message within its cooldown; a duplicate event within 500 ms | Not shown again | Memory lasts for the page load only (BR-MAS-06) | FR-MAS-002 |
| SF-MAS-002-04 | Limit proactive talk. | More than `MASCOT_PROACTIVE_LIMIT` P5–P7 reactions in the window | Further P5–P7 reactions dropped | (BR-MAS-07) | FR-MAS-002 |
| SF-MAS-002-05 | Speak the visitor's language. | Current `LanguagePreference` (device-language rule on the QR link page) | Message text in `vi` or `en`; a visible bubble switches at once on VI/EN change | Text only from the catalog of spec-Mascot §5.6 (BR-MAS-02, 04) | FR-MAS-003 |

### FN-MAS-003 — Onboarding & Guidance

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-MAS-003-01 | Introduce Mila. | First language choice on the language step | MSG-MAS-001 then 002 over the catalog | Never on `/q/{qrIdentifier}`; never when a preference already existed (US-MAS-01) | FR-MAS-004 |
| SF-MAS-003-02 | Welcome a returning visitor. | Catalog opened with a preference stored before the page load | MSG-MAS-004 once per page load | — | FR-MAS-004 |
| SF-MAS-003-03 | Help choose a route. | Catalog inactivity; recommendation opened, resolved or empty twice | MSG-MAS-008, 010, 011, 013 | Inactivity only once per page load, without scroll or route opened (BR-MAS-09, 10) | FR-MAS-002 |
| SF-MAS-003-04 | Remind about the safety warning. | Start panel visible for a route with a safety warning | MSG-MAS-014 | Mila never placed on the safety warning block (§5.1) | FR-MAS-002 |
| SF-MAS-003-05 | Guide the start of the trip. | Trip started | MSG-MAS-030 | Fixed session start hint of spec-M02 §5.1 unchanged | FR-MAS-002 |
| SF-MAS-003-06 | Encourage looking at the forest. | Return to SCR-M02-001 after a new visit | MSG-MAS-056 alternating with MSG-MAS-057a–e | Nature reminders only after Park Management approval (BR-MAS-13) | FR-MAS-002 |
| SF-MAS-003-07 | Answer a tap. | Tap on Mila in a `DOCK` or `AVATAR` slot | One fixed help sentence of the screen (MSG-MAS-009, 032, 059) | No menu, no conversation (BR-MAS-12) | FR-MAS-008 |
| SF-MAS-003-08 | Welcome back during a trip. | Page shown again after `MASCOT_WELCOME_BACK_MIN` with a running session | MSG-MAS-034 | Not when the automatic-end notice is shown | FR-MAS-002 |

### FN-MAS-004 — Scanner Assistance & Recovery

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-MAS-004-01 | Explain how to scan. | Scanner opened with no visit yet, or without a session | MSG-MAS-040 below the frame | Once per page load; never over the frame (US-MAS-03) | FR-MAS-006 |
| SF-MAS-004-02 | Help after inactivity on the scanner. | No code read for `MASCOT_SCANNER_LOOK_S`, `_HELP_S`, `_CAMERA_OFF_S` | Look-around; MSG-MAS-042; MSG-MAS-049 with "Đóng camera" / "Chưa" | Each once per scanner opening; silent afterwards (BR-MAS-09) | FR-MAS-006 |
| SF-MAS-004-03 | Show a slow lookup. | Lookup pending after `MASCOT_LOOKUP_SLOW_S` | MSG-MAS-044 | Before `LOOKUP_TIMEOUT_SECONDS` of spec-M02 | FR-MAS-006 |
| SF-MAS-004-04 | Help after repeated scan failures. | Two consecutive `INVALID` or connection-needed results | MSG-MAS-046 or 048 | Fixed messages of spec-M02 §5.1 stay; a different result resets the count (BR-MAS-10) | FR-MAS-006 |
| SF-MAS-004-05 | Explain a code outside the journey. | `VALID` answer with a session and no visit recorded | MSG-MAS-052 | Never for a free visitor (BR-MAS-14) | FR-MAS-002 |
| SF-MAS-004-06 | Reassure about network loss. | Offline during a session; online again; content from the package | MSG-MAS-074, 075, 054 | No claim of synchronization (BR-MAS-04) | FR-MAS-010 |
| SF-MAS-004-07 | Explain package failures. | Download started, ready, failed (source, download, storage), failed twice | MSG-MAS-020, 021, 024, 025, 026 | No percentage; offline claims only for ready packages (BR-MAS-04) | FR-MAS-002 |

### FN-MAS-005 — Celebration & Progress

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-MAS-005-01 | Celebrate a newly recorded visit. | Visit of a checkpoint recorded for the first time | Celebration with MSG-MAS-050 or 051 next to the unchanged toast; one short vibration where supported | Content not delayed; no celebration on re-scan or for a free visitor (US-MAS-02, BR-MAS-19) | FR-MAS-005 |
| SF-MAS-005-02 | Mark the halfway point. | `k = ⌈n/2⌉`, `n ≥ 4`, not the final checkpoint | MSG-MAS-055 | Once per session | FR-MAS-005 |
| SF-MAS-005-03 | Accompany the end-of-trip prompt. | Prompt opened; "Đi tiếp" pressed | Illustration inside the prompt; MSG-MAS-061 after "Đi tiếp" | Prompt never delayed (BR-M02-021) | FR-MAS-005, 009 |
| SF-MAS-005-04 | Celebrate the end of the trip. | SCR-M02-003 opened right after the visitor ended a `HOAN_TAT` trip | Celebration ≤ `MASCOT_CELEBRATION_MS` with MSG-MAS-062, then a still illustration next to the badge | Skippable by tap; reopening shows the still illustration only | FR-MAS-005 |
| SF-MAS-005-05 | Keep the visitor calm about sending. | `PENDING` while offline; `PENDING` → `SYNCED`; `CONFLICT` | MSG-MAS-070; a short thumbs-up; an illustration only for `CONFLICT` | No "sent" before `SYNCED`; no retry action (BR-MAS-04, spec-M02 BR-M02-011) | FR-MAS-005 |

## 4. Coverage summary

| Metric | Value |
|---|---:|
| Functions | 5 |
| Sub-functions | 32 |
| Source FR covered | 10/10 |

Every sub-function maps to at least one source FR; event names, payloads, component names and file locations remain design outputs of the implementation package `specs/005-visitor-mascot/`.
