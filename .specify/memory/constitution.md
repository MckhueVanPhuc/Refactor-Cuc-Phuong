<!--
SYNC IMPACT REPORT
Version change: 2.0.0 → 2.0.1 (PATCH: clarification of downstream status; no principle changed)
Modified principles: none. Added sections: none. Removed sections: none.
Clarification: the data layer is no longer stale. S1–S4, the Data Acceptance Criteria catalog,
  the review gate (data/05-review.md) and the Physical Schema (data/06-physical-schema.md) were
  rebaselined to V2 on 2026-10-28 against the current specs (M01 v3.2 clarification 2,
  M03 v3.7 clarification 3). Screen lists were synchronized with the same specs on 2026-10-28;
  screen specifications are still pending (see below).
Downstream artifacts to review: screen specifications under screens/screen-spec/ (stale against
  the rebaselined specs; the M03 ones still describe a review queue); MVP-Scope.md and the
  function lists were not re-checked in this amendment.
Follow-up TODOs: rewrite screen specifications in a separate task.
-->

<!--
SYNC IMPACT REPORT
Version change: 1.1.0 → 2.0.0 (MAJOR: alignment with spec rebaseline M01 v3.2, M02 v3.2, M03 v3.6)
Modified principles:
  II. Module Ownership Boundaries — M03 owns Revision instead of CheckpointContent;
      the handoff contract is SelectedRouteContext v3; the live lookup contract is named
      LiveQrLookupResult with LiveStationContent.
  III. Minimal Diff & Traceability — recorded exception for IDs redefined in the V2 rebaseline.
  IV. Data Integrity & Immutability — references updated to current IDs (BR-M03-G04, G08, J03).
  V. Security & Authorization — second-person approval replaced by the mandatory publication
      review, version restore and audit (spec-M03 BR-M03-A05); references updated (K02–K05).
  VI. Offline Integrity & PWA Contract — visit recording follows BR-M02-005 (recorded for an
      accepted scan before the content is shown).
Other fixes: corrupted characters in Principle VI ("vi/en") and Governance ("tech-stack.md").
Removed sections: none. Added sections: none.
Downstream artifacts to review: AGENTS.md (updated together), MVP-Scope.md, function lists,
architecture, screen list/specs, data S1–S4 and DAC (stale against the rebaselined specs).
Follow-up TODOs: none.
-->

# Cúc Phương Quest Constitution

## Core Principles

### I. Spec-First Behavioral Authority

The three module specifications are the **sole source of truth** for product behavior and contracts:

- docs/spec/spec-M01.md — Route Planning & Preparation
- docs/spec/spec-M02.md — Field Quest Experience
- docs/spec/spec-M03.md — Operations & Content Administration

**Rules:**

- No feature implementation, screen, data model, or architecture decision may introduce or change
  behavioral requirements that are not already defined in a module spec.
- If a conflict arises between any derived artifact (architecture doc, function list, screen spec,
  data model, mockup) and a module spec, the module spec wins.
