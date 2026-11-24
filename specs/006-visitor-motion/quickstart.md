# Quickstart — Kiểm chứng 006 Motion & micro-interactions

**Trạng thái**: chưa chạy (chưa có code). Kết quả thật ghi vào `validation-report.md` của gói; phần không chạy được ghi `NOT RUN` (AGENTS.md §6).

## 1. Chuẩn bị

- Node 24, `npm ci` (không thêm dependency).
- Đo nền **trước khi code** (R-16): build `main` + PR #79, ghi gzip JS/CSS, LCP SCR-M01-001 (Slow 4G, CPU 4×), CLS SCR-M01-001/SCR-M02-001/SCR-M02-003.
- Ảnh đợt 4 trong `assets/mascot/source/` (đã có, quyền dùng xác nhận 2026-11-24).

## 2. Lệnh

| Mục đích | Lệnh |
|---|---|
| Kiểm tĩnh + unit + build | `npm run ci` |
| E2E M01, M02 | `npx playwright test --project=m01 --project=m02 --project=m02-cam-evil` |
| Xem bằng mắt | `npm run dev:fake` → `http://localhost:5174` (phần du khách cần dữ liệu mock của E2E hoặc stack local) |
| Thử trên điện thoại | build với địa chỉ LAN, `vite preview --host 0.0.0.0`, Chrome Android + cờ `unsafely-treat-insecure-origin-as-secure` (memory "phone testing setup") |

## 3. Kịch bản

| # | Kịch bản | Mong đợi | Nguồn |
|---|---|---|---|
| M1 | Nhấn giữ nút chính, thẻ tuyến | Co về `--press-scale`; nhả về; bố cục không dịch | US1, FR-MOT-002 |
| M2 | Như M1 với `reducedMotion: 'reduce'` | Chỉ lớp phủ màu | US1.3 |
| M3 | Chuyến 4 điểm, quét điểm 2, xem nội dung, bấm Quay lại | Điểm 2 nảy, đường 2→3 vẽ, thanh 1/4 → 2/4, câu "Đã quét QR: 2/4 điểm" nguyên văn | US2, FR-MOT-003, 004 |
| M4 | Tải lại SCR-M02-001; quét lại điểm 1 | Không hiệu ứng mở khóa | US2.3 |
| M5 | Khách tự do `/q/Q1a` | Không thanh tiến trình | US2.4 |
| M6 | Quét điểm cuối | Dialog cuối chuyến hiện không trễ thêm | US2.5, SC-MOT-008 |
| M7 | Tắt cờ Mila, mở SCR-M01-004 | Có công tắc "Hiệu ứng chuyển động" và câu phụ mới | US3.1 |
| M8 | Tắt công tắc, đi qua mọi màn | 0 animation của Mila và T3 (`getAnimations()`); T1 chỉ màu; lượt ghé mới không gọi `vibrate` | US3.2, SC-MOT-002 |
| M9 | Ghi đè `navigator.connection.saveData = true` hoặc `deviceMemory = 2` | T3 không chạy; T1/T2 chạy | US3.5 |
| M10 | Tải gói với ảnh trễ 800 ms | Thanh "đang tải" không số; xong có ✓; lỗi thì bỏ thanh | US4 |
| M11 | Chạm thẻ tuyến ở Chrome | `::view-transition-*` chạy; ảnh thẻ → ảnh đầu chi tiết; Back ngược lại | US5, FR-MOT-006 |
| M12 | Cuộn danh mục dài | Thẻ dưới màn đầu hiện dần một lần; thẻ màn đầu hiện ngay; CLS = 0 | US5.4, SC-MOT-004 |
| M13 | Danh mục tải chậm | Khối giữ chỗ có vệt sáng; giảm chuyển động: đứng yên | US6.1 |
| M14 | Danh mục rỗng, Tài nguyên rỗng, lượt ghé thường, quay lại sau lượt ghé, `CONFLICT` | Mila `peek`, `amazed`, `walk`, `sorry` (khi có ảnh) | US6.2 |
| M15 | Kết thúc `HOAN_TAT` | Huy hiệu đóng dấu, confetti lá ≤ 40 hạt ≤ 2,4 s, danh sách lần lượt; chạm → trạng thái cuối; mở lại: tĩnh | US7 |
| M16 | `CONFLICT` ở màn kết quả | Một Mila (hình trong banner); thẻ "Hẹn gặp lại" có trái tim | FR-MOT-017, DV-95 |
| M17 | Mở danh mục | Nắng và lá chạy ≤ 5 s rồi dừng; không có khi INTRO đang hiện | US8 |
| M18 | Lớp phủ INTRO, ăn mừng cấp 2–3, quay lại sau lượt ghé, màn kết quả | Vẫy tay 2 khung, ăn mừng 2 nhịp, bước 2 khung, `proud` chớp mắt; thân không giật | US9 |
| M19 | Offline sau khi app shell đã lưu | Mọi tư thế đợt 4 và chuyển động M02 hiển thị | SC-MOT-007 |
| M20 | 320–430 px mọi màn | Trang trí, thanh, confetti không che chữ, nút, vùng thông báo, Mila, bong bóng; tối đa một Mila | SC-MOT-009, 010 |

## 4. Đo

| Chỉ số | Ngưỡng | Cách |
|---|---|---|
| JS + CSS motion thêm | ≤ 15 KB gzip | so build trước/sau (R-16) |
| Ảnh đợt 4 thêm vào precache | ≤ 120 KB | tổng cỡ 240 |
| LCP SCR-M01-001 | ≤ nền + 100 ms | Playwright + CDP throttling |
| CLS | 0 | `layout-shift` không do thao tác |
