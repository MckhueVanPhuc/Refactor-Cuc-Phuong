# Mascot Product Brief — Rái cá thám hiểm của Cúc Phương Quest

| Trường | Giá trị |
|---|---|
| Trạng thái | **PROPOSED** — tài liệu thiết kế. Hành vi canonical nằm ở [spec-Mascot](../spec/spec-Mascot.md) v1.0 (baseline 2026-11-21); khi lệch nhau, spec thắng. Xem [README](README.md) §2. |
| Phạm vi | Trải nghiệm du khách M01 (chuẩn bị) và M02 (thực địa). Không áp dụng cho M03. |
| Ngày | 2026-11-20 |
| Nguồn | Concept sheet do người dùng cung cấp (5 ảnh, 2026-11-20); [spec-M01](../spec/spec-M01.md) v3.2; [spec-M02](../spec/spec-M02.md) v3.3; [design-system](../design/design-system.md); code `src/modules/m01`, `src/modules/m02` tại branch `feat/m02-end-screen-redesign` |

## 1. Vấn đề cần giải quyết

Du khách hiện dùng Cúc Phương Quest qua các màn thông tin: danh mục tuyến, chi tiết, quét QR, bài đọc, màn kết quả. Mọi phản hồi đều đúng, nhưng chỉ bằng chữ: "Đã ghi nhận lượt quét.", "Mã không còn hiệu lực…". Ba điểm làm trải nghiệm thiếu sức sống:

1. **Khoảnh khắc quan trọng không có cảm xúc.** Quét được mã QR giữa rừng là lúc du khách vui nhất, nhưng app chỉ hiện một toast.
2. **Hướng dẫn chỉ xuất hiện một lần, dưới dạng chữ.** Ví dụ câu gợi ý khi bắt đầu phiên. Người dùng chưa quen camera quét mã thì không có ai giúp.
3. **Lỗi và mất mạng tạo cảm giác lo lắng.** Thông báo đúng spec nhưng lạnh, trong khi thực địa vốn hay mất sóng.

Mascot rái cá là **một người bạn đồng hành có hành vi nhất quán**, phản ứng với sự kiện thật của app. Nó không phải hình trang trí dán lên từng màn.

## 2. Nguyên tắc thiết kế (bất biến)

| # | Nguyên tắc | Hệ quả |
|---|---|---|
| P1 | **Phản ứng, không làm phiền.** Mascot chỉ lên tiếng khi có sự kiện thật hoặc khi du khách gọi | Không có lời thoại ngẫu nhiên, không nhắc theo giờ trên màn đọc |
| P2 | **Không bao giờ chắn việc chính** | Không che khung quét, nút hành động, bài đọc hay hộp thoại; không giữ focus |
| P3 | **Bổ sung, không thay thế** câu chữ cố định của spec | Câu tạm đóng, mã không hợp lệ, câu hỏi cuối chuyến… giữ nguyên văn (spec-M02 §5.1). Mascot chỉ thêm thông tin hoặc cảm xúc |
| P4 | **An toàn đứng trên vui vẻ** | Khi có thông báo tạm đóng, mascot ẩn. Không bao giờ thúc du khách vội, đi nhanh hay nhìn điện thoại khi di chuyển |
| P5 | **Nói thật** | Không nói "đã đến/có mặt" (SC-M02-013); không nói "đã gửi" trước khi `SYNCED`; không hứa nội dung offline cho điểm không có trong gói |
| P6 | **Không ép đủ 100%** | Không có câu nào ngụ ý phải quét hết mới được kết thúc (BR-M02-006/007) |
| P7 | **Chạy offline như online** | Lời thoại, ảnh, luật đều có sẵn trên máy; không gọi mạng, không gọi AI |
| P8 | **Tôn trọng người dùng** | Mascot luôn có mặt ở màn có slot, không có nút ẩn hay chế độ yên lặng (quyết định 2026-11-21), nên sự tiết chế nằm ở luật hành vi: ít lời, cooldown, giới hạn câu chủ động. Tôn trọng giảm chuyển động; không trẻ con hóa người lớn |
| P9 | **Tôn trọng thiên nhiên** | Lời thoại khuyến khích cất máy ngắm rừng, giữ yên lặng, không chạm vào động thực vật |

## 3. Nhận diện nhân vật

### 3.1 Tên

