# Change Brief CHG-M03-2026-11-05-01 — Đưa sản phẩm lên cloud và phát hành (Phase 16)

| Trường | Nội dung |
|---|---|
| Change ID | CHG-M03-2026-11-05-01 |
| Trạng thái | **APPROVED** (2026-11-05). Lệnh cloud chỉ được chạy sau khi PR T201 (§14) đã merge. |
| Người duyệt | MckhueVanPhuc (chủ dự án) |
| Ngày duyệt | 2026-11-05 |
| Loại thay đổi (runbook §4) | C6 — Runtime/Auth/environment, mở phạm vi cloud và deploy; kèm một thay đổi nghĩa có chủ đích ở BR-M03-B04 (§5) và một công cụ đo vận hành mới (§6) |
| Liên quan | [tasks M03](tasks.md) Phase 16 (T201–T209); CHG-M03-2026-10-30-01 (backend local); CHG-AI-2026-11-03-01 (function dịch); [environment.md](../../docs/architecture/environment.md) §4, §5, §10–12 |

## 1. M03 source

[spec-M03](../../docs/spec/spec-M03.md) v3.7: BR-M03-B04, BR-M03-B05, BR-M03-K03, BR-M03-K04, §5.3, §9. [spec-M01](../../docs/spec/spec-M01.md) (`SOURCE_REQUEST_TIMEOUT_SECONDS`), [spec-M02](../../docs/spec/spec-M02.md) (`LOOKUP_TIMEOUT_SECONDS`, BR-M02-023), [spec-AI_integration](../../docs/spec/spec-AI_integration.md) (BR-AI-08, BR-AI-09).

## 2. Current → New

| Hiện tại | Mong muốn |
|---|---|
| AGENTS.md §2 chưa cho phép apply migration, deploy Edge Function, cấu hình hoặc secret cloud, deploy website. Code của bốn package chỉ chạy trên stack Supabase local. Tasks M03 T201–T209 bị chặn | Sản phẩm chạy trên Single Vercel Project và Single Supabase Cloud Project, theo phạm vi §7 và non-goals §10. Người vận hành cloud (§4, Q5) tự chạy mọi lệnh có secret hoặc tác động cloud |

## 3. Rationale

- Tem QR, camera điện thoại và PWA chỉ kiểm được đầy đủ trên HTTPS thật, nên các checklist thiết bị thật (M01 T100, M02 T100) và phép đo LCP (M02 T096) đang chờ môi trường này.
- Đây là project môn học. Mọi lựa chọn dưới đây ưu tiên không tốn chi phí và chấp nhận các rủi ro ở §9.

## 4. Quyết định của chủ dự án (2026-11-05)

| Mục | Quyết định |
|---|---|
| Q1 — Gói Supabase | Free cho toàn bộ MVP. Không thêm job chống tạm dừng. Rủi ro ở §9 |
| Q2 — Domain | Không mua domain. `QR_PUBLIC_BASE_URL` là địa chỉ Production cố định trên `vercel.app`, dùng ngay từ T206. Bỏ bước chuyển domain trước khi in tem |
| Q3 — Email Auth | SMTP riêng qua một tài khoản Gmail dành riêng cho dự án, dùng mật khẩu ứng dụng, do người vận hành cloud giữ. Không dùng Resend, không dùng dịch vụ email mặc định của Supabase |
| Q4 — Preview | (Chốt 2026-11-02) Chỉ deploy Production từ `main`; biến Supabase chỉ đặt ở scope Production, nên preview không có backend |
| Q5 — Quyền và người chạy lệnh | Một thành viên nhóm do chủ dự án chỉ định (sau đây gọi là **người vận hành cloud**) giữ owner trên cả Supabase và Vercel, tự chạy CLI login, link, db push, đặt secret và tạo Reviewer đầu tiên. Thay quyết định 2026-11-02 về người chạy lệnh. Agent chỉ soạn lệnh |
| Q6 — Function dịch | Deploy `translate` cùng đợt, dùng khóa Gemini gói miễn phí do người vận hành cloud cấp và giữ |
| Q7 — Đo sau phát hành | Dùng Vercel Web Analytics và Speed Insights theo điều kiện §6. Không dùng Google Analytics |
| Q8 — Reviewer | Chủ dự án và một thành viên nhóm. Email chỉ dùng khi chạy lệnh, không ghi vào repo, log hay tài liệu |
| Q9 — Deploy | Nối GitHub, tự deploy khi merge vào `main`. Từ khi nối Vercel (T203), người vận hành cloud là người merge PR, chỉ dùng kiểu "Create a merge commit", để tác giả commit trên `main` là owner của Vercel project (§9). PR có migration: người vận hành cloud apply trước khi merge, và migration phải tương thích với bản frontend đang chạy (environment.md §11) |
| Q10 — Release gate | Chủ dự án kiểm trên Android Chrome và iOS Safari thật. Giữ `SOURCE_REQUEST_TIMEOUT_SECONDS` = 8, `LOOKUP_TIMEOUT_SECONDS` = 8 và các giới hạn §5.3, chỉ đổi nếu đo thực địa thấy chậm |
| Dữ liệu trên production | Production bắt đầu sạch: migration không tạo nội dung, không seed. Không tạo dữ liệu giả; phần kiểm thử cần dữ liệu chạy trên tuyến thật đầu tiên do Reviewer nhập. Phiên thử được giữ trong báo cáo |

