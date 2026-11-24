# Change Brief CHG-MASCOT-2026-11-24-05 — Mila động nhiều hơn, lời thoại ở lâu hơn, Mila đứng ở Gợi ý tuyến, ô trống không chiếm chỗ

| Trường | Nội dung |
|---|---|
| Change ID | CHG-MASCOT-2026-11-24-05 |
| Trạng thái | **APPROVED** (2026-11-24). Được sửa spec-Mascot lên v1.5, đồng bộ tài liệu dẫn xuất và code frontend theo §4 |
| Người duyệt | Chủ dự án (chọn phương án đề xuất ở cả bốn câu hỏi trong chat 2026-11-24, sau khi xem bản build trên laptop). *Chủ dự án điền tên tài khoản nếu cần* |
| Ngày duyệt | 2026-11-24 |
| Loại thay đổi (runbook §4) | Behavioral change của [spec-Mascot](../../docs/spec/spec-Mascot.md) (v1.4 → v1.5) cộng sửa hình thức ở design-system §9. Chỉ frontend. Không đổi spec-M01, spec-M02, spec-M03, contract, entity hay dữ liệu |
| Liên quan | spec-Mascot v1.4 BR-MAS-06, 07, 21; US-MAS-07, 09; §5.1; §5.4; [CHG-MOTION-2026-11-24-01](../006-visitor-motion/change-brief-CHG-MOTION-2026-11-24-01.md) (gói 006 dựa trên bản này) |

## 1. Source

Chủ dự án xem bản build (Mila bật, stack local) trên laptop ngày 2026-11-24 và báo bốn lỗi, kèm ảnh màn SCR-M01-002:

1. Mila ít động: cử chỉ cách nhau 8–15 giây, mỗi cử chỉ chỉ nhún hay rung một lần rồi về tư thế gốc.
2. Lời thoại tự đóng sau 3–5 giây, du khách chưa kịp đọc.
3. Ở Gợi ý tuyến, Mila hiện vài giây rồi biến mất, không quay lại ở các lần vào sau.
4. Khi Mila biến mất, chỗ của Mila để lại khoảng trống.

Nguyên nhân (đối chiếu code `main` 7c29104):

| # | Nguồn trong spec | Code |
|---|---|---|
| 1 | BR-MAS-21: `MASCOT_AMBIENT_MIN_MS`/`MAX_MS` 8 000/15 000; cử chỉ ≤ 1,5 s | `src/shared/mascot/config.ts`; animation một nhịp trong `Mascot.module.css` |
| 2 | §5.4 "Bubble reading time": 3–7 s | `readingTimeMs` trong `arbiter.ts` |
| 3 | §5.1 SCR-M01-002 Heading `AVATAR` (hiện một phản ứng rồi rời đi); MSG-MAS-010 một lần mỗi lần tải trang (Behavior Matrix MAS-B-010) | `rules.ts` MAS-B-010 `once: 'RECOMMEND_HINT'` |
| 4 | — (hình thức) | Ô AVATAR luôn giữ `min-height: --mascot-size-sm` (`MascotSlot.module.css`), kể cả khi trống |

## 2. Quyết định (chat 2026-11-24, phương án đề xuất)

| # | Quyết định |
|---|---|
| D1 | Cử chỉ tự động mỗi **4–7 giây**; mỗi cử chỉ lặp 2–3 nhịp, dài tối đa **3 giây**; giữa hai cử chỉ Mila thở nhẹ liên tục khi đứng ở DOCK không có bong bóng. Công tắc chuyển động, giảm chuyển động và trang ẩn vẫn dừng tất cả (BR-MAS-17, 21) |
| D2 | Mọi bong bóng tự đóng ở **mọi màn** ở lại **15 giây** sau khi chữ hiện đủ; nút × đóng sớm; đổi màn thì đóng. Câu có nút hành động và câu của lớp phủ giới thiệu giữ cách cũ (chờ du khách). Chấp nhận hệ quả: trong lúc một bong bóng đang hiện, câu P5–P7 đến cùng lúc bị bỏ (BR-MAS-05 không đổi); ở danh mục, danh sách tuyến bị đẩy xuống lâu hơn |
| D3 | SCR-M01-002: Mila **đứng cố định** (DOCK) cạnh tiêu đề, như ở danh mục; **mỗi lần** mở form Gợi ý tuyến đều nói MSG-MAS-010 (không cooldown, không tính vào giới hạn câu chủ động); × chỉ đóng bong bóng, Mila ở lại; Mila có cử chỉ tự động như các màn đứng chờ. Trang kết quả: Mila DOCK cạnh tiêu đề khi có kết quả (MSG-MAS-011); không có kết quả thì chỉ có hình INLINE cạnh câu cố định như hiện nay (một Mila trên màn, OD-MAS-22) |
| D4 | Ô của Mila **không chiếm chỗ khi trống** ở mọi màn (đầu panel Bắt đầu, dải dưới khung quét, cạnh toast trang nội dung, đầu màn Gợi ý tuyến khi không có Mila); khi Mila xuất hiện, nội dung bên dưới dời xuống (Mila vào bằng animation sẵn có); Mila vẫn không bao giờ đè nội dung (SC-MAS-002) |

