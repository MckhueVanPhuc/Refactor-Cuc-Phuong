# Mascot Dialogue Library — Thư viện lời thoại VI/EN

| Trường | Giá trị |
|---|---|
| Trạng thái | **PROPOSED** — mọi câu cần người dùng duyệt trước khi đưa vào bảng copy của screen spec |
| Ngày | 2026-11-20; cập nhật 2026-11-22 (v1.1) và 2026-11-23 theo spec-Mascot v1.2 (CHG-MASCOT-2026-11-23-03) và 2026-11-23 theo spec-Mascot v1.3 (CHG-MASCOT-2026-11-23-04); 2026-11-25 theo spec-Mascot v1.6 (CHG-MASCOT-2026-11-25-06): MAS-MSG-015…019 mới (chủ dự án duyệt nguyên văn VI 2026-11-25; EN theo nhãn nút thật), MAS-MSG-014 mỗi lần vào màn; 2026-11-27 theo spec-Mascot v1.7 (CHG-MASCOT-2026-11-27-07): MAS-MSG-030, 056 nói điểm tiếp theo `{next}`, MAS-MSG-033 bỏ số điểm còn lại |
| Quy ước | Tài liệu này là **nguồn chữ** của mascot. [Behavior Matrix](MASCOT_BEHAVIOR_MATRIX.md) chép lại câu để dễ đọc; khi lệch nhau, tài liệu này thắng |

## 1. Quy tắc viết

1. Xưng "mình" – "bạn"; tiếng Anh "I" – "you" ([Brief](MASCOT_PRODUCT_BRIEF.md) §4).
2. Mỗi bong bóng ≤ 90 ký tự (sau khi thay biến), tối đa 2 câu, tối đa một dấu "!", không emoji.
3. **Từ cấm** khi nói về lượt ghé (SC-M02-013): VI "đến", "tới nơi", "có mặt"; EN "arrive", "you're at", "you made it to". Từ cấm khi nói về số điểm: "phải", "bắt buộc", "must". Test sẽ quét toàn bộ thư viện.
4. Tiếng Anh dùng đúng thuật ngữ đang có trong app: "route" (không phải "trail") cho tuyến, "stop" cho điểm dừng, "Scan QR", "End trip". "Trail" chỉ dùng ở lời mang tính hình ảnh.
5. Không lặp lại nguyên văn câu cố định đã hiện trên màn (spec-M02 §5.1, bảng copy screen spec). Khi màn đã có câu đủ rõ, mascot chỉ là **minh họa** (`—` trong cột chữ).
6. Nhãn nút (CTA) dùng lại khóa i18n đang có của M01/M02 nếu có; nhãn mới ghi rõ "mới".
7. Biến: `{name}` tên mascot, giá trị `Mila` (chốt 2026-11-21, giống nhau ở hai ngôn ngữ); `{k}` số điểm đã quét; `{n}` tổng số điểm; `{count}` số tuyến. Câu có số dùng dạng số ít/nhiều cho tiếng Anh.

## 2. Thời lượng và lặp lại

- **Thời lượng tự ẩn** của bong bóng không có nút: **15 000 ms** sau khi chữ hiện đủ, ở mọi màn (`MASCOT_BUBBLE_READ_MS`, spec-Mascot v1.5; trước đây `clamp(3 000 ms, 1 200 ms + 45 ms × số ký tự, 7 000 ms)`). Nút × đóng sớm; đổi màn thì đóng. Thời gian dừng lại khi du khách chạm hoặc focus vào bong bóng.
- **Bong bóng có CTA** không tự ẩn (design-system §5.3: thông báo có hành động không tự đóng); đóng khi bấm CTA, bấm "×", hoặc khi đổi màn.
- **Cooldown** tính trong một lần tải trang (bộ nhớ trong RAM, không lưu). "1 lần/tải trang" nghĩa là chỉ hiện lại sau khi tải lại trang.
- **Pool**: câu có nhiều biến thể thì xoay vòng, không lặp biến thể vừa dùng.
- **Chữ hiện dần** (v1.1): chữ xuất hiện khoảng 30 ký tự/giây (`MASCOT_TYPE_CPS`); chạm bong bóng hiện hết ngay; công tắc chuyển động tắt hoặc giảm chuyển động thì hiện ngay. Thời lượng tự ẩn tính từ lúc **chữ hiện đủ**. Trình đọc màn hình nhận câu đầy đủ một lần, không đọc từng ký tự.
- **Câu hướng dẫn khi chạm** (P3, v1.1): không cooldown khi du khách chủ động chạm, không tính vào giới hạn câu chủ động.

