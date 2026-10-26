# Main Usage Flow — Cúc Phương Quest

Tài liệu này tập hợp nguyên văn các block `flowchart` trong ba module spec. File không bổ sung nhánh hoặc hành vi ngoài spec.

## Danh mục flow

1. [UF-01 — M01 Overall Usage](#uf-01--m01-overall-usage)
2. [UF-02 — M02 Field Experience](#uf-02--m02-field-experience)
3. [UF-03 — M03 Review & Publication](#uf-03--m03-review--publication)
4. [UF-04 — M03 Session Ingest](#uf-04--m03-session-ingest)

## UF-01 — M01 Overall Usage

Nguồn: [spec-M01.md](../spec/spec-M01.md), §4.1.

```mermaid
flowchart TD
    A[Choose language] --> B[Browse or request recommendation]
    B --> C[Select active route]
    C --> D{Has OFFLINE_REQUIRED checkpoint?}
    D -->|No| H[Start]
    D -->|Yes| E{Ready package exists?}
    E -->|Yes| H
    E -->|No| F[Warn: Download / Continue / Back]
    F -->|Download succeeds| H
    F -->|Continue and online| H
    F -->|Back| B
    H --> I{Online?}
    I -->|Yes| J[Validate current route and snapshot]
    I -->|No, ready package| K[Use package manifest]
    I -->|No package| L[Block Start]
    J --> M[Write SelectedRouteContext v2]
    K --> M
    M --> N[Open M02]
```

## UF-02 — M02 Field Experience

Nguồn: [spec-M02.md](../spec/spec-M02.md), §4.1.

```mermaid
flowchart TD
    A[Read SelectedRouteContext v2] --> B{Authorized and unused?}
    B -->|No| C[Request a new Start from M01]
    B -->|Yes| D[Create DANG_DIEN_RA session]
    D --> E[Display journey from manifest]
    E --> F[Scan QR]
    F --> G{Resolves into current journey?}
    G -->|Yes| H[Upsert visit by sessionId + checkpointId]
    G -->|No, valid live QR| I[Show live content only]
    G -->|Invalid| J[Show invalid/withdrawn QR]
    H --> K{Connectivity mode}
    K -->|OFFLINE_REQUIRED| L[Read matching package resource]
    K -->|ONLINE_AVAILABLE| M[Read M03 live content]
    H --> N{Final checkpoint visited and Finish confirmed?}
    N -->|Yes| O[HOAN_TAT]
    N -->|No| F
    O --> P[Queue immutable sync record]
```

## UF-03 — M03 Review & Publication

Nguồn: [spec-M03.md](../spec/spec-M03.md), §4.1.

```mermaid
flowchart TD
    A[Create/edit draft] --> B[Submit revision]
    B --> C{Complete enough for review?}
    C -->|No| D[Return validation gaps]
    C -->|Yes| E[Reviewer evaluates]
    E -->|Reject| A
    E -->|Approve| F{Journey snapshot affected?}
    F -->|Yes| G[Build immutable snapshot candidate]
    F -->|No| H[Publish approved public metadata]
    G --> I{Snapshot complete?}
    I -->|No| J[Keep current public version]
    I -->|Yes| K[Atomic snapshot/version/public-state switch]
    K --> L[Consumers read new version]
```

## UF-04 — M03 Session Ingest

Nguồn: [spec-M03.md](../spec/spec-M03.md), §4.4.

```mermaid
flowchart LR
    A[Receive terminal SessionSyncRecord] --> B{Schema/privacy valid?}
    B -->|No| C[Validation error]
    B -->|Yes| D{sessionId exists?}
    D -->|No| E[Store immutable session and visits]
    D -->|Yes, identical| F[Return success]
    D -->|Yes, different| G[Return conflict]
    E --> F
```
