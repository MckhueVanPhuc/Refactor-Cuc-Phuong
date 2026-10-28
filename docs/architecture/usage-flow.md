# Main Usage Flow — Cúc Phương Quest

Tài liệu này tập hợp nguyên văn các block `flowchart` trong ba module spec. File không bổ sung nhánh hoặc hành vi ngoài spec; khi flow trong spec thay đổi, bản sao tại đây phải được cập nhật. Đồng bộ ngày 2026-10-27 với Spec M01 v3.2, M02 v3.3, M03 v3.7.

## Danh mục

1. [UF-01 — M01 Overall Usage](#uf-01--m01-overall-usage)
2. [UF-02 — M02 Field Experience](#uf-02--m02-field-experience)
3. [UF-03 — M03 Draft, Review & Publication](#uf-03--m03-draft-review--publication)
4. [UF-04 — M03 Session Ingest](#uf-04--m03-session-ingest)
5. [UF-05 — M03 Administrative Access](#uf-05--m03-administrative-access)
6. [UF-06 — M02 Public QR Link Entry](#uf-06--m02-public-qr-link-entry)
7. [UF-07 — M03 Closure & Reopen](#uf-07--m03-closure--reopen)
8. [UF-08 — M03 Live QR Lookup](#uf-08--m03-live-qr-lookup)
9. [UF-09 — M03 Checkpoint & Route Creation](#uf-09--m03-checkpoint--route-creation)

## UF-01 — M01 Overall Usage

Nguồn: [spec-M01.md](../spec/spec-M01.md) v3.2, §4.1.

```mermaid
flowchart TD
    A[Choose language] --> B[Browse or request recommendation]
    B --> C[Select active route and read details]
    C --> D{Offline-required checkpoint or offline route map?}
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
    J --> M[Write SelectedRouteContext v3]
    K --> M
    M --> N[Open M02]
```

## UF-02 — M02 Field Experience

Nguồn: [spec-M02.md](../spec/spec-M02.md) v3.3, §4.1.

```mermaid
flowchart TD
    A[Read SelectedRouteContext v3] --> B{Authorized, unused and not expired?}
    B -->|No| C[Request a new Start from M01]
    B -->|Yes| D[Create DANG_DIEN_RA session]
    D --> E[Display journey from manifest]
    E --> F[Scan QR in the app, or open its link from the phone camera]
    F --> J{Online?}
    J -->|Yes| K[Look up the QR in M03, sending routeId when a session exists]
    J -->|No| G{QR in the frozen journey?}
    K --> N{Outcome}
    N -->|VALID| U{Its checkpoint in the journey?}
    U -->|Yes| V[Upsert visit by sessionId + checkpointId]
    U -->|No| O[Show live content of this QR]
    V --> O
    N -->|TEMPORARILY_CLOSED| P[Show closure notice, no visit]
    N -->|INVALID| Q[Show invalid QR message, no visit]
    N -->|Source failure or timeout| G
    G -->|Yes| H[Upsert visit by sessionId + checkpointId]
    G -->|No| M[Report that a connection is needed]
    H --> L[Read package resource for this QR]
    V --> R{Final checkpoint visited?}
    H --> R
    R -->|No| F
    R -->|Yes| W{End-of-trip prompt or Finish confirmed?}
    W -->|Yes| S[HOAN_TAT]
    W -->|Continue| F
    S --> T[Queue immutable sync record]
    Z[App opened with a session started more than 24 hours ago] --> Y{Final checkpoint visited?}
    Y -->|Yes| S
    Y -->|No| AB[BO_DO]
    AB --> T
```

## UF-03 — M03 Draft, Review & Publication

Nguồn: [spec-M03.md](../spec/spec-M03.md) v3.7, §4.1.

```mermaid
flowchart TD
    A[Create or edit draft] --> B{Values plainly invalid?}
    B -->|Yes| C[Block save and show message at the field]
    B -->|No| D[Save draft and refresh the missing-for-publication panel]
    D --> E[Author opens publication review]
    E --> F{Blocking issues?}
    F -->|Yes| G[List exact gaps and return to editing]
    F -->|No| H[Author confirms once]
    H --> I{Stale data or route busy?}
    I -->|Yes| J[Reject with plain message and reload]
    I -->|No| K{Journey of any route affected?}
    K -->|No| L[Publish revision atomically]
    K -->|Yes| M[Build snapshot candidates for every affected route]
    M --> N{All candidates complete?}
    N -->|No| O[Keep current public version and report failure]
    N -->|Yes| P[Atomic switch of revisions, every affected snapshot version and public state]
    L --> Q[Consumers read new public state]
    P --> Q
```

## UF-04 — M03 Session Ingest

Nguồn: [spec-M03.md](../spec/spec-M03.md) v3.7, §4.4.

```mermaid
flowchart LR
    A[Receive terminal SessionSyncRecord] --> B{Schema, privacy, route, version and visited checkpoints valid?}
    B -->|No| C[Validation error]
    B -->|Yes| D{sessionId exists?}
    D -->|No| E[Store immutable session and visits]
    D -->|Yes, identical| F[Return success]
    D -->|Yes, different| G[Return conflict]
    E --> F
```

## UF-05 — M03 Administrative Access

Nguồn: [spec-M03.md](../spec/spec-M03.md) v3.7, §4.3.

```mermaid
flowchart TD
    P{Administrative accounts exist?}
    P -->|No| B[Environment operator runs one-time Reviewer provisioning]
    B --> I[Provider sends invitation]
    P -->|Yes| L[M03 login]
    I --> C[Recipient sets own password through provider invitation]
    C --> L
    L --> A{Identity + active AdminAccount + valid role?}
    A -->|Yes| M[Open authorized M03 screen]
    A -->|No| D[Deny M03 access]
    L -->|Forgot password| R[Provider recovery request and callback]
    R --> L
    M -->|Reviewer invites account| I
```

## UF-06 — M02 Public QR Link Entry

Nguồn: [spec-M02.md](../spec/spec-M02.md) v3.3, §4.4.

```mermaid
flowchart TD
    A[Phone camera opens the public QR link] --> B{Page available?}
    B -->|No network and app never opened in this browser| X[Browser shows its own offline page]
    B -->|Yes| C[Apply the automatic end of a forgotten session]
    C --> D{In-progress session in this browser?}
    D -->|Yes| E[Handle exactly like an in-app scan]
    D -->|No| F[Free visitor: look up the QR without routeId]
    F --> G{Outcome}
    G -->|VALID| H[Show content and the free-visitor hint]
    G -->|TEMPORARILY_CLOSED| I[Show closure notice]
    G -->|INVALID| K[Show invalid QR message]
    G -->|Offline or source failure| L[Report that a connection is needed]
```

## UF-07 — M03 Closure & Reopen

Nguồn: [spec-M03.md](../spec/spec-M03.md) v3.7, §4.5.

```mermaid
flowchart TD
    A[Admin selects Close] --> B[Confirmation dialog shows impact and requires a reason]
    B --> C{Target}
    C -->|Route| D[Set route TAM_DONG immediately]
    C -->|Checkpoint| E[Build snapshots for every route that lists it]
    E --> F{All snapshots built?}
    F -->|No| G[Report failure, keep state unchanged and offer to close the routes directly]
    F -->|Yes| H[Atomic switch of checkpoint TAM_DONG and new versions of all affected routes]
    H --> I{Any affected route left without an active checkpoint?}
    I -->|Yes| J[Those routes become TAM_DONG automatically]
    I -->|No| K[Route states unchanged]
    D --> L[Audit entries and public state updated]
    J --> L
    K --> L
    M[Reviewer selects Reopen] --> N[Safety note and technical checks]
    N -->|Checks fail| O[List what to fix and do not reopen]
    N -->|Checks pass| P[Reopen the checkpoint with new versions for all routes that list it, or reopen the route]
```

## UF-08 — M03 Live QR Lookup

Nguồn: [spec-M03.md](../spec/spec-M03.md) v3.7, §4.6.

```mermaid
flowchart TD
    A[Receive qrIdentifier and optional routeId] --> B{QR exists and is HOAT_DONG?}
    B -->|No| X[INVALID]
    B -->|Yes| C{Checkpoint status}
    C -->|NHAP or LUU_TRU| X
    C -->|HOAT_DONG or TAM_DONG| D{Route supplied?}
    D -->|Yes| E{Route status}
    E -->|Unknown or NHAP| X
    E -->|TAM_DONG or LUU_TRU| Y[TEMPORARILY_CLOSED with scope ROUTE]
    E -->|HOAT_DONG| F{Checkpoint TAM_DONG?}
    D -->|No| F
    F -->|Yes| Z[TEMPORARILY_CLOSED with scope CHECKPOINT]
    F -->|No| V[VALID with the scanned QR own published content]
```

## UF-09 — M03 Checkpoint & Route Creation

Nguồn: [spec-M03.md](../spec/spec-M03.md) v3.7, §4.7.

```mermaid
flowchart TD
    subgraph CP[Checkpoint function]
        A[Create the checkpoint, choose its connectivity mode and save it] --> B[Add a visit point in an empty form, fill it and save the draft, which creates its QR]
        B --> C{Checkpoint works with network?}
        C -->|Yes| D[Text, images, audio and video]
        C -->|No| E[Text and images only]
        D --> F[Each visit point shows Ready or what is missing]
        E --> F
        F --> G[Review and publish the checkpoint with its ready visit points]
    end
    subgraph RT[Route function]
        H[Fill route steps 1 to 3 and save the draft] --> I[Step 4 choose published checkpoints and put them in visiting order]
        I --> J[Route publication review]
        J --> K[Publish the route with journey version 1]
    end
    G --> I
```
