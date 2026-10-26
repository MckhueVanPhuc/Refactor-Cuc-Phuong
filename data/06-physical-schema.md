# Physical Schema and Storage — Cúc Phương Quest

## 1. Scope and authoritative artifacts

This design implements the completed [S6 review](05-review.md), [S4 logical model](04-data-model.md), module specs and [runtime placement](../docs/architecture/system-configuration.md). The canonical entity count remains 16: nine backend entities and seven browser-local entities.

| Artifact | Responsibility |
|---|---|
| [SQL migrations](../supabase/migrations/) | Authoritative PostgreSQL tables, constraints, indexes, projections, RLS and Storage policies |
| [Field mapping](schema/field-mapping.md) | Every CSV contract column mapped to SQL or local values; generated from the canonical CSV headers |
| [Local database](../src/data/local-db.ts) | Dexie schema version 1 and transactional persistence operations |
| [Contract schemas](../src/data/contracts.ts) | Strict TypeScript/Zod shapes for local and terminal transport boundaries |
| [Seed generator](../tools/build-seed.mjs) | Deterministic SQL/local fixture output from the existing 17 CSV files |
| [Validation report](07-storage-validation.md) | Executed checks and runtime coverage limits |

Migrations own the physical representation; specs own behavior; S4 remains authoritative for logical fields.

## 2. Naming and physical types

SQL schemas are `app` (private canonical data/helpers) and `api` (exposed safe views and explicitly granted functions). Configure the hosted Data API to expose only `api` in each Cloud project Dashboard; `supabase/config.toml` contains CLI migration/seed metadata and does not apply hosted API settings. Tables and columns use `snake_case`; transport and IndexedDB values retain the exact `camelCase` contract names. Public views return a `payload` object plus lookup columns; adapters extract `payload` without renaming its fields.

| Logical type/presence | PostgreSQL | Browser representation |
|---|---|---|
| String identifier/content | `text`; no arbitrary length limit | `string` |
| UUID | `uuid` for Media/SessionRecord | Validated UUID string for session/handoff |
| Integer | `integer` | Integer-valued number |
| Decimal | `numeric`, without a lossy scale | Number at the existing transport boundary |
| Boolean | `boolean` | Boolean |
| UTC DateTime | `timestamptz` | Validated UTC ISO string |
| Enum | `text` plus explicit `CHECK` | Zod enum/string union |
| Route tag arrays | `text[]` with allowed values | Contract arrays |
| Frozen aggregate/object | `jsonb`, with strict snapshot/visit validation | Structured-cloned contract object/array |
| Required | `NOT NULL` | Required property |
| Optional | Nullable column | Absent property, not a null placeholder |
| Conditional draft field | Nullable until its source publication/activation guard applies | Validated at operation boundary |

`name.vi` maps to `name_vi`, and likewise for the fixed bilingual Route fields. Nested JourneySnapshot checkpoints and SessionRecord visits remain inside their owning immutable JSONB aggregates. They have no FK to mutable content/QR/checkpoint labels. Scalar ownership and mutable entity references are relational; the JSONB aggregates preserve historical payload boundaries rather than adding new canonical entities. Logical nested paths remain documented in S4.

## 3. Backend tables and keys

| Canonical entity | Table | PK | Other identity/reference rules |
|---|---|---|---|
| Route | `app.routes` | `route_id` | Deferred composite FK `(route_id, active_content_version)` to snapshot |
| Checkpoint | `app.checkpoints` | `checkpoint_id` | Route FK; unique `(route_id, sequence)` for non-archived rows |
| QRCode | `app.qr_codes` | `qr_identifier` | Checkpoint FK; retired identity cannot be reactivated |
| CheckpointContent | `app.checkpoint_contents` | `(checkpoint_id, language_code, revision)` | Checkpoint FK; submitter/approver reference unique AdminAccount `user_id`; one published revision per language |
| Media | `app.media` | `media_id` | Checkpoint FK; publishing requires confirmed usage rights |
| JourneySnapshot | `app.journey_snapshots` | `(route_id, content_version)` | Route FK; optional deferred same-Route predecessor FK; inverse is not unique |
| AdminAccount | `app.admin_accounts` | normalized `email` | Conditional unique `user_id`; provider identity remains external |
| SessionRecord | `app.session_records` | `session_id` | Route FK; frozen version and visits; no browser-session FK |
| AuditRecord | `app.audit_records` | `audit_id` | Optional actor FK; generic target type/ID is historical evidence, not a polymorphic FK |

AdminAccount `user_id` remains `text` because the spec declares an opaque String and the canonical seed includes synthetic provider IDs. Runtime authorization compares it to `auth.uid()::text`. Pending invitation has no linked identity. No FK to `auth.users` is added: provider deletion must not delete operational accounts or audit history. Seed identities do not create real Auth users.

All backend deletion is restricted by grants, FKs and delete-rejection triggers (M03 §6.4 DEC-S6-002). Immutable snapshot/session/audit updates are rejected. QR/content/route/checkpoint/account state changes are checked against declared lifecycle transitions. Stable entity identities and ownership cannot be edited. Mutable concurrency revisions must advance by exactly one; command writers also use `WHERE concurrency_revision = expected` and treat zero affected rows as stale.

