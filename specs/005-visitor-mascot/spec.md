# Feature Specification: Mascot Mila — Đồng hành cùng du khách trên màn M01/M02

**Feature Branch**: `005-visitor-mascot` *(định danh thư mục; tài liệu đang ở git branch `feat/m02-end-screen-redesign`, không tạo branch mới theo yêu cầu người dùng 2026-11-21)*

**Created**: 2026-11-21

**Status**: Draft — bản dẫn xuất (Layer 3) từ [docs/spec/spec-Mascot.md](../../docs/spec/spec-Mascot.md) v1.3 (cập nhật 2026-11-22 theo [CHG-MASCOT-2026-11-22-02](change-brief-CHG-MASCOT-2026-11-22-02.md), 2026-11-23 theo [CHG-MASCOT-2026-11-23-03](change-brief-CHG-MASCOT-2026-11-23-03.md) và [CHG-MASCOT-2026-11-23-04](change-brief-CHG-MASCOT-2026-11-23-04.md))

**Input**: Change Brief [CHG-MASCOT-2026-11-21-01](change-brief-CHG-MASCOT-2026-11-21-01.md) (APPROVED 2026-11-21). Nguồn chuẩn: spec-Mascot v1.0 (mọi quyết định nghiệp vụ đã chốt ở §10, OD-MAS-01…16); [function-list-Mascot.md](../../docs/function%20list/function-list-Mascot.md); ranh giới priority: [MVP-Scope.md](../../MVP-Scope.md) §3.6 (Could). Consumer: màn du khách SCR-M01-001…004, SCR-M02-001…004. Hình thức: [design-system](../../docs/design/design-system.md) §4.3, §9. Bộ thiết kế: [docs/mascot/](../../docs/mascot/README.md). Các rule M01/M02 được trích dẫn và giữ nguyên: spec-M01 v3.2 US-M01-01…06; spec-M02 v3.3 FR-M02-007, 009; BR-M02-005, 006, 007, 008, 009, 011, 015, 016, 021, 022, 023, 024; SC-M02-013; §5.1; §6.4.

> **Quy tắc dẫn xuất.** File này không phải nguồn sự thật. Mọi hành vi lấy từ spec-Mascot; nếu mâu thuẫn, spec canonical thắng. Không thêm requirement. Không đổi bất kỳ rule, contract, entity, state hay permission nào của spec-M01, spec-M02 hay spec-M03. Mọi câu chữ của Mila lấy từ spec-Mascot §5.6 (đã chép vào bảng copy của screen spec); câu cố định của spec-M02 §5.1 và bảng copy hiện có giữ nguyên văn. Không có chi tiết kỹ thuật (tên sự kiện, component, tệp thuộc plan).

## Ranh giới

| Hướng | Nội dung | Ghi chú (nguồn: spec-Mascot §5.2, BR-MAS-01, 18) |
|---|---|---|
| M01, M02 → Mila | Sự kiện logic (§5.2 của spec canonical) | Phát **sau** khi module làm xong việc của mình; không chờ, không lưu, không rời thiết bị. Không phải contract liên module. |
| Mila → M01, M02, M03 | Không có | Mila không ghi dữ liệu nào, không gọi M03, không đổi `SessionSyncRecord`. |

M01, M02, M03 và mọi contract liên module không đổi.

## User Scenarios & Testing *(mandatory)*

Priority: cả capability là **Could** (MVP-Scope §3.6). Thứ tự P1–P3 dưới đây là thứ tự giao trong package này, theo lộ trình đã duyệt ([roadmap](../../docs/mascot/MASCOT_IMPLEMENTATION_ROADMAP.md) G5 pilot → G6 M02 → G7 M01 → G8 tương tác). US-MAS-05 là P1 vì mọi story khác phải tuân theo nó ngay từ pilot.

### User Story 1 - Làm quen với Mila — US-MAS-01 (Priority: P1)

Du khách mới chọn ngôn ngữ lần đầu thì Mila xuất hiện ở danh mục tuyến, tự giới thiệu và mời chọn tuyến. Du khách mở link QR từ camera điện thoại thì không gặp lời giới thiệu nào.

**Why this priority**: Đây là khoảnh khắc đầu tiên du khách biết có người đồng hành (FR-MAS-004). Nó cũng là một trong ba điểm pilot.

**Independent Test**: Trên trình duyệt chưa có dữ liệu, mở app, chọn "Tiếng Việt": lớp phủ giới thiệu phủ cả màn, Mila và một bong bóng (MSG-MAS-001) ở giữa, dòng "Chạm để bắt đầu"; chạm (chữ đang hiện thì hiện hết, rồi chạm lần nữa) → lớp phủ đóng, Mila đứng ở hero danh mục. Tải lại trang: không có lớp phủ (v1.3).

**Acceptance Scenarios**:

