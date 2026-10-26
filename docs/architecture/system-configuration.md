# System Configuration / Runtime Architecture

## Purpose and boundary

Tài liệu này mô tả cấu hình runtime của Cúc Phương Quest trong phạm vi MVP M01–M03: các thành phần đang chạy, nơi đặt ba module, các vùng lưu trữ, luồng dữ liệu quan trọng, cách hệ thống hoạt động khi offline và các contract tích hợp.

Baseline nghiệp vụ và contract là toàn bộ Spec M01, M02, M03 version 2.0 hiện hành. Khi mô tả kiến trúc cũ khác với các spec này, tài liệu kiến trúc được cập nhật theo spec.

MVP sử dụng hai runtime environment: Preview (dùng cho phát triển, testing và nghiệm thu trên Vercel Preview và một Supabase Preview project riêng) và Production (cho bản phát hành/demo MVP trên Vercel Production và Supabase Production project riêng); máy phát triển local là development workstation chạy tooling/test và không cần Supabase project riêng. Cấu hình theo environment nằm tại [Environment Configuration](environment.md). Backend trên máy/Docker không phải điều kiện của workflow này.

## System Configuration Diagram

```mermaid
flowchart TB
    staticHost["Static web hosting<br/>Vercel"]

    subgraph device["Visitor/Admin device — Browser/PWA runtime"]
        subgraph webClient["Web client"]
            m01["M01<br/>Route Planning & Preparation"]
            m02["M02<br/>Field Quest Experience"]
            m03["M03<br/>Operations & Content Administration"]
        end

        cache["Cache Storage<br/>app shell + vi/en resources"]
        shared["IndexedDB — M01 shared data<br/>LanguagePreference<br/>SelectedRouteContext v2<br/>OfflinePackage + OfflineResource"]
        sessionStore["IndexedDB — M02 local data<br/>PlaySession<br/>CheckpointVisit<br/>PendingSyncItem with SessionSyncRecord"]
    end

    subgraph backend["Backend/data platform — Supabase"]
        serviceBoundary["Data API + authenticated RPC<br/>public projections / database transactions"]
        edge["Edge Functions<br/>terminal intake + Auth Admin boundary"]
        auth["Supabase Auth<br/>admin identity and credential lifecycle"]
        database["Postgres<br/>source data, snapshots, SessionRecord, reports"]
        objectStorage["Object Storage<br/>published media objects"]
    end

    staticHost -->|"serves web client"| webClient

    m01 <-->|"app shell / i18n"| cache
    m01 -->|"atomic publish"| shared
    shared -->|"read-only contracts"| m02
    m02 <-->|"persist / restore progress and sync queue"| sessionStore

    m03 <-->|"admin sign-in/session"| auth
    m03 <-->|"authenticated administration"| serviceBoundary
    m01 <-->|"Published Route + JourneySnapshot"| serviceBoundary
    m02 <-->|"LiveStationContent"| serviceBoundary
    m02 <-->|"terminal SessionSyncRecord / acknowledgement"| edge
    m03 <-->|"account administration"| edge
    edge -->|"validated terminal transaction / account state"| serviceBoundary
    edge <-->|"privileged identity operations"| auth

    serviceBoundary <--> database
    m03 <-->|"authorized media upload"| objectStorage
    objectStorage -->|"declared image bytes"| m01
    objectStorage -->|"online media"| m02
```

Sơ đồ thể hiện topology runtime và hướng dữ liệu logic. Data API/RPC và Edge Functions thuộc cùng Supabase platform. Browser đọc public projections qua Data API/RLS và media qua Storage; không có proxy Edge bắt buộc cho mọi request. Physical payload/schema chi tiết nằm ngoài tài liệu này.

## Runtime components and responsibilities

