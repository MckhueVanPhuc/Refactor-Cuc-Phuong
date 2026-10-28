# S6 Model Review & Spec Handover — Cúc Phương Quest

## 1. Document Metadata

| Field | Value |
|---|---|
| Session | 5 — Data Modeling |
| Stage | S6 — Quality Go / No-Go Review (V2: logical-model and Data Acceptance Criteria review gate) |
| Behavioral baseline | [Spec M01](../docs/spec/spec-M01.md) v3.2 (clarification 2), [Spec M02](../docs/spec/spec-M02.md) v3.3, [Spec M03](../docs/spec/spec-M03.md) v3.7 (clarification 4) |
| Reviewed artifacts | [S1 Entity Dictionary](01-entity-dictionary.md), [S2 CRUD Matrix](02-crud-matrix.md), [S3 ERD](03-erd.mmd), [S3 Preview](03-erd-preview.md), [S3 Review](03-erd-review.md), [S4 Logical Model](04-data-model.md), [S4 DBML](04-data-model.dbml), [Data Acceptance Criteria](08-data-acceptance-criteria.md) |
| Process reference | [Runbook](../M03_Documentation_Refactor_Runbook_v2.md) §7 (P9), §7.2 and §7.3; hosting and test-data policy in Runbook §1.3 |
| Baseline history | The V1 review (based on the V1 specs, a 17-file seed package and executed storage checks) is superseded. No V1 conclusion or number is reused here; every figure below was recounted from the V2 artifacts. |
| Status | PASS — S6 (V2) review accepted 2026-10-28; ready for physical schema design, with the NOT RUN items listed in §5 |

The three module specs own behavior and logical contracts. This review judges whether S1–S4 and the DAC are good enough to start the Physical Schema; it adds no product requirement. Physical table/column names, storage types, indexes, migrations and policy syntax belong to the next stage. At the time of this review the repository was documentation-only; code scope was opened afterwards (see AGENTS.md §2).

## 2. Stage Evidence and Gate Record

| Stage | Evidence | Review result |
|---|---|---|
| S0 input pre-flight | S1 §1–2 maps functions, fields, entities, rules, scenarios and flows to the specs. Function lists: M01 = 7 FN / 50 SF, M02 = 8 FN / 55 SF, M03 = 11 FN / 113 SF (26 FN, 218 SF). Every cited FR/BR/SF/FN ID resolves in the specs or function lists; only intentional historical mentions of retired IDs remain (SF-M03-008-13 in S2, BR-M03-001…020 in S4 §9.1). | PASS |
| S1 entity consolidation | 16 canonical entities (M01 = 4, M02 = 3, M03 = 9): ENT-DATA-001–003 and 005–017; ENT-DATA-004 is retired and not reused. HC-001–HC-007 are resolved or superseded. | PASS |
| S2 CRUD/anomalies | 26 FN rows × 16 entity columns. Recount: C = 31, R = 98, U = 27, D = 2. The matrix agrees with every evidence table (0 mismatches). The only D operations are the confirmed M01 package/resource deletions. `ANOM-S2-001` is resolved. | PASS after corrections RV-003 and RV-007 |
| S3 conceptual ERD | 30 REL IDs: 25 active, 5 retired (REL-001, 003, 008, 009, 013). `03-erd.mmd` draws 25 edges and 16 entities; the preview Mermaid block is identical to the source. Both directions of every active relationship are catalogued; REL-014 and REL-019 are lineage, REL-029 is a validation reference. | PASS after RV-002 |
| S4 logical model | 16 entities and 250 attribute paths. DBML has 16 tables, the same 250 paths per entity, 16 `Ref` statements and 9 links kept as notes (16 + 9 = 25 active links). Types and presence of the contract entities equal the spec tables. | PASS |
| DAC | 118 criteria (M01 = 18, M02 = 11, M03 = 89); `SOURCE-BACKED` = 118, `TBD-HUMAN` = 0, no `TECHNICAL-ONLY` or `DEPRECATED` rows. 243 of 250 S4 paths have at least one criterion; the other 7 are explicit "no source rule beyond S4 type/presence". The 27 numeric constants named in the DAC equal the values in M03 §5.3. T1–T8 are all resolved. | PASS after RV-004–RV-006 |