- MVP-Scope.md owns release priority (Must/Should/Could/Won't); it MUST NOT redefine behavior or
  remove requirements already present in a spec.
- Architecture docs own approved technical decisions within their declared scope; they MUST NOT
  change business behavior defined in a spec.
- External documentation and best practices are used only to verify tooling/technology; they MUST
  NOT fill gaps in requirements.
- All open requirements MUST be marked [NEEDS CLARIFICATION: ...] rather than silently inferred.

**Rationale:** A single authoritative behavioral baseline prevents drift between design, implementation
and testing.

---

### II. Module Ownership Boundaries (NON-NEGOTIABLE)

The product is a modular monolith with three logical modules. Each module has a strict ownership boundary.

| Module | Owns at runtime | MUST NOT mutate |
|--------|----------------|-----------------|
| M01 | LanguagePreference, SelectedRouteContext v3, OfflinePackage/OfflineResource, RecommendationContext | M02 session/visit data; M03 source content |
| M02 | PlaySession, CheckpointVisit, frozen journey copy, PendingSyncItem / SessionSyncRecord | M01 shared contracts; M03 source entities |
| M03 | Route, Checkpoint, QRCode, Revision, Media, JourneySnapshot, AdminAccount, SessionRecord, AuditRecord | Visitor device data; remote interruption of running sessions |

**Cross-module contract names are stable and versioned:**

| Producer | Contract | Consumer |
|----------|----------|----------|
| M03 | Published Route projection, JourneySnapshot | M01 |
| M01 | LanguagePreference, SelectedRouteContext v3, ready OfflinePackage | M02 |
| M03 | LiveQrLookupResult with LiveStationContent (live QR lookup) | M02 |
| M02 | Terminal anonymous SessionSyncRecord | M03 |

**Rules:**

- Contract names (including version suffixes) MUST NOT be renamed, merged, or replaced by
  implementation convenience aliases without a spec change.
- A module MUST NOT read another module's write-pending (staging/partial) values.
- M01 MUST write SelectedRouteContext v3 atomically; M02 MUST NOT reconstruct the journey from M03.
- SessionSyncRecord (transport) and SessionRecord (M03 canonical entity) are distinct; they
  MUST NOT be merged.

**Rationale:** Loose coupling at module boundaries is the primary safeguard against cross-module regressions.

---

### III. Minimal Diff & Traceability

Every change to a project artifact MUST be minimal, traceable, and scope-bounded.

**Rules:**

- Every behavioral claim in a document MUST trace to a stable ID (FR-*, BR-*, US-*, FN-*,
  SCR-*, ENT-*, REL-*) that exists in the repository.
- Stable IDs MUST NOT be reused for a different meaning once published. Recorded exception
  (2026-10-27, V2 rebaseline approved by the product owner): spec-M03 v3.4+ redefined FR-M03-002,
  FR-M03-004 and FR-M03-006 and replaced BR-M03-001…020 with lettered groups (BR-M03-A01…L13).
  These old meanings are superseded; the IDs are not reused again for any other meaning.
- Derived artifacts (function list, architecture, screen spec, data model) MUST be updated to reflect
  a spec change; they MUST NOT lead a spec change.
- When a derived artifact is out of scope for the current task, it MUST be marked as potentially
  stale in the task report rather than silently updated.
- Diffs MUST target only the files within the declared task scope; unrelated files MUST NOT be
  reformatted or restructured as a side effect.

**Rationale:** Traceability makes reviews fast and regressions auditable without full document scans.

---

### IV. Data Integrity & Immutability

Several data types are immutable by design and MUST be treated as such in all layers.

**Rules:**

- JourneySnapshot is immutable once published (DA_CONG_BO); a new snapshot MUST be created for
  every journey-affecting change (BR-M03-G04).
- SessionSyncRecord / SessionRecord business fields are immutable; an identical retry is
  idempotent; a changed retry for the same sessionId is a conflict (BR-M02-011, BR-M03-J03).
- PlaySession.journeyCheckpoints is a frozen value copy of the handoff manifest; it MUST NOT be
  updated after session creation (BR-M02-003).
- OfflinePackage staging/candidate values MUST NOT be exposed as the active package until atomic
  publication succeeds (FR-M01-013).
- Published media objects MUST NOT be overwritten; objects still referenced by retained snapshots
  MUST NOT be deleted.
- Audit records are append-only and MUST NOT contain credential or token values.
- Snapshot retention: current, previous, and snapshots replaced less than 30 days ago MUST be kept
  (BR-M03-G08). No hard-delete or automatic purge exists for canonical M03 entities in MVP
  (DEC-S6-002).

**Rationale:** Immutability of historical and shared data prevents data loss and reporting inconsistency.

---

### V. Security & Authorization

Authorization is server-side and must not be replicated solely in the browser.

**Rules:**

- Every M03 protected request MUST validate both the provider-authenticated identity **and** an
  active AdminAccount with a recognized role. A valid provider token alone MUST NOT grant M03
  access (BR-M03-K05).
- Authorization MUST be enforced server-side (RLS, RPC role checks, Edge Function guards).
  Client-side role checks are UI convenience only.
- M03 has no second-person approval. Any administrator may publish their own draft, but only
  through the mandatory publication review screen; every publication MUST be audited (flagged
  when self-published) and earlier versions MUST stay restorable (BR-M03-A05, F02, F07, F08).
- The last active REVIEWER account MUST be protected transactionally; deactivation/demotion that
  would leave zero active Reviewers MUST be rejected in the database transaction (BR-M03-K03).
- Invitation and password recovery are provider-managed credential flows; neither may assign or
  change an application role (BR-M03-K02).
- Initial Reviewer provisioning is server-side only, one-time per environment, and unavailable from
  the browser or public API (BR-M03-K04, US-M03-05 item 9).
- RPC functions default to security-invoker; security-definer requires fixed search_path,
  explicit EXECUTE grants, and an in-function permission check.
- VITE_* variables are visible in the browser bundle and MUST NOT contain secrets.
  Secret values MUST NOT be committed to the repository.
- SessionSyncRecord and report data MUST NOT contain visitor PII, device identifiers, or GPS
  data (spec-M03 §5.1 validation).
- Storage objects and Postgres publication are not in the same transaction; objects MUST be verified
  before the public reference is switched.

**Rationale:** The product handles park operations data; a breach of authorization exposes operational
integrity, not just UX.

---

### VI. Offline Integrity & PWA Contract

The offline capability is load-bearing for field use; its guarantees are narrow and must be stated
accurately.

**Rules:**

- App shell and bundled vi/en i18n resources are cached via Workbox precache (Cache Storage).
  Supabase API, Auth, admin responses, and signed media responses MUST NOT be runtime-cached by
  Workbox.
- Offline package image bytes MUST be stored as local byte/blob in IndexedDB; a URL or signed URL
  MUST NOT count as a downloaded resource.
- A package that is SAN_SANG but OUTDATED is usable; M02 MUST show the outdated warning when
  the status is known.
- A visit is recorded only for an accepted scan and before the content is shown; a content failure
  MUST NOT remove a recorded visit (BR-M02-005).
- PWA update mode is prompt; the service worker MUST NOT auto-reload when an M02 session, package
  operation, or unsaved M03 form is active.
- Sync retries only while the app is open/resuming; no background sync after browser closure.
  A conflict stops automatic retry (BR-M02-011).
- M01 MUST NOT claim a package is downloaded unless every declared image byte is present locally
  (FR-M01-008).

**Rationale:** False offline guarantees lead to field failures in low-connectivity environments where
the app is most needed.

---

### VII. Simplicity & MVP Scope Discipline

The MVP MUST remain focused; scope creep MUST be actively prevented.

**Rules:**

- New user-visible capabilities, roles, or domain concepts that are not traceable to a spec
  requirement MUST NOT be added.
- New implementation interfaces such as endpoints or RPCs MUST trace to an existing requirement
  and conform to approved architecture decisions.
- Implementation decisions (table names, indexes, API shape, storage bucket structure) belong to
  design artifacts; they MUST NOT silently introduce new business requirements.
- Won't items in MVP-Scope.md (advanced analytics, GPS navigation, real-time dashboards, custom
  roles, visitor accounts, AI scoring, file export, physical delete of audit data) MUST NOT be
  built in the MVP baseline.
