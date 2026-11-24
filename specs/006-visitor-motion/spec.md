# Feature Specification: Motion & micro-interactions trên màn du khách M01/M02

**Feature Branch**: `006-visitor-motion` *(định danh thư mục; tài liệu đang ở git branch `docs/motion-baseline`)*

**Created**: 2026-11-24

**Status**: Draft — bản dẫn xuất từ [spec-Mascot](../../docs/spec/spec-Mascot.md) v1.4 và [design-system](../../docs/design/design-system.md) §4.3.1–4.3.2, §5.3, §5.4, §7, §9.5, §9.6

**Input**: Change Brief [CHG-MOTION-2026-11-24-01](change-brief-CHG-MOTION-2026-11-24-01.md) (APPROVED 2026-11-24; OD-MOT-01…06 và §10.1 đã chốt). Nguồn hành vi: spec-Mascot v1.4 BR-MAS-17, 19, 21, 23, 24; US-MAS-09; FR-MAS-011; SC-MAS-008, 011, 014; OD-MAS-21, 22. Nguồn hình thức: design-system §4.3.1 (ba tầng T1/T2/T3, token), §4.3.2 (ngân sách hiệu năng), §5.3 (skeleton, thanh tiến trình), §5.4 (nhấn), §7 (icon), §9.5 (công tắc), §9.6 (tư thế mới); [Asset spec](../../docs/mascot/MASCOT_ASSET_SPECIFICATION.md) §4 và [Behavior Matrix](../../docs/mascot/MASCOT_BEHAVIOR_MATRIX.md) §3b (tư thế đợt 4). Priority: [MVP-Scope.md](../../MVP-Scope.md) §3.7 (Could). Consumer: màn du khách SCR-M01-001…004, SCR-M02-001…005. Ảnh Mila đợt 4A/4B đã giao 2026-11-24 trong `assets/mascot/source/`; người dùng xác nhận quyền sử dụng 2026-11-24 (OD-MAS-07).

> **Quy tắc dẫn xuất.** File này không phải nguồn sự thật. Hành vi của công tắc và của Mila lấy từ spec-Mascot v1.4; hình thức chuyển động lấy từ design-system. Nếu mâu thuẫn, nguồn canonical thắng. Không đổi bất kỳ rule, contract, entity, state, permission, câu cố định, thứ tự bước hay vị trí nút nào của spec-M01, spec-M02 hay spec-M03. Chuyển động chỉ trình bày lại thứ đã có; không thêm nội dung, số liệu hay chữ mới ngoài nhãn công tắc của BR-MAS-21. Không có chi tiết kỹ thuật (thư viện, component, tệp thuộc plan).

## Ranh giới

| Hướng | Nội dung | Ghi chú |
|---|---|---|
| M01, M02 → chuyển động | Trạng thái đã có trên màn (đang tải, đã ghi lượt ghé, gói sẵn sàng, đổi màn) | Chuyển động chỉ đọc trạng thái màn đang hiển thị; không chờ, không làm chậm việc của module |
| Chuyển động → M01, M02, M03 | Không có | Không ghi dữ liệu, không gọi mạng, không lưu lựa chọn (BR-MAS-18) |

M01, M02, M03, mọi contract liên module và dữ liệu của chuyến không đổi.

## Ba tầng chuyển động (design-system §4.3.1)

| Tầng | Phạm vi | Khi giảm chuyển động hoặc công tắc tắt |
|---|---|---|
| **T1 Phản hồi** | Kết quả trực tiếp của thao tác hoặc sự kiện thật: nhấn, lượt ghé được ghi, tiến trình tăng, ✓ gói sẵn sàng | Vẫn có phản hồi: đổi màu hoặc mờ dần ≤ 150 ms, không dịch chuyển |
| **T2 Chuyển cảnh** | Đổi màn, mở thẻ, dialog, thẻ hiện dần khi cuộn, skeleton, thanh "đang tải" | Đổi tức thì; skeleton và thanh đứng yên |
| **T3 Trang trí** | Không mang thông tin: tia nắng, lá trôi, confetti lá | Không chạy; hiện ngay trạng thái cuối |

## User Scenarios & Testing *(mandatory)*

Priority: cả capability là **Could** (MVP-Scope §3.7). P1–P3 là thứ tự giao theo ba đợt của change brief §8: P1 = đợt 1 (phản hồi cốt lõi), P2 = đợt 2 (chuyển cảnh và trạng thái), P3 = đợt 3 (trang trí và phần thưởng). US3 (công tắc và an toàn chuyển động) là nền cho mọi story khác.

### User Story 1 - Mọi cú chạm đều có phản hồi (Priority: P1)

Du khách đeo găng hoặc đang đi bộ chạm vào nút hay thẻ tuyến và thấy ngay nút "lún" xuống, biết thao tác đã được nhận.

**Why this priority**: Phản hồi chạm là chuyển động có ích nhất ngoài thực địa, áp cho mọi màn, rủi ro thấp (design-system §5.4).

**Independent Test**: Trên điện thoại (hoặc giả lập chạm), nhấn giữ nút chính của SCR-M01-003 và một thẻ tuyến ở SCR-M01-001: phần tử co nhẹ ngay khi nhấn, trở về khi nhả; bố cục xung quanh không dịch. Bật giảm chuyển động: chỉ còn lớp phủ màu.

