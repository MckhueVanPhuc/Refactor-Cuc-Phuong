# Design System — Cúc Phương Quest (Visual Direction)

---

## 1. Tổng quan và nguyên tắc

Tài liệu này hướng dẫn màu sắc, kiểu chữ, khoảng cách, bố cục và component dùng lại. Bố cục và kích thước là điểm khởi đầu cho khám phá hình ảnh, có thể điều chỉnh theo độ dài nội dung, viewport và rà soát truy cập.

Hành vi nghiệp vụ và contract thuộc về [Spec M01](../spec/spec-M01.md), [Spec M02](../spec/spec-M02.md), [Spec M03](../spec/spec-M03.md) , [Spec AI Integration](../spec/spec-AI_integration.md) và [Spec Mascot](../spec/spec-Mascot.md). Phần tử, trạng thái và điều hướng chi tiết thuộc về [screen inventory](../../screens/screen%20list/README.md) và các screen specification trong [screens/screen-spec/](../../screens/screen-spec/). Ưu tiên giao hàng thuộc về [MVP Scope](../../MVP-Scope.md). Dùng các nguồn đó cho hành động, quyền, validation và data binding. Giao diện không định nghĩa validation, permission, retry timing, storage behavior hay lifecycle transition.

| Nguyên tắc | Áp dụng hình ảnh |
|---|---|
| Forest identity | Xanh rừng, bề mặt trung tính ấm và điểm nhấn hổ phách tiết chế; hình ảnh thiên nhiên hỗ trợ nội dung. |
| Clear hierarchy | Một tiêu đề chính, metadata được nhóm, văn bản dễ đọc và hành động chính nổi bật. |
| Bilingual composition | Chừa chỗ cho nhãn Việt/Anh xuống dòng; tránh chiều cao chữ cố định. |
| Outdoor readability | Tương phản mạnh, điều khiển lớn, nhãn ngắn cho khách tham quan. |
| Visible status | Màu luôn đi kèm chữ; tách biệt trực quan nguồn nội dung, mức sẵn sàng của gói và độ mới. |
| Calm administration | Không gian làm việc trung tính, điểm nhấn tím, bảng/form/panel review được nhóm. |

Tên, nội dung, số liệu và thời gian trong ví dụ chỉ là minh họa. Hình ảnh là placeholder, không phải bằng chứng về tuyến hoặc checkpoint. Bind giá trị vào canonical contract; không suy ra rating, độ phổ biến, điểm độ khó hay field mới từ artwork.

### Phạm vi của token

Token ở đây tổng hợp hướng hình ảnh M01, M02 và M03 đã được chọn; mức chữ tối thiểu cho production và kích thước linh hoạt là lựa chọn đã tinh chỉnh, chưa qua nghiệm thu bằng render thực. Không token nào định nghĩa thời gian nghiệp vụ, chính sách retry hay ngưỡng viewport. Việc chọn hướng hình ảnh không phải nghiệm thu frontend hay nghiệp vụ.

---

## 2. Màu

### 2.1 Bảng màu theo bề mặt

| Bề mặt | Màu chính | Trạng thái |
|---|---|---|
| M01 discovery | Forest `#2D5016`; deep `#163C2D`; paper `#F8F5F0`; ink `#1C2922`; secondary `#596457`; line `#DBDFD4`; amber `#E8C97A` | Hướng đã duyệt; mở rộng sang các màn hình khách còn lại là lựa chọn |
| M02 scanner | Background `#0F1A0A`; surface `#1A2B0F`; text `#F0EDE6`; secondary `#B8BDB2` | Hướng được chọn |
| M02 reader | Paper `#F8F5F0`; white; ink `#1C1C1A`; secondary `#5C5A54` | Hướng reader sáng được chọn |
| M03 workspace | Paper `#F8F5F0`; white; muted `#F0EDE6`; ink `#1C1C1A`; secondary `#5C5A54`; border `#E0DAD0`; control border `#8B857B`; accent `#5C4A8A`; active `#EEEAF4` | Hướng layout + quản trị tuyến đã duyệt |
| Shared semantic | Success `#2D6B3F`; warning `#895411`; error `#B83A3A`; info `#2B5FA6` | Chữ/icon đi kèm màu; tương phản đo theo từng theme trước khi nghiệm thu |

Scanner accent trên nền tối: success `#5DD879`, warning `#F0B84B`, error `#F06060`.

### 2.2 Tên token

Màu chưa có tên token. Để component không hard-code hex và mỗi giá trị chỉ có một token, đề xuất đặt tên `--color-<vai trò>` cho giá trị dùng chung nhiều bề mặt và `--color-<bề mặt>-<vai trò>` cho giá trị riêng của một bề mặt:

| Token đề xuất | Giá trị | Dùng ở |
|---|---|---|
| `--color-paper` / `--color-white` | `#F8F5F0` / `#FFFFFF` | M01, M02 reader, M03 |
| `--color-ink` / `--color-ink-secondary` | `#1C1C1A` / `#5C5A54` | M02 reader, M03 |
| `--color-m01-forest` / `-deep` / `-ink` / `-secondary` / `-line` / `-amber` | `#2D5016` / `#163C2D` / `#1C2922` / `#596457` / `#DBDFD4` / `#E8C97A` | M01 |
| `--color-m02-scanner-bg` / `-surface` / `-text` / `-secondary` | `#0F1A0A` / `#1A2B0F` / `#F0EDE6` / `#B8BDB2` | M02 scanner |
| `--color-m02-scanner-success` / `-warning` / `-error` | `#5DD879` / `#F0B84B` / `#F06060` | M02 scanner |
| `--color-m03-muted` / `-border` / `-control-border` / `-accent` / `-active` | `#F0EDE6` / `#E0DAD0` / `#8B857B` / `#5C4A8A` / `#EEEAF4` | M03 |
| `--color-success` / `-warning` / `-error` / `-info` | `#2D6B3F` / `#895411` / `#B83A3A` / `#2B5FA6` | Semantic nền sáng |

### 2.3 Chế độ sáng/tối

Chưa định nghĩa chế độ sáng/tối chuyển đổi toàn hệ thống. Chỉ có bề mặt scanner của M02 là tối (và reader của M02 là sáng); các bề mặt khác sáng. Không thêm dark theme nếu chưa có quyết định.

### 2.4 Vai trò sử dụng

Màu gán theo bề mặt (bảng 2.1) và các vai trò sau:

- Forest, bề mặt ấm và hổ phách tiết chế: nhận diện M01.
- Điểm nhấn tím (`accent` `#5C4A8A`, `active` `#EEEAF4`): quản trị M03.
- Semantic: trạng thái; luôn đi kèm chữ, không dùng màu đơn độc.
- Phân biệt trực quan: draft và dữ liệu công khai hiện hành; bản ready đang dùng và bản candidate; visited và unvisited (nhãn chữ, không chỉ màu).

---

## 3. Typography

Dùng Segoe UI/system sans cho điều khiển và nội dung. Tiêu đề discovery của M01 dùng serif Times New Roman/Georgia như hướng đã duyệt; form, metadata và preparation giữ sans. M02 và M03 dùng sans toàn bộ. Không dùng font từ xa.

| Vai trò | Quy tắc production được chọn |
|---|---|
| M01 discovery hero | 28px trên điện thoại, tối đa 36px màn rộng; chiều cao linh hoạt cho vi/en và zoom (người dùng duyệt 2026-11-21: tiêu đề cũ 36–46px quá to trên điện thoại) |
| Page heading | 24–28px; M03 28px desktop / 24px mobile; màn du khách M01/M02 28px (Gợi ý tuyến và trang kết quả 24px) |
| Section title | 18px semibold trên màn du khách (mục chi tiết tuyến, nhóm tiêu chí, khối gói tải trước, hành trình) |
| Route title | 22px M01; 16px semibold cho tên hàng M03 |
| Body/form | 16px, line-height tối thiểu 1.5 |
| Metadata/badge/navigation | 14px; không đặt thông tin có ý nghĩa ở cỡ 9–12px |
| Button | 14–16px, semibold; vùng chạm tối thiểu 44px, CTA chính M01 là 48px (chữ 16px). Nút phụ có thể nhìn cao 36px khi vùng chạm vẫn 44px |
| Status chip | 14px; chip chỉ để đọc (không bấm được) cao 28px, không cần vùng chạm 44px |

Thẩm mỹ đã duyệt không miễn kiểm tra khả năng đọc. Mức tối thiểu ở trên là lựa chọn thiết kế được ủy quyền.

Giá trị bổ sung:

