# assets/mascot — Ảnh mascot Mila

Theo AGENTS.md §4: ảnh Mila do người dùng cung cấp; agent chỉ cắt, đổi cỡ, nén, không vẽ lại nhân vật, không chuyển sang SVG.

| Thư mục | Nội dung | Ai đặt vào |
|---|---|---|
| `source/` | PNG gốc 1024×1024 nền trong suốt, tên `ma-<nn>-<name>.png` | Người dùng ([hướng dẫn tạo ảnh](../../docs/mascot/MASCOT_IMAGE_PRODUCTION_GUIDE.md)) |
| `web/` | Bản dùng trên web `ma-<nn>-<name>-240.webp`, `-480.webp` (avatar `-96`, `-192`) | Agent xuất từ `source/` |

Tên tư thế và tệp: [Asset spec](../../docs/mascot/MASCOT_ASSET_SPECIFICATION.md) §3–§4. Chỉ cỡ 240 vào precache (`vite.config.ts`). Chưa có ảnh trong `web/` thì app dùng hình giữ chỗ (`src/shared/mascot/assets.ts`).