## 3. S6 Quality Assessment

| Criterion | Result | Evidence and limit |
|---|---|---|
| Completeness | PASS | 16/16 canonical entities modeled with owner, identity, lifecycle and source references; 26/26 functions have CRUD coverage; no function without an entity and no entity without a function. |
| Correctness | PASS | Enums, lifecycles, presence and the 27 DAC constants match the specs. M03 §6.4 now states that `AdminAccount.userId` is unique when present, so S1, S4, DBML and DAC-M03-070 are source-backed (RV-001). |
| Minimality | PASS | No entity, field, relationship or rule without a source. `SessionSyncRecord`, published content, frozen manifests and report outputs are not promoted to entities. RecommendationContext is a transient context (HC-007). |
| Readability | PASS at source level | Catalogs and tables are consistent; link check of the reviewed files found no broken relative link. Mermaid render and DBML parse: NOT RUN (§5). |
| Extensibility | PASS for MVP | Immutable snapshots, revisions and frozen session copies preserve history; M03 retains all canonical records without hard-delete or purge (DEC-S6-002). Future scope needs a spec change. |
| Integration | PASS | The five producer/consumer contract pairs (JourneySnapshot, Published Route, SelectedRouteContext v3, SessionSyncRecord, Live QR lookup) are identical in field names, types and presence across M01, M02 and M03. `SessionSyncRecord` (transport) and `SessionRecord` (M03 entity) stay distinct. |
| Traceability | PASS | S4 rows cite spec sections; S3 links cite S1/spec; S2 cells cite FN/FR/SF; DAC rows cite spec sections and BR IDs; every MSG key used by the DAC exists in M03 §5.6. |
| DAC coverage | PASS | See §2 DAC row. DAC creates no requirement: every limit is a spec constant. Boundary classes are listed per criterion in DAC §5.2; evidence is PENDING (§5). |
| Count consistency | PASS | S1, S2, S3, S4 and DAC agree: 16 entities, 26 FN, 218 SF, 30/25/5 REL, 25 ERD edges, 250 S4 paths = 250 DBML paths, 118 DAC. |
| Hard rules (AGENTS §5) | PASS | No invented type, key, nullability, uniqueness, cardinality or delete behavior. Archive, withdraw, revoke and discard are not D. DBML type labels are visualization only (S4 §12). |

## 4. Finalized Decisions

