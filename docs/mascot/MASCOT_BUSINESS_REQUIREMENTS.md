# Mascot Business Requirements

| Trường | Giá trị |
|---|---|
| Trạng thái | **PROPOSED** — tài liệu thiết kế. Hành vi đã được đưa vào [spec-Mascot](../spec/spec-Mascot.md) v1.0 (baseline 2026-11-21); khi lệch nhau, spec thắng. Quyết định §7 tương ứng OD-MAS-01…16 của spec |
| Ngày | 2026-11-20 |
| Phạm vi | M01, M02 (màn du khách). M03 không đổi |
| Nhãn trạng thái | **EXISTING**: đã cài và có test tự động PASS theo validation report (thiết bị thật vẫn `NOT RUN`). **SPECIFIED**: có trong spec/design-system nhưng chưa thấy trong code. **PROPOSED**: hành vi mascot mới đề xuất. **FUTURE**: đề xuất nhưng bị chặn bởi MVP-Scope §4 Won't, phải sửa spec trước. **UNKNOWN**: không kiểm chứng được trong repo |

## 1. Kết quả kiểm tra repository (Stage 1)

### 1.1 Trạng thái code và tài liệu

| Hạng mục | Kết quả | Nhãn |
|---|---|---|
| Gói `specs/001` (M01) và `specs/002` (M02) | 106/106 task mỗi gói; unit, E2E và tích hợp stack local PASS (validation-report) | EXISTING |
| Kiểm thủ công trên Android/iOS thật (T100), LCP `/q/…` (T096) | `NOT RUN` | UNKNOWN |
| Event bus hoặc cơ chế phát sự kiện ứng dụng | **Không có.** Các màn tự xử lý kết quả trong component (`TripPage`, `ScanContent`, `StartPanel`…). Chỉ có listener trình duyệt: `visibilitychange` (tự kết thúc phiên, đồng bộ), `online` (đồng bộ) | EXISTING (hạn chế) |
| Theo dõi mạng | `navigator.onLine === false` dùng để bỏ qua request (`sourceClient.ts`, `lookupClient.ts`). Không có chỉ báo online/offline trên giao diện | EXISTING |
| Tiến độ tải gói | Chỉ có trạng thái "Đang tải", không có phần trăm (design-system §5.2: không bịa phần trăm) | EXISTING |
| Trạng thái đồng bộ | `PENDING` / `SYNCED` / `CONFLICT` đọc từ IndexedDB; không lộ trạng thái "đang gửi" | EXISTING |
| Chuyển màn có hiệu ứng | Không có; `Suspense fallback={null}` ở mọi route M01/M02 | EXISTING (thiếu) |
| Motion hiện có | Pulse khung quét, toast vào/ra, dialog fade, huy hiệu màn kết quả, skeleton danh mục; token `--duration-*` về 0 khi `prefers-reduced-motion` | EXISTING |
| Analytics | Vercel Analytics và Speed Insights chỉ ở Production, có `redactEvent`; không có sự kiện hành vi du khách | EXISTING |
| Asset mascot trong repo | **Không có.** Năm concept sheet chỉ nằm trong tệp đính kèm của phiên chat | UNKNOWN → cần người dùng đưa vào repo |
| Nhãn "ngoài hành trình" của scanner feedback (design-system §5.2) | Mã `VALID` ngoài tuyến hiện chỉ hiện nội dung, không có câu nào nói rằng nó không tính vào hành trình | SPECIFIED, chưa thấy trong code |

### 1.2 Ràng buộc từ nguồn canonical mà mascot phải tuân theo