**Acceptance Scenarios**:

1. **Given** một nút hoặc thẻ bấm được trên màn du khách, **When** du khách nhấn, **Then** phần tử co về tỷ lệ nhấn trong thời lượng nhấn và có lớp phủ pressed như §5.4; nhả ra thì về như cũ; phần tử xung quanh không dịch.
2. **Given** thiết bị có con trỏ, **When** rê chuột lên thẻ tuyến, **Then** thẻ nhấc nhẹ cùng lớp phủ hover; thiết bị cảm ứng không có hiệu ứng hover.
3. **Given** giảm chuyển động hoặc công tắc tắt, **Then** không co giãn, không nhấc; chỉ còn lớp phủ màu.
4. **Given** phần tử bị vô hiệu, **Then** không có phản hồi nhấn.
5. **Given** màn M03, **Then** không có thay đổi nào (§5.4 giữ nguyên cho M03).

---

### User Story 2 - Thấy hành trình tiến lên sau mỗi lần quét (Priority: P1)

Sau khi một lượt ghé được ghi lần đầu và du khách trở về màn chuyến đi, điểm vừa quét nảy lên, đoạn đường mòn vẽ tới điểm kế tiếp và thanh tiến trình nhích thêm một nấc, cùng lúc với lời chúc mừng của Mila.

**Why this priority**: Đây là khoảnh khắc "mở khóa" cốt lõi của hành trình, biến con số "k/n" thành cảm giác tiến bộ (change brief §2).

**Independent Test**: Chuyến 4 điểm, đã quét 1. Quét điểm 2, xem nội dung, quay lại SCR-M02-001: điểm 2 nảy một lần, đoạn đường 2→3 vẽ ra, thanh từ 1/4 lên 2/4 với dấu chân ở đầu; câu "Đã quét QR: 2/4 điểm" đúng như trước. Tải lại trang: thanh đứng ở 2/4, không chạy lại hiệu ứng.

**Acceptance Scenarios**:

1. **Given** phiên đang chạy, **Then** SCR-M02-001 có thanh tiến trình hành trình dưới câu "Đã quét QR: k/n điểm": tỷ lệ k/n lấy từ phiên, dấu chân ở đầu phần đã đi, tên truy cập là tiến trình với giá trị k trên n; câu tiến độ giữ nguyên văn (E-SCR-M02-001-25).
2. **Given** du khách trở về SCR-M02-001 ngay sau một lượt ghé **mới** (không phải quét lại), **When** màn hiện, **Then** điểm vừa ghi nảy một lần, đoạn đường mòn tới điểm kế tiếp tự vẽ, thanh tăng từ giá trị cũ lên giá trị mới; mỗi chuyển động chạy một lần.
3. **Given** quét lại một điểm đã có lượt ghé (FR-M02-009), tải lại trang, hoặc mở màn khi không có lượt ghé mới, **Then** thanh và bản đồ hiện thẳng trạng thái hiện tại, không có hiệu ứng mở khóa.
4. **Given** khách tự do (không phiên), **Then** không có thanh tiến trình và không có hiệu ứng (BR-MAS-14).
5. **Given** lượt ghé điểm cuối, **Then** dialog cuối chuyến hiện ngay như BR-M02-021; hiệu ứng mở khóa không làm chậm dialog (SC-MAS-005).
6. **Given** giảm chuyển động hoặc công tắc tắt, **Then** điểm đổi màu trạng thái và thanh hiện giá trị mới bằng mờ dần ≤ 150 ms; không nảy, không vẽ đường.
7. **Given** bất kỳ trường hợp nào, **Then** chữ và trạng thái "Đã quét QR" vẫn là thông tin chính; không câu hay nhãn nào diễn đạt là "đã đến" (SC-M02-013).

---

### User Story 3 - Một công tắc cho mọi hiệu ứng, và chuyển động không bao giờ cản đường (Priority: P1)

Du khách thấy chóng mặt hoặc muốn tiết kiệm pin vào màn Tài nguyên, tắt "Hiệu ứng chuyển động": Mila đứng yên, mọi hiệu ứng trang trí dừng, máy không rung, nhưng mọi phản hồi cần thiết vẫn còn. Máy yếu, chế độ tiết kiệm dữ liệu hoặc giảm chuyển động của hệ điều hành cũng được tôn trọng tự động.

**Why this priority**: Nền an toàn và truy cập cho mọi story khác (BR-MAS-17, 21; WCAG 2.2.2, 2.3.1); thay đổi nhãn công tắc là thay đổi hành vi duy nhất của package.

**Independent Test**: Tắt cờ Mila, mở SCR-M01-004: công tắc "Hiệu ứng chuyển động" vẫn có. Bật cờ, tắt công tắc, đi qua mọi màn du khách: không animation của Mila hay T3 nào chạy, phản hồi nhấn chỉ đổi màu, lượt ghé mới không rung. Bật giảm chuyển động trong hệ điều hành rồi tải lại: công tắc khởi đầu ở "tắt".

**Acceptance Scenarios**:

1. **Given** màn SCR-M01-004, **Then** có đúng một công tắc "Hiệu ứng chuyển động" / "Motion effects" với câu phụ "Tắt để Mila và hiệu ứng trang trí đứng yên." / "Turn off to keep Mila and decorations still.", kể cả khi Mila tắt bằng cờ phát hành (BR-MAS-21, OD-MAS-21; E-SCR-M01-004-21).
2. **Given** công tắc tắt, **Then** trên mọi màn: không animation nào của Mila, không T3, chữ bong bóng hiện ngay, không rung; T1 và T2 như giảm chuyển động; Mila và bong bóng vẫn hiện (US-MAS-09.2, SC-MAS-011).
3. **Given** thiết bị yêu cầu giảm chuyển động, **Then** công tắc khởi đầu ở "tắt" và mọi chuyển động theo cột "giảm chuyển động" của bảng ba tầng (BR-MAS-17).
4. **Given** lựa chọn công tắc, **Then** nó chỉ có hiệu lực trong lần tải trang hiện tại, không được lưu (BR-MAS-18, OD-MOT-03).
5. **Given** thiết bị báo tiết kiệm dữ liệu hoặc bộ nhớ ≤ 2 GB, **Then** T3 không chạy dù công tắc bật; T1, T2 vẫn chạy (design-system §4.3.2).
6. **Given** trang bị ẩn (chuyển ứng dụng, tắt màn hình), **Then** mọi chuyển động dừng và không có vòng lặp nào chạy nền.
7. **Given** công tắc bật lại, **Then** chuyển động của Mila và T3 chạy lại từ lần kế tiếp, không phát bù những gì đã bỏ qua.

---

### User Story 4 - Biết gói đang được tải và khi nào đã xong (Priority: P1)

Du khách chuẩn bị trước chuyến bấm tải gói offline và thấy một vệt "đường mòn" chạy trong thanh trong lúc chờ; khi xong, dấu ✓ hiện ra.

**Why this priority**: Tải gói là bước chờ dài nhất trước chuyến, thường ở nơi mạng yếu; cần một tín hiệu "app vẫn đang làm việc" mà không hứa hẹn sai (change brief §10.1 mục 1).

**Independent Test**: Ở SCR-M01-003, giả lập mạng chậm, bấm Tải về: thanh "đang tải" có vệt chạy liên tục, không có số phần trăm, nhãn "Đang tải…" như cũ, Mila nói ở panel gói như hiện nay. Khi gói sẵn sàng: vệt dừng, dấu ✓ hiện. Giảm chuyển động: vệt đứng yên giữa rãnh.

**Acceptance Scenarios**:

1. **Given** gói đang tải ở SCR-M01-003 hoặc SCR-M01-004, **Then** cạnh nhãn "Đang tải…" sẵn có là một thanh **không xác định**: không số, không phần trăm, không giả tiến độ (design-system §5.3).
2. **Given** tải xong và gói sẵn sàng, **Then** vệt dừng và dấu ✓ hiện một lần (T1); trạng thái chữ của gói như cũ.
3. **Given** tải lỗi, **Then** thanh biến mất; câu lỗi cố định và minh họa Mila như hiện nay (spec-M01 US-M01-03).
4. **Given** Mila đang nói ở slot `package-panel`, **Then** thanh không có hình Mila; luôn chỉ một Mila trên màn (spec-Mascot §5.1, OD-MAS-22).
5. **Given** giảm chuyển động hoặc công tắc tắt, **Then** vệt đứng yên giữa rãnh; ✓ hiện bằng mờ dần.

---

### User Story 5 - Chuyển màn mượt, nội dung hiện ra tự nhiên (Priority: P2)

Du khách chạm một thẻ tuyến và ảnh của thẻ "mở rộng" thành ảnh đầu màn chi tiết; các màn khác chuyển bằng mờ và trượt nhẹ. Khi cuộn danh mục, các thẻ phía dưới hiện dần lần đầu xuất hiện.

**Why this priority**: Làm app có cảm giác liền mạch như ứng dụng di động, nhưng không cần cho việc dùng được (đợt 2).

**Independent Test**: Ở SCR-M01-001 chạm một thẻ: ảnh thẻ chuyển liền sang ảnh đầu SCR-M01-003; Back trở về theo chiều ngược. Trên trình duyệt không hỗ trợ chuyển cảnh: đổi màn tức thì, mọi thứ vẫn dùng được. Cuộn danh mục: thẻ dưới màn đầu hiện dần một lần; cuộn lại không chạy lại; các thẻ ở màn đầu hiện ngay.

**Acceptance Scenarios**:

1. **Given** điều hướng giữa các màn du khách, **Then** màn mới vào bằng chuyển cảnh ≤ 300 ms; không làm chậm việc tải dữ liệu hay focus của màn mới.
2. **Given** chạm thẻ tuyến ở SCR-M01-001 hoặc SCR-M01-002, **Then** ảnh thẻ chuyển thành ảnh đầu SCR-M01-003; quay lại thì theo chiều ngược.
3. **Given** trình duyệt không hỗ trợ chuyển cảnh, giảm chuyển động hoặc công tắc tắt, **Then** đổi màn tức thì.
4. **Given** danh sách thẻ dài, **Then** chỉ thẻ nằm dưới màn đầu hiện dần, mỗi thẻ một lần mỗi lần tải trang; thẻ ở màn đầu hiện ngay; chỗ của thẻ được giữ sẵn nên bố cục không dịch.
5. **Given** màn có scanner đang mở, dialog, thông báo tạm đóng hoặc lời nhắc cập nhật, **Then** chuyển cảnh không che hay trì hoãn chúng.

