# Quickstart — Kiểm chứng M01 Route Planning & Preparation

**Package**: `specs/001-m01-route-planning-preparation` | **Date**: 2026-10-29 | **Plan**: [plan.md](plan.md)

> **Trạng thái: đã chạy.** Kết quả thật của từng đợt ghi ở [validation-report.md](validation-report.md); file này chỉ mô tả quy trình. Cột "Kết quả mong đợi" là điều phải quan sát được; nó không phải kết quả đã ghi nhận. Không tuyên bố PASS cho tới khi lệnh thực sự chạy (constitution "Testing & Validation"; AGENTS.md §6).

## 1. Điều kiện tiên quyết

| Thứ cần có | Dùng cho | Khi nào |
|---|---|---|
| Node.js 24 LTS + npm | build, typecheck, Vitest, Playwright | luôn |
| Trình duyệt cho Playwright (`npx playwright install`) | E2E, offline, service worker | luôn |
| Docker + Supabase CLI + migration của M03 giai đoạn B | tích hợp thật với `api.published_routes`, `api.active_journey_snapshots`, Storage | chỉ khi M03 giai đoạn B đã mở ([research.md](research.md) R-01) |
| Một điện thoại Android và một iPhone | kiểm tra offline/eviction thủ công | trước lần phát hành thật |

Không cần, và **không được dùng**: tài khoản cloud thật, secret thật, dữ liệu thật. Không chạy `supabase link`, `db push` hay `--linked` (AGENTS.md §4; environment.md §11).

## 2. Cấu hình

| File | Biến | Giá trị | Ghi chú |
|---|---|---|---|
| `.env.local` (ignore) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | URL và publishable key mà `supabase start` in ra | chỉ khi chạy tích hợp local |
| `.env.e2e` (commit, giá trị giả an toàn) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | `http://127.0.0.1:54321`, key giả | mọi request được `page.route()` chặn và trả fixture ([research.md](research.md) R-16) |
| build | `VITE_APP_VERSION` | build sinh ra | |

M01 không dùng `QR_PUBLIC_BASE_URL` và không có secret. Hằng provisional `SOURCE_REQUEST_TIMEOUT_SECONDS` = 8 nằm ở `src/modules/m01/config/limits.ts`, không phải biến môi trường.

## 3. Lệnh (dự kiến)

```powershell
npm ci
npm run typecheck        # tsc --noEmit
npm run lint
npm run test             # Vitest: unit + contract + component (+ Dexie nếu fake-indexeddb được duyệt)
npm run build            # vite build (có service worker)
npm run e2e -- --project=m01   # Playwright trên vite preview, network mock, gồm kịch bản offline

# Tích hợp thật trên stack Supabase local (migration của M03 giai đoạn B):
supabase start
supabase db reset        # CHỈ local; không bao giờ --linked
$env:PW_LOCAL_STACK = '1'; npm run e2e -- --project=m01-local-stack
```

## 4. Kịch bản kiểm chứng

Fixture synthetic (`src/shared/contracts/__fixtures__/`, dùng chung với M03): tuyến A `HOAT_DONG` có 2 checkpoint `OFFLINE_REQUIRED` (3 QR, 4 ảnh) + `offlineRouteMap`; tuyến B `HOAT_DONG` chỉ `ONLINE_AVAILABLE`, không sơ đồ offline; tuyến C `TAM_DONG`; tuyến D `LUU_TRU`; một dòng hỏng. Tên giả, ảnh PNG nhỏ sinh trong test.

