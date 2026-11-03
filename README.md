# Cúc Phương Quest — Documentation Refactor (V2)

Repository này phục vụ việc **tái xây dựng và refactor toàn diện hệ thống tài liệu Cúc Phương Quest** theo định hướng **Spec-first**, bắt đầu từ việc rebaseline Spec-M03 và lan truyền có kiểm soát sang các tầng tài liệu dẫn xuất.

Quy trình refactor được điều phối bởi [M03 Documentation Refactor Runbook v2](M03_Documentation_Refactor_Runbook_v2.md).

> **Trạng thái hiện tại:** DOCUMENTATION REBASELINE IN PROGRESS.  
> Repository hiện chỉ bao gồm tài liệu nghiệp vụ, kiến trúc, đặc tả màn hình và mô hình dữ liệu (kết thúc tại Physical Schema). Hoàn toàn không chứa application source code, SQL migrations, Edge Functions, tests, hoặc runtime environment.

---

## 1. Ba Module Nghiệp Vụ Cốt Lõi

Hệ thống được thiết kế dưới dạng modular monolith với ba module logic:

| Module | Trách nhiệm chính | Trạng thái tài liệu |
|---|---|---|
| **M01 — Route Planning & Preparation** | Chọn ngôn ngữ, khám phá/chọn tuyến, chuẩn bị offline package và Start route. | Spec v2.0 — Chờ kiểm tra cross-module contract sau M03 |
| **M02 — Field Quest Experience** | Phiên thực địa, journey cố định, QR check-in, phân phối nội dung và đồng bộ ẩn danh. | Spec v2.0 — Chờ kiểm tra cross-module contract sau M03 |
| **M03 — Operations & Content Administration** | Xác thực admin, quản trị tuyến/checkpoint/QR/nội dung, phê duyệt revision, snapshot và báo cáo. | **Trọng tâm rebaseline chính trong đợt refactor V2** |

Ngoài ba module, **AI Integration** là một năng lực dùng cho M03 (không phải module thứ tư): nút "→" dịch ô tiếng Việt sang ô tiếng Anh trong các editor M03 (Spec v1.0, priority Could).

Xem [MVP Scope](MVP-Scope.md) để biết phạm vi cam kết Must/Should/Could/Won't cho MVP.

---

## 2. Bản Đồ Điều Hướng Tài Liệu

### A. Nguồn Sự Thật Nghiệp Vụ (Canonical Specifications)
- [Spec M01 — Route Planning & Preparation](docs/spec/spec-M01.md)
- [Spec M02 — Field Quest Experience](docs/spec/spec-M02.md)
- [Spec M03 — Operations & Content Administration](docs/spec/spec-M03.md)
- [Spec AI Integration — Dịch theo yêu cầu cho M03](docs/spec/spec-AI_integration.md)
- [MVP Scope & Boundaries](MVP-Scope.md)

### B. Function Lists & Decomposition
- [Function List M01](docs/function%20list/function-list-M01.md)
- [Function List M02](docs/function%20list/function-list-M02.md)
- [Function List M03](docs/function%20list/function-list-M03.md)
- [Function List AI](docs/function%20list/function-list-AI.md)

### C. Kiến Trúc Hệ Thống (Architecture)
- [Architecture Overview](docs/architecture/README.md)
- [Context Diagram](docs/architecture/context-diagram.md)
- [Usage Flow](docs/architecture/usage-flow.md)
- [Sequence Diagrams](docs/architecture/sequence-diagrams.md)
- [System Configuration & Runtime Topology](docs/architecture/system-configuration.md)
- [Tech Stack Selection](docs/architecture/tech-stack.md)
- [Environment Configuration](docs/architecture/environment.md)

### D. Giao Diện & Màn Hình (Screens)
- [Screen Inventory & Quy ước](screens/screen%20list/README.md)
- [Screen List M01](screens/screen%20list/screen-list-M01.md) | [Screen Specs M01](screens/screen-spec/M01/)
- [Screen List M02](screens/screen%20list/screen-list-M02.md) | [Screen Specs M02](screens/screen-spec/M02/)
- [Screen List M03](screens/screen%20list/screen-list-M03.md) | [Screen Specs M03](screens/screen-spec/M03/)
- [Design System](docs/design/design-system.md)

### E. Dữ Liệu & Lưu Trữ (Data Modeling — S1 đến Physical Schema)
- [S1 — Entity Dictionary](data/01-entity-dictionary.md): Từ điển 16 canonical entities.
- [S2 — CRUD Matrix](data/02-crud-matrix.md): Ma trận CRUD trực tiếp theo function.
- [S3 — ERD Source](data/03-erd.mmd), [ERD Preview](data/03-erd-preview.md), [ERD Review](data/03-erd-review.md): Quan hệ thực thể.
- [S4 — Logical Data Model](data/04-data-model.md) & [DBML Visualization](data/04-data-model.dbml): Mô hình dữ liệu logic chuẩn.
- [Data Acceptance Criteria (DAC)](data/08-data-acceptance-criteria.md): Tiêu chí chấp nhận dữ liệu toàn dự án (*V2 — hoàn tất, 118 tiêu chí*).
- [Data Review Gate](data/05-review.md): Đánh giá review gate (*V2 — PASS, 2026-10-28*).
- [Physical Schema](data/06-physical-schema.md): Thiết kế vật lý V2, giới hạn cuối cùng của tài liệu chuyển giao (*V2 — thiết kế, chưa implement*).

---

## 3. Quy Ước Làm Việc & Governance

1. **Spec-First Authority:** Ba module specifications là nguồn sự thật duy nhất cho hành vi và hợp đồng. Mọi tài liệu kiến trúc, màn hình, dữ liệu đều là tài liệu dẫn xuất.
2. **Quy trình Refactor:** Tuân thủ 12 pha P0–P11 trong [Runbook](M03_Documentation_Refactor_Runbook_v2.md). Tuyệt đối không nhảy cóc từ Spec sang Physical Schema khi chưa qua các bước trung gian (S1 → S2 → S3 → S4 → DAC → Review Gate).
3. **Giới hạn Migration:** Bộ tài liệu V2 hiện tại dừng lại ở data/06-physical-schema.md. Các tài liệu Field Mapping, Seed Data, Storage Validation và implementation packages của V1 không thuộc phạm vi active của V2 cho đến khi có kế hoạch triển khai cụ thể.
4. **Agent Rules:** Mọi contributor và AI agent bắt buộc phải đọc và tuân thủ [AGENTS.md](AGENTS.md) và [.specify/memory/constitution.md](.specify/memory/constitution.md).