1. **Given** chưa có `LanguagePreference`, **When** du khách chọn ngôn ngữ ở bước chọn ngôn ngữ, **Then** lớp phủ giới thiệu (v1.3) phủ cả màn: Mila và một bong bóng MSG-MAS-001 ở giữa bằng ngôn ngữ vừa chọn, dòng "Chạm để bắt đầu"; không có nút "Bỏ qua" hay nút ×; chạm khi chữ đã hiện hết, Back hoặc Esc đóng lớp phủ và Mila về DOCK ở hero; focus vào lớp phủ rồi trả về tiêu đề trang.
2. **Given** du khách bấm nút đóng của bong bóng hoặc chạm một thẻ tuyến khi đang giới thiệu, **Then** lời giới thiệu kết thúc và Mila về DOCK ở hero.
3. **Given** `LanguagePreference` đã có từ trước khi tải trang, **Then** không có lời giới thiệu; danh mục có thể hiện MSG-MAS-004 một lần mỗi lần tải trang (US-MAS-01.3).
4. **Given** du khách mở link QR công khai, **Then** không có lời giới thiệu, nội dung không bị chậm (US-MAS-01.2, BR-M02-024, SC-MAS-010).
5. **Given** Mila đang nói, **When** du khách đổi VI/EN, **Then** bong bóng đổi ngôn ngữ ngay, cùng câu (FR-MAS-003).

---

### User Story 2 - Mila ăn mừng tiến độ có thật — US-MAS-02 (Priority: P1)

Khi một lượt ghé được ghi lần đầu, Mila ăn mừng và cho biết đã quét bao nhiêu điểm. Quét lại hay khách tự do thì không có ăn mừng. Ở điểm cuối, câu hỏi kết thúc chuyến vẫn hiện ngay.

**Why this priority**: Đây là khoảnh khắc thực địa quan trọng nhất (FR-MAS-005), điểm pilot thứ hai.

**Independent Test**: Bắt đầu một chuyến 4 điểm, quét mã điểm 1: nội dung hiện như cũ, toast "Đã ghi nhận lượt quét." còn nguyên, Mila nói MSG-MAS-051. Quét mã điểm 2: MSG-MAS-050 với "2/4", và vì 2 = ⌈4/2⌉ nên là MSG-MAS-055. Quét lại điểm 1: không ăn mừng. Quét điểm cuối: dialog cuối chuyến hiện ngay, Mila nằm trong dialog.

**Acceptance Scenarios**:

1. **Given** một lần quét được chấp nhận và lượt ghé của điểm dừng được ghi lần đầu (FR-M02-007, BR-M02-005), **When** nội dung hiện, **Then** Mila ăn mừng cạnh toast hiện có với "{k}/{n}" lấy từ phiên; nội dung không bị chậm; máy rung một lần ngắn nếu trình duyệt hỗ trợ và không bật giảm chuyển động (US-MAS-02.1, BR-MAS-19).
2. **Given** k = 1, **Then** câu là MSG-MAS-051; **given** k = ⌈n/2⌉, n ≥ 4 và không phải điểm cuối, **then** câu là MSG-MAS-055; các trường hợp còn lại là MSG-MAS-050 với `{cheer}` xoay vòng.
3. **Given** quét lại một điểm đã có lượt ghé (FR-M02-009), **Then** không có ăn mừng (US-MAS-02.2).
4. **Given** khách tự do (không có phiên), **Then** không có tiến độ hay ăn mừng (US-MAS-02.3, BR-MAS-14).
5. **Given** lượt ghé điểm cuối được ghi lần đầu, **Then** dialog cuối chuyến hiện ngay như BR-M02-021; Mila chỉ là minh họa trong đầu dialog (US-MAS-02.4, SC-MAS-005).
6. **Given** du khách chọn "Đi tiếp", **Then** Mila nói MSG-MAS-061.

---

### User Story 3 - Mila tránh đường — US-MAS-05 (Priority: P1)

Mila không bao giờ che việc chính, rời màn khi có thông báo tạm đóng, và im lặng khi du khách đang nghe, xem hoặc có hộp thoại.

**Why this priority**: Đây là ràng buộc an toàn và khả dụng cho mọi story khác (FR-MAS-001, 007, 009); không có nó thì không phát hành được bất kỳ phần nào.

**Independent Test**: Ở 320, 360, 390, 430 px, so vị trí Mila với khung quét, các nút, vùng thông báo, toast, dialog, bài đọc: không giao nhau. Quét mã của điểm đang tạm đóng: không có Mila trong màn. Phát audio: không có bong bóng.

**Acceptance Scenarios**:

