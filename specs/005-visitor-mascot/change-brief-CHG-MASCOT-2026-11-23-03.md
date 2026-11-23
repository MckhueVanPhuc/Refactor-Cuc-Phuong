# Change Brief CHG-MASCOT-2026-11-23-03 — Bỏ chỗ trùng giữa lời Mila và câu chữ của M01/M02

| Trường | Nội dung |
|---|---|
| Change ID | CHG-MASCOT-2026-11-23-03 |
| Trạng thái | **APPROVED** (2026-11-23). Được sửa tài liệu theo §5.1, cập nhật gói 005 và code theo §5.2 |
| Người duyệt | Chủ dự án (người dùng của phiên làm việc; duyệt trong chat 2026-11-23: "duyệt", "bỏ toast điểm cuối"). *Chủ dự án điền tên tài khoản nếu cần* |
| Ngày duyệt | 2026-11-23 |
| Loại thay đổi (runbook §4) | Behavioral change của [spec-Mascot](../../docs/spec/spec-Mascot.md) (v1.1 → v1.2) và **một dòng của [spec-M02](../../docs/spec/spec-M02.md)** (§8 "check-in feedback": người trình bày xác nhận lượt ghé). Không đổi rule, dữ liệu, contract hay thứ tự ghi của M02; không đổi M01, M03 |
| Liên quan | [CHG-MASCOT-2026-11-22-02](change-brief-CHG-MASCOT-2026-11-22-02.md) (APPROVED); rà soát trùng lặp trình bày trong chat và quyết định của chủ dự án 2026-11-23 |

## 1. Source

Rà soát ngày 2026-11-23: đặt từng câu của Mila cạnh câu cố định của màn tại cùng thời điểm (spec-Mascot §5.6; screen spec SCR-M01-001…004, SCR-M02-001…005; `src/modules/m01/i18n`, `src/modules/m02/i18n`). Rule liên quan: spec-Mascot BR-MAS-02 (Mila không thay, không lặp câu cố định), BR-MAS-19, 23; spec-M02 §8 (check-in feedback), BR-M02-005, 021; SC-M02-013.

## 2. Current → New

| # | Hiện tại | Mong muốn | Quyết định 2026-11-23 |
|---|---|---|---|
| 1 | Quét được mã: toast "Đã ghi nhận lượt quét." **và** bong bóng Mila (051 / 050 / 055) cùng lúc — hai thông báo xác nhận một việc | Khi Mila đang hoạt động, **bong bóng Mila là xác nhận lượt ghé, không còn toast**. Câu của Mila phải nói rõ lượt quét đã được ghi (mục 3). Toast vẫn hiện như cũ khi Mila không thể xác nhận (mục 4) | C |
| 2 | Bắt đầu chuyến: câu gợi ý cố định + Mila 030 "Ở mỗi điểm dừng, tìm tem QR rồi bấm Quét QR nhé." (gần trùng) | **Giữ nguyên**; ghi là ngoại lệ được chấp nhận của BR-MAS-02 | Giữ nguyên |
| 3 | Màn kết quả: câu chạm 065 "Cảm ơn bạn đã đi cùng mình hôm nay!" gần trùng câu cảm ơn của màn | **Giữ nguyên** | Giữ nguyên |
| 4 | Chưa cài, trùng câu cố định: 040 (mở camera), 054 (dùng bản đã tải khi mất sóng), 024, 025 (tải gói lỗi) | **Chỉ minh họa** (INLINE, không chữ) | Đồng ý |
| 5 | Chưa cài: 013 (gợi ý 2 lần không có kết quả) lặp câu cố định và **thêm nút "Xem tất cả tuyến" thứ hai** | **Chỉ minh họa, không nút** | Đồng ý |
| 6 | Chưa cài: 011 "Có {count} tuyến hợp với bạn đây!" (con số đã có trong danh sách) | "Đây là những tuyến hợp với bạn!" — không con số | Đồng ý |
| 7 | Chưa cài: 021 "Xếp xong rồi! Các điểm cần tải trước giờ xem được cả khi mất sóng." (nửa đầu lặp nhãn "Sẵn sàng") | "Giờ các điểm này xem được cả khi mất sóng." | Đồng ý |
| 8 | Chạm khi camera mở: 043 lặp hướng dẫn của camera | "Lại gần tem hơn và tránh chỗ chói nắng nhé." | OK |
| 9 | 012 (chạm lần hai ở M01) gần trùng 008 (gợi ý khi đứng yên lâu) | "Bấm Gợi ý tuyến, mình chọn giúp theo thời gian và sở thích của bạn." | OK |

