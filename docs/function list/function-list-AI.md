# Function List AI — English Translation on Request for M03

## 1. Document information

| Field | Value |
|---|---|
| Capability | AI Integration — English translation on request, used by M03 |
| Source spec | [spec-AI_integration.md](../spec/spec-AI_integration.md), v1.0 |
| Updated | 2026-11-03 |
| Purpose | Functional decomposition for admin UI and server-function design |
| Priority rule | Delivery priority comes from `MVP-Scope.md` (Could); sub-functions inherit their parent function's priority. |
| Source FR notation | After one full ID, following comma-separated numbers inherit the same `FR-AI-` prefix. Business rules are cited as `BR-AI-<number>`; spec-M03 rules keep their `BR-M03-` IDs. |
| ID rule | Sub-function IDs are never renumbered or reused; new sub-functions are appended at the end of their function. |

## 2. Function hierarchy

| Function ID | Function | Outcome |
|---|---|---|
| FN-AI-001 | Translate on Request | Each bilingual field of the M03 editors has its own "→" button that fills the English input from the Vietnamese text, without saving. |
| FN-AI-002 | Translation Service Access | The external translation service is reached only through the server, for active administrators, with its credentials kept server-side. |

## 3. Detailed function list

### FN-AI-001 — Translate on Request

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-AI-001-01 | Offer a translate button per bilingual field. | Editor of a route, checkpoint or visit point opened for editing | A "→" button ("Dịch sang tiếng Anh") for each field of spec-AI §5.1, one per highlight item and per gallery caption | Not offered or not pressable in a read-only form or field (BR-AI-07); no whole-form button | FR-AI-001 |
| SF-AI-001-02 | Request the translation of one field. | Press of the field's button | Request with the Vietnamese text; field shows "Đang dịch…" (MSG-AI-TRANSLATING) | Not pressable while the Vietnamese text is empty/whitespace or a translation of the same field is in progress (BR-AI-01) | FR-AI-001 |
| SF-AI-001-03 | Write the translation into the English input. | Successful result | English input replaced by the translation, without a confirmation dialog | Plain text; line breaks removed for single-line fields (BR-AI-02, BR-AI-11); nothing saved (BR-AI-06, BR-M03-F11) | FR-AI-001, 002 |
| SF-AI-001-04 | Drop a late result. | Result arrives after the Vietnamese text changed or the administrator typed in the English input | Result discarded; field unchanged | Silent (BR-AI-04) | FR-AI-003 |
| SF-AI-001-05 | Never translate by itself. | Typing, leaving a field, opening an editor, clearing the English input, changing the Vietnamese text | No request; English input unchanged | Only a press translates (BR-AI-01, BR-AI-03, BR-AI-05) | FR-AI-003 |
| SF-AI-001-06 | Report a failure with a retry. | Failure signal or timeout | English input unchanged and editable; MSG-AI-FAILED with "Thử lại" | Message cleared on retry, on typing in the English input or on a new press (BR-AI-09) | FR-AI-004 |
| SF-AI-001-07 | Apply the existing length check to the result. | Translation longer than the field limit | Text written in full; counter in error; MSG-LIMIT-TEXT at save | Never cut; no new check (BR-AI-06, spec-M03 §5.3) | FR-AI-002 |

### FN-AI-002 — Translation Service Access

| Sub-function ID | Behavior | Input / trigger | Output / state | Exception / guard | Source FR |
|---|---|---|---|---|---|
| SF-AI-002-01 | Authorize the caller. | `TranslationRequest` reaches the server | Request accepted or refused | Authenticated identity with an `ACTIVE` `AdminAccount` only (BR-AI-08, BR-M03-A04) | FR-AI-005 |
| SF-AI-002-02 | Validate the request. | Accepted request | Valid or refused | `vi` → `en` only; non-empty text within the field limit; `lineBreaks` present (spec-AI §5.2) | FR-AI-005 |
| SF-AI-002-03 | Call the translation service. | Valid request | `TranslationResult` with plain-text `translatedText` | Only the source text is sent (BR-AI-10); credentials are a server secret, never in the browser, repository or logs (BR-AI-08) | FR-AI-005 |
| SF-AI-002-04 | Signal failure separately. | Service unavailable, timeout, refused | Failure signal, not a result | No usage cap (spec-AI §5.4) | FR-AI-004, 005 |

## 4. Coverage summary

| Metric | Value |
|---|---:|
| Functions | 2 |
| Sub-functions | 11 |
| Source FR covered | 5/5 |

Every sub-function maps to at least one source FR; the server-function name, endpoint and payload syntax remain design outputs derived from the source spec.