| Nguồn | Ràng buộc | Áp vào mascot |
|---|---|---|
| spec-M02 SC-M02-013, BR-M02-005 | Lượt ghé là "đã quét QR", không phải bằng chứng có mặt | Lời thoại không dùng "đến", "có mặt", "arrived" khi nói về lượt ghé |
| spec-M02 BR-M02-006/007; MVP-Scope §4 | Không bắt buộc ghé đủ, không theo thứ tự | Không câu nào ngụ ý phải quét hết; không khóa Finish |
| spec-M02 §5.1 | Câu cố định giữ nguyên văn | Mascot không thay, không viết lại các câu này |
| spec-M02 BR-M02-015, US-M02-08 | Thông báo tạm đóng là thông điệp an toàn | Mascot ẩn khi thông báo này hiển thị |
| spec-M02 BR-M02-021 | Câu hỏi cuối chuyến hiện **ngay** khi ghi lượt ghé điểm cuối | Hiệu ứng ăn mừng không được làm chậm hộp thoại |
| spec-M02 §1, MVP-Scope §4 | Hint chain, điểm, huy hiệu, achievement: Won't | Vai trò gamification v1 chỉ ghi nhận tiến độ có sẵn; huy hiệu và câu đố là FUTURE |
| spec-M02 BR-M02-011 | Không có thao tác của du khách với bản ghi `CONFLICT` | Mascot không đưa nút "thử gửi lại" |
| spec-M02 §10; MVP-Scope §4 | Không có nút "Dừng chuyến đi"; không có khái niệm tạm dừng | Mascot không nói "tạm dừng chuyến"; việc rời app không phải tạm dừng |
| spec-M02 §9, MVP Won't | Không GPS, không định danh thiết bị, không PII | Mascot không dùng vị trí, không gửi sự kiện đi đâu |
| spec-M01 US-M01-01, US-M02-09 | Vào từ link QR thì không có bước chọn ngôn ngữ | Lời giới thiệu (R1) không chặn trang `/q/…` |
| design-system §2.4, §5.3 | Màu không phải tín hiệu duy nhất; toast lỗi/hành động không tự đóng | Bong bóng có CTA không tự đóng; mascot không là tín hiệu duy nhất của trạng thái nào |
| design-system §4.3, §5.4 | Bảng motion giới hạn; "không thêm chuyển động ngoài 4.3" | Phải sửa design-system trước khi cài (người dùng đã cho phép 2026-11-20) |
| AGENTS.md §4 (assets/) | Ảnh (không phải icon) chỉ thêm khi người dùng cung cấp | Ảnh mascot do người dùng cung cấp; agent chỉ cắt, nén |
| Plan M02 Constitution VII | Không scheduler/background sync | Hẹn giờ của mascot chỉ chạy khi trang đang hiện và dừng khi trang ẩn |

## 2. Yêu cầu chức năng

