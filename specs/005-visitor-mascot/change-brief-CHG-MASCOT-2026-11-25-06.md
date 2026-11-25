# Change Brief CHG-MASCOT-2026-11-25-06 — Sửa lỗi sau khi thử bản chính thức: câu chạm theo màn, Mila mỗi lần vào màn, đầu màn danh mục, kết thúc chuyến

| Trường | Nội dung |
|---|---|
| Change ID | CHG-MASCOT-2026-11-25-06 |
| Trạng thái | **APPROVED** (2026-11-25). Được sửa spec-Mascot lên v1.6, spec-M02 lên v3.4, đồng bộ tài liệu dẫn xuất và code frontend theo §3 |
| Người duyệt | Chủ dự án (chat 2026-11-25: chọn phương án C cho đầu màn danh mục, duyệt nguyên văn các câu mới, câu hỏi kết thúc chuyến hiện khi về màn chuyến đi, cho phép kết thúc chuyến bất cứ lúc nào có xác nhận, kết thúc trước điểm cuối ghi `BO_DO`). *Chủ dự án điền tên tài khoản nếu cần* |
| Ngày duyệt | 2026-11-25 |
| Loại thay đổi (runbook §4) | Behavioral change của [spec-Mascot](../../docs/spec/spec-Mascot.md) (v1.5 → v1.6) và [spec-M02](../../docs/spec/spec-M02.md) (v3.3 clarification 4 → v3.4), cộng sửa hình thức ở design-system §4.3, §5.4, §9.2, §9.3a. Chỉ frontend. Không đổi spec-M01, spec-M03, contract, entity hay dữ liệu |
| Liên quan | [CHG-MASCOT-2026-11-24-05](change-brief-CHG-MASCOT-2026-11-24-05.md); [CHG-MOTION-2026-11-24-01](../006-visitor-motion/change-brief-CHG-MOTION-2026-11-24-01.md) (lá trôi ở hero) |

## 1. Source

Sau khi #80–#82 lên Production (2026-11-24), chủ dự án thử bản chính thức và báo các lỗi (chat 2026-11-25, 6 ảnh):

| # | Màn | Lỗi | Nguyên nhân |
|---|---|---|---|
| 1 | SCR-M01-002 | Chạm Mila ra câu của Danh mục tuyến | BR-MAS-12 v1.5: mọi màn M01 dùng chung MSG-MAS-009/012 (`helpLines` trong `rules.ts`) |
| 2 | SCR-M01-002 | Mila chỉ chào lần đầu | Câu 011 của trang kết quả (P4) được mang sang form khi bấm "Đổi tiêu chí" trong 1,5 s rồi chặn câu 010 (luật mang câu sang màn mới áp cho mọi câu P4, không riêng lời xác nhận lượt quét) |
| 3 | SCR-M01-001 | Đầu màn khác nhau giữa VI/EN: VI Mila nhỏ, EN các phần tử to và chồng nhau | Cột Mila là phần còn lại sau tiêu đề (`max-content minmax(0, 1fr)`), nên cỡ Mila phụ thuộc độ dài tiêu đề |
| 4 | SCR-M01-001 | Lá rơi chỉ chạy một lần khoảng 3–5 s | design-system §4.3.1 T3 v1.4: lá trôi dừng sau ≤ 5 s |
| 5 | SCR-M01-003 | Chạm Mila ra câu Danh mục, bong bóng hiện trong ô Gói tải trước | Như #1; câu chạm không chỉ định slot nên vào slot đăng ký sau cùng (`package-panel`) |
| 6 | SCR-M01-003 | Mila chỉ nhắc Cảnh báo an toàn lần đầu | MAS-B-014 "một lần mỗi tuyến trong lần tải trang" |
| 7 | SCR-M02-002 | Mila và lá cây như chỉ kéo dài khoảng 5 s; Mila chỉ nhún một lần | Bong bóng vẫn ở 15 s nhưng animation ăn mừng và lá rơi chạy một lần (≈ 1,2 s) |
| 8 | SCR-M02-002 | Bỏ hộp thoại "Bạn đã quét điểm cuối…" ở màn này | spec-M02 BR-M02-021: hỏi ngay ở trang nội dung |
| 9 | SCR-M02-001 | Hộp thoại kết thúc chuyến trong suốt, đè lên hành trình, có hai Mila | Hộp thoại dùng `--m02-surface` (kính mờ 62% trên bề mặt scanner); hình Mila trong hộp thoại cộng Mila DOCK trên nút Quét |
| 10 | SCR-M02-001 | Câu hỏi kết thúc nên khác nhau khi đã/chưa quét hết điểm; nhận xét logic chỉ cho kết thúc sau điểm cuối | FR-M02-015: Finish chỉ có sau điểm cuối; một câu hỏi duy nhất |