Cột **P** là mức ưu tiên ([State Machine](MASCOT_STATE_MACHINE.md) §5): P0 an toàn, P1 lỗi chặn, P2 phản hồi hệ thống, P3 du khách yêu cầu, P4 thành công, P5 tiến độ, P6 hướng dẫn, P7 nền.

## 3. Thư viện

### 3.1 M01 — Chuẩn bị

| Message ID | Trigger | Ngữ cảnh | Tiếng Việt | English | Giọng | Thời lượng | CTA | P | Lặp | Cooldown |
|---|---|---|---|---|---|---|---|---|---|---|
| MAS-MSG-001 | `m01.language.selected` (đầu tiên) | Vừa chọn ngôn ngữ, vào danh mục | Chào bạn! Mình là {name}, rái cá thám hiểm của Cúc Phương. Mình sẽ đồng hành cùng bạn trong suốt chuyến tham quan này. Cùng chọn một tuyến nhé! | Hi! I'm {name}, Cúc Phương's otter explorer. I'll be with you throughout this visit. Let's pick a route! | Vui, ấm áp | Chờ chạm (lớp phủ, v1.3); dài hơn 90 ký tự theo quyết định 2026-11-23 | — | P6 | Không | 1 lần/tải trang |
| MAS-MSG-002 | — | **Bỏ ở v1.3** (gộp vào MAS-MSG-001) | — | — | — | — | — | — | — | — |
| MAS-MSG-004 | `m01.catalog.opened` | Đã có ngôn ngữ từ trước khi tải trang (du khách quay lại) | Chào mừng bạn quay lại! Hôm nay mình đi tuyến nào đây? | Welcome back! Which route are we taking today? | Thân thiện | Tự ẩn | — | P6 | Không | 1 lần/tải trang |
| MAS-MSG-005 | Danh mục đang tải > 600 ms | Mạng chậm | Mình đang mở bản đồ các tuyến… | Unfolding the route map… | Bình thản | Tới khi tải xong | — | P7 | Có | — |
| MAS-MSG-008 | 20 s không thao tác ở danh mục | Lần đầu trong lần tải trang, chưa cuộn, chưa chạm thẻ | Chưa biết chọn tuyến nào? Để mình gợi ý cho. | Not sure which route? Let me suggest one. | Gợi mở | Không tự ẩn | "Gợi ý tuyến" (`m01.nav.recommend`) | P6 | Không | 1 lần/tải trang |
| MAS-MSG-009 | Chạm mascot ở danh mục | Du khách hỏi | Chạm vào một tuyến để xem chi tiết, hoặc thử Gợi ý tuyến. | Tap a route for details, or try Route suggestions. | Hữu ích | Tự ẩn | — | P3 | Có | 10 s |
| MAS-MSG-010 | `m01.recommend.opened` | Mỗi lần mở form Gợi ý tuyến (v1.5), trừ khi quay lại từ trang kết quả (v1.11); câu chạm đầu tiên ở form (v1.6) | Bạn có bao lâu, đi cùng ai, thích gì? Để mình gợi ý cho nhé! | How long do you have, who's coming, what do you enjoy? Let me suggest some routes! | Tò mò | Tự ẩn | — | P6 | Không | 1 lần/tải trang |
| MAS-MSG-011 | `m01.recommend.resolved{count≥1}` | Có kết quả | Đây là những tuyến hợp với bạn! | Here are the routes that suit you! | Vui | Tự ẩn | — | P4 | Có | 30 s |
| MAS-MSG-013 | `m01.recommend.resolved{count=0}` lần 2 liên tiếp | Đã đổi tiêu chí mà vẫn rỗng | — (chỉ minh họa từ v1.2) | — (illustration only since v1.2) | Động viên | Không tự ẩn | — | P6 | Có | 60 s |
| MAS-MSG-014 | `m01.routeDetail.startPanelVisible` | Tuyến có cảnh báo an toàn; panel Bắt đầu vào khung nhìn, mỗi lần vào màn chi tiết (v1.6) | Trước khi đi, bạn đọc kỹ phần Cảnh báo an toàn ngay bên dưới giúp mình nhé. | Before you head out, please read the Safety warning just below. | Quan tâm, nghiêm túc vừa phải | Tự ẩn | — | P6 | Có | 1 lần/tuyến/tải trang |
| MAS-MSG-015 | Chạm mascot ở form Gợi ý tuyến (lần thứ hai) | Du khách hỏi (v1.6) | Chọn xong các mục rồi bấm "Xem tuyến phù hợp" nhé! | Done choosing? Tap "Show matching routes"! | Hữu ích | Tự ẩn | — | P3 | Có | 10 s |
| MAS-MSG-016 | Chạm mascot ở trang kết quả gợi ý | Du khách hỏi (v1.6) | Chạm vào một tuyến để xem chi tiết, hoặc bấm Đổi tiêu chí. | Tap a route for details, or tap Change choices. | Hữu ích | Tự ẩn | — | P3 | Có | 10 s |
| MAS-MSG-017 | Chạm mascot ở chi tiết tuyến có Cảnh báo an toàn | Du khách hỏi (v1.6); câu ở panel Bắt đầu | Đọc kỹ Cảnh báo an toàn, tải gói nếu cần, rồi bấm Bắt đầu nhé. | Read the Safety warning, download the pack if you need it, then tap Start. | Hữu ích | Tự ẩn | — | P3 | Có | 10 s |
| MAS-MSG-018 | Chạm mascot ở Tài nguyên | Du khách hỏi (v1.6); câu ở ô gói | Tải gói trước khi vào rừng để xem tuyến khi mất sóng. | Download the pack before you go, so the route works without signal. | Hữu ích | Tự ẩn | — | P3 | Có | 10 s |
| MAS-MSG-019 | Chạm mascot ở chi tiết tuyến không có Cảnh báo an toàn | Du khách hỏi (v1.6); câu ở panel Bắt đầu | Tải gói nếu cần, rồi bấm Bắt đầu nhé. | Download the pack if you need it, then tap Start. | Hữu ích | Tự ẩn | — | P3 | Có | 10 s |
| MAS-MSG-020 | `m01.package.downloadStarted` | Bắt đầu tải hoặc cập nhật | Mình đang xếp nội dung vào ba lô. Giữ trang này mở nhé. | Packing your route into the backpack. Keep this page open. | Bận rộn, vui | Tới khi xong hoặc lỗi | — | P5 | Có | — |
| MAS-MSG-021 | `m01.package.ready` | Gói `SAN_SANG` | Giờ các điểm này xem được cả khi mất sóng. | These stops now work without signal. | Tự hào | Tự ẩn | — | P4 | Có | — |
| MAS-MSG-024 | `m01.package.failed{reason=source\|download}` | Lần lỗi đầu | — (chỉ minh họa từ v1.2) | — (illustration only since v1.2) | Bình tĩnh | Tự ẩn | — | P2 | Có | 30 s |
| MAS-MSG-025 | `m01.package.failed{reason=storage}` | Không ghi được bộ nhớ | — (chỉ minh họa từ v1.2) | — (illustration only since v1.2) | Bình tĩnh | Không tự ẩn | — (đóng ×) | P2 | Có | 30 s |
| MAS-MSG-026 | Lỗi tải lần 2 liên tiếp cùng tuyến | Đang online | Vẫn chưa được. Có mạng thì bạn vẫn đi được, chỉ vài điểm cần sóng để xem. | Still no luck. You can go without it, but some stops will need signal. | Trấn an | Không tự ẩn | — (đóng ×) | P2 | Có | 5 phút |