| Runtime component | Responsibility in MVP | Module placement |
|---|---|---|
| Static web hosting | Phân phối một web client cho public visitor routes và protected administration routes. | Chứa artifact của M01, M02, M03; không sở hữu business data. |
| Browser/PWA runtime | Chạy UI, QR interaction, online requests và offline behavior trên thiết bị hiện tại. | M01 và M02 là public flows; M03 là authenticated, online-only flow. |
| Cache Storage | Giữ app shell và resource i18n `vi/en` cần để mở ứng dụng khi offline. | M01 quản lý phạm vi chuẩn bị/offline của visitor client. |
| IndexedDB — M01 shared data | Giữ preference, handoff hiện tại, package active và candidate/staging chưa công bố. | M01 ghi; M02 chỉ đọc các contract đã công bố. |
| IndexedDB — M02 local data | Giữ phiên, lượt ghé checkpoint và terminal sync record chưa được xác nhận. | M02 sở hữu và ghi liên tục. |
| Backend service boundary | Data API/RLS cho reads, authenticated RPC cho commands/transactions và reports. | Phục vụ cả M01–M03; không tạo thêm business module thứ tư. |
| Edge Functions | Validate terminal intake và xử lý privileged Auth Admin calls trước khi gọi platform/database operations. | M02 sync và M03 account administration; không proxy public reads. |
| Authentication provider | Xác thực admin, quản lý invitation/credential/session; không sở hữu application role/status. | Hỗ trợ M03; application role/status thuộc dữ liệu M03. |
| Database | Giữ source data của route/checkpoint/QR/content, revision/public state, immutable `JourneySnapshot`, persisted `SessionRecord` và dữ liệu report. | M03 là owner nghiệp vụ; M01/M02 chỉ đọc hoặc gửi contract được phép. |
| Object storage | Giữ media được M03 quản lý và backend công bố/tham chiếu. | M03 quản lý ảnh/audio/video; package offline chỉ sao chép text song ngữ và ảnh tĩnh cần thiết. |

Backend MVP không có message broker, background queue, cron hoặc scheduler riêng. Snapshot được tạo trong luồng publication nguyên tử; report được query theo yêu cầu; retry terminal session do M02 thực hiện từ local queue.

## Module placement and ownership

| Module | Runs in | Owns at runtime | Reads from other boundaries | Must not mutate |
|---|---|---|---|---|
| M01 — Route Planning & Preparation | Public web-client routes | `LanguagePreference`, `SelectedRouteContext v2`, lifecycle của `OfflinePackage`, `OfflineResource` và candidate staging | Published Route, `JourneySnapshot` từ backend/M03 | M02 session/progress; M03 source data |
| M02 — Field Quest Experience | Public web-client routes | `PlaySession`, `CheckpointVisit`, frozen session journey và pending `SessionSyncRecord` | M01 shared contracts; `LiveStationContent` từ backend/M03 | M01 context/package; M03 source data |
| M03 — Operations & Content Administration | Protected, online-only web-client routes plus backend-owned operations/data | Route, checkpoint, QR, content/media, revision/publication, snapshot, admin role/status, persisted `SessionRecord` và reports | Admin identity/session từ Auth; `SessionSyncRecord` từ M02 | Visitor local package, handoff hoặc running-session progress |

M03 `JourneySnapshot` là nguồn cho M01 `OfflinePackage.manifest` và `SelectedRouteContext v2.routeJourneyManifest`. Khi tạo phiên, M02 sao chép handoff manifest thành `PlaySession.journeyCheckpoints`; `RouteJourneyMap` là view chỉ đọc, có thứ tự, của mảng frozen này, không phải contract hoặc entity M03 riêng. Nguồn: Spec M01 §5.3; Spec M02 §1, §5.1 và §6; Spec M03 §5.1 và §11.

Closure ở M03 không trực tiếp sửa dữ liệu trên thiết bị. Khi M01 đọc thành công trạng thái route không còn khả dụng, M01 chặn Start mới và đánh dấu current context của route là `REVOKED`; package vẫn được giữ và phiên M02 đã tạo tiếp tục độc lập (Spec M01 US-M01-05, BR-M01-011).

## Data placement and ownership

| Data/contract | Runtime location | Writer/owner | Reader/consumer | Runtime invariant |
|---|---|---|---|---|
| App shell, bundled i18n `vi/en` | Cache Storage | Web client/M01 offline lifecycle | M01, M02 | Có thể mở và dùng phần đã bundle khi offline. |
| `LanguagePreference` | Shared client data in IndexedDB | M01 | M01, M02 | Singleton với `languageCode: Enum(vi, en)`; đổi ngôn ngữ không thay package/session. |
| `SelectedRouteContext v2` | Shared client data in IndexedDB | M01 | M02 read-only | Một current context; ghi atomic sau Start hợp lệ; `handoffId` mới cho mỗi Start. |
| Active `OfflinePackage` and `OfflineResource` values | IndexedDB | M01 | M01, M02 read-only | M02 chỉ thấy package `SAN_SANG`; `OfflineStationContent` chỉ là M02 read-only view của resource, không phải persisted entity khác; text/ảnh không bị nhân đôi vào handoff. |
| Package candidate/staging | IndexedDB | M01 | M01 only | Không được lộ cho M02; lỗi update giữ nguyên active package cũ. |
| `PlaySession`, frozen journey, `CheckpointVisit` | IndexedDB | M02 | M02 | Khôi phục được sau reload/offline; visit duy nhất theo `(sessionId, checkpointId)`. |
| `PendingSyncItem` containing `SessionSyncRecord` | IndexedDB | M02 | M02 sync process | Queue item giữ terminal payload bất biến đến khi success hoặc conflict; chỉ `syncStatus` thay đổi. |
| Published Route and `JourneySnapshot` | Database/public backend projection | M03 | M01; heritage journey cho M02 qua handoff | Snapshot đã công bố là bất biến; public/version switch nguyên tử. |
| `LiveStationContent` | Database/object storage through public backend read | M03 | M02 | Chỉ active public QR/checkpoint/content; source failure khác invalid QR. |
| Administrative source/revision/audit data | Database | M03 | Authorized M03 users | Write đi qua server-side authorization/concurrency/publication rules. |
| Persisted `SessionRecord` and report data | Database | M03 after `SessionSyncRecord` intake | M03 reports | Accepted business fields bất biến; M03 bổ sung `ingestedAt`; identical retry idempotent, changed retry conflict. |