| # | Story | Kịch bản | Kết quả mong đợi | Contract |
|---|---|---|---|---|
| V1 | Story 1 / US-M01-01 | Mở `/` lần đầu; chọn English | Panel chọn ngôn ngữ chặn trang; sau khi chọn, `languagePreference.current.languageCode = en`; UI tiếng Anh | [language-preference](contracts/language-preference-contract.md) §2 |
| V2 | Story 1 | Mở `/q/{id}` lần đầu với trình duyệt `vi-VN`, rồi `en-US` | Không có panel; hiển thị `vi` rồi `en`; store `languagePreference` vẫn trống | language-preference §2–§3 |
| V3 | Story 1 | Offline, bấm VI/EN trên SCR-M01-003 có gói | UI đổi ngay; dòng gói và context không đổi | language-preference §4 |
| V4 | Story 2 / US-M01-02 | Mở danh mục với fixture | Chỉ A và B hiện, sắp A→Z theo ngôn ngữ; C, D, dòng hỏng không hiện; A có dấu "cần tải trước", B không | [m03-publication-consumer](contracts/m03-publication-consumer-contract.md) §3 |
| V5 | Story 2 | Ảnh thumbnail của A trả 404 | Placeholder trung tính; thẻ bấm được | m03-publication-consumer §4 |
| V6 | Story 2 | Đã mở danh mục, rồi mất mạng, làm mới | Local view còn, có nhãn dữ liệu cũ; mở app lạnh khi offline → "Source unavailable", vẫn vào được SCR-M01-004 | [research.md](research.md) R-13 |
| V7 | Story 2 | Data API không trả lời trong 8 s (provisional) | Coi là nguồn không khả dụng như V6 | m03-publication-consumer §2 |
| V8 | Story 3 / US-M01-06 | Mở chi tiết A online; tuyến có `safetyWarning` nhưng không có `bestTime` | Đủ trường bắt buộc; cảnh báo an toàn nổi bật; không có ô `bestTime` và không có chữ thay thế; tên điểm dừng đánh số 1, 2… | [visitor-ui-flow](contracts/visitor-ui-flow-contract.md) §2 |
| V9 | Story 6 / US-M01-03 | Bấm "Bắt đầu" trên A chưa có gói; snapshot không có `estimatedOfflineSizeBytes` | Dialog nêu tên 2 checkpoint `OFFLINE_REQUIRED`, "Chưa có thông tin dung lượng.", dòng hướng dẫn quét, ba nút; nút Tải bật | visitor-ui-flow §2; [offline-package](contracts/offline-package-contract.md) |
| V10 | Story 6 | Bấm Tải trên A | `DANG_TAI` rồi `SAN_SANG` + `CURRENT`; `offlineResources` có 3 dòng; `imageBytes` có 4 ảnh + sơ đồ; `routeEssentials.capturedAt` có giá trị | offline-package §4 |
| V11 | Story 6 | Tải A khi một ảnh QR trả 500 | Lần đầu: `CHUA_HOAN_TAT`, không có dòng `offlinePackages`, thông báo tải chưa hoàn tất | offline-package §4, §6 |
| V12 | Story 6 | Có gói A v1; nguồn lên v2; mở chi tiết A; giả lập hết quota lúc kích hoạt | Gói v1 thành `OUTDATED`; candidate v2 lỗi; v1 vẫn `SAN_SANG` và đọc được | offline-package §5–§6 |
| V13 | Story 6 | Có gói A v1, nguồn v2, mở chi tiết A, tải thành công | Con trỏ sang v2 `CURRENT`; dữ liệu v1 bị xóa | offline-package §5 |
| V14 | Story 6 | Bấm Tải hai lần nhanh; mở tab thứ hai và bấm Tải cùng tuyến | Chỉ một thao tác chạy | offline-package §6 |
| V15 | Story 6 | Đóng tab giữa lúc tải, mở lại app | Candidate mồ côi được dọn; trạng thái `CHUA_HOAN_TAT` (không có gói cũ) | [research.md](research.md) R-08 |
| V16 | Story 6 | Xóa gói A ở SCR-M01-004 sau khi đã có context A | Dialog xác nhận; gói, resources, byte, candidate, con trỏ mất; context A còn | offline-package §5 |
| V17 | Story 4 / US-M01-04 | Start B online | Context v3 `AUTHORIZED`, `handoffId` UUID, `expiresAt − authorizedAt` = 24 h, manifest = snapshot B; điều hướng M02 sau commit | [selected-route-context-v3](contracts/selected-route-context-v3-contract.md) §2 |
| V18 | Story 4 | Start B lần hai | `handoffId` mới, context cũ bị thay | selected-route-context-v3 §4 |
| V19 | Story 4 | Offline, có gói A `OUTDATED`, Start A | Context từ manifest gói (version gói); cảnh báo cũ hiện | selected-route-context-v3 §4 |
| V20 | Story 4 | Offline, không có gói, Start A và Start B | Cả hai bị chặn; context cũ không đổi | selected-route-context-v3 §4 |
| V21 | Story 4 | Bấm Start hai lần liền; giả lập lỗi ghi transaction | Một context; lỗi → context trước nguyên vẹn | selected-route-context-v3 §4 |
| V22 | Story 5 / US-M01-05 | Có context A `AUTHORIZED`; fixture chuyển A sang `TAM_DONG`; làm mới danh mục | A biến mất; context A thành `REVOKED`; gói A còn; store M02 không đổi | selected-route-context-v3 §2 |
| V23 | Story 7 / US-M01-02 | Chọn `TIME_VUA` + `GROUP_GIA_DINH_CO_TRE` + `INTEREST_KHAM_PHA`; rồi một tổ hợp không khớp; rồi bỏ một nhóm | Mọi kết quả chứa cả ba tag; không khớp → rỗng, không nới; thiếu nhóm → không chạy | visitor-ui-flow §2 |
| V24 | — | Offline, đã mở app trước đó: tải lại `/`, `/routes/A`, `/q/{id}` | Trang mở từ app shell; không có response API nào lấy từ Cache Storage | visitor-ui-flow §3 |
| V25 | — | Có bản build mới khi tab khác đang tải gói | Lời nhắc cập nhật hiện nhưng chỉ áp dụng sau khi tải xong | visitor-ui-flow §3 |
| V26 | — | Contract test cho 3 schema M01 sản xuất | Fixture hợp lệ qua; mỗi vi phạm Required/Conditional/Optional bị từ chối (gồm `contractVersion = 2`, `expiresAt` lệch 1 ms, resource thừa cho `ONLINE_AVAILABLE`) | ba contract M01 |

## 5. Bằng chứng thành công mong đợi

- `npm run typecheck`, `lint`, `test`, `build` thoát với mã 0; báo cáo Vitest có test contract cho `LanguagePreference`, `SelectedRouteContextV3`, `OfflinePackage`/`OfflineResource` và test consumer cho Published Route, `JourneySnapshot`.
- `npm run e2e -- --project=m01`: V1–V25 pass trên network mock.
- Tích hợp local (sau M03 giai đoạn B): V4, V10, V17, V22 pass trên stack Supabase local. Trước đó ghi `NOT RUN` kèm lý do.
- Kiểm tra thủ công trên thiết bị thật: kết quả ghi riêng; Playwright không thay thế.

## 6. Giới hạn

- Nguồn thật phụ thuộc M03 giai đoạn B (bị chặn); trước đó mọi kịch bản chỉ chứng minh UI, Dexie và mapping trên network mock.
- `SOURCE_REQUEST_TIMEOUT_SECONDS` = 8 và mọi giới hạn số của contract là **provisional** (spec-M01 §9.3, spec-M03 §5.3); chủ dự án kiểm chứng trên thiết bị thật trước lần phát hành thật đầu tiên.
- Eviction/xóa dữ liệu trình duyệt không mô phỏng được đầy đủ bằng Playwright.
- Không có test camera/quét QR ở M01; phần đó thuộc M02.