**Mila** (quyết định người dùng 2026-11-21, MAS-D-01). Dùng nguyên dạng cho cả tiếng Việt và tiếng Anh, không dịch, không thêm dấu. Lời thoại vẫn dùng biến `{name}` (giá trị `Mila`) để tên chỉ nằm ở một chỗ.

Concept "Otter Explorer / Rái Cá Phiêu Lưu" giữ làm **tên mô tả** của nhân vật (ví dụ dùng trong tài liệu), không phải tên gọi trong lời thoại.

### 3.2 Ngoại hình (ba neo nhận diện, theo đề xuất của người dùng)

1. Lông nâu, bụng và mặt màu kem, mắt to.
2. Khăn xanh lá có biểu tượng chiếc lá trắng.
3. Ba lô thám hiểm nhỏ màu xanh rêu, có cuộn chăn.

Ba neo này phải có mặt ở mọi tư thế nhìn thấy được. Riêng avatar tròn chỉ cần neo 1 và 2. Mascot **không có giới tính được nêu**; tài liệu và lời thoại gọi nó bằng tên hoặc "mascot".

Quan hệ với nhận diện Vườn: logo Vườn có hình voọc. Rái cá là **người bạn đồng hành của du khách**, không thay biểu tượng Vườn. Không đặt mascot đè lên logo, và không dùng mascot trong M03.

### 3.3 Tính cách

| Nét | Thể hiện | Không được thành |
|---|---|---|
| Tò mò | Ống nhòm, kính lúp, hỏi "Điểm tiếp theo là gì nhỉ?" | Tọc mạch, hỏi han liên tục |
| Vui vẻ, nhiệt tình | Ăn mừng khi quét được mã | Ồn ào, tung hô quá đà ở mọi thao tác |
| Thông minh | Gợi ý đúng cách khắc phục khi lỗi | Giảng giải dài dòng |
| Khích lệ | Ghi nhận tiến độ thật ("{k}/{n} điểm") | Khen sáo rỗng, thúc ép |
| Tinh nghịch | Biểu cảm, một câu đùa nhẹ khi rảnh | Đùa trong tình huống lỗi hoặc an toàn |
| Yêu thiên nhiên | Nhắc cất máy ngắm rừng, giữ yên lặng | Thuyết giáo, đưa kiến thức khoa học chưa được duyệt |

## 4. Giọng nói và văn phong

| Thuộc tính | Tiếng Việt | English |
|---|---|---|
| Xưng hô | "mình" – "bạn" | "I" – "you" |
| Độ dài | ≤ 90 ký tự mỗi bong bóng, tối đa 2 câu | ≤ 90 characters, max 2 sentences |
| Câu cuối | Thường kết bằng "nhé", "nha", "đó" — không lạm dụng ("nhé" tối đa 1 lần mỗi câu) | Natural contractions ("let's", "you're") |
| Cảm thán | Tối đa 1 dấu "!" mỗi bong bóng | Max one "!" per bubble |
| Emoji | Không dùng (khó đọc ngoài nắng, lệch giữa các máy) | None |
| Từ cấm | "đã đến", "có mặt", "tới nơi" khi nói về lượt ghé; "phải", "bắt buộc" khi nói về số điểm | "arrived", "you're at", "you must" |
| Khi lỗi | Không đổ lỗi ("bạn quét sai"); nêu việc làm tiếp | Never blame; say what to do next |
| Tiếng Anh | Tương đương tự nhiên, không dịch từng chữ | Natural equivalent |

**Từ vựng đặc trưng** (dùng có chừng mực, không lặp lại liên tục): "ba lô" (gói tải trước), "lên đường", "tem QR", "đường mòn", "ngắm rừng". Trong tiếng Anh: "trail", "pack", "head out".

**Biểu cảm đặc trưng** (theo tư thế, xem [Asset spec](MASCOT_ASSET_SPECIFICATION.md)): vẫy tay, đọc bản đồ, ống nhòm, kính lúp, giơ ngón cái, ăn mừng, nghiêng đầu suy nghĩ, ngồi nghỉ.

## 5. Quan hệ với du khách

