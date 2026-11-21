# Hướng dẫn tạo ảnh Mila (production)

| Trường | Giá trị |
|---|---|
| Dành cho | Người tạo ảnh Mila (chủ dự án) |
| Ngày | 2026-11-21 |
| Liên quan | [Asset spec](MASCOT_ASSET_SPECIFICATION.md) §4–§5; AGENTS.md §4 (ảnh do người dùng cung cấp; agent chỉ cắt, đổi cỡ, nén) |

Agent không tạo được ảnh nhân vật. Bạn tạo ảnh bằng công cụ AI đã dùng để làm concept sheet; agent kiểm tra, căn chỉnh và xuất bản dùng trên web.

## 1. Cần bao nhiêu ảnh

**Đợt 1 — đủ cho pilot (8 ảnh):**

| Tệp | Tư thế | Dùng ở pilot |
|---|---|---|
| `ma-01-wave.png` | Vẫy tay chào | Lời giới thiệu sau khi chọn ngôn ngữ |
| `ma-02-map.png` | Cầm bản đồ | Danh mục tuyến, chuyến đi đã có lượt quét, khách tự do |
| `ma-04-backpack.png` | Nắm quai ba lô, sẵn sàng | Chuyến chờ gửi khi mất sóng |
| `ma-05-binoculars.png` | Nhìn ống nhòm | Chuyến đi chưa quét điểm nào |
| `ma-07-thumbs-up.png` | Giơ ngón cái | Quét được mã, đã gửi về hệ thống |
| `ma-08-cheer.png` | Hai tay giơ cao, nhảy | Mã đầu tiên, điểm cuối, kết thúc chuyến |
| `ma-09-confused.png` | Gãi đầu, bối rối nhẹ | Lỗi, chuyến không bắt đầu được |
| `ma-11-avatar.png` | Đầu và vai, chính diện | Bong bóng nhỏ |

**Đợt 2 — sau pilot (4 ảnh):** `ma-03-think.png` (chống cằm suy nghĩ), `ma-06-magnifier.png` (cầm kính lúp), `ma-10-rest.png` (ngồi nghỉ), `ma-13-point.png` (chỉ tay sang ngang).

Chưa có ảnh nào thì app dùng hình giữ chỗ (đĩa tròn), nên thiếu ảnh không làm hỏng gì.

## 2. Yêu cầu kỹ thuật cho mọi ảnh

1. **PNG, nền trong suốt thật**, xuất thẳng từ công cụ. Không tự xóa nền bằng công cụ khác (đó là nguyên nhân viền đỏ/vàng ở sheet 2–5).
   - Nếu công cụ không xuất được nền trong suốt: dùng nền phẳng một màu **hồng tím `#FF00FF`**, không bóng, không chuyển màu. Agent sẽ tách nền và gửi lại để bạn duyệt.
2. **Vuông 1024×1024 px** (tối thiểu 768×768).
3. Một tư thế mỗi ảnh, nhân vật ở giữa, **lề trống ít nhất 8%** mỗi cạnh (khoảng 80 px). Không cắt mất tai, đuôi, bàn chân.
4. **Cùng cỡ nhân vật** giữa các ảnh toàn thân: chiều cao từ chân tới đỉnh tai khoảng 80% chiều cao ảnh; bàn chân chạm cùng một đường ngang (trừ `cheer` đang nhảy).
5. Ánh sáng từ **trên-trái**, đổ bóng mềm trên nhân vật; **không đổ bóng xuống nền**, không vệt sáng, không lấp lánh.
6. **Không chữ, không ký hiệu** trong ảnh (không "?", "!", "Zzz", ngôi sao, tim). Giao diện tự vẽ nếu cần.
7. Không đạo cụ ngoài danh sách: không cúp, huy chương, đồng xu, rương, laptop, loa, biển cảnh báo, khiên, mũ.
8. Giữ ba neo nhận diện: **lông nâu–kem**, **khăn xanh lá có lá trắng**, **ba lô xanh rêu có cuộn chăn** (avatar không cần ba lô). Bám theo **sheet 1** (bản có nhãn, nền trắng).

## 3. Cách tạo

1. Mở công cụ đã dùng để làm concept. Đính kèm **sheet 1** (turnaround + biểu cảm) làm ảnh tham chiếu ở mọi lần tạo.
2. Mỗi lần tạo **một** tư thế: dán **Prompt nhân vật** (§4) rồi đến **Prompt tư thế** (§5) tương ứng.
3. Chọn bản giống sheet 1 nhất. Nếu khăn, ba lô hay màu lông lệch, tạo lại thay vì chấp nhận.
4. Tải về dạng PNG, đặt **đúng tên tệp** ở §1.
5. Tự kiểm theo checklist §6.
6. Chép tệp vào thư mục `assets/mascot/source/` trong repo (tạo thư mục nếu chưa có), hoặc gửi cho agent trong chat.
7. **Xác nhận quyền sử dụng**: điều khoản của công cụ tạo ảnh cho phép dùng ảnh công khai, cho mục đích của Vườn quốc gia (OD-MAS-07). Ghi tên công cụ và gói dịch vụ đã dùng.

## 4. Prompt nhân vật (dán đầu mọi lần)

