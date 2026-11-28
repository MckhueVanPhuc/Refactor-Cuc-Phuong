# Change Brief CHG-MASCOT-2026-11-28-10 — Thiết kế lại màn Kết thúc chuyến (SCR-M02-003)

| Trường | Nội dung |
|---|---|
| Change ID | CHG-MASCOT-2026-11-28-10 |
| Trạng thái | **APPROVED** (2026-11-28). Được sửa spec-M02 lên v3.6, spec-Mascot lên v1.10, đồng bộ tài liệu dẫn xuất và code frontend theo §3 |
| Người duyệt | Chủ dự án (chat 2026-11-28: duyệt bản mô phỏng HTML ba trạng thái; "Ok bắt đầu làm"). *Chủ dự án điền tên tài khoản nếu cần* |
| Ngày duyệt | 2026-11-28 |
| Loại thay đổi (runbook §4) | Behavioral change nhỏ của [spec-M02](../../docs/spec/spec-M02.md) (v3.5 → v3.6: màn kết quả đọc tên tuyến và ảnh đầu tiên của từng điểm từ gói sẵn sàng để hiển thị; danh sách gồm mọi điểm; thêm lối sang Gợi ý tuyến; SC-M02-013 ghi chữ đã duyệt) và [spec-Mascot](../../docs/spec/spec-Mascot.md) (v1.9 → v1.10: Mila ở ảnh bìa, câu ăn mừng MSG-MAS-065, bỏ MSG-MAS-062/063). Chỉ frontend. Không đổi entity, contract, state, rule đồng bộ, spec-M01 hay spec-M03 |
| Liên quan | [CHG-MASCOT-2026-11-24-05](change-brief-CHG-MASCOT-2026-11-24-05.md) (phương án E, OD-MAS-27), [specs/006 US7](../006-visitor-motion/spec.md) |

## 1. Source

Bảng test M02-43, M02-44, M02-48 (chat 2026-11-28, ảnh "HIỆN TẠI" và ba ảnh "MONG ĐỢI"):

| Dòng | Lỗi / góp ý | Nguyên nhân |
|---|---|---|
| M02-43 | Mila và dấu ✓ đặt cạnh nhau rời rạc | Huy hiệu đứng giữa đầu màn, Mila ở thẻ "Hẹn gặp lại" phía dưới; lúc ăn mừng Mila to ra nhô lên trên mép thẻ |
| M02-43 | Chữ trắng trên ảnh rừng sáng khó đọc | Chữ đặt thẳng trên ảnh, chỉ có `text-shadow` |
| M02-43 | 3 câu cảm ơn / chúc lặp ý | Tiêu đề, lời cảm ơn, lời chúc, lời hẹn gặp lại cùng hiện; bong bóng Mila là câu thứ năm |
| M02-43 | Danh sách điểm bị đẩy xuống, phải cuộn | Huy hiệu, ba câu và thẻ hẹn gặp lại ở trên danh sách |
| M02-43 | "Khám phá tuyến khác" và "Về danh sách tuyến" cùng dẫn về một chỗ | Chỉ có một lối ra |
| M02-44 | Nhãn gửi chen vào phần đầu | Nhãn nằm ở đầu thẻ danh sách |
| M02-48 | "Huy hiệu" theo hướng không làm game | Huy hiệu là dấu ✓ hoàn thành + Mila reo mừng, không phải huy chương |

## 2. Quyết định

