# AGENTS.md — Cúc Phương Quest (V2 Documentation Refactor)

## 1. Phạm vi và cách dùng

File này áp dụng cho toàn bộ repository Refactor-Cuc-Phuong. Mọi agent phải đọc file này trước khi đọc, sửa hoặc tạo artifact. Nếu sau này một thư mục có AGENTS.md riêng, file gần artifact hơn chỉ được bổ sung hoặc siết chặt quy tắc, không được âm thầm làm yếu các hard rule tại đây.

- Làm đúng phạm vi người dùng giao; không tự mở rộng sang stage, module hoặc artifact kế tiếp.
- Nếu yêu cầu hiện tại xung đột với file này hoặc với source of truth, dừng tại điểm xung đột và hỏi người dùng nguồn nào được phép thay đổi.
- Trả lời bằng ngôn ngữ người dùng đang dùng. Trong file, giữ ngôn ngữ, thuật ngữ, ID và phong cách hiện có.
- Ưu tiên minimal diff. Không rewrite toàn bộ tài liệu chỉ để chuẩn hóa văn phong hoặc format.
- Mọi hoạt động refactor tài liệu phải tuân thủ nghiêm ngặt quy trình trong [M03_Documentation_Refactor_Runbook_v2.md](M03_Documentation_Refactor_Runbook_v2.md).

## 2. Trạng thái repository

Đây là repository **spec-first** phục vụ rebaseline và refactor tài liệu Cúc Phương Quest V2. Bộ tài liệu V2 đã hoàn tất; từ 2026-10-28 repo mở phạm vi code theo quyết định của người dùng (xem bullet "Phạm vi code" bên dưới).

