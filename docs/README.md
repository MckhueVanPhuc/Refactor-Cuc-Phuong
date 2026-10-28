# Documentation Index — Cúc Phương Quest V2

Tài liệu này là chỉ mục điều hướng toàn bộ hệ thống tài liệu phục vụ quá trình rebaseline và refactor Cúc Phương Quest V2 theo quy trình tại [M03 Documentation Refactor Runbook v2](../M03_Documentation_Refactor_Runbook_v2.md).

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
- [06 — Physical Schema](../data/06-physical-schema.md) (*V2 — thiết kế vật lý, giới hạn cuối cùng của đợt chuyển giao tài liệu; chưa implement*)

> **Lưu ý về phạm vi:**  
> - data/06-physical-schema.md là ranh giới kết thúc của bộ tài liệu chuyển giao V2.
> - data/05-review.md (review gate) và data/06-physical-schema.md (thiết kế vật lý) đã được làm lại cho V2 (2026-10-28). Physical Schema là thiết kế tài liệu, chưa có SQL, migration hay triển khai.
> - Các tài liệu downstream cũ như Field Mapping (data/schema/field-mapping.md), Seed Data (data/seed/**), Storage Validation (data/07-storage-validation.md) và implementation packages không thuộc active documentation set của V2.