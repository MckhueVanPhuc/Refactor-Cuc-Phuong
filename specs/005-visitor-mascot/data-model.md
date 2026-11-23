# Data Model — 005 Mascot Mila

**Package**: `specs/005-visitor-mascot/` · **Date**: 2026-11-21

## 1. Không có dữ liệu bền vững

Mila không tạo, đọc hay ghi canonical entity nào (spec-Mascot §6, BR-MAS-01, 18). Không store IndexedDB mới, không đổi schema `visitorDb`, không `localStorage`, không migration, không contract liên module. Mọi cấu trúc dưới đây là **UI state tạm thời trong bộ nhớ của trang**; tải lại trang là mất (BR-MAS-06).

Dữ liệu nghiệp vụ Mila hiển thị (số điểm đã quét `k`, tổng `n`, trạng thái đồng bộ) do M01/M02 đọc từ nguồn hiện có rồi đưa vào payload sự kiện ([contract sự kiện](contracts/mascot-event-contract.md)); engine không truy cập IndexedDB (research R-15).

## 2. Cấu trúc trong bộ nhớ

### 2.1 MascotContext (do host cập nhật)

| Trường | Kiểu logic | Nguồn | Dùng cho |
|---|---|---|---|
| `path` | String | Router (`App.tsx` đã theo dõi cho `UpdatePrompt`) | Đổi màn → hủy bong bóng, hẹn giờ (MAS-B-083) |
| `slots` | Map&lt;slotId, { modes[], element }&gt; | Registry `MascotSlot` | Chọn chỗ hiển thị (R-07) |
| `language` | Enum(`vi`, `en`) | `resolveDisplayLanguage(useLanguagePreference(), navigator.language)` | Chọn câu (FR-MAS-003) |
| `visible` | Boolean | `document.visibilityState` | BR-MAS-08 |
| `online` | Boolean | `navigator.onLine` + sự kiện `online`/`offline` | MAS-B-074/075 |
| `reducedMotion` | Boolean | `matchMedia` | BR-MAS-17, 19 |
| `hasSession` | Boolean | Payload sự kiện M02 (R-15) | BR-MAS-14, MAS-B-074 |
| `blockers` | Set&lt;`DIALOG` \| `MEDIA` \| `CLOSED` \| `AUTO_END_NOTICE`&gt; | Sự kiện M02 | BR-MAS-03, 08 |

### 2.2 MascotState (trong reducer)

| Trường | Kiểu logic | Ràng buộc |
|---|---|---|
| `status` | Enum(`HIDDEN`, `INTRO`, `IDLE`, `SPEAKING`, `BUSY`, `CELEBRATING`, `SUPPRESSED`) | Chuyển theo [State Machine](../../docs/mascot/MASCOT_STATE_MACHINE.md) §7 (T11 đã bỏ; T12 = chạm hỏi) |
| `mode` | Enum(`INTRO`, `DOCK`, `AVATAR`, `CELEBRATE`) \| null | INLINE không thuộc reducer (R-07) |
| `pose` | Enum `PoseId` (MA-01…11, MA-13) | Registry ảnh |
| `bubble` | `{ messageId, params, priority, shownAt, sticky }` \| null | Tối đa một (BR-MAS-05); `sticky` khi có CTA |
| `queued` | `{ intent, enqueuedAt }` \| null | Tối đa một; bỏ sau `MASCOT_QUEUE_TTL_MS`; không nhận P5–P7 |
| `lastShownAt` | Map&lt;messageId, Instant&gt; | Cooldown theo message (BR-MAS-06) |
| `proactiveLog` | Array&lt;Instant&gt; | Cửa sổ trượt `MASCOT_PROACTIVE_WINDOW_MIN`, tối đa `MASCOT_PROACTIVE_LIMIT` mục (BR-MAS-07) |
| `lastEventAt` | Map&lt;eventKey, Instant&gt; | Bỏ sự kiện trùng trong 500 ms (BR-MAS-06) |
| `streaks` | `{ invalid, connectionNeeded, emptyRecommend, packageFail: Map<routeRef, n> }` | Reset khi kết quả khác hoặc đổi màn (BR-MAS-10) |
| `scanner` | `{ openedAt, stage: 0..3, helpShown, cameraOffShown }` \| null | BR-MAS-09; null khi đóng |
| `onceFlags` | Set&lt;`INTRO`, `WELCOME_BACK_CATALOG`, `SCANNER_GUIDE`, `CATALOG_HINT`, `RECOMMEND_OPENED`, `FIRST_VISIT:<sessionRef>`, `HALFWAY:<sessionRef>`, `VISIT:<visitRef>` (một phản ứng cho mỗi lượt ghé, chống lặp khi trang nội dung mount lại), `SAFETY:<routeRef>`…&gt; | "Một lần mỗi tải trang / phiên / tuyến" |
| `poolCursor` | Map&lt;poolId, number&gt; | Xoay `{cheer}`, MSG-MAS-057a–e tất định |
| `natureTurn` | Number | Luân phiên 056 / 057 (BR-MAS-13) |
| `hiddenAt` | Instant \| null | Tính MAS-B-034 (≥ `MASCOT_WELCOME_BACK_MIN`) |