## 3. Câu xác nhận lượt ghé (nháp; thư viện lời thoại chốt; ≤ 90 ký tự; không từ chỉ sự có mặt — SC-M02-013)

| Khi | VI (nháp) | EN (nháp) |
|---|---|---|
| Lượt ghé đầu tiên của chuyến (051, cấp 2) | Đã ghi nhận mã QR đầu tiên! Đọc thử câu chuyện của điểm này nhé. | First scan recorded! Take a moment to read this stop's story. |
| Lượt ghé thường (050, cấp 1) | {cheer} Đã ghi nhận lượt quét: {k}/{n} điểm. | {cheer} Scan recorded: {k} of {n} stops. |
| Nửa chặng (055, cấp 2) | Đã ghi nhận! Bạn đã quét được nửa số điểm rồi đó! | Recorded! You've scanned half of your stops! |
| Còn 1 điểm (058, cấp 2) | Đã ghi nhận! Chỉ còn một điểm nữa thôi! | Recorded! Just one stop to go! |

Bong bóng xác nhận lượt ghé có `role="status"` như toast cũ, để trình đọc màn hình đọc một lần.

## 4. Khi nào toast vẫn hiện (Mila không thể xác nhận)

Toast "Đã ghi nhận lượt quét." hiện đúng như hiện tại khi **bất kỳ** điều kiện nào sau đây đúng:

- Công tắc phát hành Mila tắt (`VITE_FEATURE_MASCOT` off).
- Mila đang ẩn vì lỗi (ảnh không tải được, lỗi bộ điều khiển — BR-MAS-15, 16).
- Màn không có slot của Mila hiện sẵn sàng (slot `content-toast` chưa đăng ký).
- Câu xác nhận của Mila không hiện được vì một lý do khác (bị ngữ cảnh chặn, bị câu ưu tiên cao hơn chiếm): nếu sau 1 giây kể từ khi lượt ghé được ghi mà bong bóng xác nhận chưa hiện, toast hiện như cũ.

**Điểm cuối chuyến:** khi lượt ghé điểm cuối được ghi lần đầu, hộp thoại "Bạn đã quét điểm cuối. Kết thúc chuyến đi?" hiện ngay (BR-M02-021) và đã xác nhận lượt quét; Mila chỉ rung (BR-MAS-19), không có toast. **Chốt khi duyệt (2026-11-23): bỏ toast ở điểm cuối.**

## 5. Phạm vi file được phép (sau khi duyệt)

### 5.1 Tài liệu

| Đường dẫn | Nội dung |
|---|---|
| `docs/spec/spec-M02.md` | §8 dòng "QR scan/result": check-in feedback là toast, hoặc bong bóng của Mila khi mascot hoạt động (spec-Mascot BR-MAS-24); change notes v3.4 |
| `docs/spec/spec-Mascot.md` | v1.2: BR-MAS-02 thêm hai ngoại lệ (xác nhận lượt ghé; 030 gần trùng được chấp nhận); BR-MAS-24 mới (Mila xác nhận lượt ghé, điều kiện toast dự phòng); US-MAS-02 sửa; §5.6 câu 011, 012, 021, 043, 050, 051, 055, 058; 013, 024, 025, 040, 054 thành minh họa; SC mới cho "không bao giờ mất xác nhận lượt ghé"; §12 |
| `docs/mascot/MASCOT_BEHAVIOR_MATRIX.md`, `MASCOT_DIALOGUE_LIBRARY.md`, `MASCOT_STATE_MACHINE.md`, `MASCOT_TESTING_CHECKLIST.md` | Đồng bộ |
| `screens/screen-spec/M02/screen-spec-SCR-M02-001.md`, `-002.md`, `-004.md` | Phần tử "Check-in feedback": toast hoặc bong bóng Mila theo BR-MAS-24; bảng copy |
| `screens/screen-spec/M01/screen-spec-SCR-M01-001…004.md`, `screens/screen-spec/M02/screen-spec-SCR-M02-001.md` | Bảng copy câu sửa (011, 012, 021, 043) và câu bỏ (013, 024, 025, 040, 054) |
| `docs/function list/function-list-Mascot.md`, `README.md`, `docs/README.md` | Đồng bộ |

