# Architecture Documents

| Tài liệu | Góc nhìn | Nguồn chính |
|---|---|---|
| [Context diagram](context-diagram.md) | Tác nhân, ranh giới M01–M03 và contract liên module | Spec M01–M03 |
| [Usage flow](usage-flow.md) | Các flowchart nghiệp vụ, đánh số UF-01…UF-04 | Block nguyên văn trong spec M01–M03 |
| [Sequence diagrams](sequence-diagrams.md) | Thứ tự tương tác, đánh số SD-01…SD-04 | Block nguyên văn trong spec M01–M03 |
| [System configuration](system-configuration.md) | Runtime components, ownership, data flow, offline architecture và integration contracts | Constraint đã xác nhận trong spec M01–M03 |
| [Tech stack](tech-stack.md) | Canonical technology choices, responsibility, tooling và MVP non-goals | Configuration baseline và repository inventory |
| [Environment configuration](environment.md) | Preview/Production environment strategy, configuration variables và public/secret boundary | Configuration baseline, Spec M03 và repository inventory |

## Quy ước bảo trì

- `usage-flow.md` và `sequence-diagrams.md` chỉ tổng hợp diagram đã tồn tại trong spec; không tự sửa node, participant hoặc nhánh.
- `context-diagram.md` là sơ đồ tổng hợp liên module, vì vậy có thể chuẩn hóa tên nhưng không được tạo contract mới.
- `system-configuration.md` là runtime architecture; `tech-stack.md` sở hữu technology choices và `environment.md` sở hữu environment-specific configuration.
- Technology được đánh dấu `Selected` khi đã có project decision hoặc source/config xác nhận; review được người dùng ủy quyền ngày 2026-09-27 là baseline technical hiện hành. Dependency chưa có trong source vẫn ghi implementation chưa tồn tại.
- Secret value không được đưa vào repository hoặc documentation; `environment.md` chỉ quản lý tên biến, classification và placement.
- Khi một spec thay đổi diagram hoặc contract, phải cập nhật tài liệu architecture và chạy lại kiểm tra đối chiếu.

## Baseline hiện tại

Technical decisions: [Tech Stack](tech-stack.md) §§3–8, 13; [Environment Configuration](environment.md) §§10–11; [System Configuration](system-configuration.md), Runtime decisions. Edge/RPC split, npm/Node 24 LTS, PWA update policy, test tools và chiến lược hai runtime environment (Preview và Production) với hai Supabase project riêng đã được chốt. Data-layer implementation và embedded tests đã có; hosted integration chưa chạy, xem [Storage Validation](../../data/07-storage-validation.md).

- M01: [`spec-M01.md`](../spec/spec-M01.md) v2.0, status MVP implementation baseline, cập nhật ngày 2026-09-27.
- M02: [`spec-M02.md`](../spec/spec-M02.md) v2.0, status MVP implementation baseline, cập nhật ngày 2026-09-27.
- M03: [`spec-M03.md`](../spec/spec-M03.md) v2.0, status MVP implementation baseline, cập nhật ngày 2026-09-27.