### Technical storage fields

These fields represent approved source/working copies; they are not new canonical entities or transport attributes:

| Field | Purpose | Source |
|---|---|---|
| Route `published_payload` | Last approved public metadata object, isolated from incomplete editable Route columns. Status/active version are composed from canonical columns at read time. | BR-M03-001/004/007 |
| Checkpoint/QRCode/Media `draft_state` | Pending field changes without altering currently published source columns. Contains the owning entity's contract fields. | M03 US-M03-02; FR-M03-005–009 |
| Route/Checkpoint/QRCode/Media `review_state` | Embedded submission/approval/rejection evidence for the owning pending revision; never a public field. Command code validates the envelope and maker-checker before applying it. | HC-003; BR-M03-002/014 |

The schema does not expose direct authenticated DML. Complete administrative command handlers must enforce review evidence, expected revision, actor permissions and audit append in the same transaction when integrated with the application. The data scaffold is not a completed administration application.

### Indexes

Primary and unique indexes implement the declared identities. Additional indexes cover checkpoint route/order, QR checkpoint, media checkpoint, snapshot predecessor, session `(ended_at, route_id)` and `(route_id, ended_at)`, and audit actor/target/time. The two session indexes support global date reports and route-filtered date reports without indexing visitor identifiers. Snapshot/resource JSON is not indiscriminately GIN-indexed.

## 4. Integrity and transaction boundaries

| Operation | Database boundary | Spec source |
|---|---|---|
| Publish/replace journey | One transaction writes approved source, inserts immutable full snapshot, advances Route active version and appends audit. Deferred checks compare active snapshot against every active checkpoint, QR set and offline content/image source. Failure rolls back all writes. | BR-M03-003–007 |
| Replace active QR | Insert new QR and retire old QR together; active-checkpoint QR/content checks run at commit. | BR-M03-009/010 |
| Publish bilingual revisions | Archive previous revisions and promote approved revisions together; maker-checker and one-current-revision checks apply. | BR-M03-002/003 |
| Close/reopen | Server command applies permission, reason/safety checks and deterministic route outcome; journey/public-state changes satisfy the same deferred publication checks. | BR-M03-011/012 |
| Account mutation | Statement lock serializes account changes; identity and last-active-Reviewer checks run in the transaction. Provider invitation/callback remains a separate Auth operation. | BR-M03-015/018–020 |
| Terminal intake | Service-only `api.ingest_session(record jsonb)` validates whitelist/privacy/time/visit shape, inserts once, compares normalized immutable business data on retry and returns `ACCEPTED`, `IDENTICAL` or `CONFLICT`. | BR-M03-016; M02 §5.1 |

Published snapshots are inserted only as `DA_CONG_BO`; `DANG_TAO` is construction inside the publication operation and is not an exposed partial database row. Historical snapshots are validated structurally without requiring their old values to match current live sources. Session intake preserves historical names/version/sequence rather than revalidating them against current journey content. JSON keys, visit ordering and equivalent UTC timestamp spellings are normalized for retry comparison; `ingested_at` is excluded and remains the original receipt time. The intake function sets its own `TimeZone` to UTC while it converts visit timestamps to persisted JSON; the caller's timezone is restored on return.

Reports read SessionRecord only. Date predicates use `ended_at >= fromDate::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh'` and `ended_at < (toDate + 1)::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh'`. Both dates are supplied together, with the most recent 30 days as the default. RPT-02 groups by historical `(route_id, checkpointId)`; name and sequence come from the latest-ended record in the period, using `session_id` as a deterministic tie-break. Report query/UI handlers belong to application integration.

## 5. RLS, grants and public projections

| Actor | Public route/snapshot/live view | Canonical admin reads | Direct domain writes | Terminal intake RPC | Media objects |
|---|---|---|---|---|---|
| `anon` | Allowed, projection only | Denied | Denied | Denied | Approved live/retained snapshot references only |
| Authenticated without active M03 account | Public views | Own account status only | Denied | Denied | Public references only |
| Active CONTENT_STAFF | Allowed | Canonical operational/report data and own account | Denied; use authenticated command handlers | Denied | Read approved data/private admin objects; insert new object |
| Active REVIEWER | Allowed | Operational/report data and account management reads | Denied; use Reviewer-checked command handlers | Denied | Same read/insert; no overwrite/delete policy |
| Server `service_role` | Allowed | Server-side | Required insert/update grants; immutable/lifecycle constraints still apply | Allowed | Platform server privileges; never a browser key |

Every `app` table has RLS. `api.admin_*` views use `security_invoker=true`; live role/status is looked up from AdminAccount, not from a user-supplied role or stale JWT metadata. Public views deliberately execute as their owner over private tables, use `security_barrier=true`, whitelist fields and filter lifecycle states. No default public function execution is retained. The elevated service role remains a trusted server boundary and must not be handed unvalidated arbitrary SQL/commands.