### 3.2 M02 — Thực địa

| Message ID | Trigger | Ngữ cảnh | Tiếng Việt | English | Giọng | Thời lượng | CTA | P | Lặp | Cooldown |
|---|---|---|---|---|---|---|---|---|---|---|
| MAS-MSG-030 | `m02.trip.entered{kind=STARTED}` | Phiên mới; có điểm tiếp theo (v1.7) | Điểm tiếp theo: {next}. Tìm tem QR ở đó rồi bấm Quét QR nhé! | Next stop: {next}. Find its QR sign there and tap Scan QR! | Hào hứng | Tự ẩn | — | P6 | Không | 1 lần/phiên/tải trang |
| MAS-MSG-032 | Chạm mascot ở SCR-M02-001 | Du khách hỏi | Thấy tem thì bấm Quét QR. Chạm điểm đã quét để đọc lại nhé. | Spot a sign? Tap Scan QR. Tap a scanned stop to read it again. | Hữu ích | Tự ẩn | — | P3 | Có | 10 s |
| MAS-MSG-034 | `app.visibility.visible` sau > 10 phút ẩn, có phiên | Mở lại app giữa chuyến | Chào mừng quay lại! Hành trình của bạn vẫn còn nguyên. | Welcome back! Your trip is just as you left it. | Ấm áp | Tự ẩn | — | P6 | Có | 30 phút |
| MAS-MSG-040 | `m02.scanner.opened` | Phiên chưa có lượt ghé nào, hoặc khách tự do; lần mở đầu trong lần tải trang | — (chỉ minh họa từ v1.2) | — (illustration only since v1.2) | Hướng dẫn | Tự ẩn | — | P6 | Không | 1 lần/tải trang |
| MAS-MSG-042 | 30 s scanner mở không đọc được mã | Camera đang chạy | Chưa quét được? Thử lại gần hơn và tránh chỗ chói nắng. | No luck yet? Move a little closer and avoid the glare. | Giúp đỡ | Tự ẩn | — | P6 | Không | 1 lần/lần mở scanner |
| MAS-MSG-044 | Đang kiểm tra mã > 3 s | Mạng chậm, trước hạn 8 s | Sóng hơi yếu, mình vẫn đang kiểm tra… | Weak signal, still checking… | Kiên nhẫn | Tới khi có kết quả | — | P5 | Có | — |
| MAS-MSG-046 | `m02.scan.resolved{display=INVALID}` lần 2 liên tiếp | Có thể quét nhầm mã không phải tem của Vườn | Hãy quét tem QR của Vườn ở điểm dừng. Tem cũ thì thử tem khác nếu có. | Scan a park QR sign at the stop. If it looks old, try another one. | Không trách | Không tự ẩn | — (đóng ×) | P2 | Có | 2 phút |
| MAS-MSG-048 | `m02.scan.resolved{display=CONNECTION_NEEDED}` lần 2 liên tiếp | Offline hoặc lỗi tra cứu | Mã này cần có sóng để kiểm tra. Điểm trong tuyến vẫn quét được khi mất sóng. | This code needs signal to check. Stops on your route still scan offline. | Giải thích | Không tự ẩn | — (đóng ×) | P2 | Có | 2 phút |
| MAS-MSG-049 | 90 s scanner mở không đọc được mã | Tiết kiệm pin | Mình tắt camera cho đỡ tốn pin nhé? | Shall I turn the camera off to save battery? | Quan tâm | Không tự ẩn | "Đóng camera" (`m02.scanner.close`); "Chưa" / "Not now" (**mới**) | P6 | Không | 1 lần/lần mở scanner |
| MAS-MSG-050 | `m02.visit.recorded` (không phải điểm đầu, không phải điểm cuối) | Lượt ghé mới | {cheer} Đã ghi nhận lượt quét: {k}/{n} điểm. | {cheer} Scan recorded: {k} of {n} stops. | Vui | Tự ẩn | — | P4 | Có | — |
| MAS-MSG-050-POOL | Biến `{cheer}` | — | Tuyệt! · Hay quá! · Thêm một điểm nữa! | Nice! · Great! · One more on the trail! | — | — | — | — | — | Không lặp biến thể liền kề |
| MAS-MSG-051 | `m02.visit.recorded` với k = 1 | Mã đầu tiên của phiên | Đã ghi nhận mã QR đầu tiên! Đọc thử câu chuyện của điểm này nhé. | First scan recorded! Take a moment to read this stop's story. | Hào hứng | Tự ẩn | — | P4 | Không | 1 lần/phiên |
| MAS-MSG-052 | `m02.scan.resolved{display=LIVE}`, có phiên, không ghi lượt ghé | Mã ngoài hành trình | Điểm này không thuộc tuyến của bạn nên không tính vào hành trình. Cứ xem nhé! | This spot isn't on your route, so it won't count. Enjoy reading anyway! | Thân thiện, rõ ràng | Tự ẩn | — | P2 | Có | 1 phút |
| MAS-MSG-054 | `m02.scan.resolved{display=PACKAGE}` | Mất sóng, dùng gói | — (chỉ minh họa từ v1.2) | — (illustration only since v1.2) | Trấn an | Tự ẩn | — | P5 | Có | 5 phút |
| MAS-MSG-055 | `m02.visit.recorded` với k = ⌈n/2⌉, n ≥ 4 | Nửa số điểm | Đã ghi nhận! Bạn đã quét được nửa số điểm rồi đó! | Recorded! You've scanned half of your stops! | Khích lệ | Tự ẩn | — | P5 | Không | 1 lần/phiên |
| MAS-MSG-056 | `m02.trip.shown` ngay sau khi xem nội dung của lượt ghé mới | Quay về hành trình; có điểm tiếp theo (v1.7) | Điểm tiếp theo: {next}. Tham quan xong thì đi tiếp và quét mã nhé! | Next stop: {next}. Take your time here, then scan there. | Nhẹ nhàng | Tự ẩn | — | P6 | Có | 10 phút |
| MAS-MSG-057 | Như MAS-MSG-056, lần thứ 2 trở đi (xen kẽ) | Lời nhắc ứng xử với thiên nhiên (cần Ban Quản lý duyệt, MAS-D-05) | Pool, xem §3.4 | Pool, xem §3.4 | Tôn trọng | Tự ẩn | — | P6 | Có | 10 phút |
| MAS-MSG-059 | Chạm mascot ở SCR-M02-002/004 | Du khách hỏi | Vuốt ảnh để xem thêm, kéo xuống để đọc phần giới thiệu. | Swipe the photos, then scroll down to read more. | Hữu ích | Tự ẩn | — | P3 | Có | 10 s |
| MAS-MSG-061 | `m02.finalPrompt.continued` | Chọn "Đi tiếp" | Được thôi! Khi sẵn sàng, nút Kết thúc chuyến vẫn ở đây. | Sure! The End trip button is here whenever you're ready. | Thoải mái | Tự ẩn | — | P5 | Có | 2 phút |
| MAS-MSG-062 | **Nghỉ từ spec-Mascot v1.10** (ăn mừng nói MAS-MSG-065); trước: `m02.trip.ended{status=HOAN_TAT}` | Vừa kết thúc bằng xác nhận | Hôm nay mình đã cùng bạn quét {k} điểm. Vui ghê! | We scanned {k} stops together today. What a trip! (k = 1: "We scanned 1 stop together today. What a trip!") | Hạnh phúc | Tự ẩn | — | P4 | Không | 1 lần/phiên |
| MAS-MSG-070 | `m02.sync.statusChanged{PENDING}` khi offline, ở màn kết quả | Chưa gửi được | Chuyến đi đã lưu trên máy. Lần tới có sóng và mở app, mình sẽ gửi đi. | Your trip is saved on this phone. I'll send it next time you're online. | Trấn an | Tự ẩn | — | P5 | Không | 1 lần/phiên |
| MAS-MSG-074 | `app.network.offline`, có phiên | Mất sóng giữa chuyến | Mất sóng rồi. Đừng lo, các điểm trong tuyến vẫn quét được. | Signal's gone, but stops on your route can still be scanned. | Bình tĩnh | Tự ẩn | — | P5 | Có | 10 phút |
| MAS-MSG-075 | `app.network.online` sau MAS-MSG-074 | Có sóng lại | Có sóng lại rồi! | Signal's back! | Vui nhẹ | Tự ẩn | — | P7 | Có | 10 phút |

