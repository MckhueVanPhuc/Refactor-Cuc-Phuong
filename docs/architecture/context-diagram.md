# System Context Diagram — Cúc Phương Quest

Sơ đồ mô tả ranh giới logic của MVP theo ba module spec (M01 v3.2, M02 v3.2, M03 v3.6). Đây không phải deployment diagram hoặc physical API/database design.

```mermaid
flowchart LR
    visitor["Visitor"]
    freeVisitor["Free visitor<br/>(phone camera)"]
    contentStaff["Content Staff"]
    reviewer["Reviewer"]
    park["Park Management"]
    auth["Authentication Provider"]

    m01["M01<br/>Route Planning & Preparation"]
    m02["M02<br/>Field Experience"]
    m03["M03<br/>Operations & Content Administration"]

    visitor -->|"language, route cards and details, offline preparation, Start"| m01
    m01 -->|"catalog, recommendation, package/start outcomes"| visitor
    visitor -->|"start/resume session, scan QR in app or by camera, view content, end trip"| m02
    m02 -->|"journey, scanned progress, QR content, closure notice"| visitor
    freeVisitor -->|"opens public QR link from the phone camera"| m02
    m02 -->|"QR content or notice, no progress"| freeVisitor

    contentStaff -->|"create/edit, self-publish through review, close, revoke/reprint QR, reports"| m03
    reviewer -->|"same as Content Staff, plus reopen, archive, accounts, audit log"| m03
    park -->|"policy, field verification and physical safety controls"| m03
    m03 -->|"validation, review, publication and report outcomes"| contentStaff
    m03 -->|"operational, account and audit outcomes"| reviewer
    m03 -->|"RPT-01 / RPT-02"| park

    m03 -->|"Published Route + immutable JourneySnapshot"| m01
    m01 -->|"LanguagePreference + SelectedRouteContext v3 + ready OfflinePackage"| m02
    m03 -->|"LiveQrLookupResult with LiveStationContent"| m02
    m02 -->|"immutable anonymous terminal SessionSyncRecord"| m03

    m03 -->|"invite/status/fixed application role"| auth
    auth -->|"authenticated identity and credential outcome"| m03
```

## Ranh giới trách nhiệm

| Module | Sở hữu | Không sở hữu |
|---|---|---|
| M01 | Language preference (nút đổi ngôn ngữ trên mọi màn du khách), recommendation, `OfflinePackage`/`OfflineResource` lifecycle, Start và handoff v3 hiện tại | QR scanning, session progress, source-content administration |
| M02 | `PlaySession`, `CheckpointVisit`, copied journey, local progress, terminal sync queue và trang mở từ link QR | Route/package administration, M01 context mutation, M03 source mutation |
| M03 | Routes, thư viện checkpoint dùng chung, QR objects và link QR công khai, `Revision`, media, publication review, snapshots, audit, admin roles, persisted `SessionRecord` và reports | Visitor field progress, device package, remote interruption of running sessions |

## Contract liên module

| Hướng | Contract | Điều kiện chính |
|---|---|---|
| M03 → M01 | Published Route | Canonical fields; M01 chỉ chọn `HOAT_DONG` có `activeContentVersion`. |
| M03 → M01 | `JourneySnapshot` | Bất biến; chứa toàn bộ checkpoint active; tài nguyên offline theo từng mã QR chỉ cho `OFFLINE_REQUIRED`; sơ đồ tuyến offline và dung lượng ước tính là tùy chọn. |
| M01 → M02 | `LanguagePreference` | Required `languageCode: Enum(vi, en)`; thay đổi độc lập với session/package. |
| M01 → M02 | `SelectedRouteContext v3` | Atomic, UUID handoff dùng một lần, hạn 24 giờ, manifest metadata đầy đủ. |
| M01 → M02 | `OfflinePackage` | M02 chỉ đọc active `SAN_SANG`; `resources[]` chứa M01-owned `OfflineResource` values theo từng mã QR và có thể `CURRENT` hoặc `OUTDATED`. |
| M03 → M02 | `LiveQrLookupResult` với `LiveStationContent` | Tra mọi mã quét khi online; `VALID` (kèm nội dung của mã), `TEMPORARILY_CLOSED` hoặc `INVALID`; lỗi nguồn khác `INVALID`. |
| M03 → M02 | Link QR công khai `{QR_PUBLIC_BASE_URL}/q/{qrIdentifier}` | Mã in ra là link cố định; camera điện thoại mở trang của M02. |
| M02 → M03 | `SessionSyncRecord` | UUID, terminal, immutable, anonymous; identical retry idempotent, changed retry conflict; M03 kiểm tra từng điểm đã quét theo snapshot. M03 lưu accepted business fields thành `SessionRecord` và bổ sung M03-owned `ingestedAt`. |
| Auth Provider ↔ M03 | Admin identity | Provider sở hữu credential; M03 sở hữu role/status ứng dụng. |

## Giới hạn hệ thống

- M01 có thể Start offline chỉ khi đã có package `SAN_SANG`; trạng thái đóng mới nhất có thể chưa được biết.
- Check-in khóa theo `(sessionId, checkpointId)`, không theo từng QR vật lý; lượt ghé chỉ được ghi khi lần quét được chấp nhận (online `VALID`, hoặc offline với mã thuộc journey đã đóng băng).
- Journey của M02 được chốt từ handoff; M02 không dựng lại journey từ M03.
- Khi online, nội dung của mọi mã quét lấy từ tra cứu M03; package chỉ dùng khi offline hoặc tra cứu lỗi.
- Đóng route/checkpoint ảnh hưởng lượt đọc/Start mới và làm tra cứu trả thông báo khu vực tạm đóng; không chủ động cảnh báo hoặc ngắt phiên đã chạy.
- Phiên chỉ được nhận diện trong cùng trình duyệt; quét từ camera ở trình duyệt khác là khách tự do.
- Reports chỉ chứa terminal sessions đã đồng bộ thành công và không phải realtime.
- Canonical contracts là logical; physical APIs/tables thuộc tài liệu thiết kế tương ứng.

## Nguồn

- [Specification M01](../spec/spec-M01.md) v3.2
- [Specification M02](../spec/spec-M02.md) v3.2
- [Specification M03](../spec/spec-M03.md) v3.6
