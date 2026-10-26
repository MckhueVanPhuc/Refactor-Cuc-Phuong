# M03 Documentation Refactor Runbook

**Hướng dẫn sửa toàn diện và đồng bộ tài liệu khi rebaseline Spec-M03**

| Thuộc tính | Giá trị |
| --- | --- |
| Repository | MckhueVanPhuc/Cuc-Phuong-Dbiz-Team-H |
| Historical reference baseline | main @ tree SHA d37ce709376ef5ed3cb2b730d9687871ec05108d |
| Operational baseline | Target branch + starting commit SHA do người thực thi xác nhận tại H0/P0; không tự suy từ historical reference |
| Ngày lập runbook | 19/10/2026 |
| Phạm vi | Refactor tài liệu; không sửa application code hoặc tests |
| Trọng tâm | Spec-M03 → M01/M02 → Scope/Function → Architecture → Screen → Data/Database (S1→S4→DAC→review→physical) → Complete & Validate Implementation Documentation → Final audit |

| Nguyên tắc cốt lõi: Spec canonical phải được sửa trước. Mọi artifact dẫn xuất chỉ được đồng bộ sau khi ý nghĩa của Spec-M03 và ảnh hưởng liên module đã được chốt. Không dùng downstream document để “suy ngược” requirement mới vào spec. |
| --- |

Nguồn lập runbook: AGENTS.md, constitution, README/docs index, Spec M01–M03, MVP Scope, function lists, architecture, screen inventory/specs, data model/storage docs, `.specify/scripts/python/`, `.specify/templates/` và các `.agents/skills/` trong repository.

# Tóm tắt điều hành

Mục tiêu của tài liệu này là biến việc “sửa Spec-M03” thành một quy trình refactor có kiểm soát, có traceability và có điểm dừng rõ ràng. Nó không giả định rằng mọi thay đổi ở M03 đều kéo theo mọi file; thay vào đó, mỗi thay đổi được phân loại rồi lan truyền theo dependency thực tế.

| Luồng chuẩn: Change brief → Clarify → sửa Spec-M03 → kiểm tra nội bộ M03 → phân tích contract và đồng bộ Spec-M01/M02 khi cần → MVP/Function → Architecture → Screen → Data/Database, trong đó DAC được hoàn tất sau S4 và phải pass cùng logical model trước physical design → hoàn tất và validate implementation documentation của cả M01/M02/M03 bằng các Spec-Kit gate bắt buộc → repo-wide audit. |
| --- |

| Mức | Khi nào dùng | Kết quả mong đợi |
| --- | --- | --- |
| MUST CHANGE | Artifact chắc chắn sai nếu giữ nguyên sau thay đổi đã chốt. | Sửa trong cùng change set. |
| REVIEW / CONDITIONAL | Chỉ sai nếu thay đổi chạm đúng ownership/contract/field/state mà artifact mô tả. | Đọc, quyết định CHANGE hoặc NO CHANGE và ghi lý do. |
| NO CHANGE | Ngoài phạm vi refactor này hoặc artifact lịch sử/template/code/test. | Không sửa; chỉ ghi nhận nếu phát hiện stale risk liên quan. |

Điểm đặc biệt với database: không đi thẳng từ Spec-M03 sang physical schema. Luồng dữ liệu phải đi theo thứ tự S1 Entity Dictionary → S2 CRUD Matrix → S3 ERD → S4 Logical Model/DBML → hoàn tất Data Acceptance Criteria (DAC) → logical-model/DAC review gate → Physical Schema → Field Mapping → Seed/edge-case evidence → Storage Validation evidence nếu validation thực sự đã chạy. Nếu upstream chưa chốt, không “đoán” downstream.

**Bổ sung bắt buộc trong workflow dữ liệu:** repository cần một cross-project Data Acceptance Criteria catalog tại `data/08-data-acceptance-criteria.md`. Đây là derived validation catalog, không phải nguồn requirement độc lập. Trong các pha canonical-spec phải nhận diện validation constraint và open product decision; sau S4 mới đối chiếu chúng ở field level với logical model để hoàn tất DAC. Chỉ criterion có canonical source mới được coi là accepted; khoảng trống phải ghi `TBD-HUMAN`, và quyết định blocking của changed field phải được giải quyết trong canonical spec trước review gate.

**P10 là completion phase bắt buộc, không chỉ là impact review.** Cả ba package `specs/001-m01-implementation/`, `002-m02-implementation/` và `003-m03-implementation/` phải được inventory, kiểm tra completeness/consistency, hoàn tất toàn bộ artifact cần thiết và có implementation-readiness assessment. Module không đổi behavior vẫn phải pass full validation; `NO CHANGE` không được dùng để bỏ qua tài liệu thiếu hoặc stale. P10 chỉ hoàn tất tài liệu cho future implementation, không chạy task và không sửa code/migration/test/runtime.

# Bản đồ tài liệu

| Phần | Nội dung |
| --- | --- |
| 0 | Handoff & Execution Preflight: inputs, environment, feature-package resolution, ownership/evidence. |
| 1–3 | Phạm vi, source-of-truth, contract và stable-ID rules. |
| 4 | Phân loại loại thay đổi M03 và cách xác định impact. |
| 5 | Luồng refactor 12 pha P0–P11 từ freeze baseline đến final audit. |
| 6 | Ma trận file-by-file và P10 completeness workflow cho ba implementation package. |
| 7 | Luồng database/data chi tiết + Data Acceptance Criteria toàn dự án. |
| 8 | Playbook skill và tool, gồm các Spec-Kit gate bắt buộc của P10. |
| 9 | Validation, search/diff/check commands và acceptance gates. |
| 10–11 | Definition of Done, stable evidence/handoff reports và ví dụ impact. |
| 12 | Practical execution troubleshooting và safe recovery. |
| Phụ lục | Danh sách artifact in-scope/out-of-scope và baseline warnings. |

# 0. Handoff & Execution Preflight

Section 0 là gate vận hành bắt buộc **trước P0**, không phải pha thứ 13. Người nhận bàn giao chỉ bắt đầu P0 khi H0–H3 đều `PASS`. Mọi command dưới đây chạy read-only trừ khi được ghi rõ; không tự cài dependency, đổi machine configuration, clone/worktree hoặc ghi file khi chưa có quyền phù hợp. Runbook này không cấp quyền tạo commit, push branch hoặc mở/cập nhật pull request; các hành động đó chỉ được thực hiện khi có yêu cầu và phê duyệt riêng.

## 0.1 Trạng thái vận hành dùng thống nhất

| Status | Ý nghĩa |
| --- | --- |
| `PASS` | Operation đã thực sự chạy, expected output đã được kiểm tra và evidence đã lưu. |
| `BLOCKED` | Không thể tiếp tục an toàn; cần input, permission, compatible tool hoặc sửa lỗi trước. |
| `NOT RUN` | Chưa thực thi; không được diễn giải là PASS. |
| `NOT APPLICABLE` | Không áp dụng, có rationale và reviewer chấp nhận. |
| `NEEDS HUMAN DECISION` | Thiếu quyết định business/product/ownership; dừng nhánh downstream bị ảnh hưởng. |

Một command được viết trong runbook nhưng chưa chạy vẫn là `NOT RUN`. Markdown được generate thành công cũng không tự chứng minh gate đã PASS.

## 0.2 H0 — Handoff Completeness

Người bàn giao và người nhận cùng xác nhận bảng sau trong `docs/refactor-reports/<CHANGE_ID>/00-preflight.md`:

| Required input | Nội dung tối thiểu | Gate |
| --- | --- | --- |
| Repository access | URL `MckhueVanPhuc/Cuc-Phuong-Dbiz-Team-H`, quyền read/write cần thiết, authentication method không chứa secret trong report. | Clone/fetch/read target branch được. |
| Approved M03 Change Brief | Change ID, approver, approval reference/date, Current → New, rationale và non-goals. | Thiếu approved brief → `BLOCKED`; không invent intended change. |
| Impact identifiers | Affected FR/BR/US/FN/SCR/ENT/REL IDs, contracts, fields, rules và expected M01/M02/M03 impact khi áp dụng. | Exact refs resolve hoặc gap được đánh dấu `NEEDS HUMAN DECISION`. |
| Human decisions | Approved business/product decisions và source location; unresolved decision có owner. | Blocking decision đã ghi vào canonical spec hoặc workflow dừng. |
| Git baseline | Target branch, starting commit SHA, remote và ngày/giờ capture. | Branch/SHA do operator đọc từ active repository, không copy mù historical SHA của runbook. |
| Scope | Exact in-scope/out-of-scope artifacts, gồm exception cho năm P10 skill nếu cần. | Không có ambiguity về file được phép ghi. |
| Existing worktree | `git status --short`, owner của từng pre-existing change và cách tránh overlap. | Unknown ownership/overlap → `BLOCKED`; không reset/revert/stash thay đổi người dùng nếu chưa được phép. |
| Output/handoff | Report root, reviewer, handoff destination và người nhận future implementation. | Destination/owner rõ. |

## 0.3 H1 — Environment and Toolchain Preflight

### 0.3.1 Xác lập repository root và Git baseline

**Working directory:** local clone của repository. **Prerequisite:** repository đã được clone bởi người có quyền; nếu chưa có, xin phép trước khi chạy `git clone`.

```powershell
$repoRootOutput = git rev-parse --show-toplevel
if ($LASTEXITCODE -ne 0 -or -not $repoRootOutput) {
    throw "BLOCKED: Current directory is not inside the intended Git repository."
}
$RepoRoot = $repoRootOutput.Trim()
Set-Location -LiteralPath $RepoRoot

git --version
git remote -v
git branch --show-current
git rev-parse HEAD
git status --short
```

| Expected result | Failure condition | Safe recovery |
| --- | --- | --- |
| Root khớp clone Cúc Phương Quest; Git version in được; remote/branch/SHA/status được lưu vào preflight report. | Không phải Git repo, wrong remote, không đọc được branch/SHA, hoặc dirty change chưa rõ owner. | Dừng; chọn đúng clone hoặc hỏi owner. Không tự reset, checkout, stash hay delete. |

### 0.3.2 Resolve portable Python interpreter

**Working directory:** `$RepoRoot`. **Prerequisite:** PowerShell và một candidate Python đã được người dùng cài đặt. Scripts hiện dùng syntax cần Python 3.10+.

```powershell
$SpecKitPythonExe = $null
$SpecKitPythonPrefixArgs = @()

$pythonCommand = Get-Command python -ErrorAction SilentlyContinue
if ($pythonCommand) {
    & $pythonCommand.Source -c "import sys; raise SystemExit(0 if sys.version_info >= (3, 10) else 1)"
    if ($LASTEXITCODE -eq 0) { $SpecKitPythonExe = $pythonCommand.Source }
}

if (-not $SpecKitPythonExe) {
    $pyLauncher = Get-Command py -ErrorAction SilentlyContinue
    if ($pyLauncher) {
        & $pyLauncher.Source -3 -c "import sys; raise SystemExit(0 if sys.version_info >= (3, 10) else 1)"
        if ($LASTEXITCODE -eq 0) {
            $SpecKitPythonExe = $pyLauncher.Source
            $SpecKitPythonPrefixArgs = @('-3')
        }
    }
}

if (-not $SpecKitPythonExe) {
    throw "BLOCKED: No verified Python 3.10+ interpreter. Do not install or change machine configuration without permission."
}

& $SpecKitPythonExe @SpecKitPythonPrefixArgs -c "import sys; print(sys.executable); print(sys.version)"
if ($LASTEXITCODE -ne 0) { throw "BLOCKED: Selected Python failed verification." }
```

| Expected result | Failure condition | Safe recovery |
| --- | --- | --- |
| Evidence ghi exact executable/launcher args và Python version; cùng `$SpecKitPythonExe`/`$SpecKitPythonPrefixArgs` được reuse cho mọi skill. | Candidate không tồn tại, version <3.10 hoặc verification exit khác 0. | `BLOCKED`; báo interpreter candidates đã thử. Chỉ cài/chọn interpreter khác sau khi được phép; không silently fallback. |

### 0.3.3 Kiểm tra scripts, templates, skills và quyền đọc/ghi

**Working directory:** `$RepoRoot`. **Prerequisite:** H1 Git/Python đã PASS.

```powershell
$requiredPaths = @(
    'AGENTS.md',
    '.specify/memory/constitution.md',
    '.specify/scripts/python/common.py',
    '.specify/scripts/python/check_prerequisites.py',
    '.specify/scripts/python/setup_plan.py',
    '.specify/scripts/python/setup_tasks.py',
    '.specify/templates/checklist-template.md',
    '.specify/templates/plan-template.md',
    '.specify/templates/tasks-template.md',
    '.agents/skills/speckit-clarify/SKILL.md',
    '.agents/skills/speckit-checklist/SKILL.md',
    '.agents/skills/speckit-plan/SKILL.md',
    '.agents/skills/speckit-tasks/SKILL.md',
    '.agents/skills/speckit-analyze/SKILL.md'
)
$missingPaths = $requiredPaths | Where-Object { -not (Test-Path -LiteralPath $_) }
if ($missingPaths) { throw "BLOCKED: Missing required paths: $($missingPaths -join ', ')" }

& $SpecKitPythonExe @SpecKitPythonPrefixArgs ".specify/scripts/python/check_prerequisites.py" --help
if ($LASTEXITCODE -ne 0) { throw "BLOCKED: Spec-Kit prerequisite script is not callable." }
```

| Expected result | Failure condition | Safe recovery |
| --- | --- | --- |
| Required paths exist; script help exits 0; agent confirms it can invoke repository skills and edit only approved docs. | Missing script/template/SKILL, import/syntax error, permission denied hoặc agent không hỗ trợ skill invocation. | Dừng và báo exact path/error. Fetch đúng revision hoặc đổi compatible agent sau approval; không sửa shared script/template để né lỗi. |

## 0.4 H2 — Spec-Kit Feature Package Resolution

### 0.4.1 Resolution semantics thực tế

- `SPECIFY_FEATURE_DIRECTORY` chọn package; relative value được resolve từ repository root.
- `.specify/feature.json` là fallback chứa `feature_directory` khi environment variable không có.
- `SPECIFY_FEATURE`/branch identity chỉ cung cấp label `BRANCH` hoặc fallback name; **không chứng minh package được chọn đúng**.
- `check_prerequisites.py --json --paths-only` gọi resolver ở `no_persist` mode nên không tạo/sửa `.specify/feature.json`.
- `check_prerequisites.py` không có `--paths-only`, `setup_plan.py` và `setup_tasks.py` dùng normal resolver; khi `SPECIFY_FEATURE_DIRECTORY` được set, chúng có thể create/update `.specify/feature.json`.
- `.specify/feature.json` là machine/operator selection state và được ignore bởi `.gitignore`; nó không phải product documentation.

Nếu `.specify/feature.json` đã tồn tại trước session, ghi content hash/path/owner và **không overwrite/delete** khi chưa được phép. Preferred recovery cho stale/user-owned config là dùng dedicated approved worktree hoặc xin phép temporary update + exact restore. Nếu file không tồn tại và current operation tạo nó, chỉ cleanup file đó khi cleanup đã được phép và evidence chứng minh nó không pre-exist.

### 0.4.2 Chọn và verify từng package