### 3.3 Trạng thái chỉ minh họa (không có chữ của mascot)

Màn đã có câu cố định đủ rõ, nên mascot chỉ đứng cạnh câu đó, không có bong bóng.

| Behavior | Câu đang hiển thị (giữ nguyên) | Tư thế |
|---|---|---|
| MAS-B-006 | "Hiện chưa có tuyến nào để chọn." | Ngồi nghỉ |
| MAS-B-007, MAS-B-015 | "Chưa tải được danh sách tuyến…", "Chưa bắt đầu được…", "Tuyến này hiện không nhận chuyến mới." | Bối rối |
| MAS-B-012 | "Chưa có tuyến phù hợp…" | Suy nghĩ |
| MAS-B-016 | Dialog "Tuyến này nên tải trước" | Ba lô |
| MAS-B-023 | "Bạn chưa tải tuyến nào." | Ngồi nghỉ |
| MAS-B-031 | Câu từ chối handoff, "Chưa có chuyến đi để bắt đầu…" | Bối rối |
| MAS-B-038 | Câu camera cố định | Bối rối |
| MAS-B-046 (lần 1), MAS-B-047 | "Mã không còn hiệu lực…", "Cần có kết nối mạng…" | Bối rối |
| MAS-B-060 | "Bạn đã quét điểm cuối. Kết thúc chuyến đi?" | Ăn mừng |
| MAS-B-071 | "Đã gửi về hệ thống" | Giơ ngón cái (một lần) |
| MAS-B-072 | Câu `CONFLICT` | Xin lỗi (buồn nhẹ) |