- No message broker, background queue, cron, or scheduler is part of the MVP backend. Retry is
  client-driven from the local M02 queue; reports are query-on-demand.
- No automatic purge schedule for M03 canonical entities; archive/deactivation uses declared
  lifecycle states (DEC-S6-002).

**Rationale:** Every added concept increases test surface, integration complexity, and maintenance cost
before the product has been validated in the field.

---

## Module Ownership Boundaries

*(See Principle II for the ownership table. This section provides implementation guidance.)*

Module boundaries are **logical**, not deployment boundaries. All three modules live in one frontend
codebase and share one Supabase backend. The boundary is enforced by:

1. **IndexedDB store ownership** — M01 writes the shared stores; M02 reads them read-only. M02 owns
   its own session stores exclusively.
2. **RLS and RPC role guards** — M03 mutations require authenticated + authorized access.
3. **Edge Function validation** — Terminal session intake and Auth Admin calls pass through Edge
   Functions before reaching the database.
4. **Contract shape enforcement** — Typed adapters and Zod schemas at module boundaries reject
  malformed payloads before they reach business logic.

When a module needs data owned by another, it MUST use the declared contract, not reach into
another module's store or table directly.

---

## Contract & Traceability

Every behavioral contract between modules has:

- A **canonical name** defined in the producing module's spec.
- A **shape definition** in the relevant Input / Output contract section
  (spec-M01.md §5.3; spec-M02.md §5.1; spec-M03.md §5.1).
- A **consuming module** that reads the exact same shape and MUST NOT extend or redefine it locally.

When implementing or refactoring a contract:

1. Read the exact field table from the spec before writing any adapter or schema.
2. Every Required field MUST be present; every Conditional field MUST follow the stated condition.
3. All DateTime values are UTC. String identifiers are opaque and MUST NOT imply physical key format.
4. Any new field or constraint requires a spec amendment before it can be built.