1. **Given** một lần quét trả `TEMPORARILY_CLOSED` (BR-M02-015), **Then** Mila bị gỡ khỏi màn, chỉ còn thông báo tạm đóng cố định; mọi phản ứng đang chờ bị bỏ (BR-MAS-03, SC-MAS-003).
2. **Given** audio hoặc video đang phát, hoặc có dialog khác dialog cuối chuyến, hoặc trang đang ẩn, **Then** không có bong bóng nào; khi trang ẩn, mọi hẹn giờ dừng (BR-MAS-08, SC-MAS-004).
3. **Given** bất kỳ màn nào có slot, **Then** Mila không che khung quét, nút, vùng thông báo, toast, dialog hay bài đọc, và không lấy focus (BR-MAS-11, SC-MAS-002).
4. **Given** màn không có slot (bước chọn ngôn ngữ, khối Cảnh báo an toàn, thư viện ảnh, trình phát, dialog xóa gói, lời nhắc cập nhật, M03), **Then** không có Mila (spec-Mascot §5.1).
5. **Given** không có nút ẩn Mila (OD-MAS-03), **When** du khách bấm nút đóng trên một bong bóng, **Then** chỉ bong bóng đó đóng; Mila vẫn ở slot (OD-MAS-16).
6. **Given** thiết bị yêu cầu giảm chuyển động, **Then** mọi chuyển động của Mila thành đổi tức thì hoặc mờ dần ≤ 150 ms, không có hạt lá rơi, không rung (BR-MAS-17, 19, SC-MAS-008).
7. **Given** Mila gặp lỗi (ảnh không tải được, lỗi bên trong), **Then** màn chạy như khi chưa có Mila (BR-MAS-15, 16).

---

### User Story 4 - Kết thúc chuyến cùng Mila — US-MAS-08 (Priority: P1)

Ngay sau khi du khách xác nhận kết thúc, màn kết quả có Mila ăn mừng một lần, rồi đứng yên cạnh huy hiệu.

**Why this priority**: Điểm pilot thứ ba (FR-MAS-005).

**Independent Test**: Kết thúc một chuyến `HOAN_TAT`: Mila ăn mừng ≤ 2,4 giây với MSG-MAS-062, chạm để bỏ qua được; huy hiệu và nội dung màn như cũ. Tải lại màn: chỉ còn minh họa tĩnh.

**Acceptance Scenarios**:

1. **Given** du khách vừa xác nhận kết thúc và phiên là `HOAN_TAT`, **When** SCR-M02-003 mở, **Then** Mila ăn mừng một lần (tối đa `MASCOT_CELEBRATION_MS`) với MSG-MAS-062, đứng cạnh huy hiệu hoàn thành (huy hiệu giữ nguyên, OD-MAS-10) (US-MAS-08.1).
2. **Given** du khách chạm trong lúc ăn mừng, **Then** hiệu ứng kết thúc ngay.
3. **Given** mở lại màn kết quả sau đó, **Then** chỉ có minh họa tĩnh (US-MAS-08.2).
4. **Given** bản ghi còn `PENDING` khi đang offline, **Then** Mila nói MSG-MAS-070; chuyển sang `SYNCED` khi màn đang mở thì Mila giơ ngón cái, không nói "đã gửi" trước `SYNCED`; `CONFLICT` chỉ có minh họa, không có nút thử lại (US-MAS-04.2, spec-M02 BR-M02-011).

---

### User Story 5 - Mila giúp khi quét khó — US-MAS-03 (Priority: P2)

Mila hướng dẫn quét lần đầu, giúp khi scanner mở lâu mà chưa đọc được mã, và giải thích khi một loại lỗi lặp lại.

**Why this priority**: Giảm bế tắc ngoài thực địa (FR-MAS-006). Giao sau pilot, ở giai đoạn M02 đầy đủ.

**Independent Test**: Mở scanner khi phiên chưa có lượt ghé: MSG-MAS-040 ở dải dưới khung. Để scanner mở (đồng hồ giả): sau 15 giây Mila nhìn quanh, sau 30 giây MSG-MAS-042, sau 90 giây MSG-MAS-049 kèm "Đóng camera" / "Chưa"; sau đó im lặng. Quét hai mã không hợp lệ liên tiếp: MSG-MAS-046, câu cố định vẫn còn.

**Acceptance Scenarios**:

1. **Given** scanner mở và phiên chưa có lượt ghé nào (hoặc không có phiên), **Then** Mila nói MSG-MAS-040 một lần mỗi lần tải trang, không đè khung quét (US-MAS-03.1).
2. **Given** scanner mở mà không đọc được mã, **Then** sau `MASCOT_SCANNER_LOOK_S` Mila nhìn quanh (không chữ), sau `MASCOT_SCANNER_HELP_S` nói MSG-MAS-042 một lần, sau `MASCOT_SCANNER_CAMERA_OFF_S` nói MSG-MAS-049 một lần; sau đó im lặng tới khi đóng scanner (US-MAS-03.2, BR-MAS-09).
3. **Given** du khách bấm "Đóng camera" trong MSG-MAS-049, **Then** scanner đóng như khi bấm nút đóng hiện có; "Chưa" chỉ đóng bong bóng.
4. **Given** hai lần quét liên tiếp ở SCR-M02-001 cùng ra mã không hợp lệ, hoặc cùng ra cần kết nối, **Then** Mila nói MSG-MAS-046 hoặc MSG-MAS-048; câu cố định của spec-M02 §5.1 vẫn hiện nguyên; một kết quả khác thì đếm lại từ đầu (US-MAS-03.3, BR-MAS-10).
5. **Given** tra mã còn chờ sau `MASCOT_LOOKUP_SLOW_S`, **Then** Mila nói MSG-MAS-044, trước hạn `LOOKUP_TIMEOUT_SECONDS` của spec-M02.
6. **Given** camera không dùng được, **Then** Mila chỉ minh họa cạnh câu camera cố định.