---

### User Story 6 - Chờ và trống có hồn (Priority: P2)

Khi danh mục đang tải, các thẻ giữ chỗ có một vệt sáng lướt qua như nắng xuyên tán lá. Khi danh sách trống, Mila nấp sau chiếc lá nhìn ra; khi bản ghi chuyến xung đột, Mila xin lỗi nhẹ; khi lượt ghé được ghi, Mila ngạc nhiên thích thú; khi quay lại màn chuyến đi sau lượt ghé mới, Mila sải bước.

**Why this priority**: Làm các trạng thái chờ và trống bớt lạnh lùng, dùng ảnh đợt 4 đã giao (đợt 2).

**Independent Test**: Giả lập danh mục tải chậm: thẻ giữ chỗ có vệt sáng; giảm chuyển động thì đứng yên. Danh mục rỗng và Tài nguyên rỗng: Mila `peek` cạnh câu cố định. Ghi một lượt ghé thường: Mila `amazed` cạnh bong bóng xác nhận. Quay lại SCR-M02-001: Mila `walk` bước hai nhịp rồi về tư thế ngữ cảnh. `CONFLICT` ở SCR-M02-003: Mila `sorry`.

**Acceptance Scenarios**:

1. **Given** danh mục hoặc ảnh đầu màn chi tiết đang tải, **Then** khối giữ chỗ hiện có (đúng kích thước nội dung sắp hiện) có vệt sáng lướt theo nhịp; có trạng thái chữ cho trình đọc màn hình như hiện nay (design-system §5.3).
2. **Given** các phản ứng ở Behavior Matrix §3b (MAS-B-006, 023, 050, 056, 063, 072), **Then** Mila dùng tư thế đợt 4 tương ứng; sự kiện, điều kiện, câu thoại, ưu tiên và slot giữ nguyên.
3. **Given** ảnh đợt 4 của một tư thế chưa có trong bản phát hành hoặc không tải được, **Then** Mila dùng tư thế cũ của bảng Behavior Matrix; màn chạy như hiện nay (BR-MAS-15, 16).
4. **Given** thiết bị offline sau khi app shell đã được lưu, **Then** mọi tư thế đợt 4 dùng trong phản ứng của M02 hiện đủ (SC-MAS-007).
5. **Given** giảm chuyển động hoặc công tắc tắt, **Then** vệt sáng đứng yên; Mila đổi tư thế tức thì, không bước.

---

### User Story 7 - Kết thúc chuyến đáng nhớ (Priority: P3)

Ngay sau khi du khách kết thúc chuyến, huy hiệu hoàn thành "đóng dấu" xuống, vài chiếc lá bay lên rồi rơi, danh sách điểm đã quét hiện lần lượt; sau màn ăn mừng Mila đứng chống hông tự hào cạnh huy hiệu.

**Why this priority**: Tạo cảm xúc ở khoảnh khắc cuối, nhưng không ảnh hưởng chức năng (đợt 3).

**Independent Test**: Kết thúc một chuyến `HOAN_TAT`: huy hiệu hiện với hiệu ứng đóng dấu, confetti lá ≤ 2,4 giây, danh sách điểm hiện lần lượt; chạm bất kỳ đâu bỏ qua được; sau đó Mila `proud` (có chớp mắt). Mở lại màn kết quả: mọi thứ hiện tĩnh. Giảm chuyển động: không confetti, mọi thứ hiện ngay.

**Acceptance Scenarios**:

1. **Given** du khách vừa xác nhận kết thúc và phiên `HOAN_TAT` (cùng điều kiện ăn mừng cấp 3 của BR-MAS-23), **When** SCR-M02-003 mở, **Then** huy hiệu hoàn thành sẵn có hiện với hiệu ứng đóng dấu một lần, confetti lá (dùng lại hình lá sẵn có, ≤ 40 hạt, ≤ 2,4 giây) và danh sách điểm đã quét hiện lần lượt; chạy cùng lúc với ăn mừng của Mila, không kéo dài quá `MASCOT_CELEBRATION_MS`.
2. **Given** du khách chạm trong lúc ăn mừng, **Then** mọi hiệu ứng kết thúc ngay ở trạng thái cuối.
3. **Given** mở lại màn kết quả, phiên tự kết thúc sau 24 giờ, hoặc trạng thái `BO_DO` không đi qua bước xác nhận vừa rồi, **Then** không có hiệu ứng; nội dung hiện tĩnh.
4. **Given** sau ăn mừng hoặc khi mở lại màn, **Then** Mila ở tư thế `proud` cạnh huy hiệu, có chớp mắt và cử chỉ tự động theo BR-MAS-21 (MAS-B-063).
5. **Given** màn kết quả, **Then** không thêm chữ, số, điểm, huy hiệu hay phần thưởng mới nào (spec-M02 §2; MVP-Scope §4); câu cố định, banner đồng bộ và nút "Về danh sách tuyến" giữ nguyên vị trí và thứ tự.
6. **Given** giảm chuyển động, công tắc tắt hoặc máy yếu, **Then** không confetti, không đóng dấu, danh sách hiện ngay.

