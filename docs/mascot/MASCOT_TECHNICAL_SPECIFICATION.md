# Mascot Technical Specification

| Trường | Giá trị |
|---|---|
| Trạng thái | **PROPOSED**. Chưa được phép cài cho tới khi có change brief và gói Spec-Kit được duyệt |
| Ngày | 2026-11-20; cập nhật 2026-11-22 theo spec-Mascot v1.1 (CHG-MASCOT-2026-11-22-02) và 2026-11-23 theo spec-Mascot v1.3 (CHG-MASCOT-2026-11-23-04); §2, §5 đồng bộ với code của gói specs/005 ngày 2026-11-23 (T071) |
| Nền tảng hiện có | React 19, React Router 8 (data mode), Vite 8 + vite-plugin-pwa (Workbox `generateSW`), Dexie (IndexedDB `visitorDb`), CSS Modules + token (`src/shared/ui/tokens.css`, lint cấm literal màu/px ngoài tokens), i18n tự viết theo module (`vi.ts`/`en.ts`, kiểu `typeof vi`) |

## 1. Nguyên tắc kiến trúc

1. **Chỉ frontend, xác định, không backend.** Không bảng, API, Edge Function, dịch vụ AI hay realtime nào mới. Mọi luật chạy trên máy.
2. **Không đổi logic nghiệp vụ.** Điểm tích hợp chỉ là **một lời gọi `emit` không chờ** ở chỗ code đã có kết quả. Không đổi kiểu trả về, thứ tự ghi IndexedDB hay luồng điều hướng.
3. **Tôn trọng ranh giới module** (đang được kiểm bởi `src/modules/m0x/architecture.test.ts`):
   - Engine nằm ở `src/shared/mascot/`, **không import module nào**.
   - M01 và M02 chỉ import `emit` từ `src/shared/mascot/events`.
   - Host React nằm ở `src/app/mascot/`. Lớp app được phép đọc ngôn ngữ qua public API của M01 (`src/modules/m01/index.ts` đã export `useLanguagePreference`, `resolveDisplayLanguage`).
4. **Không thêm dependency runtime** (tech-stack §12; plan M01/M02 Constitution VII).
5. **Hỏng thì im** (MAS-BR-12). Mọi lỗi của mascot bị chặn trong error boundary riêng; app chạy như chưa có mascot.

## 2. Thành phần

```text
src/shared/mascot/                    # Engine thuần và thành phần màn dùng; module M01/M02 chỉ import index.ts
├── index.ts         # public entry: emitMascotEvent, holdMascotSignal, isMascotEnabled, MascotSlot, MascotFigure, MascotMotionSwitch, useMascotConfirms
├── events.ts        # (3) MascotEvent (union có kiểu) + emit/subscribe; bus trong bộ nhớ; giữ tạm sự kiện tới trước host
├── types.ts         # Mode, PoseId, Intent (kèm `slot` ưu tiên), MascotState, RuleResult (kèm `end`)
├── machine.ts       # (4) reducer thuần: (state, event, ctx) → { state, effects }; luật an toàn; lịch cử chỉ tự động
├── rules.ts         # bảng MAS-B-xxx: sự kiện/hẹn giờ → intent (messageId, pose, mode, priority, slot); hẹn giờ không hoạt động của danh mục và scanner nằm ở đây
├── arbiter.ts       # ưu tiên, hàng đợi 1 mục, cooldown, giới hạn câu chủ động (State Machine §5)
├── config.ts        # ngưỡng thời gian (giá trị tạm, MAS-D-11)
├── assets.ts        # (7) registry: poseId → { src240, src480 }, ảnh chớp mắt (import ảnh qua Vite)
├── flag.ts          # công tắc phát hành VITE_FEATURE_MASCOT
├── motion.ts        # công tắc chuyển động (trong bộ nhớ); v1.4 chuyển sang src/shared/motion/ (specs/006)
├── slots.ts         # registry slot: màn đăng ký chỗ, host đọc
├── visitConfirm.ts  # Mila xác nhận lượt ghé thay toast (BR-MAS-24)
├── MascotSlot.tsx   # chỗ đặt Mila trong layout của màn (host portal vào)
├── MascotFigure.tsx # hình tĩnh INLINE cạnh câu cố định (không bong bóng, không logic)
├── MascotMotionSwitch.tsx # công tắc chuyển động ở SCR-M01-004
└── dialogue/        # (5) catalog.ts + vi.ts + en.ts (Dialogue Library §4)

src/app/mascot/                       # Lớp React gắn một lần trong App.tsx, nạp lazy (chunk `mascot`) khi cờ bật
├── loadHost.ts      # cờ tắt → không import() host
├── MascotHost.tsx   # (2)(6) subscribe bus, chạy machine, render vào slot (slot ý định chỉ định, rồi slot đăng ký sau cùng); đọc ngôn ngữ, route, visibility, network, reduced motion, thao tác
├── Mascot.tsx       # (1) ảnh + bong bóng (nút × chỉ đóng bong bóng); chạm ảnh → `mascot.user.tapped`; không logic
├── MascotIntro.tsx  # (1) lớp phủ giới thiệu INTRO (v1.3)
├── useTypewriter.ts # chữ bong bóng hiện dần
├── Mascot.module.css, MascotIntro.module.css # (6) animation AN-xx bằng token
└── MascotBoundary.tsx # error boundary: lỗi → HIDDEN
```

