# Documentation Index — Cúc Phương Quest V2

Chỉ mục toàn bộ tài liệu của Cúc Phương Quest V2. Bộ tài liệu V2 đã hoàn tất đợt rebaseline theo [M03 Documentation Refactor Runbook v2](../M03_Documentation_Refactor_Runbook_v2.md) (2026-10-28); từ đó repo đã có code cho M01 và M03 (xem [README gốc](../README.md) §1 về trạng thái và cách chạy).

Spec M01, M02 và M03 là behavioral/contract baseline (nguồn sự thật duy nhất). Architecture, function list, screen specs và data model là tài liệu dẫn xuất.

---

## 1. Product Baseline (Canonical Specifications)

- [MVP Scope](../MVP-Scope.md)
- [Spec M01 — Route Planning & Preparation](spec/spec-M01.md)
- [Spec M02 — Field Quest Experience](spec/spec-M02.md)
- [Spec M03 — Operations & Content Administration](spec/spec-M03.md)

---

## 2. Architecture

- [Architecture Index](architecture/README.md)
- [System Context Diagram](architecture/context-diagram.md)
- [Usage Flow](architecture/usage-flow.md)
- [Sequence Diagrams](architecture/sequence-diagrams.md)
- [System Configuration](architecture/system-configuration.md)
- [Tech Stack](architecture/tech-stack.md)
- [Environment Configuration](architecture/environment.md)

---

## 3. Function Lists

- [Function List M01](function%20list/function-list-M01.md)
- [Function List M02](function%20list/function-list-M02.md)
- [Function List M03](function%20list/function-list-M03.md)

---

## 4. Screen Inventory & Specifications

- [Screen Inventory và Quy ước](../screens/screen%20list/README.md)
- [Screen List M01](../screens/screen%20list/screen-list-M01.md) | [M01 Screen Specs](../screens/screen-spec/M01/)
- [Screen List M02](../screens/screen%20list/screen-list-M02.md) | [M02 Screen Specs](../screens/screen-spec/M02/)
- [Screen List M03](../screens/screen%20list/screen-list-M03.md) | [M03 Screen Specs](../screens/screen-spec/M03/)
- [Design System](design/design-system.md)

---

## 5. Data Modeling & Persistence (S1 to Physical Schema)

- [01 — Canonical Entity Dictionary](../data/01-entity-dictionary.md)
- [02 — Direct CRUD Matrix](../data/02-crud-matrix.md)
- [03 — ERD Source](../data/03-erd.mmd), [ERD Preview](../data/03-erd-preview.md) & [ERD Review](../data/03-erd-review.md)
- [04 — Logical Data Model](../data/04-data-model.md) & [DBML](../data/04-data-model.dbml)
- [08 — Data Acceptance Criteria (DAC)](../data/08-data-acceptance-criteria.md) (*V2 — hoàn tất, 118 tiêu chí*)
- [05 — Data Review Gate](../data/05-review.md) (*V2 — PASS, 2026-10-28*)
- [06 — Physical Schema](../data/06-physical-schema.md) (*V2 — thiết kế vật lý; đã hiện thực bằng 14 migration trong `supabase/migrations/` trên stack local, chưa áp lên cloud*)

> **Lưu ý về phạm vi:**  
> - data/06-physical-schema.md là tầng tài liệu dữ liệu cuối cùng của V2; phần hiện thực (SQL migration, RPC, pgTAP) nằm trong `supabase/` theo change brief CHG-M03-2026-10-30-01, chỉ trên stack local.
> - data/05-review.md (review gate) và data/06-physical-schema.md đã được làm lại cho V2 (2026-10-28). Khi Physical Schema đổi, migration phải được viết mới (forward), không sửa migration đã có.
> - Các tài liệu downstream cũ như Field Mapping (data/schema/field-mapping.md), Seed Data (data/seed/**), Storage Validation (data/07-storage-validation.md) và implementation packages không thuộc active documentation set của V2.

---

## 6. Implementation Packages (Spec-Kit)

Mỗi gói là bản dẫn xuất từ spec của module, gồm spec, plan, research, data-model, contracts, quickstart, tasks và `validation-report.md` (chỉ ghi lệnh đã chạy thật; phần chưa chạy là `NOT RUN`).

| Gói | Module | Trạng thái |
|---|---|---|
| [001-m01-route-planning-preparation](../specs/001-m01-route-planning-preparation/) | M01 | Đã cài đặt (106/106 task) |
| [002-m02-field-quest-experience](../specs/002-m02-field-quest-experience/) | M02 | Có spec, plan, tasks; chưa cài đặt |
| [003-m03-operations-content-administration](../specs/003-m03-operations-content-administration/) | M03 | Đã cài đặt trên stack local (200/209 task); Phase 16 — đưa lên cloud — chờ change brief triển khai |

Quy tắc chung của repo: [AGENTS.md](../AGENTS.md); constitution: [.specify/memory/constitution.md](../.specify/memory/constitution.md).