| Mục | Giá trị |
|---|---|
| Sans stack | `"Segoe UI", system-ui, -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif` |
| Serif stack (M01 hero/heading) | `"Times New Roman", Georgia, serif` — Times New Roman đứng trước vì Georgia hiển thị sai dấu chồng tiếng Việt (ví dụ "Tuyến") khi render thử trên Edge/Windows |
| Độ đậm | Regular 400 cho nội dung; semibold 600 cho button, tên hàng, nhãn nhấn mạnh |
| Line-height tiêu đề | 1.2–1.3 (nội dung vẫn ≥ 1.5 ) |
| Token | `--font-sans`, `--font-serif` (hai stack trên); `--font-weight-regular` 400, `--font-weight-semibold` 600; `--line-height-body` 1.5, `--line-height-heading` 1.25 |

---

## 4. Khoảng cách, bo góc, đổ bóng, chuyển động

### 4.1 Spacing

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--space-1` | 4px | Khoảng cách icon, danh sách chặt |
| `--space-2` | 8px | Phần tử inline, padding nhỏ |
| `--space-3` | 12px | Padding thẻ, khoảng cách input |
| `--space-4` | 16px | Padding section, khoảng cách thẻ |
| `--space-5` | 20px | Padding màn hình |
| `--space-6` | 24px | Khoảng cách section lớn |
| `--space-8` | 32px | Ngăn cách section màn hình |

### 4.2 Bo góc và đổ bóng

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--radius-sm` | 6px | Chip, tag, input |
| `--radius-md` | 10px | Thẻ, button |
| `--radius-lg` | 16px | Modal, overlay toàn màn hình |
| `--shadow-card` | `0 2px 8px rgba(0,0,0,0.08)` | Route card, content card |
| `--shadow-modal` | `0 8px 32px rgba(0,0,0,0.16)` | Dialog, scanner overlay |
| `--shadow-bottom-nav` | `0 -2px 8px rgba(0,0,0,0.06)` | Thanh điều hướng cố định |

### 4.3 Motion

| Animation | Thời lượng | Easing | Dùng cho |
|---|---|---|---|
| Page transition | 250ms | ease-out | Điều hướng màn hình |
| Card expand | 200ms | ease-out | Accordion, mở chi tiết |
| Loading pulse | 1200ms | ease-in-out | Skeleton, progress |
| Toast enter | 300ms | ease-out | Thông báo trượt lên |
| Toast exit | 200ms | ease-in | Thông báo trượt lên + mờ dần |
| Scanner frame | 1000ms | linear | Vạch quét chạy lên xuống trong khung bốn góc (2026-11-27; trước: khung ngắm nhấp nháy); giảm chuyển động: vạch đứng giữa khung |
| Dialog overlay | 250ms | ease-out | Backdrop + panel xuất hiện |
| Ảnh thẻ tuyến phóng nhẹ | 250ms | ease-out | Ảnh route card phóng 3% khi rê chuột hoặc giữ; chỉ khi `data-motion="full"` (tắt khi giảm chuyển động hoặc công tắc chuyển động tắt) |
| Mascot vào / ra slot | 250ms / 150–200ms | ease-out / ease-in | Mila xuất hiện, rời slot (§9) |
| Mascot đổi tư thế, bật bong bóng | 200ms (crossfade 150ms) | ease-out | Mỗi lời thoại mới |
| Mascot phản hồi một lần (nhún, nghiêng, lật nhìn quanh, giơ ngón cái) | 300–1200ms | ease-out | Thành công, lỗi, chờ quét |
| Mascot vòng chờ (thở, lắc lư, nhún ba lô) | 1200–2400ms mỗi nhịp | ease-in-out | Tối đa 5 giây mỗi lượt rồi đứng yên |
| Mascot cử chỉ tự động (nhìn ống nhòm, vẫy, nhún, nghiêng đầu, kéo quai ba lô, chớp mắt) | 2–3 nhịp, ≤ 3000ms (chớp mắt 120ms) | ease-in-out | Mỗi 4–7 giây ở màn Mila đứng chờ (v1.5; trước 8–15 giây, ≤ 1500ms); giữa hai cử chỉ Mila thở nhẹ liên tục (`scaleY` 1 → 1,015, nhịp 2400ms); dừng bằng công tắc "Hiệu ứng chuyển động" ở màn Tài nguyên (§9.5) |
| Mascot mốc tiến trình + vài lá rơi | 1200ms | ease-out | Mốc cấp 2 (Spec Mascot BR-MAS-23) |
| Mascot ăn mừng + lá rơi | ≤ 2400ms | ease-out | Chỉ SCR-M02-003, một lần, chạm để bỏ qua |
| Chữ bong bóng hiện dần | 30 ký tự/giây | linear | Mỗi lời thoại mới; chạm để hiện hết |

Tôn trọng `prefers-reduced-motion`. Với mascot Mila: khi giảm chuyển động, mọi animation thành đổi tức thì hoặc mờ dần ≤ 150 ms, không lá rơi, không vòng chờ (Spec Mascot BR-MAS-17). Mascot chỉ animate `transform`/`opacity` (cộng đổi ảnh tư thế), mỗi lúc một chuyển động trên hình (song song chỉ có bong bóng và lá rơi), và dừng khi trang ẩn. Công tắc "Hiệu ứng chuyển động" tắt (§9.5, màn Tài nguyên) cho kết quả như giảm chuyển động và chữ hiện ngay; đây là cách tạm dừng chuyển động kéo dài quá 5 giây theo WCAG 2.2.2 (Spec Mascot BR-MAS-21).

#### 4.3.1 Ba tầng chuyển động (v1.4, CHG-MOTION-2026-11-24-01)

Mọi chuyển động của màn du khách M01/M02 thuộc đúng một tầng. M03 không có chuyển động ngoài bảng trên.

| Tầng | Dùng cho | Thời lượng | Giảm chuyển động hoặc công tắc "Hiệu ứng chuyển động" tắt (§9.5) |
|---|---|---|---|
| **T1 Phản hồi** | Kết quả trực tiếp của thao tác: nhấn nút/thẻ, lượt ghé được ghi (điểm nảy, đường mòn vẽ tới điểm kế, thanh tiến trình tăng), dấu ✓ khi gói sẵn sàng, lỗi | ≤ 300ms (đường mòn ≤ 600ms) | Vẫn có phản hồi nhưng chỉ đổi màu hoặc mờ dần ≤ 150ms, không dịch chuyển, không co giãn |
| **T2 Chuyển cảnh** | Đổi màn (View Transitions), mở thẻ/accordion, dialog, thẻ hiện dần khi cuộn, skeleton, thanh "đang tải" | ≤ 300ms; skeleton và thanh "đang tải" lặp theo nhịp | Đổi tức thì; skeleton và thanh "đang tải" đứng yên (vẫn có chữ trạng thái) |
| **T3 Trang trí** | Không mang thông tin: tia nắng, lá trôi, confetti lá, số đếm lên, dải "hoàn thành tuyến" | Mỗi lượt ≤ 2400ms; tia nắng và lá trôi ở hero danh mục lặp liên tục khi trang trí bật (v1.6, CHG-MASCOT-2026-11-25-06) — được phép vì công tắc "Hiệu ứng chuyển động" dừng được (WCAG 2.2.2) | Tắt hẳn; hiện ngay trạng thái cuối (số cuối, dải đã hiện) |

Mila theo quy tắc riêng ở trên và §9; công tắc §9.5 dừng cả Mila lẫn T3.

Token mới (bổ sung vào bảng trên, đều về `0ms` khi `prefers-reduced-motion`):

| Token | Giá trị | Tầng | Dùng cho |
|---|---|---|---|
| `--duration-press` | 120ms | T1 | Nhấn nút, thẻ |
| `--duration-feedback` | 300ms | T1 | Điểm hành trình nảy, dấu ✓, thanh tiến trình tăng |
| `--duration-trail-draw` | 600ms | T1 | Đoạn đường mòn tự vẽ tới điểm kế tiếp |
| `--duration-reveal` | 300ms | T2 | Thẻ hiện dần khi cuộn |
| `--duration-shimmer` | 1600ms | T2 | Vệt sáng của skeleton, thanh "đang tải" (mỗi nhịp) |
| `--duration-confetti` | 2400ms | T3 | Confetti lá màn kết thúc |
| `--duration-count-up` | 800ms | T3 | Số liệu đếm lên |
| `--duration-ambient-drift` | 6000ms | T3 | Lá trôi, tia nắng ở hero (mỗi vòng; lặp liên tục từ v1.6, hai lá lệch nhau nửa vòng; tia nắng sáng lên rồi dịu xuống mỗi nửa vòng) |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | T1 | Nảy nhẹ (vượt 1 lần) |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | T1–T3 | Mặc định cho vào/ra và chuyển cảnh |
| `--press-scale` | 0.97 | T1 | Tỷ lệ khi nhấn (§5.4) |
| `--duration-feedback-reduced` | 150ms | T1 | Phản hồi khi giảm chuyển động hoặc công tắc tắt: chỉ đổi màu/opacity (không về 0) |

