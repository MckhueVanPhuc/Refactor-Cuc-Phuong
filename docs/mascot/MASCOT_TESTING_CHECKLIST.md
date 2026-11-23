# Mascot Testing Checklist

| Trường | Giá trị |
|---|---|
| Trạng thái | **PROPOSED**. Chưa có test nào được viết hay chạy |
| Ngày | 2026-11-20; cập nhật 2026-11-22 theo spec-Mascot v1.1 (CHG-MASCOT-2026-11-22-02) |
| Công cụ hiện có | Vitest + Testing Library (unit/component), Playwright (E2E: `m01`, `m02`, `m02-cam-evil`, `*-local-stack`), test lint token, kiểm thủ công trên thiết bị thật (checklist M1–M10 của M02) |

Quy ước: **Auto** = test tự động; **Manual** = kiểm tay; **Device** = máy thật. Báo cáo kết quả theo AGENTS.md §6: chỉ ghi PASS khi đã chạy thật; chưa chạy thì ghi `NOT RUN`.

## 1. Engine (Vitest, không cần trình duyệt)

| ID | Kiểm | Loại |
|---|---|---|
| MAS-TC-001 | Mỗi dòng MAS-B-xxx trong `rules.ts` sinh đúng `messageId`, tư thế, mode, P cho đúng điều kiện | Auto |
| MAS-TC-002 | P0 `CLOSED` ngắt mọi trạng thái, xóa hàng đợi, sang `SUPPRESSED` | Auto |
| MAS-TC-003 | P cao ngắt P thấp; cùng P trước 1,5 s thì xếp hàng; hàng đợi tối đa 1 mục; TTL 4 s | Auto |
| MAS-TC-004 | Cooldown: cùng ID không hiện lại trong cooldown; tải lại trang thì reset | Auto |
| MAS-TC-005 | Sự kiện trùng trong 500 ms chỉ xử lý một lần | Auto |
| MAS-TC-006 | Pool không lặp biến thể liền kề; không dùng `Math.random` | Auto |
| MAS-TC-007 | Hẹn giờ scanner 15/30/90 s chạy đúng với đồng hồ giả; mỗi lần mở scanner tối đa 1 câu hỏi giúp | Auto |
| MAS-TC-008 | Trang ẩn: mọi hẹn giờ dừng; hiện lại: chạy lại từ 0 | Auto |
| MAS-TC-009 | Mẫu "bị kẹt": 2 `INVALID` liên tiếp → MAS-B-046; `INVALID` rồi `LIVE` rồi `INVALID` → không | Auto |
| MAS-TC-010 | Không có nút ẩn/thu nhỏ; mascot luôn có mặt ở slot của màn; nút × chỉ đóng bong bóng; chạm mascot cho đúng một câu gợi ý của màn | Auto |
| MAS-TC-011 | Giới hạn 3 câu chủ động P5–P7 trong 10 phút | Auto |
| MAS-TC-012 | Reducer thuần: cùng đầu vào → cùng đầu ra (snapshot) | Auto |

## 2. Tích hợp với M01/M02 (component + E2E)

| ID | Kiểm | Loại |
|---|---|---|
| MAS-TC-020 | Chọn ngôn ngữ lần đầu → INTRO; tải lại trang (đã có ngôn ngữ) → không INTRO, có MAS-B-004 | Auto (E2E `m01`) |
| MAS-TC-021 | Mở `/q/{id}` lần đầu → **không** INTRO, nội dung hiện như cũ | Auto (E2E `m02`) |
| MAS-TC-022 | Quét mã hợp lệ lần đầu → toast cũ + bong bóng "{k}/{n}" đúng số; nội dung không bị trì hoãn | Auto |
| MAS-TC-023 | Quét lại điểm đã có lượt ghé → không ăn mừng | Auto |
| MAS-TC-024 | Mã điểm cuối → dialog cuối chuyến hiện **ngay** (BR-M02-021), mascot nằm trong dialog, focus vào dialog như cũ | Auto |
| MAS-TC-025 | `TEMPORARILY_CLOSED` (mọi trường hợp) → mascot không có trong DOM; thông báo tạm đóng nguyên văn | Auto |
| MAS-TC-026 | Mã ngoài hành trình có phiên → MAS-MSG-052; không có lượt ghé (logic cũ) | Auto |
| MAS-TC-027 | Khách tự do → không có câu tiến độ | Auto |
| MAS-TC-028 | Tải gói: bắt đầu → MAS-B-020; xong → MAS-B-021; lỗi lưu trữ → MAS-B-025 (dùng `failNextActivation` có sẵn) | Auto |
| MAS-TC-029 | Media đang phát → không bong bóng nào xuất hiện | Auto |
| MAS-TC-030 | Màn kết quả: CELEBRATE chỉ khi vừa kết thúc; tải lại trang → INLINE tĩnh | Auto |
| MAS-TC-031 | `PENDING → SYNCED` khi màn đang mở → AN-THUMB, không có câu "đã gửi" trước khi SYNCED | Auto (stack local) |
| MAS-TC-032 | `CONFLICT` → không có nút thử lại nào của mascot | Auto |

