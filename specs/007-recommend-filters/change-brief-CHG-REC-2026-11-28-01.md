# Change Brief CHG-REC-2026-11-28-01 — Gợi ý tuyến chọn nhiều, trường "Hướng dẫn viên", "Đi theo đoàn"

| Trường | Nội dung |
|---|---|
| Change ID | CHG-REC-2026-11-28-01 |
| Trạng thái | **APPROVED** (2026-11-28). Được sửa spec-M01 lên v3.3, spec-M03 lên v3.8, spec-Mascot lên v1.11, đồng bộ tài liệu dẫn xuất, viết migration (local stack) và code theo §4 |
| Người đề xuất | Chủ dự án (chat 2026-11-28, kèm ảnh màn Gợi ý tuyến và trang kết quả hiện tại) |
| Người duyệt | Chủ dự án (chat 2026-11-28: "duyệt"). *Chủ dự án điền tên tài khoản nếu cần* |
| Ngày duyệt | 2026-11-28 |
| Loại thay đổi (runbook §4) | Behavioral change của [spec-M01](../../docs/spec/spec-M01.md) (v3.2 → v3.3), [spec-M03](../../docs/spec/spec-M03.md) (v3.7 → v3.8), [spec-Mascot](../../docs/spec/spec-Mascot.md) (v1.10 → v1.11). **Có đổi contract và dữ liệu**: thêm thuộc tính `guideTags` của Route, đổi enum `groupTags`, đổi input của RecommendationContext. Cần migration (local stack, rồi người vận hành cloud áp lên Shared Backend) |
| Liên quan | [CHG-MASCOT-2026-11-25-06](../005-visitor-mascot/change-brief-CHG-MASCOT-2026-11-25-06.md) (mỗi màn M01 có câu riêng, MAS-B-090); BR-M01-003, BR-M03-C12 |

## 1. Source

Chủ dự án, chat 2026-11-28:

1. Bấm "Đổi tiêu chí" quay lại màn Gợi ý tuyến thì Mila chỉ đứng, không nói; chạm Mila mới nói. Vào màn bằng cách khác thì nói như cũ.
2. Du khách chưa rõ mình thích gì: cho chọn nhiều ý trong một trường, hoặc bỏ trống trường.
3. Chạm lại ý đã chọn để bỏ chọn; thêm nút bỏ chọn tất cả.
4. Đối tượng: "Cần đi dễ dàng" → "Đi theo đoàn".
5. Thêm trường "Hướng dẫn viên": Cần hướng dẫn viên / Tự tham quan.
6. Đổi hai câu của Mila ở màn này.

## 2. Current → New

| Hiện tại | Mới |
|---|---|
| Phải chọn đúng một ý ở mỗi trường trong ba trường (BR-M01-003); thiếu thì không chạy so khớp | Mỗi trường chọn **0..N** ý. Trong một trường: **HOẶC**; giữa các trường: **VÀ**; trường bỏ trống: không lọc theo trường đó. Bỏ trống cả bốn trường: trả **mọi tuyến chọn được** |
| Chạm ý khác trong cùng trường thì đổi ý; không bỏ chọn được | Chạm ý chưa chọn: thêm; chạm ý đang chọn: bỏ |
| Không có nút đặt lại | Nút chữ phụ **"Bỏ chọn tất cả"** / EN **"Clear all"**, ngay trên "Xem tuyến phù hợp", chỉ hiện khi có ít nhất 1 ý được chọn |
| Ba trường: Thời gian, Đối tượng, Trải nghiệm | Bốn trường, thêm **Hướng dẫn viên** sau Trải nghiệm |
| `GROUP_CAN_DE_DANG` "Cần đi dễ dàng" (người cần tuyến dễ) | **Nghỉ**. Thêm `GROUP_DI_THEO_DOAN` "Đi theo đoàn" / EN "With a tour group". Mã cũ không dùng lại |
| Lưu nháp bị chặn khi `difficulty = KHO` đi cùng `GROUP_GIA_DINH_CO_TRE` hoặc `GROUP_CAN_DE_DANG` | Chỉ chặn `KHO` + `GROUP_GIA_DINH_CO_TRE`. `GROUP_DI_THEO_DOAN` gắn được với mọi độ khó |
| BR-M03-C12: "No new tag groups in MVP" | Thêm nhóm thứ tư `guideTags` (xem D4) |
| Mỗi lần mở form, Mila nói MSG-MAS-010 | Quay lại từ trang kết quả (link "Đổi tiêu chí", hoặc nút Back / cử chỉ quay lại của trình duyệt): Mila đứng ở DOCK, **không bong bóng**; chạm Mila thì nói theo MAS-B-090 như hiện có. Vào từ nơi khác (Danh mục tuyến, màn kết quả chuyến đi, mở link trực tiếp): nói MSG-MAS-010 như cũ |
| MSG-MAS-010 "Bạn có bao lâu, đi cùng ai, thích gì? Chọn mỗi nhóm một ý nhé." | "Bạn có bao lâu, đi cùng ai, thích gì? Để mình gợi ý cho nhé!" / EN "How long do you have, who's coming, what do you enjoy? Let me suggest some routes!" |
| MSG-MAS-015 "Chọn đủ ba mục rồi bấm Xem tuyến phù hợp nhé." | "Chọn xong các mục rồi bấm "Xem tuyến phù hợp" nhé!" / EN "Done choosing? Tap "Show matching routes"!" |

