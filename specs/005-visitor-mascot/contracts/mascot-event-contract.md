# Contract — Sự kiện của Mila (nội bộ trình duyệt)

**Package**: `specs/005-visitor-mascot/` · **Loại**: interface nội bộ frontend, **không** phải contract liên module của AGENTS.md §3.2 (không có producer/consumer dữ liệu nghiệp vụ). Nguồn hành vi: spec-Mascot §5.2.

## 1. API

```ts
// src/shared/mascot/events.ts — chữ ký, không phải mã cuối
export type MascotEvent = /* union ở §3 */;
export function emitMascotEvent(event: MascotEvent): void;               // không throw, không trả promise
export function subscribeMascotEvents(listener: (e: MascotEvent & { at: number }) => void): () => void; // chỉ host dùng
```

Quy tắc bắt buộc cho mọi điểm phát:

1. Phát **sau** khi việc nghiệp vụ đã xong (dữ liệu đã ghi, kết quả đã có). Không `await` lời gọi.
2. Không đổi kiểu trả về, nhánh điều kiện hay thứ tự ghi dữ liệu của mã hiện có. Một điểm phát = một lời gọi (cộng tính `k`/`n` nếu cần từ dữ liệu đã đọc sẵn).
3. Payload chỉ gồm enum có sẵn, số đếm, boolean và ref opaque. Không nội dung bài, tên điểm, tên du khách, id thiết bị.
4. Cờ `VITE_FEATURE_MASCOT=off` → no-op.

## 2. Tên

`<nguồn>.<miền>.<động từ quá khứ camelCase>`; nguồn ∈ `app`, `m01`, `m02`, `mascot` (State Machine §4.1).

## 3. Danh mục