## 3. Không hồi quy

| ID | Kiểm | Loại |
|---|---|---|
| MAS-TC-040 | Toàn bộ test hiện có của M01/M02 PASS với cờ mascot **bật** và **tắt** | Auto (`npm run ci`, `npm run e2e`) |
| MAS-TC-041 | Store IndexedDB `visitorDb` không đổi schema; không có bảng mới | Auto |
| MAS-TC-042 | `SessionSyncRecord` gửi đi giống hệt trước (test parity hiện có) | Auto |
| MAS-TC-043 | Test kiến trúc: `src/shared/mascot` không import module nào; M02 vẫn chỉ import M01 qua `m01Port.ts` | Auto |
| MAS-TC-044 | Lỗi trong mascot (giả lập throw trong listener, ảnh 404) → app chạy bình thường, mascot `HIDDEN` | Auto |
| MAS-TC-045 | Cờ `VITE_FEATURE_MASCOT=off` → không có phần tử mascot, không tải chunk `mascot` | Auto |
| MAS-TC-046 | Bundle production không chứa chuỗi test hook mới | Auto (quét `dist/` như hiện làm) |

## 4. Bản địa hóa và câu chữ

| ID | Kiểm | Loại |
|---|---|---|
| MAS-TC-050 | `vi` và `en` có cùng bộ khóa (typecheck) | Auto |
| MAS-TC-051 | Mọi câu ≤ 90 ký tự sau khi thay biến bằng giá trị dài nhất (tên dài nhất, `{n}` = 99) | Auto |
| MAS-TC-052 | Không câu nào chứa từ cấm (Dialogue Library §1, quy tắc 3) | Auto |
| MAS-TC-053 | Đổi VI/EN khi bong bóng đang hiện → đổi ngay, cùng ID | Auto |
| MAS-TC-054 | Câu cố định spec-M02 §5.1 không bị mascot thay hay viết lại | Auto (so chuỗi) |
| MAS-TC-055 | Người bản ngữ đọc bản tiếng Anh: tự nhiên, không dịch từng chữ | Manual |
| MAS-TC-056 | Người dùng thử thấy giọng mascot không trẻ con hóa người lớn | Manual |

## 5. Offline và mạng

| ID | Kiểm | Loại |
|---|---|---|
| MAS-TC-060 | Offline hoàn toàn (Playwright `context.setOffline`) sau lần mở đầu: mascot hiện đủ tư thế ở M02 | Auto |
| MAS-TC-061 | Mất mạng giữa chuyến → MAS-B-074 một lần; mất lần nữa trong 10 phút → không nói lại | Auto |
| MAS-TC-062 | Precache chứa đúng các tệp `mascot-*.webp` cỡ 240 và không chứa JPG nền | Auto (đọc `dist/sw.js`) |
| MAS-TC-063 | Tra mã chậm (mock trễ 5 s) → MAS-B-044 sau 3 s; quá 8 s → kết quả lỗi tra cứu như cũ | Auto |

## 6. Mobile và bố cục

| ID | Kiểm | Loại |
|---|---|---|
| MAS-TC-070 | Ở 320/360/390/430 px: mascot và bong bóng không đè nút Quét, nút Kết thúc chuyến, khung quét, vùng thông báo, toast (so bounding box) | Auto |
| MAS-TC-071 | Scanner: bounding box mascot không giao với khung ngắm | Auto (`m02-cam-evil` dùng camera giả) |
| MAS-TC-072 | Không cuộn ngang ở 320 px; zoom 200% không mất nội dung | Auto + Manual |
| MAS-TC-073 | Dùng một tay: nút × của bong bóng và ảnh mascot (chạm để hỏi) trong tầm ngón cái | Device |
| MAS-TC-074 | Đọc được ngoài nắng gắt | Device |
| MAS-TC-075 | Quét 10 mã liên tiếp: không giật, pin và nhiệt không khác rõ so với khi tắt mascot | Device |

## 7. Truy cập

| ID | Kiểm | Loại |
|---|---|---|
| MAS-TC-080 | `prefers-reduced-motion: reduce` (Playwright `reducedMotion`) → không animation chạy, không lá rơi | Auto |
| MAS-TC-081 | Ảnh mascot có `alt=""`; bong bóng P4–P7 không có `aria-live` | Auto |
| MAS-TC-082 | Mascot không lấy focus khi xuất hiện; Tab đi qua × và CTA theo thứ tự hợp lý | Auto |
| MAS-TC-083 | Tương phản bong bóng ≥ 4.5:1 trên mọi bề mặt | Auto (tính từ token) |
| MAS-TC-084 | TalkBack / VoiceOver: thông báo tạm đóng đọc một mình; toast lượt ghé không bị đọc hai lần | Device |

## 8. Hiệu năng