Số trong ngoặc là 8 lớp được yêu cầu tách:

| # | Lớp | Ở đâu |
|---|---|---|
| (1) | UI component | `Mascot.tsx` |
| (2) | Behavior controller | `MascotHost.tsx` gọi `machine.ts` + `arbiter.ts` |
| (3) | Event bus | `events.ts` |
| (4) | State machine | `machine.ts` |
| (5) | Dialogue library | `dialogue/` |
| (6) | Animation manager | Lớp CSS theo `AN-xx` (`data-mascot-animation`); thời lượng giữ nằm trong intent (`holdMs`), không nghe `animationend` |
| (7) | Asset registry | `assets.ts` |
| (8) | Preference | **Không có** (quyết định 2026-11-21: bỏ chế độ yên lặng và nút ẩn). Mascot không lưu gì |

## 3. Event bus

```ts
// src/shared/mascot/events.ts (minh họa, không phải mã cuối)
export type MascotEvent =
  | { type: 'm01.language.selected'; language: 'vi' | 'en' }
  | { type: 'm02.scan.resolved'; display: 'LIVE' | 'PACKAGE' | 'CLOSED' | 'INVALID' | 'CONNECTION_NEEDED';
      freeVisitor: boolean; visitCreated: boolean; finalPromptNeeded: boolean; inJourney: boolean }
  | { type: 'm02.visit.recorded'; k: number; n: number; isFinal: boolean }
  // … đủ danh mục ở State Machine §4.2
  ;

export function emitMascotEvent(event: MascotEvent): void {
  if (!enabled) return;                       // cờ VITE_FEATURE_MASCOT (MAS-D-08)
  queueMicrotask(() => {                      // không chạy đồng bộ trong luồng nghiệp vụ
    for (const listener of listeners) {
      try { listener({ ...event, at: Date.now() }); } catch { /* MAS-BR-12 */ }
    }
  });
}
```

- **Phát sau khi việc nghiệp vụ xong.** Ví dụ `m02.visit.recorded` phát khi `ScanContent` render với `scan.visitCreated`, tức là sau khi `recordVisit` đã commit (FR-M02-007).
- **Không phụ thuộc thứ tự.** Nếu host chưa mount (ví dụ chunk lazy), sự kiện bị bỏ, không xếp hàng. Mascot không bao giờ là nơi lưu trạng thái nghiệp vụ.
- **Tính `k`, `n`** dựa trên dữ liệu M02 đã có (`useSessionVisits`, `journeyCheckpoints`) tại nơi phát, rồi đưa số vào payload. Engine không đọc IndexedDB.

## 4. Điểm phát sự kiện trong code hiện có

| Tệp | Vị trí | Sự kiện |
|---|---|---|
| `src/modules/m01/language/LanguageGate.tsx` | Sau `writeLanguagePreference` resolve | `m01.language.selected` |
| `src/modules/m01/language/LanguageControl.tsx` | Sau khi đổi | `m01.language.changed` |
| `src/modules/m01/catalog/CatalogPage.tsx` | Effect theo `catalog.status` | `m01.catalog.loaded` |
| `src/modules/m01/recommendation/RecommendPage.tsx` | Mount; sau khi tính kết quả | `m01.recommend.opened`, `.resolved` |
| `src/modules/m01/route-detail/StartPanel.tsx` | IntersectionObserver; sau `startRoute` | `m01.routeDetail.startPanelVisible`, `m01.start.resolved` |
| `src/modules/m01/route-detail/OfflineDecisionDialog.tsx` | Mount | `m01.offlineDecision.opened` |
| Nơi gọi `packageOps` (`PackagePanel.tsx`, `OfflinePage.tsx`) | Trước và sau `await` | `m01.package.downloadStarted`, `.resolved` |
| `src/modules/m02/session/TripPage.tsx` | `useTripEntry` xong; `setScanning`; đầu `handleText`; kết quả ở lại màn | `m02.trip.entered`, `.shown`, `m02.scanner.opened/closed`, `.detected`, `m02.scan.resolved` |
| `src/modules/m02/scanner/QrScanner.tsx` | `setCameraFailed(true)` | `m02.scanner.cameraFailed` |
| `src/modules/m02/content/ScanContent.tsx` | Mount với `scan` | `m02.scan.resolved`, `m02.visit.recorded` |
| `src/modules/m02/content/MediaList.tsx` | `play`/`pause`/`ended` | `m02.media.playing/stopped` |
| `src/modules/m02/end/FinalPrompt.tsx` | Mount; hai nút | `m02.finalPrompt.*` |
| `src/modules/m02/end/EndPage.tsx` | Mount với `state.sessionId`; đổi `sync` | `m02.trip.ended`, `m02.sync.statusChanged` |
| `src/modules/m02/qr-link/QrLinkPage.tsx` | Có kết quả | `m02.scan.resolved` |