### 5.2 Gói Spec-Kit và code

| Đường dẫn | Nội dung |
|---|---|
| `specs/005-visitor-mascot/**` | spec, contracts (tín hiệu "Mila đã xác nhận lượt ghé"), tasks: gộp vào Phase 15 (ba cấp ăn mừng) |
| `src/shared/mascot/**`, `src/app/mascot/**` | Câu mới; host báo "đã xác nhận" qua một store trong bộ nhớ (không lưu); bong bóng xác nhận `role="status"` |
| `src/modules/m02/content/ScanContent.tsx` | **Chỉ** quyết định hiện toast hay không theo store đó (mục 4); không đổi việc ghi lượt ghé, dữ liệu hay thứ tự ghi |
| `e2e/**` | Toast không hiện khi Mila xác nhận; toast hiện khi cờ tắt, khi Mila lỗi, khi quá 1 giây |

## 6. Impact dimensions

| Chiều | Tác động |
|---|---|
| Actor/role, lifecycle, field, DAC, validation, contract liên module | Không đổi |
| Screen | SCR-M02-002, 004 (và 001 khi kết quả ở lại màn): xác nhận lượt ghé do Mila trình bày khi Mila hoạt động; câu cố định "Đã ghi nhận lượt quét." còn là dự phòng |
| Accessibility | Bong bóng xác nhận `role="status"`, đọc một lần; không mất thông báo khi Mila không hiện được (mục 4) |
| Dữ liệu | Không lưu gì mới (BR-MAS-18) |
| MVP priority | Mila vẫn Could: tắt Mila thì M02 như cũ hoàn toàn |

## 7. Explicit non-goals

- Không đổi việc ghi lượt ghé (BR-M02-005), câu hỏi điểm cuối (BR-M02-021) hay bất kỳ câu cố định nào khác của M02.
- Không bỏ toast khi Mila không xác nhận được.
- Không thêm dependency, không backend, không lưu dữ liệu.

## 8. Thứ tự sau khi duyệt

1. spec-M02 (một dòng §8 + change notes), spec-Mascot v1.2.
2. Đồng bộ bộ thiết kế, screen spec, function list, README.
3. Cập nhật gói 005: Phase 15 gồm ba cấp ăn mừng **và** xác nhận lượt ghé thay toast; Phase 16, 17 như cũ.
4. Code Phase 15 → 16 → 17.

## 9. Validation gates

- `npm run ci`, `npm run e2e` PASS.
- Test: không bao giờ có cả toast lẫn bong bóng xác nhận; không bao giờ mất xác nhận (cờ tắt, Mila lỗi, quá 1 giây → toast).
- Test cũ của M02 về toast vẫn PASS khi cờ Mila tắt (SC-MAS-001).

## 10. Khi duyệt

Người duyệt điền "Người duyệt", "Ngày duyệt" và đổi trạng thái thành **APPROVED**; ghi nếu muốn giữ toast ở điểm cuối (mục 4).

## 11. Tiến độ

| Ngày | Việc | Kết quả |
|---|---|---|
| 2026-11-23 | Duyệt brief; chốt bỏ toast ở điểm cuối | APPROVED |
| 2026-11-23 | Bước 1 §8: spec-M02 §8 (clarification 4: một dòng + change notes); spec-Mascot v1.2 (BR-MAS-02, FR-MAS-009, US-MAS-02, US-MAS-07, BR-MAS-24, `MASCOT_CONFIRM_FALLBACK_MS`, §5.6, SC-MAS-015, OD-MAS-19, 20) | Xong |
| 2026-11-23 | Bước 2 §8: Behavior Matrix, Dialogue Library (§3.4b), Testing Checklist (§11), screen spec SCR-M01-001…004, SCR-M02-001, 002, 004, function list, README | Xong |
| 2026-11-23 | Bước 3 §8: gói 005 — spec (SC-MAS-015), research R-26, contracts §4b, quickstart Q27–Q29, tasks T097–T100 (Phase 15) | Xong |
| — | Bước 4 §8: code Phase 15 → 16 → 17 | Chờ chủ dự án yêu cầu |
