# Contract — Giao diện của Mila (slot, component, catalog)

**Package**: `specs/005-visitor-mascot/` · Nguồn: spec-Mascot §5.1, §5.6; design-system §4.3, §9; bảng copy screen spec SCR-M01-001…004, SCR-M02-001…004.

## 1. Component dùng chung (`src/shared/mascot/`)

```tsx
// chữ ký, không phải mã cuối
<MascotSlot id={SlotId} modes={Array<'INTRO' | 'DOCK' | 'AVATAR' | 'CELEBRATE'>} onCta?={(cta: CtaId) => void} />
<MascotFigure pose={PoseId} size="md" />   // INLINE: ảnh tĩnh, không bong bóng, không logic
```

- `MascotSlot` giữ chỗ theo kích thước token của mode lớn nhất nó nhận (không nhảy layout khi Mila xuất hiện), đăng ký vào registry, và để trống khi host không dùng. Cờ `off` → không render gì.
- `MascotFigure` là `<img alt="" aria-hidden="true">` trong khung token; ảnh lỗi → không render. Cờ `off` → không render.
- Thuộc tính kiểm thử: `data-mascot-slot="<id>"`, `data-mascot-mode`, `data-mascot-pose`, `data-mascot-message="<MSG-MAS-nnn>"` trên bong bóng, `data-mascot-figure="<pose>"`.

## 2. Slot theo màn

| SlotId | Màn / vị trí | Modes | INLINE (`MascotFigure`) cạnh |
|---|---|---|---|
| `catalog-hero` | SCR-M01-001, trong hero | INTRO, DOCK | — |
| — | SCR-M01-001 | — | Câu rỗng "Hiện chưa có tuyến nào để chọn." (`rest`); câu lỗi nguồn (`confused`) |
| `recommend-head` | SCR-M01-002, cạnh tiêu đề | AVATAR | Câu "Chưa có tuyến phù hợp…" (`think`) |
| `start-panel` | SCR-M01-003, trong panel Bắt đầu, phía trên nút | AVATAR | Câu lỗi Start (`confused`) |
| `package-panel` | SCR-M01-003 và SCR-M01-004, trong panel gói | AVATAR | Câu "Chưa cập nhật được…" (`confused`) |
| — | Dialog quyết định offline | — | Đầu dialog (`backpack`) |
| — | SCR-M01-004 | — | Câu "Bạn chưa tải tuyến nào." (`rest`) |
| `trip-dock` | SCR-M02-001, cùng hàng với nút Quét QR | DOCK | Câu từ chối handoff / không có chuyến (`confused`) |
| `scanner-bottom` | Overlay `QrScanner`, dải dưới khung, cùng vùng câu hướng dẫn | AVATAR | Câu camera cố định (`confused`) |
| — | Thông báo ở lại màn `INVALID`, `CONNECTION_NEEDED` | — | `confused` |
| — | Dialog `FinalPrompt` | — | Đầu dialog (`cheer`) |
| `content-toast` | SCR-M02-002, SCR-M02-004 (có phiên), sát toast lượt ghé | AVATAR | — |
| — | SCR-M02-004 không phiên | — | Cạnh gợi ý khách tự do (`map`) |
| `end-hero` | SCR-M02-003, cạnh huy hiệu | CELEBRATE, DOCK | Bản ghi `CONFLICT` (`confused`) |

Không có slot hay figure ở: bước chọn ngôn ngữ, khối Cảnh báo an toàn, `ScanNotice kind=CLOSED`, thân bài, `Gallery`, `MediaList`, dialog xóa gói, `UpdatePrompt`, mọi màn M03.

## 3. Host (`src/app/mascot/`)

- `App.tsx` nạp `MascotHost` bằng `import()` chỉ khi cờ `on`, render ngang hàng `UpdatePrompt`, truyền `pathname` và `navigate` của router (như `UpdatePrompt` nhận `pathname`).
- Host bọc trong error boundary riêng: lỗi → `HIDDEN`, app không đổi (BR-MAS-16).
- Host render vào slot qua `createPortal`: ảnh (`<button aria-label="Hỏi Mila">` ở DOCK/AVATAR; `aria-hidden` ở INTRO/CELEBRATE), bong bóng (`<p lang>` + nút đóng `aria-label="Đóng lời nhắn"` + CTA).
- Không gọi `focus()`; không `position: fixed` ngoài slot; INTRO chỉ được phép tràn lên trên hero trong giới hạn `--mascot-size-lg` và không đè thẻ tuyến đầu tiên.

## 4. Token mới (`src/shared/ui/tokens.css`, design-system §9.2)