### 2.1 Bổ sung cùng ngày (chủ dự án chọn sau khi xem mockup, 2026-11-24)

| # | Quyết định |
|---|---|
| D5 | SCR-M01-002: đầu màn "tấm biển kính" (phương án C trong 5 phương án A–E): tiêu đề trên tấm kính mờ, Mila đứng ở mép phải, đầu nhô lên trên mép tấm |
| D6 | SCR-M02-003: phương án E trong 5 phương án — huy hiệu hoàn thành đứng một mình ở giữa; Mila thay trái tim trong thẻ "Hẹn gặp lại"; tắt Mila thì trái tim như cũ (OD-MAS-10 đổi, OD-MAS-27) |
| D7 | DV-92: phần ăn mừng ≤ `MASCOT_CELEBRATION_MS`, rồi Mila về cỡ đứng trong thẻ, bong bóng ở lại đủ 15 giây (OD-MAS-28) |
| D8 | Nhãn "Đã tham quan" trong danh sách điểm của SCR-M02-003 giữ nguyên theo quyết định chủ dự án; ghi nhận lệch với spec-M02 SC-M02-013 (validation report DV-94), không sửa trong brief này |

## 3. Phạm vi file được phép

| Đường dẫn | Nội dung |
|---|---|
| `docs/spec/spec-Mascot.md` | v1.5: BR-MAS-07, 21; US-MAS-07.2, US-MAS-09.1; §5.1 (SCR-M01-002); §5.4 (giới hạn, thời gian đọc); OD-MAS-23…26; change notes |
| `docs/design/design-system.md` | §4.3 dòng cử chỉ tự động và vòng chờ; §9.2 ô trống không chiếm chỗ, cỡ DOCK ở SCR-M01-002; §9.3a áp cho đầu màn Gợi ý tuyến |
| `docs/mascot/**` | Behavior Matrix (MAS-B-010, 011, 086; MAS-B-088 mới), State Machine (lịch cử chỉ, thời gian đọc), Dialogue Library (thời gian đọc), Asset spec (AN-AMBIENT, AN-BREATHE), Testing Checklist |
| `screens/screen-spec/M01/screen-spec-SCR-M01-002.md` | Slot đầu màn DOCK |
| `specs/005-visitor-mascot/**` | spec.md, tasks.md (Phase 19), validation-report.md, contracts nếu cần |
| `src/shared/mascot/**`, `src/app/mascot/**` | Hằng số, luật, arbiter, CSS animation, ô slot |
| `src/modules/m01/recommendation/**` | Chỉ khai báo slot DOCK cạnh tiêu đề và CSS bố cục đầu màn; không đổi form, tiêu chí hay kết quả |
| `src/modules/m02/end/EndPage.tsx` (+ `.module.css`), `src/shared/ui/tokens.css` (`--mascot-size-dock-end`), `screens/screen-spec/M02/screen-spec-SCR-M02-003.md` | D6: dời slot `end-hero` vào thẻ "Hẹn gặp lại"; không đổi chữ, dữ liệu hay thứ tự phần tử |
| `src/modules/**` khác | Không cần |
| `e2e/**` | Test mascot liên quan |

## 4. Impact dimensions

| Chiều | Tác động |
|---|---|
| Actor, lifecycle, field, DAC, contract, report | Không đổi |
| Screen | SCR-M01-002: Mila DOCK cạnh tiêu đề (trước là AVATAR). Mọi màn có ô AVATAR: ô trống không chiếm chỗ |
| Câu chữ | Không đổi câu nào |
| Truy cập | Chuyển động kéo dài hơn 5 giây (thở liên tục) vẫn dừng được bằng công tắc ở SCR-M01-004 (WCAG 2.2.2, BR-MAS-21); bong bóng 15 giây có nút × (vùng chạm 44px) |
| Hiệu năng | Thở liên tục là animation `transform` của CSS, không có timer JS; dừng khi trang ẩn, công tắc tắt, giảm chuyển động |
| Dependency, backend, dữ liệu | Không |

## 5. Non-goals

- Không đổi câu thoại, ưu tiên, sự kiện, giới hạn khác của §5.4.
- Không thêm nút ẩn Mila (OD-MAS-03 giữ nguyên).
- Không đổi Mila ở màn Quét QR SCR-M02-005 (vẫn không có Mila).
- Không commit, push nếu người dùng chưa yêu cầu.

## 6. Validation gates

- `npm run ci` PASS; `npx playwright test --project=m01 --project=m02` PASS.
- Test thay đổi có chủ đích (ghi trong validation report): giá trị thời gian đọc, lịch cử chỉ, MAS-B-010 không còn "một lần mỗi lần tải trang", slot `recommend-head` là DOCK.
- Kiểm bằng mắt ở 320 và 390 px: SCR-M01-002 không có khoảng trống, Mila không đè tiêu đề; các ô AVATAR trống không chiếm chỗ.

## 7. Tiến độ

| Ngày | Việc | Kết quả |
|---|---|---|
| 2026-11-24 | Chủ dự án báo 4 lỗi; chốt D1–D4 | Xong |
| 2026-11-24 | spec-Mascot v1.5, tài liệu dẫn xuất, code, test (tasks T110–T115; validation report §19) | Xong |