---

### User Story 6 - Mila giữ du khách bình tĩnh về mạng và dữ liệu — US-MAS-04 (Priority: P2)

Mất sóng giữa chuyến, Mila nói rõ cái gì vẫn dùng được. Mila không bao giờ nói sai về việc gửi dữ liệu hay nội dung offline.

**Why this priority**: Thực địa hay mất sóng (FR-MAS-010); giao cùng giai đoạn M02 đầy đủ.

**Independent Test**: Có phiên, chuyển trình duyệt sang offline: MSG-MAS-074 một lần; offline lần nữa trong 10 phút: không nói lại. Online lại: MSG-MAS-075. Quét mã trong tuyến khi offline có gói: MSG-MAS-054. Quét mã `VALID` ngoài hành trình khi có phiên: MSG-MAS-052.

**Acceptance Scenarios**:

1. **Given** có phiên và trình duyệt báo offline, **Then** Mila nói MSG-MAS-074 tối đa một lần mỗi cooldown (US-MAS-04.1).
2. **Given** online lại sau MSG-MAS-074, **Then** Mila nói MSG-MAS-075 và không nói gì về đồng bộ.
3. **Given** nội dung lấy từ gói khi tra mã lỗi, **Then** Mila nói MSG-MAS-054 (trừ khi đang có phản ứng P4 cùng lúc).
4. **Given** mã `VALID` ngoài hành trình khi có phiên (không ghi lượt ghé, BR-M02-008), **Then** Mila nói MSG-MAS-052 (OD-MAS-13).
5. Không câu nào nói đã gửi trước `SYNCED`, hay hứa nội dung offline không có trong gói `SAN_SANG` (US-MAS-04.2, 04.3, BR-MAS-04).

---

### User Story 7 - Chuẩn bị cùng Mila — US-MAS-07 (Priority: P2)

Ở M01, Mila phản hồi khi tải gói, khi gợi ý tuyến, nhắc đọc cảnh báo an toàn, và gợi ý khi du khách lưỡng lự ở danh mục.

**Why this priority**: Giai đoạn M01 đầy đủ, sau M02 (FR-MAS-002).

**Independent Test**: Bấm Tải về: MSG-MAS-020; xong: MSG-MAS-021; lỗi lưu trữ (giả lập): MSG-MAS-025; lỗi tải hai lần liên tiếp cùng tuyến khi online: MSG-MAS-026. Gợi ý tuyến ra kết quả: MSG-MAS-011; hai lần rỗng: MSG-MAS-013 kèm "Xem tất cả tuyến". Mở chi tiết tuyến có cảnh báo an toàn, cuộn tới panel Bắt đầu: MSG-MAS-014. Để danh mục 20 giây không cuộn, không chạm: MSG-MAS-008.

**Acceptance Scenarios**:

1. **Given** bắt đầu tải hoặc cập nhật gói, **Then** MSG-MAS-020, không có phần trăm nào; gói `SAN_SANG` thì MSG-MAS-021; lỗi nguồn hoặc mạng thì MSG-MAS-024; lỗi lưu trữ thì MSG-MAS-025; lỗi lần hai liên tiếp cùng tuyến khi online thì MSG-MAS-026; cập nhật lỗi nhưng bản cũ còn dùng được thì chỉ minh họa (US-MAS-07.1, BR-MAS-10).
2. **Given** gợi ý tuyến có kết quả, **Then** MSG-MAS-011 (dạng số ít/nhiều tiếng Anh); hai lần rỗng liên tiếp thì MSG-MAS-013 kèm "Xem tất cả tuyến"; lần rỗng đầu chỉ minh họa (US-MAS-07.2).
3. **Given** panel Bắt đầu vào khung nhìn lần đầu và tuyến có cảnh báo an toàn, **Then** MSG-MAS-014; Mila không bao giờ đặt trên khối Cảnh báo an toàn.
4. **Given** danh mục mở `MASCOT_CATALOG_HINT_S` mà du khách chưa cuộn, chưa mở tuyến, **Then** MSG-MAS-008 kèm "Gợi ý tuyến", một lần mỗi lần tải trang (BR-MAS-09).
5. **Given** danh mục còn đang tải sau 600 ms, **Then** MSG-MAS-005; danh mục rỗng hoặc lỗi nguồn, hoặc Start lỗi, **then** chỉ minh họa cạnh câu cố định.

---

### User Story 8 - Hỏi Mila và lời nhắc thiên nhiên — US-MAS-06 (Priority: P3)