### 3.4 Pool lời nhắc ứng xử với thiên nhiên (MAS-MSG-057, cần Ban Quản lý duyệt)

| ID | Tiếng Việt | English |
|---|---|---|
| MAS-MSG-057a | Đi nhẹ, nói khẽ để nghe được tiếng rừng nhé. | Walk softly and talk quietly, the forest is listening. |
| MAS-MSG-057b | Ngắm thôi, đừng hái hay mang gì ra khỏi rừng nhé. | Look, don't pick. Leave everything as you found it. |
| MAS-MSG-057c | Giữ rác trong ba lô cho tới khi gặp thùng rác nhé. | Keep your litter in your bag until you find a bin. |
| MAS-MSG-057d | Đi đúng đường mòn để an toàn cho bạn và cho rừng. | Stay on the trail, it's safer for you and the forest. |
| MAS-MSG-057e | Đừng cho thú ăn nhé, đồ ăn của người không tốt cho chúng. | Please don't feed the animals, our food isn't good for them. |

### 3.4a Bổ sung v1.1 (spec-Mascot BR-MAS-12, 22, 23)

| Message ID | Trigger | Ngữ cảnh | Tiếng Việt | English | Giọng | Thời lượng | CTA | P | Lặp | Cooldown |
|---|---|---|---|---|---|---|---|---|---|---|
| MAS-MSG-012 | Chạm mascot ở màn M01, lần chạm sau khi MAS-MSG-009 còn hiện | Du khách hỏi tiếp | Bấm Gợi ý tuyến, mình chọn giúp theo thời gian và sở thích của bạn. | Tap Route suggestions and I'll pick by your time and interests. | Hữu ích | Tự ẩn | — | P3 | Có | — |
| MAS-MSG-033 | Chạm mascot ở SCR-M02-001, scanner đóng, có lượt ghé, còn r = n − k ≥ 1 | Giữa chặng (v1.7: số điểm còn lại đã hiện trên thẻ tuyến) | Chạm điểm đã quét để đọc lại, hoặc quét tem QR ở điểm tiếp theo nhé. | Tap a scanned stop to read it again, or scan the sign at the next stop. | Cổ vũ nhẹ | Tự ẩn | — | P3 | Có | — |
| MAS-MSG-043 | Chạm mascot khi scanner mở | Đang quét | Lại gần tem hơn và tránh chỗ chói nắng nhé. | Move closer to the sign and avoid the glare. | Hướng dẫn | Tự ẩn | — | P3 | Có | — |
| MAS-MSG-058 | `m02.visit.recorded`, k = n − 1, n ≥ 3, không phải mốc đầu tiên hay nửa | Mốc cấp 2 | Đã ghi nhận! Chỉ còn một điểm nữa thôi! | Recorded! Just one stop to go! | Hào hứng | Tự ẩn | — | P4 | Không | 1 lần/phiên/tải trang |
| MAS-MSG-063 | **Nghỉ từ spec-Mascot v1.10** (ăn mừng nói MAS-MSG-065); trước: `m02.trip.ended{HOAN_TAT}`, vừa kết thúc, k = n | Cấp 3, quét đủ | Bạn đã quét đủ {n} điểm của tuyến. Tuyệt vời! | You scanned all {n} stops of the route. Amazing! | Tự hào | Tự ẩn | — | P4 | Không | 1 lần/phiên |
| MAS-MSG-065 | Chạm mascot ở SCR-M02-003 | Màn kết quả | Cảm ơn bạn đã đi cùng mình hôm nay! | Thanks for exploring with me today! | Ấm áp | Tự ẩn | — | P3 | Có | — |
| MAS-MSG-085 | Chạm 5 lần trong 3 s | Đùa nhẹ | Ui, chóng mặt quá! | Whoa, I'm dizzy! | Tinh nghịch | Tự ẩn | — | P3 | Không | 1 lần/tải trang |

