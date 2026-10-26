# Main Sequence Diagrams — Cúc Phương Quest

Tài liệu này tập hợp nguyên văn các block `sequenceDiagram` trong ba module spec. Khi sequence trong spec thay đổi, bản sao tương ứng tại đây phải được cập nhật; file này không định nghĩa hành vi mới.

## Danh mục sequence

1. [SD-01 — M01 Start Route & Handoff](#sd-01--m01-start-route--handoff)
2. [SD-02 — M02 QR Check-in](#sd-02--m02-qr-check-in)
3. [SD-03 — M02 Terminal Session Sync](#sd-03--m02-terminal-session-sync)
4. [SD-04 — M03 First Route Publication](#sd-04--m03-first-route-publication)

## SD-01 — M01 Start Route & Handoff

Nguồn: [spec-M01.md](../spec/spec-M01.md), §4.7.

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
    M01->>Shared: Atomic write SelectedRouteContext v2
    M01->>M02: Open field experience
    M02->>Shared: Read context, language, matching package if available
```

## SD-02 — M02 QR Check-in

Nguồn: [spec-M02.md](../spec/spec-M02.md), §4.2.

```mermaid
sequenceDiagram
    actor Visitor
    participant M02
    participant Local as M02 local data
    participant M01Data as M01 shared data
    participant M03
    Visitor->>M02: Scan qrIdentifier
    M02->>M02: Resolve to checkpointId
    alt Checkpoint in current journey
        M02->>Local: Insert visit if absent
        M02->>M02: Select content source
        alt OFFLINE_REQUIRED
            M02->>M01Data: Read matching ready package resource
        else ONLINE_AVAILABLE
            M02->>M03: Read current public content
        end
        M02-->>Visitor: Visit result + content/unavailable state
    else Valid QR outside journey
        M02->>M03: Read live content
        M02-->>Visitor: Content only
    else Invalid/withdrawn QR
        M02-->>Visitor: Invalid QR message
    end
```

## SD-03 — M02 Terminal Session Sync

Nguồn: [spec-M02.md](../spec/spec-M02.md), §4.3.

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
        else Same ID, different payload
            M03-->>Queue: Conflict
            Queue->>Queue: Stop automatic retry and surface error
        else Network/server failure
            M03-->>Queue: No success acknowledgement
        end
    end
```

## SD-04 — M03 First Route Publication

Nguồn: [spec-M03.md](../spec/spec-M03.md), §4.2.

```mermaid
sequenceDiagram
    actor Staff as Content Staff
    actor Reviewer
    participant M03
    participant Store as M03 data
    Staff->>M03: Submit route revision
    M03->>M03: Validate submission minimum
    Reviewer->>M03: Approve revision
    M03->>M03: Validate full publication guard
    M03->>Store: Build DA_CONG_BO JourneySnapshot
    M03->>Store: Atomic set activeContentVersion + HOAT_DONG
    M03-->>Reviewer: Publication success
```
