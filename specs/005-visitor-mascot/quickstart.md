# Quickstart — Kiểm chứng 005 Mascot Mila

**Trạng thái**: chưa chạy (chưa có code). Kết quả thật ghi vào `validation-report.md` của gói khi cài đặt; phần không chạy được ghi `NOT RUN` (AGENTS.md §6).

## 1. Chuẩn bị

- Node 24, `npm ci` (không thêm dependency).
- `.env.fake` và `.env.e2e` có `VITE_FEATURE_MASCOT=on`; `.env.example` có tên biến.
- Chưa có ảnh production: Mila hiện bằng hình giữ chỗ (research R-08). Kiểm hành vi được; kiểm hình thức chờ G2.

## 2. Lệnh

| Mục đích | Lệnh |
|---|---|
| Toàn bộ kiểm tra tĩnh + unit + build | `npm run ci` |
| Unit với cờ tắt (không hồi quy) | `VITE_FEATURE_MASCOT=off npx vitest run` |
| E2E M01, M02 (gồm `mascot-*.spec.ts`) | `npx playwright test --project=m01 --project=m02 --project=m02-cam-evil` |
| Xem bằng mắt | `npm run dev:fake` → `http://localhost:5174` |
| Precache | sau `npm run build`: `dist/sw.js` chứa `ma-*-240-*.webp` và `ma-11-avatar-96-*.webp`, không chứa `-480-`, `-192-` hay `.jpg` |

## 3. Kịch bản

| # | Kịch bản | Mong đợi | Nguồn |
|---|---|---|---|
| Q1 | Trình duyệt sạch → chọn "Tiếng Việt" | Danh mục hiện; Mila INTRO nói MSG-MAS-001 rồi 002; danh mục cuộn/bấm được | US1, SC-MAS-010 |
| Q2 | Tải lại trang | Không INTRO; có MSG-MAS-004 một lần | US1 |
| Q3 | Context mới mở `/q/Q1a` | Nội dung như trước, không INTRO, Mila chỉ là minh họa cạnh gợi ý khách tự do | US1, OD-MAS-14 |
| Q4 | Start tuyến 4 điểm, quét Q1 | Nội dung hiện ngay; toast cũ còn; MSG-MAS-051; không chờ animation | US2 |
| Q5 | Quét điểm 2 | MSG-MAS-055 (2 = ⌈4/2⌉); quét lại điểm 1: không ăn mừng | US2 |
| Q6 | Quét điểm cuối | Dialog cuối chuyến hiện ngay (so mốc thời gian với cờ `off`); Mila trong đầu dialog | SC-MAS-005 |
| Q7 | Mã tạm đóng (lookup giả `TEMPORARILY_CLOSED`) | Không có phần tử `[data-mascot-slot] img`, chỉ thông báo cố định | SC-MAS-003 |
| Q8 | Phát audio | Không có `[data-mascot-message]` trong lúc phát | SC-MAS-004 |
| Q9 | Scanner mở, đồng hồ giả 15/30/90 s | Nhìn quanh; MSG-MAS-042; MSG-MAS-049 + "Đóng camera"/"Chưa"; sau đó im | US5 |
| Q10 | Hai mã không hợp lệ liên tiếp | MSG-MAS-046; câu `INVALID` cố định vẫn còn | US5 |
| Q11 | `context.setOffline(true)` giữa chuyến | MSG-MAS-074 một lần; quét mã trong tuyến có gói → MSG-MAS-054 | US6, SC-MAS-007 |
| Q12 | Kết thúc chuyến | CELEBRATE ≤ 2,4 s, chạm bỏ qua được; tải lại: chỉ hình tĩnh | US4 |
| Q13 | `page.emulateMedia({ reducedMotion: 'reduce' })` | `getAnimations()` của Mila rỗng; không lá rơi | SC-MAS-008 |
| Q14 | 320/360/390/430 px, mọi màn | `boundingBox` của Mila không giao nút, khung quét, toast, dialog, vùng thông báo | SC-MAS-002 |
| Q15 | Tải gói: thành công, lỗi lưu trữ (`failNextActivation`), lỗi hai lần | MSG-MAS-020/021; 025; 026 | US7 |
| Q16 | Chạm Mila ở danh mục / chuyến đi / nội dung | MSG-MAS-009 / 032 / 059 | US8 |
| Q17 | Cờ `off` | Không có `[data-mascot-slot]` hiển thị nội dung, không tải chunk `mascot`; toàn bộ E2E cũ PASS | SC-MAS-001 |


### Bổ sung v1.1

| # | Kịch bản | Kỳ vọng |
|---|---|---|
| Q18 | Mở danh mục, không thao tác 16 giây | Ít nhất một cử chỉ tự động; không câu chữ |
| Q19 | Tắt công tắc "Chuyển động" ở danh mục và màn chuyến đi | Không animation nào của Mila chạy; Mila vẫn hiện; bong bóng mới hiện chữ ngay |
| Q20 | Giảm chuyển động bật trên thiết bị | Công tắc khởi đầu ở "tắt" |
| Q21 | Chạm Mila ở danh mục 2 lần; ở chuyến đi sau khi quét 1/3 điểm; khi scanner mở; ở màn kết quả | 009 → 012; 033 "Còn 2 điểm nữa…"; 043; 065 |
| Q22 | Chạm Mila 5 lần trong 3 giây, rồi lặp lại | Chóng mặt một lần (085); lần sau như thường |
| Q23 | Tuyến 3 điểm: quét điểm 1, điểm 2 | Điểm 1: 051 cấp 2; điểm 2: 058 "Chỉ còn một điểm nữa thôi!" cấp 2 |
| Q24 | Kết thúc sau khi quét đủ mọi điểm / kết thúc sớm | 063 / 062 |
| Q25 | Cuộn danh mục liên tục | Không cử chỉ tự động trong lúc cuộn và 2 giây sau |
| Q26 | Bong bóng ở 320 px | Kiểu "Giấy dã ngoại", không đè, không cuộn ngang; Mila 112 px (danh mục), 128 px (chuyến đi), 104 px (kết quả) |

## 4. Kiểm thủ công (thiết bị thật — chủ dự án)

Rung trên Android khi quét trong app; đọc được ngoài nắng; một tay; TalkBack/VoiceOver (thông báo tạm đóng đọc một mình, toast không đọc hai lần); Lighthouse `/q/Q1a` không tăng LCP. Ghi `NOT RUN` nếu chưa làm.
