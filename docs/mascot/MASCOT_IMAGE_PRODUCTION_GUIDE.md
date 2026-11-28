# Hướng dẫn tạo ảnh Mila (production)

| Trường | Giá trị |
|---|---|
| Dành cho | Người tạo ảnh Mila (chủ dự án) |
| Ngày | 2026-11-21; cập nhật 2026-11-22 (đợt 1 đã giao; đợt 2 bắt buộc; đợt 3 mắt nhắm — spec-Mascot v1.1); 2026-11-24 đợt 4 (§9, spec-Mascot v1.4, CHG-MOTION-2026-11-24-01) |
| Liên quan | [Asset spec](MASCOT_ASSET_SPECIFICATION.md) §4–§5; AGENTS.md §4 (ảnh do người dùng cung cấp; agent chỉ cắt, đổi cỡ, nén) |

Agent không tạo được ảnh nhân vật. Bạn tạo ảnh bằng công cụ AI đã dùng để làm concept sheet; agent kiểm tra, căn chỉnh và xuất bản dùng trên web.

## 1. Cần bao nhiêu ảnh

**Đợt 1 — đủ cho pilot (9 ảnh; đã giao 2026-11-22):**

| Tệp | Tư thế | Dùng ở pilot |
|---|---|---|
| `ma-01-wave.png` | Vẫy tay chào | Lời giới thiệu sau khi chọn ngôn ngữ |
| `ma-02-map.png` | Cầm bản đồ | Danh mục tuyến, chuyến đi đã có lượt quét, khách tự do |
| `ma-04-backpack.png` | Nắm quai ba lô, sẵn sàng | Chuyến chờ gửi khi mất sóng |
| `ma-05-binoculars.png` | Nhìn ống nhòm | Chuyến đi chưa quét điểm nào |
| `ma-07-thumbs-up.png` | Giơ ngón cái | Quét được mã, đã gửi về hệ thống |
| `ma-08-cheer.png` | Hai tay giơ cao, nhảy | Mã đầu tiên, điểm cuối, kết thúc chuyến |
| `ma-09-confused.png` | Gãi đầu, bối rối nhẹ | Lỗi, chuyến không bắt đầu được |
| `ma-11-avatar.png` | Đầu và vai, chính diện | Bong bóng nhỏ (chế độ AVATAR) |
| `ma-10-rest.png` | Ngồi nghỉ | Chuyến tự kết thúc (MAS-B-063) |

**Đợt 2 — bắt buộc trước US5/US6 (3 ảnh; quyết định 2026-11-22):** `ma-03-think.png` (chống cằm suy nghĩ), `ma-06-magnifier.png` (cầm kính lúp), `ma-13-point.png` (chỉ tay sang ngang). Đính kèm sheet 1 và ảnh `ma-01-wave.png` đã duyệt làm tham chiếu.

Chưa có ảnh nào thì app dùng hình giữ chỗ (đĩa tròn), nên thiếu ảnh không làm hỏng gì.

## 2. Yêu cầu kỹ thuật cho mọi ảnh

1. **PNG, nền trong suốt thật**, xuất thẳng từ công cụ. Không tự xóa nền bằng công cụ khác (đó là nguyên nhân viền đỏ/vàng ở sheet 2–5).
   - Nếu công cụ không xuất được nền trong suốt: dùng nền phẳng một màu **hồng tím `#FF00FF`**, không bóng, không chuyển màu. Agent sẽ tách nền và gửi lại để bạn duyệt.