Xử lý tuần tự theo thứ tự M01 → M02 → M03. **Working directory:** `$RepoRoot`. **Prerequisite:** H0–H1 PASS và package path tồn tại.

```powershell
$Package = 'specs/001-m01-implementation' # đổi tuần tự sang 002 rồi 003
$env:SPECIFY_FEATURE_DIRECTORY = $Package

$pathJson = & $SpecKitPythonExe @SpecKitPythonPrefixArgs ".specify/scripts/python/check_prerequisites.py" --json --paths-only
if ($LASTEXITCODE -ne 0) { throw "BLOCKED: Feature path resolution failed for $Package" }
$resolved = $pathJson | ConvertFrom-Json

$expectedDir = (Resolve-Path -LiteralPath (Join-Path $RepoRoot $Package)).Path
$expectedSpec = (Join-Path $expectedDir 'spec.md')
$expectedPlan = (Join-Path $expectedDir 'plan.md')
$expectedTasks = (Join-Path $expectedDir 'tasks.md')

if ($resolved.FEATURE_DIR -ne $expectedDir -or
    $resolved.FEATURE_SPEC -ne $expectedSpec -or
    $resolved.IMPL_PLAN -ne $expectedPlan -or
    $resolved.TASKS -ne $expectedTasks) {
    throw "BLOCKED: Resolved Spec-Kit paths do not match intended package $Package"
}

$resolved | ConvertTo-Json -Depth 3
```

| Expected result | Failure condition | Safe recovery |
| --- | --- | --- |
| `FEATURE_DIR`, `FEATURE_SPEC`, `IMPL_PLAN`, `TASKS` đều nằm đúng package; JSON được lưu vào per-package evidence. | Bất kỳ path nào trỏ sang module khác, JSON invalid, path/file thiếu. | Stop immediately. Kiểm tra working directory, environment variable và stale `feature.json`; không chạy skill write-capable cho tới khi `--paths-only` pass. |

Lặp lại path verification **ngay trước mỗi skill có thể write** (`clarify`, `checklist`, `plan`, `tasks`). Sau skill:

```powershell
git status --short
git diff --name-only
git diff -- "specs/001-m01-implementation"
```

Expected: changed files chỉ nằm trong package đang active và report area được duyệt. Nếu diff ra package khác/excluded path, dừng, bảo toàn worktree, ghi evidence và xin hướng dẫn; không dùng reset/checkout/delete để “sửa nhanh”. Hoàn tất package gate và readiness row trước khi đổi `$Package`.

## 0.5 H3 — Execution Ownership and Reporting

Change Brief/preflight report phải gán người hoặc vai trò cụ thể:

| Responsibility | Required owner/action |
| --- | --- |
| Approve business/product decisions | Product owner/human approver; quyết định phải vào canonical spec trước downstream sync. |
| Resolve blocking clarification | Named decision owner; agent chỉ trình bày gap/options, không fabricate. |
| Review requirement-quality checklist | Named reviewer; checkbox `[x]` là review quality, không phải code completion. |
| Own worktree changes | Người tạo từng pre-existing/current change; overlap phải được phối hợp. |
| Store execution evidence | `docs/refactor-reports/<CHANGE_ID>/` theo §10.1; không dùng historical validation file. |
| Store completion reports | Cùng report root, final report và future implementation handoff có stable filenames. |
| Stop workflow | Bất kỳ operator nào khi gate `BLOCKED`, wrong package, unapproved decision, unexpected write, hook/skill failure hoặc missing evidence. |
| Accept handoff | Named reviewer xác nhận H0–H3, P0–P11 evidence, package readiness và remaining issues. |

Handoff thành công khi người nhận có repository access, approved inputs, reproducible toolchain/target selection, complete evidence, không còn hidden blocking decision, và biết chính xác bước future implementation tiếp theo. Trạng thái `READY WITH PREREQUISITES` phải liệt kê prerequisite còn phải chạy tại receiving environment; không được đổi thành `PASS` chỉ vì runbook đã mô tả command.

# 1. Phạm vi refactor và các giới hạn

Runbook này áp dụng khi thay đổi behavioral/contract baseline của M03 hoặc khi rebaseline M03 theo một quyết định sản phẩm mới. Nó dùng repository hiện tại làm chuẩn và ưu tiên “minimal diff + traceability” thay vì sửa lan rộng theo cảm tính.

## 1.1 Artifact nằm trong phạm vi xem xét

- Canonical specs: docs/spec/spec-M03.md và, khi contract/behavior liên module đổi, docs/spec/spec-M01.md / spec-M02.md.

- MVP & functional decomposition: MVP-Scope.md và docs/function list/function-list-M01.md, M02.md, M03.md.