| # | Quyết định |
|---|---|
| D1 | Ảnh bìa nền xanh đậm phủ ảnh rừng; chip "Hoàn thành hành trình" khi k = n, ngược lại "Đã kết thúc chuyến đi" (theo số điểm, không theo `HOAN_TAT`/`BO_DO`, vì `HOAN_TAT` không đòi quét đủ) |
| D2 | Một tiêu đề **"Cảm ơn bạn đã đồng hành cùng Cúc Phương."** (chủ dự án rút gọn 2026-11-28; serif, tối đa hai dòng ở 360 px) và phụ đề "Hẹn gặp lại bạn trong những hành trình tiếp theo."; bỏ "Chuyến đi đã kết thúc!", lời cảm ơn cũ, lời chúc, thẻ "Hẹn gặp lại" và huy hiệu đứng riêng |
| D3 | Thẻ tóm tắt: vòng tiến độ (✓ khi đủ, "k/n" màu vàng khi thiếu), "Bạn đã đi hết tuyến" / "Tuyến của bạn", tên tuyến (chỉ khi có gói sẵn sàng của tuyến), "k/n điểm dừng đã tham quan" |
| D4 | "Hành trình của bạn": mọi điểm theo thứ tự, ảnh nhỏ (ảnh đầu tiên của một mã QR bất kỳ trong điểm dừng đó: lấy từ gói sẵn sàng trước, chưa có thì lấy qua live lookup các mã QR của điểm dừng; không có → ô biểu tượng), điểm chưa quét "Chưa ghé · lần sau nhé!" và ảnh xám. Chủ dự án giữ chữ "Chưa ghé" như mẫu (2026-11-28); ghi vào SC-M02-013 cùng "Bạn đã đi hết tuyến" |
| D5 | Nhãn gửi nhỏ ngay dưới danh sách: "Đang chờ gửi về hệ thống" (vàng, chấm nhấp nháy) → "Đã gửi về hệ thống" (xanh, ✓, 200 ms) |
| D6 | Nút chính "Gợi ý tuyến tiếp theo" mở SCR-M01-002 (`/recommend`); link phụ "Về danh sách tuyến" |
| D7 | Mila ở ảnh bìa, bên phải; ăn mừng nói **MSG-MAS-065** "Cảm ơn bạn đã đi cùng mình hôm nay!" hiện cùng lúc (chủ dự án 2026-11-28), dù quét đủ hay không; MSG-MAS-062/063 nghỉ, ID không dùng lại |
| D8 | `CONFLICT`: Mila đứng yên ở ảnh bìa, không bong bóng; banner lỗi chỉ có chữ, ở chỗ nhãn gửi; không nút thử lại (BR-M02-011) |
| D9 | Chuyển động (specs/006 US7, R-12 giữ nguyên điều kiện và giới hạn ≤ 2,4 s): chip trượt xuống → tiêu đề hiện dần → Mila bật lên 0.6 → 1.1 → 1 → vòng chạy đầy rồi ✓ → các điểm hiện cách 80 ms. Không đo/hiện thời gian đi, không huy chương hay điểm thưởng |

## 3. Phạm vi file được phép

| Đường dẫn | Nội dung |
|---|---|
| `docs/spec/spec-M02.md` | v3.6: §5.1 "Content inputs", §7, §8 SC-M02-013, §11, change notes |
| `docs/spec/spec-Mascot.md` | v1.10: US-MAS-08, §5.1, BR-MAS-23, §5.6, §8, OD-MAS-34, change notes |
| `docs/design/design-system.md`, `src/shared/ui/tokens.css` | §5.1 M02, `--mascot-size-dock-end` |
| `docs/mascot/MASCOT_BEHAVIOR_MATRIX.md` | MAS-B-062…065, 072 |
| `screens/screen-spec/M02/screen-spec-SCR-M02-003.md` | Phần tử, bảng copy, tương tác, chuyển động |
| `specs/005-visitor-mascot/**` | Brief này, tasks Phase 24, validation report §24 |
| `src/modules/m02/{end,session,i18n}/**`, `src/shared/mascot/**`, `src/app/mascot/**` | Code và test |
| `e2e/**` | Test liên quan |

## 4. Impact dimensions

| Chiều | Tác động |
|---|---|
| Actor, field, DAC, contract, report | Không đổi. Tên tuyến và ảnh chỉ để hiển thị, không chép vào `PlaySession`, `CheckpointVisit`, `SessionSyncRecord` |
| Lifecycle, sync | Không đổi |
| Screen | SCR-M02-003 bố cục mới; lối mới sang SCR-M01-002 |
| Câu chữ | Bảng copy SCR-M02-003 v3.6; MSG-MAS-065 dùng cho ăn mừng |
| Truy cập | Tiêu đề `h1`, danh sách `ol`, trạng thái điểm bằng chữ (không chỉ màu), vòng tiến độ có `role="img"` và nhãn chữ, nhãn gửi `role="status"`, banner `role="alert"`; giảm chuyển động hiện thẳng |
| Dependency, backend, dữ liệu | Không |

## 5. Non-goals

- Không đo hay hiện thời gian đi.
- Không huy chương, điểm thưởng (MVP-Scope §4 giữ Won't).
- Không đổi điều kiện ăn mừng (chỉ khi vừa bấm Kết thúc và phiên `HOAN_TAT`).

## 6. Validation gates

- `npm run ci` PASS; e2e M02 liên quan màn kết quả PASS.
- Chụp 360 px: đủ điểm, thiếu điểm chờ gửi, `CONFLICT`; VI và EN.

## 7. Tiến độ

| Ngày | Việc | Kết quả |
|---|---|---|
| 2026-11-28 | Phân tích, bản mô phỏng HTML, chủ dự án duyệt | Xong |
| 2026-11-28 | Tài liệu, code, test (tasks Phase 24; validation report §24) | Xong |