`Media` metadata thuộc Database; byte của image/audio/video đã phát hành thuộc Object Storage và được tham chiếu qua `sourceRef`. `LiveStationContent` là public transport projection từ source hiện hành, không phải một persisted entity riêng.

`introductionText` là tên field được dùng nhất quán trong các Spec M01–M03 hiện tại cho nội dung giới thiệu offline. Không có field `storytellingText` trong bộ nguồn hiện tại; tài liệu này không đổi tên domain field.

## Important runtime data flows

### M03 publication to M01/M02

1. M03 gửi authenticated administration command qua backend boundary.
2. Backend ghi source/revision data và, khi publication ảnh hưởng journey, tạo `JourneySnapshot` bất biến.
3. Khi phát hành lần đầu hoặc thay đổi ảnh hưởng journey, public state, `activeContentVersion` và snapshot mới được chuyển nguyên tử sau khi publication thành công. Metadata ngoài snapshot có thể được phát hành mà không đổi `contentVersion` (Spec M03 BR-M03-004–007).
4. M01 đọc Published Route và `JourneySnapshot` để browse, recommend, prepare package và Start.
5. M02 không cập nhật journey đang chạy từ publication mới. Với checkpoint `ONLINE_AVAILABLE` hoặc QR ngoài journey, M02 đọc live public content tại thời điểm sử dụng.

### M01 offline preparation and handoff to M02

1. M01 đọc snapshot hiện hành và xác định các checkpoint `OFFLINE_REQUIRED`.
2. M01 tải full manifest cùng bilingual `introductionText` và ảnh tĩnh được khai báo thành các candidate `OfflineResource` values.
3. Chỉ sau khi manifest, text và toàn bộ ảnh khai báo được kiểm tra đầy đủ, M01 mới atomic-switch candidate thành active `OfflinePackage` `SAN_SANG`.
4. Khi Start hợp lệ, M01 ghi atomic `SelectedRouteContext v2`; context chứa journey metadata nhưng không nhân đôi offline text/ảnh.
5. M02 đọc context, current language và package active nếu có, rồi sao chép manifest thành frozen journey của `PlaySession`.

### QR check-in and content selection

1. M02 phân giải `qrIdentifier` về `checkpointId` dựa trên frozen journey khi QR thuộc journey hiện tại.
2. M02 ghi `CheckpointVisit` trước khi tải content; lỗi content không rollback lượt ghé hợp lệ.
3. Với `OFFLINE_REQUIRED`, M02 đọc `OfflineResource` theo `checkpointId` từ active ready package của M01 qua read-only `OfflineStationContent` view.
4. Với `ONLINE_AVAILABLE`, M02 đọc `LiveStationContent` từ backend/M03; spec không định nghĩa offline fallback.
5. QR active nằm ngoài journey chỉ dùng live lookup/content và không tạo progress. QR invalid/withdrawn phải được phân biệt với lỗi kết nối/nguồn.

### Terminal session sync and reporting

1. Khi session chuyển `HOAN_TAT` hoặc `BO_DO`, M02 đóng băng một anonymous `SessionSyncRecord` và ghi vào local sync queue.
2. M02 gửi record qua terminal-session intake của backend khi có thể; kết thúc trải nghiệm không bị chặn bởi trạng thái mạng.
3. M03 lưu accepted business fields thành immutable `SessionRecord` theo `sessionId` và bổ sung `ingestedAt`; retry cùng normalized business payload trả success, payload khác với cùng ID trả conflict và không ghi đè.
4. RPT-01/RPT-02 chỉ đọc các `SessionRecord` đã ingest thành công; report không phản ánh record còn nằm trên thiết bị và không phải realtime.

## Offline runtime architecture