---

### User Story 8 - Cảm giác rừng ở màn đầu tiên (Priority: P3)

Ở đầu màn danh mục tuyến, vài tia nắng nhạt và một hai chiếc lá trôi chậm qua dải đồi, tạo không khí rừng mà không làm phân tâm.

**Why this priority**: Thuần trang trí, củng cố nhận diện thiên nhiên (đợt 3).

**Independent Test**: Mở SCR-M01-001: tia nắng và lá trôi chạy tối đa 5 giây rồi dừng ở khung cuối; không che tiêu đề, nút "Gợi ý tuyến", Mila hay bong bóng. Trình đọc màn hình không đọc chúng. Tắt công tắc hoặc giảm chuyển động: không có.

**Acceptance Scenarios**:

1. **Given** SCR-M01-001, **Then** hero có tia nắng và lá trôi (T3) phía sau dải đồi, không giao với chữ, nút, Mila hay bong bóng; ẩn với công nghệ hỗ trợ.
2. **Given** hiệu ứng đã chạy 5 giây trong lần hiển thị này, **Then** nó dừng ở khung cuối (WCAG 2.2.2, cùng giới hạn `MASCOT_LOOP_MAX_MS`).
3. **Given** lớp phủ giới thiệu INTRO đang hiện, **Then** hiệu ứng nền chưa chạy.
4. **Given** giảm chuyển động, công tắc tắt, tiết kiệm dữ liệu hoặc máy yếu, **Then** không có tia nắng động hay lá trôi; hero như hiện nay.

---

### User Story 9 - Mila cử động thật (Priority: P3)

Khi giới thiệu, Mila thực sự vẫy tay; khi ăn mừng, Mila đổi nhịp tay; khi bước, chân Mila thay nhau; ở màn kết quả, Mila tự hào chớp mắt.

**Why this priority**: Nâng chất lượng nhân vật bằng khung phụ đợt 4B, không đổi hành vi (đợt 3).

**Independent Test**: Lớp phủ giới thiệu: Mila đổi giữa hai khung vẫy, 2 nhịp. Ăn mừng cấp 2 và 3: tay đổi nhịp theo cú nhảy. MAS-B-056: hai bước chân luân phiên. SCR-M02-003: `proud` chớp mắt. Khi đổi khung, thân Mila không giật (khung phụ khớp ảnh gốc ngoài vùng cử động).

**Acceptance Scenarios**:

1. **Given** AN-GREET của MAS-B-001, AN-MILESTONE / AN-CELEBRATE (MAS-B-051, 055, 062, 064), AN-WALK (MAS-B-056), **Then** Mila luân phiên ảnh gốc và khung phụ đợt 4B tương ứng trong thời lượng sẵn có của animation; không kéo dài phản ứng.
2. **Given** `proud` ở DOCK của SCR-M02-003, **Then** Mila chớp mắt như các tư thế DOCK khác (MA-20).
3. **Given** khung phụ chưa có, **Then** animation chạy như hiện nay với ảnh gốc.
4. **Given** giảm chuyển động hoặc công tắc tắt, **Then** chỉ hiện ảnh gốc tĩnh, không đổi khung, không chớp mắt.
5. **Given** ảnh khung phụ, **Then** ngoài vùng cử động nó trùng ảnh gốc từng điểm ảnh, để đổi khung không làm thân Mila nhấp nháy (Asset spec §4, hướng dẫn tạo ảnh §9.2).

---

### Edge Cases

- **Mở khóa khi màn ẩn**: lượt ghé mới được ghi rồi du khách khóa máy trước khi về SCR-M02-001 → khi mở lại, thanh hiện thẳng giá trị mới, không phát hiệu ứng muộn.
- **Hai lượt ghé liên tiếp trước khi về màn chuyến đi** (mở nội dung, quét tiếp từ trang nội dung): hiệu ứng mở khóa chỉ cho lần quay về, từ giá trị cũ lên giá trị hiện tại, một lần.
- **Phiên có 1 điểm** (n = 1): không có đoạn đường mòn tới điểm kế tiếp; thanh đi từ 0 lên đầy.
- **n lớn (tới 99 điểm)**: thanh và dấu chân vẫn đọc được ở 320 px; câu "Đã quét QR: k/n điểm" không bị che.
- **Thông báo tạm đóng** (`TEMPORARILY_CLOSED`): không có hiệu ứng mở khóa, confetti hay chuyển động T3 nào chen vào thông báo an toàn (BR-MAS-03).
- **Đổi công tắc giữa lúc hiệu ứng đang chạy**: hiệu ứng đang chạy kết thúc ngay ở trạng thái cuối.
- **Ngôn ngữ VI/EN đổi khi đang chuyển cảnh**: chữ đổi ngay; chuyển cảnh không chạy lại.
- **Màn Quét QR SCR-M02-005**: có phản hồi nhấn và chuyển cảnh như mọi màn du khách; không có Mila (spec-Mascot §5.1, DV-91 của gói 005).
- **Trình duyệt cũ không có chuyển cảnh giữa màn**: đổi màn tức thì, mọi phản hồi T1 vẫn chạy.
- **Lời nhắc cập nhật ứng dụng xuất hiện khi đang ăn mừng**: lời nhắc hiện như cũ, không bị che hay trì hoãn.
- **Pin yếu / chế độ tiết kiệm điện của hệ điều hành** không được trình duyệt báo: dựa vào giảm chuyển động, tiết kiệm dữ liệu và công tắc.