2. **Vuông 1024×1024 px** (tối thiểu 768×768).
3. Một tư thế mỗi ảnh, nhân vật ở giữa, **lề trống ít nhất 8%** mỗi cạnh (khoảng 80 px). Không cắt mất tai, đuôi, bàn chân.
4. **Cùng cỡ nhân vật** giữa các ảnh toàn thân: chiều cao từ chân tới đỉnh tai khoảng 80% chiều cao ảnh; bàn chân chạm cùng một đường ngang (trừ `cheer` đang nhảy).
5. Ánh sáng từ **trên-trái**, đổ bóng mềm trên nhân vật; **không đổ bóng xuống nền**, không vệt sáng, không lấp lánh.
6. **Không chữ, không ký hiệu** trong ảnh (không "?", "!", "Zzz", ngôi sao, tim). Giao diện tự vẽ nếu cần.
7. Không đạo cụ ngoài danh sách: không cúp, huy chương, đồng xu, rương, laptop, loa, biển cảnh báo, khiên, mũ. Ngoại lệ duy nhất (v1.4): một chiếc lá rừng lớn trong `ma-16-peek`.
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
Backpack exactly as in the reference: moss-green canvas backpack, a moss-green rolled blanket strapped on top, brown leather straps with brass (gold-colored) buckles.
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
   - Đợt 1 (2026-11-22) xuất bằng Chromium của Playwright (devDependency có sẵn): thu nhỏ từng nửa với làm mịn chất lượng cao, mã hóa WebP 0,82. Không cài thêm công cụ; quy trình ghi ở `assets/mascot/README.md`.
5. Ảnh gốc giữ nguyên trong `assets/mascot/source/`, không sửa.

## 8. Đợt 2 và đợt 3 (spec-Mascot v1.1, 2026-11-22)

### 8.1 Đợt 2 — ba tư thế mới (bắt buộc trước khi cài luồng quét và tải)

| Tệp | Dùng khi | Loại | Prompt tư thế (dán sau Prompt nhân vật §4) |
|---|---|---|---|
| `ma-06-magnifier.png` | Đang kiểm tra mã QR, chờ mạng (AN-THINK) | Nửa thân | Dùng prompt §5 |
| `ma-03-think.png` | Đang tải, gợi ý tuyến không có kết quả | Nửa thân | Dùng prompt §5 |
| `ma-13-point.png` | Hướng dẫn: chỉ về nút Quét QR, phần cảnh báo an toàn | Nửa thân | Dùng prompt §5 |

Cách làm như đợt 1 (§3), thêm hai điểm:

1. Đính kèm **ba** ảnh tham chiếu: sheet 1, `ma-01-wave.png` và `ma-08-cheer.png` đã duyệt (trong `assets/mascot/source/`). Ảnh đã duyệt giữ nhân vật không bị lệch dần.
2. Prompt nhân vật §4 đã có câu mô tả ba lô (xanh rêu, cuộn chăn cùng màu, khóa đồng). Ảnh nửa thân thường chỉ thấy quai ba lô: quai phải màu da nâu, khóa đồng.

Nửa thân nghĩa là cắt ngang hông, mép cắt chạm đáy khung (như `ma-07-thumbs-up`, `ma-09-confused`). Không cần lề 8% ở cạnh dưới.

### 8.2 Đợt 3 — ảnh mắt nhắm cho chớp mắt (5 ảnh)

Mỗi ảnh là **bản sao của một ảnh đã duyệt, chỉ khác đôi mắt nhắm**. App đổi sang ảnh này 120 ms rồi đổi lại, nên mọi thứ khác (tư thế, vị trí, cỡ, màu, ánh sáng, viền) phải **giống hệt từng điểm ảnh**; lệch một chút là Mila "giật" khi chớp.

| Tệp cần tạo | Từ ảnh gốc |
|---|---|
| `ma-20-map-blink.png` | `ma-02-map.png` |
| `ma-20-binoculars-blink.png` | `ma-05-binoculars.png` (mắt sau ống nhòm: chỉ phần mí mắt lộ ra) |
| `ma-20-thumbs-up-blink.png` | `ma-07-thumbs-up.png` |
| `ma-20-backpack-blink.png` | `ma-04-backpack.png` |
| `ma-20-rest-blink.png` | `ma-10-rest.png` |

`ma-08-cheer` đã nhắm mắt nên không cần. `ma-01-wave`, `ma-09-confused`, `ma-11-avatar` không đứng lâu ở DOCK nên chưa cần.

**Không tạo ảnh mới từ đầu.** Tạo lại cả ảnh sẽ ra tư thế khác. Dùng tính năng **sửa một vùng của ảnh có sẵn** (inpainting / chỉnh sửa vùng chọn) của công cụ bạn đang dùng:

1. Mở ảnh gốc đã duyệt trong công cụ, chọn chức năng sửa ảnh (edit / chỉnh sửa vùng / generative fill).
2. **Tô chọn chỉ vùng hai mắt** (cả mí và lông mày nếu cần), không chọn mũi, má hay khăn.
3. Dán prompt:

   ```text
   Edit only the selected eye area. Make both eyes gently closed in a natural blink: soft curved eyelids, same fur color and shading as the face, small eyelashes line, relaxed happy expression. Keep everything outside the selection exactly unchanged: same pose, same size, same position, same lighting, same transparent background. No other changes.
   ```

4. Chọn bản mà mí mắt khớp màu lông và ánh sáng nhất; mắt nhắm phải trông **vui, thư giãn**, không giống đang buồn ngủ hay nhăn mặt.
5. Tải về **PNG nền trong suốt, cùng kích thước với ảnh gốc** (1254×1254). Nếu công cụ đổi kích thước hoặc thêm nền, báo agent: agent căn lại hoặc gửi bạn làm lại.
6. Đặt đúng tên ở bảng trên, chép vào `assets/mascot/source/`.

Nếu công cụ không có chức năng sửa vùng chọn: dùng một trình sửa ảnh có lớp (Photopea miễn phí trên web, Photoshop, Krita), mở ảnh gốc, vẽ đè mí mắt nhắm lên một lớp riêng ở vùng mắt, xuất PNG cùng kích thước. Không cắt, không dịch, không đổi cỡ ảnh.

### 8.2a Kết quả đợt 3 (2026-11-23)

Năm ảnh mắt nhắm nhắm đủ hai mắt, biểu cảm đúng. Công cụ trả về 2048 px, nền trắng và vẽ lại cả ảnh; agent ghép **chỉ vùng mắt** lên ảnh gốc (assets/mascot/README.md), nên không cần tạo lại. Lần sau, nếu công cụ có tùy chọn "giữ kích thước gốc" và "nền trong suốt" thì bật lên.

### 8.3 Agent kiểm gì khi nhận ảnh

- Đợt 2: như §7 (kích thước, nền trong suốt, viền, mảng rời, nhất quán với ảnh đã duyệt).
- Đợt 3: so ảnh mắt nhắm với ảnh gốc **từng điểm ảnh**; chỉ vùng quanh mắt được khác. Agent báo vùng khác nằm ở đâu và có lệch ngoài mắt không, kèm ảnh so sánh; ghép thử chớp mắt trên app để bạn xem.
- Thiếu ảnh mắt nhắm của tư thế nào thì tư thế đó không chớp mắt; app không hiện hình giữ chỗ.

### 8.4 Xác nhận

Khi giao: chép tệp vào `assets/mascot/source/` và báo agent "đã có ảnh đợt 2 / đợt 3", kèm xác nhận quyền sử dụng như đợt 1 (bạn tự thiết kế).

## 9. Đợt 4 (spec-Mascot v1.4, 2026-11-24)

Cho giai đoạn motion (change brief CHG-MOTION-2026-11-24-01). Thiếu ảnh nào thì app dùng tư thế cũ gần nhất ([Behavior Matrix](MASCOT_BEHAVIOR_MATRIX.md) §3b), nên không phải chờ đủ 9 tệp.

### 9.1 Đợt 4A — năm tư thế mới (tạo từ đầu)

Cách làm như đợt 2 (§8.1): đính kèm sheet 1, `ma-01-wave.png`, `ma-08-cheer.png`; dán **Prompt nhân vật** §4 (giữ nguyên) rồi prompt tư thế dưới đây. Nửa thân: mép cắt chạm đáy khung.

| Tệp | Loại | Dùng ở đâu |
|---|---|---|
| `ma-12-sorry.png` | Nửa thân | Xin lỗi nhẹ khi `CONFLICT` (thay `confused` đang tạm dùng) |
| `ma-14-amazed.png` | Nửa thân | Lượt ghé được ghi, nội dung điểm mới hiện ra |
| `ma-15-walk.png` | Toàn thân, nhìn ngang | Quay lại màn chuyến đi sau lượt ghé mới ("Bây giờ tham quan thôi!") |
| `ma-16-peek.png` | Nửa thân, có lá | Trạng thái rỗng (danh mục, Tài nguyên) |
| `ma-17-proud.png` | Toàn thân | Màn kết quả, đứng cạnh huy hiệu |