## 3. Quyết định đã chốt (2026-11-28)

| # | Quyết định |
|---|---|
| D1 | Logic so khớp: route khớp khi, với **mỗi** trường có ít nhất một ý được chọn, tập tag của route ở trường đó **giao khác rỗng** với tập ý đã chọn. Thời gian: route luôn có đúng một `timeTag` nên là "thuộc tập đã chọn". Không chấm điểm, không xếp hạng, không tự nới tiêu chí (giữ phần còn lại của BR-M01-003). Kết quả 0 tuyến: giữ khối rỗng hiện có ("Đổi tiêu chí", "Xem tất cả tuyến") |
| D2 | Trang kết quả hiện chip của **mọi** ý đã chọn, theo thứ tự trường rồi thứ tự ý; trường bỏ trống không có chip. Bỏ trống cả bốn trường: không có chip |
| D3 | "Đối tượng" có ba ý: Cá nhân/người lớn, Gia đình có trẻ nhỏ, **Đi theo đoàn** |
| D4 | Thuộc tính mới của Route `guideTags`: Array&lt;Enum(`GUIDE_CO_HUONG_DAN_VIEN`, `GUIDE_TU_THAM_QUAN`)&gt;, **bắt buộc ít nhất một giá trị khi xuất bản**, giá trị không trùng, giống `groupTags`/`experienceTags`. Nghĩa: `GUIDE_CO_HUONG_DAN_VIEN` = tuyến đi được cùng hướng dẫn viên; `GUIDE_TU_THAM_QUAN` = tuyến tự đi được. Tuyến bắt buộc có hướng dẫn viên chỉ gắn giá trị đầu; tuyến dễ gắn cả hai. Nhãn cho du khách: "Cần hướng dẫn viên" / "Tự tham quan" (EN "With a guide" / "Self-guided"). Nhãn cho cán bộ ở editor (bước 3): "Đi cùng hướng dẫn viên" / "Tự tham quan được" kèm gợi ý ngắn về nghĩa |
| D5 | Dữ liệu hiện có (phương án (a) của chủ dự án): migration **gán cả hai giá trị `guideTags`** cho mọi revision tuyến hiện có, kể cả revision `PHAT_HANH` đang chạy, để không tuyến nào biến khỏi kết quả lọc. Repo không được chứa định danh production (AGENTS.md §6), nên migration không nhắm từng tuyến. Sau khi áp migration, cán bộ bỏ "Tự tham quan được" ở **Chinh phục Đỉnh Mây Bạc** và **Xuyên rừng Bống – Bản Khanh** (bắt buộc có hướng dẫn viên) rồi xuất bản lại |
| D6 | Migration gỡ `GROUP_CAN_DE_DANG` khỏi mọi revision tuyến. Theo dữ liệu đọc ngày 2026-11-25, tuyến đang hoạt động duy nhất mang tag này là **Khu Cổng vườn** (còn hai tuyến đã lưu trữ). Mọi tuyến này còn ít nhất một group tag khác nên vẫn hợp lệ. Cán bộ xem lại Khu Cổng vườn có hợp "Đi theo đoàn" không |
| D7 | D5 và D6 sửa nội dung của revision `PHAT_HANH` đã đóng băng (spec-M03 §6.3). Đây là **ngoại lệ một lần** do chủ dự án duyệt trong brief này, chỉ cho hai trường `groupTags` và `guideTags`; không tạo revision mới, không ghi nhật ký thay đổi nội dung, `activeContentVersion` giữ nguyên |
| D8 | `RecommendationContext` vẫn là state tạm trong bộ nhớ (HC-007), không lên URL, không lưu; đổi thành bốn tập giá trị. Quay lại form vẫn giữ các ý đã chọn |
| D9 | Thứ tự triển khai: migration trên Shared Backend **trước**, frontend sau. Frontend M01 chấp nhận route chưa có `guideTags` (coi như rỗng: không khớp khi trường Hướng dẫn viên có ý được chọn, khớp khi trường bỏ trống) và bỏ qua giá trị tag lạ thay vì loại cả route, để không vỡ trong lúc chuyển giao |
| D10 | Icon của trường Hướng dẫn viên: vẽ SVG mới vào `assets/icons/` theo design-system §7 (người dùng cho phép 2026-11-10) |