| Situation | Runtime behavior |
|---|---|
| App opened without network | App shell và i18n được đọc từ Cache Storage; local preference/context/package/session được đọc từ IndexedDB. |
| Source appears online but request fails | Không dùng riêng trạng thái kết nối của browser để coi nguồn là khả dụng; kết quả request thực tế quyết định online path. |
| Online Start | M01 xác nhận route và current published snapshot từ backend, sau đó atomic-write handoff. |
| Offline Start with ready package | M01 dùng manifest của active package `SAN_SANG`; package có thể `OUTDATED` nhưng vẫn dùng được với cảnh báo khi biết trạng thái. |
| Offline Start without ready package | Start bị chặn vì không có manifest hợp lệ để tạo handoff. |
| Package download/update interrupted | Candidate không được công bố; active ready package trước đó vẫn đọc được. |
| `OFFLINE_REQUIRED` content | M02 đọc bilingual text và ảnh tĩnh từ package local theo stable `checkpointId`. |
| `ONLINE_AVAILABLE` content while offline | Hiển thị content unavailable; không có offline fallback được định nghĩa. |
| Session progress while offline/reload | M02 tiếp tục ghi local và khôi phục cùng `PlaySession`/visits. |
| Session becomes terminal while offline | Immutable `SessionSyncRecord` ở local queue và được retry sau; Finish không chờ sync. |
| M03 administration loses connectivity | Save báo lỗi; M03 không có offline draft synchronization. |
| Route/checkpoint closes remotely | Không xóa package và không cảnh báo/ngắt running session. Khi M01 đọc được route không còn khả dụng, M01 chặn Start mới và chuyển current context của route sang `REVOKED`; khi chưa biết closure do offline, Start vẫn tuân theo ready package local. |

Không có cross-device recovery. Xóa browser data có thể làm mất preference, package, context, session, visits và pending sync record trên thiết bị đó.

## Integration contracts

| Direction | Logical contract | Runtime transport/location | Required boundary behavior |
|---|---|---|---|
| M03 → M01 | Published Route | Public backend read | Chỉ route `HOAT_DONG` có `activeContentVersion` hợp lệ mới selectable. |
| M03 → M01 | `JourneySnapshot` | Public backend read | Full active journey, immutable by `(routeId, contentVersion)`; `offlineResource` chỉ bắt buộc cho `OFFLINE_REQUIRED`. |
| M01 → M02 | `LanguagePreference` | Shared IndexedDB data | Required `languageCode: Enum(vi, en)`; M02 chỉ đọc. |
| M01 → M02 | `SelectedRouteContext v2` | Atomic shared IndexedDB value | `AUTHORIZED`, UUID handoff chưa dùng, full manifest; context không chứa offline resource bytes. |
| M01 → M02 | Active `OfflinePackage` with `OfflineResource` values | Shared IndexedDB data | Chỉ `SAN_SANG`, có `CURRENT` hoặc `OUTDATED`; M02 dùng `OfflineStationContent` như read-only view; staging/partial data không được expose. |
| M03 → M02 | `LiveStationContent` | Public backend read + media reference | Active live QR/content data; phân biệt invalid/withdrawn QR với source failure. |
| M02 → M03 | `SessionSyncRecord` | Backend terminal-session intake | Chỉ `HOAN_TAT` hoặc `BO_DO`, anonymous, immutable; accepted fields được lưu thành M03 `SessionRecord` cộng `ingestedAt`; retry idempotent hoặc conflict như phần Terminal session sync and reporting. |
| Auth provider ↔ M03 | Admin identity/session | Supabase Auth runtime | Provider sở hữu credential lifecycle; M03 sở hữu fixed role và account status. |

Các contract trên là logical contract. Runtime split Edge/RPC đã chốt ở phần Runtime decisions; physical endpoint, table/column và bucket thuộc implementation design.

## Traceability

| Area in this document | Source baseline |
|---|---|
| Module boundary, ownership and cross-module contracts | [Spec M01](../spec/spec-M01.md), [Spec M02](../spec/spec-M02.md), [Spec M03](../spec/spec-M03.md), [System Context](context-diagram.md) |
| Offline package, handoff and browser persistence | [Spec M01](../spec/spec-M01.md) §§4–6; previous `system-configuration.md` runtime decisions |
| Session, QR/content selection and terminal sync | [Spec M02](../spec/spec-M02.md) §§4–6; [Sequence Diagrams](sequence-diagrams.md) |
| Publication, snapshots, Auth/data/media and reports | [Spec M03](../spec/spec-M03.md) §§3–6; previous `system-configuration.md` runtime decisions |
| MVP inclusion and exclusions | [MVP Scope](../../MVP-Scope.md) |

Các BRD M01–M03 không tồn tại trong working tree tại thời điểm refactor; ba module spec version 2.0 tự khai báo là implementation source of truth và được dùng làm behavioral/contract baseline hiện hành.
