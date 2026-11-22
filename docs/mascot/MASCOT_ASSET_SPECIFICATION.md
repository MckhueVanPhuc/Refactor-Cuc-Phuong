# Mascot Asset & Animation Specification

| Trường | Giá trị |
|---|---|
| Trạng thái | **PROPOSED** |
| Ngày | 2026-11-20 |
| Quy tắc repo | AGENTS.md §4: ảnh (không phải icon) chỉ được thêm khi người dùng cung cấp. Agent chỉ cắt, đổi cỡ, nén (người dùng cho phép tạo bản nén 2026-11-20), không vẽ lại nhân vật |

## 1. Kiểm tra artwork hiện có (Stage 1)

### 1.1 Nguồn

Năm concept sheet được người dùng gửi trong phiên chat 2026-11-20. **Chưa có tệp nào trong repository**: `git ls-files assets` không có tệp mascot; `assets/route_finished.png` (chưa track) là mockup màn kết quả, không phải mascot.

| Tệp (đính kèm) | Kích thước | Kênh | Nội dung | Đánh giá |
|---|---|---|---|---|
| Sheet 1 | 1536×1024 | RGB, không alpha, nền trắng | Turnaround 4 góc, 10 biểu cảm, 24 tư thế, 10 biến thể UI, có nhãn chữ | **Bản tham chiếu nhân vật chính (master reference)**: nhất quán nhất, có nhãn, đủ ba neo nhận diện |
| Sheet 2 | 1536×1024 | RGBA | Turnaround, 9 biểu cảm, khoảng 30 tư thế (cúp, đồng xu, rương báu, cờ, laptop, mũ…) | Viền đỏ/vàng quanh lông (lỗi tách nền); nhiều đạo cụ ngoài phạm vi |
| Sheet 3 | 1536×1024 | RGBA | Turnaround, mặt cận, 10 biểu cảm (có mắt sao, mặt cau có), tư thế có loa, biển cảnh báo, khiên, lá | Viền lỗi rõ nhất; biểu cảm cau có lệch tính cách |
| Sheet 4 | 1536×1024 | RGBA | Turnaround, biểu cảm, tư thế (sách, lá che mưa, mũ thám hiểm, nấp sau cây) | Viền lỗi; vài tư thế hay (nấp sau cây, đọc sách) |
| Sheet 5 | 1536×1024 | RGBA | Gần giống sheet 4, có avatar viền xanh | Viền lỗi |

### 1.2 Kết luận

| Câu hỏi | Trả lời |
|---|---|
| Ảnh raster hay vector? | **Raster**, phong cách render 3D (lông, đổ bóng mềm, ánh sáng khối). Không có nguồn vector |
| Ảnh nào dùng làm master reference? | Sheet 1 (turnaround Front / ¾ / Side / Back và expression sheet) |
| Ảnh nào dùng trực tiếp được? | **Không ảnh nào.** Mỗi tư thế trong sheet chỉ cao khoảng 150–250 px, trong khi cần ≥ 480 px cho màn 3×. Sheet 2–5 có viền màu do tách nền; sheet 1 không có alpha |
| Ảnh nào cần tách riêng? | Mọi tư thế dùng trong v1 (§4): mỗi tư thế phải là **một tệp riêng được tạo lại ở độ phân giải cao**, không cắt từ sheet |
| Ảnh nào cần nền trong suốt? | Tất cả tư thế dùng trên giao diện |
| Tư thế còn thiếu? | Chỉ tay về phía khung/nút (có trong sheet 1 "Pointing" nhưng cần góc nhìn rõ hơn); xin lỗi/buồn nhẹ không bi kịch; mắt nhắm (cho chớp mắt ở giai đoạn sau) |
| Đạo cụ nên bỏ | Cúp, huy chương, đồng xu, rương báu (ngụ ý phần thưởng, đang hoãn); laptop, loa (lạc chủ đề rừng); biển cảnh báo (an toàn không dùng mascot) |
| Chi tiết lệch giữa các sheet | Kiểu và màu ba lô, cách buộc khăn, mắt sao, mặt cau có. Sheet production phải bám sheet 1 |