Mỗi điểm phát được thêm kèm một test: test hành vi cũ vẫn PASS nguyên vẹn, và sự kiện được phát đúng payload.

## 5. Slot và layout

- Màn khai báo `<MascotSlot id="trip-dock" modes={['DOCK']} />` ở chỗ trống thật trong layout (ví dụ hàng chứa nút Quét QR). Mascot render vào slot qua portal, nên **không nổi đè** lên phần tử khác. `MascotSlot` và `MascotFigure` nằm ở `src/shared/mascot/` (module M01/M02 không import `src/app/`).
- INLINE không phải slot: màn đặt `<MascotFigure pose="…" />` ngay cạnh câu cố định (cờ tắt → không render gì).
- Slot đang dùng (contract UI §2 của specs/005):

| Slot | Màn | Mode | INLINE (`MascotFigure`) trên cùng màn |
|---|---|---|---|
| `catalog-hero` | SCR-M01-001 | INTRO, DOCK | Câu rỗng (`rest`), lỗi nguồn (`confused`) |
| `recommend-head` | SCR-M01-002 (form và trang kết quả) | DOCK (v1.5) | Câu không có kết quả (`think`) |
| `start-panel` | SCR-M01-003, phía trên nút Bắt đầu | AVATAR | Lỗi Start (`confused`); đầu dialog quyết định offline (`backpack`) |
| `package-panel` | SCR-M01-003, SCR-M01-004 (dòng gói vừa bấm tải) | AVATAR | Câu lỗi gói (`confused`); SCR-M01-004 rỗng (`rest`) |
| `trip-dock` | SCR-M02-001 | DOCK | Từ chối handoff / không chuyến; `INVALID`, `CONNECTION_NEEDED` (`confused`) |
| `scanner-bottom` | Overlay scanner của SCR-M02-001 (dải dưới, ngoài khung) | AVATAR | Câu camera (`confused`) |
| `content-toast` | SCR-M02-002/004 (cạnh toast) | AVATAR | Câu nguồn dự phòng từ gói (`backpack`); gợi ý khách tự do (`map`) |
| `end-hero` | SCR-M02-003 | CELEBRATE, DOCK | Dialog cuối chuyến (`cheer`); bản ghi `CONFLICT` (`confused`) |

- Một màn có hai slot cùng mode (SCR-M01-003): luật đặt `slot` trong intent để Mila vào đúng chỗ.
- Slot giữ chỗ theo mode cố định lớn nhất nó nhận (CELEBRATE `xl`, DOCK `md` hoặc cỡ DOCK riêng, AVATAR `sm`; INTRO không giữ chỗ). Ngoại lệ: `package-panel` chỉ chiếm chỗ khi có Mila (`:empty` → ẩn), để không đẩy nút tải khỏi hàng trạng thái.
- Màn Quét QR SCR-M02-005 dùng chung scanner nhưng ngoài phạm vi spec-Mascot: không slot, không hình.
- Bong bóng đặt trong slot, không bao giờ trong `FieldNotice`/`SourceNotice`.
- Kích thước bằng token (`--mascot-size-sm/md/xl`, cỡ DOCK `--mascot-size-dock-*`, `--mascot-bubble-max-width`; design-system §9.2). Lint token vẫn áp.
- `pointer-events: none` cho phần ảnh khi mascot ở INLINE; ảnh mascot (chạm để nhận gợi ý) và nút × của bong bóng có vùng chạm ≥ 44 px.

## 6. Hiệu năng và pin