| ID | Kiểm | Loại |
|---|---|---|
| MAS-TC-090 | Tổng WebP mascot trong precache ≤ ngân sách MAS-NFR-01 | Auto |
| MAS-TC-091 | Chunk `mascot` ≤ 12 KB gzip | Auto |
| MAS-TC-092 | LCP `/q/Q1a` không tăng so với trước (Lighthouse mobile, T096) | Manual |
| MAS-TC-093 | Không vòng animation nào chạy quá 10 s (đo bằng `getAnimations()`) | Auto |

## 9. An toàn

| ID | Kiểm | Loại |
|---|---|---|
| MAS-TC-100 | Không lời thoại nào khuyến khích đi nhanh, quét cho đủ, hay nhìn máy khi đang đi | Manual (review thư viện) |
| MAS-TC-101 | Không có nhắc nhở hẹn giờ (câu chữ) trên SCR-M02-001; cử chỉ tự động không chữ của v1.1 được phép | Auto |
| MAS-TC-102 | Không câu nào ngụ ý phải quét hết mới kết thúc | Manual + Auto (từ cấm) |

## 10. Bổ sung v1.1 (spec-Mascot BR-MAS-12, 20–23; SC-MAS-011…014)

| ID | Kiểm | Loại |
|---|---|---|
| MAS-TC-110 | Chạm Mila theo ngữ cảnh: danh mục 009 rồi 012; chuyến đi k = 0 → 032, có lượt ghé và còn điểm → 033 với {r} đúng; scanner mở → 043; màn kết quả → 065 | Auto |
| MAS-TC-111 | Chạm dồn trong 400 ms tính một lần; chạm khi animation đang chạy không chạy lại; không bao giờ có hai bong bóng | Auto |
| MAS-TC-112 | Chạm 5 lần trong 3 s → chóng mặt (085, ảnh bối rối) một lần mỗi lần tải trang; lần sau chạm như thường | Auto |
| MAS-TC-113 | Ba cấp ăn mừng: điểm thường AN-SUCCESS + 050; điểm đầu, nửa (n ≥ 4), còn 1 (n ≥ 3) AN-MILESTONE + 051/055/058 theo thứ tự ưu tiên; kết thúc đủ điểm 063, sớm 062 | Auto |
| MAS-TC-114 | Cử chỉ tự động chỉ ở SCR-M01-001, SCR-M02-001 (scanner đóng), SCR-M02-003; khoảng cách 8–15 s; không lặp cùng cử chỉ liền nhau | Auto (đồng hồ giả trong engine) |
| MAS-TC-115 | Không cử chỉ tự động ở trang đọc bài, khi phát media, khi có hộp thoại, trong 2 s sau chạm/cuộn/phím (SC-MAS-012) | Auto |
| MAS-TC-116 | Công tắc "Chuyển động" tắt → `getAnimations()` của Mila rỗng trên mọi màn, Mila vẫn hiện, chữ hiện ngay (SC-MAS-011) | Auto |
| MAS-TC-117 | Giảm chuyển động → công tắc khởi đầu ở "tắt" | Auto |
| MAS-TC-118 | Công tắc: `aria-pressed`, tên "Chuyển động của Mila", vùng chạm ≥ 44 px, có ở thanh đầu trang của mọi màn có slot; tắt cờ Mila thì không có công tắc | Auto |
| MAS-TC-119 | Không animation tự chạy nào của một phản ứng kéo dài quá 5 s mỗi lượt (SC-MAS-014) | Auto |
| MAS-TC-120 | Chữ hiện dần: trình đọc màn hình nhận câu đầy đủ một lần; thời lượng tự ẩn tính từ khi chữ hiện đủ | Auto + Device |
| MAS-TC-121 | Bố cục ở cỡ mới (112/128/104/56/200 px) và bong bóng kiểu A ở 320–430 px: không đè, không cuộn ngang | Auto |
| MAS-TC-122 | Chớp mắt dùng ảnh MA-20 đúng tư thế; thiếu ảnh mắt nhắm thì bỏ cử chỉ chớp mắt, không hiện hình giữ chỗ | Auto |

## 11. Bổ sung v1.2 (spec-Mascot BR-MAS-24; SC-MAS-015)

| ID | Kiểm | Loại |
|---|---|---|
| MAS-TC-130 | Lượt ghé mới (không phải điểm cuối) khi Mila hoạt động: bong bóng xác nhận (050/051/055/058) hiện, có `role="status"`; **không** có toast "Đã ghi nhận lượt quét." | Auto |
| MAS-TC-131 | Cờ Mila tắt: toast hiện như cũ; test M02 cũ về toast PASS | Auto |
| MAS-TC-132 | Mila lỗi (ảnh hỏng) hoặc bong bóng chưa hiện sau 1 giây: toast hiện; không bao giờ có cả hai, không bao giờ không có gì | Auto |
| MAS-TC-133 | Điểm cuối khi Mila hoạt động: hộp thoại kết thúc chuyến hiện ngay, không toast, Mila chỉ rung | Auto |
| MAS-TC-134 | 013, 024, 025, 040, 054 không còn chữ (chỉ minh họa); 013 không có nút thứ hai | Auto |