| ID | Yêu cầu | Nhãn |
|---|---|---|
| MAS-FR-01 | Mascot phản ứng với **sự kiện ứng dụng có tên** ([State Machine](MASCOT_STATE_MACHINE.md) §4), không hiện ngẫu nhiên | PROPOSED |
| MAS-FR-02 | Mỗi màn khai báo **vị trí được phép** (slot) và **chế độ hiển thị** cho phép; ngoài slot, mascot không render | PROPOSED |
| MAS-FR-03 | Lời giới thiệu (R1) hiện **một lần mỗi lần trang được tải**, ngay sau khi du khách lần đầu chọn ngôn ngữ ở bước chọn ngôn ngữ. Không cần lưu cờ "đã xem": khi đã có `LanguagePreference` thì bước chọn ngôn ngữ không hiện nữa | PROPOSED |
| MAS-FR-04 | Khi lượt ghé được ghi lần đầu (`visitCreated`), mascot ăn mừng và nêu tiến độ "{k}/{n}" lấy từ dữ liệu phiên; không làm chậm việc hiện nội dung | PROPOSED |
| MAS-FR-05 | Khi có thông báo tạm đóng (`CLOSED`), mascot chuyển sang `SUPPRESSED` và xóa hàng đợi lời thoại | PROPOSED |
| MAS-FR-06 | Trong scanner, mascot chỉ ở vùng dưới khung quét và không bao giờ đè lên khung quét | PROPOSED |
| MAS-FR-07 | Phát hiện không hoạt động theo luật cố định ([State Machine](MASCOT_STATE_MACHINE.md) §6). Chỉ bật trên scanner và danh mục tuyến; tắt trên màn đọc, khi đang phát media, khi có hộp thoại, khi trang ẩn | PROPOSED |
| MAS-FR-08 | Phát hiện "bị kẹt" theo mẫu lặp cố định: 2 kết quả cùng loại lỗi liên tiếp trong một lần ở màn. Đưa trợ giúp một lần, không đổ lỗi | PROPOSED |
| MAS-FR-09 | Lời thoại lấy từ thư viện có ID ([Dialogue Library](MASCOT_DIALOGUE_LIBRARY.md)), theo `LanguagePreference` hiện tại. Khi đổi VI/EN, bong bóng đang hiện đổi ngôn ngữ ngay | PROPOSED |
| MAS-FR-10 | ~~Thu nhỏ mascot và chế độ yên lặng~~ | **Đã bỏ** (quyết định 2026-11-21): không có nút ẩn hay thu nhỏ, không chế độ yên lặng; mascot luôn có mặt ở màn có slot. Nút × trên bong bóng vẫn có, chỉ đóng lời nhắn |
| MAS-FR-11 | Chạm vào mascot mở **một gợi ý cố định theo màn hiện tại** (user-requested help). Làm đơn giản: mỗi màn một câu, không menu, không hội thoại | PROPOSED; đã chốt 2026-11-21 (MAS-D-04) |
| MAS-FR-12 | Khi `prefers-reduced-motion: reduce`, mọi chuyển động của mascot thay bằng hiện/ẩn tức thì hoặc mờ dần ≤ 150 ms; confetti không chạy | PROPOSED |
| MAS-FR-13 | Mascot hoạt động đầy đủ khi offline: ảnh tư thế dùng ở M02 nằm trong precache, lời thoại đóng gói trong bundle | PROPOSED |
| MAS-FR-14 | Mascot không chiếm focus bàn phím, không đọc lặp nội dung đã có `role="status"`/`"alert"` (xem [Technical spec](MASCOT_TECHNICAL_SPECIFICATION.md) §7) | PROPOSED |
| MAS-FR-15 | Mã `VALID` ngoài hành trình khi có phiên: mascot nói rõ điểm này không tính vào hành trình (lấp khoảng trống design-system §5.2) | PROPOSED; câu mới cần duyệt (MAS-D-12) |
| MAS-FR-16 | Huy hiệu, câu đố, nhiệm vụ: mascot là kênh ăn mừng và giới thiệu | FUTURE |

## 3. Business rules của mascot

| ID | Rule |
|---|---|
| MAS-BR-01 | **Không thay đổi nghiệp vụ.** Mascot chỉ đọc sự kiện và dữ liệu đã có; không ghi `PlaySession`, `CheckpointVisit`, `PendingSyncItem`, `LanguagePreference`, `OfflinePackage` hay `SelectedRouteContext`. Không thêm field vào `SessionSyncRecord` |
| MAS-BR-02 | **Một tiếng nói.** Tại một thời điểm chỉ có tối đa một bong bóng. Ưu tiên theo [State Machine](MASCOT_STATE_MACHINE.md) §5 |
| MAS-BR-03 | **An toàn trước tiên.** `CLOSED` → ẩn mascot, hủy hàng đợi. Mascot không xuất hiện lại trên màn đó cho tới khi có sự kiện khác (quét mới, đổi màn) |
| MAS-BR-04 | **Câu cố định không bị che.** Bong bóng của mascot không được đặt đè lên vùng thông báo (`FieldNotice`, `SourceNotice`), toast hay hộp thoại |
| MAS-BR-05 | **Không lặp.** Mỗi lời thoại có cooldown; cùng ID không hiện lại trong cooldown. Bộ nhớ "đã nói" chỉ giữ trong bộ nhớ của lần tải trang hiện tại |
| MAS-BR-06 | **Im lặng khi tập trung.** Đang phát audio/video, đang có hộp thoại, đang ở màn đọc, hoặc trang ẩn: không có lời thoại chủ động nào (P5–P7) |
| MAS-BR-07 | **Nói thật về dữ liệu.** Mascot chỉ nói "đã gửi" khi trạng thái là `SYNCED`; chỉ nói "xem được khi không có mạng" cho nội dung thật sự có trong gói `SAN_SANG` |
| MAS-BR-08 | **Không khuyến khích nhìn điện thoại khi di chuyển.** Sau khi xem nội dung xong, lời thoại ưu tiên "cất máy, ngắm rừng". Không có nhắc nhở hẹn giờ trên màn chuyến đi |
| MAS-BR-09 | **Khách tự do.** Ở chế độ khách tự do, mascot không ăn mừng tiến độ (vì không có tiến độ). Chỉ có hướng dẫn quét và lỗi |
| MAS-BR-10 | **Không chặn trang mở từ camera.** Trên `/q/…`, mascot không hiện lời giới thiệu R1 và không chậm hơn nội dung |
| MAS-BR-11 | **Riêng tư.** Không gửi sự kiện mascot ra ngoài thiết bị; không đưa vào analytics |
| MAS-BR-12 | **Hỏng thì im.** Lỗi tải ảnh hay lỗi trong bộ điều khiển mascot không được ảnh hưởng tới màn; mascot ẩn và app chạy như hiện tại |

