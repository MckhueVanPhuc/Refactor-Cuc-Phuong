# Data model — 006 Motion & micro-interactions

Không có entity, trường, store IndexedDB, migration hay dữ liệu gửi đi mới (change brief §5; spec Key Entities). Mọi thứ dưới đây là **UI state trong bộ nhớ của lần tải trang**, mất khi tải lại.

## 1. Trạng thái công tắc chuyển động

| Thuộc tính | Kiểu | Nguồn | Ghi chú |
|---|---|---|---|
| `motionOn` | boolean | Công tắc "Hiệu ứng chuyển động" (SCR-M01-004) | Khởi đầu `!prefers-reduced-motion`; không lưu (BR-MAS-18, OD-MOT-03) |

Nơi ở: `src/shared/motion/store.ts` (chuyển từ `src/shared/mascot/motion.ts`). Đổi giá trị phát `mascot.motion.changed` cho engine Mila như hiện nay.

## 2. Mức chuyển động hiệu lực (suy ra, không lưu)

| Trường | Giá trị | Quy tắc |
|---|---|---|
| `level` | `full` \| `reduced` | `reduced` khi `motionOn = false` hoặc `prefers-reduced-motion: reduce` |
| `decor` | `on` \| `off` | `off` khi `level = reduced`, hoặc `navigator.connection.saveData = true`, hoặc `navigator.deviceMemory ≤ 2`; trình duyệt không báo → coi là `on` |

Phản chiếu lên DOM: `<html data-motion="…" data-decor="…">`; cập nhật khi công tắc đổi, khi media query đổi, khi `connection` báo `change`.

| Tầng | `level = full`, `decor = on` | `level = full`, `decor = off` | `level = reduced` |
|---|---|---|---|
| T1 | chạy | chạy | màu/opacity ≤ 150 ms |
| T2 | chạy | chạy | tức thì; skeleton/thanh đứng yên |
| T3 | chạy | không | không |
| Mila | theo spec-Mascot | theo spec-Mascot | đứng yên (BR-MAS-17, 21) |
| Rung (BR-MAS-19) | có | có | không |

## 3. Dấu "vừa có lượt ghé mới"

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `checkpointId` | string | Điểm vừa ghi lượt ghé lần đầu |
| (suy ra) | number | Thanh tăng từ k − 1 lên k; SCR-M02-001 tự tính từ số lượt ghé, không lưu |

Nơi ở: `src/modules/m02/journey/unlockSignal.ts`. Ghi khi du khách bấm "Quay lại" từ nội dung của một lượt ghé mới không phải điểm cuối (cùng điều kiện `afterNewVisit` của `m02.content.backPressed`). Đọc **một lần** khi SCR-M02-001 mount (`takeUnlock`), rồi xóa. Không phải dữ liệu chuyến, không vào `PlaySession`, `CheckpointVisit` hay `SessionSyncRecord`.

## 4. Thẻ đã hiện dần

`Set<string>` id thẻ đã chạy reveal trong lần tải trang (`src/shared/motion/reveal.ts`), để cuộn lại không chạy lại.

## 5. Gói vừa sẵn sàng

Giá trị `candidate` lần render trước (`useRef`) trong `PackagePanel` / dòng gói của `OfflinePage`: `downloading` → sẵn sàng trong lần mở màn này thì hiện dấu ✓ một lần.
