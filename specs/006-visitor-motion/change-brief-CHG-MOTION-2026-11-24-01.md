# Change Brief CHG-MOTION-2026-11-24-01 — Motion & micro-interactions trên màn du khách M01 và M02

| Trường | Nội dung |
|---|---|
| Change ID | CHG-MOTION-2026-11-24-01 |
| Trạng thái | **APPROVED** (2026-11-24). Được đồng bộ tài liệu (§4.1), tạo gói Spec-Kit và code frontend theo phạm vi §4 và non-goals §7 |
| Người duyệt | Chủ dự án (duyệt trong chat 2026-11-24: "duyệt, OD theo đề xuất"; bốn điều chỉnh sau khi pull `main` 7c29104 "theo đề xuất"; bỏ slot `TRACK`, dùng icon). *Chủ dự án điền tên tài khoản nếu cần* |
| Ngày duyệt | 2026-11-24 |
| Loại thay đổi (runbook §4) | Thay đổi **hình thức** (design-system §4.3, §5, §9) cộng phạm vi code **chỉ frontend**. Một thay đổi hành vi nhỏ ở [spec-Mascot](../../docs/spec/spec-Mascot.md) (công tắc chuyển động chung, slot mới, tư thế mới), đưa spec-Mascot lên v1.4. Không đổi hành vi, contract, entity hay dữ liệu của spec-M01, spec-M02, spec-M03 |
| Liên quan | Thảo luận và quyết định của người dùng trong chat 2026-11-24 (Q1–Q6 "theo đề xuất", Q6 chọn b); [design-system](../../docs/design/design-system.md) §4.3, §5.4, §9; [spec-Mascot](../../docs/spec/spec-Mascot.md) v1.3 BR-MAS-17, 18, 21, 23; [hướng dẫn tạo ảnh Mila](../../docs/mascot/MASCOT_IMAGE_PRODUCTION_GUIDE.md) |

## 1. Source

- Yêu cầu người dùng 2026-11-24: nâng cấp UI/UX bằng motion và micro-interactions; ưu tiên mobile-first, nhẹ, chạy offline; phân biệt animation trang trí với animation phản hồi; giữ nhất quán design system; không refactor kiến trúc.
- Quyết định đã chốt trong chat 2026-11-24:

| # | Quyết định |
|---|---|
| Q1 | Không thêm thư viện: CSS, Web Animations API, View Transitions API (trình duyệt không hỗ trợ thì đổi màn tức thì). Confetti lá tự viết (canvas hoặc DOM), dùng màu token |
| Q2 | Ba tầng chuyển động T1 phản hồi, T2 chuyển cảnh, T3 trang trí (§2.1). Công tắc "Chuyển động của Mila" mở rộng thành **"Hiệu ứng chuyển động"**, dừng cả Mila và T3 |
| Q3 | Ngân sách hiệu năng thành luật trong design-system (§5 dưới) |
| Q4 | Ba đợt: (1) phản hồi cốt lõi, (2) chuyển cảnh và trạng thái, (3) trang trí và phần thưởng (§8) |
| Q5 | Chỉ ăn mừng sự kiện đã có (lượt ghé được ghi, mốc tiến trình, kết thúc chuyến, gói offline sẵn sàng). **Không** huy hiệu, điểm, thành tích: [spec-M02](../../docs/spec/spec-M02.md) §2 non-goal "Hints, scoring, achievements" giữ nguyên |
| Q6 | Người dùng cung cấp ảnh Mila đợt 4: 5 tư thế mới (4A) và 4 khung phụ (4B), §4.3 |

Các rule được trích dẫn và giữ nguyên: spec-Mascot BR-MAS-08, 17, 18, 20, 23, 24; spec-M02 §2 (non-goals); design-system §6 (WCAG 2.1 AA).

## 2. Current → New

