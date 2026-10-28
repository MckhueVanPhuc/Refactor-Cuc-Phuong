# CLAUDE.md — Cúc Phương Quest

Đọc và tuân theo [AGENTS.md](AGENTS.md) trước khi làm bất kỳ việc gì.
AGENTS.md là quy tắc chính của repo. Nếu một yêu cầu xung đột với AGENTS.md, dừng lại và hỏi người dùng.

## Trạng thái repo

Repo đã **mở phạm vi code** (xem AGENTS.md §2): application code nằm trong `src/`, implementation packages trong `specs/`,
cấu hình Vite và Supabase local. Chưa có source code nào được viết; việc viết code chỉ bắt đầu sau khi plan được duyệt.
Quy tắc frontend dưới đây áp dụng cho `src/`. HTML mockup tĩnh trong `screens/html/` chỉ là tham chiếu, không phải code ứng dụng.

## Skill

Skill của dự án nằm ở `.claude/skills/`: bộ Spec-Kit gọi bằng `/speckit-...` và `frontend-design`.
Skill Spec-Kit dựa trên `.specify/`; quy trình dùng chúng theo M03_Documentation_Refactor_Runbook_v2.md.

## Quy tắc frontend (khi có code frontend)

- Khi xây dựng hoặc sửa giao diện, dùng skill `frontend-design`.
- Màu, font, khoảng cách và bo góc lấy từ [docs/design/design-system.md](docs/design/design-system.md).
  Không hard-code giá trị màu/khoảng cách trong component; dùng token.
- Icon chỉ lấy từ [assets/icons/](assets/icons/). Không tự vẽ icon và không lấy icon từ
  thư viện khác nếu chưa được phê duyệt.
- Hành vi, validation và quyền lấy từ spec (docs/spec/); design system chỉ định nghĩa hình thức.