## 4. Phạm vi file được phép

| Đường dẫn | Nội dung |
|---|---|
| `docs/spec/spec-M01.md` | v3.3: §1, US-M01-02, §4.2, Published Route input (`groupTags`, `guideTags`), BR-M01-003, §6 RecommendationContext, §8 SC-M01-002, change notes |
| `docs/spec/spec-M03.md` | v3.8: Route fields, nhãn tag, BR-M03-C12, editor bước 3, Published Route contract, §6.3 (ghi ngoại lệ D7), change notes |
| `docs/spec/spec-Mascot.md`, `docs/mascot/MASCOT_BEHAVIOR_MATRIX.md`, `docs/mascot/*dialogue*` | v1.11: MAS-B-010 im lặng khi quay lại từ kết quả, MSG-MAS-010, 015 |
| `screens/screen-spec/M01/screen-spec-SCR-M01-002.md`, `screens/screen-spec/M03/screen-spec-SCR-M03-002.md` | Phần tử, bảng copy, tương tác |
| `data/01…08`, `data/06-physical-schema.md` | Route: `guideTags`; enum `groupTags`; DAC liên quan |
| `docs/function list/`, `docs/architecture/` | Đồng bộ mô tả nếu nhắc ba nhóm tag hoặc "Cần đi dễ dàng" |
| `specs/007-recommend-filters/**` | Brief này, plan, tasks, validation |
| `specs/001-…/contracts`, `specs/003-…/contracts/publication-public-contract.md`, `specs/003-…/data-model.md` | Contract dẫn xuất |
| `supabase/migrations/` (file mới), `supabase/tests/` | Validation trigger, `check_required`, kiểm mâu thuẫn tag, nhãn tag trong nhật ký, view `published_routes` thêm `guide_tags`, backfill D5–D6. Chỉ chạy trên local stack; lệnh áp cloud do người vận hành chạy |
| `src/shared/contracts/**`, `src/modules/m01/{recommendation,i18n}/**`, `src/modules/m03/{route-admin,editor,validation,contracts,messages}/**`, `src/shared/mascot/**`, `src/app/mascot/**`, `assets/icons/` | Code, test, icon |
| `e2e/**` | Test liên quan |

## 5. Impact dimensions