- **Phạm vi tài liệu hiện có:** Từ Layer 1 (Canonical Specifications) đến Layer 4 (Data Modeling & Physical Schema). Điểm kết thúc của bộ tài liệu hiện tại là [Physical Schema](data/06-physical-schema.md).
- **Phạm vi code (đã mở theo quyết định của người dùng):** application source trong `src/`, implementation packages trong `specs/` (Spec-Kit), và cấu hình Vite cùng Supabase local (`supabase/config.toml`, `supabase/seed.sql` chỉ dùng cho local), cùng workflow CI `.github/workflows/ci.yml` (người dùng duyệt 2026-10-30), và backend M03 **chỉ trên stack Supabase local** — SQL migrations, Edge Functions/RPC, pgTAP và script operator trong `supabase/` (change brief CHG-M03-2026-10-30-01, duyệt 2026-10-30), cùng Edge Function dịch của AI Integration và gói `specs/004-ai-translation/` (change brief CHG-AI-2026-11-03-01, duyệt 2026-11-03) — được phép, theo change brief và plan đã duyệt.
- **Phạm vi cloud (đã mở theo change brief CHG-M03-2026-11-05-01, duyệt 2026-11-05):** `vercel.json` và gói đo Vercel theo tasks M03 T202, T210. Áp migration, deploy Edge Function `session-intake`, `admin-accounts`, `translate`, đặt secret, cấu hình Supabase theo tasks M03 T203–T207: chỉ người vận hành cloud do chủ dự án chỉ định được chạy. Cấu hình Vercel (T203, T206): chỉ chủ dự án. Agent chỉ soạn lệnh, không chạy. Kiểm thử trên cloud (T208, T209) chỉ non-destructive và chỉ trên nội dung thật do quản trị viên nhập. Vẫn cấm seed, remote reset, test phá hủy và dữ liệu giả trên Shared Backend.
- **Không chứa downstream artifacts:** Các tài liệu downstream từ V1 như Field Mapping (data/schema/field-mapping.md), Seed Data (data/seed/**), Storage Validation (data/07-storage-validation.md), và các implementation packages cũ (specs/00*-*) không nằm trong bộ tài liệu V2. Package `specs/` mới chỉ được tạo theo change brief code.
- **HTML mockup:** chỉ là mockup tĩnh theo screen spec, đặt trong `screens/html/`; không chứa logic nghiệp vụ, gọi API hay dữ liệu thật.
- Ba module logic là:
  - **M01 — Route Planning & Preparation:** Ngôn ngữ, khám phá/chọn tuyến, recommendation, offline package và handoff.
  - **M02 — Field Quest Experience:** Phiên thực địa, journey cố định, QR check-in, content delivery và terminal sync.
  - **M03 — Operations & Content Administration:** Admin, content/review/publication, snapshot, live service, session intake và reporting.

M01/M02/M03 là ba module logic trong một modular monolith, không phải ba deployment hoặc service độc lập.

## 3. Source of truth và precedence

### 3.1 Behavioral/contract baseline

Các file sau là nguồn sự thật duy nhất cho hành vi và contract sản phẩm:

1. docs/spec/spec-M01.md
2. docs/spec/spec-M02.md
3. docs/spec/spec-M03.md
4. docs/spec/spec-AI_integration.md — năng lực dịch vi → en theo yêu cầu cho editor M03 (quyết định người dùng 2026-11-03). Không phải module logic thứ tư; không đổi rule, contract, entity, state hay permission nào của spec-M03.

Quy tắc áp dụng:

- Không dùng kiến thức domain bên ngoài, mockup, architecture, function list hoặc “best practice” để tạo requirement còn thiếu.
- MVP-Scope.md sở hữu ranh giới MVP và priority Must/Should/Could/Won't; nó không được xóa hoặc đổi nghĩa requirement trong spec.
- Function list, architecture, screen list, screen spec và data model là tài liệu dẫn xuất. Khi mâu thuẫn về behavior/contract, spec thắng.
- Architecture sở hữu các quyết định kỹ thuật đã được chốt trong phạm vi của nó: tech-stack.md cho technology choices, environment.md cho environment/configuration, và system-configuration.md cho runtime placement/data flow. Các quyết định này không được thay đổi business behavior trong spec.
- External documentation chỉ được dùng để kiểm chứng tooling/technology khi task cho phép; không được dùng để lấp khoảng trống requirement.

Nếu source chưa xác nhận, ghi đúng dạng:

```text
[NEEDS CLARIFICATION: nội dung cần xác nhận]
```

Không âm thầm reconcile hai nguồn mâu thuẫn. Ghi rõ file/section, tác động và clarification cần thiết.

### 3.2 Canonical cross-module contracts

Giữ nguyên tên và ranh giới producer → consumer trong spec hiện hành:

| Producer | Contract/projection | Consumer |
|---|---|---|
| M03 | Published Route, JourneySnapshot | M01 |
| M01 | LanguagePreference, SelectedRouteContext v3, ready OfflinePackage | M02 |
| M03 | LiveStationContent và QR lookup result | M02 |
| M02 | SessionSyncRecord | M03, nơi lưu canonical SessionRecord |
| AI Integration | TranslationRequest / TranslationResult (spec-AI_integration §5.2) | M03 admin editors |

Không đổi tên contract, bỏ suffix/version hoặc hợp nhất transport shape với canonical entity nếu spec chưa canonicalize thay đổi đó.

### 3.3 Stable IDs

- Giữ nguyên các ID FR-*, FN-*, sub-function ID, US-*, BR-*, SCR-*, UF-*, SD-*, ENT-*, REL-*, ANOM-*, HC-*, DAC-* và các ID review/gate khác.
- ID đã phát hành không được tái sử dụng cho một nghĩa khác.
- Khi thêm/sửa traceability, mọi mapping phải trỏ tới ID hoặc section đang tồn tại; không tạo reference “gần đúng”.

## 4. Ownership theo file và thư mục

| Path | Sở hữu nội dung | Quy tắc thay đổi |
|---|---|---|
| README.md, docs/README.md | Entry point và navigation V2 | Chỉ sync mô tả/link; không định nghĩa behavior mới |
| MVP-Scope.md | MVP boundary và delivery priority | Spec vẫn thắng về behavior/contract |
| docs/spec/spec-M0*.md | Behavioral và contract baseline | Mọi thay đổi nghĩa phải explicit, traceable và đúng module |
| docs/spec/spec-AI_integration.md | Behavioral và contract baseline của năng lực dịch theo yêu cầu cho M03 | Như spec-M0*; không được đổi nghĩa rule của spec-M03 — thay đổi như vậy phải sửa spec-M03 |
| docs/function list/ | Functional decomposition và stable function mapping | Derived từ spec; không tự mở rộng behavior |
| docs/architecture/ | Context, flows, runtime, tech stack, environment | Derived từ spec và approved technical decisions; sửa minimal diff |
| screens/screen list/ | Screen inventory và requirement coverage | Derived từ spec/function list; screen không tạo requirement |
| screens/screen-spec/ | Chi tiết đặc tả màn hình | Bám sát spec và screen list; không tự tạo business rule |
| screens/html/ | HTML mockup tĩnh, mỗi screen một file `mockup-SCR-Mxx-nnn.html` | Derived từ screen spec và docs/design/design-system.md; chỉ trực quan hóa, không tạo requirement hay behavior; không giả lập API/dữ liệu thật |
| docs/design/ | Design system: token, typography, component và truy cập | Derived từ spec và screen spec; chỉ định nghĩa hình thức, không tạo requirement hay behavior mới |
| src/ | Application code (React + TypeScript) | Theo plan đã duyệt và CLAUDE.md; màu, font, khoảng cách lấy từ token; không sửa spec để khớp code |
| specs/ | Implementation packages (Spec-Kit) | Derived từ spec canonical; không tạo requirement mới; chỉ tạo khi có change brief code |
| vercel.json | Rewrite SPA và header cache của Single Vercel Project | Theo tasks M03 T202 và CHG-M03-2026-11-05-01 |
| supabase/config.toml, supabase/seed.sql | Cấu hình và dữ liệu synthetic cho Supabase local | Chỉ local; không seed lên cloud, không dùng `supabase config push` |
| supabase/migrations/, supabase/functions/, supabase/tests/, supabase/scripts/ | Backend M03 giai đoạn B: migration, RPC, Edge Function, pgTAP, script operator; Edge Function dịch của AI Integration | Agent chỉ chạy trên stack local theo CHG-M03-2026-10-30-01 (và CHG-AI-2026-11-03-01, duyệt 2026-11-03, cho function dịch); theo Physical Schema và tasks M03; `link`/`db push`/deploy chỉ do người vận hành cloud chạy theo CHG-M03-2026-11-05-01 |
| assets/ | Static assets dùng chung (hiện có assets/icons/) | Chỉ thêm file do người dùng cung cấp; không tự tạo hay vẽ asset |
| data/01-entity-dictionary.md | S1 canonical entity vocabulary | Không thêm entity từ implementation convenience |
| data/02-crud-matrix.md | S2 FN-level direct CRUD evidence | Không gán CRUD từ indirect/delegated effect |
| data/03-erd.mmd | Canonical S3 Mermaid ERD source | Không đổi semantics để chữa lỗi render |
| data/03-erd-preview.md | Render wrapper của ERD | Mermaid block phải phản ánh chính xác 03-erd.mmd |
| data/03-erd-review.md | S3 relationship catalog/review | Chỉ relationship có source-supported cardinality mới được confirmed |
| data/04-data-model.md | Authoritative S4 logical data model | Markdown này thắng DBML nếu có lệch |
| data/04-data-model.dbml | S4 visualization | Không biến giới hạn DBML thành logical design mới |
| data/08-data-acceptance-criteria.md | Data Acceptance Criteria catalog (DAC) | Derived validation catalog sau S4, trước Physical Schema |
| data/05-review.md | Logical-model/DAC review gate | V2 PASS (2026-10-28); cập nhật khi S1–S4 hoặc DAC đổi |
| data/06-physical-schema.md | Physical schema design (V2) | Giới hạn cuối của tài liệu; thiết kế, không phải implementation; cập nhật khi S4 hoặc DAC đổi |
| M03_Documentation_Refactor_Runbook_v2.md | Quy trình refactor toàn diện | Nguồn điều phối luồng rebaseline P0–P11 |
| .claude/skills/ | Skill của Claude Code (speckit-*, frontend-design) | Chỉ sao chép nguyên văn từ nguồn; không sửa nội dung skill nếu chưa được yêu cầu |
| .specify/ | Constitution và specification memory | Bảo tồn nguyên tắc Spec-first và governance |

Khi behavior/contract đổi, cập nhật spec canonical trước. Sau đó chỉ sync các derived artifact nằm trong phạm vi task; nếu artifact liên quan nằm ngoài scope, báo rõ nó có nguy cơ stale thay vì tự ý sửa.

## 5. Hard rules cho data và modeling

- Không tự suy đoán type, UUID, TEXT/VARCHAR, INTEGER, TIMESTAMP, BOOLEAN, PK/FK, nullable/not-null, uniqueness, ownership, cardinality, lifecycle, retention hoặc delete behavior.
- Chỉ ghi type/constraint/relationship khi có source reference hoặc human decision đã được ghi nhận trong artifact upstream.
- Phân biệt canonical entity với contract, transport payload, projection, embedded value, report output và transient UI state.
- Phân biệt mutable source với frozen/historical copy. Không thay frozen value bằng live reference vì thuận tiện triển khai.
- SessionSyncRecord là transport contract; SessionRecord là canonical M03 entity. Không hợp nhất hai khái niệm.
- Current published content là projection của revision `PHAT_HANH` của route, checkpoint hoặc QR object (spec-M03 §6.3), không phải entity mới.
- `Revision` là canonical entity của M03 theo spec-M03 v3.7 (§6.3), thay cho `CheckpointContent`; không tạo thêm entity revision nào khác.
- LanguagePreference có thể đứng độc lập; không invent relationship chỉ để ERD trông “đầy đủ”.
- Baseline S1 V2 (Human Gate 1, 2026-10-28) có 16 canonical entities: ENT-DATA-001–003 và 005–017; ENT-DATA-004 `CheckpointContent` đã retire, ENT-DATA-017 `Revision` thay thế. Không thêm/bớt entity nếu spec không có và không có explicit approval.
- CRUD chỉ phản ánh effect trực tiếp của FN-level function. Effect do function khác thực hiện không được gán gián tiếp.
- Delete chỉ mang nghĩa xóa persisted canonical entity khi requirement nói rõ; archive, withdraw, replace, invalidate hoặc local cleanup không tự động là D.
- Không bắt đầu stage data-model kế tiếp khi người dùng chưa yêu cầu. Luồng dữ liệu phải đi tuần tự: S1 → S2 → S3 → S4 → DAC → review gate → Physical Schema.
- Không tạo physical schema, table name, API endpoint, index, migration, RLS, trigger hoặc storage policy trong task logical/conceptual.

## 6. Quy trình làm việc bắt buộc

### Trước khi sửa

1. Đọc AGENTS.md, M03_Documentation_Refactor_Runbook_v2.md, git status --short và các source canonical liên quan.
2. Xác định task là audit, behavioral change, derived-doc sync, screen change hay data-model stage.
3. Xác định chính xác file được phép sửa và artifact upstream/downstream của chúng.
4. Kiểm tra worktree hiện có. Mọi thay đổi không do agent tạo ra đều thuộc về người dùng; không revert, overwrite hoặc “dọn” chúng.
5. Nếu task chỉ yêu cầu review/audit, không sửa file trừ khi người dùng yêu cầu sửa.

### Trong khi sửa

- Dùng patch nhỏ, giữ cấu trúc và terminology hiện có.
- Giữ UTF-8 và line ending theo .gitattributes; không tạo encoding churn.
- Không thay đổi business behavior để làm diagram, parser hoặc documentation dễ hơn.
- Không tự sửa file ngoài scope chỉ vì phát hiện inconsistency; ghi nó trong báo cáo cuối.
- Không commit, push, tạo PR, cài dependency, provision cloud resource hoặc gọi external service nếu người dùng chưa yêu cầu.
- Không ghi secret, token, password, real user data hoặc production identifier vào repository, log hay tài liệu.

### Sau khi sửa

1. Đọc lại diff theo từng file và xác nhận không có unrelated edits.
2. Chạy validation nhỏ nhất nhưng đủ cho loại thay đổi (diff check, link check, syntax check).
3. Không tuyên bố test/parser/render PASS nếu chưa thực sự chạy được validator tương ứng.
4. Báo file đã sửa, nội dung chính, validation đã chạy và clarification/inconsistency còn lại.

## 7. Commands và validation

### 7.1 Lệnh read-only dùng chung

```powershell
git status --short
git diff -- <paths>
Get-ChildItem -Path <paths> -Recurse
Select-String -Path <paths> -Pattern "<pattern>"
```

### 7.2 Kiểm tra diff tài liệu

```powershell
git diff --check
```

Ngoài lệnh trên, kiểm tra thủ công:

- relative link và section reference có tồn tại;
- version/module/canonical contract name nhất quán;
- ID và source reference trace được;
- Mermaid fence đóng/mở đúng;
- không có field, rule hoặc relationship mới thiếu source.

Với Mermaid/DBML, chỉ báo syntax hoặc render PASS khi local parser/render tool thực sự có sẵn và đã chạy. data/04-data-model.md vẫn authoritative nếu DBML representation có giới hạn.