## 4. Yêu cầu phi chức năng

| ID | Yêu cầu | Cách kiểm |
|---|---|---|
| MAS-NFR-01 | Tổng ảnh mascot trong precache ≤ 350 KB; mỗi tư thế ≤ 40 KB ở cỡ 2× (mục tiêu, đo khi có asset) | Test đọc `dist/sw.js` và kích thước tệp |
| MAS-NFR-02 | Mã engine và component mascot ≤ 12 KB gzip; không thêm dependency runtime | Đo bundle ở `vite build` |
| MAS-NFR-03 | Chỉ animate `transform` và `opacity`; không vòng lặp vô hạn quá 10 giây liên tục | Review CSS; test |
| MAS-NFR-04 | Không làm chậm LCP của `/q/…` (mục tiêu hiện tại ≤ 2,5 s): ảnh mascot nạp lười, không chặn render | Lighthouse (T096) |
| MAS-NFR-05 | Bong bóng ≤ 90 ký tự, đọc được ở 320 px, cỡ chữ ≥ 14 px, tương phản ≥ 4.5:1 | Test thư viện lời thoại; rà soát |
| MAS-NFR-06 | Hai ngôn ngữ có cùng bộ ID; thiếu bản dịch thì build lỗi | TypeScript `typeof vi` như i18n hiện có |

## 5. Ảnh hưởng tới hệ thống

| Lớp | Ảnh hưởng |
|---|---|
| Spec canonical | Spec hành vi mới [spec-Mascot.md](../spec/spec-Mascot.md) (v1.0, baseline 2026-11-21), vì có tương tác (chạm để nhận gợi ý, nhắc khi không hoạt động). Cùng mô hình với spec-AI_integration. Không đổi rule nào của spec-M01/M02 |
| MVP-Scope | Thêm một dòng năng lực "Mascot đồng hành" (priority do người dùng chọn, đề xuất Could). Chưa đụng §4 Won't cho tới khi làm huy hiệu |
| design-system | Mở rộng §4.3 và §5.4; thêm mục Mascot (slot, kích thước, bong bóng, token) |
| Screen spec | Thêm slot mascot và câu thoại vào bảng copy SCR-M01-001…004, SCR-M02-001…004 |
| Architecture | tech-stack: không thêm dependency. system-configuration: không đổi (mascot không lưu dữ liệu nào). environment: đã thêm `VITE_FEATURE_MASCOT` (MAS-D-08) |
| Data / Database | Không đổi entity, contract, migration. Mascot không lưu gì: mọi trạng thái là transient UI state trong bộ nhớ (AGENTS.md §5) |
| Backend / Infra | Không |
| AGENTS.md | Thêm dòng sở hữu cho `docs/mascot/` (hoặc gộp vào spec), và `assets/mascot/` (ảnh do người dùng cung cấp) |

## 6. Truy vết vai trò → yêu cầu