| Hiện tại | Mong muốn |
|---|---|
| Đổi màn tức thì; chưa có chuyển cảnh | View Transitions giữa các màn du khách; card tuyến chuyển thành ảnh đầu màn chi tiết (SCR-M01-001 → SCR-M01-003) |
| Nút, card chỉ có lớp phủ hover/pressed (§5.4) | Nhấn thì co nhẹ; card nhấc nhẹ khi hover (máy có chuột); không đổi màu ngoài §5.4 |
| Lượt ghé mới chỉ cập nhật số "n/tổng" và Mila ăn mừng | Bản đồ hành trình (`RouteJourneyMap`): điểm vừa ghé nảy lên, đoạn đường mòn tự vẽ tới điểm kế tiếp, thanh tiến trình **xác định** (k/n lấy từ phiên) đầy dần với dấu chân (icon SVG) ở đầu thanh; câu "Đã quét QR: k/n" giữ nguyên; đồng bộ với cấp ăn mừng của BR-MAS-23 |
| Tải gói offline: nhãn "Đang tải…" (M01 không báo phần trăm) | Thanh "đang tải" **không xác định** (vệt đường mòn trôi, không số, không giả tiến độ); xong thì có dấu ✓. Mila vẫn nói ở slot `package-panel` như US7 |
| Đang tải: chữ hoặc vùng trống | Skeleton có vệt sáng như nắng lướt qua lá (T2; giảm chuyển động thì skeleton đứng yên) |
| Trạng thái rỗng: `MascotFigure` `rest` cạnh câu cố định (US7) | Đổi tư thế sang `peek` (nấp sau lá) ở các chỗ đang có; không thêm component trạng thái rỗng mới |
| Màn kết thúc: Mila ăn mừng, lá rơi | Thêm số liệu đếm lên, dải "hoàn thành tuyến" (chỉ trang trí, không lưu), confetti lá dùng chung hạt lá của Mila |
| Trang trí thiên nhiên: chưa có | Hero danh mục có tia nắng và vài lá trôi chậm (T3) |
| Công tắc "Chuyển động của Mila" chỉ dừng Mila, chỉ hiện khi Mila bật | Công tắc "Hiệu ứng chuyển động" dừng Mila, mọi T3 và rung; luôn hiện ở SCR-M01-004 kể cả khi Mila tắt (OD-MOT-02) |

### 2.1 Ba tầng chuyển động

| Tầng | Ví dụ | Mặc định | `prefers-reduced-motion` hoặc công tắc tắt |
|---|---|---|---|
| **T1 Phản hồi** | Nhấn nút, lượt ghé được ghi, lỗi, tiến trình tăng, dấu ✓ | Luôn chạy, ≤ 300 ms | Vẫn có phản hồi nhưng chỉ đổi màu hoặc mờ dần ≤ 150 ms, không dịch chuyển |
| **T2 Chuyển cảnh** | Đổi màn, mở card, dialog, skeleton | Chạy, ≤ 300 ms | Đổi tức thì; skeleton đứng yên |
| **T3 Trang trí** | Tia nắng, lá trôi, confetti, số đếm lên | Chạy, có giới hạn thời gian | Tắt hẳn; hiện ngay trạng thái cuối |

Chuyển động không bao giờ là cách **duy nhất** truyền thông tin: mọi phản hồi T1 có chữ hoặc trạng thái tĩnh tương ứng (spec hiện hành).

## 3. Rationale

- Mục tiêu: biến website thông tin thành trải nghiệm khám phá có tương tác (yêu cầu người dùng 2026-11-24).
- Chỉ đổi hình thức và một phần hành vi của Mila; không đụng nghiệp vụ, dữ liệu, backend. Rủi ro thấp, giảm về trạng thái hiện tại khi tắt công tắc hoặc khi trình duyệt không hỗ trợ.
- Ưu tiên MVP: **Could** (OD-MOT-05). Không chặn luồng Must nào.
- Luôn chỉ một Mila trên màn (spec-Mascot §1): thanh tiến trình dùng icon, không đặt Mila thứ hai.

## 4. Phạm vi file được phép (sau khi duyệt)

### 4.1 Tài liệu