## Requirements *(mandatory)*

### Functional Requirements

ID `FR-MOT-*` là ID của package này; mỗi dòng ghi nguồn canonical (spec-Mascot) hoặc nguồn hình thức (design-system) mà nó dẫn xuất.

- **FR-MOT-001**: Mọi chuyển động trên màn du khách M01/M02 thuộc đúng một tầng T1, T2 hoặc T3 và theo thời lượng, cách giảm chuyển động của tầng đó. (design-system §4.3.1)
- **FR-MOT-002**: Nút và thẻ bấm được trên màn du khách có phản hồi nhấn (co về tỷ lệ nhấn) và thẻ tuyến có phản hồi hover trên thiết bị có con trỏ, không dịch bố cục; M03 không đổi. (design-system §5.4)
- **FR-MOT-003**: SCR-M02-001 hiển thị thanh tiến trình hành trình xác định k/n lấy từ phiên, có dấu chân, dưới câu tiến độ giữ nguyên văn; chỉ khi có phiên. (design-system §5.3; screen spec E-SCR-M02-001-25; BR-MAS-14)
- **FR-MOT-004**: Khi trở về SCR-M02-001 ngay sau một lượt ghé mới, điểm vừa ghi nảy, đoạn đường mòn tới điểm kế tiếp vẽ ra và thanh tăng, mỗi chuyển động một lần; không chạy khi quét lại, tải lại hay không có lượt ghé mới; không làm chậm dialog cuối chuyến. (design-system §4.3.1 T1; FR-M02-007, 009; BR-M02-021; SC-MAS-005)
- **FR-MOT-005**: Khi tải gói, hiển thị thanh "đang tải" không xác định cạnh nhãn sẵn có, không số; khi gói sẵn sàng hiện dấu ✓ một lần; lỗi thì bỏ thanh. (design-system §5.3; change brief §10.1)
- **FR-MOT-006**: Chuyển cảnh giữa các màn du khách, gồm ảnh thẻ tuyến chuyển thành ảnh đầu màn chi tiết; trình duyệt không hỗ trợ thì đổi màn tức thì. (design-system §4.3.1 T2)
- **FR-MOT-007**: Thẻ nằm dưới màn đầu hiện dần một lần mỗi lần tải trang; thẻ ở màn đầu hiện ngay; không dịch bố cục. (design-system §4.3.2)
- **FR-MOT-008**: Khối giữ chỗ khi tải có vệt sáng theo nhịp; giữ trạng thái chữ cho trình đọc màn hình. (design-system §5.3)
- **FR-MOT-009**: Mila dùng tư thế đợt 4 cho các phản ứng của Behavior Matrix §3b và khung phụ đợt 4B cho AN-GREET, AN-MILESTONE, AN-CELEBRATE, AN-WALK, chớp mắt `proud`; thiếu ảnh thì dùng tư thế cũ; không đổi sự kiện, câu, ưu tiên hay slot. (spec-Mascot §1.1 v1.4, §5.5; design-system §9.6)
- **FR-MOT-010**: Ảnh đợt 4 được kiểm (kích thước, nền trong suốt, viền, khớp ảnh gốc với khung phụ), xuất bản web và đưa cỡ dùng ở DOCK/AVATAR/INLINE vào bộ nhớ offline trong ngân sách. (AGENTS.md §4; Asset spec §3–4; hướng dẫn tạo ảnh §9.3)
- **FR-MOT-011**: Màn kết quả, ngay sau khi du khách xác nhận kết thúc một phiên `HOAN_TAT`, có hiệu ứng đóng dấu cho huy hiệu sẵn có, confetti lá và danh sách điểm hiện lần lượt, cùng thời hạn và cách bỏ qua của ăn mừng cấp 3; không thêm nội dung mới. (BR-MAS-23; US-MAS-08; design-system §4.3.1 T3)
- **FR-MOT-012**: Hero SCR-M01-001 có tia nắng và lá trôi T3, ẩn với công nghệ hỗ trợ, dừng sau 5 giây mỗi lần hiển thị, không chạy khi lớp phủ giới thiệu đang hiện. (design-system §4.3.1, §7; BR-MAS-21)
- **FR-MOT-013**: SCR-M01-004 luôn có công tắc "Hiệu ứng chuyển động" (kể cả khi Mila tắt); tắt thì dừng mọi chuyển động của Mila và T3, chữ bong bóng hiện ngay, không rung, T1/T2 như giảm chuyển động; không lưu lựa chọn. (BR-MAS-18, 19, 21; US-MAS-09; FR-MAS-011; OD-MAS-21)
- **FR-MOT-014**: Khi thiết bị yêu cầu giảm chuyển động, công tắc khởi đầu ở "tắt" và mọi chuyển động theo cột giảm chuyển động. (BR-MAS-17)
- **FR-MOT-015**: T3 không chạy khi thiết bị báo tiết kiệm dữ liệu hoặc bộ nhớ ≤ 2 GB; mọi chuyển động dừng khi trang ẩn; không vòng lặp khi màn đứng yên; tối đa 3 chuyển động T3 cùng lúc. (design-system §4.3.2)
- **FR-MOT-016**: Chuyển động không bao giờ đổi, làm chậm, che hay thay hành vi, dữ liệu, câu cố định, thứ tự bước, vị trí nút hay focus của spec-M01/M02; không che thông báo tạm đóng, dialog, lời nhắc cập nhật; không thêm chữ hay số ngoài nhãn công tắc. (FR-MAS-009; BR-MAS-02, 03; change brief §7)
- **FR-MOT-017**: Mila hiện tối đa một lần trên một màn; thanh tiến trình và thanh "đang tải" không có hình Mila. (spec-Mascot §5.1, OD-MAS-22)
- **FR-MOT-018**: Mọi tài nguyên chuyển động sẵn có offline; không chuyển động nào cần mạng. (FR-MAS-010; constitution VI)
- **FR-MOT-019**: Không nhấp nháy quá 3 lần mỗi giây; mọi phản hồi T1 có chữ hoặc trạng thái tĩnh tương ứng. (design-system §4.3.2; WCAG 2.3.1)