## 2. So sánh định dạng

| Định dạng | Hợp với | Với mascot này | Kết luận |
|---|---|---|---|
| SVG | Hình phẳng, icon | Tự động chuyển ảnh render 3D sang SVG (trace) sẽ cho ra hàng nghìn path, tệp nặng hơn WebP, mất lông và đổ bóng mềm, méo mặt. Đây chính là lý do logo voọc không được chuyển sang SVG (validation-report M01 DV-64) | **Không dùng** cho nhân vật. Vẫn dùng SVG cho bong bóng, lá rơi trong hiệu ứng (vẽ mới trong `assets/icons/`) |
| PNG trong suốt | Bản gốc chất lượng cao | Giữ nguyên chất lượng nhưng nặng (một tư thế 1024 px thường vài trăm KB đến hơn 1 MB) | **Dùng làm bản gốc** (master) lưu trong repo, không phục vụ cho trình duyệt |
| WebP có alpha | Ảnh chi tiết trên web | Nhỏ hơn PNG nhiều lần, giữ alpha, mọi trình duyệt đích (Chrome Android, Safari iOS 14+) đều hỗ trợ | **Định dạng phục vụ chính** |
| AVIF có alpha | Ảnh chi tiết, nén tốt hơn | Nhỏ hơn WebP nhưng mã hóa chậm, giải mã tốn CPU hơn trên máy yếu, Safari chỉ từ iOS 16 | Cân nhắc sau, khi đo thấy lợi đáng kể |
| Lottie | Hoạt ảnh vector | Phải **vẽ lại** nhân vật thành 2D vector, mất phong cách 3D; thêm player runtime (dependency mới, cần duyệt tech-stack) | Không cho v1 |
| Rive | Nhân vật tương tác có rig, state machine | Là lựa chọn tốt nhất cho chớp mắt, nhìn theo, chuyển trạng thái mượt. Nhưng cần **vẽ lại thành vector có rig**, runtime WASM đáng kể (phải đo), dependency mới | Đề xuất **đánh giá ở giai đoạn sau** nếu muốn mascot "sống" hơn mức CSS cho phép; quyết định riêng về phong cách |
| Sprite sheet | Hoạt ảnh theo khung | Giữ phong cách 3D. Mỗi chuỗi 6–8 khung ở 240 px khoảng 60–120 KB WebP (ước tính, phải đo) | Chỉ cho 1–2 khoảnh khắc lớn (vẫy tay chào, ăn mừng cuối chuyến) ở giai đoạn 2, nếu ngân sách cho phép |

### 2.1 Kiến trúc đề xuất

**v1: ảnh tĩnh WebP theo tư thế + chuyển động CSS trên cả hình.**
- Mỗi tư thế là một tệp. "Biểu cảm" là việc đổi tư thế (crossfade 150 ms) kèm chuyển động CSS: nhún, nghiêng, bật, lật nhìn quanh.
- Không cử động được từng bộ phận (chớp mắt, vẫy tay thật). Đây là giới hạn chấp nhận cho v1.
- Không thêm dependency; chạy offline; nhẹ.

**v2 (tùy chọn): sprite sheet** cho vẫy tay chào và ăn mừng cuối chuyến. Kèm khung mắt nhắm để chớp mắt ở DOCK.

**v3 (quyết định riêng): Rive**, nếu chấp nhận vẽ lại mascot thành vector có rig. Kiến trúc engine ([Technical spec](MASCOT_TECHNICAL_SPECIFICATION.md)) tách renderer, nên đổi sang Rive chỉ thay lớp hiển thị, không đổi máy trạng thái hay lời thoại.

## 3. Quy ước đặt tên và thư mục

```text
assets/mascot/
├── source/                       # PNG gốc người dùng cung cấp (không vào bundle)
│   └── ma-07-thumbs-up.png       # 1024×1024, RGBA
└── web/                          # bản do agent xuất từ source (vào bundle, precache)
    ├── ma-07-thumbs-up-240.webp
    └── ma-07-thumbs-up-480.webp
```

