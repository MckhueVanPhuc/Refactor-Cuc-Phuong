# Motion UI contract — 006

Giao diện nội bộ giữa `src/shared/motion`, `src/shared/ui`, `src/shared/mascot` và các màn M01/M02. Không phải contract liên module của AGENTS §3.2. Hình thức (thời lượng, màu, cỡ) lấy từ design-system §4.3.1–4.3.2, §5.3, §5.4, §7, §9.

## 1. Thuộc tính gốc

| Thuộc tính trên `<html>` | Giá trị | Ai ghi | Ai đọc |
|---|---|---|---|
| `data-motion` | `full` \| `reduced` | `useMotionAttributes()` trong `App.tsx` | Mọi CSS Module có chuyển động (selector `:root[data-motion='full'] …`) |
| `data-decor` | `on` \| `off` | như trên | CSS T3 (`:root[data-decor='on'] …`) |

CSS chuyển động **không** được chạy khi thiếu thuộc tính (mặc định an toàn = đứng yên), trừ phản hồi T1 dạng màu.

## 2. `src/shared/motion` (mới; không import `src/modules`, `src/app`)

| Export | Kiểu | Hành vi |
|---|---|---|
| `getMotion`, `setMotion`, `subscribeMotion`, `useMotion` | store | Chuyển từ `shared/mascot/motion.ts` (giữ re-export ở chỗ cũ) |
| `useMotionLevel()` | `{ level: 'full' \| 'reduced'; decor: boolean }` | data-model §2 |
| `useMotionAttributes()` | hook | Ghi `data-motion`, `data-decor` lên `document.documentElement` |
| `MotionSwitch` | component | `role="switch"`, `aria-checked`; nhãn `mascot.motion`, câu phụ `mascot.motionHint`; luôn render (không phụ thuộc cờ Mila) |
| `useReveal(id)` | ref callback | data-model §4; phần tử trong viewport lúc mount không ẩn |
| `LeafConfetti` | component | Props `count ≤ 40`, `onDone`; `aria-hidden`, `pointer-events: none`; chỉ render khi `decor` |

## 3. `src/shared/ui` (bổ sung)

| Thành phần | API | Ghi chú |
|---|---|---|
| `ProgressTrail` | `{ value: number; max: number; label: string } \| { indeterminate: true; label: string }` | `role="progressbar"`; xác định: `aria-valuenow/max`, phần đã đi `scaleX(value/max)`, `footprint.svg` ở đầu; không xác định: không `aria-valuenow`, vệt trôi `--duration-shimmer` |
| `Button` | không đổi API | thêm phản hồi nhấn (CSS) |

## 4. Tên chuyển cảnh (`<ViewTransition name>`)

| Tên | Phần tử | Màn |
|---|---|---|
| `route-cover-{routeId}` | Ảnh thẻ tuyến | SCR-M01-001, SCR-M01-002 (kết quả) |
| `route-cover-{routeId}` | Ảnh đầu màn chi tiết (ảnh đầu tiên) | SCR-M01-003 |
| (không tên) | Nội dung `Outlet` | VisitorLayout, FieldLayout |

Mỗi tên chỉ xuất hiện một lần trên một màn.

## 5. Mila (bổ sung vào contract của gói 005)

| Mục | Thay đổi |
|---|---|
| `PoseId` | + `sorry`, `amazed`, `walk`, `peek`, `proud` |
| Ảnh | `assets/mascot/web/ma-12-sorry`, `ma-14-amazed`, `ma-15-walk`, `ma-16-peek`, `ma-17-proud` (240/480); khung 2: `ma-15-walk-f2`, `ma-21-wave-f2`, `ma-22-cheer-f2`; chớp mắt `ma-20-proud-blink` |
| `frame2Asset(pose)` | `wave`, `cheer`, `walk` → ảnh khung 2 hoặc `null` |
| `AnimationId` | + `walk` (AN-WALK: 2 bước, ≤ 1200ms) |
| Fallback | thiếu ảnh → `sorry→confused`, `amazed→thumbsUp`, `walk→map`, `peek→rest`, `proud→cheer` |
| `MascotMotionSwitch` | bỏ; dùng `MotionSwitch` (§2) |

## 6. Điểm gắn trên màn (chỉ trình bày)

| Màn | Tệp | Gắn |
|---|---|---|
| SCR-M01-001 | `CatalogPage.tsx`, `RouteCard.tsx` | lớp nắng/lá trong hero; `useReveal`; `ViewTransition` ảnh thẻ; skeleton CSS |
| SCR-M01-002 | `RecommendResultsPage.tsx` | `useReveal`; `ViewTransition` ảnh thẻ |
| SCR-M01-003 | `RouteDetailPage.tsx`, `PackagePanel.tsx` | `ViewTransition` ảnh đầu; skeleton ảnh đầu; `ProgressTrail indeterminate` + ✓ |
| SCR-M01-004 | `OfflinePage.tsx` | `MotionSwitch` luôn hiện; `ProgressTrail indeterminate` + ✓ |
| SCR-M02-001 | `TripPage.tsx`, `RouteJourneyMap.tsx` | `ProgressTrail` xác định; mở khóa (`takeUnlock`) |
| SCR-M02-002/004 | `ScanContent.tsx` | `markUnlock` cạnh lời phát `m02.content.backPressed` |
| SCR-M02-003 | `EndPage.tsx` | huy hiệu "đóng dấu", `LeafConfetti`, danh sách lần lượt; `CONFLICT` → trái tim, không slot |
| Layout | `VisitorLayout.tsx`, `FieldLayout.tsx`, `App.tsx` | `ViewTransition` quanh `Outlet`; `useMotionAttributes` |