### Màn và phần tử liên quan

| Màn | Chuyển động | Story |
|---|---|---|
| SCR-M01-001 Danh mục | Nhấn/hover thẻ, thẻ hiện dần, vệt sáng thẻ giữ chỗ, chuyển cảnh sang chi tiết, nắng và lá ở hero, Mila `peek` khi rỗng | US1, 5, 6, 8 |
| SCR-M01-002 Gợi ý | Nhấn, chuyển cảnh, thẻ kết quả sang chi tiết | US1, 5 |
| SCR-M01-003 Chi tiết | Nhấn, ảnh đầu nhận chuyển cảnh, vệt sáng ảnh đầu khi tải, thanh "đang tải" và ✓ | US1, 4, 5, 6 |
| SCR-M01-004 Tài nguyên | Công tắc "Hiệu ứng chuyển động", thanh "đang tải" và ✓, Mila `peek` khi rỗng | US3, 4, 6 |
| SCR-M02-001 Chuyến đi | Thanh tiến trình, mở khóa checkpoint, Mila `walk` | US2, 6, 9 |
| SCR-M02-002 / 004 Nội dung | Nhấn, chuyển cảnh, Mila `amazed` khi xác nhận lượt ghé | US1, 5, 6 |
| SCR-M02-003 Kết quả | Đóng dấu huy hiệu, confetti lá, danh sách hiện lần lượt, Mila `proud`, `sorry` khi `CONFLICT` | US6, 7, 9 |
| SCR-M02-005 Quét QR | Nhấn, chuyển cảnh; không Mila | US1, 5 |

### Key Entities *(include if feature involves data)*

Không có entity, trường hay dữ liệu lưu mới. Chỉ có:

- **Trạng thái công tắc chuyển động**: bật/tắt trong bộ nhớ của lần tải trang; khởi đầu theo yêu cầu giảm chuyển động của thiết bị; không lưu (BR-MAS-18).
- **Mức chuyển động hiệu lực**: suy ra từ công tắc, giảm chuyển động, tiết kiệm dữ liệu và bộ nhớ thiết bị; quyết định T1/T2/T3 nào chạy. UI state tạm thời.
- **Dấu "vừa có lượt ghé mới"**: UI state tạm thời để biết lần quay về SCR-M02-001 có chạy hiệu ứng mở khóa; không phải dữ liệu chuyến, mất khi tải lại trang.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-MOT-001**: 100% test tự động hiện có của M01, M02 và mascot vẫn đạt; ngoại lệ có chủ đích chỉ là test của công tắc (nhãn mới, công tắc hiện khi Mila tắt) và được ghi trong validation report; dữ liệu lưu và `SessionSyncRecord` của một chuyến giống hệt khi không có chuyển động.
- **SC-MOT-002**: Với công tắc tắt hoặc giảm chuyển động, 0 animation của Mila và 0 chuyển động T3 chạy trên mọi màn du khách; mọi phản hồi T1 vẫn nhìn thấy được (SC-MAS-008, 011).
- **SC-MOT-003**: 0 chuyển động tự chạy kéo dài quá 5 giây mà không dừng được bằng công tắc (SC-MAS-014).
- **SC-MOT-004**: Bố cục không dịch khi nội dung hiện dần hoặc khi nhấn (điểm dịch bố cục tích lũy = 0 trên SCR-M01-001, SCR-M02-001, SCR-M02-003).
- **SC-MOT-005**: Thời điểm nội dung chính đầu tiên hiện ra trên SCR-M01-001 (mobile, mạng chậm) không chậm hơn bản trước package này quá 100 ms.
- **SC-MOT-006**: Phần mã thêm vào cho chuyển động ≤ 15 KB nén; ảnh Mila đợt 4 thêm vào bộ nhớ offline ≤ 120 KB.
- **SC-MOT-007**: Khi offline sau khi app shell đã lưu, 100% chuyển động và tư thế Mila đợt 4 dùng trên màn M02 hiển thị đủ.
- **SC-MOT-008**: Dialog cuối chuyến, thông báo tạm đóng và lời nhắc cập nhật hiện với 0 ms trễ thêm so với khi không có chuyển động.
- **SC-MOT-009**: Ở 320–430 px, 0 trường hợp hiệu ứng trang trí, thanh tiến trình hay confetti che chữ, nút, vùng thông báo, Mila hoặc bong bóng.
- **SC-MOT-010**: Trên mỗi màn du khách có tối đa một hình Mila tại mọi thời điểm.
- **SC-MOT-011**: Trên điện thoại tầm trung, chuyển động giữ mượt (không giật thấy được) trong các khoảnh khắc chính: nhấn, mở khóa checkpoint, chuyển cảnh, ăn mừng cuối chuyến; chủ dự án xác nhận khi thử trên máy thật.