| Đường dẫn | Nội dung |
|---|---|
| `docs/design/design-system.md` | §4.3: ba tầng, token mới (thời lượng, easing có tên), ngân sách hiệu năng; §5: skeleton, thanh tiến trình (xác định cho hành trình, không xác định cho gói), press/hover (§5.4 cho phép co nhẹ khi nhấn); §7 icon mới; §9: tư thế mới, §9.5 đổi thành "Hiệu ứng chuyển động" |
| `docs/spec/spec-Mascot.md` | Lên v1.4: BR-MAS-21 (công tắc chung, phạm vi T3, luôn hiện), BR-MAS-17 và 19 (rung theo công tắc), danh sách tư thế ở glossary. Mapping tư thế cho từng phản ứng thuộc docs/mascot (spec-Mascot §5.5). Không slot mới |
| `docs/mascot/**` | Đồng bộ: asset spec §4 (MA-12, 14–17, 20, 21, 22), behavior matrix, state machine, technical spec, testing checklist; hướng dẫn tạo ảnh thêm §9 "Đợt 4" với prompt đã gửi trong chat 2026-11-24 và đạo cụ cho phép mới (một chiếc lá, chỉ cho `peek`) |
| `screens/screen-spec/M01/*`, `screens/screen-spec/M02/*` | **Chỉ** khi màn có phần tử hoặc trạng thái hình thức mới (thanh tiến trình hành trình SCR-M02-001, nhãn công tắc SCR-M01-004, skeleton) |
| `MVP-Scope.md` | Một dòng năng lực Motion với priority đã chốt; §4 Won't giữ nguyên |
| `AGENTS.md` | §2 phạm vi code thêm gói `specs/006-visitor-motion/`; không đổi §3.1 (không có spec canonical mới, xem OD-MOT-01) |
| `README.md`, `docs/README.md` | Đồng bộ mô tả, link |

### 4.2 Gói Spec-Kit và code

| Đường dẫn | Nội dung |
|---|---|
| `specs/006-visitor-motion/**` | Gói Spec-Kit (spec, plan, research, quickstart, tasks, checklists, validation report) |
| `src/shared/motion/**` (mới) | Tiện ích dùng chung: trạng thái công tắc + `prefers-reduced-motion` + `saveData`/máy yếu → mức T3; hạt lá; hook reveal khi cuộn; hook đếm số. Không import module nào |
| `src/shared/ui/**` | Press/hover của Button và card; component Skeleton, ProgressTrail (xác định và không xác định); tokens.css (token mới sau khi design-system được sửa). Không component trạng thái rỗng mới: dùng `MascotFigure` sẵn có |
| `src/shared/mascot/**`, `src/app/mascot/**` | Tư thế mới, khung phụ; `motion.ts` và `MascotMotionSwitch` chuyển sang `src/shared/motion/` (công tắc phải hiện cả khi `VITE_FEATURE_MASCOT` tắt); mascot đọc trạng thái từ đó |
| `src/app/**` | Bật View Transitions cho điều hướng du khách (`react-router` có sẵn); không đổi route hay guard |
| `src/modules/m01/**`, `src/modules/m02/**` | **Chỉ phần trình bày**: CSS Modules, className, bọc component hiển thị, gắn slot, test tương ứng. Không đổi logic, kiểu trả về, thứ tự ghi dữ liệu hay câu cố định |
| `assets/mascot/**` | Ảnh đợt 4 do người dùng cung cấp (`source/`) và bản WebP do agent xuất (`web/`) |
| `assets/icons/` | Icon SVG mới theo design-system §7 (agent được vẽ icon, quyết định 2026-11-10): `footprint.svg` (đầu thanh tiến trình hành trình), `sun-rays.svg` (hero); lá dùng lại `leaf.svg` |
| `vite.config.ts` | Mẫu precache cho ảnh mới |
| `e2e/**` | E2E cho chuyển cảnh, giảm chuyển động, công tắc |

M03 (`src/modules/m03/**`) không nằm trong phạm vi.

## 5. Impact dimensions

