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