- Architecture: docs/architecture/*.md theo trigger cụ thể.

- Screens: screens/screen list/*.md và screens/screen-spec/M01|M02|M03/*.md khi state/field/action/role/flow thay đổi.

- Data/database docs: data/01…07, **data/08-data-acceptance-criteria.md (artifact mới cần tạo)**, data/schema/field-mapping.md và seed fixture/evidence khi rules/fields/entities/contracts thay đổi.

- Implementation documentation: specs/001-m01-implementation, specs/002-m02-implementation, specs/003-m03-implementation và contracts dưới từng module, nhưng chỉ phần tài liệu.

- Entry/index/governance docs: README.md, docs/README.md, AGENTS.md, supabase/README.md chỉ khi trigger tương ứng xảy ra.

- Workflow support: năm `.agents/skills/speckit-{clarify,checklist,plan,tasks,analyze}/SKILL.md` chỉ được sửa khi task explicit nhắm vào portability/execution reliability; `.gitignore` chỉ được cập nhật để bảo vệ machine-local `.specify/feature.json`. Đây không phải phạm vi mặc định của ordinary M03 refactor.

## 1.2 Artifact cố định: không sửa trong refactor này

| Nhóm loại trừ | Path / artifact | Lý do |
| --- | --- | --- |
| Design docs | design-decisions/** | Người dùng đã loại khỏi phạm vi; critique/shape là design/history, không phải canonical behavior baseline. |
| Product documentation templates | docs/templates/** | Template không phải downstream product requirement. |
| Spec-Kit infrastructure | .specify/scripts/**; .specify/templates/** | Không sửa script/template dùng chung nếu chưa chứng minh blocker không thể xử lý bằng runbook/skill instructions và chưa xin approval riêng. |
| Historical/source | PCCV_DBIZ3_TEAM-H.docx; Stakeholder Interview & Problem Define.pdf | Nguồn/historical artifact; không rewrite theo baseline mới. |
| Code & tests | src/**; tests/**; application handlers; SQL/Edge implementation; migrations | Người dùng yêu cầu không tính code/test trong change set này. |
| Prototype/visual code | design-prototypes/**; screens/html/**; capture-*.js và generated screenshots | Implementation/prototype; không thuộc refactor tài liệu lần này. |

Ngoại lệ: `supabase/README.md` là tài liệu, không phải code. Chỉ REVIEW nếu thay đổi M03 làm đổi quy trình database/Auth/seed/deployment. Không vì README nằm trong `supabase/` mà mặc định loại bỏ.

# 2. Source of truth, precedence và stable identifiers

AGENTS.md áp dụng cho toàn repository và quy định spec là behavioral/contract baseline. Khi có mâu thuẫn về behavior hoặc contract, spec thắng; downstream không được tự tạo behavior mới.

Runbook phân biệt ba lớp tài liệu và không cho phép lớp sau override lớp trước:

| Lớp | Artifact | Vai trò |
| --- | --- | --- |
| **Layer 1 — Canonical Specifications** | `docs/spec/spec-M01.md`, `docs/spec/spec-M02.md`, `docs/spec/spec-M03.md` | Định nghĩa authoritative business behavior, requirement, rule và module contract. |
| **Layer 2 — Derived Documentation** | MVP Scope, Function Lists, Architecture, Screen Specs, Data Model, DAC và các data artifact liên quan | Chuyển canonical requirement thành tài liệu có cấu trúc; không tạo thêm business behavior. |
| **Layer 3 — Implementation Documentation** | `specs/001-m01-implementation/`, `specs/002-m02-implementation/`, `specs/003-m03-implementation/` | Mô tả implementation assumption, application flow, technical contract, plan, data model, quickstart và task; P10 phải làm chúng complete, internally consistent và implementation-ready theo Layer 1–2 đã duyệt, không thực thi code. |

| Thứ tự/Owner | Artifact | Quy tắc |
| --- | --- | --- |
| Behavior/contract baseline | docs/spec/spec-M01.md; spec-M02.md; spec-M03.md | Mọi thay đổi nghĩa phải explicit, traceable và đúng module. |
| MVP boundary/priority | MVP-Scope.md | Sở hữu Must/Should/Could/Won’t; không đổi nghĩa requirement trong spec. |
| Functional decomposition | docs/function list/** | Derived từ spec; không mở rộng behavior. |
| Architecture | docs/architecture/** | Derived từ spec + approved technical decisions; sửa minimal diff. |
| Screen inventory/spec | screens/** | Derived từ spec/function list; UI không tạo requirement. |
| Data model | data/01…06 | Đi theo stage/gate; data/04-data-model.md thắng DBML khi lệch. |
| Validation evidence | data/07-storage-validation.md | Evidence lịch sử/thực thi; không rewrite để giả vờ baseline mới đã được validate. |
| Data Acceptance Criteria | data/08-data-acceptance-criteria.md | Derived validation catalog cho toàn dự án; tập hợp format/range/length/cardinality/cross-field rules đã có nguồn. Không được tự tạo business rule và không được override spec. |

## 2.1 Canonical cross-module contracts phải bảo vệ

| Producer | Contract / projection | Consumer | Ý nghĩa khi refactor |
| --- | --- | --- | --- |
| M03 | Published Route; JourneySnapshot | M01 | Nếu shape/availability/version semantics đổi → Spec-M01 và downstream M01 phải REVIEW. |
| M01 | LanguagePreference; SelectedRouteContext v2; ready OfflinePackage | M02 | M03 chỉ tác động gián tiếp nếu thay đổi source snapshot làm đổi handoff/package semantics. |
| M03 | LiveStationContent + QR lookup result | M02 | Nếu live content/QR semantics đổi → Spec-M02 và M02 contracts/screens phải REVIEW. |
| M02 | SessionSyncRecord | M03 → canonical SessionRecord | Nếu intake/report payload semantics đổi → Spec-M02 + M03 + data docs phải cùng rebaseline. |

## 2.2 Stable ID rule

Các ID FR-*, FN-*, sub-function, US-*, BR-*, SCR-*, UF-*, SD-*, ENT-*, REL-* và review/gate IDs đã phát hành không được tái sử dụng cho một nghĩa khác. Khi thay đổi chỉ là làm rõ cùng một requirement, có thể giữ ID; khi nghĩa business đổi đáng kể, cần explicit replacement/deprecation strategy thay vì “đổi nghĩa trong im lặng”.

| Rule thực hành: Không renumber để “đẹp”. Không đổi tên contract chỉ để thuận tiện implementation. Không gộp SessionSyncRecord với SessionRecord. Không biến projection/transport payload thành canonical entity nếu chưa có quyết định explicit. |
| --- |

# 3. Change Brief: tài liệu đầu vào bắt buộc trước khi sửa

Trước khi chạm vào Spec-M03, hãy viết một change brief ngắn. Đây là “điểm neo” để agent/human không mở rộng scope ngoài yêu cầu.

| Trường | Nội dung cần ghi |
| --- | --- |
| Change ID | Ví dụ CHG-M03-2026-10-XX-01 hoặc ID issue/PR. |
| M03 source | Section/US/FR/BR/contract đang bị thay đổi. |
| Current → New | Nêu rõ hành vi hiện tại và hành vi mong muốn. |
| Rationale | Vì sao thay đổi; human decision/source nào phê duyệt. |
| Impact dimensions | Actor/role, lifecycle/status, field/type, **data acceptance criterion (format/range/length/cardinality/null/blank/uniqueness)**, validation rule, cross-module contract, report, screen, MVP priority, data retention. |
| Expected consumers | M01? M02? Admin UI? Data model? Reports? Auth/runtime? |
| Explicit non-goals | Những thứ không được thay đổi cùng change. |
| Open questions | NEEDS CLARIFICATION nếu quyết định chưa đủ rõ. |

Change Brief phải nhận diện sớm validation constraint và product decision còn thiếu, kể cả khi field-level DAC chưa thể hoàn tất trước S4. Không trì hoãn quyết định blocking đến physical-schema phase; dùng `TBD-HUMAN` để truy vết cho tới khi quyết định được ghi vào canonical spec.

# 4. Phân loại thay đổi M03 để quyết định mức impact

| Loại thay đổi | Ví dụ | Impact mặc định | Điểm kiểm tra |
| --- | --- | --- | --- |
| C1 — Wording/clarity | Viết lại câu nhưng không đổi behavior, field, state, contract. | Spec-M03; downstream thường NO CHANGE. | Diff semantics: không đổi acceptance, BR, producer/consumer. |
| C2 — M03 internal behavior | Đổi maker-checker, lifecycle, validation admin nhưng không đổi public contract. | M03 + Function + Screen/Data tùy rule. | M01/M02 phải chứng minh NO CHANGE. |
| C3 — Cross-module contract | Đổi Published Route, JourneySnapshot, LiveStationContent, QR lookup, SessionSyncRecord semantics. | M03 + M01/M02 + Architecture + Data + implementation contracts. | Producer/consumer shape + versioning + compatibility. |
| C4 — Domain/data model | Thêm/bỏ field, entity, identity, relationship, retention, cardinality, format, range hoặc length rule. | M03 + full data chain, với DAC sau S4; M01/M02 nếu exposed/copied. | Không nhảy thẳng sang DAC hoặc physical schema; không invent min/max/length khi source chưa có. |
| C5 — MVP boundary/priority | Must↔Should; thêm/remove capability khỏi MVP. | MVP-Scope + related function list; spec chỉ đổi nếu behavior scope thực sự đổi. | Không dùng priority để xóa requirement. |
| C6 — Runtime/Auth/environment | Đổi Auth role model, environment boundary, report timezone, Storage/Edge/RPC responsibility. | M03 + architecture/environment/tech/supabase README tùy phạm vi. | Không biến technical decision thành business rule. |

## 4.1 Quy tắc quyết định M01/M02 có bị ảnh hưởng hay không

| Câu hỏi | Nếu Có | Nếu Không |
| --- | --- | --- |
| M01 có đọc/nhúng/copy giá trị vừa đổi từ Published Route hoặc JourneySnapshot? | Spec-M01 + function/screen/data M01 REVIEW/MUST. | M01 có thể NO CHANGE; ghi lý do. |
| M02 có đọc live content/QR hoặc frozen journey chứa giá trị vừa đổi? | Spec-M02 + M02 contracts/screens/data REVIEW/MUST. | M02 có thể NO CHANGE. |
| M02 gửi payload terminal mà M03 intake/report giờ hiểu khác? | Spec-M02 và terminal-sync-contract MUST REVIEW. | M02 NO CHANGE. |
| M03 closure/publication semantics làm thay đổi Start/active availability ở M01? | M01 availability/start rules MUST REVIEW. | M01 NO CHANGE. |

# 5. Luồng refactor end-to-end — 12 pha (P0–P11)

Thứ tự dưới đây là dependency order. Không “song song hóa” những pha mà artifact sau phụ thuộc vào quyết định của artifact trước.

| Pha | Tên | Output / gate |
| --- | --- | --- |
| P0 | Freeze baseline | Chỉ bắt đầu sau H0–H3 PASS. Đọc AGENTS.md/constitution, capture active remote/branch/starting SHA/worktree owners; chốt exact in-scope/out-of-scope và report root. Historical SHA chỉ để tham khảo. Không sửa product docs. |
| P1 | Change brief & clarification | Viết Current→New, impact dimensions, open questions. Dùng speckit-clarify methodology nếu còn ambiguity. |
| P2 | Edit canonical Spec-M03 | Sửa Purpose/Actors/US/Flows/FR/BR/Entities/Contracts/Reports đúng nơi; nhận diện validation constraint và unresolved product decision; giữ stable IDs; bump version/date theo policy. |
| P3 | M03 internal gate | Check FR↔BR↔US↔flow↔entity↔contract consistency, no orphan IDs, no stale wording; ghi rõ các quyết định validation còn `TBD-HUMAN`. |
| P4 | Cross-module contract analysis | Đối chiếu 4 canonical producer→consumer contracts; quyết định M01/M02 CHANGE hoặc NO CHANGE có lý do. |
| P5 | Sync Spec-M01/M02 if needed | Chỉ sửa phần consumer/producer semantics thực sự bị ảnh hưởng; không “refactor ké”. |
| P6 | Sync MVP Scope & Function Lists | Priority/boundary ở MVP-Scope; decomposition/coverage ở function lists. Không tạo behavior mới. |
| P7 | Sync Architecture | Context/usage/sequence/system config; tech/environment chỉ khi trigger kỹ thuật thực sự có. |
| P8 | Sync Screen Documentation | Inventory + screen specs cho field/action/state/role/error/coverage bị đổi; không dùng UI suy ngược rule. |
| P9 | Sync Data/Database Documentation, including DAC after S4 | S1→S2→S3→S4→DAC→logical-model/DAC review→Physical Schema→Field Mapping→Seed/edge-case evidence→Storage Validation evidence only if executed. Không infer physical choices hoặc hand-edit generated artifacts. |
| P10 | Complete & Validate Implementation Documentation | Inventory và validate đầy đủ cả ba package specs/001\|002\|003; hoàn tất spec/research/plan/data-model/contracts/quickstart/tasks; chạy I1 clarify → I2 checklist → I3 plan → I4 tasks → I5 analyze; resolve blocking findings; xuất implementation-readiness report. Không chạy task hoặc sửa code/test/migration/runtime. |
| P11 | Repository-wide Final Audit | Search canonical names/IDs/old terms; diff review; validate phase references, version/date/link/coverage; classify remaining stale items. |

## 5.1 P2 — cách sửa Spec-M03 đúng thứ tự

- Sửa section sở hữu nghĩa trước: Purpose/Scope và Actors nếu boundary/role đổi.

- Sửa User Scenarios/Acceptance để phản ánh outcome mới.

- Sửa Flow/Sequence nếu transition hoặc participant thay đổi.

- Sửa FR table, sau đó Business Rules để guard/edge-case không mâu thuẫn.

- Sửa logical contracts/entities cuối cùng sau khi behavior đã rõ; không invent physical column/type.

- Với mỗi field/rule thay đổi, nhận diện presence/blank/null/format/range/length/cardinality/uniqueness/cross-field constraint và open decision. Chưa có source thì ghi `TBD-HUMAN`; không đẩy quyết định blocking xuống physical-schema phase.

- Sửa cross-module section/report semantics/retention khi thực sự bị tác động.

- Cập nhật metadata version/date/status chỉ sau khi content ổn định.

## 5.2 P3 — M03 internal gate bắt buộc

| Gate | Pass condition |
| --- | --- |
| Scope | In-scope/out-of-scope không tự mâu thuẫn; Won’t vẫn đúng. |
| Actors/Roles | Permission matrix, scenarios, BR và screen responsibilities dùng cùng role semantics. |
| US ↔ FR | Mỗi thay đổi scenario có FR/BR tương ứng; không có FR mới thiếu acceptance path. |
| Flows | Diagram là biểu diễn của spec; không có node/branch invent business behavior. |
| Lifecycle | Status transition + permission + atomicity + failure outcome rõ. |
| Contracts | Tên/shape/version/producer/consumer nhất quán; frozen vs live được phân biệt. |
| Entities | Canonical entity vs projection/transport/value object phân loại đúng. |
| Validation decisions | Constraint có source được ghi rõ; open product decision được trace bằng `TBD-HUMAN`, không bị che bởi type/validator/seed convention. |
| Traceability | Mọi ID/reference tồn tại; không re-use ID cho nghĩa khác. |

# 6. Ma trận file-by-file: sửa gì và khi nào

## 6.1 Canonical specs, MVP và function list

| Artifact | Mức | Trigger | Validation |
| --- | --- | --- | --- |
| docs/spec/spec-M03.md | MUST | Bất kỳ rebaseline M03. | FR/BR/US/flow/contracts/entities/version. |
| docs/spec/spec-M01.md | CONDITIONAL | Published Route/JourneySnapshot/availability/start/offline handoff semantics đổi. | Consumer contract + BR/US/FR impacted only. |
| docs/spec/spec-M02.md | CONDITIONAL | LiveStationContent/QR/frozen journey/SessionSyncRecord semantics đổi. | Producer/consumer + session/content rules. |
| MVP-Scope.md | CONDITIONAL | Priority, release gate, Won’t, cross-module increment/boundary đổi. | Must/Should/Could/Won’t không làm mất spec behavior. |
| docs/function list/function-list-M03.md | USUALLY MUST | FR/function/sub-function mapping hoặc M03 responsibility đổi. | FN/SF stable ID + 16 FR coverage hoặc updated count. |
| function-list-M01/M02.md | CONDITIONAL | Spec-M01/M02 bị đổi. | FN/SF/FR coverage, no new behavior beyond spec. |

## 6.2 Architecture

| Artifact | Trigger phải sửa | Không sửa khi… |
| --- | --- | --- |
| docs/architecture/context-diagram.md | Producer/consumer boundary, module ownership, external actor/service boundary hoặc canonical contract đổi. | Chỉ wording nội bộ M03, không ảnh hưởng context. |
| docs/architecture/usage-flow.md | Flowchart trong spec M03/M01/M02 thay đổi. | Spec diagram không đổi. |
| docs/architecture/sequence-diagrams.md | Sequence block/participant/order/interaction thay đổi. | Không đổi sequence. |
| docs/architecture/system-configuration.md | Runtime ownership/data placement/offline/data flow/integration contract thay đổi. | Chỉ business wording; topology giữ nguyên. |
| docs/architecture/tech-stack.md | Technology choice/responsibility/non-goal đổi. | Pure product behavior/data rule. |
| docs/architecture/environment.md | Environment/config/auth/report timezone/public-secret boundary đổi. | Không đổi runtime config. |
| docs/architecture/README.md | Baseline version/date hoặc member-doc scope đổi. | Nội dung member docs không đổi. |

## 6.3 Screen inventory và screen specs

| Artifact | Trigger | Hành động |
| --- | --- | --- |
| screens/screen list/screen-list-M03.md | Field/action/state/guard/role/navigation/FR mapping của M03 đổi. | Update inventory, descriptions, FR coverage, embedded/background behavior. |
| screens/screen-spec/M03/000…007 | Screen tương ứng hiển thị/nhập/guard/error state khác. | Chỉ sửa screen impacted; giữ SCR IDs. |
| screen-list-M01 + screen-spec/M01 | M03 thay đổi public route/snapshot làm UI M01 cần field/state/start behavior mới. | Update affected screen + FR mapping. |
| screen-list-M02 + screen-spec/M02 | Live QR/content/frozen journey/session sync behavior visible/change state. | Update affected screen + state/error/coverage. |
| screens/screen list/README.md | Screen counts/coverage/version summary đổi. | Sync index only; không định nghĩa behavior. |

| Known stale metadata: Ở baseline hiện tại, screen-list-M03 §7 và screen inventory README vẫn nói target screen specs chưa tồn tại, nhưng repository đã có đủ 8 file dưới screens/screen-spec/M03/. Khi chạm nhóm screen docs, nên sửa metadata này; không dùng câu stale đó để kết luận phải tạo file mới. |
| --- |

## 6.4 Data / Database artifacts

| Stage / file | Owner | Trigger |
| --- | --- | --- |
| data/01-entity-dictionary.md | Canonical entity vocabulary | Entity/identity/owner/alias/projection classification hoặc source fields/rules thay đổi. |
| data/02-crud-matrix.md | FN-level direct CRUD evidence | Function↔entity interaction đổi; function list đổi. |
| data/03-erd.mmd + 03-erd-preview.md + 03-erd-review.md | Canonical relationship model | Entity/relationship/cardinality/source link đổi. |
| data/04-data-model.md | Authoritative logical model | Logical field/type/presence/validation/lifecycle/relationship đổi. |
| data/04-data-model.dbml | Visualization of S4 | S4 structural representation đổi; Markdown thắng nếu conflict. |
| **data/08-data-acceptance-criteria.md (NEW)** | Cross-project derived field/value acceptance catalog, hoàn tất sau S4 | Tạo trong refactor này. Reconcile canonical rules với logical fields khi field/type/presence/enum/range/length/format/array-size/uniqueness/cross-field rule đổi. Mọi criterion phải có source; thiếu source → `TBD-HUMAN`, không tự chọn số. |
| data/05-review.md | Logical-model/DAC review gate | S1–S4 hoặc DAC baseline/counts/decisions change; review cả logical model và field-level acceptance coverage trước physical design; ghi conclusion mới, không silent patch. |
| data/06-physical-schema.md | Physical persistence design | Approved logical model requires storage/schema mapping change. |
| data/schema/field-mapping.md | Generated logical→physical mapping | Field mapping changes; regenerate, do not hand edit. |
| data/seed/*.csv | Canonical fixture inputs | Field/rule/identity/enum/contract fixture needs matching source update. |
| data/seed/edge-cases.json + edge-case-register.md | Generated evidence | BR/boundary/enum changed; regenerate, do not hand edit. |
| data/seed/README.md | Seed package instructions/coverage | Counts, source fingerprint, generated artifact workflow change. |
| data/07-storage-validation.md | Executed validation evidence | Only append/update after actual new validation; otherwise mark prior evidence as baseline-specific. |

## 6.5 Implementation documentation under specs/

Đây là **Layer 3 — Implementation Documentation**, tách biệt với canonical specs (Layer 1) và derived documentation (Layer 2). Sau khi P9 ổn định, P10 bắt buộc xử lý **cả ba package** đến trạng thái complete, internally consistent và implementation-ready, đủ để future coding bắt đầu mà không cần thêm một documentation-generation phase. Existing content đúng phải được giữ; artifact không đổi có thể ghi `NO CHANGE` sau full validation, nhưng `NO CHANGE` không bao giờ thay thế completeness check hoặc che tài liệu thiếu/stale.

### 6.5.1 Baseline inventory đã xác minh và quy tắc re-inventory

Inventory dưới đây đã được xác minh tại baseline tree SHA của runbook. P10 phải inventory lại active ref trước khi sửa vì file có thể đã đổi; không giả định ba package có cấu trúc giống nhau và không tạo duplicate contract.

| Package | Core artifacts hiện có | Contracts hiện có | Artifact bổ sung |
| --- | --- | --- | --- |
| `specs/001-m01-implementation/` | `spec.md`, `research.md`, `plan.md`, `data-model.md`, `quickstart.md`, `tasks.md` | `application-flow-contract.md`, `local-persistence-contract.md`, `public-source-contract.md` | Không có validation report riêng trong baseline inventory. |
| `specs/002-m02-implementation/` | `spec.md`, `research.md`, `plan.md`, `data-model.md`, `quickstart.md`, `tasks.md` | `application-flow-contract.md`, `live-content-contract.md`, `local-persistence-contract.md`, `terminal-sync-contract.md` | Không có validation report riêng trong baseline inventory. |
| `specs/003-m03-implementation/` | `spec.md`, `research.md`, `plan.md`, `data-model.md`, `quickstart.md`, `tasks.md` | `admin-command-contract.md`, `admin-ui-flow-contract.md`, `auth-account-contract.md`, `media-storage-contract.md`, `publication-public-contract.md`, `session-reporting-contract.md` | `backend-pass5-validation.md`, `backend-pass6-validation.md` là historical evidence. |

Nếu active ref có thêm/bớt file, P10 report phải ghi delta so với inventory này. Contract mới chỉ được tạo khi approved upstream specification thực sự cần một interface chưa có owner; ưu tiên hoàn tất contract hiện hữu thay vì nhân bản cùng responsibility.

### 6.5.2 Mandatory artifact-level completeness và validation matrix

| Artifact category | Nội dung bắt buộc | Validation condition |
| --- | --- | --- |
| `spec.md` | Feature scope/boundary; actors và user scenarios; functional behavior; acceptance scenarios; business rules; relevant contract refs; error/edge cases; dependencies; traceability về canonical specs. | Không invent requirement; mọi behavior có canonical source; scope và acceptance không mâu thuẫn. |
| `research.md` | Technical decisions; alternatives/rationale khi áp dụng; constraints/assumptions; unresolved technical questions; compatibility; relevant repository decisions. | Phân biệt approved decision với unresolved assumption; blocking unknown không bị trình bày như quyết định. |
| `plan.md` | Technical approach; component responsibilities; architecture/dependencies; data flow/persistence boundaries; integration contracts; implementation sequence; risks; validation strategy; downstream refs. | Đủ chi tiết để downstream developer triển khai; không conflict Layer 1–2 hoặc constitution. |
| `data-model.md` | Applicable entities/value objects; logical fields/types; relationships/identities; persistence responsibility; validation; lifecycle/state; mapping về P9; mutable/immutable; cross-module dependencies. | Tôn trọng S4, DAC, physical mapping đã duyệt; không invent schema/column/limit/relationship. |
| `contracts/*.md` | Purpose/ownership; producer/consumer; inputs/outputs; field semantics; types/validation; transitions; errors/failures; versioning/compatibility; cross-module dependencies. | Review mọi contract thực có; producer và consumer dùng cùng semantics; không tạo duplicate contract. |
| `quickstart.md` | Environment prerequisites; configuration; setup; future run/verification commands or procedures; dependencies; expected success evidence; limitations. | Không tuyên bố setup/run/deploy/validation đã PASS nếu chưa thực thi; expected result phải phân biệt với observed result. |
| `tasks.md` | Setup/config; DB/persistence; backend/API; frontend/application flow; integration; validation/error handling; applicable unit/integration/acceptance tests; docs/ops work; dependencies/order; acceptance criteria. | Derive từ approved spec/plan/model/contracts; dependency-aware; giữ completed history chỉ khi có evidence; doc update không tự biến task thành complete. |
| Historical validation docs | Baseline/date/scope và result đã thực thi trong quá khứ. | Không rewrite thành bằng chứng cho baseline mới; dùng `NOT REVALIDATED` hoặc tạo evidence mới ở phase thực thi sau này. |

Với từng file thực tế, lập working matrix sau và không đóng package khi còn ô `MISSING`, `INCOMPLETE`, `INCONSISTENT`, `OUTDATED`, `UNSUPPORTED` hoặc `BLOCKED`:

| Package | Artifact/path | Required sections | Canonical/derived sources | Current status | Gap/action | Validation evidence | Final status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M01/M02/M03 | Exact path | Section list hoặc justified `N/A` | Exact spec/FR/BR/P9/DAC/architecture refs | COMPLETE / MISSING / INCOMPLETE / INCONSISTENT / OUTDATED / UNSUPPORTED / BLOCKED | Minimal controlled edit hoặc clarification | Skill report/checklist/source comparison | READY / NOT READY |

### 6.5.3 Detailed P10 execution workflow

Mỗi Spec-Kit invocation phải resolve đúng `FEATURE_DIR` của package đang xử lý trước khi cho phép write. Chạy theo từng package M01, M02, M03; không để branch/current-feature detection ghi nhầm package. Phải đọc full `SKILL.md`, kiểm tra `.specify/extensions.yml` và thực thi mandatory hooks theo chính skill trước khi tuyên bố gate đã chạy.

| Step | Inputs | Required skill/tool | Actions | Expected outputs | Validation conditions | Blocking conditions |
| --- | --- | --- | --- | --- | --- | --- |
| 1. Inventory packages | Active ref, baseline inventory §6.5.1 | Git/GitHub/`rg`; read-only tree inspection | Liệt kê mọi file trong ba package và mọi contract filename thực tế; ghi SHA/snapshot để bảo vệ correct existing content; phân loại historical evidence. | Signed inventory + content baseline + delta from runbook baseline. | Cả M01/M02/M03 được enumerate; không dựa vào wildcard giả định. | Không đọc được active ref/package tree. |
| 2. Build completeness matrix | Inventory; matrix §6.5.2 | Controlled document review | Tạo một row cho từng artifact/required section; gán status và owner. | Artifact completeness matrix. | Không thiếu file/section khỏi matrix; `N/A` có rationale. | Artifact scope hoặc ownership chưa rõ. |
| 3. Map upstream requirements | Approved Layer 1–2, P9/DAC, architecture/screens | Traceability search/matrix | Map canonical FR/BR/contract/data rule và derived dependency vào target implementation artifacts. | Requirement→artifact map + orphan lists. | Mọi affected canonical requirement có target; unsupported downstream statements bị flag. | Canonical/P9 baseline chưa approved hoặc source ref không resolve. |
| 4. Resolve clarification gaps | Gap/orphan lists; affected `spec.md` | **I1 `speckit-clarify`** | Chạy skill theo actual instructions cho đúng package; hỏi tối đa theo skill; ghi business decision vào canonical spec trước, rồi sync package. | Clarification report; updated source refs; deferred/non-blocking assumptions. | Không fabricate requirement; blocking business ambiguity đã resolve ở canonical source. | Skill unavailable/incompatible; blocking answer chưa có; prerequisite path sai. |
| 5. Validate and complete implementation specifications | Implementation spec + source maps | **I2 `speckit-checklist`** + controlled editing | Tạo requirements-quality checklist về completeness, clarity, consistency, acceptance, traceability, edge cases; reviewer đánh giá, sửa `spec.md` theo canonical sources và lặp lại review. | Unchecked generated checklist + evidence-backed review/finding log + complete implementation `spec.md`. | Blocking finding đã close trước I3; `[x]` chỉ là reviewer approval về requirement quality, không phải code completion. | Blocking checklist finding; checklist chưa được reviewer/evidence đánh giá; edit cần requirement chưa có nguồn. |
| 6. Complete planning/design artifacts | Stable `spec.md`, constitution, P9/DAC, matrix | **I3 `speckit-plan`** + controlled editing | Chạy plan workflow; diff output với content baseline, merge để giữ correct existing content; hoàn tất `plan.md`, `research.md`, `data-model.md`, contracts và `quickstart.md`; bổ sung thủ công phần skill không tạo nhưng matrix yêu cầu. | Complete planning/design set cho từng package. | Không còn `NEEDS CLARIFICATION`; constitution gates pass; actual contracts được preserve/complete; không có silent overwrite. | Plan skill/gate failure; unresolved decision; output conflict upstream; skill target sai package. |
| 7. Complete task breakdown | Stable spec + complete plan/design set | **I4 `speckit-tasks`** | Generate/update dependency-ordered `tasks.md`; yêu cầu explicit applicable testing coverage; merge với evidence-backed completed history mà không false-complete. | Complete implementation task list, dependency graph, story coverage. | Task format/path/order valid; spec/plan/contracts/data/test coverage đầy đủ; không task nào được execute. | Planning artifact chưa stable; task thiếu source hoặc impossible ordering. |
| 8. Run cross-artifact analysis | Complete spec/plan/tasks + constitution | **I5 `speckit-analyze`** | Chạy read-only analysis sau task generation; capture findings/metrics. | Verifiable analysis report cho mỗi package. | Spec↔plan↔tasks core analysis hoàn tất; không claim tool sửa file. | Required core artifact thiếu hoặc analyze abort/fail. |
| 9. Remediate and repeat | I2/I5 findings; full artifact set | Controlled edits + rerun relevant I1–I5 | Sửa minimal source-owning artifact; regenerate/revalidate downstream artifact bị ảnh hưởng. | Closed finding log; repeat-run evidence. | Không còn CRITICAL/HIGH/blocking finding; không sửa canonical meaning ở Layer 3. | Finding cần human decision hoặc mandatory skill không rerun được. |
| 10. Cross-module contract validation | All M01/M02/M03 contracts; DAC; canonical producer/consumer map | Read-only comparison + targeted checklist | So khớp names, ownership, directions, shapes, field semantics, failures, version/compatibility across modules. | Producer↔consumer compatibility matrix. | M01↔M02↔M03 pairs agree; DAC semantics match contract fields. | Contract contradiction, missing owner hoặc unapproved compatibility change. |
| 11. Confirm artifact completeness | Matrices, reports, final docs | Full-document review | Re-evaluate every row/section and `N/A`; distinguish unchanged-but-validated from edited. | Package-level READY/NOT READY assessment. | Mọi required artifact exists; all required sections complete/justified; no blocking gap. | Any unresolved missing/incomplete/stale/unsupported item. |
| 12. P10 report and handoff | All evidence above | Reporting template §10.1 | Report files reviewed/changed, skill executions, findings/resolution, assumptions, task status and future code entry point. | P10 completion report for future implementation. | Evidence links resolve; explicitly says tasks/code were not executed. | Missing evidence, false PASS hoặc incomplete package. |

#### Canonical authority guard cho I1 `speckit-clarify`

Actual skill có thể ghi accepted answer trực tiếp vào active implementation package `spec.md`; khả năng đó không biến Layer 3 thành source of truth. Trước khi accept/integrate từng clarification:

1. Phân loại câu hỏi là business behavior, product acceptance, cross-module contract hay technical implementation detail.
2. Với ba loại đầu, dừng integration cho đến khi named human approver quyết định và canonical Spec-M01/M02/M03 tương ứng được cập nhật trước.
3. Sync affected Layer 2 artifacts theo P6–P9 khi decision tác động chúng.
4. Sau đó mới đồng bộ implementation `spec.md`; answer/history trong package phải reference canonical decision, không tự đứng làm authority.
5. Diff sau mỗi skill write để chứng minh không có business behavior mới ngoài canonical source.
6. Nếu skill đã ghi Layer 3 trước khi guard hoàn tất, đánh dấu package `BLOCKED`; giữ diff làm evidence, xin approval để sửa current-operation hunk, rồi chạy lại canonical/derived/implementation validation. Không âm thầm “promote” câu chữ đó lên canonical spec.

Technical-only clarification chỉ được ghi trực tiếp ở Layer 3 khi không đổi observable behavior, product acceptance, module contract hoặc P9 data semantics và có approved architecture/repository source. Nếu phân loại chưa chắc chắn, dùng `NEEDS HUMAN DECISION`.

### 6.5.4 Mandatory Spec-Kit execution gates

| Gate | Skill | Actual capability and required use in P10 | Required evidence | PASS condition |
| --- | --- | --- | --- | --- |
| I1 — Clarification | `speckit-clarify` | Mandatory execution cho từng package trước plan, sau H2 path verification. Skill scan active feature spec, hỏi targeted questions và có thể ghi accepted answers; áp dụng canonical authority guard ở trên. Nếu không có câu hỏi hợp lệ, lưu outcome “no critical ambiguities”. | Skill source/version, actual invocation, resolved paths, inputs/outputs, questions/answers hoặc explicit zero-question result, canonical decision refs, changed-file review, hook result. | No blocking ambiguity; no fabricated answer; Layer 3 không chứa business rule thiếu canonical source. |
| I2 — Specification Quality | `speckit-checklist` | Generates/appends reviewer-owned requirements-quality checklist; it does **not** test implementation and does not auto-check new items. Invoke with P10 completeness/traceability/edge-case scope, then perform documented review. | Checklist path/item count plus reviewer result and blocking finding log. | Completeness, clarity, consistency, acceptance coverage, traceability and edge cases pass or non-blocking gaps are explicit. |
| I3 — Implementation Planning | `speckit-plan` | Mandatory planning workflow: plan plus Phase 0 `research.md`, Phase 1 `data-model.md`, `contracts/`, `quickstart.md`. Controlled editing must complete missing required sections without overriding sources. | Resolved target paths, generated/updated artifact list, constitution pre/post gates, hook result. | All required planning/design artifacts complete; no unresolved clarification or gate failure. |
| I4 — Task Generation | `speckit-tasks` | Mandatory only after I3 stable; produces dependency-ordered, user-story-organized `tasks.md`. Invocation context must explicitly request applicable unit/integration/acceptance-test tasks. Never execute generated tasks. | Task path/count, per-story breakdown, dependency/parallel map, strict-format result, hook result. | Every approved implementation requirement and applicable test area has executable future work; completion markers preserve evidence. |
| I5 — Cross-Artifact Analysis | `speckit-analyze` | Mandatory read-only analysis after tasks; core capability covers spec/plan/tasks + constitution. Supplement it with P10 matrices for contracts↔DAC, plan↔data model and cross-module compatibility. | Analysis report/metrics plus supplemental matrix and remediation rerun log. | No blocking inconsistency, uncovered requirement, contradictory/obsolete item or constitution violation. |

`speckit-specify` chỉ dùng khi có phê duyệt tạo feature/package mới hoặc actual instruction hỗ trợ existing-package workflow. `speckit-implement` bị cấm trong P10. `speckit-converge` bị loại vì codebase convergence ngoài scope. `speckit-constitution` chỉ dùng khi governance change được explicit approve. Nếu mandatory skill unavailable, incompatible, resolve sai package hoặc không thể chạy, P10 phải ghi `BLOCKED`; manual editing không được giả làm successful skill execution.

### 6.5.5 P10 Definition of Done — mandatory acceptance gate

P10 chỉ PASS khi **tất cả** điều kiện sau có evidence:

1. Cả ba implementation package đã được inventory trên active ref.
2. Mọi required documentation artifact tồn tại.
3. Mọi required section complete hoặc explicit `N/A` có justification.
4. Mọi affected canonical requirement trace được vào implementation documentation.
5. Contract nhất quán giữa producer và consumer modules.
6. Data model tôn trọng approved P9 logical/physical documentation và DAC.
7. Implementation plan đủ technical detail cho downstream development.
8. Task list cover toàn bộ approved implementation work và applicable testing.
9. I1–I5 đã thực thi theo applicability/order với outcome kiểm chứng được; không chỉ nhắc tên skill.
10. Không còn blocking inconsistency; unresolved non-blocking assumption được ghi rõ owner/impact/follow-up.
11. Implementation-readiness assessment cho từng package là `READY`, không suy từ việc Markdown được generate thành công.
12. Không application code, migration, Edge Function/RPC, runtime configuration hoặc test nào bị sửa; task chưa được execute.

Giữ producer/consumer ownership, canonical contract names và stable identifiers trừ khi approved decision đổi chúng. Không dùng Layer 3 để tạo business requirement mới hoặc override Layer 1–2.

| Historical validation rule: backend-pass5-validation.md, backend-pass6-validation.md và các phần dated appendix của storage validation là bằng chứng lịch sử. Không rewrite để “biến” PASS cũ thành PASS cho spec mới. Baseline mới cần evidence mới hoặc ghi rõ NOT REVALIDATED. |
| --- |

## 6.6 README, governance và operating docs

| Artifact | Mặc định | Chỉ sửa khi |
| --- | --- | --- |
| README.md | REVIEW | Module summary/version/status/entry link hoặc capability summary thay đổi. |
| docs/README.md | REVIEW | Baseline version/status/index link thay đổi. |
| AGENTS.md | NO CHANGE | Canonical contract names/boundaries, hard rules, 16-entity baseline, file ownership/validation policy đổi có explicit approval. |
| .specify/memory/constitution.md | NO CHANGE | Governance principle thật sự đổi; ordinary product refactor không chạm. |
| supabase/README.md | CONDITIONAL | DB/Auth/seed/operator workflow/deployment procedure thay đổi. |

# 7. P9 — Database/Data refactor, DAC và hard rules

| Không nhảy stage: M03 spec change không cho phép sửa physical schema “theo cảm giác”. Mỗi stage lấy quyết định từ upstream và phải tự pass gate của mình trước khi xuống stage tiếp theo. |
| --- |

| Substep P9 | Input | Output | Câu hỏi gate |
| --- | --- | --- | --- |
| S1 — Entity Dictionary | Approved Spec M01–M03 + Function Lists | `data/01-entity-dictionary.md` | Có đổi canonical entity/identity/owner hay chỉ projection/transport? |
| S2 — CRUD Matrix | S1 + Function Lists | `data/02-crud-matrix.md` | FN-level effect trực tiếp nào thay đổi? Có gán nhầm indirect effect không? |
| S3 — ERD and relationship review | S1/S2 + source rules | `data/03-erd.mmd`, preview và relationship review | Cardinality/relationship có source-backed không? |
| S4 — Logical Data Model and DBML | S1–S3 + canonical specs | `data/04-data-model.md` + DBML | Field/type/presence/lifecycle/validation đều có source? |
| DAC — Field-level reconciliation | Approved S4 + canonical validation rules/open decisions đã nhận diện ở P1–P5 | `data/08-data-acceptance-criteria.md` | Mỗi changed field/rule có source hoặc explicit `TBD-HUMAN`? DAC có chỉ tổng hợp, không tạo requirement? |
| Review — Logical-model/DAC gate | S1–S4 + DAC | `data/05-review.md` và gate decision | Entity/relationship/traceability/minimality/integration và DAC coverage có pass? Blocking `TBD-HUMAN` đã được sửa trong canonical spec chưa? |
| Physical Schema | Approved S4 + DAC + review | `data/06-physical-schema.md` | Physical design có giữ logical semantics và không tự tạo business limit? |
| Field Mapping | Approved physical schema | `data/schema/field-mapping.md` | Mapping có regenerate và trace về logical field không? |
| Seed/edge-case evidence | Spec/S4/DAC/physical mapping | Canonical CSV + generated edge-case evidence | Fixture có matching source và boundary coverage? Generated output có regenerate thay vì hand-edit? |
| Storage Validation evidence | New physical/seed baseline | `data/07-storage-validation.md` | Validation nào đã thực sự chạy? Phần nào vẫn `NOT RUN`? Không dùng evidence lịch sử cho baseline mới. |

## 7.1 Hard rules cần giữ

- Không tự suy đoán UUID/TEXT/INTEGER/TIMESTAMP/PK/FK/nullability/uniqueness/cardinality/retention/delete behavior.

- Phân biệt canonical entity với contract/projection/transport payload/embedded value/report output/transient UI state.

- Phân biệt mutable source với frozen/historical copy; không thay frozen value bằng live reference chỉ vì implementation tiện hơn.

- SessionSyncRecord là transport contract; SessionRecord là canonical M03 entity.

- Current published content là projection của CheckpointContent, không phải entity mới.

- Baseline hiện tại có 16 canonical entities; thêm/bớt chỉ khi spec mới + explicit approval hỗ trợ.

- CRUD chỉ phản ánh effect trực tiếp; archive/withdraw/replace/invalidate không mặc định là Delete.

- data/04-data-model.md là authoritative S4; DBML là visualization.

- DAC được hoàn tất sau S4 và phải được review cùng logical model trước Physical Schema. Nếu DAC phát hiện requirement thiếu hoặc mâu thuẫn, quay lại canonical spec tương ứng, giải quyết rồi lặp lại các validation downstream bị ảnh hưởng.

- Không suy business limit từ PostgreSQL type, Zod validator, seed data hoặc implementation convention. Blocking `TBD-HUMAN` của changed field phải được giải quyết trong canonical spec trước khi review gate phê duyệt.

- Generated mapping/edge-case artifacts không sửa tay.

## 7.2 Cách xử lý số đếm và logical-model/DAC review gate sau rebaseline

Các con số hiện tại như 16 canonical entities, 21 relationship IDs, 17 CSV/95 records, 44 BR coverage hoặc các PASS result là property của baseline hiện tại. Nếu spec mới làm thay đổi các tập này, phải tái tính và cập nhật review/evidence; không giữ số cũ chỉ để tài liệu trông ổn định.

## 7.3 Data Acceptance Criteria — artifact mới bắt buộc cho toàn dự án

### 7.3.1 Mục đích và vị trí trong repository

Tạo mới **`data/08-data-acceptance-criteria.md`** như một catalog kiểm tra dữ liệu dùng chung cho M01, M02 và M03. Artifact này giải quyết đúng khoảng trống hiện tại: repository đã mô tả type, enum, presence, uniqueness, lifecycle và một số boundary rule, nhưng **chưa có một nơi duy nhất tổng hợp đầy đủ các điều kiện chấp nhận dữ liệu như min/max, max length, blank/null, format, array cardinality và cross-field rule**.

`08-data-acceptance-criteria.md` là **derived validation catalog**, không phải nguồn tạo behavior mới. Trong P1–P5 phải nhận diện source-backed rule và unresolved product decision; đến P9, sau khi S4 ổn định, mới hoàn tất coverage ở field level. Thứ tự authority và dependency phải giữ:

1. `docs/spec/spec-M01.md`, `spec-M02.md`, `spec-M03.md` — behavioral/contract source of truth.
2. Human clarification/decision đã được ghi lại vào canonical spec.
3. Layer 2 không có quyền tạo behavior: trong P9, S1–S4 biểu diễn logical structure trước; `data/08-data-acceptance-criteria.md` sau đó tổng hợp canonical acceptance rules và reconcile chúng với logical field/path.
4. S1–S4 và DAC phải cùng pass logical-model/DAC review gate trước physical design.
5. Physical schema, field mapping và seed evidence — downstream của review gate.
6. Layer 3 Implementation Documentation — downstream của canonical và derived documentation đã ổn định.
7. `data/07-storage-validation.md` — evidence đã thực sự chạy, không phải nơi đặt rule mới.

**Nếu một max length/range chỉ tồn tại trong physical schema hoặc code nhưng không có trong spec, nó không tự động trở thành product acceptance criterion.** Trước tiên phải quyết định xem đó là business/product rule hay chỉ technical guard. Nếu là product rule, sửa canonical spec trước rồi mới sync DAC.

### 7.3.2 Quy tắc không được vi phạm khi điền acceptance criteria

- Không dùng các giá trị quen thuộc như `50`, `100`, `255`, `1000`, `2 MB`, `10 MB` chỉ vì “thường dùng”.
- Không suy ra `>= 1` cho `sequence`, `contentVersion`, `revision` hoặc ID nếu canonical source chỉ nói unique/stable.
- Không biến PostgreSQL/Dexie/Zod type thành business range nếu spec không nói như vậy.
- Không biến `text` thành `varchar(n)` chỉ để có max length.
- Không lấy giới hạn provider/framework làm business rule trừ khi sản phẩm chủ động chấp nhận giới hạn đó và ghi nó vào spec.
- Không nhầm `Required` với “non-empty”: một String có thể Required nhưng chỉ được xem non-empty khi source nói rõ.
- Không nhầm `Optional` với nullable database column; contract presence và physical nullability là hai lớp khác nhau.
- Không nhầm default với maximum. Ví dụ report mặc định 30 ngày **không tự động** có nghĩa custom range tối đa 30 ngày.
- Không dùng snapshot retention `< 30 days` để suy ra được phép delete sau ngày 30; baseline hiện tại còn có quyết định giữ toàn bộ M03 records trong MVP.
- Mọi criterion mới ảnh hưởng consumer M01/M02 phải đi qua cross-module contract analysis.

### 7.3.3 Trạng thái criterion bắt buộc

Mỗi dòng trong Data Acceptance Criteria phải có một trong các trạng thái sau:

| Status | Ý nghĩa | Có được dùng để chặn dữ liệu? |
| --- | --- | --- |
| `SOURCE-BACKED` | Có rule rõ trong canonical spec/human decision đã ghi vào spec. | Có. |
| `TBD-HUMAN` | Cần quyết định sản phẩm nhưng source hiện chưa định nghĩa. | Chưa; đây là open decision. |
| `TECHNICAL-ONLY` | Guard của storage/provider/runtime, không phải business acceptance rule. | Chỉ ở technical boundary; không được mô tả như product rule. |
| `N/A` | Dimension không áp dụng cho field này. | Không. |
| `DEPRECATED` | Rule cũ đã được thay thế; giữ để truy vết nếu cần. | Không dùng cho baseline mới. |

Đối với field vừa bị thay đổi trong refactor M03, **không được đóng final gate nếu criterion quan trọng vẫn là `TBD-HUMAN`** và lựa chọn đó ảnh hưởng UX, contract, data model, compatibility hoặc validation.

### 7.3.4 Cấu trúc chuẩn của `data/08-data-acceptance-criteria.md`

Khuyến nghị một dòng cho mỗi field hoặc một rule cross-field. Dùng stable ID dạng `DAC-M01-###`, `DAC-M02-###`, `DAC-M03-###`; ID đã phát hành không tái sử dụng cho nghĩa khác.

| Column | Nội dung |
| --- | --- |
| `DAC ID` | Stable identifier của criterion. |
| `Module` | M01 / M02 / M03 / CROSS. |
| `Entity / Contract` | Route, JourneySnapshot, SelectedRouteContext v2, SessionSyncRecord, v.v. |
| `Field path / Rule` | Exact path hoặc tên cross-field rule. |
| `Logical type` | Lấy từ spec/S4; không tự đổi type. |
| `Presence` | Required / Optional / Conditional. |
| `Null / absent` | Khi nào được thiếu; không suy ra từ DB nullability. |
| `Blank / whitespace` | Cho phép empty/blank hay phải non-empty/trimmed. |
| `Allowed values / format` | Enum, UUID, Date/DateTime, email normalization, resource-ref format nếu source có. |
| `Min` / `Max` | Numeric/date range nếu có source; thiếu thì `TBD-HUMAN` hoặc `N/A`. |
| `Min length` / `Max length` | String/array length nếu có source; thiếu thì `TBD-HUMAN` hoặc `N/A`. |
| `Unit / precision` | km, minutes, count, decimal/rate, v.v. nếu source định nghĩa. |
| `Uniqueness` | Global / within route / within session / composite uniqueness. |
| `Cross-field rule` | Ví dụ `endedAt >= startedAt`, safetyWarning both-or-none. |
| `Normalization` | UTC, normalized email, stable ID, canonical enum casing. |
| `Error / reject behavior` | Chỉ ghi khi spec định nghĩa; nếu chưa có → không invent. |
| `Applies at` | Draft / submit / publish / start / sync / report / persistence. |
| `Source` | Exact spec section/FR/BR hoặc human decision. |
| `Status` | `SOURCE-BACKED`, `TBD-HUMAN`, `TECHNICAL-ONLY`, `N/A`, `DEPRECATED`. |
| `Notes` | Compatibility/consumer/edge-case note. |

### 7.3.5 Baseline acceptance rules đã có source trong repository

Bảng này là **inventory khởi đầu**, không thay thế file DAC chính thức. Khi tạo `data/08-data-acceptance-criteria.md`, tách các rule này thành field-level rows có source cụ thể.

| Area | Source-backed acceptance hiện có |
| --- | --- |
| Published Route | `status` dùng enum hiện hành; published `name.vi/en` và `description.vi/en` phải non-empty; `safetyWarning.vi/en` both-or-none; `distanceKm > 0`; `durationMin > 0`; `difficulty` theo enum; ba tag array phải có ít nhất một allowed value. |
| Time tag bands | `TIME_NGAN <= 90 phút`; `TIME_VUA > 90 đến 180 phút`; `TIME_DAI > 180 phút`. Boundary examples hiện có ở seed docs. |
| JourneySnapshot | Published snapshot có `status = DA_CONG_BO`; immutable; chứa every-and-only active checkpoint; checkpoint IDs và sequence unique; `qrIdentifiers` non-empty; `offlineResource` chỉ có cho `OFFLINE_REQUIRED`. |
| LanguagePreference | Chỉ `vi` hoặc `en`. |
| SelectedRouteContext v2 | `contractVersion = 2`; `handoffId` UUID globally unique và dùng cho tối đa một M02 session; `routeId` phải bằng manifest route; DateTime UTC; chỉ `AUTHORIZED` + unused mới tạo session. |
| OfflinePackage | Chỉ `SAN_SANG` được M02 consume; package/manifest route và contentVersion phải khớp; resource map đúng offline-required checkpoint; bilingual text non-empty; declared image phải có bytes khi package ready. |
| PlaySession | `sessionId` UUID unique; `sourceHandoffId` unique; tối đa một session `DANG_DIEN_RA` trên device; terminal state cần `endedAt`; frozen journey immutable. |
| CheckpointVisit | Identity `(sessionId, checkpointId)`; first `checkedInAt` immutable; DateTime UTC. |
| SessionSyncRecord | Chỉ terminal `HOAN_TAT` / `BO_DO`; `endedAt >= startedAt`; checkpoint IDs unique trong session; `checkedInAt` nằm trong session interval; payload không chứa visitor PII/device/GPS fields; identical retry idempotent, changed payload conflict. |
| Checkpoint | `checkpointId` stable; thuộc đúng một Route; `checkpointName` non-empty trước activation/publication; `(routeId, sequence)` unique cho non-archived checkpoint; `ONLINE_AVAILABLE` yêu cầu `fieldVerificationConfirmed = true`. |
| QRCode | `qrIdentifier` globally unique và stable; active checkpoint không được mất QR active cuối; replacement reason required khi identity replacement được submit; retired states terminal theo spec. |
| CheckpointContent | `introductionText` non-empty khi submit/publish; one revision stream per checkpoint/language; at most one published revision/language; approver khác submitter. |
| Media | `mediaId` UUID; type `IMAGE/AUDIO/VIDEO`; `usageRightsConfirmed = true` trước publish; chỉ published media đi ra public output; offline package chỉ bao gồm image. |
| AdminAccount | Email normalized + unique; role chỉ `CONTENT_STAFF` / `REVIEWER`; status theo lifecycle hiện hành; provider identity conditional/unique khi present; không được demote/deactivate Reviewer active cuối. |
| Reports | `fromDate` và `toDate` đi cùng nhau; `fromDate <= toDate`; thiếu pair thì default recent 30 days; counts `>= 0`; rates trong `0..1`, rate bằng `0` khi denominator bằng `0`; date filtering/grouping theo `Asia/Ho_Chi_Minh`. |
| Retention | Snapshot current + previous + version bị replace `< 30 days` được bảo vệ theo BR; đồng thời logical-model review baseline hiện tại giữ toàn bộ M03 canonical records trong MVP, nên không diễn giải mốc 30 ngày thành hard-delete permission. |

### 7.3.6 Những acceptance criteria hiện **chưa được canonical source định nghĩa đầy đủ**

Đây là phần quan trọng nhất của artifact mới. Baseline hiện tại cố ý dùng PostgreSQL `text` **không đặt arbitrary length limit**, và seed documentation cũng nêu rõ không invent numeric range cho version/identity/sequence. Vì vậy các mục dưới đây không được tự điền số; phải để `TBD-HUMAN` cho tới khi người dùng/nhóm sản phẩm quyết định và canonical spec được cập nhật.

| Nhóm field | Missing decision cần xác nhận |
| --- | --- |
| Stable String IDs | Max length, allowed character set/pattern, case-sensitivity/canonical casing cho `routeId`, `checkpointId`, `qrIdentifier`, `userId`, `auditId`, `entityId`. |
| Localized route text | Max length cho `name.vi/en`, `description.vi/en`, `safetyWarning.vi/en`; trim/whitespace policy; newline/markup policy. |
| Checkpoint text | Max length cho `checkpointName`, `installationLabel`, `replacementReason`, `reviewReason`, `introductionText`; blank/whitespace policy ngoài các điểm đã nói non-empty. |
| Numeric route fields | Có hay không upper bound cho `distanceKm`, `durationMin`; decimal precision/scale nếu muốn nó là product rule. |
| Version/revision/sequence | Min/max cụ thể cho `contentVersion`, `revision`, `concurrencyRevision`, `sequence`; baseline hiện không cho phép tự suy ra. |
| Collections | Max số checkpoint/route, QR/checkpoint, static images, audio/video resource, visits/session, array length của tag groups; min chỉ áp dụng nơi spec đã nói non-empty. |
| Email | Max length, exact normalization beyond “normalized + unique”, Unicode/IDN policy; provider limit nếu muốn trở thành product contract. |
| Media/resource | Max file size, allowed MIME types, image dimensions, audio/video duration, filename/path length, upload count; hiện source chỉ định loại media/quyền/publication semantics. |
| Report query | Max selectable date span; maximum rows/items; pagination/export limits. “Default 30 days” không phải maximum. |
| Administrative reasons | Max length cho close/reopen/reject/replacement reason nếu muốn UI/API reject vượt ngưỡng. |
| Payload/HTTP | Max request-body size, JSON depth, rate limit; đây có thể là technical-only guard trừ khi được product hóa trong spec. |

### 7.3.7 Workflow để quyết định một max length/range mới

Khi phát hiện field chưa có acceptance limit, dùng đúng thứ tự sau:

1. **Locate canonical field** trong Spec M01/M02/M03 và xác định producer/consumer.
2. **Classify the gap**: business/product requirement, cross-module compatibility constraint, hay technical-only guard.
3. Nếu là product/cross-module và có nhiều lựa chọn hợp lý, đánh dấu `TBD-HUMAN` và dùng `speckit-clarify` methodology để hỏi đúng một quyết định blocking tại một thời điểm.
4. Sau khi quyết định được chốt, **sửa canonical spec trước**: field constraint, FR/BR/contract/acceptance section tương ứng.
5. Nếu criterion ảnh hưởng public/frozen/terminal contract, sync consumer spec M01/M02 theo dependency.
6. Sync S1–S4 **chỉ khi logical model thực sự bị ảnh hưởng**.
7. Sau S4, hoàn tất `data/08-data-acceptance-criteria.md` với exact source reference và reconcile rule với từng logical field/path.
8. Nếu DAC reconciliation phát hiện requirement thiếu hoặc mâu thuẫn, quay lại canonical spec tương ứng, resolve rồi lặp lại các bước downstream bị ảnh hưởng.
9. Chỉ cho logical model và DAC qua review gate khi không còn blocking `TBD-HUMAN` trên changed fields.
10. Sau gate mới sync Physical Schema và regenerate Field Mapping nếu storage thực sự bị ảnh hưởng.
11. Update seed/edge-case docs theo source mới; generated artifacts phải regenerate, không hand-edit.
12. Không sửa `data/07-storage-validation.md` thành PASS mới nếu runtime validation chưa thực sự chạy.

### 7.3.8 Boundary-case matrix bắt buộc cho mỗi criterion

Khi criterion có min/max/length/range, DAC phải nói rõ boundary classes cần được cover trong seed/checklist/validation documentation sau này.

| Criterion type | Boundary classes tối thiểu |
| --- | --- |
| Numeric min/max | `< min`, `= min`, inside range, `= max`, `> max`; với open interval phải test exact boundary. |
| String length | absent/null theo presence rule; empty `""`; whitespace-only; length `min-1/min/max/max+1`; Unicode nếu field cho phép text tự do. |
| Enum | mọi allowed value; unknown value; wrong casing nếu casing canonical. |
| Array | absent nếu conditional/optional; empty; one item; duplicate; max/max+1 nếu max được định nghĩa; order rule nếu có. |
| Date/time | UTC format; equality boundary; before/after; timezone conversion edge; interval containment. |
| Identity/uniqueness | first insert, exact duplicate, conflicting duplicate, same logical identity khác normalization. |
| Cross-field | cả hai missing; chỉ field A; chỉ field B; cả hai valid; cả hai nhưng conflict. |
| Conditional presence | trigger false + absent; trigger false + unexpected value; trigger true + absent; trigger true + valid. |
| Rate/count | zero denominator; lower boundary 0; upper boundary 1; out-of-range negative/>1. |
| Retention | just before boundary; exactly at boundary; just after boundary; protected-by-other-rule case. |

### 7.3.9 Validation gate riêng cho Data Acceptance Criteria

`data/08-data-acceptance-criteria.md` chỉ được coi là PASS khi:

- Mọi field/contract path trong scope thay đổi có một DAC row hoặc explicit `N/A`.
- Mọi `SOURCE-BACKED` row có source reference resolve được.
- Không có number/length/range được thêm chỉ từ convention hoặc implementation convenience.
- Không còn `TBD-HUMAN` trên field bị thay đổi mà quyết định đó ảnh hưởng acceptance/consumer/data model.
- Cross-module duplicate fields giữ cùng acceptance semantics giữa producer và consumer.
- Enum/status/value sets trùng canonical spec.
- Required/Optional/Conditional không bị chuyển thành DB nullability rule.
- Current/frozen/historical values được phân biệt đúng.
- Technical-only limits được gắn `TECHNICAL-ONLY`, không trình bày như business rule.
- Boundary matrix đã có cho mọi criterion có range/length/date relationship.
- Nếu spec đổi làm `SPEC_SHA256`/seed coverage stale, runbook phải ghi rõ cần regenerate/revalidate; không bypass fingerprint.
- Data Acceptance Criteria update được liệt kê trong final change report.
- DAC và S4 đã được review cùng nhau trước khi cho phép physical design tiếp tục.

### 7.3.10 Template tối thiểu để tạo file DAC thật

```markdown
# Data Acceptance Criteria — Cúc Phương Quest

## 1. Purpose and authority
- Canonical source: Spec M01–M03.
- This file is derived. It does not create product behavior.
- Missing product limits are `TBD-HUMAN`; do not invent values.

## 2. Status legend
SOURCE-BACKED | TBD-HUMAN | TECHNICAL-ONLY | N/A | DEPRECATED

## 3. Criteria catalog
| DAC ID | Module | Entity/Contract | Field path / Rule | Type | Presence | Blank/Null | Allowed values/Format | Min | Max | Min len | Max len | Uniqueness | Cross-field/Normalization | Applies at | Source | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

## 4. Open human decisions
| Decision ID | Field(s) | Missing criterion | Why it matters | Affected modules/contracts | Required before | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |

## 5. Boundary coverage
| DAC ID | Boundary classes required | Evidence artifact | Status |
| --- | --- | --- | --- |

## 6. Change history
| Date | Baseline/spec version | Change | Decision/source |
| --- | --- | --- | --- |
```

### 7.3.11 Tác động của DAC lên refactor Spec-M03

Nếu M03 change chỉ đổi wording và không đổi data semantics, DAC thường `NO CHANGE`. Nếu thay field/type/presence/status/enum/range/format/uniqueness/cross-field rule, DAC là **MUST CHANGE**. Nếu thay public snapshot/live/terminal contract, phải sync M01/M02 consumer/producer spec trước; sau đó cập nhật S1–S4 khi bị ảnh hưởng, hoàn tất DAC sau S4, rồi mới qua review và physical design.

Một field mới không được coi là “đã hoàn tất spec” chỉ vì đã có tên và type. Với field nhập từ người dùng/admin, refactor phải chủ động hỏi: **blank có được phép không, min/max/range có cần không, max length có cần không, normalization là gì, collection có max cardinality không, và lỗi vượt ngưỡng được xử lý ở stage nào?** Nếu source chưa trả lời và quyết định có ảnh hưởng implementation/acceptance, ghi `TBD-HUMAN` và resolve trước khi final gate.

# 8. Skill & tool playbook để sửa và check

Repository có các skill dưới `.agents/skills`. H0–H2 phải resolve portable Python và đúng package trước invocation. P1–P9 có thể dùng methodology khi canonical file không nằm trong active Spec-Kit package; riêng P10 phải thực thi actual skills I1–I5 trên từng package với verified `FEATURE_DIR`, pre/post hooks, changed-file review và completion evidence. Việc ghi tên skill trong report không chứng minh skill đã chạy.

| Skill / tool | Dùng khi nào | Cách dùng trong refactor M03 | Trạng thái |
| --- | --- | --- | --- |
| GitHub connector | Đọc/search/diff repo; xác nhận file tree; so sánh branch/commit. | Dùng xuyên suốt: fetch_file, search canonical IDs/contracts, compare commits. Write chỉ khi user yêu cầu. | PRIMARY |
| Portable Python + package resolver | Trước mọi Spec-Kit skill. | Reuse verified Python 3.10+; set `SPECIFY_FEATURE_DIRECTORY`; run `check_prerequisites.py --json --paths-only`; verify four paths; record output; recheck before write. Branch name không thay thế resolver. | MANDATORY PREFLIGHT |
| speckit-clarify | Có ambiguity/missing decision. | P1–P3: dùng methodology cho canonical specs. P10/I1: actual execution cho từng package trước plan; áp dụng canonical authority guard, human-approve business decisions, canonical-first rồi mới sync implementation spec. | MANDATORY P10 GATE |
| speckit-checklist | Đánh giá chất lượng requirement writing. | P2–P3/P9: methodology. P10/I2: generate checklist tập trung completeness/clarity/consistency/acceptance/traceability/edge cases, sau đó review có evidence; generated checkbox mặc định chưa pass và không phải implementation test. | MANDATORY P10 GATE |
| speckit-plan | Tạo/cập nhật planning và design artifacts sau khi spec ổn định. | P10/I3 cho từng package: `plan.md`, `research.md`, `data-model.md`, actual `contracts/*.md`, `quickstart.md`; sau skill phải controlled-complete mọi section còn thiếu. Không quyết định canonical behavior. | MANDATORY P10 GATE |
| speckit-tasks | Tạo dependency-ordered future implementation tasks từ stable spec/plan/design. | P10/I4 cho từng package; invocation phải yêu cầu applicable test coverage; preserve evidence-backed completed history; không execute task. | MANDATORY P10 GATE |
| speckit-analyze | Read-only cross-check core spec/plan/tasks sau task generation. | P10/I5 cho cả ba package; capture report rồi supplement bằng contract↔DAC, plan↔data-model và cross-module matrices; remediation diễn ra ngoài skill và phải rerun relevant checks. | MANDATORY P10 GATE |
| speckit-specify | Tạo feature package mới under specs/. | Không dùng để “edit existing canonical M03”. Chỉ dùng nếu change được quản lý như feature package mới. | NOT DEFAULT |
| speckit-implement | Execute tasks / code implementation. | Cấm trong P10 — tài liệu và task list được hoàn tất để handoff, nhưng code/test không được thực thi. | DO NOT USE |
| speckit-converge | Compare codebase với spec/plan/tasks và append remaining work. | Không dùng — codebase assessment nằm ngoài scope refactor tài liệu. | DO NOT USE |
| speckit-constitution | Thay governance principles. | Không dùng cho ordinary M03 change; chỉ khi user explicit sửa constitution. | NO CHANGE |

## 8.1 Recommended skill sequence

| Thời điểm | Skill | Output cần có |
| --- | --- | --- |
| Trước P0 | H0–H3 + portable Python + path resolver | Approved Change Brief, active branch/SHA/worktree owners, report root và toolchain/skill/package access đều có evidence. |
| Trước sửa canonical | GitHub read-only + speckit-clarify methodology | Change brief đã hết ambiguity blocking. |
| Sau Spec-M03 draft | speckit-checklist methodology | Requirement-quality checklist pass hoặc có explicit unresolved items. |
| P9, sau S4 | speckit-checklist methodology | DAC reconcile đủ changed field/path; source refs resolve; không còn blocking `TBD-HUMAN` trước logical-model/DAC review gate. |
| P10 preflight | Read full skill instructions + H2 guard + Git/GitHub inventory | Current skill source refs, portable interpreter, resolved four paths cho từng M01/M02/M03 package, completeness matrix, feature.json ownership và hook inventory. |
| P10/I1 | speckit-clarify | Blocking implementation ambiguity được resolve ở source-owning canonical spec rồi synced xuống package. |
| P10/I2 | speckit-checklist + documented review | Requirements-quality checklist và evaluated finding log; generated Markdown không tự đồng nghĩa PASS. |
| P10/I3 | speckit-plan + controlled completion | `plan.md`, `research.md`, `data-model.md`, every actual contract và `quickstart.md` complete cho cả ba package. |
| P10/I4 | speckit-tasks | Complete dependency-aware `tasks.md` với applicable testing và không false-complete history. |
| P10/I5 | speckit-analyze + supplemental matrices | Core report + contracts/DAC/data/cross-module validation; blocking findings resolved và checks rerun. |
| P10 handoff | Completeness matrix + readiness report | Cả ba package `READY`; future implementation entry point rõ; task/code chưa chạy. |
| P11, trước merge docs | GitHub search/diff + AGENTS validation matrix | Không còn stale canonical names/IDs/versions/links trong in-scope docs; phase/order nhất quán; historical evidence không bị trình bày như validation mới. |

## 8.2 Prompt gợi ý cho agent khi bắt đầu refactor

| Read-only first. Do not edit code, tests, SQL migrations, Edge Functions/RPCs, runtime configuration, design-decisions, shared scripts/templates or historical evidence. 0) Run H0–H3: verify approved Change Brief, active Git baseline/worktree ownership, portable Python/skill availability, report root and ownership. 1) Before P0 and every Spec-Kit skill, set intended `SPECIFY_FEATURE_DIRECTORY`, run `check_prerequisites.py --json --paths-only`, verify `FEATURE_DIR`/`FEATURE_SPEC`/`IMPL_PLAN`/`TASKS`, and record evidence; branch name is not package selection. 2) Read AGENTS.md/constitution/canonical specs and classify C1–C6. 3) Keep Layer 1 canonical, Layer 2 derived and Layer 3 implementation authority distinct; business/product/contract clarification requires human approval and canonical update before Layer 3 integration. 4) Complete P1–P8 in order. 5) P9 stays S1→S2→S3→S4→DAC→logical-model/DAC review→Physical Schema→Field Mapping→Seed evidence→Storage Validation evidence only if executed; never pass blocking `TBD-HUMAN`. 6) P10 re-inventories every file/contract in all three packages, then executes I1 clarify → I2 checklist/review → I3 plan → I4 tasks → I5 analyze sequentially per package with hooks, invocation/source version, input/output and changed-file evidence. 7) Complete `spec.md`, `research.md`, `plan.md`, `data-model.md`, actual contracts, `quickstart.md`, `tasks.md`; preserve correct content/task history and never use `NO CHANGE` to bypass gaps. 8) Supplement analyze with contract↔DAC, plan↔data-model and cross-module matrices; resolve blockers and rerun affected gates. 9) Store standardized reports under `docs/refactor-reports/<CHANGE_ID>/`, mark package READY/NOT READY/BLOCKED and do not execute tasks or claim runtime validation. 10) Preserve stable IDs/ownership/names. 11) End with P11 diff/exclusion audit and explicit handoff verdict; if end-to-end skills were not run, state `END-TO-END SKILL EXECUTION: NOT VALIDATED`. |
| --- |

# 9. Validation và final audit

Validation của refactor tài liệu phải vừa kiểm tra “chất lượng viết requirement” vừa kiểm tra “đồng bộ cross-artifact”. Không tuyên bố PASS cho validator/runtime chưa chạy.

## 9.1 Validation tối thiểu theo artifact

| Artifact | Minimum check |
| --- | --- |
| Spec | FR/BR/contract, module version/date, producer/consumer, affected derived docs; validation constraint và unresolved product decision được nhận diện, không trì hoãn đến physical design. |
| Function list | Stable FN/SF IDs, full FR coverage, không có behavior ngoài spec. |
| Architecture | Spec source, canonical contract names, technology ownership; không redesign. |
| Screen | SCR↔FR mapping, state/error coverage, no UI-created requirement. |
| Entity Dictionary | Entity count, identity/source refs, implied-vs-canonical classification. |
| CRUD Matrix | FN/entity coverage, direct evidence, ownership, delete semantics, totals. |
| ERD | Canonical entity set, cardinality catalog, Mermaid source/preview alignment. |
| Logical model/DBML | Mọi field/rule/relationship trace được về S1–S3/spec; không lẫn physical choice; S4 hoàn tất trước field-level DAC reconciliation. |
| Data Acceptance Criteria | Hoàn tất sau S4 và trước physical design; field/path coverage; source refs; enum/range/length/format/cardinality/blank/null rules; no invented values; no blocking `TBD-HUMAN` for changed fields. |
| Logical-model/DAC review | S1–S4 và DAC cùng pass; gap/mâu thuẫn đã quay lại canonical spec và affected downstream checks đã được lặp lại. |
| Physical/seed docs | Mapping traceability, generated artifacts regenerated, counts/fingerprints reviewed. |
| Validation evidence | Date/baseline rõ; chỉ ghi PASS cho check đã thực thi. |
| Implementation Documentation | Cả ba package được inventory; spec/research/plan/data-model/all actual contracts/quickstart/tasks complete; I1–I5 có evidence; source/requirement/task coverage và cross-module contracts nhất quán; mỗi package có READY/NOT READY assessment; historical evidence vẫn historical. |

## 9.2 Search terms bắt buộc trong repo-wide audit

Sau khi sửa, search các tên canonical và ID liên quan để tìm wording cũ hoặc contract shape còn sót. Tối thiểu nên search:

- FR-M03-, BR-M03-, FN-M03-, SCR-M03-, US-M03-

- Published Route, JourneySnapshot, LiveStationContent, QR lookup, SelectedRouteContext v2, OfflinePackage, SessionSyncRecord, SessionRecord

- CONTENT_STAFF, REVIEWER và các status/lifecycle enum bị thay đổi

- tên field cũ và tên field mới

- version/date cũ của M03 nếu có version bump

- `TBD-HUMAN`, `TECHNICAL-ONLY`, `max length`, `range`, `non-empty`, `Required`, `Optional`, `Conditional` trong `data/08-data-acceptance-criteria.md` để phát hiện gap/semantic drift

## 9.3 Local read-only/diff commands gợi ý

Các lệnh dưới đây chạy từ `$RepoRoot`, sau H1. Ghi actual command, exit code và kết quả vào report; không copy expected result thành claim thực thi.

### 9.3.1 Git status, branch và starting commit

```powershell
git status --short
git branch --show-current
git rev-parse HEAD
git remote -v
```

Expected: branch/SHA/remote khớp H0, pre-existing changes có owner. Failure: Git error, wrong branch/remote hoặc unknown dirty file. Recovery: stop và reconcile với owner; không reset/stash/checkout tự động.

### 9.3.2 Spec-Kit prerequisites và active feature paths

```powershell
& $SpecKitPythonExe @SpecKitPythonPrefixArgs ".specify/scripts/python/check_prerequisites.py" --json --paths-only
if ($LASTEXITCODE -ne 0) { throw "BLOCKED: path resolution failed" }

& $SpecKitPythonExe @SpecKitPythonPrefixArgs ".specify/scripts/python/check_prerequisites.py" --json
if ($LASTEXITCODE -ne 0) { throw "BLOCKED: prerequisites failed" }
```

Expected: first JSON có đúng `FEATURE_DIR`, `FEATURE_SPEC`, `IMPL_PLAN`, `TASKS`; second command chỉ chạy sau khi H2 target đã verify và trả required docs. Failure: wrong path, missing `plan.md`, invalid JSON/template/import. Recovery: stop; sửa working directory/selection/prerequisite có approval, rồi rerun. Lưu ý command thứ hai có thể persist `.specify/feature.json` khi environment variable được set.

### 9.3.3 Search canonical IDs và contract names

```powershell
rg -n "FR-M03-|BR-M03-|FN-M03-|SCR-M03-|US-M03-" docs screens data specs "MVP-Scope.md"

rg -n "Published Route|JourneySnapshot|LiveStationContent|SelectedRouteContext v2|OfflinePackage|SessionSyncRecord|SessionRecord" docs screens data specs "README.md" "MVP-Scope.md" "AGENTS.md"
```

Expected: mỗi changed ID/name có consistent source và downstream references. Failure: missing source, stale/renamed contract hoặc unexpected duplicate semantics. Recovery: trace về canonical owner; sửa source-owning artifact trước, không global replace mù.

### 9.3.4 Inspect changed files và package-local writes

```powershell
git status --short
git diff --name-only
git diff -- "specs/001-m01-implementation"
git diff -- "specs/002-m02-implementation"
git diff -- "specs/003-m03-implementation"
```

Expected: writes khớp current package/report scope; user-owned changes vẫn được phân biệt. Failure: skill ghi nhầm package hoặc unrelated path. Recovery: stop, record diff và coordinate owner; chỉ reverse agent-owned hunks bằng reviewed patch sau approval.

### 9.3.5 Whitespace, conflict markers và final diff

```powershell
git diff --check
rg -n "^(<<<<<<<|=======|>>>>>>>)" .
git diff --stat
git diff --
```

Expected: `git diff --check` exit 0, không conflict marker, reviewer đọc được toàn diff. Failure: whitespace error, unresolved marker hoặc unexpected churn. Recovery: sửa đúng file/hunk thuộc scope; không chạy formatter toàn repository.

### 9.3.6 Confirm excluded files were not modified

```powershell
$changedFiles = git diff --name-only
$excludedChanges = $changedFiles | Where-Object {
    $_ -match '^(src/|tests/|supabase/migrations/|supabase/functions/|design-prototypes/|screens/html/)' -or
    $_ -match '(^|/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$'
}
if ($excludedChanges) {
    $excludedChanges
    throw "BLOCKED: Excluded files changed"
}
```

Expected: no output và exit success. Failure: bất kỳ excluded path nào xuất hiện. Recovery: identify owner/cause, stop và xin hướng dẫn; không delete/reset user changes.

Nếu chỉ review qua GitHub connector: dùng repository search cho cùng keyword set, fetch exact files và compare base/head commit. Ghi rõ check nào là connector-only; không tuyên bố local command PASS khi chưa chạy.

## 9.4 Final acceptance gates

| Gate | PASS khi… |
| --- | --- |
| G0 — Handoff preflight | H0–H3 PASS: approved inputs/owners, active branch/SHA/worktree, portable Python/toolchain, five skill files/templates và per-package four-path resolution đều có evidence. |
| G1 — Canonical | Spec-M03 mới tự nhất quán và không còn blocking clarification. |
| G2 — Cross-module | M01/M02 either updated hoặc có documented NO CHANGE rationale. |
| G3 — Scope/Function | MVP priority và FN/SF/FR coverage khớp baseline mới. |
| G4 — Architecture/Screen | Derived flow/context/UI state không có behavior ngoài spec. |
| G5 — Logical model & Data Acceptance | S1–S4 hoàn tất; DAC được reconcile sau S4, cover changed fields/contracts, không invent limit, không còn blocking `TBD-HUMAN`; cả hai cùng pass review trước physical design. |
| G6 — Physical/Data evidence | Physical schema, field mapping và seed evidence chỉ được sync sau G5; generated artifacts được regenerate; Storage Validation chỉ ghi kết quả mới nếu đã thực thi. |
| G7 — P10 Implementation Readiness | Cả ba package pass §6.5.5; H2 target được revalidated trước write skill; required artifacts/sections complete hoặc justified `N/A`; I1–I5 có source/invocation/input/output/hook/validation evidence; contracts/data/tasks consistent; không blocker; `NO CHANGE` không che incompleteness. |
| G8 — Evidence integrity | Không sửa lịch sử để giả PASS; validation mới có date/baseline rõ. |
| G9 — Repo hygiene, evidence & traceability | Diff chỉ chứa in-scope docs; excluded-file check và git diff --check pass; stable IDs/links/names/source refs resolve; standardized report set complete; actual vs NOT RUN checks được phân biệt. |

# 10. Definition of Done và handoff

| DoD item | Yêu cầu |
| --- | --- |
| Handoff preflight | H0–H3 PASS; receiving operator có approved inputs, environment instructions, verified package selector và named owners. |
| Change brief | Có Current→New, rationale, impact dimensions, non-goals và quyết định đã được người dùng chốt. |
| Spec baseline | Spec-M03 là nguồn sự thật mới; M01/M02 đã xử lý impact. |
| Derived docs | MVP/Function/Architecture/Screen và data artifacts đã sync theo trigger; P9 tuân thủ S1→S2→S3→S4→DAC→review→physical→mapping→seed→validation-evidence. |
| Implementation docs | Sau khi P9 ổn định, cả ba package specs/001–003 được inventory và complete/validate end-to-end; mọi core artifact và actual contract pass matrix; I1–I5 có evidence; package `READY`; không tạo requirement mới hoặc execute task. |
| Exclusions | Không chạm design-decisions, templates, historical source, code/tests/prototypes. |
| Data Acceptance | DAC được hoàn tất sau S4; cover field/rule đã đổi; source refs resolve; không có invented max/range; blocking `TBD-HUMAN` đã được human quyết định và ghi vào spec trước review/physical design. |
| Data gates | Không nhảy stage; generated artifacts không hand-edit; review/evidence không giả mạo. |
| Evidence/reporting | `docs/refactor-reports/<CHANGE_ID>/` chứa đủ preflight, inventories, traceability, contract/data gates, per-skill evidence, readiness, final report và future handoff. |
| Final audit | Search/diff/excluded-file/validation report kèm unresolved items; check chưa chạy ghi `NOT RUN`. Nếu chưa test actual I1–I5 end-to-end, ghi `END-TO-END SKILL EXECUTION: NOT VALIDATED`. |

## 10.1 Stable report và evidence structure

Dùng một report root versionable, tách khỏi canonical specs, implementation packages và historical runtime evidence:

```text
docs/refactor-reports/<CHANGE_ID>/
├── 00-preflight.md
├── 01-change-brief-reference.md
├── 02-artifact-inventory-and-completeness.md
├── 03-canonical-traceability-matrix.md
├── 04-cross-module-contract-compatibility.md
├── 05-p9-data-and-dac-gates.md
├── 06-spec-kit-execution-evidence.md
├── 07-implementation-readiness.md
├── 08-final-change-report.md
└── 09-remaining-issues-and-future-handoff.md
```

Directory này chỉ chứa documentation workflow evidence, giúp reviewer tái dựng quyết định và command outcome mà không làm bẩn canonical/derived artifacts hoặc sửa historical validation. Tạo directory/file trong actual refactor change set sau khi H0 xác nhận `<CHANGE_ID>` và destination; runbook-refactor hiện tại không giả vờ các evidence file đó đã tồn tại.

| Evidence class | Nơi lưu | Quy tắc |
| --- | --- | --- |
| Historical validation evidence | Existing dated validation files, như M03 backend pass và `data/07-storage-validation.md`. | Immutable historical context; không rewrite thành PASS cho baseline mới. |
| Documentation review evidence | `docs/refactor-reports/<CHANGE_ID>/`. | Ghi inventory, traceability, skill execution, review findings, commands và readiness; không tuyên bố runtime behavior đã pass. |
| Future runtime/test validation | Future implementation/test phase và approved validation artifact. | `NOT RUN` trong documentation-only workflow trừ khi validator thực sự được phép và đã chạy. |

Mỗi row trong `06-spec-kit-execution-evidence.md` phải có:

| Package | Skill | SKILL source/version | Resolved target | Actual invocation | Inputs | Outputs/changed files | Outcome | Warnings/blockers | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

Skill chỉ được ghi `EXECUTED` khi actual invocation đã chạy và output/effect đã được kiểm tra. Mentioned, planned hoặc simulated skill phải ghi `NOT RUN`.

Mỗi package trong `07-implementation-readiness.md` nhận đúng một status:

| Status | Điều kiện |
| --- | --- |
| `READY` | Artifact, traceability, contract, data/DAC và I1–I5 gates đều pass; không còn blocker. |
| `NOT READY` | Review hoàn tất nhưng còn gap/inconsistency chưa blocking toàn workflow hoặc cần rework đã xác định. |
| `BLOCKED` | Thiếu input/permission/tool/human decision, wrong target hoặc critical/high unresolved finding khiến không thể tiếp tục an toàn. |

Generated Markdown file không phải evidence của `READY` nếu source, completeness và gates chưa được validate.

Final workflow handoff verdict dùng một trong ba mức:

| Verdict | Điều kiện |
| --- | --- |
| `READY FOR HANDOFF` | Runbook + environment/package selection + required workflow/skill checks đã thực sự được execute và có evidence; người nhận có thể tiếp tục đúng next step. |
| `READY WITH PREREQUISITES` | Documentation đủ để bàn giao nhưng receiving environment, permission hoặc end-to-end skill execution còn phải verify; prerequisite được liệt kê rõ. |
| `NOT READY` | Còn blocker về input, authority, compatibility, wrong target, missing evidence hoặc unresolved critical/high finding. |

Nếu I1–I5 chưa được thử end-to-end trên compatible receiving environment, report phải chứa nguyên văn: `END-TO-END SKILL EXECUTION: NOT VALIDATED` và không được dùng `READY FOR HANDOFF` chỉ dựa trên document review.

## 10.2 Cấu trúc final change report/PR description nên dùng

| Section | Nội dung |
| --- | --- |
| Why | Tóm tắt user-approved M03 change. |
| Canonical changes | Spec-M03 và M01/M02 nếu có. |
| Derived sync | MVP/Function/Architecture/Screen/Data nào đã sync; xác nhận DAC nằm sau S4 và trước review/physical design. |
| P10 inventory & completeness | Exact active-ref inventory của M01/M02/M03; artifact/section statuses; files changed, preserved hoặc `N/A`; baseline inventory delta. |
| Mandatory skill execution | I1–I5 per package: resolved target, invocation/outcome, generated/updated paths, hook results, reports/metrics, blocker nếu unavailable/incompatible. |
| Implementation readiness | Traceability/contract compatibility/task coverage results; findings and reruns; READY/NOT READY per package; non-blocking assumptions + owner/follow-up. |
| No-change decisions | Các artifact REVIEW nhưng quyết định không sửa + lý do. |
| Validation | Commands/checklists/search đã chạy và kết quả. |
| Evidence limits | Validator/runtime nào chưa chạy; validation lịch sử nào không áp dụng baseline mới. |
| Known remaining inconsistencies | Stale/out-of-scope item không tự sửa. |
| Handoff verdict | `READY FOR HANDOFF`, `READY WITH PREREQUISITES` hoặc `NOT READY`, kèm evidence và prerequisite/blocker. |

# 11. Ví dụ impact để áp dụng nhanh

## 11.1 Ví dụ A — thêm field M03 và field đó xuất hiện trong Published Route/JourneySnapshot

Đây là C3 + C4. Impact đi xuyên module vì M01 nhận projection/snapshot và M02 có thể nhận frozen manifest gián tiếp.

| Nhóm | Kết luận |
| --- | --- |
| MUST | spec-M03; spec-M01; function-list-M03 và M01 nếu behavior; context/system architecture; data S1–S4 → **Data Acceptance Criteria** → review → physical schema/mapping/seed; full P10 completion/validation cho cả ba packages, gồm M01 public-source contract update nếu bị ảnh hưởng. |
| REVIEW | spec-M02 + M02 local contracts/screens nếu field được copy vào handoff/frozen journey; screen specs M03/M01; MVP Scope. P10 vẫn validate M02 package đầy đủ dù kết luận behavior là `NO CHANGE`. |
| NO CHANGE | design-decisions/templates/code/tests theo scope hiện tại. |

## 11.2 Ví dụ B — đổi rule quản trị nội bộ M03, không đổi public contract

Đây chủ yếu là C2. M01/M02 thường NO CHANGE, nhưng phải chứng minh public availability/snapshot/live content không đổi.

| Nhóm | Kết luận |
| --- | --- |
| MUST/likely | spec-M03; function-list-M03; M03 screen docs nếu role/action/state đổi; data CRUD/logical model nếu rule tác động persisted state; DAC sau S4 nếu field-level acceptance semantics đổi. |
| REVIEW | MVP priority; architecture sequence/usage nếu flow admin đổi; P10 phải inventory/complete/validate cả ba package, với M03 contracts likely changed và M01/M02 có thể unchanged-but-validated. |
| NO CHANGE | M01/M02 specs nếu contract và observable behavior không đổi. |

## 11.3 Ví dụ C — đổi terminal SessionSyncRecord / reporting semantics

Đây là C3 + C4 vì M02 là producer và M03 là consumer/persister.

| Nhóm | Kết luận |
| --- | --- |
| MUST | spec-M03 + spec-M02; function lists; entity/CRUD/logical docs → **Data Acceptance Criteria** → review → physical/mapping/seed docs; full P10 cho cả ba package, đặc biệt M02 `terminal-sync-contract.md` và M03 `session-reporting-contract.md`; report screen nếu output/filter thay đổi. |
| REVIEW | system-configuration, environment (timezone/config), MVP priority, quickstart/validation docs. |
| NO CHANGE | Spec-M01 trừ khi session semantics quay ngược ảnh hưởng handoff contract. |

# 12. Practical execution troubleshooting

Không dùng `git reset`, `git checkout --`, delete hoặc overwrite user-owned files như recovery mặc định. Luôn capture symptom/error/diff trước, xác định owner và chỉ sửa current-operation artifacts trong approved scope.

| Issue | Symptom | Likely cause | Safe recovery | Stop? |
| --- | --- | --- | --- | --- |
| Python executable not found/incompatible | `$SpecKitPythonExe` rỗng, version check hoặc invocation fail. | Python/launcher chưa cài, PATH sai, version <3.10, Store alias lỗi. | Báo candidates/version/error; xin phép cài/chọn interpreter compatible, rồi rerun H1. Không silently fallback. | Yes — `BLOCKED`. |
| Required Spec-Kit script missing | `Test-Path` false hoặc Python báo file not found. | Wrong revision/clone hoặc incomplete checkout. | Verify remote/branch/SHA; restore exact repository file qua approved fetch/checkout workflow, không tự viết script thay thế. | Yes. |
| Incorrect working directory | `git rev-parse` hoặc import/path resolution fail. | Command chạy ngoài repo root/clone khác. | Resolve `git rev-parse --show-toplevel`, compare remote, `Set-Location -LiteralPath $RepoRoot`, rerun. | Yes until corrected. |
| Wrong `FEATURE_DIR` | JSON trỏ module khác. | `SPECIFY_FEATURE_DIRECTORY` sai hoặc stale config. | Stop before write; set intended relative package, rerun `--json --paths-only`, record evidence. | Yes. |
| Wrong `FEATURE_SPEC`/plan/tasks | Một path con không nằm trong intended package. | Manual path assumption, malformed package selection. | Compare all four paths with H2 expected paths; correct selection only, không edit returned file. | Yes. |
| Missing/stale `.specify/feature.json` | Resolver falls back sai hoặc báo no feature directory. | Previous operator state hoặc file absent khi env var chưa set. | Inspect/hash pre-existing file; set `SPECIFY_FEATURE_DIRECTORY`; use `--paths-only`. Nếu pre-existing user-owned, xin phép temporary update/restore hoặc dùng approved isolated worktree. | Yes before write skill. |
| Missing template | Checklist/plan/tasks setup báo template not found. | Incomplete clone hoặc template layer broken. | Verify `.specify/templates/` and resolver stack; fetch correct revision. Không sửa template/shared Python nếu chưa có additional approval. | Yes. |
| Mandatory skill unavailable | Agent không expose skill hoặc `SKILL.md` thiếu. | Incompatible agent/session hoặc incomplete repo. | Switch to compatible approved agent/session or restore instruction file; record `NOT RUN`. Manual simulation không tính execution. | Yes — P10 cannot PASS. |
| Extension hook failure | Mandatory hook nonzero/timeout/no result. | Hook dependency/config/service error. | Preserve hook output; resolve prerequisite/permission with hook owner, rerun. Không skip mandatory hook hoặc claim skill PASS. | Yes. |
| Unapproved business clarification | `speckit-clarify` proposes/writes behavior absent canonical spec. | Active implementation spec treated as authority. | Stop downstream; classify question, obtain human decision, update canonical spec first, sync derived docs, then reconcile implementation spec and rerun checks. | Yes — `NEEDS HUMAN DECISION`. |
| Existing artifact overwritten/unexpectedly changed | Large diff or correct content disappears after skill. | Generated output replaced verified content or wrong target. | Preserve diff/evidence; compare with pre-skill snapshot; reapply only approved content through reviewed patch. Do not reset user work. | Yes. |
| `speckit-plan` conflicts with approved data/architecture | New schema/relationship/topology/limit differs P7/P9. | Plan inferred implementation convenience or stale input. | Mark finding; restore source authority, correct plan/design docs, rerun I3 and downstream I4/I5. | Yes. |
| `speckit-tasks` misses requirements/testing | Requirement has no task; applicable test type absent; ordering invalid. | Incomplete source map/invocation context/template output. | Update source coverage, regenerate/controlled-edit tasks, validate task IDs/dependencies/tests, rerun I5. | Yes until coverage passes. |
| `speckit-analyze` reports CRITICAL/HIGH | Analysis metrics/findings show conflict/uncovered requirement. | Cross-artifact drift, constitution violation or incomplete tasks. | Analyze is read-only: fix source-owning artifact with approval, regenerate downstream, rerun I5 and supplemental matrices. | Yes. |
| Git diff includes unrelated/excluded changes | `git diff --name-only` lists code/test/runtime/other owner files. | Wrong skill target, hook/formatter side effect hoặc pre-existing dirty state. | Distinguish pre-existing vs current writes, stop and coordinate owner; reverse only approved agent-owned hunks with reviewed patch. | Yes. |
| Execution evidence missing | Command/skill claimed PASS without invocation/output/path record. | Reporting skipped hoặc output lost. | Downgrade to `NOT RUN`/`BLOCKED`; rerun safe check if permitted and capture required evidence fields. | Yes for relevant gate. |

# Phụ lục A — Exact artifact inventory để audit

| Layer | Files / directories |
| --- | --- |
| Layer 1 — Canonical Specifications | docs/spec/spec-M01.md; spec-M02.md; spec-M03.md |
| Layer 2 — MVP & Function | MVP-Scope.md; docs/function list/function-list-M01.md; function-list-M02.md; function-list-M03.md |
| Architecture | docs/architecture/README.md; context-diagram.md; usage-flow.md; sequence-diagrams.md; system-configuration.md; tech-stack.md; environment.md |
| Screen lists | screens/screen list/README.md; screen-list-M01.md; screen-list-M02.md; screen-list-M03.md |
| Screen specs | screens/screen-spec/M01/001…004; M02/001…003; M03/000…007 |
| Data (workflow order) | data/01-entity-dictionary.md; 02-crud-matrix.md; 03-erd.mmd; 03-erd-preview.md; 03-erd-review.md; 04-data-model.md; 04-data-model.dbml; **08-data-acceptance-criteria.md (NEW)**; 05-review.md; 06-physical-schema.md; data/schema/field-mapping.md; 07-storage-validation.md |
| Seed | data/seed/README.md; canonical CSV fixtures; edge-case-register.md; edge-cases.json |
| M01 implementation docs | specs/001-m01-implementation/{spec,research,plan,data-model,quickstart,tasks}.md; contracts/{application-flow-contract,local-persistence-contract,public-source-contract}.md |
| M02 implementation docs | specs/002-m02-implementation/{spec,research,plan,data-model,quickstart,tasks}.md; contracts/{application-flow-contract,live-content-contract,local-persistence-contract,terminal-sync-contract}.md |
| M03 implementation docs | specs/003-m03-implementation/{spec,research,plan,data-model,quickstart,tasks}.md; contracts/{admin-command-contract,admin-ui-flow-contract,auth-account-contract,media-storage-contract,publication-public-contract,session-reporting-contract}.md; historical backend-pass5-validation.md và backend-pass6-validation.md |
| Mandatory P10 skills | .agents/skills/speckit-clarify/SKILL.md; speckit-checklist/SKILL.md; speckit-plan/SKILL.md; speckit-tasks/SKILL.md; speckit-analyze/SKILL.md |
| Operational handoff | `.gitignore` for machine-local `.specify/feature.json`; `docs/refactor-reports/<CHANGE_ID>/` created only during an approved actual run. |
| Index/governance | README.md; docs/README.md; AGENTS.md; .specify/memory/constitution.md; supabase/README.md (conditional) |

# Phụ lục B — Explicit do-not-touch list

| Không sửa | Scope note |
| --- | --- |
| design-decisions/** | User explicitly excluded. |
| docs/templates/** | User explicitly excluded. |
| .specify/scripts/**; .specify/templates/** | Shared Spec-Kit infrastructure; read/validate only. Nếu runbook/skill instruction không thể xử lý blocker, document reason và xin additional approval trước mọi edit. |
| PCCV_DBIZ3_TEAM-H.docx | Historical/source artifact. |
| Stakeholder Interview & Problem Define.pdf | Historical/source artifact. |
| src/**, tests/** | Code/test explicitly excluded. |
| supabase migrations/Edge/RPC implementation | Code/DB implementation excluded; README may still be reviewed conditionally. |
| design-prototypes/**, screens/html/**, generated screenshots | Prototype/implementation artifacts excluded. |

# Phụ lục C — Baseline warnings tại tree SHA hiện tại

| Warning | Tác động khi refactor |
| --- | --- |
| docs/architecture/README.md ghi M03 “cập nhật 2026-09-27” trong khi spec-M03 metadata là 2026-09-29. | Nếu chạm architecture index/version metadata, sync lại; không dùng date stale để suy ra spec version. |
| screen-list-M03.md §7 và screen inventory README nói screen specs chưa tồn tại, nhưng repository hiện có 8 file M03 under screens/screen-spec/M03/. | Không tạo duplicate file; sửa stale metadata nếu screen-doc layer nằm trong change set. |
| docs/README.md liên kết environment-readiness-report.md nhưng baseline directory listing của docs/ không thấy file này. | Ghi nhận dead-link risk; chỉ sửa nếu index/documentation navigation nằm trong scope. |
| Current physical schema maps String identifier/content to PostgreSQL `text` with **no arbitrary length limit**; seed docs explicitly avoid inventing numeric ranges for version/identity/sequence. | Vì vậy max length/range còn thiếu phải được xem là product decision gap (`TBD-HUMAN`), không được copy một con số “thường dùng” vào DAC. |
| Historical SHA trong header có thể trùng current `main` tại thời điểm viết nhưng không phải operational truth vĩnh viễn. | H0/P0 luôn capture active target branch và starting commit; report nếu khác historical reference. |
| Spec-Kit normal resolver có thể create/update `.specify/feature.json`; `--paths-only` không persist. | File là local selection state, phải được ignore, preserve theo ownership và không dùng thay cho explicit H2 verification. |

# Phụ lục D — Final audit checklist

☐ 01. H0 có approved Change Brief, Current→New, exact impact IDs/contracts/fields/rules, target branch/SHA, scope, worktree owners và handoff destination.

☐ 02. H1 xác minh Git, portable Python 3.10+, repository scripts/templates, five mandatory skills, path/read-write access; không machine-specific interpreter path còn sót.

☐ 03. H2 revalidate `FEATURE_DIR`, `FEATURE_SPEC`, `IMPL_PLAN`, `TASKS` cho từng M01/M02/M03 trước write skill; `.specify/feature.json` được xử lý đúng ownership và không commit.

☐ 04. H3 gán approver/clarification/checklist/evidence/handoff owners; status PASS/BLOCKED/NOT RUN/NOT APPLICABLE/NEEDS HUMAN DECISION dùng đúng.

☐ 05. Spec-M03 new baseline đã được user/human chốt và không còn NEEDS CLARIFICATION blocking.

☐ 06. M01/M02 impact đã được quyết định bằng contract analysis, không bằng phỏng đoán.

☐ 07. Stable IDs không bị renumber/reused cho nghĩa mới.

☐ 08. MVP-Scope chỉ thay priority/boundary; không tự đổi behavior spec.

☐ 09. Function lists có full FR coverage và không có behavior ngoài spec.

☐ 10. Architecture diagrams mirror spec; không redesign khi sync.

☐ 11. Screen docs không tạo requirement mới và SCR/FR mapping đúng.

☐ 12. P9 đi theo S1→S2→S3→S4→DAC→logical-model/DAC review→Physical Schema→Field Mapping→Seed evidence→Storage Validation evidence; không nhảy stage.

☐ 13. `data/08-data-acceptance-criteria.md` được hoàn tất sau S4, trước review/physical design; không invent max length/range và không còn blocking `TBD-HUMAN` trên changed fields.

☐ 14. Canonical entity vs projection/transport/frozen copy phân loại đúng.

☐ 15. Generated field-mapping/edge-case artifacts không hand-edit.

☐ 16. Historical validation evidence không bị rewrite thành PASS mới.

☐ 17. README/index/version/date/link summary được sync nếu baseline metadata đổi.

☐ 18. P10 đã re-inventory mọi artifact/contract của cả M01/M02/M03 trên active ref; delta với baseline được ghi nhận.

☐ 19. Completeness matrix cover từng required file/section; mọi item complete hoặc justified `N/A`; `NO CHANGE` không bypass gap/stale content.

☐ 20. I1–I5 đã chạy đúng package/order với skill source/version, actual invocation, inputs/outputs, hooks, warnings, blockers và validation; unavailable/incompatible skill không giả PASS.

☐ 21. Mọi I1 business/product/cross-module clarification có human approval và canonical source trước khi sync Layer 3; technical-only clarification không đổi behavior.

☐ 22. Spec↔plan↔data-model↔contracts↔DAC↔tasks và M01↔M02↔M03 compatibility pass; blocking findings đã resolve và checks đã rerun.

☐ 23. Cả ba package có implementation-readiness assessment `READY`; non-blocking assumptions có owner/follow-up; task history không false-complete.

☐ 24. P10 không execute task hoặc sửa application code, tests, SQL migrations, Edge/RPC, runtime configuration hay historical evidence.

☐ 25. Stable report set tại `docs/refactor-reports/<CHANGE_ID>/` đầy đủ; documentation review, historical evidence và future runtime validation được phân biệt.

☐ 26. Repo search không còn term/field/status/version/phase reference cũ trong in-scope docs.

☐ 27. `git diff --check`, conflict-marker, changed-file và excluded-file checks pass; diff không có unrelated/encoding churn.

☐ 28. Final report liệt kê actual checks/NOT RUN items, readiness, unresolved issues và handoff verdict; nếu chưa test skills end-to-end, ghi `END-TO-END SKILL EXECUTION: NOT VALIDATED`.

**END OF RUNBOOK**