| Chiều | Tác động |
|---|---|
| Actor/role | Không đổi |
| Lifecycle/status | Không đổi |
| Field/type, DAC | Không đổi; không entity, cột, store IndexedDB hay migration mới |
| Validation rule | Không đổi |
| Cross-module contract | Không đổi. M02 vẫn chỉ import M01 qua `m01Port.ts` |
| Report | Không đổi |
| Screen | SCR-M01-001…004, SCR-M02-001…005: thêm chuyển động và trạng thái hình thức; mọi câu cố định và thứ tự thao tác giữ nguyên |
| MVP priority | Could (OD-MOT-05) |
| Data retention | Không lưu gì mới (OD-MOT-03); không gửi gì ra khỏi thiết bị; không analytics mới |
| Dịch vụ bên ngoài | Không |
| Dependency | Không thêm dependency runtime |
| Hiệu năng | Mã motion thêm (JS + CSS) ≤ 15 KB gzip. Ảnh Mila đợt 4 thêm vào precache ≤ 120 KB (đo khi có ảnh). Chỉ animate `transform`/`opacity`; không vòng `requestAnimationFrame` khi màn đứng yên; dừng khi trang ẩn; tối đa 3 chuyển động T3 cùng lúc; confetti ≤ 40 hạt, ≤ 2 400 ms. T3 tự tắt khi `navigator.connection.saveData` hoặc `navigator.deviceMemory ≤ 2`. Không làm chậm LCP (không ẩn phần tử trên màn đầu để chờ animation) và không gây CLS |
| Offline | Mọi tài nguyên motion nằm trong bundle hoặc precache; không tải gì khi chạy |
| Truy cập | WCAG 2.1 AA giữ nguyên; 2.2.2 (dừng chuyển động > 5 s) bằng công tắc; 2.3.1 không nhấp nháy > 3 lần/giây |

## 6. Expected consumers

Du khách trên các màn M01 và M02. M03 không dùng.

## 7. Explicit non-goals

- Không huy hiệu, điểm, thành tích, bảng xếp hạng, bộ sưu tập hay bất kỳ dữ liệu thưởng nào được lưu (spec-M02 §2; MVP-Scope §4).
- Không backend, không đổi spec-M01, spec-M02, spec-M03, contract, entity, DAC hay Physical Schema.
- Không thêm thư viện animation, Lottie, Rive, sprite sheet nhiều khung.
- Không âm thanh. Không đổi luồng, thứ tự bước, câu cố định hay vị trí nút.
- Không đổi giao diện M03.
- Không vẽ lại Mila, không chuyển ảnh Mila sang SVG; agent chỉ cắt, đổi cỡ, nén, ghép vùng khác biệt (như đợt 3).
- Không refactor kiến trúc; không đổi cấu trúc thư mục ngoài `src/shared/motion/` mới.
- Không commit, push, deploy nếu người dùng chưa yêu cầu.

## 8. Thứ tự đề xuất sau khi duyệt

1. Trả lời OD-MOT-01…06 (§10). *Xong 2026-11-24.*
2. Sửa design-system §4.3, §5, §7, §9; spec-Mascot lên v1.4; đồng bộ `docs/mascot/**` (gồm §9 "Đợt 4" của hướng dẫn tạo ảnh), MVP-Scope, AGENTS.md §2, README.
3. Chạy chuỗi Spec-Kit cho `specs/006-visitor-motion/`: specify → clarify → plan → tasks → analyze.
4. Code theo tasks, mỗi đợt một PR:
   - **Đợt 1, phản hồi cốt lõi:** nền `src/shared/motion` + token + công tắc chung; press/hover nút và card; mở khóa checkpoint và thanh tiến trình hành trình; thanh "đang tải" của gói offline. Không chờ ảnh mới (thiếu ảnh thì dùng tư thế cũ gần nhất).
   - **Đợt 2, chuyển cảnh và trạng thái:** View Transitions, card hiện dần khi cuộn (chỉ phần dưới màn đầu, một lần), skeleton; tư thế `peek`, `amazed`, `sorry`, `walk` vào các phản ứng sẵn có.
   - **Đợt 3, trang trí và phần thưởng:** màn kết thúc (đếm số, dải hoàn thành, confetti lá, Mila `proud`), hero danh mục (nắng, lá trôi), khung phụ (vẫy, ăn mừng, bước, chớp mắt `proud`).
5. Ảnh đợt 4: người dùng giao 4A trước (duyệt `walk`, `proud`), rồi 4B; agent kiểm và xuất như các đợt trước.

## 9. Validation gates

- `npm run ci` PASS (typecheck, lint token, unit test, build).
- `npm run e2e` PASS cho `m01`, `m02`; test hiện có không bị sửa để "cho qua". Ngoại lệ có chủ đích: test của công tắc (`MascotMotionSwitch.test.tsx`, `e2e/m01/mascot-motion.spec.ts`, `dialogue/catalog.test.ts`) đổi theo nhãn "Hiệu ứng chuyển động" và việc công tắc hiện khi Mila tắt; ghi từng thay đổi trong validation report.
- Test riêng: mỗi animation có nhánh giảm chuyển động và công tắc tắt; không còn hạt hay vòng lặp khi trang ẩn; chuyển động T3 dừng khi `saveData`.
- Lint token mở rộng: thời lượng và easing trong `src/` lấy từ token, không hard-code.
- Test kiến trúc: `src/shared/motion` không import module; M02 chỉ import M01 qua `m01Port.ts`.
- Đo: kích thước chunk và precache so với §5; CLS = 0 trên các màn có reveal; LCP không tăng so với trước (Lighthouse mobile, mạng chậm). Phần không chạy được (thiết bị thật, máy yếu) ghi `NOT RUN` kèm lý do.