| Token | Giá trị |
|---|---|
| `--mascot-size-sm` / `-md` / `-lg` | 56px (v1.1) / 72px / 160px |
| `--mascot-size-dock-catalog` / `-dock-trip` / `-dock-end` (v1.1) | 112px / 128px / 104px |
| `--mascot-size-xl` (v1.1) | 200px (INTRO, CELEBRATE) |
| `--mascot-bubble-max-width` | 240px (v1.1) |
| `--mascot-bubble-surface` (v1.1) | #fffaf0 |
| `--duration-mascot-enter` / `-exit` / `-pop` / `-hop` / `-celebrate` | 250ms / 200ms / 200ms / 600ms / 2400ms |
| `--duration-mascot-loop` | 1200ms (chu kỳ; v1.1: tối đa 4 vòng ≈ 4,8 s, R-25) |
| `--duration-mascot-milestone` / `-ambient` / `-blink` (v1.1) | 1200ms / ≤ 1500ms / 120ms |

Mọi `--duration-mascot-*` = 0ms trong khối `@media (prefers-reduced-motion: reduce)` hiện có.

## 4a. Bổ sung v1.1

- `MascotSlot` nhận `size?: 'catalog' | 'trip' | 'end'` → `data-mascot-dock`; slot `catalog-hero` dùng `catalog`, `trip-dock` dùng `trip`, `end-hero` dùng `end` (R-21).
- `MascotMotionToggle` (export từ `src/shared/mascot/index.ts`): `<button type="button" aria-pressed>` tên "Chuyển động của Mila" / "Mila's motion", chữ "Chuyển động: bật/tắt" (ẩn dưới 360px), icon `pause.svg` / `play.svg` mới trong `assets/icons/`; vùng chạm 44px; không render khi cờ tắt. Đặt trong header của `src/modules/m01/layout/VisitorLayout.tsx` và `src/modules/m02/layout/FieldLayout.tsx`, bên trái VI/EN (design-system §9.5).
- Bong bóng kiểu A: dòng tên "Mila" (`aria-hidden`), chữ hiện dần (phần hiện dần `aria-hidden`, bản đầy đủ `.visually-hidden` giữ `lang`, `role`), góc 6px phía Mila theo `data-mascot-tail` (R-20, R-21).
- `motion === 'off'` hoặc giảm chuyển động: không `data-mascot-animation`, không lá rơi, chữ hiện ngay.

## 4b. Bổ sung v1.2 — xác nhận lượt ghé (BR-MAS-24; research R-26)

- `useMascotConfirms(visitRef?: string): 'pending' | 'mascot' | 'toast'` (export từ `src/shared/mascot/index.ts`). `ScanContent` hiện toast "Đã ghi nhận lượt quét." chỉ khi kết quả là `toast`; lượt ghé điểm cuối khi Mila bật: không toast.
- Host gọi `markVisitConfirmed(visitRef)` khi bong bóng 050/051/055/058 của lượt ghé đó lên màn; báo `failed` khi Mila ẩn vì lỗi.
- Bong bóng xác nhận: `role="status"`.

## 5. Catalog (`src/shared/mascot/dialogue/`)

- `vi.ts`, `en.ts`: khóa `MSG-MAS-001…075`, `MSG-MAS-057a…e`, nhãn `ask`, `dismiss`, `notNow`, `ctaRecommend`, `ctaSeeAll`, `ctaCloseCamera`; `en: typeof vi`. Câu có tham số là hàm `({ k, n, count, cheer }) => string`. `{name}` đã thay bằng `Mila` trong chữ.
- `catalog.ts`: `{ priority, cooldownMs | 'pageLoad' | 'session' | 'route', autoHide: boolean, cta?: CtaId[], role?: 'status' }` theo [Dialogue Library](../../../docs/mascot/MASCOT_DIALOGUE_LIBRARY.md).
- Chữ phải trùng ký tự với bảng copy screen spec; test so chuỗi nhãn CTA với `src/modules/m01/i18n`, `src/modules/m02/i18n`.

## 6. Ảnh (`assets/mascot/web/`)

v1.1: thêm `ma-20-<tư thế>-blink-240.webp` cho map, binoculars, thumbs-up, backpack, rest (R-24). `ma-01-wave`, `ma-02-map`, `ma-03-think`, `ma-04-backpack`, `ma-05-binoculars`, `ma-06-magnifier`, `ma-07-thumbs-up`, `ma-08-cheer`, `ma-09-confused`, `ma-10-rest`, `ma-11-avatar`, `ma-13-point`; mỗi tư thế `-240.webp` và `-480.webp` (avatar `-96`/`-192`). Chưa có ảnh production → registry trả hình giữ chỗ CSS (research R-08).