#### 4.3.2 Ngân sách hiệu năng (bắt buộc)

- Chỉ animate `transform` và `opacity` (cộng `stroke-dashoffset` cho đường mòn SVG). Không animate `width`, `height`, `top`, `left`, `box-shadow`, `filter`.
- Không vòng `requestAnimationFrame` hay timer khi màn đứng yên; mọi chuyển động dừng khi trang ẩn (`visibilitychange`).
- Tối đa 3 chuyển động T3 cùng lúc trên màn; confetti ≤ 40 hạt.
- T3 tự tắt khi `navigator.connection.saveData` bật hoặc `navigator.deviceMemory` ≤ 2 (máy không báo thì coi như đủ mạnh).
- Không ẩn phần tử của màn đầu để chờ animation (không làm chậm LCP); thẻ hiện dần chỉ áp cho phần tử nằm dưới màn đầu và chỉ một lần mỗi lần tải trang. Không gây dịch bố cục (CLS 0): chỗ của phần tử hiện dần được giữ sẵn.
- Không nhấp nháy quá 3 lần mỗi giây (WCAG 2.3.1). Chuyển động không bao giờ là cách duy nhất truyền thông tin: mọi phản hồi T1 có chữ hoặc trạng thái tĩnh tương ứng.
- Không thư viện animation: CSS, Web Animations API và View Transitions API (trình duyệt không hỗ trợ thì đổi màn tức thì). Mã motion thêm vào ≤ 15 KB gzip; mọi tài nguyên nằm trong bundle hoặc precache để chạy offline.

Spacing không có `--space-7` . Các giá trị sau chưa có tên token; dùng đúng giá trị trong tài liệu cho đến khi triển khai đặt tên: cỡ chữ theo vai trò (mục 3), thời lượng/easing chuyển động (4.3), độ dày viền 1px/2px, vùng chạm 44px/48px.

---

## 5. Bố cục và thành phần

### 5.1 Bố cục theo module

**M01 — Visitor Route Planning.** Dùng catalog kiểu field-guide rừng đã duyệt: header gọn có thương hiệu/ngôn ngữ, hero serif minh họa, route card dẫn bằng hình ảnh, điều hướng có nhãn giữ nguyên các đích hiện có. Ưu tiên 390px; rà soát 320/360/430px. Tên và mọi metadata được hỗ trợ phải đọc được khi không có ảnh. Mở rộng từ vựng hình ảnh này sang detail, recommendation, preparation và resources mà không lặp hero lớn ở mọi màn. Trên điện thoại, giữ hero đủ gọn để hành động khám phá và chuẩn bị tuyến dễ tìm. Package presentation tách bản ready đang dùng khỏi candidate đang tải/cập nhật; candidate lỗi không được xóa dấu vết của bản cũ còn dùng được.

**M02 — Field Experience.** Giữ ngữ cảnh tuyến/phiên phía trên journey overview và scanner. Phân biệt điểm đã/chưa ghé bằng nhãn chữ chứ không chỉ màu. Scanner dùng bề mặt rừng tối; màn đọc dùng bề mặt sáng cho văn bản dài. Đặt hành động trong tầm với; availability đến từ M02. Timeline thể hiện lượt ghé, không ngụ ý check-in tuần tự hay bắt buộc ghé mọi điểm; nhãn "Tiếp theo" (2026-11-27) chỉ gợi ý điểm chưa quét đầu tiên, các điểm khác vẫn trông chạm và quét được như thường. Tách phản hồi quyền/khả năng camera khỏi kết quả giải mã QR và lỗi nội dung. Khách tự do cần scanner và nội dung live không có tiến trình phiên. Sau Finish, hiển thị kết quả terminal tách khỏi phản hồi sync pending/success/conflict; thiếu acknowledgment không phải là lượt ghé thất bại.

**M03 — Administration.** Sidebar rộng khoảng 200–220px, header gọn, vùng làm việc linh hoạt. Dùng master/detail cho tuyến, form chỉnh sửa theo nhóm, cột song ngữ khi đủ chỗ và xếp chồng khi hẹp. Nhãn role/lifecycle luôn hiển thị; permission matrix canonical quyết định hành động khả dụng. Giữ draft và dữ liệu công khai hiện hành khác biệt rõ; QR thay thế đang chờ vẫn giữ QR công khai cũ hoạt động đến khi duyệt/xuất bản thành công. Lưu draft, gửi revision, xuất bản và emergency close cần phản hồi và xác nhận khác nhau; vị trí gần nhau không được ngụ ý cùng quyền hay cùng transition.

### 5.2 Thư viện component

| Component | Hướng hình ảnh |
|---|---|
| Header/navigation | Vị trí rõ, nhãn ngắn, focus nhìn thấy được, padding safe-area. Thanh app M01: logo kèm tên "Cúc Phương Quest" một dòng bên phải logo, serif 16px đậm, một màu `paper`, không xuống dòng (màn < 360px: 14px); cả logo và tên cùng một liên kết về danh mục (người dùng duyệt 2026-11-25). |
| Tab bar (du khách M01) | Thanh cố định ở đáy mọi màn M01 (người dùng duyệt 2026-11-21): ba cột Tuyến · Quét QR · Tài nguyên, chú thích ngắn 14px dưới icon. Thanh nổi nền `white`, bo `--radius-lg` cả bốn góc, cách hai cạnh và đáy màn `--space-3` (cộng vùng an toàn), viền 1px `line`, bóng `--shadow-bottom-nav` kèm `--shadow-card`. Nút Quét ở giữa là đĩa tròn 60px nền `forest` icon `paper`, viền trắng, nổi nửa thân trên mép thanh. Tab đang mở dùng `forest`, chữ đậm và vạch trên, không chỉ đổi màu; mỗi tab là vùng chạm ≥ 44px. Không có trên màn chọn ngôn ngữ và các màn M02. |
| Route card | Chiều cao linh hoạt, thumbnail tùy chọn, tên trước, metadata được hỗ trợ bên dưới. Độ khó dùng tên category. Thẻ M01 (người dùng duyệt 2026-11-25): ảnh không cắt vòm; nửa dưới ảnh làm mờ và phủ `deep` đậm dần tới 88% ở đáy, tên tuyến serif màu `paper` kèm dấu ghim nổi đè lên phần đó; thân thẻ trắng phẳng bên dưới. Lớp phủ luôn có nên tên vẫn đọc được khi không có ảnh. Ảnh phóng 3% khi rê chuột hoặc giữ (§4.3). Cuối danh sách có dải rừng `forest-band` lặp ngang, `forest` 26%, làm mặt đất phía trên thanh tab. Tất cả chỉ trang trí, ẩn với trình đọc màn hình. |
| Journey item | Nhãn checkpoint, thứ tự và chỉ báo đã ghé; nội dung được chọn có highlight riêng. |
| Status chip | Nhãn ngắn và icon tùy chọn; dùng từ vựng trạng thái của entity nguồn. |
| Package panel | Nhãn readiness/freshness của bản đang dùng tách khỏi tiến trình/lỗi candidate; không bịa phần trăm. |
| Draft/public panel | Tách thay đổi đang chờ khỏi danh tính/phiên bản công khai hiện hành, kể cả nhãn cài đặt QR. |
| Terminal/sync panel | Giữ tóm tắt terminal đồng thời hiển thị PENDING, SYNCED hoặc CONFLICT riêng; chỉ retry nơi spec cho phép. |
| Content block | Độ dài dòng và khoảng cách ảnh thoải mái; điều khiển media chỉ cho nguồn có media. |
| Form field | Nhãn luôn hiển thị, mô tả và lỗi gắn kết; nhóm cặp song ngữ. |
| Table/report | Header căn chỉnh, ô dễ đọc; field lấy từ report contract. |
| Review comparison | Nhãn cũ/mới rõ, danh tính revision và thay đổi dễ đọc. |
| Banner/empty state | Thông điệp cụ thể; hành động khôi phục theo screen specification. |
| Dialog | Tiêu đề/hành động rõ, quản lý focus, nút đóng/hủy nhìn thấy được khi áp dụng. |
| Progress/skeleton | Khớp nội dung đại diện; phần trăm chỉ khi đo được tiến trình. |
| Scanner feedback | Nhãn riêng cho valid/invalid/already visited/outside journey/source unavailable; đủ thời gian đọc. |

### 5.3 Nút, form, thẻ, lỗi, trạng thái — quy tắc bổ sung

Các quy tắc sau chỉ ghép từ token đã có, để thống nhất khi triển khai:

| Mục | Quy tắc đề xuất |
|---|---|
| Nút | Bo `--radius-md`; chữ semibold 14–16px; cao tối thiểu 44px (CTA chính M01 48px). Nền nút chính M03: `accent` với chữ trắng (7.50:1); nền nút chính M01: `forest` với chữ `paper` hoặc trắng (8.50:1 / 9.25:1). |
| Form field | Nhãn 14px phía trên ô; input bo `--radius-sm`, viền control (M03: `control border` `#8B857B`, 3.36–3.66:1). Viền M01 `line` chỉ 1.24:1 nên không dùng làm viền ô nhập; dùng `secondary` `#596457` (5.70:1 trên paper). |
| Thông báo lỗi | Văn bản 14px, màu `error`, đặt ngay dưới field và gắn với field (`aria-describedby`, field có `aria-invalid="true"`); kèm icon hoặc tiền tố chữ, không chỉ đổi màu viền. |
| Thẻ | Bo `--radius-md`, bóng `--shadow-card`, padding `--space-3`–`--space-4`. |
| Focus | Vòng 2px, offset 2px, luôn đạt ≥ 3:1 với nền kề. Màu: M01 `forest` trên `paper` (8.50:1); M01 `amber` khi nền là `deep`/`forest` (7.60:1 / 5.75:1); M02 reader `ink` (15.69:1 trên paper); M03 `accent` (6.89:1 trên paper, 7.50:1 trên white); scanner `warning` `#F0B84B` (9.95:1 trên background). |
| Disabled/unavailable | Giữ nhãn chữ và lý do khi spec yêu cầu; không dùng độ mờ làm tín hiệu duy nhất. |
| Thẻ surface trên scanner | Surface `#1A2B0F` chỉ cách background 1.19:1, nên thẻ có viền 1px màu `secondary` `#B8BDB2` (9.35:1 trên background). |
| Hổ phách M01 | Chỉ dùng trên nền `deep`/`forest`, hoặc làm nền với chữ `ink`. Không dùng làm chữ, icon hay viền trên `paper` (1.48:1). |
| Placeholder | Không thay nhãn. Nếu dùng, màu `secondary` của bề mặt (đạt ≥ 4.5:1, xem bảng 6.1). |
| Thông báo trạng thái (toast, banner) | Lỗi cần xử lý dùng `role="alert"`; kết quả thành công và tiến trình dùng `role="status"`, để trình đọc màn hình đọc được mà không chuyển focus. Thông báo chứa lỗi hoặc hành động không tự đóng. |
| Vùng thông báo | Một vùng ở đầu nội dung. Kết quả tra cứu QR (đóng tạm, không hợp lệ, cần kết nối) loại trừ nhau nên chỉ hiện một. Thứ tự từ trên xuống: kết quả tra cứu, lỗi nguồn nội dung, thông báo tự kết thúc chuyến trước. |
| Xác nhận lượt ghé và toast | Xác nhận lượt ghé ("Đã ghi nhận lượt quét.") là toast nổi ngay dưới thanh app, không đẩy nội dung, ở mọi màn có nó (người dùng duyệt 2026-11-21). Toast thường (thành công, không chứa lỗi hay hành động) dùng một component chung: `role="status"`, tự đóng sau 6 giây, có nút đóng (vùng chạm 44px), tạm dừng khi hover hoặc focus; lượt quét tiếp theo thay toast cũ. Lỗi và thông báo có hành động vẫn là banner, không tự đóng. |
| Nhóm hành động (M03) | Ba nhóm tách rõ: chính (Lưu bản nháp, Xuất bản); vòng đời (Đóng tạm, Mở lại); không hoàn tác (Lưu trữ, Hủy) ở cuối, xa hai nhóm kia, luôn qua dialog xác nhận riêng. Trên màn hẹp, thanh hành động cố định phía dưới (`--shadow-bottom-nav`) chỉ chứa nhóm chính. |
| Nội dung dài trong bảng (M03) | Ô Chi tiết của nhật ký (lý do và trước/sau), cả ở SCR-M03-009 lẫn panel "Nhật ký của mục" trong editor, rút gọn tối đa 3 dòng; dài hơn thì nút chữ "…Xem thêm" (`aria-haspopup="dialog"`, vùng chạm 44px) mở hộp thoại chỉ đọc có đủ nội dung và một nút "Đóng". Cột kết quả luôn bằng chữ. |
| Hover/pressed | Không thêm màu mới; dùng lớp phủ trong suốt lên màu nền sẵn có, xem 5.4. |
| Skeleton (v1.4) | Khối `m01-line` bo như phần tử thật, đúng kích thước phần tử sẽ hiện (không dịch bố cục); vệt sáng trắng 40% lướt chéo như nắng qua tán lá (`--duration-shimmer`, T2). Có chữ trạng thái cho trình đọc màn hình (`role="status"`, ẩn thị giác) như hiện nay. Giảm chuyển động: khối đứng yên. |
| Thanh tiến trình hành trình (v1.4, SCR-M02-001; chia đoạn từ 2026-11-27, CHG-MASCOT-2026-11-27-07) | **Xác định**, k/n lấy từ phiên. Mỗi điểm một đoạn theo thứ tự hiển thị, cách nhau `--space-1`, cao `--space-2`, bo tròn: đã quét `m02-scanner-success`; điểm tiếp theo `m01-amber`; còn lại rãnh `m02-scanner-secondary` 35%. Nằm trong thẻ tuyến, trên câu "Đã quét QR: k/n" (câu giữ nguyên, là thông tin chính); thanh có `role="progressbar"` với `aria-valuenow`/`aria-valuemax`. Đoạn của điểm vừa có lượt ghé mới sáng lên bằng `transform: scaleX` (`--duration-feedback`, T1); giảm chuyển động: mờ dần. Thanh đường mòn có dấu chân (`footprint.svg`) vẫn là mẫu của thanh tiến trình xác định khác. Không phải slot của Mila. |
| Scanner (2026-11-27, CHG-MASCOT-2026-11-27-08, SCR-M02-001/005) | Hàng tiêu đề như thanh đầu trang M02: "Quét mã QR" serif cỡ tiêu đề trang, nút VI/EN của M01 bên phải. Khi có điểm tiếp theo: nhãn dạng viên viền amber "Đang tìm điểm {i} · {tên}" (chữ amber cho phần điểm). Khung: bốn góc amber `--border-width-thick` + 1px, bo `--radius-md`, vạch quét `m02-scanner-success` mờ hai đầu. Màn lỗi camera: icon `camera-off.svg` 48px trong vòng tròn viền đứt amber, lắc một lần (`--duration-feedback`, T1; giảm chuyển động: không lắc); câu cố định trong khung vạch trái amber; khung "Cách bật camera" (tiêu đề amber, các bước là danh sách có số trong vòng amber); "Thử lại" nút chính nền amber chữ `m02-scanner-bg`, "Đóng camera" nút viền. Đang kiểm tra mã: `leaf.svg` xoay (`--duration-scanner-frame`, lặp; giảm chuyển động: đứng yên) cạnh dòng chữ. |
| Thẻ quét đủ (2026-11-27, SCR-M02-001) | Khi mọi điểm đã quét, khối nút đáy màn thành thẻ kính mờ: dòng "Bạn đã quét đủ {n}/{n} điểm!" (chữ đậm, màu success), "Kết thúc chuyến" nút chính (kiểu nút Quét), "Quét QR" nút viền. Trượt lên `--space-6` trong 250ms (`--duration-page`) khi điểm vừa quét làm đủ (T1); giảm chuyển động: mờ dần. |
| Gợi ý khách tự do (2026-11-27, SCR-M02-002/004) | Câu "Bạn đang xem tự do…" là **toast** dùng chung (nổi ngay dưới thanh app, không đẩy nội dung, nút đóng, dừng đếm khi hover/focus) với icon `compass.svg` và thời gian **4 giây** (chủ dự án chọn 2026-11-27; toast thường 6 giây). Liên kết "Chọn tuyến" không nằm trong toast (toast không chứa hành động): ở cuối bài là nút viền `m02-info` cao `--touch-target-m01-primary`, Mila (nếu bật) là hình bên trái. Trước: khối dài sau bài viết (BUG-015). |
| Thẻ tuyến và hàng hành trình (2026-11-27, SCR-M02-001) | Thẻ tuyến là thẻ kính mờ đầu hành trình (`--m02-surface`, viền `--m02-surface-frame`, `--radius-lg`): nhãn "Tuyến đang đi" màu amber cỡ meta, tên tuyến chữ serif như tiêu đề màn, thanh chia đoạn, hàng dưới gồm "Đã quét QR: k/n điểm" bên trái và "Còn r điểm" bên phải (cỡ meta). Hàng đã quét: vòng ✓ (`check.svg` mask, nền `m02-scanner-success`) thay số, mũi tên `chevron-right.svg` ở mép phải báo chạm được. Điểm tiếp theo: viền amber, vòng số viền amber, nhãn "Tiếp theo" dạng viên (nền amber, chữ `m02-scanner-bg`, chữ thường như câu). Trạng thái luôn có chữ, không chỉ màu. |
| Thanh "đang tải" của gói (v1.4, SCR-M01-003/004) | **Không xác định** (M01 không báo phần trăm): rãnh và vệt cùng màu chữ của panel (rãnh 22%), vệt dạng đường mòn trôi lặp (`--duration-shimmer`, T2); không số, không giả tiến độ. Đi cùng nhãn "Đang tải…" sẵn có; xong thì vệt dừng và dấu `check.svg` hiện (T1). Giảm chuyển động: vệt đứng yên giữa rãnh. |
| Nút dịch "→" (M03, [Spec AI Integration](../spec/spec-AI_integration.md) §5.5) | Nút phụ nhỏ giữa ô tiếng Việt và ô tiếng Anh của mỗi cặp song ngữ; hiện ký tự chữ "→" (U+2192), không dùng file icon. Nền `white`, viền `control border`, chữ `accent`; bo `--radius-md`; vùng chạm tối thiểu 44×44px; tên truy cập "Dịch sang tiếng Anh". Không bấm được thì theo dòng Disabled/unavailable. Trên màn hẹp, khi hai ô xếp chồng, nút nằm giữa hai ô. |
| Trạng thái dịch (M03) | Một dòng 14px ngay dưới ô tiếng Anh, gắn với ô bằng `aria-describedby`. "Đang dịch…" màu `secondary`, `role="status"`. Lỗi dùng cách hiển thị của Thông báo lỗi (màu `error`, `role="alert"`) kèm nút chữ "Thử lại"; không tự đóng. Không làm đổi bố cục ô. |