| Chiều | Tác động |
|---|---|
| Entity Route | Thêm `guideTags`; enum `groupTags` đổi một giá trị |
| Contract M03 → M01 (Published Route) | Thêm `guideTags`; `groupTags` có giá trị mới. Cả hai spec định nghĩa giống nhau |
| RecommendationContext | Một giá trị mỗi nhóm → tập 0..N mỗi nhóm, bốn nhóm |
| Rule | BR-M01-003 (so khớp), BR-M03-C12 (nhóm tag, mâu thuẫn tag) |
| Screen | SCR-M01-002 form và kết quả; SCR-M03-002 editor tuyến bước 3 |
| Mascot | MAS-B-010 có điều kiện im lặng; MSG-MAS-010, 015 đổi chữ |
| Dữ liệu cloud | Backfill một lần (D5–D7). Hai tuyến cần cán bộ sửa sau migration (D5), một tuyến cần xem lại (D6) |
| M02, JourneySnapshot, session intake, báo cáo | Không đổi |

## 6. Không thay đổi

`timeTags` và cách M03 suy ra từ `durationMin`; `experienceTags`; chặn `KHO` + `GROUP_GIA_DINH_CO_TRE`; Danh mục tuyến; thẻ tuyến; chi tiết tuyến; gói tải trước; handoff; M02.

## 7. Rủi ro chấp nhận

- Từ lúc áp migration tới khi cán bộ sửa hai tuyến ở D5, hai tuyến bắt buộc hướng dẫn viên vẫn hiện khi du khách chọn "Tự tham quan".
- Nghĩa cũ "người cần tuyến dễ" không còn tag riêng; du khách dựa vào độ khó trên thẻ tuyến.
- Chọn nhiều ý trong cùng trường mở rộng kết quả (HOẶC), nên có thể ra tuyến chỉ hợp một trong các ý đã chọn.

## 8. Kiểm chứng (2026-11-28)

| Kiểm | Kết quả |
|---|---|
| `npm run ci` (typecheck, token lint, unit, build) | PASS |
| pgTAP trên local stack (`supabase test db`, 14 file) | PASS |
| Chuyển dữ liệu D5–D7 trên local: reset về migration trước, chèn revision kiểu cũ (một bản PHAT_HANH, hai bản nháp), áp migration | Đúng: gỡ `GROUP_CAN_DE_DANG` giữ thứ tự, gán cả hai `guideTags`, `concurrencyRevision` và `lastEditedAt` không đổi, trigger bật lại |
| e2e M01, M02, M03 (mock) | PASS (sau khi cập nhật mascot-revisit, motion-press) |
| Áp migration trên Shared Backend, kiểm `published_routes` có `guide_tags` | Chờ người vận hành (§9) |

## 9. Triển khai (người vận hành cloud chạy; agent chỉ soạn lệnh)

Thứ tự bắt buộc (D9): database trước, frontend sau. Frontend mới đọc cột `guide_tags`; nếu frontend lên trước, view chưa có cột này và danh mục tuyến không tải được. Frontend cũ không đọc cột mới nên chạy bình thường sau khi áp migration.

1. Áp migration lên Shared Backend (chỉ migration `20261128090000_rec_01_guide_tags_group_di_theo_doan.sql` chưa áp):

   ```powershell
   npx supabase migration list --linked
   npx supabase db push --linked
   ```

2. Kiểm sau khi áp (SQL editor của Supabase, chỉ đọc):

   ```sql
   -- không còn revision tuyến nào mang mã đã nghỉ; mọi revision tuyến đã có guideTags
   select count(*) filter (where content -> 'groupTags' ? 'GROUP_CAN_DE_DANG') as con_ma_cu,
          count(*) filter (where not content ? 'guideTags') as chua_co_guide
   from app.revisions where subject_type = 'ROUTE';
   -- view công khai có cột mới
   select route_id, guide_tags from api.published_routes limit 5;
   ```

   Kỳ vọng: `con_ma_cu = 0`, `chua_co_guide = 0`, `guide_tags` có cả hai giá trị.

3. Merge PR để Vercel deploy frontend.
4. Cán bộ (D5, D6): trong trang quản trị, bỏ "Tự tham quan được" ở **Chinh phục Đỉnh Mây Bạc** và **Xuyên rừng Bống – Bản Khanh** rồi xuất bản lại; xem lại **Khu Cổng vườn** có cần nhãn "Đi theo đoàn" không.