**Traceability rule:** every document or implementation file that encodes a business rule MUST reference the
originating BR-* or FR-* ID in an adjacent comment or reference section.

---

## Security Principles

*(Implementation checklist — cross-reference Principle V for full rules:)*

- [ ] RLS policy exists for every table that M01/M02 reads publicly.
- [ ] Every M03 domain-data mutation uses the approved authenticated server-side boundary with
      role/status checks; Auth Admin and media operations follow the Edge Function and Storage
      boundaries defined in architecture.
- [ ] Edge Function validates SessionSyncRecord against the Zod schema before calling the RPC.
- [ ] No VITE_* variable holds a secret value.
- [ ] AuditRecord does not store credential, token, or raw password values.
- [ ] Last-active-Reviewer guard is inside a database transaction, not application code alone.
- [ ] Invitation and password recovery flows do not touch AdminAccount.role or AdminAccount.status.

---

## Testing & Validation

**Documentation rebaseline phase (V2 repository status):**

This repository is currently in a **documentation-only / spec-first** rebaseline phase. No application source code, SQL migrations, tests, or seed scripts are present.

Validation in this phase focuses on:

- Strict documentation consistency across Canonical Specs (spec-M01.md, spec-M02.md, spec-M03.md).
- Traceability of derived artifacts (Function lists, Architecture, Screen specs, Logical Data Model S1–S4, DAC).
- Data Acceptance Criteria catalog (data/08-data-acceptance-criteria.md) completion and review gate before physical schema design.
- Markdown structural integrity, link validation, and syntax validation for Mermaid/DBML diagrams.
- **Gate rule:** a validator, parser, or renderer MUST have been actually executed and returned a clean result before any artifact may be marked PASS. Claiming PASS without running the tool is not permitted.

**Validation expectations for future implementation layers (post-refactor):**

- Every BR-* rule MUST have a corresponding test executable in CI.
- Contract shape tests MUST cover Required/Conditional/Optional presence rules from spec §5.1.
- Atomic operations (handoff write, session replace, publication) MUST have transaction rollback
  tests.
- Security tests MUST verify that unauthorized roles cannot call protected RPCs/Edge Functions.
- Offline tests MUST verify that a CHUA_HOAN_TAT candidate never becomes the active package.
- Free-visitor path MUST be verified to produce zero PlaySession, CheckpointVisit, or
  SessionSyncRecord records.

---

## Governance

**Authority:** This constitution governs engineering process, quality, security, and implementation
discipline. It does not override product behavior or contract definitions in
docs/spec/spec-M01.md, spec-M02.md, or spec-M03.md. Technical implementation details not
covered by the module specs follow the architecture documents in priority order:
system-configuration.md, tech-stack.md, environment.md.

**Amendment procedure:**

1. Identify the principle(s) affected and classify the change:
   - **MAJOR** → bump to next major version: remove or redefine an existing principle; change a
     module ownership boundary; remove a canonical contract.
   - **MINOR** → bump minor: add a new principle, section, or material guidance expansion.
   - **PATCH** → bump patch: clarification, wording, or non-semantic refinement.
2. Draft the amendment as a minimal diff showing old and new text.
3. Update LAST_AMENDED_DATE and CONSTITUTION_VERSION.
4. Include a Sync Impact Report (modified/added/removed sections, any TODO placeholders).
5. Flag all downstream derived artifacts that reference the changed principle for review.

**Compliance review:**

- Every implementation PR or documentation change must be reviewed against the principles in this constitution.
- Any implementation choice that cannot be traced to a spec requirement must be flagged before
  merging.
- AGENTS.md rules (minimal diff, no invented requirements, read spec before editing) apply to
  every agent and human contributor equally.

**Guidance files for documentation and development:**

| Purpose | File |
|---------|------|
| Behavioral and contract baseline | docs/spec/spec-M01.md, spec-M02.md, spec-M03.md |
| Agent workspace rules | AGENTS.md |
| Product scope boundaries | MVP-Scope.md |
| Data model source of truth | data/04-data-model.md |
| Data acceptance criteria catalog | data/08-data-acceptance-criteria.md |
| Physical schema baseline | data/06-physical-schema.md |
| Runtime topology | docs/architecture/system-configuration.md |
| Technology choices | docs/architecture/tech-stack.md |
| Environment config | docs/architecture/environment.md |

---

**Version**: 2.0.1 | **Ratified**: 2026-10-02 | **Last Amended**: 2026-10-28