# Change Brief CHG-MASCOT-2026-11-27-08 — Màn quét có VI/EN, khung quét, màn lỗi camera có hướng dẫn, nút Kết thúc chính khi quét đủ, gợi ý khách tự do lên đầu trang

| Trường | Nội dung |
|---|---|
| Change ID | CHG-MASCOT-2026-11-27-08 |
| Trạng thái | **APPROVED** (2026-11-27). Được sửa spec-Mascot lên v1.8, đồng bộ tài liệu dẫn xuất và code frontend theo §3 |
| Người duyệt | Chủ dự án (chat 2026-11-27: duyệt phương án cho M02-15, 16, 17, 18, 25, 37; đèn pin để sau; màn lỗi camera chỉ giữ icon, bỏ Mila; hướng dẫn bật camera tách iPhone / Android). *Chủ dự án điền tên tài khoản nếu cần* |
| Ngày duyệt | 2026-11-27 |
| Loại thay đổi (runbook §4) | Behavioral change nhỏ của [spec-Mascot](../../docs/spec/spec-Mascot.md) (v1.7 → v1.8: Mila không xuất hiện ở màn lỗi camera), cộng sửa hình thức ở screen spec SCR-M02-001, 002, 004 và design-system. Chỉ frontend. Không đổi spec-M01, spec-M02, spec-M03, contract, entity hay dữ liệu |
| Liên quan | [CHG-MASCOT-2026-11-27-07](change-brief-CHG-MASCOT-2026-11-27-07.md) (thẻ tuyến, điểm tiếp theo — PR #86) |

## 1. Source

Bảng test của tester (chat 2026-11-27, kèm 2 mockup):

| Dòng | Lỗi / góp ý | Nguyên nhân |
|---|---|---|
| M02-15 | Quét đủ điểm thì việc chính là kết thúc, nhưng "Kết thúc chuyến" là nút phụ dưới "Quét QR"; pop-up hỏi kết thúc ở màn nội dung điểm cuối | Bố cục nút cố định. Pop-up ở màn nội dung đã bỏ từ spec-M02 v3.4 (PR #83); dòng test còn ghi theo v3.3 |
| M02-16 (BUG-020) | Màn quét không có VI/EN, phải đóng camera mới đổi được | Scanner là lớp phủ toàn màn (`position: fixed`) che thanh đầu trang |
| M02-17 | Màn lỗi camera trống: không icon, không chỉ cách bật lại quyền; "Thử lại" và "Đóng camera" cùng kiểu; tiêu đề khác font "Chuyến đi" | E-SCR-M02-001-11 yêu cầu "giải thích… cách thử lại" nhưng chỉ có câu cố định |
| M02-18 | Không ghi lỗi; cột hiệu ứng mong đợi: icon lá xoay khi đang kiểm tra mã | Chỉ có dòng chữ |
| M02-25, M02-37 (BUG-015) | Câu "Bạn đang xem tự do…" nằm cuối trang, sau toàn bộ bài giới thiệu | Cố ý đặt sau bài viết theo mockup SCR-M02-004 cũ |

## 2. Quyết định (chat 2026-11-27)

| # | Quyết định |
|---|---|
| D1 | Quét đủ mọi điểm (k = n): khối dưới cùng thành thẻ "Bạn đã quét đủ {n}/{n} điểm!" với **"Kết thúc chuyến" là nút chính** và "Quét QR" là nút phụ. Thẻ trượt lên 250 ms khi điểm vừa quét làm đủ (T1); giảm chuyển động: mờ dần. FR-M02-015 không đổi (Finish vẫn có mọi lúc) |
| D2 | Màn quét có nút VI/EN của M01 ở hàng tiêu đề; tiêu đề serif như "Chuyến đi" |
| D3 | Khi có chuyến và còn điểm chưa quét: nhãn "Đang tìm điểm {i} · {tên}" (điểm tiếp theo của CHG-…-07) trên khung quét. Chỉ là gợi ý |
| D4 | Khung quét bốn góc amber và vạch quét xanh chạy lên xuống (`--duration-scanner-frame`, lặp); giảm chuyển động: vạch đứng giữa khung |
| D5 | **Đèn pin: để sau** (chưa có trong spec; Safari iPhone không hỗ trợ) |
| D6 | Màn lỗi camera: icon camera gạch chéo (`camera-off.svg`, agent vẽ) lắc một lần; khung "Cách bật camera" ba bước, **tách iPhone / iPad (Safari) và máy khác (Chrome)**; "Thử lại" là nút chính amber, "Đóng camera" nút viền. Câu cố định của spec-M02 §5.1 giữ nguyên |
| D7 | **Màn lỗi camera không có Mila** (spec-Mascot v1.8 §5.1; MAS-B-038 chỉ còn hủy hẹn giờ của scanner) — một hình minh họa, có cả khi Mila tắt |
| D8 | Đang kiểm tra mã: icon lá xoay cạnh dòng "Đang kiểm tra mã QR…"; giảm chuyển động: đứng yên |
| D9 | Gợi ý khách tự do lên **vùng thông báo đầu trang** (dưới thanh app, trước ảnh và bài viết), SCR-M02-002 và SCR-M02-004; câu cố định giữ nguyên |

## 3. Phạm vi file được phép

| Đường dẫn | Nội dung |
|---|---|
| `docs/spec/spec-Mascot.md` | v1.8: §5.1 (không Mila ở màn lỗi camera), §11, change notes |
| `docs/design/design-system.md` | §5 scanner, thẻ quét đủ, gợi ý khách tự do, §7 icon `camera-off.svg` |
| `docs/mascot/MASCOT_BEHAVIOR_MATRIX.md`, `MASCOT_TESTING_CHECKLIST.md` | MAS-B-038 |
| `screens/screen-spec/M02/screen-spec-SCR-M02-001.md`, `-002.md`, `-004.md`, `-005.md` | Phần tử, bảng copy, vị trí gợi ý khách tự do; SCR-M02-005 dùng chung trình quét |
| `assets/icons/camera-off.svg` | Icon mới (design-system §7) |
| `specs/005-visitor-mascot/**` | Brief này, tasks Phase 22, validation report §22 |
| `src/modules/m02/{scanner,session,content,qr-link,i18n,testing}/**`, test M02 dựng route lazy | Code và test; nạp sẵn màn lazy trong test (DV-100) |
| `e2e/**` | Test liên quan |

## 4. Impact dimensions

| Chiều | Tác động |
|---|---|
| Actor, field, DAC, contract, report | Không đổi |
| Lifecycle | Không đổi |
| Screen | SCR-M02-001 (scanner, lỗi camera, đang kiểm tra, khối dưới khi quét đủ), SCR-M02-002/004 (vị trí gợi ý khách tự do), SCR-M02-005 dùng chung scanner nên cũng có VI/EN và màn lỗi mới |
| Câu chữ | Mới: "Bạn đã quét đủ {n}/{n} điểm!", "Đang tìm điểm {i} · {tên}", "Cách bật camera" và hai bộ ba bước |
| Truy cập | VI/EN trong hộp thoại scanner vẫn trong vòng focus; các bước là danh sách có thứ tự; animation tôn trọng giảm chuyển động |
| Dependency, backend, dữ liệu | Không |

## 5. Non-goals

- Không làm đèn pin (D5).
- Không đổi điều kiện hay câu của hộp thoại kết thúc chuyến (BR-M02-021).
- Không sửa mockup HTML tĩnh (ghi nhận stale).

## 6. Validation gates

- `npm run ci` PASS; `npx playwright test --project=m02 --project=m02-cam-evil` PASS.
- Chụp kiểm ở 390 px: scanner có chuyến, lỗi camera VI/EN, quét đủ, trang mã QR khách tự do.

## 7. Tiến độ

| Ngày | Việc | Kết quả |
|---|---|---|
| 2026-11-27 | Phân tích bảng test, chủ dự án chốt D5–D7 | Xong |
| 2026-11-27 | Tài liệu, code, test (tasks T128–T132; validation report §22) | Xong |