Kết thúc sớm (k < n) giữ MAS-MSG-062 — tích cực như khi quét đủ, không có giọng tiếc nuối (BR-MAS-23). Từ v1.10 (2026-11-28) cả hai trường hợp nói MAS-MSG-065 "Cảm ơn bạn đã đi cùng mình hôm nay!"; thẻ tóm tắt của màn đã hiện k/n.

### 3.4b Ghi chú v1.2 (spec-Mascot BR-MAS-24)

MAS-MSG-050, 051, 055, 058 là **xác nhận lượt ghé**: chữ nói rõ lượt quét đã được ghi, bong bóng có `role="status"`, và thay toast "Đã ghi nhận lượt quét." (toast chỉ còn là dự phòng khi Mila không hiện được). MAS-MSG-013, 024, 025, 040, 054 chỉ còn là minh họa (câu cố định của màn đã nói đủ).

### 3.5 Nhãn điều khiển của mascot (mới)

| Khóa | Tiếng Việt | English | Ghi chú |
|---|---|---|---|
| `mascot.dismiss` | Đóng lời nhắn | Dismiss message | Nút × trên bong bóng |
| `mascot.notNow` | Chưa | Not now | CTA phụ của MAS-MSG-049 |
| `mascot.help` | Hỏi {name} | Ask {name} | Tên truy cập khi chạm mascot để nhận gợi ý |
| `mascot.motion` | Hiệu ứng chuyển động | Motion effects | Nhãn công tắc ở màn Tài nguyên (v1.3, BR-MAS-21; v1.4 đổi từ "Chuyển động của {name}"); trạng thái bằng `aria-checked`; hiện cả khi Mila tắt |
| `mascot.motionHint` | Tắt để {name} và hiệu ứng trang trí đứng yên. | Turn off to keep {name} and decorations still. | Câu phụ dưới nhãn công tắc (v1.3; v1.4) |
| `mascot.introHint` | Chạm để bắt đầu | Tap to start | Dòng gợi ý dưới Mila trong lớp phủ giới thiệu (v1.3) |