- Ảnh WebP 240 px precache; 480 px nạp bằng `<img srcset>` theo DPR, `loading="lazy"`, `decoding="async"`. Ảnh mascot không bao giờ là phần tử LCP (không có trên `/q/…` lúc đầu, MAS-BR-10).
- Animation chỉ `transform`/`opacity`, có `will-change` trong lúc chạy rồi gỡ ra.
- Vòng lặp của một phản ứng ≤ 5 s mỗi lượt (`MASCOT_LOOP_MAX_MS`); cử chỉ tự động (BR-MAS-21) là một hẹn giờ ngẫu nhiên 4–7 s (v1.5), thở nhẹ giữa hai cử chỉ là animation CSS lặp, không timer JS, trong cùng cơ chế `nextDeadline`, không `setInterval`; dừng hết khi `document.hidden` hoặc công tắc chuyển động tắt.
- Chớp mắt đổi ảnh MA-20 (đã nạp sẵn cùng ảnh tư thế), không tải ảnh lúc chớp.
- Hẹn giờ không hoạt động dùng một `setTimeout` duy nhất được đặt lại, không dùng `setInterval`.
- Engine tách chunk `mascot` (vẫn precache), nạp sau khi màn đầu đã hiện (`requestIdleCallback`, có fallback `setTimeout`).
- Ngân sách: MAS-NFR-01, 02.

## 7. Truy cập (WCAG 2.1 AA, design-system §6)

- Ảnh mascot `alt=""` (trang trí); ý nghĩa luôn có ở chữ.
- Bong bóng là chữ thật trong DOM, `lang` theo ngôn ngữ. **Không** dùng `aria-live` cho bong bóng P4–P7, để không đọc chồng lên toast hoặc banner đã có `role="status"/"alert"`. Bong bóng P2 có thông tin mới (ví dụ MAS-MSG-046, 048, 052) dùng `role="status"`.
- Không chiếm focus; nút × và CTA nằm trong thứ tự tab tự nhiên của slot.
- Tương phản bong bóng (v1.1, kiểu "Giấy dã ngoại", design-system §9.3): nền `--mascot-bubble-surface` (#fffaf0), chữ `m01-ink` (14.52:1); trên scanner dùng `--color-m02-scanner-surface` + `--color-m02-scanner-text` (12.86:1) kèm viền `secondary` như quy tắc §5.3.
- Giảm chuyển động theo MAS-FR-12.
- Công tắc "Hiệu ứng chuyển động" (BR-MAS-21; nhãn v1.4) ở màn Tài nguyên SCR-M01-004 (v1.3; v1.1 đặt ở thanh đầu trang); v1.4 hiện cả khi cờ Mila tắt: `<button role="switch" aria-checked>`, vùng chạm 44 px; tắt thì engine ngừng lịch cử chỉ và component bỏ `data-mascot-animation`, chữ hiện ngay. Đây là cơ chế tạm dừng cho WCAG 2.2.2.
- Chữ hiện dần: phần tử chữ hiển thị dần có `aria-hidden`, một bản đầy đủ cho trình đọc màn hình (ẩn thị giác) để câu được đọc một lần.
- Thông báo tạm đóng: mascot rời DOM (không chỉ ẩn bằng CSS), để trình đọc màn hình chỉ đọc thông báo an toàn.

## 8. Offline

- Mọi tệp mascot (JS, WebP 240, SVG lá) nằm trong precache. Workbox `globPatterns` hiện chưa gồm `webp`; plan sẽ thêm một mẫu hẹp chỉ cho `assets/mascot-*.webp`, để ảnh nền JPG không vô tình vào precache.
- Không mạng: mọi hành vi chạy bình thường; câu phụ thuộc mạng đã gắn điều kiện (State Machine §8).
- Dữ liệu mascot không đi qua service worker hay Supabase.

## 9. Cờ tính năng

`VITE_FEATURE_MASCOT` (public, không phải secret). Khi `off`: `emitMascotEvent` là no-op, `MascotHost` không mount, các slot render rỗng. Biến đã ghi vào `docs/architecture/environment.md` (2026-11-21, OD-MAS-15); `.env.example` cập nhật ở giai đoạn code.

## 10. Backend

Không cần. Mascot không ghi bất kỳ dữ liệu nào ra khỏi trình duyệt. Huy hiệu và câu đố (FUTURE): huy hiệu tính từ dữ liệu cục bộ có thể vẫn chỉ cần frontend; câu đố do M03 soạn sẽ cần đổi contract `LiveStationContent`/`JourneySnapshot`, migration và Edge, nên phải có change brief riêng.

## 11. Mở rộng cho gamification sau này

- Thêm sự kiện mới vào union `MascotEvent` (TypeScript báo mọi `switch` thiếu nhánh).
- Thêm dòng vào `rules.ts` và câu vào `dialogue/`. Không đụng component.
- Đổi renderer (sprite, Rive) chỉ thay `Mascot.tsx`; machine, arbiter và dialogue giữ nguyên.