Gói Vercel: Hobby. Điều khoản Hobby chỉ cho phép dùng cá nhân, phi thương mại; project môn học phù hợp. Nếu dự án chuyển sang dùng thương mại thì phải xem lại gói.

Repo: chủ dự án chuyển GitHub repo sang public trước T203 (tài liệu Vercel: "Collaboration is free for public repositories"). Người kiểm trên thiết bị thật và người duyệt brief là chủ dự án.

## 5. Thay đổi BR-M03-B04

Đây là thay đổi nghĩa có chủ đích, thực hiện trước khi chạy bất kỳ lệnh cloud nào (AGENTS.md §4).

| | Nội dung |
|---|---|
| Hiện tại | "the Production base URL is a domain owned by the project and kept for as long as codes are installed, and if that domain ever changes the old links keep redirecting to the new one." |
| Đề xuất | "the Production base URL is a fixed HTTPS address controlled by the project (for the MVP, an address provided by the hosting platform is acceptable) and kept for as long as codes are installed, and if that address ever changes the old links keep redirecting to the new one." |
| Ghi nhận | Thêm dòng "3.7 (clarification 10)" vào lịch sử phiên bản của spec-M03 |
| Giữ nguyên | Định dạng link `{QR_PUBLIC_BASE_URL}/q/{qrIdentifier}`, không có tham số khác, link không mang trạng thái, mã từ môi trường không phải Production không được dán ra thực địa |

Ràng buộc đi kèm, ghi vào environment.md §4: địa chỉ `vercel.app` là của Single Vercel Project; khi tem còn dán thì không xóa project, không chuyển sang tài khoản khác nếu chưa kiểm tra địa chỉ vẫn giữ nguyên, không đổi địa chỉ Production.

## 6. Vercel Web Analytics và Speed Insights

Đây là công cụ đo cho người vận hành, nằm ngoài giao diện M03. Nó không thay đổi RPT-01, RPT-02 và không thêm hành vi nào vào spec. Hai điểm đã đối chiếu: "Advanced analytics … per-QR reporting" ở spec-M03 §1 và "thu thập PII/device identifier" ở [MVP-Scope.md](../../MVP-Scope.md) §4.

Điều kiện triển khai (task mới T210):

1. Thêm hai gói `@vercel/analytics` và `@vercel/speed-insights`, ghim phiên bản chính xác, cập nhật lockfile và tech-stack.md §13.
2. Chỉ nạp khi `IS_PRODUCTION_BUILD` là `true`, bằng `import()` động, để không vào luồng test hay build thử.
3. Dùng chung một hàm `beforeSend` cho cả hai gói, có unit test:
   - Đường dẫn `/admin` và `/admin/*`: không gửi, vì link mời và khôi phục mang token trên URL.
   - `/q/{qrIdentifier}`: đổi thành `/q/[id]`, vì spec-M03 §1 loại báo cáo theo từng QR khỏi MVP.
   - Các đường dẫn khác: bỏ query và hash.