`ma-12-sorry.png`

```text
Half body from the hips up, front three-quarter view, both paws held together in front of the chest, head slightly lowered and tilted, ears a little down, small apologetic smile, eyebrows gently raised. Mildly sorry, warm and reassuring. Not crying, not sad, not dramatic.
```

`ma-14-amazed.png`

```text
Half body from the hips up, front three-quarter view, both paws raised near the cheeks in delighted surprise, eyes wide open and sparkling with big white highlights, small round open "wow" mouth, ears perked up. Joyful discovery, excited but gentle. No sparkles, no stars, no symbols around the character.
```

`ma-15-walk.png`

```text
Full body, clean side view facing right, walking forward mid-stride on a trail: left leg forward, right leg back, arms swinging naturally, backpack clearly visible on the back, tail behind. Happy determined smile, looking ahead to the right. Clear readable silhouette that still reads well when shown very small (48 px). Feet on the same baseline as the other full-body poses. No ground, no path, no motion lines.
```

`ma-16-peek.png`

```text
Half body, the character peeking out from behind one large fresh green forest leaf held upright with one paw, the leaf covers the lower half of the body, only the head, one shoulder and the other paw are visible, curious friendly eyes looking to the right, small playful smile. The leaf is a single simple broad tropical forest leaf, natural green with soft veins, no flowers, no other plants.
```

`ma-17-proud.png`

```text
Full body, standing, three-quarter view to the right, both paws on the hips, chest out, chin slightly up, confident proud satisfied smile with eyes open, bandana and backpack clearly visible. Feeling of "I finished the whole trail!". No trophy, no medal, no flag, no props.
```

### 9.2 Đợt 4B — bốn khung phụ (sửa vùng trên ảnh đã duyệt)

Cách làm như đợt 3 (§8.2): **không tạo ảnh mới**; mở ảnh gốc đã duyệt, dùng chức năng sửa vùng chọn, chỉ tô vùng ghi trong bảng. Bật "giữ kích thước gốc" và "nền trong suốt" nếu công cụ có. Nếu ảnh trả về khác cỡ hoặc có nền, agent ghép vùng khác biệt lên ảnh gốc như đợt 3. Làm 4B sau khi `walk` và `proud` của 4A đã duyệt.

| Tệp | Từ ảnh gốc | Vùng tô chọn | Dùng cho |
|---|---|---|---|
| `ma-15-walk-f2.png` | `ma-15-walk.png` | Hai chân và hai tay | Bước 2 khung (AN-WALK) |
| `ma-21-wave-f2.png` | `ma-01-wave.png` | Cánh tay đang vẫy và bàn tay | Vẫy tay thật khi giới thiệu (MA-21) |
| `ma-22-cheer-f2.png` | `ma-08-cheer.png` | Hai cánh tay | Ăn mừng 2 nhịp (MA-22) |
| `ma-20-proud-blink.png` | `ma-17-proud.png` | Vùng hai mắt | Chớp mắt ở màn kết quả (prompt §8.2) |

`ma-15-walk-f2.png`

```text
Edit only the selected legs and arms. Show the opposite step of the same walk cycle: right leg forward, left leg back, arms swinging the opposite way. Keep the body, head, backpack, tail, size, position, lighting and transparent background exactly unchanged. Feet stay on the same baseline. No other changes.
```

`ma-21-wave-f2.png`

```text
Edit only the selected raised arm and paw. Same waving gesture, but the forearm tilted about 30 degrees toward the head, as the other half of a friendly wave. Keep everything outside the selection exactly unchanged: same pose, face, size, position, lighting and transparent background. No other changes.
```

`ma-22-cheer-f2.png`