- Tên: `ma-<số 2 chữ số>-<tên-tiếng-anh-kebab>[-<cỡ>].<đuôi>`.
- `source/` lưu PNG gốc để xuất lại khi đổi chất lượng nén. Nếu repo không muốn chứa tệp lớn, có thể giữ bên ngoài, nhưng phải ghi rõ nơi lưu (quyết định khi làm change brief).
- Precache chỉ nhận `assets/mascot-*.webp` sau khi Vite băm tên (sẽ chốt mẫu glob trong plan).
- AGENTS.md cần thêm dòng sở hữu cho `assets/mascot/` (ảnh do người dùng cung cấp; agent chỉ xuất bản nén).

## 4. Asset inventory

Cột Status: **NEEDED-v1** (tối thiểu cho bản đầu), **v1.1**, **v2**, **DROP** (không làm).

| Asset ID | Name | Category | Expression/Pose | File Format | UI Usage | Trigger (Behavior) | Status |
|---|---|---|---|---|---|---|---|
| MA-01 | wave | Tư thế toàn thân | Vẫy tay chào, cười | WebP 240/480 (gốc PNG 1024) | INTRO, DOCK | MAS-B-001, 004, 030, 034 | READY 2026-11-22 |
| MA-02 | map | Tư thế toàn thân | Cầm bản đồ, tò mò | WebP 240/480 | DOCK hero, trip | MAS-B-002, 003, 005, 056 | READY 2026-11-22 |
| MA-03 | think | Nửa thân | Tay chống cằm, nghiêng đầu | WebP 240/480 | AVATAR, INLINE | MAS-B-010, 012, 052 | NEEDED-v1 |
| MA-04 | backpack | Tư thế toàn thân | Kéo quai ba lô, sẵn sàng | WebP 240/480 | Panel gói, dialog offline | MAS-B-016, 020, 026, 054, 070, 074 | READY 2026-11-22 |
| MA-05 | binoculars | Tư thế toàn thân | Nhìn ống nhòm | WebP 240/480 | DOCK trip (chưa quét), scanner idle | MAS-B-033, 041 | READY 2026-11-22 |
| MA-06 | magnifier | Nửa thân | Cầm kính lúp | WebP 240/480 | BUSY khi tra mã | MAS-B-043, 044 | NEEDED-v1 |
| MA-07 | thumbs-up | Nửa thân | Giơ ngón cái, cười | WebP 240/480 | Thành công | MAS-B-011, 021, 050, 061, 071, 075 | READY 2026-11-22 |
| MA-08 | cheer | Tư thế toàn thân | Hai tay giơ cao, nhảy | WebP 240/480 | Ăn mừng | MAS-B-051, 055, 060, 062, 063 | READY 2026-11-22 |
| MA-09 | confused | Nửa thân | Gãi đầu, bối rối nhẹ (không buồn bã) | WebP 240/480 | Lỗi, INLINE | MAS-B-007, 015, 022, 024, 025, 031, 038, 046, 047, 072 | READY 2026-11-22 |
| MA-10 | rest | Tư thế toàn thân | Ngồi nghỉ, thư thái | WebP 240/480 | Trạng thái rỗng, nhắc nghỉ | MAS-B-006, 023, 049, 057 | READY 2026-11-22 |
| MA-11 | avatar | Avatar tròn | Mặt cười, khăn, nền tròn xanh | WebP 96/192 | Đầu bong bóng AVATAR | MAS-B-010, 014, 040, 050 (AVATAR) | READY 2026-11-22 |
| MA-13 | point | Nửa thân | Chỉ tay sang ngang | WebP 240/480 | Hướng dẫn | MAS-B-008, 009, 013, 014, 032, 040, 042, 048, 059 | NEEDED-v1 |
| MA-12 | sorry | Nửa thân | Buồn nhẹ, xin lỗi | WebP 240/480 | `CONFLICT` | MAS-B-072 (v1 dùng MA-09) | v1.1 |
| MA-20 | blink | Khung phụ | Mắt nhắm của MA-02 và MA-05 | WebP | Chớp mắt ở DOCK | — | v2 |
| MA-21 | wave-seq | Sprite | 8 khung vẫy tay | WebP sprite | INTRO | MAS-B-001 | v2 |
| MA-22 | cheer-seq | Sprite | 8 khung ăn mừng | WebP sprite | CELEBRATE | MAS-B-062 | v2 |
| FX-01 | leaf | Hiệu ứng | Lá rơi: dùng lại `assets/icons/leaf.svg` làm mask (design-system §7) | SVG có sẵn | CELEBRATE, HOP | MAS-B-062 | Có sẵn |
| — | trophy, coin, medal, chest | Đạo cụ | — | — | — | — | DROP (phần thưởng hoãn) |
| — | laptop, megaphone, warning-sign, shield | Đạo cụ | — | — | — | — | DROP (lạc chủ đề / an toàn) |