Chạm vào Mila thì Mila phản ứng và nói câu gợi ý hợp tình huống của màn (v1.1); chạm nhiều lần có quy tắc riêng. Giữa các điểm dừng, Mila nhắc cất máy ngắm rừng và ứng xử với thiên nhiên.

**Why this priority**: Tương tác chủ động, giao sau khi hành vi thụ động đã được kiểm (FR-MAS-008; BR-MAS-13). Lời nhắc thiên nhiên còn chờ Ban Quản lý duyệt câu chữ.

**Independent Test**: Chạm Mila ở danh mục: MSG-MAS-009, chạm lần nữa: 012; ở SCR-M02-001 chưa quét: 032, giữa chặng: 033 (v1.7: "Chạm điểm đã quét để đọc lại…"), scanner mở: 043; ở màn nội dung: 059; ở màn kết quả: 065. Chạm 5 lần trong 3 giây: 085 một lần. Quét một điểm mới rồi quay về hành trình: MSG-MAS-056 (v1.7: "Điểm tiếp theo: {next}…"); lần sau: một câu trong MSG-MAS-057a–e.

**Acceptance Scenarios**:

1. **Given** Mila ở slot DOCK hoặc AVATAR, **When** du khách chạm Mila, **Then** Mila phản ứng (nhún) và nói câu hợp tình huống: 009/012, 032/033/043, 059, 065 (BR-MAS-12, v1.1); câu chạm là P3, không cooldown, không tính vào BR-MAS-07; không có menu hay hội thoại.
6. **Given** du khách chạm nhiều lần, **Then** chạm trong 400 ms tính một lần, animation đang chạy không chạy lại, không bao giờ hai bong bóng; chạm 5 lần trong 3 giây → chóng mặt (MSG-MAS-085, ảnh bối rối) một lần mỗi lần tải trang (BR-MAS-22).
2. **Given** du khách quay về SCR-M02-001 từ nội dung của một lượt ghé mới (không phải điểm cuối), **Then** Mila luân phiên MSG-MAS-056 và một câu MSG-MAS-057a–e, theo cooldown và giới hạn câu chủ động (BR-MAS-13, 06, 07).
3. **Given** câu nhắc thiên nhiên chưa được Ban Quản lý duyệt, **Then** chỉ có MSG-MAS-056 (BR-MAS-13).
4. **Given** du khách mở lại app sau ít nhất `MASCOT_WELCOME_BACK_MIN` khi phiên còn chạy, **Then** MSG-MAS-034 (không khi đang có thông báo tự kết thúc chuyến).
5. **Given** chuyến mới bắt đầu, **Then** MSG-MAS-030; câu gợi ý bắt đầu phiên cố định của spec-M02 §5.1 giữ nguyên.

---

### User Story 9 - Mila sống động và tạm dừng được — US-MAS-09 (Priority: P2, v1.1)

Giữa các sự kiện, ở màn Mila đứng chờ, Mila tự làm cử chỉ ngắn; màn Tài nguyên (SCR-M01-004) có công tắc "Chuyển động của Mila" để tạm dừng mọi chuyển động trên mọi màn (v1.3; thanh đầu trang không còn nút). Bong bóng kiểu "Giấy dã ngoại", chữ hiện dần, Mila lớn hơn; chớp mắt khi có ảnh mắt nhắm.

**Why this priority**: Nhận xét sau khi thử trên điện thoại 2026-11-22 (Mila nhỏ, bong bóng giống hộp hệ thống, trông như ảnh tĩnh). Công tắc là điều kiện để chuyển động kéo dài đạt WCAG 2.2.2.

**Independent Test**: Ở danh mục, không thao tác: trong 16 giây Mila làm ít nhất một cử chỉ. Tắt công tắc: không animation nào của Mila chạy, Mila vẫn hiện, chữ hiện ngay. Thiết bị giảm chuyển động: công tắc khởi đầu ở "tắt".

**Acceptance Scenarios**:

1. **Given** Mila ở DOCK trên SCR-M01-001, SCR-M02-001 (scanner đóng) hoặc SCR-M02-003, không bong bóng, **Then** mỗi 4–7 giây Mila làm một cử chỉ 2–3 nhịp ≤ 3 giây, giữa hai cử chỉ thở nhẹ, không lặp cử chỉ liền nhau (BR-MAS-21; v1.5, SCR-M01-002 cũng áp dụng).
2. **Given** du khách vừa chạm, cuộn hoặc gõ phím trong 2 giây, hoặc đang ở trang đọc bài, phát media, có hộp thoại, **Then** không cử chỉ tự động và không câu do hẹn giờ (BR-MAS-20).
3. **Given** công tắc tắt, **Then** không animation, không lá rơi, chữ hiện ngay; Mila và bong bóng vẫn hiện (BR-MAS-21).
4. **Given** bong bóng mới, **Then** chữ hiện dần khoảng 30 ký tự/giây; chạm bong bóng hiện hết; trình đọc màn hình đọc câu đầy đủ một lần; thời lượng tự ẩn tính từ khi chữ hiện đủ.
5. **Given** có ảnh mắt nhắm của tư thế đang hiện, **Then** chớp mắt là một cử chỉ trong nhóm; thiếu ảnh thì không chớp, không hình giữ chỗ.
6. Mọi animation tự chạy của một phản ứng dừng trong 5 giây mỗi lượt (SC-MAS-014).