| `motion` (v1.1) | Enum(`on`, `off`) | Từ store `motion.ts` (R-17); đầu tiên `off` khi giảm chuyển động; chỉ trong bộ nhớ |
| `lastActivityAt` (v1.1) | Instant \| null | `app.user.activity`; luật "đang thao tác" (BR-MAS-20, R-19) |
| `lastGesture` (v1.1) | Id cử chỉ \| null | Không lặp cử chỉ liền nhau (BR-MAS-21) |
| `lastTapAt`, `tapLog` (v1.1) | Instant, Array<Instant> | Chạm dồn 400 ms; chóng mặt 5 lần / 3 s (BR-MAS-22) |
| `helpCursor` (v1.1) | Number | Xoay câu chạm của màn có nhiều câu (009 → 012) |
| `counters['screen:k']`, `counters['screen:n']`, `scannerOpen` (v1.1) | Number, Boolean | Chọn câu chạm SCR-M02-001 (033 với {r} = n − k; 043 khi scanner mở); xóa khi đổi màn |

`sessionRef`, `routeRef` là giá trị opaque lấy từ payload để đếm "một lần"; không hiển thị, không lưu (Constitution: id opaque không render).

### 2.3 Intent và Effect

- **Intent** (v1.1 thêm `source: 'user' | 'event' | 'timer' | 'ambient'` — R-18, R-19, R-22) (kết quả tra bảng luật): `{ behaviorId: 'MAS-B-xxx', priority: P0..P7, mode, pose, animation, messageId?, params?, cta?, durationMs? }`.
- **Effect** (lệnh cho host): `show(mode, pose)`, `hide()`, `setPose(pose)`, `play(animationId)`, `showBubble(messageId, params, role)`, `clearBubble()`, `setTimer(kind, ms)`, `clearTimer(kind)`, `vibrate(ms)`.

## 3. Ràng buộc kiểm chứng

| Ràng buộc | Nguồn | Test |
|---|---|---|
| Không bảng/store/khóa lưu trữ mới | BR-MAS-01, spec-Mascot §6 | MAS-TC-041 (schema `visitorDb` không đổi), quét `localStorage` không có khóa `cpq:mascot*` |
| `SessionSyncRecord` không đổi | BR-MAS-01 | MAS-TC-042 (test parity hiện có) |
| Payload sự kiện không chứa nội dung bài, tên, id thiết bị | BR-MAS-18 | Test kiểu + review contract |
| Tối đa một bong bóng, một mục chờ | BR-MAS-05 | MAS-TC-003 |