## Assumptions

- Du khách dùng điện thoại ngoài rừng, mạng yếu, pin hạn chế; vì vậy T3 ngắn, tự dừng và tự tắt trên máy yếu hoặc khi tiết kiệm dữ liệu (design-system §4.3.2).
- "Máy yếu" dựa trên thông tin bộ nhớ trình duyệt báo; trình duyệt không báo thì coi là đủ mạnh. Trình duyệt không báo chế độ tiết kiệm pin, nên dựa vào giảm chuyển động và công tắc.
- **Ghi chú dẫn xuất — màn kết quả.** Change brief §2 nêu "số liệu đếm lên" và "dải hoàn thành tuyến" cho SCR-M02-003. Màn hiện tại (sau thiết kế lại trên nền ảnh rừng) không hiển thị con số nào và đã có huy hiệu hoàn thành (OD-MAS-10). Để không thêm nội dung (change brief §7, FR-MOT-016), package này áp "đóng dấu" cho huy hiệu sẵn có và cho danh sách điểm hiện lần lượt; không thêm số hay dải chữ mới. Token đếm số của design-system §4.3.1 chưa dùng ở package này.
- **Ghi chú dẫn xuất — skeleton.** Danh mục và ảnh đầu màn chi tiết đã có khối giữ chỗ; package chỉ thêm vệt sáng, không đổi số lượng hay kích thước khối.
- Ảnh đợt 4 do người dùng cung cấp và đã xác nhận quyền sử dụng (2026-11-24); agent chỉ kiểm, căn, ghép vùng khác biệt cho khung phụ, nén (AGENTS.md §4). Ảnh nào không đạt kiểm thì báo người dùng làm lại; trong lúc đó Mila dùng tư thế cũ.
- Giới hạn thời lượng là giá trị của design-system; chủ dự án kiểm ngoài thực địa cùng các giới hạn của spec-Mascot §5.4.
- Cờ phát hành của Mila (cấu hình môi trường, OD-MAS-15) không điều khiển chuyển động T1–T3; khi cờ tắt, mọi chuyển động không phải của Mila và công tắc vẫn có (OD-MAS-21).

### Open clarifications

Không có câu hỏi nghiệp vụ chặn: OD-MOT-01…06 và OD-MAS-21, 22 đã chốt (change brief §10; spec-Mascot §10). Còn mở, không chặn plan: thử trên điện thoại thật (SC-MOT-011; cùng DV-87 của gói 005); số đo nền LCP/CLS trước khi code (DV-89 của gói 005) để đối chiếu SC-MOT-004, 005.

## Traceability (ID → nguồn)

| User story (package) | Nguồn canonical / hình thức | FR | SC |
|---|---|---|---|
| US1 Phản hồi chạm | design-system §5.4, §4.3.1 T1 | FR-MOT-001, 002, 019 | SC-MOT-002, 004 |
| US2 Hành trình tiến lên | design-system §5.3, §4.3.1 T1; FR-M02-007, 009; BR-M02-021; BR-MAS-14; SC-M02-013 | FR-MOT-003, 004, 016, 017 | SC-MOT-008, 009, 010 |
| US3 Công tắc và an toàn chuyển động | spec-Mascot BR-MAS-17, 18, 19, 21; US-MAS-09; FR-MAS-011; OD-MAS-21; design-system §4.3.2, §9.5 | FR-MOT-013, 014, 015, 019 | SC-MOT-002, 003 |
| US4 Tải gói | design-system §5.3; spec-M01 US-M01-03; spec-Mascot §5.1 | FR-MOT-005, 017 | SC-MOT-010 |
| US5 Chuyển cảnh, thẻ hiện dần | design-system §4.3.1 T2, §4.3.2 | FR-MOT-006, 007 | SC-MOT-004, 005, 008 |
| US6 Chờ và trống có hồn | design-system §5.3, §9.6; Behavior Matrix §3b; BR-MAS-15, 16 | FR-MOT-008, 009, 010 | SC-MOT-006, 007 |
| US7 Kết thúc chuyến | BR-MAS-23; US-MAS-08; spec-M02 §2; MVP-Scope §4 | FR-MOT-011, 016 | SC-MOT-003, 009 |
| US8 Cảm giác rừng ở hero | design-system §4.3.1 T3, §7; BR-MAS-21 | FR-MOT-012, 015 | SC-MOT-003, 009 |
| US9 Mila cử động thật | design-system §9.6; Asset spec §4 (MA-20, 21, 22, 15) | FR-MOT-009, 010 | SC-MOT-007 |
| Xuyên suốt | FR-MAS-009, 010; constitution VI | FR-MOT-001, 016, 018 | SC-MOT-001, 006 |