### 5.4 Hover và pressed

Để không thêm họ màu mới, trạng thái này là một lớp phủ trong suốt đặt lên màu nền sẵn có của phần tử (đen trên nền sáng, trắng trên nền tối scanner):

| Nhóm phần tử | Hover | Pressed | Token |
|---|---|---|---|
| Nền đặc: nút chính M01 (`forest`), nút chính M03 (`accent`) | Đen 12% | Đen 20% | `--overlay-fill-hover` `rgba(0,0,0,0.12)`; `--overlay-fill-pressed` `rgba(0,0,0,0.20)` |
| Bề mặt sáng: hàng danh sách, nút phụ, thẻ bấm được (trên `paper`, `white`, `muted`) | Đen 4% | Đen 8% | `--overlay-surface-hover` `rgba(0,0,0,0.04)`; `--overlay-surface-pressed` `rgba(0,0,0,0.08)` |
| Scanner (nền tối) | Trắng 8% | Trắng 14% | `--overlay-scanner-hover` `rgba(255,255,255,0.08)`; `--overlay-scanner-pressed` `rgba(255,255,255,0.14)` |
| Lớp phủ sau hộp thoại đáy màn (hộp thoại kết thúc chuyến, v1.6) | — | — | `--overlay-scrim` `rgba(0,0,0,0.5)`: che hành trình phía sau; bảng hộp thoại nền `white` đặc, chữ `ink`, bo `--radius-lg`, `--shadow-modal`, nằm ở đáy màn trong tầm ngón cái; không dùng kính mờ |

Quy tắc:
- Hover chỉ áp dụng khi thiết bị có con trỏ (`@media (hover: hover)`); pressed (`:active`) áp dụng mọi thiết bị. Phần tử disabled không có hover/pressed.
- Không đổi vị trí khi hover/pressed, và không thêm chuyển động ngoài mục 4.3. Ngoại lệ v1.4 trên màn du khách M01/M02 (T1, §4.3.1): khi nhấn, nút và thẻ bấm được co về `--press-scale` trong `--duration-press`, nhả ra thì về 1; thẻ tuyến khi hover (chỉ thiết bị có con trỏ) nhấc lên 2px bằng `transform`. Co giãn không đổi bố cục xung quanh. Giảm chuyển động hoặc công tắc tắt: chỉ còn lớp phủ. M03 giữ nguyên quy tắc không đổi kích thước. Chuyển động của mascot Mila nằm trong bảng 4.3 và không gắn với hover/pressed. Hover/pressed không là tín hiệu duy nhất của trạng thái nào; trạng thái được chọn của M03 (`active`) giữ nguyên khi hover.
- Tương phản trường hợp xấu nhất sau khi phủ:
  - Nền đặc: chữ trắng trên `forest` ≥ 10.63:1, trên `accent` ≥ 8.82:1; cao hơn lúc thường (9.25:1 / 7.50:1). Chữ `paper` trên `forest` ≥ 9.77:1.
  - Bề mặt sáng, khi nhấn: chữ `ink` ≥ 12.23:1; `secondary` ≥ 4.94:1 (`#5C5A54` trên `muted`) và ≥ 4.76:1 (`#596457` M01 trên `paper`); `accent` ≥ 5.37:1.
  - Scanner, khi nhấn trên surface: chữ `text` ≥ 8.25:1; `secondary` ≥ 5.03:1.
- Trên scanner, không đặt chữ màu `error` trong phần tử có lớp phủ: sau khi phủ chỉ còn 3.01–3.69:1 (< 4.5). Thông báo lỗi là phản hồi, không phải điều khiển bấm được.

---

## 6. Truy cập (WCAG 2.1 AA)

Rà soát: tương phản đọc được, truy cập bàn phím, focus nhìn thấy được, nhãn ngữ nghĩa và vùng chạm khoảng 44×44px. Đây là mục tiêu rà soát từ screen specification, không khẳng định frontend đã đạt chuẩn truy cập. Bảng màu một mình không phải là sign-off truy cập; cần kiểm từng cặp chữ/nền trong mỗi theme.

Vùng chạm tối thiểu: 44px; CTA chính M01 48px. Lưu ý: ở WCAG 2.1, kích thước vùng chạm 44×44px là tiêu chí 2.5.5 mức AAA; mức AA không yêu cầu. 44px ở đây là mục tiêu của dự án , không phải điều kiện để đạt AA. Camera phụ thuộc thiết bị/trình duyệt và quyền trong M02; kích thước viewport không tự vô hiệu hóa quét.

Responsive: dùng điện thoại 320/360/390/430px và màn rộng 768/1024/1280px làm mẫu rà soát, không phải ngưỡng tối thiểu hay breakpoint bắt buộc. Để nội dung quyết định xếp chồng, xuống dòng, cuộn bảng. M03 nhấn mạnh workspace desktop nhưng form và hành động nghiệp vụ vẫn với tới được trên màn hẹp. Login, invitation và recovery cũng cần layout dùng được trên điện thoại. Kiểm nhãn vi/en dài, zoom, trạng thái lỗi và dialog đang mở, không chỉ view mặc định.

Tiêu chí WCAG 2.1 AA áp dụng cho design system và nơi tài liệu này xử lý:

| Tiêu chí | Yêu cầu | Nơi xử lý |
|---|---|---|
| 1.4.1 Use of Color | Màu không là tín hiệu duy nhất; luôn có chữ hoặc icon đi kèm | 2.4, 5.2 |
| 1.4.3 Contrast (Minimum) | Chữ thường ≥ 4.5:1, chữ lớn ≥ 3:1 | 6.1 |
| 1.4.4, 1.4.10 Resize Text, Reflow | Zoom 200% không mất nội dung; ở 320px không cuộn ngang (bảng dữ liệu được cuộn riêng) | 6 (Responsive) |
| 1.4.11 Non-text Contrast | Viền điều khiển và vòng focus ≥ 3:1 | 5.3, 6.1 |
| 2.4.7 Focus Visible | Mọi điều khiển có vòng focus nhìn thấy | 5.3 |
| 3.1.1, 3.1.2 Language | Đặt `lang="vi"` hoặc `lang="en"` theo `LanguagePreference`; đoạn khác ngôn ngữ chính (ví dụ tên riêng tiếng Anh trong nội dung tiếng Việt) có `lang` riêng | 6 |
| 3.3.1, 3.3.2 Error, Labels | Lỗi nêu rõ bằng chữ; field có nhãn luôn hiển thị | 5.3 |
| 4.1.2 Name, Role, Value | Điều khiển dùng phần tử HTML chuẩn; chỉ thêm ARIA khi cần | 5.2 |
| 4.1.3 Status Messages | Toast/banner đọc được qua `role="status"` / `role="alert"` | 5.3 |

### 6.1 Tỷ lệ tương phản (Tính toán)