---

### Edge Cases

- **Nhiều sự kiện cùng lúc** (quét thành công + mất sóng): lượt ghé mới (P4) hiện; mất sóng (P5) bị bỏ, không nói lại trước cooldown (BR-MAS-05).
- **Cùng sự kiện đến hai lần trong 500 ms**: chỉ xử lý một lần (BR-MAS-06).
- **Đã có 3 câu chủ động (P5–P7) trong 10 phút**: các câu P5–P7 tiếp theo bị bỏ (BR-MAS-07).
- **Đổi màn khi bong bóng đang hiện**: bong bóng, hàng đợi và hẹn giờ của màn cũ bị hủy (spec-Mascot BR-MAS-05; bộ thiết kế State Machine §5.2).
- **Hai tab cùng phiên** (BR-M02-002): mỗi tab có trạng thái Mila riêng trong bộ nhớ; không đồng bộ giữa tab, vì Mila không lưu gì.
- **Phiên tự kết thúc sau 24 giờ** (BR-M02-022): khi đang có thông báo tự kết thúc, Mila chỉ còn P0–P1; không ăn mừng màn kết quả của phiên tự kết thúc.
- **Khách tự do trên `/q/…`**: Mila là minh họa cạnh gợi ý khách tự do, không bong bóng (OD-MAS-14); dùng nút Quét khi không phiên: chỉ hướng dẫn và minh họa lỗi.
- **Ảnh Mila chưa có trong cache khi offline**: Mila không hiện; màn chạy như cũ (BR-MAS-15).
- **Tên Mila và số dài nhất** (`{n}` = 99): mọi câu vẫn ≤ 90 ký tự.
- **Trang ẩn trong lúc đếm giờ scanner**: hẹn giờ dừng, khi hiện lại đếm từ 0 (BR-MAS-08).

## Requirements *(mandatory)*

### Functional Requirements

Mỗi dòng giữ nguyên ID của spec-Mascot; BR là tham chiếu nguồn, chi tiết đầy đủ nằm ở spec-Mascot §5.3.

- **FR-MAS-001**: Chỉ hiện Mila trong các slot của spec-Mascot §5.1 và chỉ ở chế độ hiển thị được phép của slot đó. (BR-MAS-11)
- **FR-MAS-002**: Chỉ phản ứng với các sự kiện logic của spec-Mascot §5.2 theo luật §5.3; không hiện gì ngẫu nhiên. (BR-MAS-05, 06, 07, 09, 10)
- **FR-MAS-003**: Lấy mọi câu trong bong bóng từ catalog spec-Mascot §5.6 theo `LanguagePreference` hiện tại (trang link QR khi chưa có lựa chọn: theo quy tắc ngôn ngữ thiết bị của BR-M02-024); đổi VI/EN thì bong bóng đang hiện đổi ngay. (BR-MAS-02, 04)
- **FR-MAS-004**: Giới thiệu Mila một lần, sau lần chọn ngôn ngữ đầu tiên ở bước chọn ngôn ngữ. (US-MAS-01)
- **FR-MAS-005**: Ăn mừng lần ghi lượt ghé, các mốc tiến trình và khi kết thúc chuyến hoàn tất theo ba cấp, với tiến độ lấy từ phiên. (BR-MAS-14, 19, 23)
- **FR-MAS-006**: Trợ giúp quét khi không hoạt động và khi lỗi giống nhau lặp lại. (BR-MAS-09, 10)
- **FR-MAS-007**: Rời màn khi có thông báo tạm đóng; im lặng khi phát media, có dialog hay trang ẩn. (BR-MAS-03, 08)
- **FR-MAS-008**: Chạm thì phản ứng và hiện câu gợi ý hợp tình huống của màn; chạm nhiều lần theo quy tắc. (BR-MAS-12, 22)
- **FR-MAS-009**: Không bao giờ đổi, làm chậm, ẩn hay thay hành vi, dữ liệu hay câu cố định nào của spec-M01 hoặc spec-M02. (BR-MAS-01, 02, 16, 18)
- **FR-MAS-011**: Cử chỉ tự động ở màn Mila đứng chờ và công tắc "Chuyển động của Mila" ở màn Tài nguyên SCR-M01-004 (v1.3) tạm dừng mọi chuyển động trên mọi màn mà không ẩn Mila. (BR-MAS-17, 21)
- **FR-MAS-012**: Hành xử theo ngữ cảnh hoạt động của du khách. (BR-MAS-20)
- **FR-MAS-010**: Chạy như nhau khi offline; không phản ứng nào cần mạng. (BR-MAS-15)

### Slot và chế độ hiển thị (spec-Mascot §5.1)