4. Không dùng custom event, không thêm màn hình, không thêm tham số vào link QR (BR-M03-B04).
5. Lỗi tải script (offline, chặn quảng cáo) không được ảnh hưởng tới app. T208 kiểm đường offline trên bản đã deploy.

Speed Insights là số liệu bổ sung, không thay phép đo LCP bằng Lighthouse của M02 T096.

## 7. Phạm vi được phép

### 7.1 File

| Đường dẫn | Nội dung | Task |
|---|---|---|
| `vercel.json` | Rewrite về `/index.html`, header cache theo T202 | T202 |
| `src/app/**`, `package.json`, `package-lock.json` | Nạp có điều kiện hai gói đo và hàm `beforeSend` theo §6 | T210 (mới) |
| `supabase/functions/_shared/publishableKey.ts`, `supabase/functions/admin-accounts/index.ts`, `supabase/functions/translate/index.ts` | Đọc `SUPABASE_PUBLISHABLE_KEYS` trước `SUPABASE_ANON_KEY` (legacy trên cloud); không đổi hành vi. Bổ sung 2026-11-05, xem validation-report D-138 | T205 |
| `specs/003-m03-operations-content-administration/cloud-runbook.md` | Lệnh soạn sẵn cho người vận hành cloud, chỉ dùng placeholder | T203–T209 |
| `docs/spec/spec-M03.md` | Chỉ BR-M03-B04 và dòng lịch sử phiên bản (§5) | T201 |
| `docs/architecture/environment.md`, `docs/architecture/tech-stack.md` | §4: địa chỉ `vercel.app` và ràng buộc; SMTP Gmail; hai gói đo; hiện trạng Free và backup thủ công | T201 |
| `specs/003-m03-operations-content-administration/spec.md`, `plan.md` | Đồng bộ câu về domain (spec.md dòng 326, 344; plan.md dòng 217) | T201 |
| `specs/003-m03-operations-content-administration/tasks.md`, `validation-report.md` | Sửa T203–T206, T209 và thêm T210 theo §8; ghi tham chiếu và kết quả | T201, T208, T209 |
| `AGENTS.md` | §2, §4: mở phạm vi cloud theo brief này | T201 |

### 7.2 Thao tác trên cloud (chỉ người vận hành cloud chạy)

Điều kiện trước T203: repo đã public, người vận hành cloud có quyền collaborator để merge PR, và tài khoản Vercel đã liên kết GitHub. Chủ dự án là người cấp quyền repo, và cài Vercel GitHub App trên repo nếu Vercel yêu cầu.

| Task | Thao tác |
|---|---|
| T203 | Tạo Single Vercel Project trước để có origin Production. Supabase: Data API chỉ mở schema `api`, tắt đăng ký công khai, `site_url` là origin Production, redirect URL `/admin/invitation` và `/admin/recovery`, SMTP Gmail |
| T204 | Kiểm project ref, xem danh sách migration, dry-run, dump đủ ba phần (roles, schema, data) lưu ngoài repo, rồi apply. Cấm seed và reset |
| T205 | Đặt `APP_BACKEND_SECRET_KEY`, `GEMINI_API_KEY`. Deploy `session-intake`, `admin-accounts`, `translate` với `verify_jwt = false` |
| T206 | Đặt `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_QR_PUBLIC_BASE_URL` ở scope Production; bật Analytics, Speed Insights; xác nhận không còn dấu "BẢN THỬ" |
| T207 | Tạo Reviewer đầu tiên; người này mời Reviewer dự phòng |

Cấu hình T203 đặt trực tiếp trên dashboard. Không dùng `supabase config push`, vì `supabase/config.toml` là cấu hình local (`site_url` trỏ localhost) và có thể ghi đè cấu hình cloud.

## 8. Thay đổi trong tasks M03 khi duyệt