Tính theo công thức độ sáng tương đối WCAG 2.1 (sRGB), làm tròn 2 chữ số. Ngưỡng: chữ thường 4.5:1; chữ lớn và thành phần giao diện 3:1. Đây là kết quả tính toán từ giá trị hex ở mục 2. Bảng liệt kê các cặp có thể xảy ra; không suy ra vai trò mà nguồn chưa quy định. Cột "Đạt" ghi mức cao nhất đạt: AA = chữ thường, L/UI = chữ lớn hoặc thành phần giao diện, — = không đạt.

**M01 discovery**

| Màu trước | Nền | Tỷ lệ | Đạt |
|---|---|---|---|
| Ink `#1C2922` | Paper `#F8F5F0` | 13.90 | AA |
| Ink `#1C2922` | White `#FFFFFF` | 15.11 | AA |
| Secondary `#596457` | Paper `#F8F5F0` | 5.70 | AA |
| Forest `#2D5016` | Paper `#F8F5F0` | 8.50 | AA |
| Forest `#2D5016` | White `#FFFFFF` | 9.25 | AA |
| Deep `#163C2D` | Paper `#F8F5F0` | 11.24 | AA |
| Paper `#F8F5F0` | Forest `#2D5016` | 8.50 | AA |
| White `#FFFFFF` | Forest `#2D5016` | 9.25 | AA |
| Paper `#F8F5F0` | Deep `#163C2D` | 11.24 | AA |
| Amber `#E8C97A` | Deep `#163C2D` | 7.60 | AA |
| Amber `#E8C97A` | Forest `#2D5016` | 5.75 | AA |
| Ink `#1C2922` | Amber `#E8C97A` | 9.40 | AA |
| Amber `#E8C97A` | Paper `#F8F5F0` | 1.48 | — (không dùng cho chữ/icon/viền trên paper) |
| Line `#DBDFD4` | Paper `#F8F5F0` | 1.24 | — (chỉ trang trí) |

**M02 scanner (nền tối)**

| Màu trước | Nền | Tỷ lệ | Đạt |
|---|---|---|---|
| Text `#F0EDE6` | Background `#0F1A0A` | 15.32 | AA |
| Text `#F0EDE6` | Surface `#1A2B0F` | 12.86 | AA |
| Secondary `#B8BDB2` | Background `#0F1A0A` | 9.35 | AA |
| Secondary `#B8BDB2` | Surface `#1A2B0F` | 7.85 | AA |
| Success `#5DD879` | Background `#0F1A0A` | 9.86 | AA |
| Success `#5DD879` | Surface `#1A2B0F` | 8.28 | AA |
| Warning `#F0B84B` | Background `#0F1A0A` | 9.95 | AA |
| Warning `#F0B84B` | Surface `#1A2B0F` | 8.35 | AA |
| Error `#F06060` | Background `#0F1A0A` | 5.58 | AA |
| Error `#F06060` | Surface `#1A2B0F` | 4.69 | AA |
| Surface `#1A2B0F` | Background `#0F1A0A` | 1.19 | — (không dùng ranh giới surface/background làm chỉ báo duy nhất) |

**M02 reader (nền sáng)**

| Màu trước | Nền | Tỷ lệ | Đạt |
|---|---|---|---|
| Ink `#1C1C1A` | Paper `#F8F5F0` | 15.69 | AA |
| Ink `#1C1C1A` | White `#FFFFFF` | 17.07 | AA |
| Secondary `#5C5A54` | Paper `#F8F5F0` | 6.34 | AA |
| Secondary `#5C5A54` | White `#FFFFFF` | 6.90 | AA |

**M03 workspace**

| Màu trước | Nền | Tỷ lệ | Đạt |
|---|---|---|---|
| Ink `#1C1C1A` | Paper `#F8F5F0` | 15.69 | AA |
| Ink `#1C1C1A` | White `#FFFFFF` | 17.07 | AA |
| Ink `#1C1C1A` | Muted `#F0EDE6` | 14.60 | AA |
| Ink `#1C1C1A` | Active `#EEEAF4` | 14.39 | AA |
| Secondary `#5C5A54` | Paper `#F8F5F0` | 6.34 | AA |
| Secondary `#5C5A54` | White `#FFFFFF` | 6.90 | AA |
| Secondary `#5C5A54` | Muted `#F0EDE6` | 5.90 | AA |
| Accent `#5C4A8A` | Paper `#F8F5F0` | 6.89 | AA |
| Accent `#5C4A8A` | White `#FFFFFF` | 7.50 | AA |
| Accent `#5C4A8A` | Active `#EEEAF4` | 6.32 | AA |
| White `#FFFFFF` | Accent `#5C4A8A` | 7.50 | AA |
| Control border `#8B857B` | White `#FFFFFF` | 3.66 | L/UI |
| Control border `#8B857B` | Paper `#F8F5F0` | 3.36 | L/UI |
| Border `#E0DAD0` | White `#FFFFFF` | 1.39 | — (chỉ trang trí) |
| Border `#E0DAD0` | Paper `#F8F5F0` | 1.28 | — (chỉ trang trí) |

**Semantic dùng chung (nền sáng)**

| Màu trước | White `#FFFFFF` | Paper `#F8F5F0` | Muted `#F0EDE6` | Đạt (cả ba nền) |
|---|---|---|---|---|
| Success `#2D6B3F` | 6.39 | 5.88 | 5.47 | AA |
| Warning `#895411` | 6.29 | 5.78 | 5.38 | AA |
| Error `#B83A3A` | 5.67 | 5.21 | 4.85 | AA |
| Info `#2B5FA6` | 6.38 | 5.87 | 5.46 | AA |

Chữ trắng trên nền semantic đặc (chip trạng thái, banner) có cùng tỷ lệ với cột White ở trên: success 6.39, warning 6.29, error 5.67, info 6.38 — đều đạt AA.

Hệ quả cho thiết kế: các cặp trên 4.5:1 dùng được cho chữ thường. Hổ phách M01 theo quy tắc ở mục 5.3. Đường `line` (M01) và `border` (M03) chỉ phân tách trang trí; ranh giới của điều khiển phải dùng màu đạt 3:1 trở lên.

---

## 7. Icon

- Icon chỉ lấy từ [assets/icons/](../../assets/icons/); đây là nơi duy nhất chứa icon của dự án.
- Từ 2026-11-10 người dùng cho phép agent vẽ icon SVG mới trong assets/icons/: nét đơn sắc trên lưới 24×24, dùng làm mask để màu lấy từ token. Không lấy icon từ thư viện khác khi chưa được phê duyệt.
- Icon đi kèm chữ ở nơi truyền đạt trạng thái (Status chip, thông báo lỗi); không dùng icon hay màu làm tín hiệu duy nhất.
- Màu icon lấy từ token màu của mục 2, không hard-code.
- Nút dịch "→" của M03 dùng ký tự chữ, không phải icon, nên không cần file trong assets/icons/ (quyết định người dùng 2026-11-03, Spec AI Integration OD-AI-18).
- Ngoại lệ do người dùng duyệt 2026-11-08 cho bước chọn ngôn ngữ của SCR-M01-001: agent vẽ `flag-vi.svg`, `flag-en.svg` và `divider-mountain.svg` trong assets/icons/. Hai cờ giữ màu của chính lá cờ; hình núi chỉ dùng làm mask, màu lấy từ token. Cờ chỉ để trang trí, không thay chữ "Tiếng Việt"/"English".
- Ngoại lệ do người dùng duyệt 2026-11-10 cho nút Quét của SCR-M02-001: agent vẽ `qr-scan.svg` (camera trong khung quét) trong assets/icons/. Chỉ dùng làm mask, màu theo chữ của nút; icon đứng trước chữ "Quét QR", không thay chữ.
- Ngoại lệ do người dùng duyệt 2026-11-11 cho màn kết quả chuyến SCR-M02-003 (theo ảnh mẫu người dùng cung cấp): agent vẽ `check.svg` (dấu tích của huy hiệu hoàn thành), `heart.svg` (thẻ hẹn gặp lại) và `home.svg` (nút "Về danh sách tuyến") trong assets/icons/. Chỉ dùng làm mask, màu lấy từ token; luôn đi kèm chữ, không thay chữ.
- Ngoại lệ do người dùng duyệt 2026-11-25 cho trang trí danh mục tuyến SCR-M01-001: agent vẽ `forest-band.svg` (dải rừng lặp ngang cuối danh sách, lưới 240×56) trong assets/icons/. Hình khối đặc, chỉ dùng làm mask, màu lấy từ token; chỉ trang trí, ẩn với trình đọc màn hình.
- Ảnh mascot Mila không phải icon: nằm trong `assets/mascot/`, bản gốc do người dùng cung cấp (§9). Hiệu ứng lá rơi của Mila dùng lại `leaf.svg` làm mask, màu từ token.
- Motion v1.4 (CHG-MOTION-2026-11-24-01): agent vẽ `footprint.svg` (dấu chân ở đầu thanh tiến trình hành trình, §5.3) và `sun-rays.svg` (tia nắng trang trí ở hero SCR-M01-001, T3) trong assets/icons/. Chỉ dùng làm mask, màu lấy từ token; trang trí có `aria-hidden`. Confetti lá màn kết thúc dùng lại `leaf.svg`.
- Ngoại lệ do người dùng duyệt 2026-11-21 cho toast dùng chung và thanh tab: agent vẽ `close.svg` (dấu ✕ của nút đóng toast) trong assets/icons/. Chỉ dùng làm mask, màu lấy từ token; nút có tên truy cập bằng chữ.
- Ngoại lệ do người dùng duyệt 2026-11-27 cho màn lỗi camera của scanner (CHG-MASCOT-2026-11-27-08): agent vẽ `camera-off.svg` (máy ảnh có vạch chéo) trong assets/icons/. Chỉ dùng làm mask, màu từ token; trang trí đi kèm câu lỗi cố định, `aria-hidden`.
- Logo dùng chung là `logo-emblem.png`, bản sạch của `icon.png` (nền trắng, bỏ vạch đen ở mép), dùng cho favicon, thanh app và panel chọn ngôn ngữ. Icon cài đặt `pwa-192.png`, `pwa-512.png`, `pwa-maskable-512.png` và `apple-touch-icon.png` là logo này đặt giữa nền trắng vuông; bản maskable giữ logo trong vòng tròn an toàn 80%. Tất cả do agent dựng theo yêu cầu người dùng 2026-11-08.