| Màn | Slot | Chế độ |
|---|---|---|
| SCR-M01-001 | Hero hai cột (v1.3); lớp phủ giới thiệu; trạng thái rỗng và lỗi | INTRO (lớp phủ), DOCK; INLINE |
| SCR-M01-002 | Đầu màn (v1.5); kết quả rỗng | DOCK; INLINE |
| SCR-M01-003 | Panel Bắt đầu (không trên khối Cảnh báo an toàn); panel gói; đầu dialog quyết định offline | AVATAR, INLINE |
| SCR-M01-004 | Panel gói; trạng thái rỗng | AVATAR, INLINE |
| SCR-M02-001 | Cạnh nút Quét QR; cạnh vùng thông báo; dải dưới khung trong scanner; đầu dialog cuối chuyến | DOCK; INLINE; AVATAR; INLINE |
| SCR-M02-002 | Cạnh toast lượt ghé | AVATAR |
| SCR-M02-003 | Cạnh huy hiệu hoàn thành | CELEBRATE, INLINE |
| SCR-M02-004 | Cạnh toast (có phiên); cạnh gợi ý khách tự do (không phiên) | AVATAR; INLINE |

### Giới hạn tạm (spec-Mascot §5.4)

`MASCOT_SCANNER_LOOK_S` 15 s, `MASCOT_SCANNER_HELP_S` 30 s, `MASCOT_SCANNER_CAMERA_OFF_S` 90 s, `MASCOT_CATALOG_HINT_S` 20 s, `MASCOT_LOOKUP_SLOW_S` 3 s, `MASCOT_WELCOME_BACK_MIN` 10 phút, `MASCOT_PROACTIVE_LIMIT` / `_WINDOW_MIN` 3 / 10 phút, `MASCOT_QUEUE_TTL_MS` 4 000 ms, `MASCOT_CELEBRATION_MS` 2 400 ms, `MASCOT_VIBRATION_MS` 30 ms; bong bóng ≤ 90 ký tự, thời gian đọc 3–7 giây. Giá trị tạm, chủ dự án kiểm ngoài thực địa (OD-MAS-12).

### Key Entities *(include if feature involves data)*

Không có entity mới (spec-Mascot §6). Chỉ có:

- **Sự kiện logic của Mila**: thông báo trong bộ nhớ trình duyệt rằng một việc ở spec-Mascot §5.2 vừa xảy ra; không lưu, không gửi đi, không phải contract liên module.
- **Trạng thái Mila** (chế độ, tư thế, bong bóng đang hiện, hàng đợi một mục, cooldown, hẹn giờ): UI state tạm thời của trang đang mở; mất khi tải lại trang.
- Không có tùy chọn người dùng nào được lưu (chế độ yên lặng đã bỏ, OD-MAS-03).

### Messages (spec-Mascot §5.6)

41 câu MSG-MAS-001…075 (VI/EN) và 3 nhãn truy cập ("Hỏi Mila" / "Ask Mila", "Đóng lời nhắn" / "Dismiss message", "Chưa" / "Not now") giữ nguyên văn từ spec-Mascot §5.6 và bảng copy của screen spec SCR-M01-001…004, SCR-M02-001…004. File này không chép lại để tránh lệch; nguồn chữ là spec canonical.

## Success Criteria *(mandatory)*

### Measurable Outcomes

Giữ nguyên SC-MAS-001…010 của spec canonical (spec-Mascot §7):

- **SC-MAS-001**: Khi bật Mila, 100% test tự động hiện có của M01 và M02 vẫn đạt mà không sửa; dữ liệu lưu và `SessionSyncRecord` của một chuyến giống hệt khi không có Mila.
- **SC-MAS-002**: Ở mọi màn và mọi chiều rộng 320–430 px, Mila và bong bóng không giao với khung quét, nút hành động, vùng thông báo, toast, dialog hay bài đọc.
- **SC-MAS-003**: 0 lần Mila hiện trên màn khi có kết quả `TEMPORARILY_CLOSED`.
- **SC-MAS-004**: 0 bong bóng xuất hiện khi audio hoặc video đang phát.
- **SC-MAS-005**: Ghi lượt ghé điểm cuối hiện dialog cuối chuyến không thêm độ trễ nào so với khi không có Mila.
- **SC-MAS-006**: 0 câu trong catalog chứa từ chỉ sự có mặt (SC-M02-013), câu bắt quét đủ, câu "đã gửi" trước `SYNCED`, hay vượt 90 ký tự ở bất kỳ ngôn ngữ nào, trừ MSG-MAS-001 của lớp phủ giới thiệu (v1.3).
- **SC-MAS-007**: Khi thiết bị offline sau khi app shell đã được lưu, 100% phản ứng của M02 hiện đủ ảnh và chữ.
- **SC-MAS-008**: Khi yêu cầu giảm chuyển động, 0 animation của Mila chạy.
- **SC-MAS-009**: Khách tự do không bao giờ thấy tiến độ hay ăn mừng.
- **SC-MAS-010**: Mở link QR công khai hiện nội dung không có lời giới thiệu và không thêm độ trễ.
- **SC-MAS-016** (v1.3): Lớp phủ giới thiệu hiện tối đa một lần, chỉ sau lần chọn ngôn ngữ đầu tiên; một lần chạm khi chữ đã hiện hết, Back hoặc Esc đóng nó và focus trở về trang.
- **SC-MAS-015** (v1.2): Mỗi lượt ghé mới (không phải điểm cuối) có đúng một xác nhận: bong bóng Mila hoặc, khi Mila không hiện được, toast; không bao giờ cả hai, không bao giờ không có gì (BR-MAS-24).
- **SC-MAS-011** (v1.1): Công tắc tắt → 0 animation của Mila chạy trên mọi màn, Mila vẫn hiện.
- **SC-MAS-012** (v1.1): 0 cử chỉ tự động trên trang đọc bài, khi phát media, khi có hộp thoại, hoặc trong 2 giây sau thao tác.
- **SC-MAS-013** (v1.1): Mọi chuỗi chạm không bao giờ hiện hai bong bóng, không chạy lại animation đang chạy, chóng mặt tối đa một lần mỗi lần tải trang.
- **SC-MAS-014** (v1.1): Không animation tự chạy nào quá 5 giây nếu màn đó không có công tắc.