```text
Use the attached character sheet as the exact reference. Same character in every image.
Character: "Mila", a cute otter explorer mascot, soft 3D cartoon render, chibi proportions (big head, small body).
Brown fur, cream belly and cream face/muzzle, big glossy dark-brown eyes with white highlights, small black nose, thin whiskers, short rounded ears, short thick tail.
Wears a green bandana scarf tied around the neck with a white leaf emblem on the front.
Carries a small moss-green explorer backpack with a rolled blanket on top and brown leather straps.
Friendly, curious, gentle expression. Warm soft lighting from the top-left, soft shading on the character only.
Output: one single character, centered, full transparent background (alpha), square 1024x1024, at least 8% empty margin on every side, no ground shadow, no text, no symbols, no extra props, no frame, no background scenery.
```

Nếu công cụ không có nền trong suốt, thay câu "full transparent background (alpha)" bằng "flat solid #FF00FF background, no gradient, no shadow".

## 5. Prompt tư thế

Dán sau Prompt nhân vật. "Toàn thân" nghĩa là thấy cả bàn chân; "nửa thân" là từ hông trở lên.

| Tệp | Prompt tư thế |
|---|---|
| `ma-01-wave.png` | `Full body, standing, body turned three-quarters to the right, right paw raised high waving hello, big open happy smile, backpack visible on the back.` |
| `ma-02-map.png` | `Full body, standing, three-quarter view to the right, holding an open folded paper trail map with both paws at chest height, looking at the map with a curious smile. The map has simple green paths, no readable text.` |
| `ma-04-backpack.png` | `Full body, standing, three-quarter view to the right, both paws gripping the backpack shoulder straps, confident ready-to-go smile, chest slightly forward.` |
| `ma-05-binoculars.png` | `Full body, standing, three-quarter view to the right, holding small black binoculars up to the eyes with both paws, looking into the distance to the right, mouth slightly smiling.` |
| `ma-07-thumbs-up.png` | `Half body from the hips up, front three-quarter view, one paw giving a clear thumbs up at shoulder height, cheerful closed-mouth smile, both eyes open.` |
| `ma-08-cheer.png` | `Full body, small happy jump with both feet slightly off the ground, both arms raised high, eyes happily closed or sparkling, wide joyful open mouth. No confetti, no stars.` |
| `ma-09-confused.png` | `Half body from the hips up, front three-quarter view, one paw scratching the side of the head, head slightly tilted, mild puzzled expression with a small uncertain smile. Not sad, not angry.` |
| `ma-11-avatar.png` | `Head and shoulders only, front view, centered, big friendly smile, green bandana with white leaf visible at the bottom. No backpack. Composition fits inside a circle.` |
| `ma-03-think.png` | `Half body, one paw under the chin, head tilted, eyes looking up, thoughtful gentle expression.` |
| `ma-06-magnifier.png` | `Half body, holding a magnifying glass near the face with one paw, examining something curiously, both eyes visible.` |
| `ma-10-rest.png` | `Full body, sitting on the ground relaxed with legs forward, backpack placed beside, calm content smile, eyes open.` |
| `ma-13-point.png` | `Half body, three-quarter view, one paw pointing clearly to the right side, encouraging smile, looking toward where it points.` |

## 6. Checklist tự kiểm trước khi gửi

- [ ] Nền trong suốt (mở ảnh trên nền tối và nền sáng đều không thấy viền màu quanh lông), hoặc nền `#FF00FF` phẳng.
- [ ] 1024×1024 (hoặc ≥ 768×768), một nhân vật, lề đủ, không bị cắt.
- [ ] Đủ ba neo nhận diện (avatar: lông và khăn).
- [ ] Khăn xanh có lá trắng, ba lô xanh rêu có cuộn chăn: giống sheet 1.
- [ ] Không chữ, không ký hiệu, không đạo cụ ngoài danh sách.
- [ ] Biểu cảm đúng tinh thần: không buồn bã, không giận dữ, không quá trẻ con.
- [ ] Đúng tên tệp.
- [ ] Đã ghi tên công cụ và xác nhận quyền sử dụng.

## 7. Agent làm gì khi nhận ảnh

1. Kiểm tự động mỗi tệp: kích thước, kênh alpha, lề, điểm ảnh bán trong suốt có màu lạ quanh viền.
2. Báo lại tệp nào cần tạo lại và vì sao.
3. Căn các ảnh toàn thân về cùng cỡ và cùng đường chân; cắt bớt lề thừa.
4. Xuất bản dùng trên web (240 px và 480 px; avatar 96 và 192 px) vào `assets/mascot/web/`, đo dung lượng so với ngân sách. Máy hiện **chưa có công cụ mã hóa WebP**, nên cần một trong hai cách:
   - Cài công cụ dòng lệnh `cwebp` của Google (libwebp) trên máy, ngoài repo, không phải dependency của dự án. Agent cài được nếu bạn cho phép.
   - Hoặc dùng bản PNG đã thu nhỏ cho pilot, rồi đổi sang WebP sau. PNG nặng hơn, nên không nên dùng cho phát hành Production.
5. Ảnh gốc giữ nguyên trong `assets/mascot/source/`, không sửa.