---

## 8. Màn hình và hướng hình ảnh

Hướng hình ảnh theo từng màn hình; chỉ dùng token và component của các mục 2–5.

| Màn hình | Hướng hình ảnh | Screen specification |
|---|---|---|
| `SCR-M01-001` — Route catalog | Hero, route card, metadata gọn | [Screen spec](../../screens/screen-spec/M01/screen-spec-SCR-M01-001.md) |
| `SCR-M01-002` — Recommendations | Tiêu chí nhóm lại và kết quả dễ đọc | [Screen spec](../../screens/screen-spec/M01/screen-spec-SCR-M01-002.md) |
| `SCR-M01-003` — Route detail and preparation | Hero, giới thiệu và panel chuẩn bị | [Screen spec](../../screens/screen-spec/M01/screen-spec-SCR-M01-003.md) |
| `SCR-M01-004` — Offline resources | Package card với readiness và freshness | [Screen spec](../../screens/screen-spec/M01/screen-spec-SCR-M01-004.md) |
| `SCR-M02-001` — Session and scanner | Journey overview và phản hồi QR riêng biệt; vùng thông báo và xác nhận lượt ghé theo 5.3 | [Screen spec](../../screens/screen-spec/M02/screen-spec-SCR-M02-001.md) |
| `SCR-M02-002` — Checkpoint content | Bài đọc, nhãn nguồn và media có điều kiện | [Screen spec](../../screens/screen-spec/M02/screen-spec-SCR-M02-002.md) |
| `SCR-M02-003` — Session completion | Tóm tắt lượt ghé, xác nhận và phản hồi sync riêng | [Screen spec](../../screens/screen-spec/M02/screen-spec-SCR-M02-003.md) |
| `SCR-M02-004` — Trang mở từ mã QR | Bề mặt đọc sáng như `SCR-M02-002`; nút VI/EN ở đầu trang; gợi ý khách tự do và các banner (đóng tạm, mã không hợp lệ, cần kết nối, tự kết thúc chuyến trước) dùng nhãn chữ cùng màu semantic; vùng thông báo và xác nhận lượt ghé theo 5.3 | [Screen spec](../../screens/screen-spec/M02/screen-spec-SCR-M02-004.md) |
| `SCR-M03-000` — Admin login | Form thông tin đăng nhập tập trung | [Screen spec](../../screens/screen-spec/M03/screen-spec-SCR-M03-000.md) |
| `SCR-M03-001` — Route administration | Tìm kiếm/danh sách và chi tiết tuyến | [Screen spec](../../screens/screen-spec/M03/screen-spec-SCR-M03-001.md) |
| `SCR-M03-002` — Route editor | Field nhóm và danh sách checkpoint có thứ tự; nút dịch "→" và trạng thái dịch theo 5.3 | [Screen spec](../../screens/screen-spec/M03/screen-spec-SCR-M03-002.md) |
| `SCR-M03-003` — Checkpoint, QR and content | Tab chi tiết/nội dung/QR và điều khiển media; nút dịch "→" và trạng thái dịch theo 5.3 | [Screen spec](../../screens/screen-spec/M03/screen-spec-SCR-M03-003.md) |
| `SCR-M03-004` — Review and publication | Danh tính revision, khoảng trống và so sánh | [Screen spec](../../screens/screen-spec/M03/screen-spec-SCR-M03-004.md) |
| `SCR-M03-005` — Operations reports | RPT-01 thẻ tóm tắt; RPT-02 hàng checkpoint | [Screen spec](../../screens/screen-spec/M03/screen-spec-SCR-M03-005.md) |
| `SCR-M03-006` — Accounts and roles | Form lời mời và nhãn role/status | [Screen spec](../../screens/screen-spec/M03/screen-spec-SCR-M03-006.md) |
| `SCR-M03-007` — Invitation and recovery | Form thông tin đăng nhập và phản hồi | [Screen spec](../../screens/screen-spec/M03/screen-spec-SCR-M03-007.md) |
| `SCR-M03-008` — Thư viện điểm dừng | Workspace M03: danh sách/chi tiết, form song ngữ nhóm lại, chip trạng thái bằng từ vựng của entity, bản nháp tách khỏi bản đã xuất bản, dialog riêng cho đóng tạm/mở lại/lưu trữ/hủy; nhóm hành động theo 5.3; nút dịch "→" cho tên điểm dừng | [Screen spec](../../screens/screen-spec/M03/screen-spec-SCR-M03-008.md) |
| `SCR-M03-009` — Nhật ký hệ thống | Workspace M03: bảng chỉ đọc có bộ lọc, cột trước/sau căn chỉnh, kết quả bằng chữ (Thành công / Không thành công), huy hiệu "tự xuất bản"; nội dung trước/sau rút gọn theo 5.3 | [Screen spec](../../screens/screen-spec/M03/screen-spec-SCR-M03-009.md) |

---

## 9. Mascot Mila

Hành vi (khi nào Mila xuất hiện, nói gì, ưu tiên, an toàn) thuộc [Spec Mascot](../spec/spec-Mascot.md). Mục này chỉ định nghĩa hình thức. Chi tiết tư thế, animation và đặc tả ảnh: [docs/mascot/MASCOT_ASSET_SPECIFICATION.md](../mascot/MASCOT_ASSET_SPECIFICATION.md).

### 9.1 Nhận diện

- Ba neo luôn có mặt: lông nâu–kem; khăn xanh lá có biểu tượng lá trắng; ba lô thám hiểm xanh rêu có cuộn chăn. Avatar tròn chỉ cần hai neo đầu.
- Ảnh render 3D dạng raster, phục vụ bằng WebP có alpha. Không chuyển sang SVG, không vẽ lại nhân vật.
- Mila đứng cạnh, không thay hay đè lên logo Vườn.

### 9.2 Slot và kích thước