**Tối thiểu v1: 12 ảnh tư thế (MA-01…11, MA-13); lá rơi dùng lại `leaf.svg`.** Ngân sách mục tiêu: 12 × ~25 KB (cỡ 480) + 12 × ~10 KB (cỡ 240) ≈ 420 KB nếu precache cả hai cỡ. Vì vậy đề xuất **chỉ precache cỡ 240** cho DOCK/AVATAR/INLINE, còn cỡ 480 nạp khi cần cho INTRO/CELEBRATE (có fallback về cỡ 240 khi offline). Con số thật đo khi có asset (MAS-NFR-01).

**Số đo đợt 1 (2026-11-22, 9 ảnh, WebP chất lượng 0,82):** cỡ 240 từ 10,1 đến 15,7 KB, avatar 96 là 5,0 KB; precache (8 × 240 + avatar 96) **101,5 KB**. Cỡ lớn (8 × 480 + avatar 192) 266,2 KB, nạp khi cần. Chi tiết: specs/005 validation-report §6.

## 5. Đặc tả gửi người tạo ảnh production

Áp cho mọi tệp NEEDED-v1:

1. Một tư thế mỗi tệp, PNG RGBA **trong suốt thật**: xuất thẳng từ công cụ, không tách nền bằng tay. Nếu công cụ không xuất được alpha, dùng nền phẳng một màu không có trong nhân vật (ví dụ hồng tím `#FF00FF`) để agent tách và bạn duyệt lại.
2. Canvas 1024×1024, nhân vật căn giữa, lề tối thiểu 8% mỗi cạnh.
3. **Cùng tỉ lệ và cùng đường chân** giữa các tư thế toàn thân (bàn chân chạm cùng một dòng ngang), để đổi tư thế không bị nhảy.
4. Cùng hướng sáng (từ trên-trái như sheet 1), không đổ bóng xuống nền. Bóng tiếp đất do CSS vẽ.
5. Không chữ, không dấu "?", "!" hay hiệu ứng lấp lánh trong ảnh; các ký hiệu này (nếu cần) do giao diện vẽ, để không phải tạo hai bản ngôn ngữ.
6. Giữ ba neo nhận diện: lông nâu–kem, khăn xanh có lá trắng, ba lô xanh rêu có cuộn chăn (ba lô bám theo sheet 1).
7. Hướng mặt: tư thế toàn thân hơi quay ¾ sang phải. DOCK đặt ở góc dưới bên trái, mascot nhìn vào nội dung.
8. Hệ màu sRGB; không làm mờ viền quá 1 px.
9. Xác nhận quyền sử dụng công khai của công cụ tạo ảnh (MAS-D-13).

## 6. Animation

Mọi animation dùng CSS (`transform`, `opacity`), lấy thời lượng từ token. Khi `prefers-reduced-motion: reduce`, mọi animation ở dưới thành **hiện/ẩn tức thì** hoặc mờ dần ≤ 150 ms; lá rơi không chạy; AN-LOOK, AN-BREATHE, AN-SEARCH, AN-PACK không chạy.