## 2. Quyết định (chat 2026-11-25)

| # | Quyết định |
|---|---|
| D1 | Chỉ lời xác nhận lượt quét (`role="status"`, BR-MAS-24) được mang sang màn mới; Mila chào ở form Gợi ý tuyến mỗi lần mở, dù vào bằng đường nào (BR-MAS-20, US-MAS-07.2) |
| D2 | Câu chạm theo từng màn M01 (BR-MAS-12; duyệt nguyên văn VI; EN theo nhãn nút thật): form 010 → **015** "Chọn đủ ba mục rồi bấm Xem tuyến phù hợp nhé."; kết quả **016** "Chạm vào một tuyến để xem chi tiết, hoặc bấm Đổi tiêu chí."; chi tiết tuyến có cảnh báo **017** "Đọc kỹ Cảnh báo an toàn, tải gói nếu cần, rồi bấm Bắt đầu nhé.", không có cảnh báo **019** "Tải gói nếu cần, rồi bấm Bắt đầu nhé." (rút từ 017 cho tuyến không có cảnh báo); Tài nguyên **018** "Tải gói trước khi vào rừng để xem tuyến khi mất sóng." Chi tiết tuyến: câu ở slot panel Bắt đầu; Tài nguyên: slot ô gói |
| D3 | MSG-MAS-014 mỗi lần panel Bắt đầu của tuyến có cảnh báo vào khung nhìn; không cooldown, không tính giới hạn câu chủ động (BR-MAS-07, US-MAS-07.3) |
| D4 | Đầu màn danh mục **phương án C** (bốn phương án A–D, VI/EN cạnh nhau): tiêu đề một hàng; hàng dưới nút "Gợi ý tuyến" bên trái, Mila trên đồi trong cột bề rộng cố định bên phải; Mila 96 px (màn < 360 px: 88 px). Tia nắng và lá trôi lặp liên tục khi trang trí bật; dừng bằng công tắc "Hiệu ứng chuyển động" (WCAG 2.2.2) |
| D5 | Trang nội dung: Mila ở lại suốt thời gian đọc của bong bóng (15 s); nhún (cấp 1) hoặc nhảy hai lần (cấp 2) lặp mỗi 2,4 s, lá rơi liên tục cho tới khi Mila rời màn (US-MAS-02.6) |
| D6 | Điểm cuối được xác nhận như mọi điểm (toast hoặc bong bóng của Mila, BR-MAS-24) |
| D7 | Nút "Kết thúc chuyến" có **mọi lúc** trong chuyến, qua hộp thoại xác nhận: quét đủ "Bạn đã quét mã ở tất cả {n} điểm. Kết thúc chuyến đi?"; còn thiếu "Bạn còn {r} điểm chưa quét mã. Vẫn kết thúc chuyến đi?" (dùng "quét mã", không "đi hết", theo SC-M02-013). EN "You've scanned all {n} checkpoints. End your trip?" / "{r} checkpoints not scanned yet. End your trip anyway?" |
| D8 | Câu hỏi kết thúc chuyến sau lượt quét điểm cuối đầu tiên hiện **một lần khi du khách về màn chuyến đi** (phương án a), không ở trang nội dung (BR-M02-021) |
| D9 | Xác nhận kết thúc khi **chưa** quét điểm cuối → `BO_DO`; đã quét điểm cuối → `HOAN_TAT` như cũ (BR-M02-007, FR-M02-016). Nghĩa "Hoàn thành" trong báo cáo M03 giữ nguyên; không đổi M03 |
| D10 | Hộp thoại kết thúc chuyến: bảng nền trắng đặc ở đáy màn, lớp phủ tối `--overlay-scrim` (token mới), gắn vào `<body>`; Mila chỉ trong đầu hộp thoại (`cheer` khi quét đủ, `think` khi còn thiếu), Mila đứng trên nút Quét tạm ẩn — một Mila trên màn |

## 3. Phạm vi file được phép