| ID | Status | Source and impact | Final decision |
|---|---|---|---|
| RV-001 | RESOLVED | M03 §6.4 (v3.7 clarification 3); S1 HC-001, S4 AdminAccount, DBML, DAC-M03-070. | `AdminAccount.userId` is unique system-wide when present (one provider identity per account). Derived artifacts keep "unique", now source-backed. |
| RV-002 | RESOLVED | M01 §6.1 ER versus S3 REL-013; S3 REL-011 and REL-030; S4 and DBML. | REL-013 stays retired. REL-030 `Checkpoint 1 : 0..* OfflineResource` (via `checkpointId`) follows the M01 ER; REL-028 stays for the QR side. REL-011 stays `1 : 0..*`; the M01 `has_active` link is its active subset. |
| RV-003 | RESOLVED | S2 FN-M03-003 (SF-M03-003-04) and FN-M03-006 (SF-M03-006-12) name an audit effect. | `AuditRecord` C added to both functions; S2 totals and ownership table corrected; S1 §8 aligned. SF-M03-004-04 is not assigned a JourneySnapshot C (it only mentions replacement versions as a guard). |
| RV-004 | RESOLVED | DAC §3 header (count of rows outside S4) and DAC-M03-089. | Nine rows are outside S4 (DAC-M03-081–086, DAC-M01-017, DAC-M01-018, DAC-M02-011). DAC-M03-089 added; total 118. |
| RV-005 | RESOLVED | Runbook §7.3.4 and §7.3.9; DAC §5.2. | A boundary matrix per criterion is part of the DAC. Evidence is PENDING downstream; no evidence is claimed. |
| RV-006 | RESOLVED | S1 HC-007; M01 §6.2, §6.4. | RecommendationContext is a transient context, not a canonical entity. |
| RV-007 | RESOLVED | M03 v3.7 clarification 4 (§5.6 message catalog, §5.1 RPT-02 `routeName`, BR-M03-J07, BR-M03-K06); S2 FN-M03-010; S1 Revision; DAC-M03-068, 085, 086. | Downstream sync after the message catalog was completed, sign-out was added and RPT-02 gained a display `routeName`. S2: FN-M03-010 gets a direct read of Revision (R = 98; C, U, D unchanged). No entity, field, relationship, S4 path, DBML path or DAC count changes (still 16 entities, 26 FN, 218 SF, 118 DAC). Sign-out is part of SF-M03-008-01 and writes no audit line; SF-M03-008-13 stays retired. Reviewed by reading and cross-checking IDs; no parser or renderer was run (NOT RUN). |
| DEC-T5–T7 | RESOLVED | M03 §5.3, §5.1, §6.1.1, BR-M03-E02, T09, J05, L01, §10 (v3.7 clarification 3); M01 §5.3; DAC-M03-032, 034, 041, 085, 089. | Provisional limits: `ROUTE_DISTANCE_MAX_KM` 100 (one decimal place), `ROUTE_DURATION_MAX_MIN` 1440, `ROUTE_CHECKPOINTS_MAX_ITEMS` 30, `CHECKPOINT_QR_MAX_ITEMS` 20 (not `THU_HOI`), `REPORT_MAX_SPAN_DAYS` 366; tag values distinct; no separate limit on visits per session. |
| DEC-S6-002 | RESOLVED | M03 §6.4, §10. | Retain all M03 canonical records in MVP; M03 §10 wording aligned. |
| HG-S6-001 | CLOSED | All criteria in §3. | The logical-model and DAC review gate passes for Physical Schema design. This is an artifact review result; it does not assert reviewer signatures or executed runtime tests. |

There are no blocking `TBD-HUMAN` items and no `[NEEDS CLARIFICATION]` markers in the specs, S1–S4 or the DAC.

## 5. Validation Performed and Limits

| Check | Result |
|---|---|
| Recount of S2 CRUD, S3 REL IDs and ERD edges, DBML tables/paths/`Ref`, S4 paths, DAC rows and coverage | PASS by read-only structural scripts; the counts are stated in §2. |
| Cross-checks: ID existence, producer/consumer contract tables, S4 types/presence against spec tables, DAC constants, MSG keys, relative links of the reviewed files | PASS. |
| Mermaid source/preview equality and structural edge check (25 edges, 16 entities) | PASS as a structural check only. |
| `git diff --check` | PASS. |
| DBML parser | NOT RUN: no local `@dbml/core`; nothing was installed. |
| Mermaid renderer | NOT RUN: no local `mermaid`/`mmdc`. |
| Boundary-case evidence for DAC §5.2 | NOT RUN: PENDING. The V2 documentation set has no test or fixture artifacts; the cases run locally on synthetic data in a later implementation phase. |
| Seed, storage and runtime validation | Outside the V2 documentation set. No remote action was taken; the single Supabase and single Vercel project are untouched (Runbook §1.3). |

## 6. S6 Decision and Next Design Boundary

**S6 REVIEW RESULT: PASS — GO for physical schema design.** Findings RV-001–RV-006 and the limits T5–T7 were resolved in the canonical specs first and then synchronized to S1–S4 and the DAC. No blocking item remains.

The next design maps the nine M03-owned canonical entities to the single Supabase backend and the seven M01/M02-owned entities to browser-local persistence according to [system configuration](../docs/architecture/system-configuration.md). [06-physical-schema.md](06-physical-schema.md) was rebuilt from S4 and the DAC after this gate (2026-10-28). It does not inherit the DBML type labels, carries the spec limits of M03 §5.3 only as named constants, adds no seed data and applies nothing to the shared backend (Runbook §1.3). It is a design baseline, not an implemented or tested schema; its three former open items were decided and recorded in M03 (§14).

Artifacts outside this review that still carry stale content: the screens (not re-synchronized to the new limits and messages) and the constitution's Sync Impact Report. They are not changed here.