## Assumptions

- Du khách dùng điện thoại ngoài rừng, thường đi bộ khi màn tắt; vì vậy Mila không nhắc theo giờ ngoài scanner và danh mục (spec-Mascot §9).
- Ảnh Mila do người dùng giao sau, mỗi tư thế một ảnh nền trong suốt (OD-MAS-06); trước đó, phát triển dùng ảnh tạm không phát hành. Không đưa ảnh vào repo trước khi người dùng xác nhận quyền sử dụng (OD-MAS-07).
- Công tắc phát hành của Mila là cấu hình môi trường (docs/architecture/environment.md), không phải hành vi du khách (OD-MAS-15). Bật ở Production sau khi pilot đạt và có ảnh production.
- Câu nhắc thiên nhiên chỉ hiện sau khi Ban Quản lý duyệt câu chữ (OD-MAS-05).
- Giới hạn thời gian là giá trị tạm, kiểm ngoài thực địa (OD-MAS-12).
- Không có nút ẩn Mila; sự tiết chế dựa vào luật ưu tiên, cooldown và giới hạn câu chủ động; kiểm thực địa có thể siết giới hạn (spec-Mascot §9).

### Open clarifications

Không có câu hỏi nghiệp vụ chặn: OD-MAS-01…16 đã chốt (spec-Mascot §10). Còn chờ nhưng không chặn plan: Ban Quản lý duyệt MSG-MAS-057a–e; người dùng giao ảnh production và xác nhận quyền; người dùng duyệt câu chữ catalog (mục còn mở trong completion checklist của spec-Mascot).

## Traceability (ID → section nguồn)

| User story (package) | Canonical | FR | BR | SC |
|---|---|---|---|---|
| US1 Làm quen với Mila | US-MAS-01 | FR-MAS-003, 004 | BR-MAS-02, 06 | SC-MAS-010 |
| US2 Ăn mừng tiến độ có thật | US-MAS-02 | FR-MAS-005, 009 | BR-MAS-01, 04, 05, 14, 19 | SC-MAS-001, 005, 009 |
| US3 Mila tránh đường | US-MAS-05 | FR-MAS-001, 007 | BR-MAS-03, 08, 11, 15, 16, 17 | SC-MAS-002, 003, 004, 008 |
| US4 Kết thúc chuyến cùng Mila | US-MAS-08 | FR-MAS-005 | BR-MAS-04, 05 | SC-MAS-005 |
| US5 Giúp khi quét khó | US-MAS-03 | FR-MAS-006 | BR-MAS-07, 09, 10 | SC-MAS-002 |
| US6 Bình tĩnh về mạng và dữ liệu | US-MAS-04 | FR-MAS-010 | BR-MAS-04, 15 | SC-MAS-006, 007 |
| US7 Chuẩn bị cùng Mila | US-MAS-07 | FR-MAS-002 | BR-MAS-04, 09, 10 | SC-MAS-006 |
| US8 Hỏi Mila, nhắc thiên nhiên | US-MAS-06 (+ BR-MAS-13) | FR-MAS-008 | BR-MAS-06, 07, 12, 13, 22 | SC-MAS-013 |
| US9 Sống động, tạm dừng được (v1.1) | US-MAS-09 | FR-MAS-011, 012 | BR-MAS-17, 20, 21 | SC-MAS-011, 012, 014 |
| Ba cấp ăn mừng (v1.1, mở rộng US2, US4) | US-MAS-02, 08 | FR-MAS-005 | BR-MAS-23 | — |
| Xuyên suốt | — | FR-MAS-001, 002, 003, 009 | BR-MAS-01, 16, 18 | SC-MAS-001 |