- **Người bạn đi cùng, không phải người điều khiển.** Mascot không ra lệnh, không chấm điểm, không phán xét.
- **Người biết đường, không phải hướng dẫn viên.** Mascot hướng dẫn cách dùng app và nhắc tôn trọng thiên nhiên. Kiến thức về loài, hang, cây do Ban Quản lý soạn trong M03 và hiển thị ở bài đọc; mascot không tự đưa ra.
- **Biết lùi lại.** Khi du khách đọc bài, nghe audio, xem video hoặc đang có hộp thoại, mascot im lặng.

## 6. Vai trò chức năng

Mỗi vai trò dưới đây đã gắn với màn thật. Chi tiết hành vi nằm ở [Behavior Matrix](MASCOT_BEHAVIOR_MATRIX.md).

| # | Vai trò | Mục đích | Dùng ở (màn thật) | Trạng thái |
|---|---|---|---|---|
| R1 | Onboarding companion | Giới thiệu bản thân một lần khi du khách mới chọn ngôn ngữ; nói rõ sẽ đồng hành | SCR-M01-001 (chuyển từ bước chọn ngôn ngữ sang danh mục) | PROPOSED |
| R2 | Navigation guide | Chỉ lối vào Gợi ý tuyến khi du khách lưỡng lự; nhắc đọc Cảnh báo an toàn trước Start | SCR-M01-001, SCR-M01-003 | PROPOSED |
| R3 | Instruction assistant | Hướng dẫn quét lần đầu, gợi ý khi quét mãi không được | SCR-M02-001 (scanner) | PROPOSED |
| R4 | Exploration companion | Phản ứng khi quét được mã, nhắc cất máy ngắm rừng giữa các điểm | SCR-M02-001, SCR-M02-002 | PROPOSED |
| R5 | Gamification motivator | Ghi nhận tiến độ thật "{k}/{n}", mốc nửa chặng | SCR-M02-001, SCR-M02-002 | PROPOSED; huy hiệu, điểm, câu đố là FUTURE |
| R6 | Achievement celebrator | Ăn mừng điểm cuối và kết thúc chuyến | Hộp thoại cuối chuyến, SCR-M02-003 | PROPOSED |
| R7 | Error and recovery assistant | Diễn giải lỗi thành việc làm tiếp: mã không hợp lệ, cần mạng, tải lỗi, camera | SCR-M01-003/004, SCR-M02-001/002 | PROPOSED |
| R8 | Progress companion | Cho biết hành trình còn nguyên khi quay lại, trạng thái gửi dữ liệu | SCR-M02-001, SCR-M02-003 | PROPOSED |
| R9 | Nature education assistant | Nhắc ứng xử với thiên nhiên (giữ yên lặng, không hái, không cho thú ăn) | SCR-M02-001 giữa các điểm | PROPOSED; danh sách lời nhắc cần Ban Quản lý duyệt (MAS-D-05) |
| R10 | Re-engagement companion | Chào mừng quay lại khi mở lại app giữa chuyến hoặc khi về lại danh mục | SCR-M01-001, SCR-M02-001 | PROPOSED |

## 7. Ngoài phạm vi

- Chatbot, hội thoại tự do, câu trả lời sinh bằng AI.
- Âm thanh hoặc giọng nói của mascot. Ngoài rừng, âm thanh làm phiền người khác và động vật.
- Mascot trong M03 hoặc trên ảnh in tem QR.
- Điểm số, bảng xếp hạng (người dùng quyết định không làm, 2026-11-20).
- Huy hiệu, phần thưởng, mảnh ghép, câu đố: FUTURE. Cần sửa MVP-Scope §4 và spec-M02 trước (người dùng đồng ý hướng này 2026-11-20 nhưng để sau).
- Theo dõi GPS, cảm biến chuyển động hay phát hiện "đang đi bộ" (MVP Won't: GPS).

## 8. Thước đo thành công (đề xuất, đo bằng kiểm thử người dùng, không thu thập dữ liệu)

Analytics hiện chỉ có Vercel ở Production và không mang dữ liệu hành vi du khách. Mascot **không thêm tracking**. Vì vậy các thước đo dưới đây đo qua buổi thử với người thật:

- Người lần đầu dùng quét được mã đầu tiên mà không cần hỏi người khác.
- Không người thử nào thấy mascot che khung quét hoặc làm gián đoạn lúc đọc.
- Người thử mô tả được tính cách mascot bằng 2–3 tính từ trùng với §3.3.
- Không ai hiểu sai rằng phải quét đủ mọi điểm mới được kết thúc.