| Đường dẫn | Nội dung |
|---|---|
| `docs/spec/spec-Mascot.md` | v1.6: US-MAS-02.4, 02.6, 07.2, 07.3; §5.1; BR-MAS-07, 12, 20, 24; §5.2; §5.6 (015–019); SC-MAS-005, 015; §8; OD-MAS-29…33; change notes |
| `docs/spec/spec-M02.md` | v3.4: §1, US-M02-05 (1, 2, 4), flow §4.1, FR-M02-015, 016, 023, §5.1 câu hỏi kết thúc, BR-M02-007, 021, sơ đồ trạng thái, §7, SC-M02-015, §10, change notes |
| `docs/design/design-system.md` | §4.3.1 (T3 lặp), §5.4 (`--overlay-scrim`, hộp thoại đáy màn), §9.2 (`--mascot-size-dock-catalog` 96 px), §9.3a (phương án C) |
| `docs/mascot/MASCOT_BEHAVIOR_MATRIX.md`, `MASCOT_DIALOGUE_LIBRARY.md` | MAS-B-014, 050, 055, 060; MAS-B-090 mới; MAS-MSG-010, 014, 015…019 |
| `screens/screen-spec/M01/SCR-M01-001…004`, `screens/screen-spec/M02/SCR-M02-001, 003, 004` | Bảng copy, phần tử, trạng thái |
| `specs/005-visitor-mascot/**` | Brief này, tasks Phase 20, validation report §20 |
| `src/shared/mascot/**`, `src/app/mascot/**`, `src/shared/ui/tokens.css` | Câu, luật, mang câu sang màn, CSS lặp ở AVATAR, token |
| `src/modules/m01/catalog/**` | Bố cục đầu màn và lá trôi |
| `src/modules/m02/{end,content,session,storage,i18n,qr-link}/**` | Hộp thoại, tín hiệu câu hỏi chờ, Finish mọi lúc, `finishSession` → `BO_DO`, chữ |
| `e2e/**` | Test liên quan |

## 4. Impact dimensions

| Chiều | Tác động |
|---|---|
| Actor, field, DAC, contract, report | Không đổi. `BO_DO` đã có trong SessionSyncRecord và báo cáo M03; nghĩa "Hoàn thành" giữ nguyên |
| Lifecycle | PlaySession thêm đường `DANG_DIEN_RA → BO_DO` khi du khách xác nhận kết thúc trước điểm cuối (cùng transaction và mục hàng đợi như Finish) |
| Screen | SCR-M01-001 đầu màn; SCR-M01-002/003/004 câu chạm; SCR-M02-001 Finish mọi lúc, hộp thoại mới; SCR-M02-002/004 không còn hộp thoại, điểm cuối có lời xác nhận |
| Câu chữ | Mila: + MSG-MAS-015…019. M02: hai câu hỏi kết thúc thay "Bạn đã quét điểm cuối. Kết thúc chuyến đi?" |
| Truy cập | Hộp thoại `alertdialog` giữ focus ở [Kết thúc], Esc = [Đi tiếp]; lá trôi lặp và Mila lặp có công tắc dừng (WCAG 2.2.2) |
| Hiệu năng | Lặp bằng CSS animation `transform`/`opacity`, không timer JS |
| Dependency, backend, dữ liệu | Không |

## 5. Non-goals

- Không đổi M03, báo cáo hay contract đồng bộ.
- Không thêm nút "Dừng chuyến đi" riêng: Finish là hành động đó.
- Không đổi DV-06 (ảnh khung 2 chờ vẽ lại), DV-07.
- Không commit, push nếu người dùng chưa yêu cầu.

## 6. Validation gates

- `npm run ci` PASS; `npx playwright test --project=m01 --project=m02 --project=m02-cam-evil` PASS.
- Test thay đổi có chủ đích ghi trong validation report §20.
- Chụp kiểm ở 320/390 px: đầu màn danh mục VI/EN cùng chỗ; trang nội dung sau 9,5 s Mila vẫn lặp và có lá; hộp thoại kết thúc chuyến nền đặc, một Mila.

## 7. Tiến độ

| Ngày | Việc | Kết quả |
|---|---|---|
| 2026-11-25 | Chủ dự án báo lỗi; xem 4 mockup đầu màn; chốt D1–D10 | Xong |
| 2026-11-25 | spec-Mascot v1.6, spec-M02 v3.4, tài liệu dẫn xuất, code, test (tasks T116–T122; validation report §20) | Xong |