| Event `type` | Payload | Điểm phát (tệp hiện có) | Behavior |
|---|---|---|---|
| `m01.language.selected` | `{ language }` | `src/modules/m01/language/LanguageGate.tsx` — sau `writeLanguagePreference` resolve | MAS-B-001…003 |
| `m01.language.changed` | `{ language }` | `src/modules/m01/language/LanguageControl.tsx` — sau ghi | MAS-B-080 |
| `m01.catalog.loaded` | `{ status: 'ready' \| 'unavailable', count, stale, slow }` | `src/modules/m01/catalog/CatalogPage.tsx` — effect theo `catalog.status` (`slow` khi `loading` > 600 ms) | MAS-B-004, 005 |
| `m01.catalog.interacted` | — | `CatalogPage.tsx` — cuộn lần đầu / mở thẻ | Hủy MAS-B-008 |
| `m01.recommend.opened` | — | `src/modules/m01/recommendation/RecommendPage.tsx` — mount | MAS-B-010 |
| `m01.recommend.resolved` | `{ count }` | `RecommendPage.tsx` — sau khi tính kết quả | MAS-B-011, 013 |
| `m01.routeDetail.startPanelVisible` | `{ routeRef, hasSafetyWarning }` | `src/modules/m01/route-detail/StartPanel.tsx` — IntersectionObserver lần đầu | MAS-B-014 |
| `m01.package.downloadStarted` | `{ routeRef, update }` | Nơi gọi `packageOps` (`PackagePanel.tsx`, `OfflinePage.tsx`, `StartPanel.tsx`) — trước `await` | MAS-B-020 |
| `m01.package.resolved` | `{ routeRef, kind: PackageOpResult['kind'], reason?: PackageFailure, update, online }` | Như trên — sau `await` | MAS-B-021, 024…026 |
| `m02.trip.entered` | `{ kind: EntryResult['kind'], hasSession, k, n }` | `src/modules/m02/session/TripPage.tsx` — `useTripEntry` xong | MAS-B-030, 033 |
| `m02.trip.shown` | `{ hasSession, k, n, finalVisited }` | `TripPage.tsx` — mount khi đã có phiên | MAS-B-033, 056, 057 |
| `m02.content.backPressed` | `{ afterNewVisit }` | `src/modules/m02/content/ScanContent.tsx` — `onClick` của `<Link>` "Quay lại" hiện có (`afterNewVisit` = `scan.visitCreated` và không phải điểm cuối); link vẫn điều hướng `/trip` như cũ | Host đánh dấu để `m02.trip.shown` kế tiếp kích hoạt MAS-B-056/057 |
| `m02.scanner.opened` / `m02.scanner.closed` | `{ hasSession, k }` / — | `TripPage.tsx` — `setScanning(true/false)` | MAS-B-040…042, 049 |
| `m02.scanner.cameraStarted` | — | `src/modules/m02/scanner/QrScanner.tsx` — camera đã hiện hình | Bắt đầu đếm MAS-B-040 |
| `m02.scanner.detected` | — | `TripPage.tsx` — đầu `handleText` | MAS-B-043, 044 |
| `m02.scan.resolved` | `{ display: ScanDisplay['kind'], hasSession, freeVisitor, visitCreated, inJourney, finalPromptNeeded }` | `TripPage.tsx` (kết quả ở lại màn) và `src/modules/m02/content/ScanContent.tsx` (dùng chung cho `ContentPage` và `QrLinkPage`, nên `QrLinkPage.tsx` **không** phát riêng) | MAS-B-045…054 |
| `m02.visit.recorded` | `{ sessionRef, visitRef, k, n, isFinal }` | `ScanContent.tsx` — khi `scan.visitCreated` (lượt ghé đã commit trước khi điều hướng). `visitRef` = ref opaque của (phiên, điểm dừng, `checkedInAt`); `ScanContent` mount lại từ router state (lùi/tiến, tải lại) phát lại cùng `visitRef`, engine chỉ phản ứng một lần mỗi `visitRef` trong một lần tải trang | MAS-B-050, 051, 055 |
| `m02.media.playing` / `m02.media.stopped` | `{ type: 'AUDIO' \| 'VIDEO' }` | `src/modules/m02/content/MediaList.tsx` — `play` / `pause` / `ended`; đếm qua `holdMascotSignal`: `playing` khi tệp đầu tiên phát, `stopped` khi tệp cuối cùng dừng | MAS-B-058 |
| `m02.notice.closedShown` | — | `ScanNotice.tsx` khi `kind = CLOSED` | MAS-B-045 (dự phòng cho `scan.resolved`) |
| `m02.notice.autoEndShown` / `Hidden` | — | `src/modules/m02/layout/FieldLayout.tsx` — `useAutoEndNotice` | MAS-B-035 |
| `m02.finalPrompt.opened` / `continued` / `ended` | — | `src/modules/m02/end/FinalPrompt.tsx` | MAS-B-060, 061 |
| `m02.trip.ended` | `{ status: 'HOAN_TAT' \| 'BO_DO', k, justEnded }` | `src/modules/m02/end/EndPage.tsx` — mount (`justEnded` khi có `state.sessionId`) | MAS-B-062, 063 |
| `m02.sync.statusChanged` | `{ status: 'PENDING' \| 'SYNCED' \| 'CONFLICT', online }` | `EndPage.tsx` — `useSyncStatus` đổi | MAS-B-070…072 |
| `app.dialog.changed` | `{ open, kind: 'FINAL_PROMPT' \| 'OTHER' }` | `src/shared/ui/Dialog.tsx` (`OTHER`: `open: true` khi hộp thoại đầu tiên mở, `open: false` khi hộp cuối cùng đóng, qua `holdMascotSignal`) và `FinalPrompt.tsx` (`FINAL_PROMPT`) | Chặn bong bóng khi có dialog khác dialog cuối chuyến (BR-MAS-08) |
| `app.route.changed` | `{ path }` | Host (từ `pathname` App truyền vào) | MAS-B-083 |
| `app.visibility.changed` | `{ visible }` | Host (listener) | MAS-B-034, 084 |
| `app.network.changed` | `{ online }` | Host (listener) | MAS-B-074, 075 |
| `mascot.user.tapped` / `mascot.user.closedBubble` / `mascot.user.ctaPressed` | `{ cta? }` | Component trong host | MAS-B-009, 032, 059; đóng bong bóng; CTA |

Ghi chú: `m02.notice.closedShown` là lưới an toàn — nếu một luồng nào hiện thông báo tạm đóng mà không qua `scan.resolved`, Mila vẫn rời màn (BR-MAS-03).

## 4. CTA

CTA không chạy logic nghiệp vụ trong host. Host phát `mascot.user.ctaPressed`; hành động thật do màn đăng ký qua slot:

| CTA | Hành động | Ai thực hiện |
|---|---|---|
| "Gợi ý tuyến" (MSG-MAS-008) | Điều hướng `/recommend` | Host bằng `<Link>`/`navigate` tới `PATHS.recommend` (chỉ điều hướng) |
| "Xem tất cả tuyến" (MSG-MAS-013) | Điều hướng `/` | Như trên, `PATHS.catalog` |
| "Đóng camera" (MSG-MAS-049) | Đóng scanner như nút đóng hiện có | `QrScanner` đăng ký callback `onClose` vào slot `scanner-bottom` |
| "Chưa" (MSG-MAS-049) | Chỉ đóng bong bóng | Host |
