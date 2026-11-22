# Change Brief CHG-MASCOT-2026-11-22-02 — Mila sống động hơn: chạm theo ngữ cảnh, mốc tiến trình, ngữ cảnh hoạt động, chuyển động

| Trường | Nội dung |
|---|---|
| Change ID | CHG-MASCOT-2026-11-22-02 |
| Trạng thái | **APPROVED** (2026-11-22). Được đồng bộ tài liệu (§4.1), cập nhật gói Spec-Kit và code frontend theo phạm vi §4 và non-goals §8 |
| Người duyệt | Chủ dự án (người dùng của phiên làm việc; duyệt trong chat 2026-11-22: "duyệt"). *Chủ dự án điền tên tài khoản nếu cần* |
| Ngày duyệt | 2026-11-22 |
| Loại thay đổi (runbook §4) | Behavioral change của [spec-Mascot](../../docs/spec/spec-Mascot.md) (v1.0 → v1.1) cộng phạm vi code **chỉ frontend**. Không đổi hành vi, contract, entity hay dữ liệu của spec-M01, spec-M02, spec-M03 |
| Liên quan | [CHG-MASCOT-2026-11-21-01](change-brief-CHG-MASCOT-2026-11-21-01.md) (APPROVED); bộ thiết kế [docs/mascot/](../../docs/mascot/README.md); góp ý và quyết định của chủ dự án trong chat 2026-11-22 (mục A2, A3, B5, B6, C và nhận xét sau khi thử trên điện thoại) |

## 1. Source

