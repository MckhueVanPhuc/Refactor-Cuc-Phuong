# S6 Model Review & Spec Handover — Cúc Phương Quest

## 1. Document Metadata

| Field | Value |
|---|---|
| Session | 5 — Data Modeling |
| Stage | S6 — Quality Go / No-Go Review |
| Behavioral baseline | [Spec M01](../docs/spec/spec-M01.md), [Spec M02](../docs/spec/spec-M02.md), [Spec M03](../docs/spec/spec-M03.md) |
| Reviewed artifacts | [S1 Entity Dictionary](01-entity-dictionary.md), [S2 CRUD Matrix](02-crud-matrix.md), [S3 ERD](03-erd.mmd), [S3 Review](03-erd-review.md), [S4 Logical Model](04-data-model.md), [S4 DBML](04-data-model.dbml), [S5 CSV package](seed/scenario-coverage.csv) |
| External process guide | `1790150794938_Data Model.pdf`, pp. 23–33; guidance for review, not a source of product behavior |
| Status | PASS — S6 complete; ready for physical schema/storage design |

The three module specs own behavior and logical contracts. Final logical decisions are recorded in M03 §6.4 and summarized in §4 below. Physical table/column names, storage types, indexes, migrations and policy syntax belong to the next design stage. The repository remains documentation-first.

## 2. Stage Evidence and Gate Record

| Stage | Evidence | Review result |
|---|---|---|
| S0 input pre-flight | S1 §1–2 maps FUNCTIONS, FIELDS, ENTITIES, RULES, SCENARIOS and FLOWS to the three specs/function lists. Contract fields carry logical types and Required/Optional/Conditional presence; stable FN/FR IDs and stored-data rules exist. | PASS for the current three-module baseline. No consolidated spec document is assumed. |
| S1 entity consolidation | S1 Table A contains 16 canonical entities; Table B keeps `AdministrativeRevision` implied; Table C records HC-001–HC-004. Human Gate 1 acceptance is recorded in S1 §9. | PASS. No new canonical entity was added by this repair. |
| S2 CRUD/anomalies | S2 has 25 FN rows × 16 entity columns. Recount: C=25, R=73, U=18, D=2. Required anomaly categories are reported; `ANOM-S2-001` is accepted as intentional append-only audit behavior. Metadata and final S2 gate agree. | PASS; all anomaly dispositions are final. |
| S3 conceptual ERD | 21 confirmed links are cataloged/drawn; REL-014 and REL-019 are explicitly time-bound lineage. REL-021 has an optional predecessor and zero or many successors. The preview Mermaid block matches `03-erd.mmd`. | PASS; both directions of every relationship are resolved. |
| S4 logical model | All 16 canonical entities and 160 logical attribute paths remain modeled with source references. Freeze, delete, enum and integrity reviews are present. DBML contains 16 entity blocks; REL-014/REL-019 are notes instead of ongoing `Ref` links. | Logical review complete. Relational normalization and physical keys are not asserted by this mixed backend/local logical model. |
| S5 seed package | 17 CSV files contain 95 data records, including 11 scenario rows: 5 `ORD`, 1 `BND`, 1 `EMPTY`, 4 `EXC`. `Spec refs` maps every scenario to existing FR IDs. The reproducibility/integrity script validates headers, references, selected business invariants and byte output in a temporary directory. | Fixture validation PASS. Subsequent migrations and runtime checks are recorded in [Storage Validation](07-storage-validation.md). |

The guide's “≥5 ordinary rows” is applied to the seed package's ordinary scenario category. Applying it independently to every CSV would conflict with the source-declared singleton `LanguagePreference` and current `SelectedRouteContext` constraints (M01 §6.4). `Rows Runnable = YES` in the coverage CSV means the referenced fixture rows exist; it is not evidence that a database loader or end-to-end scenario was executed.

## 3. S6 Quality Assessment

