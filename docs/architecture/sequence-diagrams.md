# Main Sequence Diagrams — Cúc Phương Quest

Tài liệu này tập hợp nguyên văn các block `sequenceDiagram` trong ba module spec. Khi sequence trong spec thay đổi, bản sao tương ứng tại đây phải được cập nhật; file này không định nghĩa hành vi mới. Đồng bộ ngày 2026-10-27 với Spec M01 v3.2, M02 v3.3, M03 v3.7.

## Danh mục

1. [SD-01 — M01 Start Route & Handoff](#sd-01--m01-start-route--handoff)
2. [SD-02 — M02 QR Check-in](#sd-02--m02-qr-check-in)
3. [SD-03 — M02 Terminal Session Sync](#sd-03--m02-terminal-session-sync)
4. [SD-04 — M03 First Route Publication](#sd-04--m03-first-route-publication)

## SD-01 — M01 Start Route & Handoff

Nguồn: [spec-M01.md](../spec/spec-M01.md) v3.2, §4.7.

```mermaid
sequenceDiagram
    actor Visitor
    participant M01
    participant M03
    participant Shared as M01 shared data
    participant M02
    Visitor->>M01: Start selected route
    alt Online
        M01->>M03: Read active route + current snapshot
        M03-->>M01: Valid published data
    else Offline with ready package
        M01->>M01: Read ready package manifest
    end
    M01->>Shared: Atomic write SelectedRouteContext v3 with expiresAt
    M01->>M02: Open field experience
    M02->>Shared: Read context, language, matching package if available
```

## SD-02 — M02 QR Check-in

Nguồn: [spec-M02.md](../spec/spec-M02.md) v3.3, §4.2.

```mermaid
sequenceDiagram
    actor Visitor
    participant M02
    participant Local as M02 local data
    participant M01Data as M01 shared data
    participant M03
    Visitor->>M02: Scan QR or open its public link
    M02->>M02: Take qrIdentifier from the link
    alt Online
        M02->>M03: Look up qrIdentifier, with routeId when a session exists
        M03-->>M02: Outcome and content
        opt VALID and the checkpoint belongs to the journey
            M02->>Local: Insert visit if absent
        end
        M02-->>Visitor: Content, closure notice or invalid QR message
    else Offline or source failure, QR in the frozen journey
        M02->>Local: Insert visit if absent
        M02->>M01Data: Read ready package resource for this QR
        M02-->>Visitor: Visit result and content or unavailable state
    else Offline or source failure, QR not in the frozen journey
        M02-->>Visitor: A connection is needed
    end
```

## SD-03 — M02 Terminal Session Sync

Nguồn: [spec-M02.md](../spec/spec-M02.md) v3.3, §4.3.

```mermaid
sequenceDiagram
    participant M02
    participant Queue as Local sync queue
    participant M03
    M02->>Queue: Store immutable terminal payload
    loop Until acknowledged
        Queue->>M03: Send SessionSyncRecord
        alt New or identical retry
            M03-->>Queue: Success
            Queue->>Queue: Mark synced
        else Same ID, different payload or invalid record
            M03-->>Queue: Conflict or rejection
            Queue->>Queue: Stop automatic retry and surface error
        else Network/server failure
            M03-->>Queue: No success acknowledgement
        end
    end
```

## SD-04 — M03 First Route Publication

Nguồn: [spec-M03.md](../spec/spec-M03.md) v3.7, §4.2.

```mermaid
sequenceDiagram
    actor Author as Admin author
    participant M03
    participant Store as M03 data
    Author->>M03: Open publication review
    M03->>M03: Validate full publication guard
    M03-->>Author: Review result with changes, impact and left-out items
    Author->>M03: Confirm publish
    M03->>M03: Recheck concurrency revision and route lock
    M03->>Store: Build snapshot candidate
    M03->>Store: Atomic switch of the route revision, snapshot v1, activeContentVersion and route HOAT_DONG
    M03-->>Author: Publication success
```