`quest-media` is a private Storage bucket. Its policies permit new uploads by active administrators, forbid client overwrite/deletion, and permit reads for current published references or images retained inside snapshots. Upload and verify bytes before database publication; a failed upload must not change public state. The seed contains resource references only, not actual uploaded media. `source_ref` is the bucket-relative object path; the application resolves the Storage URL at its media adapter.

## 6. IndexedDB schema version 1

One Dexie database, `cuc-phuong-quest`, exists per browser origin/profile. Neither app version nor journey `contentVersion` changes the Dexie schema version. Cache Storage remains reserved for app shell/static/i18n assets.

| Store | Key/index | Owner and value |
|---|---|---|
| `languagePreference` | PK `slot = current` | M01 singleton; `languageCode` |
| `selectedRouteContext` | PK `slot = current`; unique `handoffId` | M01 v2 contract; M02 read-only |
| `offlinePackages` | PK `[routeId+contentVersion]`; `routeId` index | M01 ready package/manifest |
| `offlineResources` | PK `[routeId+contentVersion+checkpointId]`; package and route indexes | M01 bilingual text/image references |
| `playSessions` | PK `sessionId`; unique `sourceHandoffId`; `status` index | M02 frozen journey/session |
| `checkpointVisits` | PK `[sessionId+checkpointId]`; `sessionId` index | M02 first check-in |
| `pendingSyncItems` | PK `sessionId`; `syncStatus` index | M02 immutable record and mutable delivery status |
| `activePackages` | PK `routeId` | Technical pointer to one ready package |
| `packageCandidates` | PK `routeId` | Technical staging bundle with operation token; not exposed to M02 |
| `imageBytes` | PK `[routeId+contentVersion+checkpointId+sourceRef]`; package/route indexes | Technical Blob storage for OfflineResource; URL alone is insufficient |

The three technical stores and singleton `slot` fields are physical representation of existing entities. They do not add canonical entities or transport properties.

- **M01:** save preference independently; replace current authorized context atomically; revoke only current context on discovered closure. Source validation for online Start happens before writing the handoff.
- **Package preparation:** download outside the transaction; validate full manifest, exact offline-resource set and readable Blob bytes; stage with an operation token. Activate only the current token in one transaction covering candidate, package, resources, bytes and active pointer. Replace old ready values only when activation succeeds. Serialize download/update commands per Route in the caller; stale activation tokens are rejected.
- **Local delete:** remove package/resources/bytes/candidate/pointer in one transaction. Preserve handoff, sessions, visits and queue. A deleted candidate cannot later activate with its old token.
- **M02 start/replacement:** read current authorized handoff and check uniqueness inside the transaction. Add the new session, abandon any running session and create its immutable queue item atomically. A failing insertion preserves the old session. Writes to the shared session store serialize competing tabs.
- **Check-in:** insert once by session/checkpoint; retain first timestamp and QR. Content fetching occurs after commit. Outside-journey QRs do not write visits.
- **Finish:** require explicit confirmation and final checkpoint visited; skipped earlier checkpoints are allowed. Terminal session and queue are committed together. Network failure preserves `PENDING`; a conflict stops automatic retry.
- **Recovery:** reopen the same DB, restore the running session and pending queue. No reset-on-app-update or remote recovery is introduced. M02 never writes M01 values through its persistence API.

## 7. Migration and seed execution

Migration order:

1. `20260930000100_core.sql`: schemas, nine tables, keys, base immutability/revision/account guards.
2. `20260930000200_integrity_access.sql`: structured-value validation, grants/RLS, public/admin projections and session intake.
3. `20260930000300_publication_storage.sql`: public metadata and active snapshot checks, private media bucket/policies.
4. `20260930000400_identity_lifecycle.sql`: stable identities/lifecycle and final function grants.
5. `20260930000500_session_intake_utc.sql`: pin UTC inside terminal intake so visit timestamp normalization does not depend on the service connection's timezone.

Each migration is transactional. The linked Preview Cloud project receives migrations in order through `db push`. Optional [seed.sql](../supabase/seed.sql) runs separately on an empty disposable non-production fixture project in one deferred-constraint transaction. Source CSVs remain canonical. The generator also produces local JSON fixtures; those fixtures are not automatically imported into a visitor's database. Blob tests create synthetic bytes explicitly; CSV media references are not treated as completed real downloads.

Commands, prerequisites and recovery are in [supabase/README.md](../supabase/README.md). Do not edit generated seed/mapping/fixtures by hand. Preserve deployed migration history and append corrective migrations after deployment; fresh disposable non-production projects can replay the baseline; remote reset is not part of the workflow. No hosted environment has been provisioned or changed by this work.

## 8. Technical references

- [Supabase RLS and view privileges](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Cloud migrations](https://supabase.com/docs/guides/deployment/database-migrations)
- [Hosted custom schema exposure](https://supabase.com/docs/guides/api/using-custom-schemas)
- [Dexie schema and indexes](https://dexie.org/docs/Version/Version.stores())
- [Dexie transaction boundaries](https://dexie.org/docs/Dexie/Dexie.transaction())
- [PGlite test runtime](https://pglite.dev/docs/api)
