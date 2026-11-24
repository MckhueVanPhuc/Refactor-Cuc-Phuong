# assets/mascot — Ảnh mascot Mila

Theo AGENTS.md §4: ảnh Mila do người dùng cung cấp; agent chỉ cắt, đổi cỡ, nén, không vẽ lại nhân vật, không chuyển sang SVG.

| Thư mục | Nội dung | Ai đặt vào |
|---|---|---|
| `source/` | PNG gốc 1024×1024 nền trong suốt, tên `ma-<nn>-<name>.png` | Người dùng ([hướng dẫn tạo ảnh](../../docs/mascot/MASCOT_IMAGE_PRODUCTION_GUIDE.md)) |
| `web/` | Bản dùng trên web `ma-<nn>-<name>-240.webp`, `-480.webp` (avatar `-96`, `-192`) | Agent xuất từ `source/` |

Tên tư thế và tệp: [Asset spec](../../docs/mascot/MASCOT_ASSET_SPECIFICATION.md) §3–§4. Chỉ cỡ 240 vào precache (`vite.config.ts`). Chưa có ảnh trong `web/` thì app dùng hình giữ chỗ (`src/shared/mascot/assets.ts`).

## Quy trình xuất (đợt 1, 2026-11-22)

Chạy trong Chromium của Playwright (devDependency có sẵn), không thêm dependency. Với mỗi PNG gốc:

1. Chỉ giữ mảng thân chính (vùng liền lớn nhất của các điểm có alpha); bỏ mảng rời như hạt bụi và ký hiệu tách rời. Đợt 1 bỏ dấu "?" ở `ma-09-confused` (hướng dẫn tạo ảnh §2 mục 6: không ký hiệu).
2. Bỏ điểm gần như trong suốt (alpha ≤ 3), nơi còn màu nền cũ.
3. Đặt vào khung vuông, giữ tỷ lệ gốc, căn giữa theo ngang. Ảnh đứng toàn thân: chân chạm đường y = 1225/1254. Ảnh nhảy (`cheer`): chân cách đường đó 36 px. Ảnh nửa thân và avatar: mép cắt ở đáy khung.
4. Thu nhỏ từng nửa với làm mịn chất lượng cao rồi về cỡ đích (240/480; avatar 96/192); mã hóa WebP chất lượng 0,82.

Số đo: specs/005-visitor-mascot/validation-report.md §6. Ảnh gốc trong `source/` giữ nguyên, không sửa.

## Ảnh mắt nhắm `ma-20-*-blink` (2026-11-23)

Công cụ sửa ảnh của chủ dự án trả về ảnh 2048 px, nền trắng đặc, và vẽ lại cả ảnh (kết cấu lông khác ảnh gốc khoảng 3% điểm ảnh). Đổi nguyên ảnh đó trong 120 ms sẽ làm cả thân "nhấp nháy". Vì vậy trước khi xuất:

1. Thu ảnh mắt nhắm về cỡ ảnh gốc (1254 px); hai ảnh khớp vị trí (độ lệch tìm được 0, 0).
2. Tìm vùng khác biệt mạnh trong 45% phía trên (vùng mắt), nở rộng 10 px rồi làm mép mờ 6 px.
3. Ghép **chỉ vùng đó** từ ảnh mắt nhắm lên ảnh tư thế gốc; ngoài vùng mắt giữ nguyên từng điểm ảnh của ảnh gốc, kể cả kênh trong suốt.
4. Xuất như ảnh gốc của tư thế (cùng cách căn), nên ảnh mắt nhắm chồng khít khi đổi.

Vùng ghép chiếm 1,7–2,9% diện tích ảnh. Theo quyết định của chủ dự án (2026-11-23), `source/` lưu ảnh mắt nhắm **đã thu về 1254 px** (chỉ đổi cỡ, nội dung giữ nguyên) thay cho bản 2048 px, để repo nhẹ hơn khoảng 16 MB.

## Đợt 4 — năm tư thế mới (2026-11-24, specs/006 T039)

Ảnh `ma-12-sorry`, `ma-14-amazed`, `ma-15-walk`, `ma-16-peek`, `ma-17-proud` do chủ dự án thiết kế, quyền sử dụng xác nhận 2026-11-24. Cùng quy trình đợt 1 (Chromium của Playwright, script ngoài repo), khác ở bước căn cỡ:

1. Kiểm: bốn góc alpha = 0 ở cả 5 ảnh (nền trong suốt thật); mảng rời bị bỏ 0,01–0,04% diện tích; điểm bán trong suốt 1,6–2,4% (viền lông, không có viền màu lạ).
2. Giữ mảng thân lớn nhất, bỏ alpha ≤ 3 (như đợt 1).
3. Căn theo ảnh đã duyệt thay vì theo khung gốc, vì ảnh nguồn có cỡ khác nhau (1230×1278, 1254×1254): toàn thân (`walk`, `proud`) cùng chiều cao nhân vật và đường chân với `ma-02-map-480` (y = 30…468 trên khung 480); nửa thân (`sorry`, `amazed`, `peek`) cùng chiều cao với `ma-07-thumbs-up-480`, mép cắt ở đáy khung; bề ngang tối đa 92% khung; căn giữa theo ngang.
4. Thu nhỏ từng nửa, WebP chất lượng 0,82, cỡ 480 và 240.

Cỡ 240: sorry 14,9 KB, amazed 15,6 KB, walk 11,2 KB, peek 16,0 KB, proud 12,4 KB — tổng 70,1 KB vào precache (ngân sách đợt 4 ≤ 120 KB, còn chỗ cho 4 khung phụ của T052). Ảnh gốc trong `source/` giữ nguyên.

## Đợt 4B — khung phụ (2026-11-24, specs/006 T052)

Cùng cách ghép vùng khác biệt của ảnh mắt nhắm (mục trên), thêm ba bước vì ảnh khung phụ khác cỡ và vẽ lại cả hình:

1. **Đăng ký**: dò tỉ lệ đồng đều (0,94–1,06) và độ lệch, căn đáy–giữa nhân vật, từ thô (1/8) đến mịn (1/2).
2. **Cân màu**: khớp tuyến tính từng kênh khung phụ → ảnh gốc trên vùng cùng phủ kín.
3. **Đặt**: dùng đúng phép biến đổi của ảnh gốc đã xuất (suy từ bbox ảnh gốc và bbox ảnh web 480), nên khung phụ chồng khít.

Kết quả kiểm bằng mắt (ảnh so sánh phóng to): chỉ `ma-15-walk-f2` đạt (vùng ghép 26% là chân và tay; thân, đầu trùng ảnh gốc) → xuất 240/480 (12,0 KB / 35,2 KB). `ma-21-wave-f2`, `ma-22-cheer-f2`, `ma-20-proud-blink` **không xuất** (đầu lệch cỡ, thân mờ, mõm đổi màu); chờ chủ dự án làm lại (hướng dẫn tạo ảnh §9.4).