```text
Edit only the selected arms. Both arms raised in a wide V shape, paws open, slightly lower and wider than the original, as the second beat of a happy cheer. Keep everything outside the selection exactly unchanged: same jump, face, size, position, lighting and transparent background. No confetti, no stars. No other changes.
```

### 9.3 Giao và kiểm

- Checklist §6; đạo cụ lá chỉ ở `ma-16-peek`.
- Chép vào `assets/mascot/source/`, báo agent "đã có ảnh đợt 4A" / "đợt 4B", kèm xác nhận quyền sử dụng (OD-MAS-07).
- Agent kiểm như §7 (4A) và §8.3 (4B: so từng điểm ảnh, chỉ vùng đã tô được khác), xuất WebP và đo ngân sách precache (≤ 120 KB thêm vào, change brief §5).

### 9.4 Kết quả đợt 4 (2026-11-24)

- **4A đạt cả 5 ảnh**: nền trong suốt thật, cùng phong cách; đã xuất (assets/mascot/README.md "Đợt 4").
- **4B**: `ma-15-walk-f2` đạt (thân và đầu trùng ảnh gốc, chỉ chân và tay đổi). **Ba ảnh cần làm lại**, vì công cụ vẽ lại cả hình nên ghép vùng không chồng khít được:
  - `ma-21-wave-f2`: đầu vẽ lại to hơn và lệch chỗ → khi đổi khung đầu "nhảy".
  - `ma-22-cheer-f2`: thân vẽ lại khác tư thế → vùng ghép bị mờ.
  - `ma-20-proud-blink`: tông màu ngả cam; sau khi cân màu, vùng mõm vẫn xám hơn ảnh gốc → nháy màu khi chớp.
- Cách làm lại khuyến nghị: dùng trình sửa ảnh có lớp (Photopea, Photoshop, Krita) như cuối §8.2 — mở **ảnh gốc đã duyệt**, chỉ vẽ lại tay (hoặc mắt) trên một lớp riêng, xuất PNG **cùng kích thước**, không cắt, không đổi cỡ. Nếu dùng công cụ AI, chọn chế độ sửa vùng chọn và bật "giữ phần còn lại" (nếu có).
- Trong lúc chờ, app chạy vẫy tay, ăn mừng và đứng tự hào với ảnh gốc (không đổi khung, `proud` không chớp mắt).

## 10. Đợt 5 — Mila chỉ tay sang trái (2026-11-28)

Chủ dự án yêu cầu 2026-11-28: ở hero Danh mục tuyến, câu chạm "…hoặc thử Gợi ý tuyến" đang dùng `ma-13-point` (chỉ sang **phải**), trong khi nút "Gợi ý tuyến" nằm bên **trái** Mila. Cần một ảnh chỉ sang trái.

**Không lật ngang ảnh cũ**: lật làm ánh sáng thành từ trên-phải (sai §2.5), lá trên khăn và khóa ba lô đổi phía so với sheet 1.

Cách làm như đợt 2 (§8.1): đính kèm **sheet 1**, `ma-13-point.png` và `ma-02-map.png` (để giữ cỡ toàn thân và đường chân); dán **Prompt nhân vật** §4 (giữ nguyên) rồi prompt tư thế dưới đây. Toàn thân vì Mila ở hero đứng cả người trên đồi, cùng cỡ với `ma-02-map`.

`ma-18-point-left.png`

```text
Full body, standing, body turned three-quarters to the LEFT (the character's right side is closer to the viewer), the paw nearest the viewer stretched out clearly to the LEFT at chest height with the index finger pointing left, the other paw resting on the backpack strap. Head turned to look in the same direction it points (to the left), friendly encouraging smile, eyes open. The pointing arm is fully inside the frame with the 8% margin. Feet on the same baseline and the character the same size as the other full-body poses (ma-02-map). Light still comes from the top-left. Do not mirror the reference: the white leaf on the bandana and the brass buckles stay exactly as in the character sheet.
```

Kiểm thêm khi nhận ảnh: ngón tay chỉ rõ sang trái khi thu nhỏ còn 96 px; đầu và tay không chạm mép ảnh; tông lông và khăn khớp `ma-02-map` đặt cạnh nhau.