| Task | Sửa |
|---|---|
| T203 | Thêm bước tạo Vercel project; ghi SMTP là Gmail riêng |
| T204 | Ghi rõ backup là dump thủ công đủ ba phần (roles, schema, data) |
| T205 | Thêm `translate` và `GEMINI_API_KEY` |
| T206 | `VITE_QR_PUBLIC_BASE_URL` là địa chỉ `vercel.app` cố định |
| T208 | Chia hai đợt: đợt 1 sau T207, không cần dữ liệu; đợt 2 đọc media và gửi phiên, sau khi có tuyến thật đầu tiên |
| T209 | Chạy trên tuyến thật đầu tiên; thêm đo LCP của `/q/{id}` (M02 T096); người kiểm là chủ dự án; chỉ in số tem cần cho checklist |
| T210 (mới) | Vercel Web Analytics và Speed Insights theo §6, làm trước T206 |

## 9. Rủi ro chủ dự án chấp nhận

| Rủi ro | Hậu quả | Biện pháp |
|---|---|---|
| Supabase Free tạm dừng khi ít hoạt động trong 7 ngày | Quét QR online, gửi phiên, M01 và M03 ngừng hoạt động đến khi khôi phục | Người vận hành cloud theo dõi email cảnh báo và mở lại project; kiểm tra project trước mỗi buổi demo hoặc kiểm thử |
| Free không có backup tự động; dump không gồm file Storage | Mất dữ liệu nếu sự cố, không có bản sao tự động. environment.md §12 về thực hành restore định kỳ không được thực hiện cho MVP | Dump đủ ba phần trước mỗi lần apply và sau mỗi đợt nhập nội dung lớn, lưu ngoài repo vì repo public và dump có thể chứa email tài khoản; giữ bản gốc ảnh và media |
| Kiểm thử trên nội dung thật, MVP không có hard delete, không được reset trên cloud | Phiên thử ở T208, T209 nằm vĩnh viễn trong báo cáo; tuyến đầu tiên xuất hiện công khai từ lúc xuất bản | Chấp nhận; chỉ tạo số phiên thử cần cho checklist |
| Free giới hạn 500 MB database, 1 GB file | Vượt mức thì không tải thêm được media | Người vận hành cloud theo dõi dung lượng khi nhập nội dung |
| Địa chỉ `vercel.app` phụ thuộc tài khoản Vercel của người vận hành cloud | Mất project hoặc tài khoản thì mọi tem đã dán hỏng | Ràng buộc ở §5 |
| Repo public: toàn bộ code, tài liệu và lịch sử commit (gồm email tác giả commit) ai cũng đọc được | Secret từng lọt vào lịch sử git sẽ bị lộ, và ẩn repo lại không thu hồi được | Quét lịch sử trước khi public (§12); secret từng lọt phải được thu hồi |
| Quy tắc deploy của Vercel Hobby với tác giả commit chưa được kiểm chứng trên repo public | Deploy tự động có thể bị chặn | Người vận hành cloud merge bằng merge commit và kiểm tra ở T206; nếu vẫn bị chặn thì dừng và chủ dự án chọn: deploy thủ công bằng Vercel CLI hoặc nâng Pro |
| Gmail SMTP: mật khẩu ứng dụng, không có cam kết gửi thư | Đổi mật khẩu Gmail làm thu hồi mật khẩu ứng dụng, email ngừng gửi; thư có thể vào spam. Giới hạn 500 email/ngày của Gmail, 30 email/giờ mặc định của Supabase | Tài khoản riêng, bật xác minh 2 bước; khi đổi mật khẩu thì cập nhật lại Supabase; báo trước cho nhân sự M03 |
| Gemini gói miễn phí: nội dung gửi lên được Google dùng để cải thiện sản phẩm; có hạn mức (xem trong AI Studio) | Văn bản nháp được dịch đi qua Google; vượt hạn mức thì nút dịch báo MSG-AI-FAILED | Không đưa thông tin cá nhân hay nội dung nhạy cảm vào trường cần dịch |
| Vercel Hobby: 50.000 event/tháng Web Analytics, 10.000 event/30 ngày Speed Insights | Vượt mức thì ngừng thu số liệu, app không ảnh hưởng | Chấp nhận |
| Một người giữ toàn bộ quyền cloud và secret | Người vận hành cloud vắng mặt thì không ai xử lý được sự cố cloud, kể cả chủ dự án | Chấp nhận cho MVP |