| Animation | Tư thế đầu | Tư thế cuối | Chuyển động | Thời lượng | Lặp | Trigger | Tiếp theo | Công nghệ |
|---|---|---|---|---|---|---|---|---|
| AN-ENTER | — | Tư thế ngữ cảnh | Mờ dần vào + nâng 8 px | 250 ms ease-out | Một lần | Vào slot | AN-BREATHE (DOCK) | CSS |
| AN-EXIT | Bất kỳ | — | Mờ dần ra | 150–200 ms ease-in | Một lần | Rời slot, SUPPRESSED | — | CSS |
| AN-INTRO | — | MA-01 → MA-02 | Trượt lên từ mép dưới 24 px + mờ vào; bong bóng bật sau 150 ms | 300 ms | Một lần | MAS-B-001 | AN-SHRINK | CSS (v2: sprite MA-21) |
| AN-SHRINK | INTRO | DOCK | Thu nhỏ về slot DOCK | 250 ms ease-out | Một lần | Hết INTRO | AN-BREATHE | CSS |
| AN-POP | Hiện tại | Tư thế mới | Crossfade tư thế 150 ms + scale 0,94 → 1 | 200 ms | Một lần | Mỗi bong bóng mới | Giữ | CSS |
| AN-SETTLE | `SPEAKING` | `IDLE` | Bong bóng mờ dần và co lại 4 px; mascot giữ tư thế | 150 ms ease-in | Một lần | Bong bóng kết thúc | AN-BREATHE (DOCK) | CSS |
| AN-BREATHE | DOCK | DOCK | scaleY 1 → 1,015 → 1 | 3 200 ms ease-in-out | Lặp **tối đa 10 s** rồi dừng | Vào IDLE | Đứng yên | CSS |
| AN-LOOK | MA-05 | MA-05 | Lật ngang (scaleX −1) rồi lật lại, nghỉ 400 ms giữa | 1 200 ms | Một lần | MAS-B-041, trước MAS-B-008 | Đứng yên | CSS |
| AN-TILT | Hiện tại | MA-09/MA-03 | Nghiêng ±4° hai nhịp | 400 ms | Một lần | Lỗi, bối rối | Đứng yên | CSS |
| AN-HOP | Hiện tại | MA-07/MA-08 | Nhảy lên 10 px hai lần, có squash nhẹ | 600 ms | Một lần | Thành công | AN-POP (bong bóng) | CSS |
| AN-SEARCH | MA-06 | MA-06 | Lắc lư ±2° | 1 200 ms | Lặp **tối đa 10 s** | BUSY | Kết quả | CSS |
| AN-PACK | MA-04 | MA-04 | Nhún 4 px | 1 200 ms | Lặp **tối đa 10 s** rồi đứng yên tới khi xong | Đang tải gói | AN-HOP / AN-TILT | CSS |
| AN-THUMB | Hiện tại | MA-07 | Bật scale 1 → 1,08 → 1 | 300 ms | Một lần | SYNCED, có sóng lại | Đứng yên | CSS |
| AN-CELEBRATE | MA-08 | MA-08 | AN-HOP ×2 + 12 lá FX-01 rơi chéo, mờ dần | ≤ 2 400 ms | Một lần | MAS-B-062 | INLINE tĩnh | CSS (v2: sprite MA-22) |

**Chớp mắt, nhìn quanh tự nhiên, vẫy tay thật** không làm được với một ảnh tĩnh. Đó là lý do có sprite ở v2 và Rive ở v3. v1 không giả lập bằng cách biến dạng ảnh, vì làm vậy trông máy móc.

**Không để mascot trông quá động:**
- Tại một thời điểm chỉ một animation chạy.
- Không vòng lặp nào quá 10 s.
- Không animation nào khi trang ẩn.
- Mỗi màn tối đa một lần ăn mừng cho mỗi sự kiện.