Mila chỉ hiện trong slot do layout của màn đặt sẵn và chiếm chỗ thật (danh sách slot: Spec Mascot §5.1). Từ v1.5 (CHG-MASCOT-2026-11-24-05) slot **không có Mila thì không chiếm chỗ**: khi Mila xuất hiện, nội dung bên dưới dời xuống và Mila vào bằng animation sẵn có (AN-ENTER/AN-POP); Mila vẫn không bao giờ đè nội dung. SCR-M01-002 dùng đầu màn **"tấm biển kính"** (phương án C, chủ dự án chọn 2026-11-24): tiêu đề nằm trên một tấm kính mờ cùng chất liệu ô chọn (nền `m01-deep` 62%, viền `paper` 35%, bo `--radius-lg`), Mila DOCK cỡ `--mascot-size-dock-catalog-narrow` (màn hẹp hơn 360px: `--mascot-size-md`, tiêu đề giữ một dòng) đứng ở mép phải tấm, đầu nhô lên trên mép tấm khoảng `--space-6` + `--space-1`; bong bóng ở hàng dưới, đuôi chỉ lên Mila như §9.3a. Không có Mila thì chỉ còn tấm có tiêu đề. Cỡ chốt 2026-11-22 sau khi thử trên điện thoại (Mila 72px quá nhỏ để thu hút):

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--mascot-size-sm` | 56px | AVATAR (ảnh avatar MA-11), cạnh toast trang nội dung |
| `--mascot-size-md` | 72px | INLINE (cạnh câu thông báo, lỗi, dialog) |
| `--mascot-size-dock-catalog` | 96px | DOCK ở hero SCR-M01-001 (màn ≥ 360px; v1.6: 112px → 96px, phương án C) |
| `--mascot-size-dock-catalog-narrow` | 88px | DOCK ở hero SCR-M01-001 khi màn hẹp hơn 360px, để nút "Gợi ý tuyến" vẫn một dòng (v1.3; v1.6) |
| `--mascot-size-dock-trip` | 128px | DOCK trên nút Quét QR, SCR-M02-001 |
| `--mascot-size-dock-end` | 72px (v1.5; trước 104px cạnh huy hiệu) | DOCK trong thẻ "Hẹn gặp lại", SCR-M02-003 (phương án E, 2026-11-24): Mila thay trái tim, căn giữa thẻ; lúc ăn mừng 1,5 lần cỡ này, bong bóng ở hàng trên thẻ đuôi chỉ xuống. Huy hiệu đứng một mình ở giữa đầu màn |
| `--mascot-size-xl` | 200px | Lớp phủ giới thiệu (INTRO), CELEBRATE |
| `--mascot-bubble-max-width` | 240px | Bong bóng; vẫn co theo màn 320px |

Ảnh 240px đủ nét cho cỡ ≤ 128px ở mật độ 2×; INTRO/CELEBRATE dùng ảnh 480px.

### 9.3 Bong bóng

Kiểu **"Giấy dã ngoại"** (chọn 2026-11-22 từ mockup): bong bóng là lời của Mila, không giống hộp thông báo hệ thống.

| Bề mặt | Nền / chữ | Viền | Tương phản |
|---|---|---|---|
| Sáng (M01, M02 reader, kết quả, nền rừng) | `#fffaf0` (token mới `--mascot-bubble-surface`) / `m01-ink` | 1.5px `m01-forest`; bóng đổ phẳng `0 3px 0` `m01-forest` 18% | 14.52:1 (chữ), tên "Mila" `m01-forest` 8.89:1, nút × `m01-secondary` 5.96:1 |
| Scanner (tối) | `m02-scanner-surface` / `m02-scanner-text` | 1px `m02-scanner-secondary` (§5.3) | 12.86:1 |

- Bo 18px ở ba góc, **6px ở góc phía Mila**; đuôi nhọn chỉ về Mila (cùng nền, cùng viền). Padding `--space-3`, lề phải chừa chỗ nút đóng.
- Dòng đầu: tên "Mila" 12px, đậm, `m01-forest` (không viết hoa toàn bộ). Chữ thoại 16px (tối thiểu 14px), line-height ≥ 1.45, tối đa 90 ký tự.
- Chữ hiện dần 30 ký tự/giây, có con trỏ mảnh trong lúc hiện; chạm bong bóng hiện hết ngay; giảm chuyển động hoặc công tắc tắt thì hiện ngay.
- Nút đóng "×" nhỏ (biểu tượng 12px, màu `m01-secondary`), tên truy cập "Đóng lời nhắn", vùng chạm 44px; nút hành động theo quy tắc nút của §5.3.
- Bong bóng không dùng màu làm tín hiệu duy nhất và không thay vùng thông báo (§5.3 "Vùng thông báo").

### 9.3a Đầu màn danh mục (SCR-M01-001, v1.6 — phương án C)

- Chủ dự án chọn phương án C ngày 2026-11-25 (CHG-MASCOT-2026-11-25-06) trong bốn phương án A–D, để đổi VI/EN chỉ đổi chữ, không dịch chuyển phần tử.
- Hàng 1: tiêu đề "Danh mục tuyến" / "Routes" một dòng (có lá non), chiếm cả bề ngang.
- Hàng 2: nút "Gợi ý tuyến" kéo hết phần bên trái (nhãn một dòng, mũi tên ở mép phải; màn < 360px bỏ mũi tên và bớt đệm); bên phải là cột **bề rộng cố định** bằng cỡ Mila, Mila DOCK đứng trên dải đồi trang trí (icon `hills`, `m01-forest` 22%) tràn sang trái phía sau nút. Cỡ Mila `--mascot-size-dock-catalog`, màn < 360px `--mascot-size-dock-catalog-narrow`. Hàng 2 được kéo lên `--space-2` vào phần đệm dòng của tiêu đề; Mila không đè chữ.
- Không ô nào co giãn theo độ dài chữ: ở cả VI và EN Mila cùng cỡ, nút và Mila cùng chỗ.
- Tia nắng và hai chiếc lá trôi (T3) nằm sau dải đồi trong cột của Mila, lặp liên tục khi trang trí bật (§4.3.1).
- Bong bóng của danh mục mở **dưới** đầu màn, căn phải, rộng tối đa `--mascot-bubble-max-width` (màn hẹp: toàn chiều rộng), đuôi ở cạnh trên chỉ lên Mila. Mila không đổi chỗ; danh sách tuyến trượt xuống bằng chiều cao bong bóng (`--duration-mascot-pop`) và trượt về khi bong bóng đóng.

### 9.3b Lớp phủ giới thiệu (INTRO, v1.3)

- Phủ cả màn (thanh đầu trang, nội dung, thanh tab): nền `m01-deep` 62%, làm mờ nhẹ phía sau.
- Bong bóng "Giấy dã ngoại" và Mila `--mascot-size-xl` (ảnh vẫy tay MA-01) **căn giữa theo cả hai chiều**; bong bóng ở trên, đuôi ở cạnh dưới chỉ xuống Mila; rộng tối đa 330px, chữ 17px. Không có nút đóng × và không có nút "Bỏ qua".
- Dưới Mila: vòng tròn gợi ý chạm và dòng "Chạm để bắt đầu" / "Tap to start" 14px, chữ trắng.
- Hiện: Mila trồi lên (`--duration-mascot-enter`); đóng: lớp phủ mờ đi, Mila về DOCK ở đầu màn danh mục. Giảm chuyển động hoặc công tắc tắt: đổi tức thì.

### 9.5 Công tắc "Hiệu ứng chuyển động"

Một công tắc duy nhất cho cả app, ở màn **Tài nguyên** SCR-M01-004 (v1.3, quyết định 2026-11-23; Spec Mascot BR-MAS-21); thanh đầu trang không còn nút chuyển động. Từ v1.4 (CHG-MOTION-2026-11-24-01) công tắc đổi tên từ "Chuyển động của Mila", dừng cả Mila lẫn hiệu ứng trang trí T3 (§4.3.1), và **luôn có**, kể cả khi Mila tắt. Không phải nút ẩn Mila.

- Vị trí: một hàng ngay dưới tiêu đề màn, trên danh sách gói.
- Hình: hàng nền trắng bo `--radius-lg`, viền `m01-line`; trái là chữ "Hiệu ứng chuyển động" 16px đậm và câu phụ "Tắt để Mila và hiệu ứng trang trí đứng yên." 14px `m01-secondary`; phải là công tắc trượt (`role="switch"`, `aria-checked`), rãnh `m01-forest` khi bật, `m01-secondary` khi tắt, núm trắng.
- Vùng chạm cả hàng ≥ 44px; focus ring như §6.
- Trạng thái tắt: Mila đứng yên ở tư thế ngữ cảnh trên mọi màn; T3 không chạy; T1, T2 như giảm chuyển động (§4.3.1).

### 9.6 Tư thế mới (v1.4, ảnh đợt 4)

`sorry` (MA-12), `amazed` (MA-14), `walk` (MA-15, nhìn ngang, hai khung bước), `peek` (MA-16, nấp sau một chiếc lá, đạo cụ duy nhất được thêm), `proud` (MA-17, có ảnh chớp mắt). Khung phụ cho cử động thật: vẫy tay 2 khung (MA-21), ăn mừng 2 nhịp (MA-22). Phản ứng nào dùng tư thế nào: [Asset spec](../mascot/MASCOT_ASSET_SPECIFICATION.md) §4 và [Behavior Matrix](../mascot/MASCOT_BEHAVIOR_MATRIX.md). Chưa có ảnh thì dùng tư thế cũ gần nhất. Mila hiện **tối đa một lần** trên một màn; thanh tiến trình không phải chỗ của Mila (Spec Mascot §5.1).

### 9.4 Không đặt Mila trên

Bước chọn ngôn ngữ (lớp phủ giới thiệu hiện sau bước này, §9.3b); khối Cảnh báo an toàn; thông báo tạm đóng; thân bài đọc, thư viện ảnh, trình phát media; dialog xóa gói; lời nhắc cập nhật ứng dụng; mọi màn M03; ảnh in tem QR.