## 10. Open questions

| ID | Câu hỏi | Quyết định (2026-11-24, theo đề xuất) |
|---|---|---|
| OD-MOT-01 | Hành vi của công tắc chung đặt ở đâu? | **Trong spec-Mascot BR-MAS-21** (v1.4); phạm vi T3 tham chiếu design-system §4.3. Không tạo spec canonical mới |
| OD-MOT-02 | Khi Mila tắt (`VITE_FEATURE_MASCOT` = false), công tắc có hiện không? | **Có**: luôn hiện ở SCR-M01-004 với nhãn "Hiệu ứng chuyển động" |
| OD-MOT-03 | Có lưu lựa chọn công tắc qua các lần mở app không? | **Không** (giữ BR-MAS-18). Ai cần tắt lâu dài dùng "Giảm chuyển động" của hệ điều hành |
| OD-MOT-04 | Có rung nhẹ khi lượt ghé được ghi không? | **Đã có** từ spec-Mascot v1.0 (BR-MAS-19, 30 ms). v1.4 chỉ thêm: không rung khi công tắc tắt |
| OD-MOT-05 | Priority MVP | **Could**, như Mascot |
| OD-MOT-06 | Mila đi dọc thanh tiến trình (slot `TRACK`)? | **Bỏ** (người dùng chọn 2026-11-24): trên SCR-M02-001 đã có Mila ở DOCK, thêm `TRACK` thì có hai Mila. Thanh tiến trình hành trình dùng icon dấu chân; tư thế `walk` dùng cho Mila ở DOCK khi quay lại sau lượt ghé mới (MAS-B-056). Ở panel gói, Mila giữ slot `package-panel` của US7 |

### 10.1 Điều chỉnh sau khi pull `main` 7c29104 (2026-11-24, người dùng duyệt "theo đề xuất")

1. M01 không báo tiến độ tải gói (chỉ trạng thái `downloading`), nên thanh của gói là thanh **không xác định**; không giả phần trăm, không đổi logic tải.
2. Slot `package-panel` (US7) đã đặt Mila ở dòng gói đang tải; không thêm slot thứ hai ở panel gói.
3. Trạng thái rỗng đã có `MascotFigure` (US7); chỉ đổi tư thế, không component mới.
4. Đổi nhãn công tắc kéo theo sửa test của công tắc (§9); công tắc chuyển sang `src/shared/motion/` để hiện khi Mila tắt.

Các điểm kỹ thuật để plan chốt: tên token mới; cách nhận diện máy yếu; cách đo LCP/CLS trong CI; vị trí cuối của trạng thái công tắc (`src/shared/mascot/motion.ts` hay `src/shared/motion`).

## 11. Khi duyệt

Đã duyệt 2026-11-24. Agent thực hiện bước 2–3 của §8.

## 12. Tiến độ

| Ngày | Việc | Kết quả |
|---|---|---|
| 2026-11-24 | Soạn change brief | Xong |
| 2026-11-24 | Duyệt; OD-MOT-01…06 chốt; bốn điều chỉnh sau khi pull `main` (§10.1); bỏ slot `TRACK` | Xong |
| 2026-11-24 | Bước 2 §8: design-system, spec-Mascot v1.4, docs/mascot, MVP-Scope, AGENTS.md §2, README, screen spec SCR-M01-004, SCR-M02-001 | Xong |
| 2026-11-24 | Ảnh Mila đợt 4A/4B giao trong `assets/mascot/source/`; người dùng xác nhận quyền sử dụng | Xong (chưa kiểm, chưa xuất WebP) |
| 2026-11-24 | Bước 3 §8: `/speckit-specify` → `spec.md`, `checklists/requirements.md` | Xong; tiếp theo clarify/plan |