### 3.6 FUTURE (chưa viết, bị chặn bởi MVP-Scope §4)

| ID | Trigger | Ghi chú |
|---|---|---|
| MAS-MSG-090 | `m02.challenge.started` / `completed` | [NEEDS CLARIFICATION: câu đố là nội dung do M03 soạn; chưa có contract] |
| MAS-MSG-091 | `m02.badge.unlocked` | [NEEDS CLARIFICATION: danh mục huy hiệu và điều kiện chưa được định nghĩa trong spec] |

## 4. Cấu trúc nội dung đề xuất trong code

Theo đúng mẫu i18n hiện có (`src/modules/m0x/i18n/vi.ts`, `en.ts`, kiểu `typeof vi`; không thêm thư viện i18n):

```text
src/shared/mascot/dialogue/
├── catalog.ts   # metadata không phụ thuộc ngôn ngữ: id, priority, cooldownMs, repeatable, autoHide, cta
├── vi.ts        # export const vi = { 'MAS-MSG-001': ({ name }) => `Chào bạn! Mình là ${name}, …`, … }
└── en.ts        # export const en: MascotDialogue = { … }  (thiếu khóa → lỗi typecheck)
```

- Component không bao giờ chứa câu thoại. Component nhận `messageId` và tham số; bộ điều khiển chọn ngôn ngữ theo `LanguagePreference`.
- CTA tham chiếu khóa i18n của module (ví dụ `m02.scanner.close`) để nhãn luôn khớp nút thật.
- Khi được duyệt, mọi câu ở §3 được chép vào bảng copy của screen spec tương ứng (nguồn copy canonical), sau đó mới vào `vi.ts`/`en.ts`, giống quy trình D-1 của M02.