[spec-Mascot](../../docs/spec/spec-Mascot.md) v1.0: US-MAS-01…08; BR-MAS-05…12, 17, 19; §5.4 giới hạn tạm; §5.6 catalog. [Asset spec](../../docs/mascot/MASCOT_ASSET_SPECIFICATION.md) §3 (ảnh), §5 (animation AN-*). [Design system](../../docs/design/design-system.md) §4.3, §9. Kết quả thử trên điện thoại ngày 2026-11-22 (bản `feat/mascot-assets`, PR #63).

## 2. Current → New

| # | Hiện tại (v1.0) | Mong muốn (v1.1) | Quyết định 2026-11-22 |
|---|---|---|---|
| 1 | Chạm Mila: một câu hướng dẫn cố định mỗi màn (BR-MAS-12) | Câu trả lời **theo tình huống** của màn (ví dụ chuyến đi giữa chặng: "Còn {r} điểm nữa"); màn có nhiều câu thì chạm lần sau hiện câu kế tiếp. Mỗi lần chạm Mila luôn có một phản ứng hình ảnh. Vẫn không menu, không hội thoại | A2: đồng ý |
| 2 | Mốc tiến trình: mã đầu tiên (051), nửa chặng khi n ≥ 4 (055), mỗi điểm khác "{k}/{n}" (050), kết thúc chuyến (062) | **Ba cấp ăn mừng**: (1) mỗi điểm thường — nhún 1 lần + "{k}/{n}"; (2) mốc — mã đầu tiên, nửa chặng, **còn 1 điểm cuối (mới)** — nhảy 2 lần + vài lá rơi + câu riêng; (3) kết thúc chuyến — ăn mừng đầy đủ, **câu khác nhau giữa quét đủ mọi điểm và kết thúc sớm**. Không điểm số, không huy hiệu, không lưu | A3: đồng ý |
| 3 | Ngữ cảnh im lặng nằm rải rác (BR-MAS-08, 09) | **Bảng ngữ cảnh hoạt động** chính thức: đang đọc bài, đang nghe audio, đang xem video, đang chờ quét QR, đang tải dữ liệu, **đang thao tác (mới)**, đang gặp lỗi, đang rời màn — mỗi ngữ cảnh ghi Mila làm gì. Luật mới "đang thao tác": câu chủ động P5–P7 bị bỏ (không xếp hàng) trong 2 giây sau một lần chạm, cuộn hay gõ phím | B5: đồng ý |
| 4 | Chưa có quy tắc chạm nhiều lần | Chạm dồn trong 400 ms tính một lần; không chạy lại animation đang chạy; chạm khi đang có câu khác thì câu hướng dẫn thay vào (P3); câu hướng dẫn không tính vào giới hạn câu chủ động. Chạm 5 lần trong 3 giây: Mila **chóng mặt** (lắc lư + "Ui, chóng mặt quá!") một lần mỗi lượt tải trang; tạm dùng ảnh bối rối MA-09. Không có cử chỉ "ngã" | B6: đồng ý; ảnh bối rối tạm thời |
| 5 | Animation AN-* ở Asset spec §5; vòng lặp tối đa 10 s; không có luật chuyển tiếp, ngắt, đồng thời | Bảng animation đầy đủ (giữ ID AN-*): thêm AN-GREET, AN-THINK, AN-SUCCESS, AN-MILESTONE, AN-ERROR, AN-DIZZY, AN-BLINK, AN-AMBIENT; định nghĩa **chuyển tiếp, ngắt, về đứng yên, chỉ một chuyển động trên hình tại một thời điểm** (song song chỉ có bong bóng và lá rơi). Kỹ thuật: ảnh tư thế tĩnh + CSS; sprite cho chào và ăn mừng để sau; không rig vector | C: đồng ý; lá rơi, không sao |
| 6 | Chưa có chớp mắt | **Chớp mắt** bằng ảnh mắt nhắm cho từng tư thế DOCK (MA-20) | C: có làm |
| 7 | Mila trông như ảnh tĩnh: ngoài phản ứng với sự kiện thì đứng yên | **Phương án A**: ở các màn Mila đứng chờ (danh mục, chuyến đi, màn kết quả) Mila tự làm một cử chỉ ngắn ngẫu nhiên mỗi 8–15 giây (nhìn ống nhòm, vẫy, nhún, nghiêng đầu, kéo quai ba lô, thở, chớp mắt), lặp mãi. **Công tắc "Chuyển động"** trên thanh đầu trang (M01 và M02) tạm dừng mọi chuyển động của Mila, Mila vẫn hiện — đáp ứng WCAG 2.2.2 (mức A). Chỉ nhớ trong lần tải trang; thiết bị bật giảm chuyển động thì công tắc bắt đầu ở "tắt". Không có cử chỉ tự động ở trang đọc bài và khi phát media | Phương án A |
| 8 | Vòng lặp (AN-BREATHE, AN-SEARCH, AN-PACK) chạy tới 10 s, không có cách dừng — trái WCAG 2.2.2 | Mọi chuyển động tự chạy đều dừng được bằng công tắc ở mục 7; vòng lặp của một phản ứng (chờ tra mã, tải gói) tối đa 5 s mỗi lượt | Đồng ý rút ≤ 5 s |
| 9 | Cỡ Mila: DOCK 72 px, AVATAR 40 px, INTRO/CELEBRATE 160 px | Hero danh mục **112**, chuyến đi **128**, cạnh huy hiệu màn kết quả **104**, avatar trang nội dung **56**, giới thiệu / ăn mừng **200** px | Theo đề xuất |
| 10 | Bong bóng trắng rộng, trông như hộp thông báo hệ thống | **Kiểu A "Giấy dã ngoại"**: nền giấy, viền xanh rừng mảnh, góc gần Mila nhọn hơn, đuôi rõ, tên "Mila" nhỏ ở đầu, rộng tối đa khoảng 240 px, nút × nhỏ màu nhạt. **Chữ hiện dần** khoảng 30 ký tự/giây; chạm bong bóng hiện hết ngay; giảm chuyển động hoặc công tắc tắt thì hiện ngay. Sửa lỗi hình đồi trang trí lộ sau bong bóng ở hero danh mục | Kiểu A (mockup 2026-11-22) |
| 11 | Ảnh đợt 2 (think, magnifier, point) để sau | **Bắt buộc trước US5/US6**: tư thế chờ tra mã (magnifier) và suy nghĩ (think) dùng trong luồng quét và tải; thiếu thì hiện hình giữ chỗ giữa luồng | Kéo theo C |

**Tạm gác (không thuộc brief này):** nút xác nhận sau lời giới thiệu trên màn chọn ngôn ngữ (nhận xét sau khi thử; chủ dự án "tạm bỏ qua" 2026-11-22). Lời giới thiệu giữ như v1.0.

## 3. Rationale

- Thử trên điện thoại 2026-11-22: Mila nhỏ, bong bóng thiếu chất nhân vật, Mila "trông như ảnh tĩnh". Mục tiêu sản phẩm là trải nghiệm khám phá có tương tác (yêu cầu 2026-11-20).
- Chuyển động tự chạy kéo dài cần cách tạm dừng (WCAG 2.2.2, mức A). Công tắc chỉ dừng chuyển động, không ẩn Mila, nên OD-MAS-03 (không nút ẩn) giữ nguyên.
- Vẫn chỉ frontend, không đụng nghiệp vụ hay dữ liệu; ưu tiên vẫn **Could** (OD-MAS-08).

## 4. Phạm vi file được phép (sau khi duyệt)

### 4.1 Tài liệu

| Đường dẫn | Nội dung |
|---|---|
| `docs/spec/spec-Mascot.md` | v1.1: sửa BR-MAS-11 (công tắc chuyển động là điều khiển riêng, không phải Mila), BR-MAS-12 (chạm theo ngữ cảnh); thêm BR-MAS-20 (ngữ cảnh hoạt động, luật đang thao tác), BR-MAS-21 (chuyển động tự động và công tắc), BR-MAS-22 (chạm nhiều lần), BR-MAS-23 (ba cấp ăn mừng); §5.4 thêm giới hạn (§5 dưới); §5.6 câu mới; US và SC tương ứng; §12 change notes |
| `docs/mascot/MASCOT_BEHAVIOR_MATRIX.md` | Hành vi chạm theo ngữ cảnh, mốc mới, chóng mặt, cử chỉ tự động, câu kết thúc đủ/sớm |
| `docs/mascot/MASCOT_STATE_MACHINE.md` | Bảng ngữ cảnh hoạt động; luật đang thao tác; đồ thị chuyển tiếp animation, ngắt, đồng thời; trạng thái công tắc chuyển động |
| `docs/mascot/MASCOT_ASSET_SPECIFICATION.md` | Bảng animation đầy đủ; MA-20 mắt nhắm cho tư thế DOCK; ảnh đợt 2 bắt buộc; cỡ mới; số đo ngân sách |
| `docs/mascot/MASCOT_DIALOGUE_LIBRARY.md` | Câu mới VI/EN (mục 6 dưới) |
| `docs/mascot/MASCOT_IMAGE_PRODUCTION_GUIDE.md` | Prompt ảnh mắt nhắm; ảnh đợt 2 bắt buộc |
| `docs/mascot/MASCOT_TESTING_CHECKLIST.md`, `MASCOT_TECHNICAL_SPECIFICATION.md`, `MASCOT_IMPLEMENTATION_ROADMAP.md`, `README.md` | Đồng bộ |
| `docs/design/design-system.md` | §4.3 (animation mới, ngoại lệ chuyển động tự động có công tắc), §9.2 cỡ mới, §9.3 bong bóng kiểu A và chữ hiện dần, mục mới công tắc "Chuyển động" |
| `screens/screen-spec/M01/*`, `screens/screen-spec/M02/*` | Phần tử công tắc "Chuyển động" trên thanh đầu trang; cỡ slot; bảng copy câu mới |
| `screens/screen list/screen-list-M01.md`, `screen-list-M02.md` | Coverage |
| `README.md`, `docs/README.md` | Trạng thái gói 005 |

### 4.2 Gói Spec-Kit và code

| Đường dẫn | Nội dung |
|---|---|
| `specs/005-visitor-mascot/**` | Cập nhật spec, plan, research, contracts, tasks (story mới hoặc mở rộng US hiện có), validation report |
| `src/shared/mascot/**` | Luật mới, ngữ cảnh hoạt động, bộ lập lịch cử chỉ tự động, chạm nhiều lần, catalog câu mới |
| `src/app/mascot/**` | Bong bóng kiểu A, chữ hiện dần, animation mới, trạng thái công tắc |
| `src/modules/m01/layout/**`, `src/modules/m02/layout/**` | **Chỉ** thêm công tắc "Chuyển động" vào thanh đầu trang (khi cờ Mila bật) và phát sự kiện thao tác. Không đổi logic, dữ liệu hay câu cố định |
| `src/modules/m01/**`, `src/modules/m02/**` | Chỉ điểm phát sự kiện mới (ví dụ "còn 1 điểm" dùng {k}, {n} có sẵn) và cỡ slot |
| `src/shared/ui/tokens.css` | Token cỡ, bong bóng, thời lượng mới |
| `assets/mascot/**` | Ảnh mắt nhắm và ảnh đợt 2 do chủ dự án cung cấp; agent chỉ cắt, đổi cỡ, nén |
| `assets/icons/` | Icon tạm dừng / chạy cho công tắc (agent vẽ theo design-system §7, quyết định 2026-11-10) |
| `e2e/**` | E2E cho các hành vi mới, bố cục ở cỡ mới, công tắc chuyển động |

## 5. Giới hạn mới (spec-Mascot §5.4, giá trị tạm, chỉnh sau thử thực địa)

| Tên | Giá trị | Dùng cho |
|---|---|---|
| `MASCOT_AMBIENT_MIN_MS` / `MASCOT_AMBIENT_MAX_MS` | 8 000 / 15 000 ms | Khoảng cách giữa hai cử chỉ tự động |
| `MASCOT_LOOP_MAX_MS` | 5 000 ms | Một lượt vòng lặp của phản ứng (chờ tra mã, tải gói) |
| `MASCOT_INTERACTION_GRACE_MS` | 2 000 ms | Luật đang thao tác |
| `MASCOT_TAP_DEBOUNCE_MS` | 400 ms | Chạm dồn |
| `MASCOT_DIZZY_TAPS` / `MASCOT_DIZZY_WINDOW_MS` | 5 / 3 000 ms | Chóng mặt |
| `MASCOT_TYPE_CPS` | 30 ký tự/giây | Chữ hiện dần |

## 6. Câu thoại mới (nháp; thư viện lời thoại chốt câu chữ, mỗi câu ≤ 90 ký tự, không từ chỉ sự có mặt)

| Dùng cho | VI (nháp) |
|---|---|
| Chạm, chuyến đi giữa chặng | Còn {r} điểm nữa. Thấy tem thì bấm Quét QR nhé. |
| Chạm, scanner đang mở | Đưa tem vào giữa khung, giữ máy yên một chút nhé. |
| Chạm, màn kết quả | Cảm ơn bạn đã đi cùng mình hôm nay! |
| Chạm, danh mục (câu thứ hai) | Chưa biết chọn tuyến nào? Bấm "Gợi ý tuyến" nhé. |
| Mốc còn 1 điểm cuối | Chỉ còn một điểm nữa thôi! |
| Kết thúc, quét đủ mọi điểm | Bạn đã quét đủ {n} điểm của tuyến. Tuyệt vời! |
| Kết thúc sớm | Giữ nguyên câu 062 ("Hôm nay mình đã cùng bạn quét {k} điểm. Vui ghê!") |
| Chóng mặt | Ui, chóng mặt quá! |

## 7. Impact dimensions

| Chiều | Tác động |
|---|---|
| Actor/role | Không đổi |
| Lifecycle/status | Không đổi |
| Field/type, DAC | Không đổi; không lưu gì mới — trạng thái công tắc chỉ trong bộ nhớ của lần tải trang (BR-MAS-18 giữ nguyên) |
| Validation rule | Không đổi |
| Cross-module contract | Không đổi; sự kiện mascot mới vẫn là thông báo trong bộ nhớ |
| Screen | SCR-M01-001…004, SCR-M02-001…004: thêm công tắc "Chuyển động" trên thanh đầu trang (chỉ khi cờ Mila bật); slot lớn hơn; bong bóng mới. Câu cố định giữ nguyên |
| Accessibility | Đạt WCAG 2.2.2 nhờ công tắc; công tắc là nút có `aria-pressed`, tên bằng chữ, vùng chạm ≥ 44 px; chữ hiện dần vẫn đọc đủ câu cho trình đọc màn hình (vùng `status` nhận câu đầy đủ một lần) |
| MVP priority | Could |
| Dependency | Không thêm; không Rive/Lottie |
| Hiệu năng | Ảnh mắt nhắm và ảnh đợt 2 làm precache tăng khoảng 80 KB (ước tính; đo khi có ảnh), vẫn trong ngân sách Asset spec |

## 8. Explicit non-goals

- Không nút ẩn, thu nhỏ hay chế độ yên lặng (OD-MAS-03 giữ nguyên); công tắc chỉ dừng chuyển động.
- Không lưu lựa chọn công tắc qua các lần mở app.
- Không điểm số, huy hiệu, phần thưởng, bảng xếp hạng (MVP-Scope §4 giữ nguyên); các mốc chỉ là phản ứng.
- Không cử chỉ "ngã"; không hiệu ứng sao; không âm thanh; không rig vector; không thêm dependency.
- Không nút xác nhận sau lời giới thiệu (tạm gác).
- Không backend; không đổi spec-M01/M02/M03.
- Không commit, push, deploy nếu chủ dự án chưa yêu cầu.

## 9. Thứ tự đề xuất sau khi duyệt

1. Đưa spec-Mascot lên v1.1 theo §2, §5, §6.
2. Đồng bộ bộ thiết kế `docs/mascot/`, design-system, screen spec, screen list.
3. Cập nhật gói Spec-Kit 005 (specify/clarify khi cần → plan → tasks → analyze).
4. Code theo tasks, thứ tự gợi ý:
   1. Bong bóng kiểu A, chữ hiện dần, cỡ mới.
   2. Công tắc "Chuyển động" và cử chỉ tự động.
   3. Chạm theo ngữ cảnh và chạm nhiều lần.
   4. Ba cấp ăn mừng.
   5. Ngữ cảnh hoạt động và luật đang thao tác.
   6. Chớp mắt (khi có ảnh).
5. Chủ dự án tạo ảnh mắt nhắm (khoảng 5 ảnh: map, binoculars, thumbs-up, backpack, rest; cheer đã nhắm mắt) và ảnh đợt 2 (think, magnifier, point).

## 10. Validation gates

- `npm run ci` PASS; `npm run e2e` PASS cho `m01`, `m02`, có và không có cờ Mila.
- Test mới cho mọi BR mới (BR-MAS-20…23) và BR sửa (BR-MAS-11, 12).
- Bố cục ở 320–430 px với cỡ mới: không đè, không cuộn ngang.
- Công tắc: tắt thì không còn animation nào chạy (kiểm bằng `getAnimations`), Mila vẫn hiện.
- Giảm chuyển động: công tắc bắt đầu ở "tắt", chữ hiện ngay, không lá rơi.
- Đo precache sau khi có ảnh mới.
- Kiểm trên điện thoại thật với chủ dự án (như lần thử 2026-11-22).

## 11. Open questions

Không còn câu hỏi nghiệp vụ chặn. Chờ, không chặn tài liệu: chủ dự án tạo ảnh mắt nhắm và ảnh đợt 2; câu chữ cuối của §6 chốt ở thư viện lời thoại.

## 12. Khi duyệt

Người duyệt điền "Người duyệt", "Ngày duyệt" và đổi trạng thái thành **APPROVED**. Sau đó agent thực hiện bước 1–3 của §9.

## 13. Tiến độ

| Ngày | Việc | Kết quả |
|---|---|---|
| 2026-11-22 | Duyệt brief | APPROVED |
| 2026-11-22 | Bước 1 §9: spec-Mascot v1.0 → v1.1 (BR-MAS-11, 12, 17 sửa; BR-MAS-20…23; US-MAS-09; FR-MAS-011, 012; SC-MAS-011…014; §5.4; §5.6 câu 012, 033, 043, 058, 063, 065, 085; OD-MAS-17, 18) | Xong |
| 2026-11-22 | Bước 2 §9: Behavior Matrix (§3a, MAS-B-036, 037, 064–066, 085–089; sửa 009, 032, 050, 051, 055, 062), State Machine (§2 cỡ, §6.5–6.7), Asset spec (animation, §6.1 luật, MA-20, đợt 2), Dialogue Library (§3.4a, nhãn công tắc), Image Production Guide (§8 đợt 2, 3), Testing Checklist (§10), Technical spec, Roadmap (G8b), README; design-system (§4.3, §9.2, §9.3, §9.5 mới); screen spec SCR-M01-001…004, SCR-M02-001…004 (phần tử công tắc, bảng copy); screen list M01/M02; function-list-Mascot (SF-MAS-001-08…10, 003-09, 005-06 — tài liệu dẫn xuất từ spec, cùng loại với v1.0 dù §4.1 không liệt kê); README.md, docs/README.md | Xong |
| — | Bước 3 §9: gói Spec-Kit 005 (spec, plan, tasks…) | Chưa bắt đầu |