| Criterion | Result | Evidence and limit |
|---|---|---|
| Completeness | PASS for logical scope | 16/16 canonical entities are represented; the M01/M02/M03 field inventory and the 16 entity CSV headers align with S4. Transport/view/report concepts remain distinct from canonical entities. Physical storage mapping is a later deliverable. |
| Correctness | PASS | `R-ANCIENT-TREE` uses `TIME_VUA` for 180 minutes (M01 §5.3; M03 §5.1), and the seed checker enforces the declared time bands. Historical handoff and accepted-session lineage do not imply a continuing parent reference. REL-021 and MVP retention are finalized in M03 §6.4. |
| Minimality | PASS | The S1 entity set remains 16; `SessionSyncRecord`, published content, frozen manifests and report outputs are not promoted into new entities. No physical convenience field was added. |
| Readability | PASS at source level | S3 keeps only entity links and distinguishes lineage in the relationship catalog; S4 keeps attribute detail and explains DBML representation limits. Mermaid render was not revalidated in this review. |
| Extensibility | PASS for MVP | Versioned snapshots/packages and immutable session copies preserve history. Stable logical identities remain unchanged; M03 data is retained without MVP hard-delete/purge. Future product scope requires a new specification change. |
| Integration | PASS for declared contracts | M03→M01 route/snapshot, M01→M02 preference/handoff/ready package, M03→M02 live content, and M02→M03 `SessionSyncRecord` remain aligned. M03 `SessionRecord` survives independently of browser-local M02 data. |
| Traceability | PASS for modeled scope | S4 attribute rows cite source sections; S3 links cite S1/spec; S2 cells cite FN/FR; S5 scenario rows now cite existing FR IDs. The external guide was not used to invent a product field or rule. |

## 4. Finalized Decisions

| ID | Status | Source and impact | Final decision |
|---|---|---|---|
| CL-S4-001 / REL-021 | RESOLVED | M03 §6.4; S3 catalog/ERD and S4 model/DBML. | Zero or one same-Route predecessor per snapshot; zero or many successors per predecessor. No inverse uniqueness. Atomic publication and at most one active version per Route remain required. |
| DEC-S6-002 | RESOLVED | M03 §6.4; S4 delete/integrity review. | Retain all M03 canonical records in MVP, including SessionRecord visits; no hard-delete or automatic purge. M01 package deletion and browser-local lifecycle remain unchanged. |
| HG-S6-001 | CLOSED | S1 naming/identity decisions, S2 anomaly dispositions, S3 forward/reverse catalog, S5 fixture checks and the seven S6 quality criteria. | All logical review decisions are complete. S6 passes for schema design. This is the final artifact review result; it does not assert separate reviewer signatures or executed runtime tests. |

There are no outstanding logical-model decisions or clarification items. The 16 canonical entities and their spec-declared logical identities are final for this MVP baseline; no additional business attribute is needed to manufacture a natural key. Relational normalization and physical representation are deliverables of the next stage.

## 5. Validation Performed and Limits

| Check | Result |
|---|---|
| `tools/generate_seed.py` with local Python 3.14 | PASS: 17 CSV, 95 records, byte-for-byte temporary reproduction and the listed fixture integrity assertions. |
| Recount S2 CRUD, S3 relationship IDs/edges, DBML table/reference inventory, Mermaid source/preview equality and S4/CSV field names | PASS by read-only structural scripts; counts and matching are documented here and in the source artifacts. |
| `git diff --check` | PASS. |
| DBML parser and Mermaid renderer for this revision | NOT RUN: neither `@dbml/core` nor `mermaid` is locally available. The earlier S4 parser result applies only to its earlier revision. |
| Database load, FK enforcement, atomicity, idempotency and browser/backend integration | Outside the S6 logical review. Subsequent migration/seed and transaction results are recorded in [Storage Validation](07-storage-validation.md); CSV assertions alone do not prove runtime guarantees. |

## 6. S6 Decision and Next Design Boundary

**S6 REVIEW RESULT: PASS — GO for physical schema/storage design.** Logical review and all recorded decision items are complete.

The next design maps the nine M03-owned canonical entities to backend persistence and the seven M01/M02-owned canonical entities to browser-local persistence according to [system configuration](../docs/architecture/system-configuration.md). It defines relational normalization, physical names/types/keys, enforceable references versus historical IDs, migration ordering, privacy/authorization and seed loading with source traceability. Those physical artifacts precede backend implementation and are outside this S6 change set.

The subsequent physical design is available in [06-physical-schema.md](06-physical-schema.md), with executable migrations, local persistence and the validation scope recorded separately.