## 10. Explicit non-goals

- Không mua domain, không dùng Resend, không có job chống tạm dừng, không dùng Google Analytics.
- Không seed, không reset, không chạy test phá hủy và không tạo dữ liệu giả trên cloud; `supabase/seed.sql` chỉ dùng cho local.
- Không ghi secret, token, mật khẩu, email người dùng thật, project ref hay địa chỉ Production vào repo, log hoặc tài liệu.
- Agent không chạy lệnh có secret hoặc tác động cloud.
- Không thêm môi trường hay project thứ hai (environment.md §9).
- Ngoài BR-M03-B04 (§5), không đổi spec, contract, entity, DAC hay Physical Schema. Phát hiện lệch thì dừng và ghi `[NEEDS CLARIFICATION: …]`.
- Không in tem hàng loạt hay dán tem ra thực địa trước khi T209 đạt; chỉ in số tem cần cho checklist T209.

## 11. Thứ tự sau khi duyệt

1. PR tài liệu: spec, architecture, tasks, AGENTS.md (T201).
2. PR `vercel.json` (T202) và PR hai gói đo (T210).
3. T203 → T204 → T205 → T206 → T207, người vận hành cloud chạy theo lệnh soạn sẵn, từng bước một.
4. T208 đợt 1: smoke check không cần dữ liệu, ghi vào validation-report.md.
5. Reviewer nhập và xuất bản tuyến thật đầu tiên qua M03.
6. T208 đợt 2: đọc media, gửi phiên.
7. T209: release gate trên thiết bị thật, chạy trên tuyến đó.
8. Sau khi T209 đạt: in tem hàng loạt, dán ra thực địa và nhập phần nội dung thật còn lại.

Dừng ngay nếu project ref không khớp, dry-run có migration ngoài dự kiến, hoặc build Production còn dấu "BẢN THỬ".

## 12. Validation gates

- Trước khi chuyển repo sang public: quét toàn bộ lịch sử git để tìm secret và file `.env`.
- Trước mỗi PR: `npm run ci`, `npm run e2e`. Tích hợp thật: job `local-stack`.
- T202: trên bản đã deploy, mở trực tiếp `/q/{id}`, `/routes/{id}`, `/trip`, `/admin` không ra 404; kiểm header cache.
- T205: gọi thử `translate` từ editor M03 trả bản dịch; `dist/` không chứa chuỗi khóa (SC-AI-004).
- T206: deploy đầu tiên từ `main`, là merge commit do người vận hành cloud tạo, không bị Vercel chặn vì tác giả commit. Nếu bị chặn, dừng và làm theo §9.
- T208 đợt 1: đọc công khai, đăng nhập và phân quyền M03, đường offline; `/admin` không phát sinh event Analytics. T208 đợt 2: đọc media, gửi phiên.
- T209: M01 T100, M02 T100 (M1–M10), LCP của `/q/{id}` ≤ 2,5 s, xác nhận các giá trị tạm.
- Lệnh chưa chạy ghi `NOT RUN` kèm lý do.

## 13. Open questions

Không có câu hỏi mở. Chủ dự án quyết định (2026-11-05) không đưa vào phạm vi brief này hai việc: kiểm tra quy định dữ liệu cá nhân của Việt Nam liên quan tới Vercel Analytics, và kiểm tra điều khoản của Google về gửi email tự động qua Gmail.

## 14. Khi duyệt

Đã duyệt 2026-11-05, kèm phương án dữ liệu ở §4. Agent thực hiện T201: sửa BR-M03-B04, đồng bộ tài liệu ở §7.1, sửa tasks theo §8, cập nhật AGENTS.md §2 và §4, ghi tham chiếu vào validation-report.md, tất cả qua PR vào `main`.