| Vai trò ([Brief](MASCOT_PRODUCT_BRIEF.md) §6) | Yêu cầu | Hành vi |
|---|---|---|
| R1 Onboarding | MAS-FR-03 | MAS-B-001…003 |
| R2 Navigation | MAS-FR-01, 07 | MAS-B-005…016, 020…023 |
| R3 Instruction | MAS-FR-06, 07, 08 | MAS-B-040…049 |
| R4 Exploration | MAS-FR-04, 15 | MAS-B-050…058 |
| R5 Motivator | MAS-FR-04, 16 | MAS-B-050, 051, 055, 090 (FUTURE) |
| R6 Celebrator | MAS-FR-04 | MAS-B-060…063 |
| R7 Recovery | MAS-FR-08 | MAS-B-024…026, 038, 044…048 |
| R8 Progress | MAS-FR-04 | MAS-B-033, 063, 070…073 |
| R9 Nature | MAS-BR-08 | MAS-B-057 |
| R10 Re-engagement | MAS-FR-01 | MAS-B-004, 034 |

## 7. Quyết định cần chốt

| ID | Câu hỏi | Đề xuất |
|---|---|---|
| MAS-D-01 | Tên mascot | **Đã chốt 2026-11-21: Mila** |
| MAS-D-02 | Đưa hành vi mascot thành spec canonical `docs/spec/spec-Mascot.md` qua change brief, như AI Integration? | **Đã chốt 2026-11-21: có.** `docs/mascot/` thành tài liệu thiết kế dẫn xuất |
| MAS-D-03 | Chế độ yên lặng lưu ở đâu? | **Đã chốt 2026-11-21: bỏ chế độ yên lặng và nút ẩn; mascot luôn có mặt.** Không lưu gì |
| MAS-D-04 | Có cho chạm vào mascot để nhận gợi ý không? | **Đã chốt 2026-11-21: có, làm đơn giản** (một câu cố định mỗi màn) |
| MAS-D-05 | Danh sách lời nhắc ứng xử với thiên nhiên (R9) | **Đã chốt 2026-11-21:** đồng ý; 5 câu chung, Ban Quản lý duyệt nội dung trước khi phát hành |
| MAS-D-06 | Màn kết quả: mascot thay huy hiệu dấu tích đã duyệt 2026-11-11, hay đứng cạnh? | **Đã chốt 2026-11-21:** đứng cạnh; huy hiệu giữ nguyên (OD-MAS-10) |
| MAS-D-07 | Rung nhẹ (`navigator.vibrate`) khi quét được mã? | **Đã chốt 2026-11-21:** có, 1 lần 30 ms, chỉ trình duyệt hỗ trợ; không khi giảm chuyển động (OD-MAS-09, BR-MAS-19) |
| MAS-D-08 | Cờ bật/tắt mascot khi phát hành (`VITE_FEATURE_MASCOT`) | **Đã chốt 2026-11-21:** có; bật sau khi pilot đạt (OD-MAS-15) |
| MAS-D-09 | Ai tạo asset production? | **Đã chốt 2026-11-21:** người dùng tạo lại theo [Asset spec](MASCOT_ASSET_SPECIFICATION.md) §5, làm sau |
| MAS-D-10 | Toast "Đã ghi nhận lượt quét." thêm dòng tiến độ "{k}/{n}" của mascot? | **Đã chốt 2026-11-21 (OD-MAS-11):** có. Câu toast giữ nguyên, thêm dòng thứ hai trong bong bóng |
| MAS-D-11 | Ngưỡng không hoạt động (15 s / 30 s / 90 s ở scanner) | **Đã chốt 2026-11-21 (OD-MAS-12):** dùng làm giá trị tạm, kiểm lại ngoài thực địa như `LOOKUP_TIMEOUT_SECONDS` |
| MAS-D-12 | Câu mới cho mã ngoài hành trình (MAS-FR-15) | **Đã chốt 2026-11-21 (OD-MAS-13):** có; đã thêm vào bảng copy SCR-M02-002 và SCR-M02-004 |
| MAS-D-13 | Quyền sử dụng ảnh mascot (công cụ tạo ảnh có cho phép Vườn dùng công khai?) | **Đã chốt 2026-11-21:** người dùng xác nhận sau, cùng lúc giao asset; trước đó không đưa ảnh vào repo |
| MAS-D-14 | Mascot có xuất hiện ở trang `/q/…` của khách tự do không? | **Đã chốt 2026-11-21 (OD-MAS-14):** có, nhưng chỉ ở dạng minh họa nhỏ cạnh gợi ý khách tự do, không bong bóng |
