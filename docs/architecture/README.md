# Architecture Documents

| Tài liệu | Góc nhìn | Nguồn chính |
|---|---|---|
| [Context diagram](context-diagram.md) | Tác nhân, ranh giới M01–M03 và contract liên module | Spec M01–M03 |
| [Usage flow](usage-flow.md) | Các flowchart nghiệp vụ, đánh số UF-01…UF-04 | Block nguyên văn trong spec M01–M03 |
| [Sequence diagrams](sequence-diagrams.md) | Thứ tự tương tác, đánh số SD-01…SD-04 | Block nguyên văn trong spec M01–M03 |
| [System configuration](system-configuration.md) | Runtime components, ownership, data flow, offline architecture và integration contracts | Constraint đã xác nhận trong spec M01–M03 |
| [Tech stack](tech-stack.md) | Canonical technology choices, responsibility, tooling và MVP non-goals | Approved technical decisions và repository inventory |
| [Environment configuration](environment.md) | Single Cloud Application Environment, Local Development Workstation, configuration variables, migration controls và public/secret boundary | Approved architecture decision, Spec M01–M03 và repository inventory |

## Quy ước bảo trì

- `usage-flow.md` và `sequence-diagrams.md` chỉ tổng hợp diagram đã tồn tại trong spec; không tự sửa node, participant hoặc nhánh.
- `context-diagram.md` là sơ đồ tổng hợp liên module, vì vậy có thể chuẩn hóa tên nhưng không được tạo contract mới.
- `system-configuration.md` là runtime architecture; `tech-stack.md` sở hữu technology choices và `environment.md` sở hữu environment-specific configuration.
- Technology được đánh dấu `Selected` khi đã có approved technical decision; `Present` chỉ dùng khi artifact thực sự tồn tại trong repository. Repository hiện là documentation-only nên selected technology không được mô tả như đã implemented hoặc deployed.
- Secret value không được đưa vào repository hoặc documentation; `environment.md` chỉ quản lý tên biến, classification và placement.
- Khi một spec thay đổi diagram hoặc contract, phải cập nhật tài liệu architecture và chạy lại kiểm tra đối chiếu.

## Baseline hiện tại

Technical decisions: [Tech Stack](tech-stack.md) §§2–8, 13; [Environment Configuration](environment.md) §§2–12; [System Configuration](system-configuration.md), Runtime decisions. Baseline là **Modular Monolith** với **M01 / M02 / M03 — Logical Modules**, một shared React/TypeScript/Vite PWA trong **Single Vercel Project**, và **Single Supabase Cloud Project** làm **Shared Backend** trong đúng một **Single Cloud Application Environment**. **Local Development Workstation** phục vụ development/testing nhưng không phải hosted environment. Deployment history không tạo environment thứ hai.

- M01: [`spec-M01.md`](../spec/spec-M01.md) v2.0, status MVP implementation baseline, cập nhật ngày 2026-09-27.
- M02: [`spec-M02.md`](../spec/spec-M02.md) v2.0, status MVP implementation baseline, cập nhật ngày 2026-09-27.
- M03: [`spec-M03.md`](../spec/spec-M03.md) v2.0, status MVP implementation baseline, cập nhật ngày 2026-09-29.
